import re
import json
import sqlite3

# 1. Clear frontend seedData.ts
with open('src/engine/seedData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'export const SEED_DOCUMENTS: DocumentItem\[\] = \[.*?\];', 'export const SEED_DOCUMENTS: DocumentItem[] = [];', content, flags=re.DOTALL)
content = re.sub(r'export const SEED_CHUNKS: ChunkItem\[\] = \[.*?\];', 'export const SEED_CHUNKS: ChunkItem[] = [];', content, flags=re.DOTALL)

with open('src/engine/seedData.ts', 'w', encoding='utf-8') as f:
    f.write(content)

# 2. Clear backend seed_catalog.json
with open('backend/seed_catalog.json', 'w', encoding='utf-8') as f:
    f.write("[]")

# 3. Clear SQLite tables
conn = sqlite3.connect('backend/employees.sqlite3')
cur = conn.cursor()

cur.execute("DELETE FROM uploaded_documents")
cur.execute("DELETE FROM document_chunks")
cur.execute("DELETE FROM catalog_permissions")
conn.commit()
conn.close()

print("Documents wiped successfully from frontend and backend.")
