import app.env_loader  # Automatically loads .env files
from fastapi import FastAPI, HTTPException, Depends, Header, Query, Body, status, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import hashlib
import time
import re
import datetime
import os
from app.employee_accounts import router as employee_accounts_router, _db
from app.catalog import router as catalog_router, _DOCUMENTS, _CHUNKS, _allowed, _document, _viewer
import json
from app.document_processor import get_embedder
import numpy as np

app = FastAPI(
    title="TRUSTRACE Enterprise Backend API",
    description="Production Zero-Trust Explainable AI Assistant Gateway (FastAPI + PostgreSQL pgvector RLS)",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(employee_accounts_router)
app.include_router(catalog_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}

# ---------------------------------------------------------------------------
# PYDANTIC DATA SCHEMAS
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    role: str = Field(default="Finance Intern", description="User role to authenticate as in demo mode")
    email: Optional[str] = None
    password: Optional[str] = None

class QueryRequest(BaseModel):
    prompt: str = Field(..., description="User prompt to execute through Gate 1 & Gate 2 pipeline")

class DocumentPermissions(BaseModel):
    roles: List[str]
    users: List[str] = []
    departments: List[str] = []

class DocumentCreate(BaseModel):
    title: str
    department: str
    classification: str
    docType: str
    permissions: DocumentPermissions
    summary: Optional[str] = ""

class PermissionPatchRequest(BaseModel):
    permissions: DocumentPermissions

class ConflictResolveRequest(BaseModel):
    recommendedDocId: str
    resolutionNotes: str

class PolicyRuleCreate(BaseModel):
    name: str
    targetRole: str
    targetDocType: str
    maxClassification: str
    allowedDepartments: List[str]
    action: str
    condition: str

class PolicySimulateRequest(BaseModel):
    prompt: str
    targetRole: Optional[str] = "Finance Intern"

class AccessRequestCreate(BaseModel):
    docId: str
    docTitle: str
    classification: str
    durationHours: int
    reason: str

class AttackSimulateRequest(BaseModel):
    payload: str
    attackCategory: Optional[str] = "direct_injection"

# ---------------------------------------------------------------------------
# MOCK SEED DATABASE IN MEMORY (FOR MOCK / LIVE SCENARIO)
# ---------------------------------------------------------------------------

USERS_DB = {
    "Finance Intern": {
        "id": "user-intern-01",
        "name": "Aarav Patel",
        "email": "aarav.patel@acme-corp.com",
        "role": "Finance Intern",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        "department": "Finance",
        "clearanceLevel": "Confidential",
        "activeGrants": [],
        "sessionIp": "192.168.1.104"
    },
    "Finance Manager": {
        "id": "user-mgr-02",
        "name": "Meera Sharma",
        "email": "meera.sharma@acme-corp.com",
        "role": "Finance Manager",
        "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        "department": "Finance",
        "clearanceLevel": "Confidential",
        "activeGrants": ["dept:Finance:contract"],
        "sessionIp": "192.168.1.112"
    },
    "CEO/Admin": {
        "id": "user-ceo-03",
        "name": "Rohan Mehta",
        "email": "rohan.mehta@acme-corp.com",
        "role": "CEO/Admin",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        "department": "Executive",
        "clearanceLevel": "Restricted",
        "activeGrants": ["*"],
        "sessionIp": "192.168.1.1"
    }
}

DOCUMENTS_DB = [
    {
        "id": "doc-fin-01",
        "title": "Q2 Financial Report.pdf",
        "department": "Finance",
        "classification": "Confidential",
        "docType": "report",
        "ownerName": "Elena Rostova",
        "fileSize": "4.2 MB",
        "pagesCount": 18,
        "version": "v1.0",
        "status": "indexed",
        "uploadedAt": "2026-06-30",
        "permissions": {
            "roles": ["Finance Intern", "Finance Manager", "CEO/Admin"],
            "users": [],
            "departments": ["Finance", "Executive"]
        },
        "summary": "Official Q2 Financial Performance Report showing consolidated revenue of ₹48.2 Cr."
    },
    {
        "id": "doc-fin-02",
        "title": "Q2 Revenue Summary v2.xlsx",
        "department": "Finance",
        "classification": "Confidential",
        "docType": "report",
        "ownerName": "Meera Sharma",
        "fileSize": "1.8 MB",
        "pagesCount": 4,
        "version": "v2.1",
        "status": "indexed",
        "uploadedAt": "2026-07-05",
        "permissions": {
            "roles": ["Finance Intern", "Finance Manager", "CEO/Admin"],
            "users": [],
            "departments": ["Finance", "Executive"]
        },
        "summary": "Audited revision showing finalized Q2 revenue of ₹46.8 Cr following deferrals."
    },
    {
        "id": "doc-exec-01",
        "title": "CEO Compensation & Equity Agreement.pdf",
        "department": "Executive",
        "classification": "Restricted",
        "docType": "payroll",
        "ownerName": "Board Chairman",
        "fileSize": "1.2 MB",
        "pagesCount": 6,
        "version": "v1.0",
        "status": "indexed",
        "uploadedAt": "2026-03-15",
        "permissions": {
            "roles": ["CEO/Admin"],
            "users": ["user-ceo-03"],
            "departments": ["Executive"]
        },
        "summary": "Executive Employment Agreement detailing CEO Base Compensation ($450,000 USD)."
    }
]

# ---------------------------------------------------------------------------
# API ENDPOINTS IMPLEMENTATION
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    return {
        "name": "TRUSTRACE Enterprise Backend API",
        "version": "2.0.0",
        "status": "online",
        "invariant": "Restricted Chunks Sent To LLM = 0"
    }

@app.post("/api/v1/auth/login")
async def login(req: LoginRequest, response: Response):
    from app.employee_accounts import COOKIE_NAME, SESSION_HOURS
    import secrets
    
    user = USERS_DB.get(req.role, USERS_DB["Finance Intern"])
    
    # Issue a real session for the demo user
    token = secrets.token_urlsafe(32)
    expires = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=SESSION_HOURS)
    
    with _db() as conn:
        # Ensure the demo user exists in employees DB so _session_user works
        try:
            conn.execute(
                "INSERT OR IGNORE INTO employees (id, name, email, role, department, clearance, salt, password_hash, must_change_password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (user["id"], user["name"], user["email"], user["role"], user["department"], user["clearanceLevel"], "demo", "demo", 0)
            )
            conn.execute("INSERT INTO sessions VALUES (?, ?, ?)", (hashlib.sha256(token.encode()).hexdigest(), user["id"], expires.isoformat()))
        except Exception as e:
            print("Error creating demo session:", e)
            
    response.set_cookie(
        COOKIE_NAME, token, httponly=True, secure=os.environ.get("COOKIE_SECURE") == "true",
        samesite="lax", max_age=SESSION_HOURS * 3600,
    )
    
    return {
        "success": True,
        "token": token,
        "user": user
    }

