# 💬 FloatChat: Retrieval-Augmented Generation for Oceanographic Data

**Production-Ready RAG System for Argo Float Data with Vector Embedding & SQL Query Pipeline**

---

## 📖 Project Overview

**FloatChat** is a fully integrated **Retrieval-Augmented Generation (RAG)** system for oceanographic data, specifically designed to handle **Argo float telemetry** stored in **NetCDF format**. The system combines:

- **NetCDF Data Ingestion**: Parse and normalize Argo float measurements
- **PostgreSQL Database**: Structured storage with schema-based fact storage
- **Vector Embeddings & FAISS**: Semantic document retrieval
- **FastAPI Backend**: SQL query execution API
- **Hybrid Retrieval**: Semantic search + quality control filtering + symbolic reasoning

The system is **production-ready** and designed so RAG developers can **replicate the entire pipeline independently** without additional support.

---

## 🏗️ System Architecture

```
Data Sources (NetCDF)
        ↓
[Data Ingestion Layer] → Parse & QC checks via xarray
        ↓
PostgreSQL Database ← Structured Facts
        ↓
[RAG Pipeline] ← Semantic Corpus + Vector Index
        ↓
FastAPI Backend → SQL Query Execution
        ↓
User Queries ← Hybrid Retrieval (Vector + SQL)
```

---

## 📦 Project Structure

```
FloatChat-AI/
├── README.MD                 ← This file (complete setup & usage guide)
├── api/
│   └── main.py              ← FastAPI backend for SQL execution
├── data/
│   ├── D1900063_079.nc      ← Argo float NetCDF file 1
│   ├── D5901153_260.nc      ← Argo float NetCDF file 2
│   └── R2902273_135.nc      ← Argo float NetCDF file 3
├── db/
│   ├── schema.sql           ← PostgreSQL table definitions
│   └── db.md                ← Database documentation
├── ingestion/
│   └── load_single_argo.py  ← ETL script: NetCDF → PostgreSQL
├── rag/
│   ├── build_index.py       ← FAISS index builder
│   ├── faiss_index/         ← Pre-built semantic index
│   └── corpus/              ← Semantic documentation
│       ├── qc_rules.md      ← Data quality control guidelines
│       ├── schema.md        ← Database schema in natural language
│       └── sql_patterns.md  ← Common SQL query patterns
└── sql_examples/
    └── canonical_queries.sql ← Pre-built SQL examples

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

**Key Facts**:
- One row per Argo float profile
- Links to measurements via `id`
- `data_mode = 'D'` is preferred (expert quality controlled)

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

**Key Facts**:
- Multiple rows per profile (one per depth level)
- Always use `*_ADJUSTED` variables, never raw variables
- QC flag `'1'` means data is reliable
- One profile can have 100+ measurements

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

### **Step 1: Set Up PostgreSQL Database (Supabase)**

#### **Option A: Supabase (Recommended - Already Running)**

Your database is already running on Supabase using **Transaction Pooler** (recommended for applications).

Connection string:
```
postgresql://postgres.piaxaqdzmksubyxeiskv:TGFAMTUwOTAz@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
```

Load the schema:
```bash
# Using the Transaction Pooler connection string
psql "postgresql://postgres.piaxaqdzmksubyxeiskv:TGFAMTUwOTAz@aws-1-ap-south-1.pooler.supabase.com:6543/postgres" < db/schema.sql

# Verify tables were created
psql "postgresql://postgres.piaxaqdzmksubyxeiskv:TGFAMTUwOTAz@aws-1-ap-south-1.pooler.supabase.com:6543/postgres" -c "\dt"
```

#### **Option B: Local PostgreSQL (For Development Only)**

```bash
# Create the database and load schema
psql -h localhost -U postgres -d floatchat < db/schema.sql

