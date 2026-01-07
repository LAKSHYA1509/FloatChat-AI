import os

def get_schema_markdown() -> str:
    """
    Reads the schema.md file from the project root.
    """
    # Prefer rag/corpus/schema.md if it existed based on README, but user has it at root 
    # based on the download info. We check root first.
    root_schema_path = os.path.join(os.getcwd(), "schema.md")
    
    if os.path.exists(root_schema_path):
        with open(root_schema_path, "r", encoding="utf-8") as f:
            return f.read()
            
    # Fallback to default/hardcoded string if file missing (safeguard)
    return """
    (Fallback Schema)
    - argo_profiles (id, wmo_id, cycle_number, latitude, longitude, profile_datetime, data_mode)
    - argo_measurements (id, profile_id, pressure, temp_adjusted, psal_adjusted, temp_qc, psal_qc)
    """