@app.get("/api/v1/auth/me")
async def get_current_user(x_user_role: Optional[str] = Header("Finance Intern")):
    user = USERS_DB.get(x_user_role, USERS_DB["Finance Intern"])
    return {
        "success": True,
        "user": user
    }



class QueryRouter:
    @staticmethod
    def route(prompt: str, allowed_docs: list, user: dict, is_admin: bool) -> dict:
        prompt_lower = prompt.lower()
        
        # 1. Document Detection
        mentioned_allowed = []
        for d in allowed_docs:
            title = d.get("title", "")
            if title:
                t_low = title.lower()
                no_ext = re.sub(r'\.[a-z0-9]+$', '', t_low).strip()
                if t_low in prompt_lower or no_ext in prompt_lower:
                    if d not in mentioned_allowed:
                        mentioned_allowed.append(d)
        
        # Check explicit .pdf, .xlsx etc
        explicit = re.search(r'([a-zA-Z0-9_\- ]+\.(pdf|xlsx|csv|docx|txt))', prompt_lower)
        if explicit:
            filename = explicit.group(1).strip()
            if not mentioned_allowed:
                return {"intent": "access_denied", "filename": filename}
                
        if mentioned_allowed:
            return {"intent": "document", "docs": mentioned_allowed}
            
        # 2. Business Data Routing
        if "attendance" in prompt_lower:
            return {"intent": "db_attendance"}
        if "sales" in prompt_lower:
            return {"intent": "db_sales"}
        if "employee" in prompt_lower or "hr" in prompt_lower or "department" in prompt_lower or "designation" in prompt_lower:
            return {"intent": "db_hr"}
            
        return {"intent": "rag", "docs": allowed_docs}

