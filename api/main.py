import os
import psycopg2
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Data Testing ke liye API banayi hai Taaki SQL Queries run kar sakein
app = FastAPI(title="testing-api")


class SQLQuery(BaseModel):
    sql: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/query/sql")
def run_sql(query: SQLQuery):
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
