from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import FastEmbedEmbeddings

DB_DIR = "vectorstore"

_embedding = None
_db = None

def get_embedding():
    global _embedding
    if _embedding is None:
        _embedding = FastEmbedEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
    return _embedding

def get_db():
    global _db
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