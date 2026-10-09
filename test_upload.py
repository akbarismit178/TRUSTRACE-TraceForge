import httpx
import json
from reportlab.pdfgen import canvas
from io import BytesIO

base_url = "http://localhost:8000/api/v1"
client = httpx.Client(base_url=base_url, timeout=120.0)

def test():
    # Login as Finance Intern
    r = client.post("/auth/login", json={"role": "Finance Intern"})
    token = r.json()["token"]
    headers = {"x-user-role": "Finance Intern"}

    # Create REAL PDF
    output = BytesIO()
    c = canvas.Canvas(output)
    c.drawString(100, 750, "Header")
    c.drawString(100, 730, "1 mark questions:")
    c.drawString(100, 710, "1. What is AI?")
    c.drawString(100, 690, "2. What is Machine Learning?")
    c.drawString(100, 650, "5 mark questions:")
    c.drawString(100, 630, "1. Explain neural networks in detail.")
    c.save()
    pdf_bytes = output.getvalue()

    with open("SEE Quiestion Bank.pdf", "wb") as f:
        f.write(pdf_bytes)
        
    metadata = {
        "title": "SEE Quiestion Bank.pdf",
        "department": "Finance",
        "classification": "Confidential",
        "docType": "report"
    }

    print("Uploading document...")
    with open("SEE Quiestion Bank.pdf", "rb") as f:
        files = {"file": ("SEE Quiestion Bank.pdf", f, "application/pdf")}
        data = {"metadata": json.dumps(metadata)}
        r = client.post("/catalog/documents/upload", headers=headers, files=files, data=data)
    
    print("Upload Response:", r.status_code, r.text)

    # Now run query
    query = "SEE Quiestion Bank.pdf give ma this odf details."
    print("Querying:", query)
    r = client.post("/chat/query", headers=headers, json={"prompt": query})
    res = r.json()
    
    print("Answer:")
    print(res["result"]["answer"])
    
    query2 = "SEE Quiestion Bank.pdf in side pdf give me all one mark question."
    print("Querying:", query2)
    r = client.post("/chat/query", headers=headers, json={"prompt": query2})
    res2 = r.json()
    
    print("Answer 2:")
    print(res2["result"]["answer"])
    
if __name__ == "__main__":
    test()
