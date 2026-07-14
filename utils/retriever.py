from utils.store import get_db

def retrieve_docs(query, source=None):

    db = get_db()

    filter = {"source": source} if source else None
    docs = db.similarity_search(query, k=3, filter=filter)

    print("RETRIEVED DOCS 😈🔥")
    print(docs)

    return docs