import pandas as pd
import re
import os
import psycopg2
from typing import Dict, Any
from .state import AgentState
from .llm_provider import get_llm
from .prompts import sql_gen_prompt, sql_fix_prompt, summary_prompt
from langchain_core.output_parsers import StrOutputParser

# Initialize LLM (default to OpenRouter for generic logic, can be swapped)
# For prototype, we default to OpenRouter but user can change via env
llm = get_llm(provider="groq") 

from pydantic import BaseModel, Field
from .utils import get_schema_markdown

# Define Pydantic Model for Structured Output
class SQLOutput(BaseModel):
    sql_query: str = Field(description="The valid SQL query to execute")
    validation_thought: str = Field(description="Step by step reasoning for why this SQL is valid and safe")

from .retriever import get_retrieved_context

def retrieve(state: AgentState) -> AgentState:
    """
    Retrieves relevant context from the vector store.
    """
    question = state["question"]
    context = get_retrieved_context(question)
    return {"context": context}

def generate_sql(state: AgentState) -> AgentState:
    """
    Generates an SQL query based on the question and context.
    Uses Structured Output for robustness.
    """
    question = state["question"]
    context = state.get("context", "")
    retry_count = state.get("retry_count", 0)
    
    # Load Schema dynamically
    schema_text = get_schema_markdown()
    
    try:
        if state.get("validation_error"):
            # Fix mode - For fix, we simplify to string output for now or could force structure too
            # Let's keep fix simple string-based for robustness in case validation error is about structure
            chain = sql_fix_prompt | llm | StrOutputParser()
            response = chain.invoke({
                "question": question,
                "sql_query": state.get("sql_query", ""),
                "error": state["validation_error"]
            })
            sql = response.replace("```sql", "").replace("```", "").strip()
        else:
            # Generation mode - USE STRUCTURED OUTPUT
            structured_llm = llm.with_structured_output(SQLOutput)
            chain = sql_gen_prompt | structured_llm
            
            response = chain.invoke({
                "question": question,
                "context": context,
                "schema": schema_text
            })
            sql = response.sql_query
        
        return {"sql_query": sql, "validation_error": None}
    
    except Exception as e:
        return {
            "sql_query": state.get("sql_query", ""), 
            "validation_error": f"LLM Generation Error: {str(e)}", 
            "retry_count": retry_count + 1
        }

def validate_sql(state: AgentState) -> AgentState:
    """
    Validates the generated SQL for safety and syntax (basic).
    """
    sql = state["sql_query"].upper()
    
    # 1. Safety check
    forbidden = ["DELETE", "DROP", "INSERT", "UPDATE", "ALTER", "TRUNCATE"]
    for word in forbidden:
        if word in sql:
            return {
                "validation_error": f"Security Error: Forbidden keyword '{word}' detected.",
                "retry_count": state["retry_count"] + 1
            }
    
    # 2. Basic Syntax/Schema Logic (Mocking a dry-run parser)
    if not sql.startswith("SELECT"):
         return {
            "validation_error": "Syntax Error: Query must start with SELECT.",
            "retry_count": state["retry_count"] + 1
        }
    
    # 3. Check for specific schema rules mentioned in prompt
    # 3. Check for specific schema rules using Regex to avoid False Positives
    # We want to ban raw "TEMP" but allow "TEMP_ADJUSTED" and "TEMP_QC"
    # \b matches word boundary. 
    # re.search(r"\bTEMP\b", "TEMP_QC") -> False
    # re.search(r"\bTEMP\b", "TEMP") -> True
    
    if re.search(r"\bTEMP\b", sql):
         return {
            "validation_error": "Schema Error: Must use TEMP_ADJUSTED, not raw TEMP.",
             "retry_count": state["retry_count"] + 1
        }
    
    if re.search(r"\bPSAL\b", sql):
         return {
            "validation_error": "Schema Error: Must use PSAL_ADJUSTED, not raw PSAL.",
             "retry_count": state["retry_count"] + 1
        }
    
    return {"validation_error": None}

def execute_sql(state: AgentState) -> AgentState:
    """
    Executes the valid SQL against the PostgreSQL database.
    """
    sql = state["sql_query"]
    print(f"DEBUG: Executing SQL: {sql}")
    
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        return {
            "validation_error": "Configuration Error: DATABASE_URL not found in .env.",
            "retry_count": state["retry_count"] + 1
        }

    try:
        # Connect to the database
        conn = psycopg2.connect(db_url, sslmode='require')
        cursor = conn.cursor()
        
        # Execute
        cursor.execute(sql)
        
        # Fetch results
        if cursor.description:
            columns = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            
            # Convert to list of dicts for the state
            results = []
            for row in rows:
                results.append(dict(zip(columns, row)))
        else:
            # For non-SELECT queries (though we validated against them, just in case)
            results = [{"status": "success", "rows_affected": cursor.rowcount}]
            
        cursor.close()
        conn.close()
            
        return {"query_result": results}
        
    except Exception as e:
        return {"validation_error": f"Database Execution Error: {str(e)}", "retry_count": state["retry_count"] + 1}

def summarize(state: AgentState) -> AgentState:
    """
    Summarizes the results into natural language.
    """
    question = state["question"]
    results = state.get("query_result")
    
    if not results:
        return {"summary": "I could not generate a summary because the database execution failed or returned no results."}
    
    # Convert list of dicts to string or DataFrame string for LLM
    df = pd.DataFrame(results)
    data_str = df.to_markdown()
    
    try:
        chain = summary_prompt | llm | StrOutputParser()
        summary = chain.invoke({
            "question": question,
            "results": data_str
        })
        return {"summary": summary}
        
    except Exception as e:
        return {"summary": f"Error generating summary: {str(e)}"}
