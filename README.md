# 💬 FloatChat: Retrieval-Augmented Generation for Oceanographic Data

**Production-Ready Agentic RAG System for Argo Float Data with Vector Embedding & SQL Query Pipeline**

---

## 📖 Project Overview

**FloatChat** is a robust **Agentic RAG (Retrieval-Augmented Generation) Pipeline** designed for querying oceanographic Argo float data. It translates natural language questions into valid SQL queries, executes them against a **Supabase PostgreSQL** database, and validates the results to prevent errors/hallucinations.

The system combines:
- **NetCDF Data Ingestion**: Parse and normalize Argo float measurements
- **PostgreSQL Database**: Structured storage with schema-based fact storage
- **Agentic Graph**: Uses `LangGraph` for a cyclical workflow (Retrieve -> Generate -> Validate -> Execute -> Retry)
- **Self-Correction**: Automatically fixes SQL errors (Syntax, Schema, or Missing Columns) by feeding error messages back to the LLM
- **Vector Embeddings & FAISS**: Semantic document retrieval
- **Hybrid Retrieval**: Semantic search + quality control filtering + symbolic reasoning
- **Interfaces**: FastAPI Backend and Streamlit Frontend

---

## 🏗️ System Architecture

```
User Query
    ↓
[Agentic RAG Graph] ↻ (Retrieve -> Generate -> Validate -> Execute -> Retry)
    ↓
    ├── Retrieval: FAISS Semantic Search (Schema/QC Rules)
    ├── Generation: LLM (Groq) -> Structured SQL
    ├── Validation: Regex Safety & Schema Checks
    └── Execution: PostgreSQL Database (Supabase)
    ↓
Final Answer (Summary + Data)
```

The core logic resides in `rag/` and works as follows:

### 1. Retrieval (`nodes.py` -> `retriever.py`)
Ensures the LLM knows about `temp_qc` flags and table joins before generating SQL by performing semantic search in FAISS for Schema/QC Rules.

### 2. Generation & Structured Output (`nodes.py`)
Uses **Pydantic** to force the LLM to return valid JSON, preventing parsing errors.

### 3. Validation & Safety (`nodes.py`)
Strictly enforces schema rules using Regex. For example, it prevents scientific errors by banning raw sensor data (`TEMP` vs `TEMP_ADJUSTED`).

### 4. Self-Correction Loop (`graph.py`)
If validation fails OR database execution fails, the graph cycles back. If a query fails (e.g., "Missing Group By"), the error is sent back to the LLM to fix.

---

## 📦 Project Structure

```
FloatChat-AI/
├── README.MD                 ← This file (complete setup & usage guide)
├── api/
│   └── main.py              ← FastAPI backend
├── data/                    ← Argo float NetCDF files
├── db/
│   ├── schema.sql           ← PostgreSQL table definitions
│   └── db.md                ← Database documentation
├── ingestion/
│   └── load_single_argo.py  ← ETL script: NetCDF → PostgreSQL
├── rag/
│   ├── build_index.py       ← FAISS index builder
│   ├── faiss_index/         ← Pre-built semantic index
│   ├── corpus/              ← Semantic documentation
│   │   ├── qc_rules.md
│   │   ├── schema.md
│   │   └── sql_patterns.md
│   ├── nodes.py             ← Graph nodes (Generate, Execute, Validate)
│   ├── graph.py             ← LangGraph workflow definition
│   └── state.py             ← Agent state definition
├── sql_examples/
    └── canonical_queries.sql ← Pre-built SQL examples
├── streamlit_app.py         ← Frontend UI
├── main_prototype.py        ← CLI Prototype
└── requirements.txt         ← Project dependencies
```

---

## 🚀 Deployment Guide

### Prerequisites
-   Python 3.10+
-   Git
-   A `.env` file with your API keys.

### 1. Setup Environment
Cloning and setting up the virtual environment:

```bash
# Clone the repository (if you haven't)
# git clone <repo_url>

# Create Virtual Environment
python -m venv venv

# Activate (Windows)
# .\venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt
```

### 2. Configure Credentials
Create a `.env` file in the root directory:

```env
# LLM Provider (Groq Recommended for speed)
GROQ_API_KEY=gsk_...

# Database Connection (Supabase Transaction Pooler - Port 6543)
DATABASE_URL=postgresql://postgres.piaxaqdzmksubyxeiskv:TGFAMTUwOTAz@aws-1-ap-south-1.pooler.supabase.com:6543/postgres

# Environment Configuration
FAISS_INDEX_PATH=rag/faiss_index/index.bin
CORPUS_PATH=rag/corpus/
EMBEDDING_MODEL=all-MiniLM-L6-v2
```

