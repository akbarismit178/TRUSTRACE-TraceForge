import os
import re
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app


class FakeSMTP:
    messages = []

    def __init__(self, *_args, **_kwargs):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def starttls(self):
        pass

    def login(self, *_args):
        pass

    def send_message(self, message):
        self.messages.append(message)


class CatalogTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.env = patch.dict(os.environ, {
            "EMPLOYEE_DB_PATH": str(Path(self.temp.name) / "employees.sqlite3"),
            "ADMIN_EMAIL": "owner@example.com", "ADMIN_PASSWORD": "test-admin-password",
            "SMTP_USERNAME": "sender@example.com", "SMTP_PASSWORD": "test-smtp-password",
            "APP_LOGIN_URL": "http://localhost:3000/login",
        })
        self.env.start()
        self.smtp = patch("app.employee_accounts.smtplib.SMTP", FakeSMTP)
        self.smtp.start()
        FakeSMTP.messages = []
        self.client = TestClient(app)
        self.base = "/api/v1/catalog/documents"

    def tearDown(self):
        self.client.close()
        self.smtp.stop()
        self.env.stop()
        self.temp.cleanup()

    def login_admin(self):
        response = self.client.post("/api/v1/employee-auth/login", json={
            "email": "owner@example.com", "password": "test-admin-password",
        })
        self.assertEqual(response.status_code, 200, response.text)

    def login_employee(self, role, department="Finance", clearance="Confidential", email="employee@example.com"):
        self.login_admin()
        created = self.client.post("/api/v1/employees", json={
            "name": "Example Employee", "email": email, "role": role,
            "department": department, "clearanceLevel": clearance,
        })
        self.assertEqual(created.status_code, 201, created.text)
        user_id = created.json()["user"]["id"]
        password = re.search(r"Temporary password: (\S+)", FakeSMTP.messages[-1].get_content()).group(1)
        self.client.post("/api/v1/employee-auth/logout")
        logged_in = self.client.post("/api/v1/employee-auth/login", json={
            "email": email, "password": password,
        })
        self.assertEqual(logged_in.status_code, 200, logged_in.text)
        return user_id

    def ids(self):
        response = self.client.get(self.base)
        self.assertEqual(response.status_code, 200, response.text)
        return response.json(), {doc["id"] for doc in response.json()["documents"]}

    def test_guest_only_public_and_no_hidden_metadata(self):
        body, ids = self.ids()
        self.assertEqual(ids, {"doc-pub-01"})
        self.assertEqual(set(body), {"documents"})
        for doc_id in ("doc-fin-01", "doc-exec-02", "doc-canary-99", "missing"):
            denial = self.client.get(f"{self.base}/{doc_id}/pdf")
            self.assertEqual(denial.status_code, 404)
            self.assertNotIn("CANARY", denial.text)
        preview = self.client.get(f"{self.base}/doc-pub-01/pdf")
        self.assertEqual(preview.status_code, 200)
        self.assertTrue(preview.content.startswith(b"%PDF-"))
        self.assertTrue(preview.headers["content-type"].startswith("application/pdf"))
        self.assertTrue(preview.headers["content-disposition"].startswith("inline;"))
        self.assertEqual(preview.headers["cache-control"], "no-store")

    def test_admin_count_excludes_honeytoken_from_list_and_pdf(self):
        self.login_admin()
        body, ids = self.ids()
        self.assertEqual(body["totalDocuments"], 10)
        self.assertEqual(body["availableDocuments"], 9)
        self.assertEqual(len(ids), 9)
        self.assertNotIn("doc-canary-99", ids)
        self.assertEqual(self.client.get(f"{self.base}/doc-canary-99/pdf").status_code, 404)
        restricted = self.client.get(f"{self.base}/doc-exec-02/pdf")
        self.assertEqual(restricted.status_code, 200)
        self.assertTrue(restricted.content.startswith(b"%PDF-"))
        self.assertEqual(self.client.patch(f"{self.base}/doc-canary-99/permissions", json={
            "permissions": {"roles": ["Finance Intern"], "users": [], "departments": ["Finance"]},
        }).status_code, 404)

    def test_intern_and_manager_role_bans_and_restricted_clearance(self):
        self.login_employee("Finance Intern")
        body, ids = self.ids()
        self.assertEqual(ids, {"doc-fin-01", "doc-fin-02", "doc-fin-03", "doc-fin-04", "doc-pub-01"})
        self.assertEqual(set(body), {"documents"})
        for doc_id in ("doc-fin-05", "doc-hr-01", "doc-exec-02"):
            self.assertEqual(self.client.get(f"{self.base}/{doc_id}/pdf").status_code, 404)
        self.assertEqual(self.client.get(f"{self.base}/doc-fin-01/pdf").status_code, 200)
        self.assertEqual(self.client.patch(f"{self.base}/doc-fin-01/permissions", json={
            "permissions": {"roles": [], "users": [], "departments": []},
        }).status_code, 403)
        self.client.post("/api/v1/employee-auth/logout")
        self.login_employee("Finance Manager", email="manager@example.com")
        body, ids = self.ids()
        self.assertIn("doc-fin-05", ids)
        self.assertNotIn("doc-exec-02", ids)
        self.assertNotIn("doc-hr-01", ids)
        self.assertEqual(set(body), {"documents"})

    def test_public_clearance_cannot_access_confidential_even_with_matching_role(self):
        self.login_employee("Finance Intern", clearance="Public")
        body, ids = self.ids()
        self.assertEqual(ids, {"doc-pub-01"})
        self.assertEqual(set(body), {"documents"})
        self.assertEqual(self.client.get(f"{self.base}/doc-fin-01/pdf").status_code, 404)

    def test_persistent_acl_user_override_department_but_not_clearance_or_role_ban(self):
        employee_id = self.login_employee("Security Analyst", department="Security", clearance="Restricted")
        body, ids = self.ids()
        self.assertEqual(ids, {"doc-pub-01"})
        self.assertEqual(set(body), {"documents"})
        self.login_admin()
        permissions = {"roles": [], "users": [employee_id], "departments": []}
        patched = self.client.patch(f"{self.base}/doc-hr-01/permissions", json={"permissions": permissions})
        self.assertEqual(patched.status_code, 200, patched.text)
        self.assertEqual(patched.json()["document"]["permissions"], permissions)
        # Recreate the client to ensure permissions are read back from SQLite, not process memory.
        self.client.close()
        self.client = TestClient(app)
        self.login_admin()
        self.assertEqual(next(doc for doc in self.ids()[0]["documents"] if doc["id"] == "doc-hr-01")["permissions"], permissions)
        self.client.post("/api/v1/employee-auth/logout")
        password = re.search(r"Temporary password: (\S+)", FakeSMTP.messages[-1].get_content()).group(1)
        self.assertEqual(self.client.post("/api/v1/employee-auth/login", json={
            "email": "employee@example.com", "password": password,
        }).status_code, 200)
        body, ids = self.ids()
        self.assertIn("doc-hr-01", ids)
        self.assertEqual(set(body), {"documents"})
        self.assertEqual(self.client.get(f"{self.base}/doc-hr-01/pdf").status_code, 200)

    def test_legacy_routes_cannot_leak_or_change_documents(self):
        for method, path in (("get", "/api/v1/documents"),
                             ("post", "/api/v1/documents"),
                             ("patch", "/api/v1/documents/doc-fin-01/permissions")):
            response = getattr(self.client, method)(path, json={} if method != "get" else None)
            self.assertEqual(response.status_code, 410, response.text)
            self.assertNotIn("CEO Compensation", response.text)
        self.assertEqual(self.client.patch(f"{self.base}/doc-fin-01/permissions", json={
            "permissions": {"roles": [], "users": [], "departments": []},
        }).status_code, 401)
        self.client.cookies.set("trustrace_session", "invalid")
        self.assertEqual(self.client.get(self.base).status_code, 401)


if __name__ == "__main__":
    unittest.main()
