import json
import time
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, ConfigDict
from reportlab.lib.utils import simpleSplit
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

from app.employee_accounts import COOKIE_NAME, _db, _require_admin, _public_user, _session_user

router = APIRouter(prefix="/api/v1/catalog")
SEED_PATH = Path(__file__).resolve().parent.parent / "seed_catalog.json"
with SEED_PATH.open(encoding="utf-8") as seed_file:
    _SEED = json.load(seed_file)
_DOCUMENTS = {doc["id"]: doc for doc in _SEED["documents"]}
_CHUNKS = _SEED["chunks"]


class Permissions(BaseModel):
    model_config = ConfigDict(extra="forbid")

    roles: list[str]
    users: list[str]
    departments: list[str]


class PermissionPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    permissions: Permissions


class UploadDocumentRequest(BaseModel):
    title: str
    department: Optional[str] = None
    classification: Optional[str] = "Confidential"
    docType: Optional[str] = "report"
    fileSize: Optional[str] = "1.2 MB"
    pagesCount: Optional[int] = 5
    version: Optional[str] = "v1.0"
    summary: Optional[str] = "Uploaded document indexed into Zero-Trust RAG repository."


def _document(conn, doc):
    """Return a copy so one request cannot mutate the shared seed."""
    result = dict(doc)
    override = conn.execute(
        "SELECT permissions FROM catalog_permissions WHERE doc_id = ?", (doc["id"],)
    ).fetchone()
    result["permissions"] = json.loads(override["permissions"]) if override else dict(doc["permissions"])
    return result


def _init_catalog(conn):
    conn.execute("""CREATE TABLE IF NOT EXISTS catalog_permissions (
        doc_id TEXT PRIMARY KEY, permissions TEXT NOT NULL
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS uploaded_documents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        department TEXT NOT NULL,
        classification TEXT NOT NULL,
        docType TEXT NOT NULL,
        ownerName TEXT NOT NULL,
        fileSize TEXT NOT NULL,
        pagesCount INTEGER NOT NULL,
        version TEXT NOT NULL,
        status TEXT NOT NULL,
        uploadedAt TEXT NOT NULL,
        permissions TEXT NOT NULL,
        summary TEXT NOT NULL,
        original_hash TEXT DEFAULT '',
        file_path TEXT DEFAULT ''
    )""")
    try:
        conn.execute("ALTER TABLE uploaded_documents ADD COLUMN original_hash TEXT DEFAULT ''")
    except:
        pass
    try:
        conn.execute("ALTER TABLE uploaded_documents ADD COLUMN file_path TEXT DEFAULT ''")
    except:
        pass
        
    conn.execute("""CREATE TABLE IF NOT EXISTS deleted_documents (
        doc_id TEXT PRIMARY KEY,
        deleted_at TEXT NOT NULL,
        deleted_by TEXT NOT NULL
    )""")
    
    conn.execute("""CREATE TABLE IF NOT EXISTS document_chunks (
        id TEXT PRIMARY KEY,
        doc_id TEXT NOT NULL,
        page INTEGER NOT NULL,
        content TEXT NOT NULL,
        embedding TEXT NOT NULL
    )""")


def _viewer(request, conn):
    # A missing cookie means a public guest; an invalid/expired cookie is not a guest session.
    if not request.cookies.get(COOKIE_NAME):
        return None, False
    row = _session_user(request, conn)
    return _public_user(row), row == "admin" if isinstance(row, str) else False


def _allowed(doc, viewer, is_admin):
    if doc.get("isHoneytoken") or doc["docType"] == "honeytoken":
        return False
    if is_admin:
        return True
    if doc["classification"] == "Public":
        return True
    if viewer is None:
        return False
    role = viewer["role"]
    if role == "Finance Intern" and doc["docType"] in {"contract", "payroll", "minutes"}:
        return False
    if role == "Finance Manager" and doc["docType"] == "minutes":
        return False
    if doc["classification"] == "Restricted" and viewer["clearanceLevel"] != "Restricted":
        return False
    if doc["classification"] == "Confidential" and viewer["clearanceLevel"] not in {"Confidential", "Restricted"}:
        return False
    if doc["classification"] not in {"Confidential", "Restricted"}:
        return False
    permissions = doc["permissions"]
    users = permissions["users"]
    if viewer["id"] in users or viewer["email"].lower() in {entry.lower() for entry in users}:
        return True
    return role in permissions["roles"] and (
        viewer["department"] in permissions["departments"] or "ALL" in permissions["departments"]
    )


