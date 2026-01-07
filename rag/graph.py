from langgraph.graph import StateGraph, END
from .state import AgentState
from .nodes import generate_sql, validate_sql, execute_sql, summarize, retrieve

def condition_check(state: AgentState):
    """
    Decides the next node based on validation error.
    """
    if state.get("validation_error"):
        if state["retry_count"] > 3:  # Max retries
            return "end" # Or handle failure gracefully
        return "retry"
    return "continue"

# Define the graph
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("retrieve", retrieve)
workflow.add_node("generate_sql", generate_sql)
workflow.add_node("validate_sql", validate_sql)
workflow.add_node("execute_sql", execute_sql)
workflow.add_node("summarize", summarize)

# Add edges
workflow.set_entry_point("retrieve")
workflow.add_edge("retrieve", "generate_sql")
workflow.add_edge("generate_sql", "validate_sql")

# Conditional edge from validate
workflow.add_conditional_edges(
    "validate_sql",
    condition_check,
    {
        "retry": "generate_sql",
        "continue": "execute_sql",
        "end": END
    }
)

workflow.add_conditional_edges(
    "execute_sql",
    condition_check,
    {
        "retry": "generate_sql",
        "continue": "summarize",
        "end": "summarize" 
    }
)

workflow.add_edge("summarize", END)

# Compile
app = workflow.compile()
