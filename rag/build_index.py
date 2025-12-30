from sentence_transformers import SentenceTransformer
import faiss
import os

model = SentenceTransformer("all-MiniLM-L6-v2")

def load_corpus(path):
    texts = []
    for file in os.listdir(path):
        with open(os.path.join(path, file), "r", encoding="utf-8") as f:
            texts.append(f.read())
    return texts

texts = load_corpus("rag/corpus/")
embeddings = model.encode(texts)

index = faiss.IndexFlatL2(embeddings.shape[1])
index.add(embeddings)

os.makedirs("rag/faiss_index", exist_ok=True)
faiss.write_index(index, "rag/faiss_index/index.bin")
