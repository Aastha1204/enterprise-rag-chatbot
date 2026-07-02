from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

embedding = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

DB_DIR = "vectorstore"

db = Chroma(
    persist_directory=DB_DIR,
    embedding_function=embedding
)

def retrieve_docs(query):

    docs = db.similarity_search(query, k=3)

    print("RETRIEVED DOCS 😈🔥")
    print(docs)

    return docs