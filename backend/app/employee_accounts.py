"""Server-backed employee invitations and authentication (separate from demo API routes)."""

import hashlib
import hmac
import os
import secrets
import smtplib
import sqlite3
import string
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1")
COOKIE_NAME = "trustrace_session"
SESSION_HOURS = 12
ADMIN_ROLES = {"Management Staff", "System Administrator", "CEO/Admin"}
DEFAULT_DB = Path(__file__).resolve().parent.parent / "employees.sqlite3"


class Credentials(BaseModel):
    email: str
    password: str


class EmployeeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=254)
    role: str = Field(min_length=1, max_length=100)
    department: str = Field(min_length=1, max_length=100)
    clearanceLevel: str


class PasswordChange(BaseModel):
    newPassword: str = Field(min_length=12, max_length=128)


@contextmanager
def _db():
    path = Path(os.environ.get("EMPLOYEE_DB_PATH", str(DEFAULT_DB)))
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    try:
        conn.row_factory = sqlite3.Row
        conn.execute("""CREATE TABLE IF NOT EXISTS employees (
            id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
            role TEXT NOT NULL, department TEXT NOT NULL, clearance TEXT NOT NULL,
            salt TEXT NOT NULL, password_hash TEXT NOT NULL, must_change_password INTEGER NOT NULL
        )""")
        conn.execute("""CREATE TABLE IF NOT EXISTS sessions (
            token_hash TEXT PRIMARY KEY, employee_id TEXT NOT NULL, expires_at TEXT NOT NULL
        )""")
        conn.commit()
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def _hash_password(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 310_000).hex()


def _email(value: str) -> str:
    value = value.strip().lower()
    # Mailboxes must be deliverable. A plain username cannot receive an invitation.
    if value.count("@") != 1 or "." not in value.split("@")[1] or any(c.isspace() for c in value):
        raise HTTPException(422, "Enter a valid employee email address.")
    return value


def _admin_config():
    from app.env_loader import load_dotenv_custom
    load_dotenv_custom()
    admin_email = os.environ.get("ADMIN_EMAIL", "").strip().lower()
    password = os.environ.get("ADMIN_PASSWORD", "")
    if not admin_email or not password:
        raise HTTPException(503, "Set ADMIN_EMAIL and ADMIN_PASSWORD on the backend first.")
    return admin_email, password


def _mail_config():
    username = os.environ.get("SMTP_USERNAME", "")
    password = os.environ.get("SMTP_PASSWORD", "")
    sender = os.environ.get("SMTP_FROM", "") or username
    missing = [name for name in ("SMTP_USERNAME", "SMTP_PASSWORD", "APP_LOGIN_URL") if not os.environ.get(name)]
    if missing:
        print(f"WARNING: Backend process is missing {', '.join(missing)}. Emails will not be sent.")
    return username, password, sender


def _public_user(row):
    if row == "admin":
        return {
            "id": "server-admin", "name": "Administrator", "email": _admin_config()[0],
            "role": "Management Staff", "department": "IT & Administration",
            "clearanceLevel": "Restricted", "activeGrants": ["*"],
            "avatar": "", "sessionIp": "", "lastActive": "Active now",
        }
    return {
        "id": row["id"], "name": row["name"], "email": row["email"],
        "role": row["role"], "department": row["department"],
        "clearanceLevel": row["clearance"], "activeGrants": [],
        "avatar": "", "sessionIp": "", "lastActive": "Provisioned",
    }


