import os
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

# Config
INDEX_DIR = "rag/faiss_index"
INDEX_FILE = os.path.join(INDEX_DIR, "index.bin")
DOCS_FILE = os.path.join(INDEX_DIR, "docs.txt")
MODEL_NAME = "all-MiniLM-L6-v2"

class Retriever:
    def __init__(self):
        try:
            self.model = SentenceTransformer(MODEL_NAME)
            self.index = faiss.read_index(INDEX_FILE)
            with open(DOCS_FILE, "r", encoding="utf-8") as f:
                self.docs = f.readlines()
        except Exception as e:
            print(f"Error loading retrieval index: {e}. Retrieval will be empty.")
            self.index = None
            self.docs = []

    def retrieve(self, query: str, k: int = 2) -> str:
        if not self.index:
            return ""

        embedding = self.model.encode([query])
        distances, indices = self.index.search(np.array(embedding).astype('float32'), k)

        results = []
        for idx in indices[0]:
            if idx < len(self.docs):
                results.append(self.docs[idx].strip())

        return "\n\n".join(results)

# Singleton instance
retriever = Retriever()

def get_retrieved_context(query: str) -> str:
    return retriever.retrieve(query)
