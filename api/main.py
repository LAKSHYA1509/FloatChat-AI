import sys
from pathlib import Path

# Add the parent directory to the path to allow imports from sibling packages
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from rag.graph import app as rag_graph
from blockchain.audit import log_to_chain
import uvicorn
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

app = FastAPI(
    title="FloatChat RAG API",
    description="Ocean data RAG API with blockchain audit trail.",
)

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
    # Blockchain audit fields — present on every successful query
    audit_hash: Optional[str] = None        # sha256:<hash> — reproducible by anyone
    tx_hash: Optional[str] = None           # on-chain TX hash
    polygonscan_url: Optional[str] = None   # direct link to verify on Amoy PolygonScan
    blockchain_error: Optional[str] = None  # graceful — never breaks the chat

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
    After a successful query, asynchronously logs an immutable audit
    record to the FloatChatAudit smart contract on Polygon Amoy testnet.
    The returned tx_hash can be verified at amoy.polygonscan.com.
    """
    try:
        initial_state = {
            "question": request.question,
            "retry_count": 0
        }

        # Run the RAG graph to completion
        final_state = await rag_graph.ainvoke(initial_state)

        sql_query  = final_state.get("sql_query")
        query_data = final_state.get("query_result") or []
        summary    = final_state.get("summary", "No summary generated.")
        val_error  = final_state.get("validation_error")

        # ── Blockchain Audit ──────────────────────────────────────────────
        # Only log if we actually got results (no point logging failed queries)
        audit_result = {"audit_hash": None, "tx_hash": None, "polygonscan_url": None, "error": None}
        if sql_query and query_data and not val_error:
            try:
                audit_result = await log_to_chain(
                    question=request.question,
                    sql=sql_query,
                    result=query_data
                )
            except Exception as audit_err:
                # Blockchain failure must NEVER break the chat response
                audit_result["error"] = f"Audit fire failed: {str(audit_err)}"
        # ─────────────────────────────────────────────────────────────────

        return QueryResponse(
            summary=summary,
            sql_query=sql_query,
            data=query_data if query_data else None,
            validation_error=val_error,
            audit_hash=audit_result.get("audit_hash"),
            tx_hash=audit_result.get("tx_hash"),
            polygonscan_url=audit_result.get("polygonscan_url"),
            blockchain_error=audit_result.get("error"),
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query/sql")
def run_sql(query: SQLQuery):
    """
    Direct SQL execution endpoint.
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
