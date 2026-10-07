# Running Multi-Session Test Suite
# (recreated from the on-screen notebook — comprehensive tests across
#  the quality dimensions we want the evaluators to score)
from test_dataset import test_sessions, session_metadata

EXPERIMENT_NAME = "baseline"

import time
import json
import uuid

# Storage for responses and session IDs
all_responses = []

# Run all test sessions
for session_idx, session_questions in enumerate(test_sessions, 1):
    print(f"{'=' * 80}")
    print(f"SESSION {session_idx}: {session_metadata[session_idx - 1]['name']}")
    print(f"{'=' * 80}")
    session_id = str(uuid.uuid4())

    for question_idx, question in enumerate(session_questions, 1):
        print(f"\nQ{question_idx}: {question}")

        try:
            request_payload = {"prompt": question}
            # Invoke with session_id to continue the conversation
            invoke_response = agentcore_runtime.invoke(
                request_payload,
                session_id=session_id,
            )
            response_text = invoke_response["response"][0]

            # Store response — only the session ID is needed later;
            # evaluators fetch the full traces from CloudWatch
            all_responses.append(
                {
                    "experiment": EXPERIMENT_NAME,
                    "session_id": session_id,
                    "session_number": session_idx,
                    "question_number": question_idx,
                    "question": question,
                    "response": response_text,
                }
            )
