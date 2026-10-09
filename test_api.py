import httpx
import json

base_url = "http://localhost:8000/api/v1"
client = httpx.Client(base_url=base_url, timeout=30.0)

# 1. Login
r = client.post("/auth/login", json={"role": "Finance Intern"})
print("Login:", r.json())
token = r.json()["token"]

headers = {"x-user-role": "Finance Intern", "Authorization": f"Bearer {token}"}

# 2. Upload Document
metadata = {
    "title": "test_budget.pdf",
    "department": "Finance",
    "classification": "Confidential",
    "docType": "report",
    "fileSize": "0.1 MB"
}

with open("test_budget.pdf", "rb") as f:
    files = {"file": ("test_budget.pdf", f, "application/pdf")}
    data = {"metadata": json.dumps(metadata)}
    r = client.post("/catalog/documents/upload", headers={"x-user-role": "Finance Intern"}, files=files, data=data)

print("Upload:", r.json())

# 3. Query AI
r = client.post("/chat/query", headers=headers, json={"prompt": "What is the project budget?"})
print("Query Result:", json.dumps(r.json(), indent=2))