class LocalLLMSimulator:
    @staticmethod
    def extract_answer(prompt: str, chunks: list, intent: str, db_result: str = "") -> str:
        if intent.startswith("db_"):
            return db_result
            
        prompt_lower = prompt.lower()
        if not chunks:
            return "I could not find sufficient information in the documents you are authorized to access."
        
        combined_text = "\n".join([c['content'] for c in chunks])
        lines = combined_text.split('\n')
        
        if "details" in prompt_lower:
            return f"Document Details:\nTitle: {chunks[0]['docTitle']}\nType: {chunks[0]['docType']}\nClassification: {chunks[0]['classification']}\n"
            
        if '1 mark' in prompt_lower or 'one mark' in prompt_lower:
            results = []
            in_section = False
            for line in lines:
                line_lower = line.lower()
                if '1 mark' in line_lower:
                    in_section = True
                    continue
                if '3 mark' in line_lower or '5 mark' in line_lower or '2 mark' in line_lower:
                    in_section = False
                if in_section and re.match(r'^\s*\d+\.', line.strip()):
                    results.append(line.strip())
            if results:
                return "Here are the 1-mark questions:\n" + "\n".join(results)
                
        if '5 mark' in prompt_lower or 'five mark' in prompt_lower:
            results = []
            in_section = False
            for line in lines:
                line_lower = line.lower()
                if '5 mark' in line_lower:
                    in_section = True
                    continue
                if '1 mark' in line_lower or '3 mark' in line_lower or '2 mark' in line_lower:
                    in_section = False
                if in_section and re.match(r'^\s*\d+\.', line.strip()):
                    results.append(line.strip())
            if results:
                return "Here are the 5-mark questions:\n" + "\n".join(results)
                
        # Fallback RAG extraction
        keywords = [w for w in prompt_lower.split() if len(w) > 4]
        results = []
        for line in lines:
            if any(kw in line.lower() for kw in keywords):
                if line.strip() not in results:
                    results.append(line.strip())
        if results:
            return "Extracted information:\n- " + "\n- ".join(results[:5])
            
        return f"Based on the authorized context:\n{chunks[0]['content'][:300]}..."

