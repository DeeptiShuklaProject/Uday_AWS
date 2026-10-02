import unittest
from ep06_industry_sandbox_eval import FormulaExecutionSandbox

class TestFormulaSandbox(unittest.TestCase):

    def setUp(self):
        self.sandbox = FormulaExecutionSandbox()

    def test_standard_math_expression(self):
        res = self.sandbox.compute_premium_formula(200.0, 1.5, "base_rate * multiplier")
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["computed_value"], 300.0)

    def test_blocked_unsafe_import(self):
        res = self.sandbox.compute_premium_formula(200.0, 1.5, "__builtins__['open']('file.txt')")
        self.assertEqual(res["status"], "error")
        self.assertEqual(res["error_type"], "SecurityViolation")

    def test_zero_division_exception(self):
        res = self.sandbox.compute_premium_formula(200.0, 1.5, "base_rate / 0")
        self.assertEqual(res["status"], "error")
        self.assertEqual(res["error_type"], "ZeroDivisionError")

if __name__ == "__main__":
    unittest.main()