def _session_user(request: Request, conn):
    token = request.cookies.get(COOKIE_NAME, "")
    if not token:
        raise HTTPException(401, "Please sign in again.")
    digest = hashlib.sha256(token.encode()).hexdigest()
    record = conn.execute("SELECT employee_id, expires_at FROM sessions WHERE token_hash = ?", (digest,)).fetchone()
    if not record or datetime.fromisoformat(record["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(401, "Session expired. Please sign in again.")
    if record["employee_id"] == "admin":
        _admin_config()
        return "admin"
    user = conn.execute("SELECT * FROM employees WHERE id = ?", (record["employee_id"],)).fetchone()
    if not user:
        raise HTTPException(401, "Account no longer exists.")
    return user


def _require_admin(request: Request, conn):
    if _session_user(request, conn) != "admin":
        raise HTTPException(403, "Only the server administrator can provision employees.")


def _send_invitation(name: str, email: str, password: str):
    username, smtp_password, sender = _mail_config()
    if not username:
        print("="*60)
        print(f"MOCK EMAIL SENT TO: {email}")
        print(f"TEMPORARY PASSWORD: {password}")
        print("="*60)
        return

    message = EmailMessage()
    message["Subject"] = "TRUSTRACE employee account invitation"
    message["From"] = sender
    message["To"] = email
    message.set_content(
        f"Hello {name},\n\nYour TRUSTRACE account is ready.\n"
        f"Sign in: {os.environ.get('APP_LOGIN_URL', 'http://localhost:5173/login')}\nUsername: {email}\n"
        f"Temporary password: {password}\n\n"
        "Please change this temporary password immediately after signing in. "
        "Do not forward this email.\n"
    )
    host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    try:
        port = int(os.environ.get("SMTP_PORT", "587"))
        with smtplib.SMTP(host, port, timeout=10) as smtp:
            smtp.starttls()
            smtp.login(username, smtp_password)
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException, ValueError) as exc:
        print("SMTP ERROR:", repr(exc))
        # Never expose SMTP credentials, server responses, or the temporary password.
        raise HTTPException(502, f"Email could not be sent. Check backend SMTP configuration and retry. Error: {repr(exc)}") from exc


@router.post("/employee-auth/login")
def employee_login(body: Credentials, response: Response):
    email = _email(body.email)
    admin_email, admin_password = _admin_config()
    with _db() as conn:
        if email == admin_email and hmac.compare_digest(body.password, admin_password):
            user = "admin"
            employee_id = "admin"
            change_required = False
        else:
            user = conn.execute("SELECT * FROM employees WHERE email = ?", (email,)).fetchone()
            if not user or not hmac.compare_digest(_hash_password(body.password, user["salt"]), user["password_hash"]):
                raise HTTPException(401, "Invalid email or password.")
            employee_id = user["id"]
            change_required = bool(user["must_change_password"])
        token = secrets.token_urlsafe(32)
        expires = datetime.now(timezone.utc) + timedelta(hours=SESSION_HOURS)
        conn.execute("INSERT INTO sessions VALUES (?, ?, ?)", (hashlib.sha256(token.encode()).hexdigest(), employee_id, expires.isoformat()))
    response.set_cookie(
        COOKIE_NAME, token, httponly=True, secure=os.environ.get("COOKIE_SECURE") == "true",
        samesite="lax", max_age=SESSION_HOURS * 3600,
    )
    return {"user": _public_user(user), "mustChangePassword": change_required}


@router.get("/employee-auth/me")
def employee_me(request: Request):
    with _db() as conn:
        user = _session_user(request, conn)
        return {"user": _public_user(user), "mustChangePassword": user != "admin" and bool(user["must_change_password"])}


@router.post("/employee-auth/change-password")
def change_password(body: PasswordChange, request: Request):
    with _db() as conn:
        user = _session_user(request, conn)
        if user == "admin":
            raise HTTPException(403, "Change the administrator password in backend configuration.")
        if hmac.compare_digest(_hash_password(body.newPassword, user["salt"]), user["password_hash"]):
            raise HTTPException(422, "Choose a password different from the temporary password.")
        salt = secrets.token_hex(16)
        conn.execute(
            "UPDATE employees SET salt = ?, password_hash = ?, must_change_password = 0 WHERE id = ?",
            (salt, _hash_password(body.newPassword, salt), user["id"]),
        )
    return {"success": True}


@router.post("/employee-auth/logout")
def employee_logout(request: Request, response: Response):
    token = request.cookies.get(COOKIE_NAME)
    if token:
        with _db() as conn:
            conn.execute("DELETE FROM sessions WHERE token_hash = ?", (hashlib.sha256(token.encode()).hexdigest(),))
    response.delete_cookie(COOKIE_NAME, samesite="lax", secure=os.environ.get("COOKIE_SECURE") == "true")
    return {"success": True}


@router.get("/employees")
def list_employees(request: Request):
    with _db() as conn:
        _require_admin(request, conn)
        rows = conn.execute("SELECT * FROM employees ORDER BY name").fetchall()
        return {"users": [_public_user(row) for row in rows]}


@router.post("/employees", status_code=201)
def create_employee(body: EmployeeCreate, request: Request):
    email = _email(body.email)
    with _db() as conn:
        _require_admin(request, conn)
        if body.clearanceLevel not in {"Public", "Confidential", "Restricted"}:
            raise HTTPException(422, "Invalid clearance level.")
        if body.role in ADMIN_ROLES:
            raise HTTPException(403, "Admin roles cannot be created through employee invitations.")
        _mail_config()  # Fail before writing any account if email is not configured.
        if email == _admin_config()[0] or conn.execute("SELECT 1 FROM employees WHERE email = ?", (email,)).fetchone():
            raise HTTPException(409, "An account with this email already exists.")
        alphabet = string.ascii_letters + string.digits + "!@#$%"
        temporary_password = "".join(secrets.choice(alphabet) for _ in range(20))
        salt = secrets.token_hex(16)
        employee_id = "emp-" + secrets.token_hex(12)
        conn.execute(
            "INSERT INTO employees VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)",
            (employee_id, body.name.strip(), email, body.role, body.department,
             body.clearanceLevel, salt, _hash_password(temporary_password, salt)),
        )
        # If SMTP raises, sqlite's context manager rolls back the account; retry stays possible.
        _send_invitation(body.name.strip(), email, temporary_password)
    return {"user": _public_user({"id": employee_id, "name": body.name.strip(), "email": email,
                                   "role": body.role, "department": body.department, "clearance": body.clearanceLevel}),
            "emailSent": True,
            "temporaryPassword": temporary_password}


@router.delete("/employees/{employee_id}")
def delete_employee(employee_id: str, request: Request):
    with _db() as conn:
        _require_admin(request, conn)
        user = conn.execute("SELECT * FROM employees WHERE id = ?", (employee_id,)).fetchone()
        if not user:
            raise HTTPException(404, "Employee account not found.")
        conn.execute("DELETE FROM sessions WHERE employee_id = ?", (employee_id,))
        conn.execute("DELETE FROM employees WHERE id = ?", (employee_id,))
        return {"success": True, "message": f"Employee '{user['name']}' ({employee_id}) permanently deleted."}

