from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv

import shutil
import os
import sys

if sys.stdout.encoding is not None and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from utils.pdf_loader import load_pdf
from utils.chunking import chunk_data
from utils.store import store_chunks
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
# CHAT
# =========================

@app.post("/chat")
def chat(data: Question):

    try:

        user_question = data.question

        print("QUESTION:", user_question)

        # RETRIEVE DOCS
        retrieved_docs = retrieve_docs(user_question)

        print("DOCS FOUND:", len(retrieved_docs))

        if len(retrieved_docs) == 0:

            return {
                "answer": "No relevant information found 😭",
                "source": "None",
                "page": 0
            }

        source = retrieved_docs[0].metadata.get(
            "source",
            "Unknown"
        )

        page = retrieved_docs[0].metadata.get(
            "page",
            0
        )

        context = "\n".join([
            doc.page_content
            for doc in retrieved_docs
        ])

        print("CONTEXT READY")

        # LLM
        response = client.chat.completions.create(

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
            ]
        )

        answer = response.choices[0].message.content

        print("ANSWER GENERATED")

        return {
            "answer": answer,
            "source": source,
            "page": page + 1
        }

    except Exception as e:

        print("CHAT ERROR:", str(e))

        return {
            "answer": "Backend crashed 😭",
            "source": "Error",
            "page": 0
        }

# =========================
# FRONTEND (built React app)
# =========================

FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

app.mount(
    "/",
    StaticFiles(directory=FRONTEND_DIST, html=True, check_dir=False),
    name="frontend"
)