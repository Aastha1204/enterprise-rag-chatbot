from utils.store import get_db

def retrieve_docs(query, source=None):

    db = get_db()

    filter = {"source": source} if source else None
    k = 8 if source else 3
    docs = db.similarity_search(query, k=k, filter=filter)

    print("RETRIEVED DOCS 😈🔥")
    print(docs)

    return docs