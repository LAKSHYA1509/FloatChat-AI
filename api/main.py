import sys
from pathlib import Path

# Add the parent directory to the path to allow imports from sibling packages
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from rag.graph import app as rag_graph
import uvicorn
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

app = FastAPI(title="FloatChat RAG API")

# ── CORS — allow the React dev server (and any future domain) ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",   # fallback CRA port
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    summary: str
    sql_query: Optional[str] = None
    data: Optional[List[Dict[str, Any]]] = None
    validation_error: Optional[str] = None

class SQLQuery(BaseModel):
    sql: str

@app.get("/")
def health_check():
    return {"status": "ok", "service": "FloatChat RAG"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/query", response_model=QueryResponse)
async def run_query(request: QueryRequest):
    """
    Executes the RAG pipeline for a given question.
    """
    try:
        initial_state = {
            "question": request.question,
            "retry_count": 0
        }

        # Invoke the graph (run to completion)
        final_state = await rag_graph.ainvoke(initial_state)

        return QueryResponse(
            summary=final_state.get("summary", "No summary generated."),
            sql_query=final_state.get("sql_query"),
            data=final_state.get("query_result"),
            validation_error=final_state.get("validation_error")
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query/sql")
def run_sql(query: SQLQuery):
    """
    Direct SQL execution endpoint (from Lakshya's branch).
    Useful for testing and raw queries.
    """
    sql = query.sql.strip()

    if not sql.lower().startswith("select"):
        raise HTTPException(status_code=400, detail="Only SELECT queries allowed")

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        cur.execute(sql)
        rows = cur.fetchall()
        columns = [desc[0] for desc in cur.description]

        cur.close()
        conn.close()

        return {
            "columns": columns,
            "rows": rows
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("API_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
