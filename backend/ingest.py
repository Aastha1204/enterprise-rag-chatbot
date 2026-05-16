from utils.pdf_loader import load_pdf

docs = load_pdf("data/policy.pdf")

print(docs[0].page_content)