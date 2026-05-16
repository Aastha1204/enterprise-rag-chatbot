from langchain.vectorstores import Chroma
from langchain.embeddings import HuggingFaceEmbeddings

embedding = HuggingFaceEmbeddings(
 model_name="sentence-transformers/all-MiniLM-L6-v2"
)

db = Chroma(
 persist_directory="vectorstore",
 embedding_function=embedding
)

def retrieve_docs(query):

    docs = db.similarity_search(
        query,
        k=3
    )

    return docs