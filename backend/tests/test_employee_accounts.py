import os
import re
import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from app.main import app


class FakeSMTP:
    messages = []
    fail = False

    def __init__(self, host, port, timeout):
        self.host, self.port, self.timeout = host, port, timeout

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def starttls(self):
        pass

    def login(self, username, password):
        pass

    def send_message(self, message):
        if self.fail:
            raise OSError("SMTP unavailable")
        self.messages.append(message)


class EmployeeInvitationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db_path = str(Path(self.temp.name) / "employees.sqlite3")
        self.env = patch.dict(os.environ, {
            "EMPLOYEE_DB_PATH": self.db_path,
            "ADMIN_EMAIL": "owner@example.com", "ADMIN_PASSWORD": "secret-from-env",
            "SMTP_USERNAME": "sender@gmail.com", "SMTP_PASSWORD": "app-password",
            "SMTP_FROM": "sender@gmail.com", "APP_LOGIN_URL": "http://localhost:3000/login",
        })
        self.env.start()
        self.smtp = patch("app.employee_accounts.smtplib.SMTP", FakeSMTP)
        self.smtp.start()
        FakeSMTP.messages = []
        FakeSMTP.fail = False
        self.client = TestClient(app)
        self.employee = {
            "name": "Test Person", "email": "person@gmail.com", "role": "Finance Intern",
            "department": "Finance", "clearanceLevel": "Confidential",
        }

    def tearDown(self):
        self.client.close()
        self.smtp.stop()
        self.env.stop()
        self.temp.cleanup()

    def admin_login(self):
        response = self.client.post("/api/v1/employee-auth/login", json={
            "email": "owner@example.com", "password": "secret-from-env",
        })
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.cookies.get("trustrace_session"))
        self.assertNotIn("secret-from-env", response.text)

    def test_admin_required_and_email_delivery_with_password_rotation(self):
        self.assertEqual(self.client.post("/api/v1/employees", json=self.employee).status_code, 401)
        self.admin_login()
        created = self.client.post("/api/v1/employees", json=self.employee)
        self.assertEqual(created.status_code, 201, created.text)
        self.assertTrue(created.json()["emailSent"])
        self.assertNotIn("password", created.text)
        self.assertEqual(len(FakeSMTP.messages), 1)
        self.assertEqual(FakeSMTP.messages[0]["To"], "person@gmail.com")
        password = re.search(r"Temporary password: (\S+)", FakeSMTP.messages[0].get_content()).group(1)
        db = sqlite3.connect(self.db_path)
        try:
            saved = db.execute("SELECT password_hash FROM employees WHERE email = ?", ("person@gmail.com",)).fetchone()[0]
        finally:
            db.close()
        self.assertNotEqual(saved, password)
        self.assertEqual(self.client.post("/api/v1/employees", json=self.employee).status_code, 409)
        self.client.post("/api/v1/employee-auth/logout")
        signed_in = self.client.post("/api/v1/employee-auth/login", json={"email": "person@gmail.com", "password": password})
        self.assertEqual(signed_in.status_code, 200)
        self.assertTrue(signed_in.json()["mustChangePassword"])
        self.assertEqual(self.client.post("/api/v1/employees", json={**self.employee, "email": "another@gmail.com"}).status_code, 403)
        changed = self.client.post("/api/v1/employee-auth/change-password", json={"newPassword": "A-long-new-password-2026"})
        self.assertEqual(changed.status_code, 200)
        self.client.post("/api/v1/employee-auth/logout")
        self.assertEqual(self.client.post("/api/v1/employee-auth/login", json={"email": "person@gmail.com", "password": password}).status_code, 401)
        new_login = self.client.post("/api/v1/employee-auth/login", json={"email": "person@gmail.com", "password": "A-long-new-password-2026"})
        self.assertFalse(new_login.json()["mustChangePassword"])

    def test_smtp_failure_does_not_create_employee(self):
        self.admin_login()
        FakeSMTP.fail = True
        failure = self.client.post("/api/v1/employees", json=self.employee)
        self.assertEqual(failure.status_code, 502)
        self.assertNotIn("app-password", failure.text)
        self.assertEqual(self.client.get("/api/v1/employees").json()["users"], [])

    def test_missing_smtp_and_admin_role_rejected(self):
        self.admin_login()
        self.assertEqual(self.client.post("/api/v1/employees", json={**self.employee, "role": "Management Staff"}).status_code, 403)
        with patch.dict(os.environ, {"SMTP_PASSWORD": ""}):
            self.assertEqual(self.client.post("/api/v1/employees", json=self.employee).status_code, 503)
        self.assertEqual(self.client.get("/api/v1/employees").json()["users"], [])


if __name__ == "__main__":
    unittest.main()
