import os
import pandas as pd
from rag.graph import app
from dotenv import load_dotenv

load_dotenv()

def main():
    print("--- FloatChat RAG Prototype ---")
    
    # Check for keys
    if not os.getenv("OPENROUTER_API_KEY") and not os.getenv("GROQ_API_KEY"):
        print("WARNING: No API keys found in .env. Please add OPENROUTER_API_KEY or GROQ_API_KEY.")
    
    #question = "What is the average adjusted temperature where pressure is more than 20 dbar?"
    question = "How many Profiles are there and what are their profile numbers?"
    print(f"\nUser Question: {question}")
    
    initial_state = {
        "question": question,
        # "context" is now retrieved dynamically by the first node
        "retry_count": 0
    }
    
    print("\nRunning pipeline...")
    try:
        # Stream the graph updates
        for output in app.stream(initial_state):
            for key, value in output.items():
                print(f"\nFinished Node: {key}")
                if "sql_query" in value:
                    print(f"Generated SQL: {value['sql_query']}")
                if "validation_error" in value and value["validation_error"]:
                    print(f"Validation Error: {value['validation_error']} (Retrying...)")
                if "query_result" in value:
                    print(f"Execution Result (Rows): {len(value['query_result'])}")
                if "summary" in value:
                    print(f"\n--- Final Summary ---\n{value['summary']}")
                    
    except Exception:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