### 3. Build Knowledge Index
The agent uses a vector index to understand the database schema and quality control rules. You must build this index once before running:

```bash
python rag/build_index.py
```
*This reads from `rag/corpus/*.md` and saves to `rag/faiss_index/`.*

### 4. Run the Application
You have two ways to run the system:

#### Option A: Full Web Stack (Recommended)
**Terminal 1 (Backend API):**
```bash
python -m api.main
```
*Runs at http://localhost:8000*

**Terminal 2 (Frontend UI):**
```bash
streamlit run streamlit_app.py
```
*Opens browser at http://localhost:8501*

#### Option B: CLI Prototype (Debug)
```bash
python main_prototype.py
```

---

## 🧪 Testing the System

### 1. Direct SQL Endpoint (FastAPI)
Use this to execute raw SQL queries against the database (replicating Lakshya's original functionality).

**Endpoint**: `POST /query/sql`

```bash
curl -X POST http://localhost:8000/query/sql \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT COUNT(*) FROM argo_profiles"}'
```

### 2. RAG Agent Endpoint
Use this to ask natural language questions. The agent will retrieve schema info, generate SQL, validate it, and execute it.

**Endpoint**: `POST /query`

```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "How many Argo profiles are there?"}'
```

**Response**:
```json
{
  "summary": "There are 127 Argo profiles in the database.",
  "sql_query": "SELECT COUNT(*) FROM argo_profiles",
  "data": [{"count": 127}],
  "validation_error": null
}
```

---

## 🗄️ Database Schema

### **argo_profiles** Table
Stores metadata for each Argo float profile (vertical measurement cycle).

```sql
CREATE TABLE argo_profiles (
    id SERIAL PRIMARY KEY,
    wmo_id INTEGER NOT NULL,              -- World Meteorological Organization ID
    cycle_number INTEGER NOT NULL,         -- Profile cycle number
    profile_datetime TIMESTAMP NOT NULL,   -- When the profile was recorded
    latitude DOUBLE PRECISION NOT NULL,    -- Geographic location
    longitude DOUBLE PRECISION NOT NULL,
    data_mode CHAR(1),                     -- 'R' (real-time) or 'D' (delayed)
    source_file TEXT                       -- Original NetCDF filename
);
```

### **argo_measurements** Table
Stores detailed vertical measurements at different pressures.

```sql
CREATE TABLE argo_measurements (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER REFERENCES argo_profiles(id),
    pressure DOUBLE PRECISION NOT NULL,    -- Depth in decibars (higher = deeper)
    temp_adjusted DOUBLE PRECISION,        -- Temperature (°C) - scientifically corrected
    psal_adjusted DOUBLE PRECISION,        -- Salinity - scientifically corrected
    temp_qc CHAR(1),                       -- Quality control flag (1 = good)
    psal_qc CHAR(1)
);
```

### **argo_metadata** Table
Key-value storage for system metadata.

```sql
CREATE TABLE argo_metadata (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT
);
```

---

## 🔄 Data Ingestion Pipeline

To ingest data into the database:

1.  **Set Up Database**: Run schema creation script (already done on Supabase).
    ```bash
    psql $DATABASE_URL < db/schema.sql
    ```
2.  **Run Ingestion**:
    ```bash
    python ingestion/load_single_argo.py
    ```

---

## 📊 Common Queries

All queries are in `sql_examples/canonical_queries.sql`

Example: **Average Surface Temperature (0-10 dbar)**
```sql
SELECT AVG(m.temp_adjusted) AS avg_surface_temp
FROM argo_measurements m
WHERE m.pressure < 10;
```

---

## 🛠️ Troubleshooting Guide

### **Problem: "DatabaseError: connection failed"**
```
Solution:
1. Check DATABASE_URL is correct in .env
2. Test connection: psql $DATABASE_URL -c "SELECT 1"
```

### **Problem: "psycopg2.OperationalError: SSL CERTIFICATE_VERIFY_FAILED"**
```
Solution:
Modify code to use `sslmode='require'` in psycopg2 connection.
```

### **Problem: "FAISS index not found"**
```
Solution:
python rag/build_index.py
```

---

## 📄 License

See `LICENSE` file in repository root.