# Verify tables were created
psql -h localhost -U postgres -d floatchat -c "\dt"
```

### **Step 2: Configure Environment**

Create `.env` file in the root directory:

**For Supabase (Transaction Pooler - Recommended):**
```
DATABASE_URL=postgresql://postgres.piaxaqdzmksubyxeiskv:TGFAMTUwOTAz@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
```

**For Local PostgreSQL:**
```
DATABASE_URL=postgresql://user:password@localhost:5432/floatchat
```

⚠️ **Important for Supabase**: 
- Using Transaction Pooler for optimal connection pooling
- Connection endpoint: `aws-1-ap-south-1.pooler.supabase.com:6543`
- This is different from direct connection which uses `db.[SUPABASE_ID].supabase.co:5432`
- Transaction Pooler is recommended for applications and microservices

### **Step 3: Run the Data Ingestion Script**

```bash
# Install dependencies
pip install xarray psycopg2-binary python-dotenv

# Ingest a single NetCDF file
python ingestion/load_single_argo.py

# Expected output:
# Ingested profile 1 with 127 measurements
```

**What the script does**:
1. Opens NetCDF file using `xarray`
2. Extracts profile metadata (lat, lon, timestamp, WMO ID)
3. Validates that adjusted variables exist
4. Filters measurements using QC flags (only `'1'` = good data)
5. Inserts profile into `argo_profiles`
6. Inserts measurements into `argo_measurements` (typically 100-200 rows)

**To ingest multiple files**:
Edit `ingestion/load_single_argo.py` to loop over files in `data/` directory.

---

## 🔍 RAG (Retrieval-Augmented Generation) Setup

### **What is the Semantic Corpus?**

The system uses **domain-specific documentation** that gets embedded and indexed. Three key documents:

#### 1. **qc_rules.md** - Data Quality Control Rules
```markdown
- QC flag '1' = good, reliable data
- QC flag other than '1' = do not use
- Prefer 'D' mode (delayed) over 'R' mode (real-time)
- Always use ADJUSTED variables, never raw variables
```

#### 2. **schema.md** - Database Schema in Natural Language
Explains what each table and column means in scientific context.

#### 3. **sql_patterns.md** - Common Query Patterns
Example patterns for:
- Surface measurements (pressure < 10 dbar)
- Deep ocean (pressure > 1000 dbar)
- Regional queries (latitude/longitude filtering)
- Temporal queries (time-based filtering)

### **Step 1: Build FAISS Index**

```bash
# Install dependencies
pip install sentence-transformers faiss-cpu

# Build the semantic index
python rag/build_index.py

# Creates: rag/faiss_index/index.bin (semantic embedding index)
```

**What it does**:
1. Reads all `.md` files from `rag/corpus/`
2. Encodes them using `all-MiniLM-L6-v2` (384-dim embeddings)
3. Creates FAISS index for fast semantic search
4. Stores index at `rag/faiss_index/index.bin`

### **Step 2: Using the FAISS Index for Semantic Retrieval**

```python
from sentence_transformers import SentenceTransformer
import faiss

# Load model and index
model = SentenceTransformer("all-MiniLM-L6-v2")
index = faiss.read_index("rag/faiss_index/index.bin")

# User question
query = "What does QC flag 1 mean?"

# Encode and search
query_embedding = model.encode([query])
distances, indices = index.search(query_embedding, k=1)

# Retrieve relevant documentation
print(f"Most relevant doc index: {indices[0][0]}")
print(f"Similarity distance: {distances[0][0]}")
```

---

## 🚀 FastAPI Backend Setup

### **Purpose**
Provides a safe, controlled API for executing SQL queries against the PostgreSQL database.

### **Step 1: Install Dependencies**

```bash
pip install fastapi uvicorn psycopg2-binary python-dotenv
```

### **Step 2: Start the Server**

```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000
```

Server starts at: `http://localhost:8000`

### **Step 3: Health Check**

```bash
curl http://localhost:8000/health
# Response: {"status": "ok"}
```

### **Step 4: Execute SQL Query**

**Endpoint**: `POST /query/sql`

