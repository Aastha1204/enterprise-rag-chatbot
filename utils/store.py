from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

DB_DIR = "vectorstore"

_embedding = None
_db = None

def get_embedding():
    global _embedding
    if _embedding is None:
        _embedding = HuggingFaceEmbeddings(
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

def store_chunks(chunks):

    db = Chroma.from_documents(
        documents=chunks,
        embedding=get_embedding(),
        persist_directory=DB_DIR
    )

    global _db
    _db = db

    print("✅ Embeddings Stored Successfully ")