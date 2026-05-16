from fastapi import UploadFile, File
import shutil
from groq import Groq
import os
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from utils.pdf_loader import load_pdf
from utils.chunking import chunk_data
from utils.store import store_chunks
from utils.retriever import retrieve_docs

# Load env
load_dotenv()

# Groq client
client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

# FastAPI app
app = FastAPI()
UPLOAD_FOLDER = "data"

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load PDF
documents = load_pdf("data/policy.pdf")

# Chunk data
chunks = chunk_data(documents)

# Store embeddings
store_chunks(chunks)

# Request model
class Question(BaseModel):
    question: str

# Home route
@app.get("/")
def home():
    return {"message": "Backend Running 😭🔥"}

@app.post("/upload")

async def upload_pdf(file: UploadFile = File(...)):

    file_path = f"{UPLOAD_FOLDER}/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Load PDF
    documents = load_pdf(file_path)

    # Chunking
    chunks = chunk_data(documents)

    # Store embeddings
    store_chunks(chunks)

    return {
        "message": f"{file.filename} uploaded successfully 😈🔥"
    }
# Chat route
@app.post("/chat")
def chat(data: Question):

    user_question = data.question

    # Retrieve docs
    retrieved_docs = retrieve_docs(user_question)
    source = retrieved_docs[0].metadata.get("source", "Unknown")
    page = retrieved_docs[0].metadata.get("page", 0)

    # Build context
    context = "\n".join(
        [doc.page_content for doc in retrieved_docs]
    )

    # LLM call
    response = client.chat.completions.create(

        model="llama-3.3-70b-versatile",
        messages=[
    {
        "role": "user",
        "content": f"""
Answer ONLY from provided context.

If answer is not present, say:
'Information not found in company documents.'

Context:
{context}

Question:
{user_question}
"""
    }
]
    )

    answer = response.choices[0].message.content

    return {
    "answer": answer,
    "source": source,
    "page": page + 1
}