**Request**:
```json
{
  "sql": "SELECT COUNT(*) as total_profiles FROM argo_profiles"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:8000/query/sql \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT COUNT(*) FROM argo_profiles"}'
```

**Response**:
```json
{
  "columns": ["count"],
  "rows": [[3]]
}
```

### **Security**
- ✅ Only `SELECT` queries allowed
- ✅ Rejects `INSERT`, `DELETE`, `UPDATE` queries
- ✅ Exception handling for malformed SQL

---

## 📊 Common Queries (Copy-Paste Ready)

All queries are in `sql_examples/canonical_queries.sql`

### **1. Count Total Profiles**
```sql
SELECT COUNT(*) AS total_profiles FROM argo_profiles;
```

### **2. Count Total Measurements**
```sql
SELECT COUNT(*) AS total_measurements FROM argo_measurements;
```

### **3. Average Surface Temperature (0-10 dbar)**
```sql
SELECT AVG(m.temp_adjusted) AS avg_surface_temp
FROM argo_measurements m
WHERE m.pressure < 10;
```

### **4. Average Salinity at Surface**
```sql
SELECT AVG(m.psal_adjusted) AS avg_surface_salinity
FROM argo_measurements m
WHERE m.pressure < 10;
```

### **5. Temperature Profile for One Cycle**
```sql
SELECT m.pressure, m.temp_adjusted
FROM argo_measurements m
JOIN argo_profiles p ON p.id = m.profile_id
WHERE p.cycle_number = 1
ORDER BY m.pressure;
```

### **6. Profiles in a Geographic Region**
```sql
SELECT COUNT(*) AS profiles_in_region
FROM argo_profiles
WHERE latitude BETWEEN 10 AND 20
  AND longitude BETWEEN 70 AND 90;
```

### **7. Deep Ocean Temperature (>1000 dbar)**
```sql
SELECT AVG(m.temp_adjusted) AS deep_ocean_temp
FROM argo_measurements m
WHERE m.pressure > 1000;
```

### **8. Number of Delayed-Mode Profiles (High Quality)**
```sql
SELECT COUNT(*) AS delayed_mode_profiles
FROM argo_profiles
WHERE data_mode = 'D';
```

---

## 🎯 Complete Replication Checklist for RAG Developers

Follow this **exact sequence** to replicate the entire system from scratch:

### **Phase 1: Database Setup (10 minutes - Supabase)**

**Supabase (You already have this running):**
- [ ] Get Supabase connection string from Project Settings → Database
- [ ] Create `.env` with `DATABASE_URL` (Supabase URL)
- [ ] Run schema: `psql "YOUR_SUPABASE_URL" < db/schema.sql`
- [ ] Verify tables: `psql "YOUR_SUPABASE_URL" -c "\dt"`

**OR Local PostgreSQL (If developing locally):**
- [ ] Install PostgreSQL
- [ ] Create database: `createdb floatchat`
- [ ] Run schema: `psql -d floatchat < db/schema.sql`
- [ ] Verify tables: `psql -d floatchat -c "\dt"`

### **Phase 2: Environment Configuration (5 minutes)**
- [ ] Create `.env` with `DATABASE_URL` (Supabase or local)
- [ ] Test connection: `psql $DATABASE_URL -c "SELECT 1"`

### **Phase 3: Data Ingestion (10 minutes)**
- [ ] Install dependencies: `pip install xarray psycopg2-binary python-dotenv`
- [ ] Run ingestion: `python ingestion/load_single_argo.py`
- [ ] Verify data: `psql $DATABASE_URL -c "SELECT COUNT(*) FROM argo_profiles"`

### **Phase 4: Vector Index (5 minutes)**
- [ ] Install dependencies: `pip install sentence-transformers faiss-cpu`
- [ ] Build index: `python rag/build_index.py`
- [ ] Verify: Check `rag/faiss_index/index.bin` exists

