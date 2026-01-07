from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from rag.graph import app as rag_graph
import uvicorn
import os

app = FastAPI(title="FloatChat RAG API")

class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    summary: str
    sql_query: Optional[str] = None
    data: Optional[List[Dict[str, Any]]] = None
    validation_error: Optional[str] = None

@app.get("/")
def health_check():
    return {"status": "ok", "service": "FloatChat RAG"}

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

if __name__ == "__main__":
    port = int(os.getenv("API_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
