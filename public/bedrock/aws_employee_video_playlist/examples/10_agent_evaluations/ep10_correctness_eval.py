import time

# =====================================================================
# EPISODE 10: AgentCore Evaluations
# File: ep10_correctness_eval.py (Automated Evaluations Engine)
# =====================================================================

class FAQAgent:
    def answer_query(self, prompt: str) -> str:
        prompt_lower = prompt.lower()
        if "pricing" in prompt_lower:
            return "Amazon Bedrock AgentCore is serverless. You pay for microVM run durations ($0.05 per hour) and LLM tokens."
        elif "isolation" in prompt_lower:
            return "Session isolation is achieved via AWS Firecracker hardware-level sandboxing."
        else:
            return "I am unable to answer this question at the moment."

class AgentEvaluator:
    def __init__(self, agent: FAQAgent):
        self.agent = agent

    def run_tests(self, test_cases: list) -> dict:
        results = []
        passed = 0
        total = len(test_cases)
        for idx, case in enumerate(test_cases):
            prompt = case["prompt"]
            expected_keywords = case["expected_keywords"]
            max_allowed_latency = case.get("max_latency", 2.0)
            
            start_time = time.time()
            agent_response = self.agent.answer_query(prompt)
            latency = time.time() - start_time
            
            success = True
            missing_keywords = []
            for kw in expected_keywords:
                if kw.lower() not in agent_response.lower():
                    success = False
                    missing_keywords.append(kw)
            
            latency_ok = latency <= max_allowed_latency
            test_passed = success and latency_ok
            if test_passed:
                passed += 1
                
            results.append({
                "case_num": idx + 1,
                "prompt": prompt,
                "passed": test_passed,
                "latency": f"{latency:.4f}s (Limit: {max_allowed_latency}s)",
                "missing_keywords": missing_keywords
            })
            
        accuracy = (passed / total) * 100 if total > 0 else 0
        return {
            "total_test_cases": total,
            "passed_cases": passed,
            "accuracy_percent": accuracy,
            "report": results
        }

# =====================================================================
# 📚 INTERVIEW & ARCHITECTURE NOTES (INTERVIEW-PREP SECTION)
# =====================================================================
# Q1: Why is testing LLM agents harder than testing traditional software code?
# A1: Traditional unit tests assert deterministic outputs (e.g. `assert add(2,2) == 4`). 
#     LLM responses are non-deterministic, varying slightly even for identical prompts. 
#     Thus, we evaluate agents using heuristic assertions (e.g. semantic keyword checks, 
#     cosine similarity matching against reference replies) or LLM-as-a-judge patterns 
#     where a stronger model rates the accuracy of the agent's output.
#
# Q2: Explain the "LLM-as-a-judge" evaluation pattern.
# A2: In complex systems (e.g. code generation or customer service), keyword matching 
#     is too simple. We pass the user's prompt, the agent's generated answer, and 
#     a reference golden-standard answer to a separate evaluator model (like Claude 3.5 Sonnet). 
#     The evaluator model is instructed to output a JSON rubric grading the correctness, 
#     tone, and format of the reply on a scale from 1 to 5.
#
# Q3: How do latency benchmarks prevent agent deployment regressions?
# A3: If a developer edits an agent prompt or adds tool dependencies, the routing step 
#     could become slow, adding seconds of delay. By running latency evaluations in 
#     the CI/CD build cycle, we fail the build if the 95th percentile latency (p95) 
#     crosses acceptable thresholds (e.g. 3.0 seconds per response), protecting user experience.
# =====================================================================
