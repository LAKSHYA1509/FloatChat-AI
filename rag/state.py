from typing import TypedDict, Optional, List, Any
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    """
    State for the FloatChat RAG pipeline.
    """
    question: str
    context: str  # Retrieved context from vector DB (mocked for now)
    sql_query: Optional[str]
    validation_error: Optional[str]
    query_result: Optional[List[dict]]  # Result from SQL execution
    summary: Optional[str]
    retry_count: int = 0
