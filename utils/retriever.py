from utils.store import get_db

def retrieve_docs(query):

    db = get_db()
    docs = db.similarity_search(query, k=3)

    print("RETRIEVED DOCS 😈🔥")
    print(docs)

    return docs