import fitz  # PyMuPDF
import hashlib
import json
import uuid
import os
import numpy as np

# Lazy load embedder to speed up import
_embedder = None

def get_embedder():
    global _embedder
    if _embedder is None:
        from sentence_transformers import SentenceTransformer
        _embedder = SentenceTransformer('all-MiniLM-L6-v2')
    return _embedder

def process_pdf(file_path: str, doc_id: str):
    """
    Extracts text from a PDF, generates chunks, and creates embeddings.
    """
    chunks = []
    
    # Extract text using PyMuPDF
    doc = fitz.open(file_path)
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text").strip()
        
        if not text:
            continue
            
        # Basic chunking by paragraphs or arbitrary size
        # We'll split by double newline and combine short paragraphs
        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
        
        current_chunk_text = ""
        for p in paragraphs:
            if len(current_chunk_text) + len(p) < 1000:
                current_chunk_text += p + "\n"
            else:
                if current_chunk_text.strip():
                    chunks.append({
                        "id": f"chunk-{uuid.uuid4().hex[:8]}",
                        "doc_id": doc_id,
                        "page": page_num + 1,
                        "content": current_chunk_text.strip()
                    })
                current_chunk_text = p + "\n"
                
        if current_chunk_text.strip():
            chunks.append({
                "id": f"chunk-{uuid.uuid4().hex[:8]}",
                "doc_id": doc_id,
                "page": page_num + 1,
                "content": current_chunk_text.strip()
            })
            
    doc.close()
    
    # Generate embeddings
    if chunks:
        embedder = get_embedder()
        texts = [c["content"] for c in chunks]
        embeddings = embedder.encode(texts)
        
        for i, c in enumerate(chunks):
            # Store embedding as JSON string list of floats
            c["embedding"] = json.dumps(embeddings[i].tolist())
            
    return chunks

def search_chunks(query: str, allowed_doc_ids: list, conn, top_k: int = 3):
    """
    Searches for the most relevant chunks using cosine similarity.
    """
    if not allowed_doc_ids:
        return []
        
    embedder = get_embedder()
    query_embedding = embedder.encode([query])[0]
    
    # Retrieve all chunks for allowed docs
    placeholders = ",".join(["?"] * len(allowed_doc_ids))
    rows = conn.execute(f"SELECT id, doc_id, page, content, embedding FROM document_chunks WHERE doc_id IN ({placeholders})", allowed_doc_ids).fetchall()
    
    if not rows:
        return []
        
    results = []
    for row in rows:
        chunk_emb = np.array(json.loads(row["embedding"]))
        # Cosine similarity
        similarity = np.dot(query_embedding, chunk_emb) / (np.linalg.norm(query_embedding) * np.linalg.norm(chunk_emb))
        if similarity > 0.1: # Basic threshold
            results.append({
                "id": row["id"],
                "docId": row["doc_id"],
                "page": row["page"],
                "content": row["content"],
                "score": float(similarity)
            })
        
    # Sort by similarity descending
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k]