### **Phase 5: FastAPI Backend (5 minutes)**
- [ ] Install dependencies: `pip install fastapi uvicorn psycopg2-binary`
- [ ] Start server: `uvicorn api.main:app --reload`
- [ ] Test health: `curl http://localhost:8000/health`

### **Phase 6: Test RAG Queries (10 minutes)**
- [ ] Test SQL endpoint with example query
- [ ] Test FAISS semantic search
- [ ] Run canonical queries from `sql_examples/`

**Total time to full replication: ~45 minutes**

---

## 🔑 Key Concepts for RAG Developers

### **NetCDF (Network Common Data Form)**
- Binary format for storing scientific multi-dimensional data
- Argo floats store telemetry in NetCDF files
- Parsed using **xarray** library in Python
- Variables include: `PRES_ADJUSTED`, `TEMP_ADJUSTED`, `PSAL_ADJUSTED`, etc.

### **Quality Control (QC) Flags**
- Every measurement has a QC flag (value = '1', '2', '3', etc.)
- **'1'** = Good data, safe to use
- **'2'** = Probably good
- **'3'** and higher = Suspicious or bad data
- **Rule**: Only use measurements where `temp_qc = '1' AND psal_qc = '1'`

### **Data Mode**
- **'D' (Delayed)**: Expert quality controlled, published months later (preferred)
- **'R' (Real-time)**: Automated QC only, available within hours (lower quality)
- **'A' (Adjusted)**: Final quality-controlled version

### **Pressure = Depth**
- Measured in decibars (dbar)
- 1 dbar ≈ 1 meter of water depth
- Surface: 0-10 dbar
- Deep ocean: >1000 dbar

### **Adjusted vs Raw Variables**
- **Raw** (TEMP, PSAL): Direct sensor readings (NOT for science)
- **Adjusted** (TEMP_ADJUSTED, PSAL_ADJUSTED): Scientifically corrected (always use these)

---

## 🛠️ Troubleshooting Guide

### **Problem: "DatabaseError: connection failed"**
```
Solution:
1. Check DATABASE_URL is correct in .env
2. For Supabase: Verify credentials in Supabase Console
3. Test connection: psql $DATABASE_URL -c "SELECT 1"
4. If using Supabase: Check IP whitelist in Database Settings
```

### **Problem: "psycopg2.OperationalError: SSL CERTIFICATE_VERIFY_FAILED" (Supabase)**
```
Solution:
This is common with Supabase SSL connections. Modify ingestion/load_single_argo.py:

import psycopg2

# Change this:
conn = psycopg2.connect(DB_URL)

# To this:
conn = psycopg2.connect(DB_URL, sslmode='require')
```

### **Problem: "authentication failed for user 'postgres'" (Supabase)**
```
Solution:
1. Go to Supabase Console → Settings → Database → Connection Pooling
2. Make sure you're using Transaction mode (not Session mode)
3. Copy the correct PostgreSQL Connection String from the pooler
4. Format: postgresql://postgres.PROJECTREF:PASSWORD@aws-REGION.pooler.supabase.com:6543/postgres
5. Ensure password is URL-encoded if it contains special characters
6. Use port 6543 (not 5432) for the pooler
```

### **Problem: "ModuleNotFoundError: No module named 'xarray'"**
```
Solution:
pip install xarray psycopg2-binary sentence-transformers faiss-cpu
```

### **Problem: "FAISS index not found"**
```
Solution:
python rag/build_index.py
# Wait for it to complete (creates rag/faiss_index/index.bin)
```

### **Problem: "500 Internal Server Error" from API**
```
Solution:
1. Check DATABASE_URL is correct
2. Test PostgreSQL connection: psql $DATABASE_URL -c "SELECT 1"
3. If using Supabase: Check IP whitelist
4. Check logs: Look for error messages in terminal
5. Restart API server
```

