from langchain_core.prompts import ChatPromptTemplate

SQL_GEN_TEMPLATE = """You are an expert SQL developer for a PostgreSQL database storing Argo float oceanographic data.
Your goal is to generate a valid SQL query to answer the user's question, using the provided context and schema rules.

**Schema Information**:
{schema}

**Critical Rules**:
1. ALWAYS use `*_adjusted` columns for temperature (`temp_adjusted`) and salinity (`psal_adjusted`). NEVER use raw `temp` or `psal`.
2. check for quality control: `temp_qc = '1'` and `psal_qc = '1'` (1 means good data).
3. `pressure` is depth in dbar (0-10 is surface).
4. Do NOT use `lat` or `lon`, use `latitude` and `longitude`.
5. Return ONLY the SQL query, no markdown formatting (like ```sql), no explanation.

**Context**:
{context}

**User Question**:
{question}

**SQL Query**:
"""

SQL_FIX_TEMPLATE = """You are an expert SQL developer. The previous SQL query you generated was invalid.
Please fix it based on the error message.

**Original Question**: {question}
**Invalid SQL**: {sql_query}
**Error Message**: {error}

**Rules**:
- Fix the syntax or schema error.
- Return ONLY the corrected SQL query.
"""

SUMMARY_TEMPLATE = """You are a helpful oceanographer assistant.
Answer the user's question based on the provided data.

**Question**: {question}
**Data Results**:
{results}

**Instructions**:
- Summarize the findings in natural language.
- If the result is a single number, state it clearly.
- If the result is a table, describe the trends or key values.
"""

sql_gen_prompt = ChatPromptTemplate.from_template(SQL_GEN_TEMPLATE)
sql_fix_prompt = ChatPromptTemplate.from_template(SQL_FIX_TEMPLATE)
summary_prompt = ChatPromptTemplate.from_template(SUMMARY_TEMPLATE)