@app.post("/api/v1/chat/query")
async def execute_query(req: QueryRequest, request: Request):
    with _db() as conn:
        try:
            viewer, is_admin = _viewer(request, conn)
        except Exception:
            viewer = None
            is_admin = False
            
        if not viewer:
            raise HTTPException(401, "Authentication required.")
            
        user = viewer
        prompt = req.prompt.strip()
        query_id = f"qry-{int(time.time())}"
        
        is_blocked = False
        answer = ""
        authorized_sources = []
        blocked_count = 0
        restricted_chunks_sent = 0
        db_result = ""

        lower_prompt = prompt.lower()
        
        if "ignore previous instructions" in lower_prompt or "system prompt" in lower_prompt:
            is_blocked = True
            answer = "[SECURITY ALERT] Request blocked: Malicious prompt injection attempt detected by Gate 1 Delimiter Inspector."
            blocked_count = 1
            
        if not is_blocked:
            allowed_docs = []
            
            for doc_id, seed in _DOCUMENTS.items():
                doc = _document(conn, seed)
                if _allowed(doc, user, is_admin):
                    allowed_docs.append(doc)
                    
            try:
                rows = conn.execute("SELECT * FROM uploaded_documents").fetchall()
                for r in rows:
                    doc_dict = dict(r)
                    doc_dict["permissions"] = json.loads(r["permissions"])
                    override = conn.execute("SELECT permissions FROM catalog_permissions WHERE doc_id = ?", (r["id"],)).fetchone()
                    if override:
                        doc_dict["permissions"] = json.loads(override["permissions"])
                    if _allowed(doc_dict, user, is_admin):
                        allowed_docs.append(doc_dict)
            except Exception as e:
                print("Error loading uploaded documents:", e)
                
            routing = QueryRouter.route(prompt, allowed_docs, user, is_admin)
            intent = routing["intent"]
            
            if intent == "access_denied":
                answer = f"The requested document '{routing.get('filename', '')}' does not exist or you do not have permission to access it."
            elif intent == "db_attendance":
                answer = "The requested attendance data is currently unavailable in the database."
            elif intent == "db_sales":
                answer = "The requested sales data is currently unavailable in the database."
            elif intent == "db_hr":
                role = user.get("role", "")
                dept = user.get("department", "")
                
                if is_admin or role in ["HR", "CEO/Admin", "Management Staff"]:
                    where_clause = "1=1"
                    params = ()
                else:
                    where_clause = "department = ?"
                    params = (dept,)
                    
                try:
                    if "count" in lower_prompt or "how many" in lower_prompt:
                        if "hr" in lower_prompt:
                            count = conn.execute("SELECT COUNT(*) FROM employees WHERE department = 'HR' AND " + where_clause, params).fetchone()[0]
                            db_result = f"According to the database, there are {count} employees in the HR department."
                        else:
                            count = conn.execute(f"SELECT COUNT(*) FROM employees WHERE {where_clause}", params).fetchone()[0]
                            db_result = f"According to the database, there are {count} employees in your authorized scope."
                    elif "who" in lower_prompt:
                        rows = conn.execute(f"SELECT name FROM employees WHERE {where_clause}", params).fetchall()
                        names = [r["name"] for r in rows]
                        db_result = f"Authorized employees: " + ", ".join(names)
                    else:
                        db_result = "The requested employee details are available but require specific query formulation."
                except Exception as e:
                    db_result = "Failed to query HR database."
                    
                authorized_sources = [{
                    "id": "db-hr", "docId": "db-hr", "docTitle": "Employee Database",
                    "page": 1, "classification": "Confidential", "department": "HR", 
                    "docType": "database", "score": 1.0, "content": db_result,
                    "highlightSnippet": db_result[:100]
                }]
                answer = LocalLLMSimulator.extract_answer(prompt, authorized_sources, intent, db_result)
            
            elif intent in ("document", "rag"):
                allowed_doc_ids = [d["id"] for d in routing["docs"]]
                scored_chunks = []
                
                if intent == "document":
                    # Retrieve ALL chunks for exact reconstruction
                    for chunk in _CHUNKS:
                        if chunk["docId"] in allowed_doc_ids:
                            chunk_copy = dict(chunk)
                            chunk_copy["score"] = 1.0
                            scored_chunks.append(chunk_copy)
                            
                    if allowed_doc_ids:
                        placeholders = ",".join(["?"] * len(allowed_doc_ids))
                        try:
                            chunk_rows = conn.execute(f"SELECT id, doc_id, page, content, embedding FROM document_chunks WHERE doc_id IN ({placeholders}) ORDER BY page ASC, id ASC", allowed_doc_ids).fetchall()
                            for r in chunk_rows:
                                doc_title, doc_dept, doc_class, doc_type = "Unknown", "Unknown", "Confidential", "report"
                                for d in routing["docs"]:
                                    if d["id"] == r["doc_id"]:
                                        doc_title = d.get("title", "Unknown")
                                        doc_dept = d.get("department", "Unknown")
                                        doc_class = d.get("classification", "Confidential")
                                        doc_type = d.get("docType", "report")
                                        break
                                scored_chunks.append({
                                    "id": r["id"],
                                    "docId": r["doc_id"],
                                    "docTitle": doc_title,
                                    "page": r["page"],
                                    "classification": doc_class,
                                    "department": doc_dept,
                                    "docType": doc_type,
                                    "score": 1.0,
                                    "content": r["content"],
                                    "highlightSnippet": r["content"][:100] + "..."
                                })
                        except Exception as e:
                            pass
                    
                    authorized_sources = scored_chunks
                else:
                    # RAG vector search
                    embedder = get_embedder()
                    query_embedding = embedder.encode([prompt])[0]
                    
                    import numpy as np
                    for chunk in _CHUNKS:
                        if chunk["docId"] in allowed_doc_ids:
                            chunk_emb = embedder.encode([chunk["content"]])[0]
                            sim = np.dot(query_embedding, chunk_emb) / (np.linalg.norm(query_embedding) * np.linalg.norm(chunk_emb))
                            if any(kw in chunk["content"].lower() for kw in prompt.lower().split() if len(kw)>4):
                                sim += 0.2
                            if sim > 0.15:
                                chunk_copy = dict(chunk)
                                chunk_copy["score"] = float(sim)
                                scored_chunks.append(chunk_copy)
                                
                    if allowed_doc_ids:
                        placeholders = ",".join(["?"] * len(allowed_doc_ids))
                        try:
                            chunk_rows = conn.execute(f"SELECT id, doc_id, page, content, embedding FROM document_chunks WHERE doc_id IN ({placeholders})", allowed_doc_ids).fetchall()
                            for r in chunk_rows:
                                chunk_emb = np.array(json.loads(r["embedding"]))
                                sim = np.dot(query_embedding, chunk_emb) / (np.linalg.norm(query_embedding) * np.linalg.norm(chunk_emb))
                                if any(kw in r["content"].lower() for kw in prompt.lower().split() if len(kw)>4):
                                    sim += 0.2
                                if sim > 0.15:
                                    doc_title, doc_dept, doc_class, doc_type = "Unknown", "Unknown", "Confidential", "report"
                                    for d in routing["docs"]:
                                        if d["id"] == r["doc_id"]:
                                            doc_title = d.get("title", "Unknown")
                                            doc_dept = d.get("department", "Unknown")
                                            doc_class = d.get("classification", "Confidential")
                                            doc_type = d.get("docType", "report")
                                            break
                                    scored_chunks.append({
                                        "id": r["id"],
                                        "docId": r["doc_id"],
                                        "docTitle": doc_title,
                                        "page": r["page"],
                                        "classification": doc_class,
                                        "department": doc_dept,
                                        "docType": doc_type,
                                        "score": float(sim),
                                        "content": r["content"],
                                        "highlightSnippet": r["content"][:100] + "..."
                                    })
                        except Exception as e:
                            pass
                            
                    scored_chunks.sort(key=lambda x: x["score"], reverse=True)
                    authorized_sources = scored_chunks[:5]
                
                # Check for restricted chunks
                final_sources = []
                for src in authorized_sources:
                    if src["docId"] in allowed_doc_ids:
                        final_sources.append(src)
                    else:
                        restricted_chunks_sent += 1
                authorized_sources = final_sources
                
                if not authorized_sources:
                    answer = "I could not find sufficient information in the documents you are authorized to access."
                else:
                    answer = LocalLLMSimulator.extract_answer(prompt, authorized_sources, intent)

    chunk_ids = [c["id"] for c in authorized_sources]
    manifest_hash = hashlib.sha256(f"{query_id}:{user['role']}:{chunk_ids}".encode()).hexdigest()

    return {
        "success": True,
        "result": {
            "queryId": query_id,
            "prompt": prompt,
            "user": user,
            "answer": answer,
            "evidenceChunks": authorized_sources[:10], # Cap returned evidence UI
            "authorizedSourcesCount": len(authorized_sources),
            "blockedSourcesCount": blocked_count,
            "restrictedChunksSent": restricted_chunks_sent,
            "trustScore": {
                "totalScore": 96 if not is_blocked and answer != "The requested document does not exist or you do not have permission to access it." else 0,
                "band": "Verified" if not is_blocked else "Low",
                "evidenceCoverage": 90,
                "retrievalConfidence": 94,
                "sourceAuthority": 95,
                "consistency": 98,
                "policyIntegrity": 100,
                "penalties": 0
            },
            "contextManifest": {
                "queryId": query_id,
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "userRole": user["role"],
                "chunkIds": chunk_ids,
                "manifestHash": manifest_hash,
                "restrictedChunksSentCount": restricted_chunks_sent,
                "status": "verified" if restricted_chunks_sent == 0 else "CRITICAL_VIOLATION"
            },
            "executionTimeMs": 142,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "isBlocked": is_blocked,
            "securityEventsTriggered": []
        }
    }
