import sys

# =====================================================================
# INDUSTRY STUDY: Insurance Premium Calculation Code Sandbox
# File: ep06_industry_sandbox_eval.py (Dynamic Calculation Execution)
# =====================================================================

class FormulaExecutionSandbox:
    def __init__(self):
        # Allow only safe math operators and basic functions
        self.allowed_builtins = {
            "abs": abs,
            "min": min,
            "max": max,
            "round": round,
            "float": float,
            "int": int
        }

    def compute_premium_formula(self, base_rate: float, multiplier: float, formula_expression: str) -> dict:
        print(f"[Sandbox] Validating dynamic formula expression: '{formula_expression}'")
        
        # Block malicious calls
        blocked_keywords = ["import", "os", "sys", "eval", "exec", "open", "getattr", "setattr"]
        for keyword in blocked_keywords:
            if keyword in formula_expression:
                return {
                    "status": "error",
                    "error_type": "SecurityViolation",
                    "message": f"Execution blocked: keyword '{keyword}' is unauthorized in premium sandbox."
                }
                
        # Setup context scope
        local_context = {
            "base_rate": base_rate,
            "multiplier": multiplier,
            "result": 0.0
        }
        global_context = {
            "__builtins__": self.allowed_builtins
        }
        
        try:
            # Wrap formula to assign output to result variable
            wrapped_code = f"result = {formula_expression}"
            
            # Execute in sandbox context
            exec(wrapped_code, global_context, local_context)
            final_premium = local_context.get("result", 0.0)
            
            return {
                "status": "success",
                "computed_value": float(final_premium),
                "formula_used": formula_expression
            }
            
        except ZeroDivisionError:
            return {
                "status": "error",
                "error_type": "ZeroDivisionError",
                "message": "Formula division by zero error occurred."
            }
        except Exception as e:
            return {
                "status": "error",
                "error_type": type(e).__name__,
                "message": f"Execution runtime exception: {str(e)}"
            }

if __name__ == "__main__":
    sandbox = FormulaExecutionSandbox()
    
    # Normal execution run
    print("\n[RUN 1: Standard Auto Premium Formula]")
    res1 = sandbox.compute_premium_formula(500.0, 1.25, "base_rate * multiplier + 100")
    print(res1)
    
    # Security violation execution run
    print("\n[RUN 2: Malicious Formula Injection]")
    res2 = sandbox.compute_premium_formula(500.0, 1.25, "open('/etc/passwd').read()")
    print(res2)
