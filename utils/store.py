from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

embedding = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

def store_chunks(chunks):

    db = Chroma.from_documents(
        documents=chunks,
        embedding=embedding,
        persist_directory="vectorstore"
    )

    db.persist()

    return db