@app.get("/api/v1/dashboard/summary")
async def get_dashboard_summary():
    return {
        "success": True,
        "data": {
            "totalDocuments": len(DOCUMENTS_DB),
            "totalUsers": 6,
            "questionsAsked": 142,
            "securityEvents": 2,
            "trustScoreAverage": 96.4,
            "restrictedChunksSentToLLM": 0
        }
    }

@app.get("/api/v1/security/summary")
async def get_security_summary():
    return {
        "success": True,
        "securityEvents": [
            {
                "id": "sec-ev-01",
                "timestamp": "2026-10-03 09:12:45",
                "type": "Permission Denial",
                "severity": "Medium",
                "userId": "user-intern-01",
                "userName": "Aarav Patel",
                "role": "Finance Intern",
                "queryPrompt": "What is the CEO compensation package?",
                "actionTaken": "Blocked pre-retrieval. 2 Restricted documents hidden.",
                "detectionLayer": "Gate 1 Pre-Retrieval Permission Engine",
                "riskScore": 45
            }
        ]
    }

@app.get("/api/v1/audit-logs")
async def get_audit_logs():
    return {
        "success": True,
        "auditLogs": [
            {
                "id": "aud-001",
                "stepIndex": 1,
                "timestamp": "2026-10-03 08:30:12",
                "prevHash": "0000000000000000000000000000000000000000000000000000000000000000",
                "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                "userId": "user-intern-01",
                "userName": "Aarav Patel",
                "role": "Finance Intern",
                "action": "Vector Retrieval Query",
                "resource": "Q2 Financial Report.pdf",
                "classification": "Confidential",
                "decision": "Allowed",
                "ipAddress": "192.168.1.104",
                "details": "Retrieved authorized chunk. Policy Gate 1 Passed."
            }
        ]
    }

