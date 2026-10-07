# Run Comprehensive Evaluations — on-demand
# (recreated from the on-screen notebook — ~15 lines is the whole job:
#  session IDs in, evaluator IDs in, run())
from datetime import timedelta
from bedrock_agentcore.evaluation import EvaluationClient

eval_client = EvaluationClient(region_name=REGION)

# Eight evaluators across the three levels
EVALUATORS = [
    "Builtin.GoalSuccessRate",          # SESSION — did the agent meet the goal?
    "Builtin.Correctness",              # TRACE  — factually right?
    "Builtin.Faithfulness",             # TRACE  — grounded in context?
    "Builtin.Helpfulness",              # TRACE  — actually helpful?
    "Builtin.ResponseRelevance",        # TRACE  — answered what was asked?
    "Builtin.Conciseness",              # TRACE  — appropriately brief?
    "Builtin.ToolSelectionAccuracy",    # SPAN   — right tool?
    "Builtin.ToolParameterAccuracy",    # SPAN   — right parameters?
]

all_results = []
for session_id in session_ids:
    results = eval_client.run(
        evaluator_ids=EVALUATORS,
        agent_id=AGENT_ID,
        session_id=session_id,
        look_back_time=timedelta(hours=1),
    )
    all_results.extend(results)
    # each result: evaluatorId, value, label — plus the judge's reasoning

# Evaluation Results Summary — mean/min/max per evaluator
import pandas as pd

df = pd.DataFrame(
    [
        {
            "session_id": r.get("sessionId", session_id),
            "evaluator": r.get("evaluatorId"),
            "score": r.get("value"),
            "label": r.get("label"),
            "explanation": r.get("explanation"),
        }
        for r in all_results
    ]
)

metric_scores = df.groupby("evaluator")["score"].agg(["mean", "min", "max"])
print(metric_scores)

# Zero-scoring sessions ship the judge's full explanation —
# this is the raw material for the system-prompt rewrite.
print(df[df["score"] == 0][["evaluator", "explanation"]].iloc[0]["explanation"])
