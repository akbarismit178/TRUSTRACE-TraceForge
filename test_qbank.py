import httpx
import json

base_url = "http://localhost:8000/api/v1"
client = httpx.Client(base_url=base_url, timeout=120.0)

def test():
    # Login as Finance Intern
    r = client.post("/auth/login", json={"role": "Finance Intern"})
    token = r.json()["token"]
    headers = {"x-user-role": "Finance Intern"}

    # Run query exactly as user stated
    query = "SEE Quiestion Bank.pdf in side pdf give me all one mark question."
    r = client.post("/chat/query", headers=headers, json={"prompt": query})
    print(r.text)
    res = r.json()
    
    print("Answer:")
    print(res["result"]["answer"])
    print("\nChunks Retrieved:")
    for chunk in res["result"]["evidenceChunks"]:
        print(f"- {chunk['docTitle']} (Page {chunk['page']})")

if __name__ == "__main__":
    test()