### **Problem: "Missing adjusted variables" during ingestion**
```
Solution:
The NetCDF file doesn't have adjusted variables.
Ensure you're using Argo files with TEMP_ADJUSTED, PSAL_ADJUSTED, PRES_ADJUSTED
```

---

## 📚 Documentation Files

All documentation is in the `rag/corpus/` directory (used for semantic search):

| File | Purpose |
|------|---------|
| `qc_rules.md` | Data quality control principles |
| `schema.md` | Database table and column meanings |
| `sql_patterns.md` | Common scientific query patterns |

---

## 🎓 For RAG Developers: Key Integration Points

### **1. Vector Retrieval (FAISS)**
```python
# This is where semantic search happens
# Documents from rag/corpus/ are indexed
# Use for: "What are the QC rules?" → retrieves qc_rules.md
```

### **2. Database Queries (PostgreSQL)**
```python
# This is where facts are stored
# Use for: "Show me average temperature" → executes SQL
# Endpoint: POST /query/sql (FastAPI)
```

### **3. Hybrid Retrieval**
```python
# Combine vector search + SQL queries:
# 1. User asks: "What's the average surface temperature?"
# 2. Semantic search → finds sql_patterns.md (surface query)
# 3. Generate SQL query from pattern
# 4. Execute via FastAPI → get results
```

---

## 📝 Environment Variables

Create `.env` in project root:

**For Supabase (Cloud Database - Transaction Pooler):**
```
DATABASE_URL=postgresql://postgres.piaxaqdzmksubyxeiskv:TGFAMTUwOTAz@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
FAISS_INDEX_PATH=rag/faiss_index/index.bin
CORPUS_PATH=rag/corpus/
EMBEDDING_MODEL=all-MiniLM-L6-v2
API_HOST=0.0.0.0
API_PORT=8000
```

**For Local PostgreSQL (Development):**
```
DATABASE_URL=postgresql://user:password@localhost:5432/floatchat
FAISS_INDEX_PATH=rag/faiss_index/index.bin
CORPUS_PATH=rag/corpus/
EMBEDDING_MODEL=all-MiniLM-L6-v2
API_HOST=0.0.0.0
API_PORT=8000
```

**How to get Supabase Transaction Pooler credentials:**
1. Go to [Supabase Console](https://supabase.com/dashboard)
2. Select your project
3. Settings → Database → Connection Pooling
4. Select "Transaction mode" (recommended for applications)
5. Copy the PostgreSQL connection string from the pooler endpoint
6. This uses a different host (`pooler.supabase.com` instead of `db.supabase.co`) and port `6543` instead of `5432`

---

## 🚀 Quick Start (5-Minute Demo)

**Assuming you have Supabase running:**

```bash
# 1. Setup
pip install -r requirements.txt
# (Create requirements.txt with all dependencies above)

# 2. Configure (using Transaction Pooler)
echo "DATABASE_URL=postgresql://postgres.piaxaqdzmksubyxeiskv:TGFAMTUwOTAz@aws-1-ap-south-1.pooler.supabase.com:6543/postgres" > .env

# 3. Create schema (using Supabase connection)
psql $DATABASE_URL < db/schema.sql

# 4. Ingest data
python ingestion/load_single_argo.py

# 5. Build FAISS index
python rag/build_index.py

# 6. Start API
uvicorn api.main:app --reload

# 7. Test (in another terminal)
curl -X POST http://localhost:8000/query/sql \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT COUNT(*) FROM argo_profiles"}'
```

---

## 📞 Support & Next Steps

**This documentation is complete and self-contained.** All RAG developers should be able to:

✅ Set up the entire system independently  
✅ Understand the data flow and architecture  
✅ Execute queries and retrieve semantic information  
✅ Extend with new functionality  
✅ Debug issues using the troubleshooting guide  

**No additional contact needed.** All information is in this README and the linked documentation files.

---

## 📄 License

See `LICENSE` file in repository root.

---

**Last Updated**: December 30, 2025  
**System Status**: Production-Ready  
**Documentation Status**: Complete
