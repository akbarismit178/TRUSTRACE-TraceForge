import httpx
import json
import hashlib
import os

base_url = "http://localhost:8000/api/v1"
client = httpx.Client(base_url=base_url, timeout=120.0)

def run_tests():
    print("--- STARTING END-TO-END TESTS ---")
    
    # --- TEST 1, 2: LOGIN & UPLOAD ---
    r = client.post("/auth/login", json={"role": "Finance Intern"})
    token = r.json()["token"]
    print(f"Logged in as Finance Intern. Token: {token[:10]}...")
    
    # Calculate original hash
    with open("Q2 Financial Report.pdf", "rb") as f:
        original_bytes = f.read()
    original_hash = hashlib.sha256(original_bytes).hexdigest()
    print(f"Original SHA-256: {original_hash}")
    
    metadata = {
        "title": "Q2 Financial Report.pdf",
        "department": "Finance",
        "classification": "Confidential",
        "docType": "report",
        "fileSize": "0.1 MB"
    }

    print("Uploading document...")
    with open("Q2 Financial Report.pdf", "rb") as f:
        files = {"file": ("Q2 Financial Report.pdf", f, "application/pdf")}
        data = {"metadata": json.dumps(metadata)}
        r = client.post("/catalog/documents/upload", files=files, data=data)
    
    upload_res = r.json()
    if not upload_res.get("success"):
        print("Upload failed:", upload_res)
        return
        
    doc_id = upload_res["document"]["id"]
    print(f"Upload successful. Document ID: {doc_id}")
    
    # --- TEST 10: PDF RE-DOWNLOAD ---
    print("Downloading document to verify integrity...")
    r = client.get(f"/catalog/documents/{doc_id}/pdf")
    downloaded_bytes = r.content
    downloaded_hash = hashlib.sha256(downloaded_bytes).hexdigest()
    
    if original_hash == downloaded_hash and len(original_bytes) == len(downloaded_bytes):
        print("TEST 1/10 PASS: Downloaded PDF is exactly identical to the uploaded PDF.")
    else:
        print(f"TEST 1/10 FAIL: Hash mismatch! Original: {original_hash}, Downloaded: {downloaded_hash}")

    # --- TEST 3: EXACT QUESTION ---
    headers = {"x-user-role": "Finance Intern"}
    q1 = "Q2 Financial Report.pdf me Section 1 Executive Summary ki information do."
    print(f"Querying: {q1}")
    r = client.post("/chat/query", headers=headers, json={"prompt": q1})
    res_q1 = r.json()
    
    print("Answer:", res_q1["result"]["answer"])
    evidence = res_q1["result"]["evidenceChunks"]
    if evidence:
        print("Retrieved Chunk:", evidence[0]["content"])
        if "48.2" in evidence[0]["content"]:
             print("TEST 3 PASS: Retrieved actual chunk containing 48.2 Cr.")
        else:
             print("TEST 3 FAIL: Retrieved chunk did not contain expected data.")
    else:
        print("TEST 3 FAIL: No evidence retrieved.")
        
    # --- TEST 4 & 7: NO WRONG DOCUMENT DATA ---
    wrong_doc_included = False
    for chunk in evidence:
        if chunk["docTitle"] != "Q2 Financial Report.pdf":
            wrong_doc_included = True
    if wrong_doc_included:
        print("TEST 4/7 FAIL: Retrieved chunks from wrong documents.")
    else:
        print("TEST 4/7 PASS: Retrieval strictly restricted to the correct document.")
        
    # --- TEST 6: WRONG QUESTION ---
    q2 = "Q2 Financial Report.pdf me audited revenue recognized kitna hai?"
    print(f"Querying: {q2}")
    r = client.post("/chat/query", headers=headers, json={"prompt": q2})
    res_q2 = r.json()
    print("Answer:", res_q2["result"]["answer"])
    # Note: Since the prompt uses basic extractive matching, we expect it to return retrieved text OR state no info.
    # Actually, our execute_query does extractive answering without an LLM. It returns the top chunk. 
    # If the semantic similarity is low, it returns no info. Let's see what it returns.

    # --- TEST 9: ROLE SPOOFING ---
    headers_spoof = {"x-user-role": "CEO/Admin"} # Try to spoof role
    print("Querying with spoofed role header CEO/Admin...")
    r = client.post("/chat/query", headers=headers_spoof, json={"prompt": q1})
    res_spoof = r.json()
    # The session is still tied to the Intern cookie, so it should resolve user as Intern (from cookie).
    # Wait, the execute_query in main.py does: `viewer, is_admin = _viewer(request, conn)`
    # Which relies on the cookie. So the user role returned in the response payload should be Intern!
    user_resolved = res_spoof["result"].get("user", {})
    if user_resolved.get("role") == "Finance Intern":
        print("TEST 9 PASS: Backend correctly identified user as Finance Intern from cookie, ignored spoofed header.")
    else:
        print(f"TEST 9 FAIL: Spoofing succeeded or user not resolved correctly: {user_resolved}")

if __name__ == "__main__":
    run_tests()