@router.get("/documents")
def list_documents(request: Request):
    with _db() as conn:
        _init_catalog(conn)
        viewer, is_admin = _viewer(request, conn)
        
        deleted_rows = conn.execute("SELECT doc_id FROM deleted_documents").fetchall()
        deleted_ids = {row["doc_id"] for row in deleted_rows}

        documents = [_document(conn, doc) for doc in _DOCUMENTS.values() if doc["id"] not in deleted_ids]

        # Load dynamic uploaded documents
        rows = conn.execute("SELECT * FROM uploaded_documents").fetchall()
        for r in rows:
            if r["id"] in deleted_ids:
                continue
            doc_dict = dict(r)
            doc_dict["permissions"] = json.loads(r["permissions"])
            override = conn.execute(
                "SELECT permissions FROM catalog_permissions WHERE doc_id = ?", (r["id"],)
            ).fetchone()
            if override:
                doc_dict["permissions"] = json.loads(override["permissions"])
            documents.append(doc_dict)

        visible = [doc for doc in documents if _allowed(doc, viewer, is_admin)]
        result = {"documents": visible}
        if is_admin:
            result["totalDocuments"] = len(documents)
            result["availableDocuments"] = len(visible)
        return result


import hashlib
import shutil
import os
from fastapi import UploadFile, File, Form
from app.document_processor import process_pdf