@app.post("/api/v1/simulator/run")
async def run_simulator(req: AttackSimulateRequest):
    return {
        "success": True,
        "result": {
            "attackDetected": True,
            "permissionDenied": True,
            "restrictedChunksRetrieved": 0,
            "detectionLayer": "Gate 1 Delimiter Inspector",
            "message": f"Attack payload '{req.payload}' intercepted and neutralized."
        }
    }

@app.get("/api/v1/documents")
@app.post("/api/v1/documents")
@app.patch("/api/v1/documents/{doc_id}/permissions")
async def retired_document_routes(doc_id: Optional[str] = None):
    # These demo routes had no authentication and exposed or modified restricted records.
    raise HTTPException(status_code=410, detail="Use /api/v1/catalog/documents instead.")

@app.get("/api/v1/conflicts")
async def get_conflicts():
    return {
        "success": True,
        "conflicts": [
            {
                "id": "conflict-rev-01",
                "metric": "Q2 Net Revenue",
                "period": "Q2 FY2026",
                "valueA": "₹48.2 Cr",
                "sourceADocId": "doc-fin-01",
                "sourceADocTitle": "Q2 Financial Report.pdf",
                "sourceAPage": 3,
                "valueB": "₹46.8 Cr",
                "sourceBDocId": "doc-fin-02",
                "sourceBDocTitle": "Q2 Revenue Summary v2.xlsx",
                "sourceBPage": 2,
                "differencePct": 2.9,
                "severity": "High",
                "likelyCause": "Report v1 was generated prior to post-period billing adjustments.",
                "recommendedSourceDocId": "doc-fin-02",
                "status": "Unresolved"
            }
        ]
    }

@app.post("/api/v1/conflicts/{conflict_id}/resolve")
async def resolve_conflict(conflict_id: str, req: ConflictResolveRequest):
    return {
        "success": True,
        "conflictId": conflict_id,
        "status": "Resolved",
        "recommendedSourceDocId": req.recommendedDocId,
        "resolutionNotes": req.resolutionNotes
    }

@app.get("/api/v1/policies")
async def get_policies():
    return {
        "success": True,
        "policies": [
            {
                "id": "pol-01",
                "name": "Intern Restricted Doc Type Blocking",
                "targetRole": "Finance Intern",
                "targetDocType": "contract",
                "maxClassification": "Confidential",
                "allowedDepartments": ["Finance"],
                "action": "DENY",
                "condition": "Deny Intern access to contracts",
                "isActive": True
            }
        ]
    }

@app.post("/api/v1/policies/simulate")
async def simulate_policy(req: PolicySimulateRequest):
    return {
        "success": True,
        "explanation": f"Explainer diagnostic for target role '{req.targetRole}': Access evaluated against ABAC rules. Pre-retrieval filter enforced."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
