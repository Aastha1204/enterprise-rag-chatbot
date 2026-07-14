from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import FastEmbedEmbeddings

import threading

DB_DIR = "vectorstore"

_embedding = None
_db = None
_lock = threading.RLock()

def get_embedding():
    global _embedding
    if _embedding is None:
        with _lock:
            if _embedding is None:
                _embedding = FastEmbedEmbeddings(
                    model_name="sentence-transformers/all-MiniLM-L6-v2",
                    providers=["CPUExecutionProvider"]
                )
    return _embedding

def get_db():
    global _db
    if _db is None:
        with _lock:
            if _db is None:
                _db = Chroma(
                    persist_directory=DB_DIR,
                    embedding_function=get_embedding()
                )
    return _db

def store_chunks(chunks, batch_size=16):

    db = get_db()

    for i in range(0, len(chunks), batch_size):
        db.add_documents(chunks[i:i + batch_size])

    print("✅ Embeddings Stored Successfully ")

def list_documents():
    db = get_db()
    data = db.get(include=["metadatas"])

    docs = {}
    for meta in data["metadatas"]:
        source = meta.get("source")
        if source:
            docs[source] = docs.get(source, 0) + 1

    return docs

def delete_document(source):
    db = get_db()
    db.delete(where={"source": source})