# FloatChat RAG Pipeline Prototype

## 🌊 Overview
This is a robust **Agentic RAG (Retrieval-Augmented Generation) Pipeline** designed for querying oceanographic Argo float data. It translates natural language questions into valid SQL queries, executes them against a **Supabase PostgreSQL** database, and validates the results to prevent errors/hallucinations.

**Key Features:**
-   **Agentic Graph**: Uses `LangGraph` for a cyclical workflow (Retrieve -> Generate -> Validate -> Execute -> Retry).
-   **Self-Correction**: Automatically fixes SQL errors (Syntax, Schema, or Missing Columns) by feeding error messages back to the LLM.
-   **Hybrid Retrieval**: Combines Vector Search (FAISS) for documentation with Structured SQL execution.
-   **Safety**: Regex-based keyword banning and Pydantic structured output.
-   **Interface**: Includes a FastAPI Backend and a Streamlit Frontend.

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
.\venv\Scripts\activate

# Activate (Mac/Linux)
# source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt
```

### 2. Configure Credentials
Create a `.env` file in the root directory:

```env
# LLM Provider (Groq Recommended for speed)
GROQ_API_KEY=gsk_...

# Database Connection (Supabase Transaction Pooler - Port 6543)
DATABASE_URL=postgresql://postgres.user:password@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require
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

## 🧠 Architecture & Code Walkthrough

The core logic resides in `rag/` and works as follows:

### 1. Retrieval (`nodes.py` -> `retriever.py`)
```python
def retrieve(state):
    question = state["question"]
    # Semantic search in FAISS for Schema/QC Rules
    context = get_retrieved_context(question)
    return {"context": context}
```
*Ensures the LLM knows about `temp_qc` flags and table joins before generating SQL.*

### 2. Generation & Structured Output (`nodes.py`)
We use **Pydantic** to force the LLM to return valid JSON, preventing parsing errors.
```python
class SQLOutput(BaseModel):
    sql_query: str
    validation_thought: str

structured_llm = llm.with_structured_output(SQLOutput)
```

### 3. Validation & Safety (`nodes.py`)
We strictly enforce schema rules using Regex.
```python
if re.search(r"\bTEMP\b", sql):
    return {"validation_error": "Must use TEMP_ADJUSTED, not raw TEMP."}
```
*This prevents scientific errors by banning raw sensor data.*

### 4. Self-Correction Loop (`graph.py`)
If validation fails OR database execution fails, the graph cycles back!
```python
workflow.add_conditional_edges(
    "execute_sql",
    condition_check,
    {
        "retry": "generate_sql",  # <--- Feedback Loop
        "continue": "summarize"
    }
)
```
*If a query fails (e.g., "Missing Group By"), the error is sent back to the LLM to fix.*

---

## 🛠️ Future Improvements

To take this from Prototype to Production:

### 1. Chat History (Memory)
**Current**: The `AgentState` is stateless; it forgets previous turns.
**Improvement**: Add `chat_history: List[Message]` to `AgentState`. Pass this to the prompt so users can ask "Plot that result".

### 2. Advanced Security
**Current**: Regex keyword blocking.
**Improvement**: Use **`sqlglot`** to parse the SQL Abstract Syntax Tree (AST). Programmatically verify that the query is a read-only `SELECT` and attempts no schema modification.

### 3. Richer Corpus
**Current**: Markdown files (`schema.md`).
**Improvement**: Ingest PDF Technical Manuals or crawl the Argo website. Store metadata (e.g., "Table 1 constraints") in the Vector DB for better retrieval context.

### 4. Evaluation
**Current**: Manual testing.
**Improvement**: Integrate **Ragas** framework to automatically score "Answer Relevancy" and "Faithfulness" against a golden dataset of Questions/SQL pairs.

---
*Built with ❤️ for FloatChat AI*