STORAGE_DIR = Path(__file__).resolve().parent.parent / "storage"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/documents/upload")
def upload_document(request: Request, file: UploadFile = File(...), metadata: str = Form(...)):
    import json
    body_dict = json.loads(metadata)
    body = UploadDocumentRequest(**body_dict)
    
    with _db() as conn:
        _init_catalog(conn)
        viewer, is_admin = _viewer(request, conn)
        if not viewer:
            raise HTTPException(401, "Authentication required to upload documents.")

        doc_id = f"doc-{int(time.time() * 1000)}"
        dept = body.department or viewer.get("department", "General Staff")
        owner_name = viewer.get("name", "Employee")

        default_permissions = {
            "roles": [viewer.get("role", "General Staff"), "Management Staff", "CEO/Admin", "System Administrator"],
            "users": [viewer.get("id", ""), viewer.get("email", "")],
            "departments": [dept, "IT & Administration"]
        }

        # Save the file
        file_ext = os.path.splitext(file.filename)[1]
        file_path = STORAGE_DIR / f"{doc_id}{file_ext}"
        
        file_hash = hashlib.sha256()
        with file_path.open("wb") as f:
            while chunk := file.file.read(8192):
                f.write(chunk)
                file_hash.update(chunk)
        
        original_hash = file_hash.hexdigest()
        
        # Process the PDF
        try:
            chunks = process_pdf(str(file_path), doc_id)
            for chunk in chunks:
                conn.execute(
                    "INSERT INTO document_chunks (id, doc_id, page, content, embedding) VALUES (?, ?, ?, ?, ?)",
                    (chunk["id"], chunk["doc_id"], chunk["page"], chunk["content"], chunk["embedding"])
                )
            status = "indexed"
            if not chunks:
                status = "failed_extraction"
        except Exception as e:
            print(f"Failed to process PDF: {e}")
            status = "failed_extraction"

        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        conn.execute(
            """INSERT INTO uploaded_documents 
               (id, title, department, classification, docType, ownerName, fileSize, pagesCount, version, status, uploadedAt, permissions, summary, original_hash, file_path)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                doc_id, body.title, dept, body.classification or "Confidential", body.docType or "report",
                owner_name, body.fileSize or "1.5 MB", body.pagesCount or 4, body.version or "v1.0",
                status, today, json.dumps(default_permissions), body.summary or "Uploaded document", original_hash, str(file_path)
            )
        )

        new_doc = {
            "id": doc_id,
            "title": body.title,
            "department": dept,
            "classification": body.classification or "Confidential",
            "docType": body.docType or "report",
            "ownerName": owner_name,
            "fileSize": body.fileSize or "1.5 MB",
            "pagesCount": body.pagesCount or 4,
            "version": body.version or "v1.0",
            "status": status,
            "uploadedAt": today,
            "permissions": default_permissions,
            "summary": body.summary or "Uploaded document"
        }
        return {"success": True, "document": new_doc}


@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str, request: Request):
    with _db() as conn:
        _require_admin(request, conn)
        _init_catalog(conn)
        viewer, _ = _viewer(request, conn)
        admin_id = viewer.get("id", "server-admin") if viewer else "server-admin"
        now = datetime.now(timezone.utc).isoformat()

        conn.execute("DELETE FROM uploaded_documents WHERE id = ?", (doc_id,))
        conn.execute("DELETE FROM catalog_permissions WHERE doc_id = ?", (doc_id,))
        conn.execute("DELETE FROM document_chunks WHERE doc_id = ?", (doc_id,))
        conn.execute(
            "INSERT OR REPLACE INTO deleted_documents (doc_id, deleted_at, deleted_by) VALUES (?, ?, ?)",
            (doc_id, now, admin_id)
        )
        return {"success": True, "message": f"Document '{doc_id}' permanently deleted from repository."}


def _preview_pdf(doc, chunks):
    """Generate a clean, high-fidelity Enterprise PDF containing the original document content."""
    output = BytesIO()
    pdf = canvas.Canvas(output, pagesize=(612, 792))
    
    font_regular = "Helvetica"
    font_bold = "Helvetica-Bold"
    for candidate in (
        Path("C:/Windows/Fonts/arial.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    ):
        if candidate.is_file():
            try:
                pdfmetrics.registerFont(TTFont("EnterpriseUnicode", str(candidate)))
                font_regular = "EnterpriseUnicode"
                font_bold = "EnterpriseUnicode"
                break
            except Exception:
                pass

    page_num = 1
    total_pages = 1

    def draw_header_footer(c, current_page):
        # Header
        c.setStrokeColorRGB(0.15, 0.2, 0.35)
        c.setLineWidth(1)
        c.line(48, 750, 564, 750)
        c.setFont(font_bold, 8)
        c.setFillColorRGB(0.3, 0.4, 0.6)
        c.drawString(48, 755, "TRUSTRACE ENTERPRISE • ZERO-TRUST SECURED DOCUMENT")
        c.drawRightString(564, 755, f"CLASSIFICATION: {doc.get('classification', 'CONFIDENTIAL').upper()}")
        
        # Footer
        c.line(48, 45, 564, 45)
        c.setFont(font_regular, 8)
        c.setFillColorRGB(0.5, 0.5, 0.5)
        c.drawString(48, 32, "Protected by Cryptographic Policy Isolation • Document ID: " + str(doc.get("id", "")))
        c.drawRightString(564, 32, f"Page {current_page}")

    draw_header_footer(pdf, page_num)
    y = 715

    # Document Title
    pdf.setFont(font_bold, 16)
    pdf.setFillColorRGB(0.08, 0.12, 0.25)
    pdf.drawString(48, y, doc.get("title", "Enterprise Document"))
    y -= 24

    # Metadata Grid Box
    pdf.setFillColorRGB(0.96, 0.97, 0.99)
    pdf.setStrokeColorRGB(0.85, 0.88, 0.94)
    pdf.roundRect(48, y - 48, 516, 52, 6, fill=1, stroke=1)
    
    pdf.setFont(font_bold, 8)
    pdf.setFillColorRGB(0.35, 0.4, 0.5)
    pdf.drawString(58, y - 14, "DEPARTMENT:")
    pdf.drawString(180, y - 14, "CLASSIFICATION:")
    pdf.drawString(320, y - 14, "OWNER / AUTHOR:")
    pdf.drawString(440, y - 14, "VERSION / DATE:")

    pdf.setFont(font_regular, 9)
    pdf.setFillColorRGB(0.1, 0.15, 0.25)
    pdf.drawString(58, y - 28, str(doc.get("department", "Corporate")))
    pdf.drawString(180, y - 28, str(doc.get("classification", "Confidential")))
    pdf.drawString(320, y - 28, str(doc.get("ownerName", "Enterprise Staff")))
    pdf.drawString(440, y - 28, f"{doc.get('version', 'v1.0')} ({doc.get('uploadedAt', 'Recent')})")
    y -= 64

    # Section 1: Executive Summary & Overview
    pdf.setFont(font_bold, 11)
    pdf.setFillColorRGB(0.15, 0.22, 0.4)
    pdf.drawString(48, y, "1. EXECUTIVE SUMMARY & OVERVIEW")
    y -= 14

    summary_text = doc.get("summary", "")
    if summary_text:
        pdf.setFont(font_regular, 9.5)
        pdf.setFillColorRGB(0.2, 0.25, 0.3)
        for line in simpleSplit(summary_text, font_regular, 9.5, 516):
            if y < 65:
                pdf.showPage()
                page_num += 1
                draw_header_footer(pdf, page_num)
                y = 715
                pdf.setFont(font_regular, 9.5)
                pdf.setFillColorRGB(0.2, 0.25, 0.3)
            pdf.drawString(48, y, line)
            y -= 13
        y -= 10

    # Section 2: Full Document Content / Chunks
    if chunks:
        pdf.setFont(font_bold, 11)
        pdf.setFillColorRGB(0.15, 0.22, 0.4)
        if y < 80:
            pdf.showPage()
            page_num += 1
            draw_header_footer(pdf, page_num)
            y = 715
        pdf.drawString(48, y, "2. DOCUMENT CONTENT & EXTRACTED SECTIONS")
        y -= 16

        for i, chunk in enumerate(chunks, 1):
            if y < 90:
                pdf.showPage()
                page_num += 1
                draw_header_footer(pdf, page_num)
                y = 715

            # Chunk Header Box
            pdf.setFillColorRGB(0.94, 0.96, 0.98)
            pdf.setStrokeColorRGB(0.85, 0.88, 0.92)
            pdf.roundRect(48, y - 18, 516, 20, 4, fill=1, stroke=1)
            pdf.setFont(font_bold, 8.5)
            pdf.setFillColorRGB(0.2, 0.3, 0.5)
            section_title = f"Section {i} — Source Page {chunk.get('page', 1)} • Chunk ID: {chunk.get('id', '')}"
            pdf.drawString(56, y - 13, section_title)
            y -= 26

            # Chunk Content Text
            pdf.setFont(font_regular, 9)
            pdf.setFillColorRGB(0.18, 0.2, 0.25)
            content = chunk.get("content", "")
            for line in simpleSplit(content, font_regular, 9, 508):
                if y < 65:
                    pdf.showPage()
                    page_num += 1
                    draw_header_footer(pdf, page_num)
                    y = 715
                    pdf.setFont(font_regular, 9)
                    pdf.setFillColorRGB(0.18, 0.2, 0.25)
                pdf.drawString(56, y, line)
                y -= 13
            y -= 10

    pdf.save()
    return output.getvalue()


from fastapi.responses import FileResponse

@router.get("/documents/{doc_id}/pdf")
def document_preview(doc_id: str, request: Request):
    with _db() as conn:
        _init_catalog(conn)
        viewer, is_admin = _viewer(request, conn)
        
        # Check deleted list
        is_deleted = conn.execute("SELECT doc_id FROM deleted_documents WHERE doc_id = ?", (doc_id,)).fetchone()
        if is_deleted:
            raise HTTPException(404, "Document has been deleted.")

        seed = _DOCUMENTS.get(doc_id)
        if not seed:
            row = conn.execute("SELECT * FROM uploaded_documents WHERE id = ?", (doc_id,)).fetchone()
            if row:
                seed = dict(row)
                seed["permissions"] = json.loads(row["permissions"])
                
        if not seed:
            raise HTTPException(404, "Document not found")
        doc = _document(conn, seed)
        if not _allowed(doc, viewer, is_admin):
            raise HTTPException(403, "You do not have clearance or department ACL permissions to view this document.")
            
        # If it's an uploaded document with a file_path, return that file directly.
        if "file_path" in seed and seed["file_path"] and os.path.exists(seed["file_path"]):
            return FileResponse(
                seed["file_path"],
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'inline; filename="{doc.get("title", "document")}"',
                    "Cache-Control": "no-store",
                }
            )
            
        # For seed documents, we generate the PDF as before since they don't have actual files
        raise HTTPException(404, "Original PDF binary not found in storage.")
@router.patch("/documents/{doc_id}/permissions")
def patch_permissions(doc_id: str, body: PermissionPatch, request: Request):
    with _db() as conn:
        _require_admin(request, conn)
        _init_catalog(conn)
        
        is_deleted = conn.execute("SELECT doc_id FROM deleted_documents WHERE doc_id = ?", (doc_id,)).fetchone()
        if is_deleted:
            raise HTTPException(404, "Document has been deleted.")

        seed = _DOCUMENTS.get(doc_id)
        if not seed:
            row = conn.execute("SELECT * FROM uploaded_documents WHERE id = ?", (doc_id,)).fetchone()
            if row:
                seed = dict(row)
                seed["permissions"] = json.loads(row["permissions"])
        if not seed or seed.get("isHoneytoken") or seed["docType"] == "honeytoken":
            raise HTTPException(404, "Document not found")
        conn.execute(
            "INSERT INTO catalog_permissions (doc_id, permissions) VALUES (?, ?) "
            "ON CONFLICT(doc_id) DO UPDATE SET permissions = excluded.permissions",
            (doc_id, body.permissions.model_dump_json()),
        )
        return {"document": _document(conn, seed)}
