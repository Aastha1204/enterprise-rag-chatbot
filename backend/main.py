from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv

import shutil
import os
import sys
import json

if sys.stdout.encoding is not None and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from utils.pdf_loader import load_pdf
from utils.chunking import chunk_data
from utils.store import store_chunks, list_documents, delete_document
from utils.retriever import retrieve_docs

# =========================
# LOAD ENV
# =========================

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

# =========================
# FASTAPI APP
# =========================

app = FastAPI()

UPLOAD_FOLDER = "data"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# REQUEST MODEL
# =========================

class Question(BaseModel):
    question: str
    source: str | None = None

# =========================
# HEALTH CHECK
# =========================

@app.get("/api/health")
def health():
    return {
        "message": "Enterprise RAG Backend Running 😈🔥"
    }

# =========================
# UPLOAD PDF
# =========================

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):

    try:

        file_path = f"{UPLOAD_FOLDER}/{file.filename}"

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        print("PDF SAVED:", file_path)

        # LOAD PDF
        documents = load_pdf(file_path)

        print("DOCUMENTS LOADED:", len(documents))

        # CHUNK
        chunks = chunk_data(documents)

        print("CHUNKS CREATED:", len(chunks))

        # STORE
        store_chunks(chunks)

        print("EMBEDDINGS STORED SUCCESSFULLY")

        return {
            "message": f"{file.filename} uploaded successfully 😈🔥"
        }

    except Exception as e:

        print("UPLOAD ERROR:", str(e))

        return {
            "message": "Upload failed 😭",
            "error": str(e)
        }

# =========================
# DOCUMENT MANAGEMENT
# =========================

@app.get("/documents")
def get_documents():

    docs = list_documents()

    result = []

    for source, chunk_count in docs.items():

        result.append({
            "filename": os.path.basename(source),
            "chunks": chunk_count,
            "size": os.path.getsize(source) if os.path.exists(source) else 0,
            "uploaded_at": os.path.getmtime(source) if os.path.exists(source) else 0
        })

    result.sort(key=lambda d: d["uploaded_at"], reverse=True)

    return {"documents": result}

@app.delete("/documents/{filename}")
def remove_document(filename: str):

    source = f"{UPLOAD_FOLDER}/{filename}"

    try:

        delete_document(source)

        if os.path.exists(source):
            os.remove(source)

        return {"message": f"{filename} deleted successfully"}

    except Exception as e:

        print("DELETE ERROR:", str(e))

        return {
            "message": "Delete failed 😭",
            "error": str(e)
        }

# =========================
# CHAT (streaming)
# =========================

@app.post("/chat")
def chat(data: Question):

    def event_stream():

        try:

            user_question = data.question

            print("QUESTION:", user_question)

            source_filter = f"{UPLOAD_FOLDER}/{data.source}" if data.source else None
            retrieved_docs = retrieve_docs(user_question, source=source_filter)

            print("DOCS FOUND:", len(retrieved_docs))

            if len(retrieved_docs) == 0:

                yield f"data: {json.dumps({'type': 'citations', 'citations': []})}\n\n"
                yield f"data: {json.dumps({'type': 'token', 'content': 'No relevant information found 😭'})}\n\n"
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                return

            citations = [
                {
                    "source": doc.metadata.get("source", "Unknown"),
                    "page": doc.metadata.get("page", 0) + 1,
                    "snippet": doc.page_content[:300]
                }
                for doc in retrieved_docs
            ]

            yield f"data: {json.dumps({'type': 'citations', 'citations': citations})}\n\n"

            context = "\n".join([
                doc.page_content
                for doc in retrieved_docs
            ])

            print("CONTEXT READY")

            stream = client.chat.completions.create(

                model="llama-3.3-70b-versatile",

                messages=[
                    {
                        "role": "user",
                        "content": f"""
Answer ONLY from provided context.

If answer is not present, say:
Information not found in company documents.

Context:
{context}

Question:
{user_question}
"""
                    }
                ],

                stream=True
            )

            for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield f"data: {json.dumps({'type': 'token', 'content': delta})}\n\n"

            print("ANSWER GENERATED")

            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:

            print("CHAT ERROR:", str(e))

            yield f"data: {json.dumps({'type': 'error', 'message': 'Backend crashed 😭'})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")

# =========================
# FRONTEND (built React app)
# =========================

FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

app.mount(
    "/",
    StaticFiles(directory=FRONTEND_DIST, html=True, check_dir=False),
    name="frontend"
)
