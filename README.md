# 💬 FloatChat Prototype

**Multimodal Graph-Augmented Retrieval-Generation (GraphRAG) for Oceanographic Data**

---

## 📖 Overview

**FloatChat** is a prototype system designed to tackle the **heterogeneity, scale, and complexity** of modern oceanographic datasets, with a focus on data from **Argo Floats**.  
It unifies **NetCDF-based sensor telemetry**, **satellite imagery**, and **scientific text corpora** into a **shared latent embedding space**.  
Through a **Graph-Augmented RAG pipeline**, the system executes **hybrid retrieval (vector similarity + graph traversal + symbolic reasoning)** and performs **graph-aware attention generation** with **hallucination filtering** and **uncertainty calibration**.

---

## 🚀 Key Features

- **Data Ingestion & Preprocessing** → Support for **NetCDF** (Argo floats), cloud-optimized formats (Zarr), and domain-specific QC flags.  
- **Embedding & Vector DB** → Dense vectorization using MiniLM/BGE models with **FAISS-based retrieval**.  
- **Knowledge Graph Integration** → Entities (ocean basins, floats, variables) + relations (spatio-temporal, causal).  
- **Hybrid Retrieval** → Semantic similarity + keyword matching + graph traversal.  
- **Agentic RAG Engine** → **LLM-driven reasoning loop** with self-correction.  
- **Validation Layer** → SQL syntax checks, hallucination filtering, and consistency enforcement.  
- **Visualization** → Interactive maps (Folium), time-series charts (Plotly), and structured summaries.  

---

## 🏗️ Architecture

**Pipeline:**  
`Data Sources → Ingestion → Embeddings + Graph → Hybrid Retrieval → RAG Agent → Validation → UI/Visualization`

- **Phase 1**: Ingestion of NetCDF/telemetry datasets  
- **Phase 2**: Embedding + Vector DB setup  
- **Phase 3**: Graph construction + hybrid retrieval  
- **Phase 4**: Agent pipeline + self-correction loop  
- **Phase 5**: Validation + Visualization  

---

## 👨‍💻 Team Roles

| Name        | Core Responsibility       | Technical Focus |
|-------------|---------------------------|-----------------|
| **Nandini** | **Frontend** & **Data Extraction** | User Interface (Streamlit/React) + Initial data parsing logic |
| **Dhairya** | **Data Extraction**       | **NetCDF** parsing using **xarray** |
| **Lakshya** | **Orchestrator** & **DB Design** | Pipeline coordination + **Schema design** (Vector & Graph DBs) |
| **Shreya**  | **Data Ingestion**        | Raw → DB pipelines, ensuring format consistency |
| **Pratyush**| **RAG Pipeline**          | **Retrieval-Augmented Generation** design |
| **Diya**    | **LLM Backend**           | LLM integration, prompt engineering, API management |

---

## ⚡ Quickstart

```bash
# Clone repository
git clone [(https://github.com/LAKSHYA1509/FloatChat-AI)](https://github.com/LAKSHYA1509/FloatChat-AI).git
cd FloatChat-AI
```

# Install dependencies
pip install -r requirements.txt

# Run prototype (example with Streamlit)
streamlit run ui/app.py

# Some Key things
Now in GitHub → Branches tab, you’ll see:

main (stable)

dev (integration)

feature/* branches (for each teammate).
