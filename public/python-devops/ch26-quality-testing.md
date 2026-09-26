<!-- TODO: Rewrite and humanize content from 14-testing-quality\module-45-testing-devops-automation.md, 14-testing-quality\module-46-code-quality.md -->

# Module 45 — Testing DevOps Automation

## 1. Chapter Introduction
You have written a 300-line Python script that deletes unused AWS servers. It works perfectly on your laptop. You commit it to GitHub. Two months later, another engineer adds a new feature to your script, accidentally introduces a bug that deletes *all* servers, and pushes it to `main`. The CI/CD pipeline runs it, and production goes down. 
How do we prevent this? **Automated Testing.** In this module, we will learn how to write Unit Tests using `pytest`, ensuring that if someone breaks your script, the CI/CD pipeline catches it *before* the code is deployed.

## 2. What You Will Learn
- The difference between Manual Testing and Automated Unit Testing.
- How to install and run the `pytest` framework.
- The anatomy of a test function (the `assert` keyword).
- How to structure your tests in a repository.
- Why test-driven CI/CD pipelines are mandatory for infrastructure.

## 3. Why This Topic Matters in DevOps
In traditional system administration, you write a Bash script, you run it once to see if it works (manual testing), and you deploy it. This does not scale. When managing infrastructure as code (IaC), your scripts are managing millions of dollars of compute resources. You cannot rely on human memory to test every edge case every time a file is updated. `pytest` acts as an automated QA engineer, rigorously testing every function in your code in milliseconds, acting as a safety net for your CI/CD pipeline.

## 4. Concept Explained in Simple Language
### What is a Unit Test?
If you build a car engine, you don't just put it in a car and hope it drives. You test the spark plugs individually. You test the fuel pump individually. 
A **Unit Test** is exactly that: a tiny, isolated test that checks if one single Python function (a unit) does exactly what it is supposed to do.

### What is `pytest`?
`pytest` is a third-party Python library. You point it at your repository, and it automatically finds all your test files, runs them, and gives you a report card (Pass or Fail).

## 5. Real-World Analogy
Imagine a math teacher (your `pytest` script) and a student (your Python code).
- The teacher gives the student a problem: `add(2, 2)`.
- The teacher already knows the answer must be `4`.
- The student hands in their answer.
- The teacher **asserts** (demands) that the student's answer equals `4`. If it does, the test passes. If it doesn't, the test fails, and the teacher raises an alarm.

## 6. Basic Example: The `assert` Keyword
The heart of every single test in Python is the `assert` keyword. It simply means: "This statement must be True. If it is False, crash the test immediately."

```python
# A simple assertion
server_status = "running"

# If this is True, Python does nothing (Test Passes)
assert server_status == "running"

# If this is False, Python throws an AssertionError (Test Fails)
# assert server_status == "stopped" 
```

## 7. Step-by-Step Example: Writing Your First Test
First, install the framework: `pip install pytest`.

Now, imagine we have a script called `network_utils.py` containing this function:
```python
# network_utils.py
def is_valid_port(port):
    if type(port) != int:
        return False
    if port >= 1 and port <= 65535:
        return True
    return False
```

To test this, we create a *new* file called `test_network_utils.py`. (The `test_` prefix is required so `pytest` can find it).

```python
# test_network_utils.py

# 1. Import the function we want to test
from network_utils import is_valid_port

# 2. Write a test function (must start with test_)
def test_valid_http_port():
    # We assert that testing port 80 should return True
    assert is_valid_port(80) == True

def test_invalid_negative_port():
    # We assert that a negative port should return False
    assert is_valid_port(-5) == False

def test_invalid_string_port():
    # We assert that passing a string instead of a number returns False
    assert is_valid_port("8080") == False
```

## 8. DevOps Example: Running the Tests
To run the tests, you simply open your terminal, navigate to the folder, and type:
```bash
pytest
```

**Output:**
```text
============================= test session starts ==============================
collected 3 items                                                              

test_network_utils.py ...                                                [100%]

============================== 3 passed in 0.02s ===============================
```
All tests passed! If someone accidentally modifies `is_valid_port` to allow strings, the third test will instantly turn red and fail.

## 9. Cloud Example: CI/CD Integration
Running `pytest` on your laptop is great, but its true power belongs in the CI/CD pipeline (Module 17). We add `pytest` as a step *before* deployment.

```yaml
# Inside .github/workflows/deploy.yml
      - name: Install Dependencies
        run: |
          pip install requests pytest

      - name: Run Unit Tests
        run: pytest # If this fails, it returns Exit Code 1!

      - name: Execute Deployment Script
        # This step ONLY runs if the tests above pass!
        run: python scripts/deploy_app.py
```
Because `pytest` automatically returns Exit Code 1 when a test fails, the GitHub Action will stop immediately. **Broken code never reaches production.**

## 10. Production Example: Mocking
If you have a function that deletes an AWS S3 bucket, you **cannot** run that function during a unit test, or you will accidentally delete real cloud resources every time the pipeline runs!
In production, we use a concept called "Mocking." We trick Python into thinking it talked to AWS, without actually sending network traffic. (While deep mocking is beyond the scope of this chapter, libraries like `moto` for AWS or `responses` for API calls are industry standards for this exact purpose).

## 11. Common Mistakes
- **Forgetting the `test_` prefix:** `pytest` is blind to any file or function that does not start with `test_`. If you name your file `network_tests.py`, `pytest` will ignore it. It must be `test_network.py`.
- **Testing the pipeline, not the code:** Do not write unit tests that require active database connections or live cloud APIs. Unit tests should run completely offline in milliseconds.
- **Writing monolithic code:** If your script is a 300-line top-to-bottom file without any `def function():` blocks (Module 8), it is physically impossible to write unit tests for it. Modular code is testable code.

## 12. Troubleshooting
**Error:** `ModuleNotFoundError: No module named 'network_utils'` when running pytest.
**Fix:** Python cannot find the file you are trying to import. Ensure `test_network_utils.py` and `network_utils.py` are in the same directory, or that you have configured your `PYTHONPATH` correctly.

## 13. Security Considerations
Testing doesn't just catch functional bugs; it catches security flaws. You can write a unit test specifically designed to inject malicious data (like Shell Injection strings from Module 12) into your functions. 
```python
def test_injection_prevention():
    # Ensure our path validator rejects malicious input
    assert is_safe_path("../../../etc/passwd") == False
```
If this test passes, you know your script is secure against directory traversal attacks.

## 14. Senior Engineer's Perspective
**Junior Engineer:** "Writing tests doubles the amount of code I have to write. It takes too much time. I'll just be careful."
**Senior Engineer:** "You will not be careful at 3:00 AM during an incident response. Furthermore, you will not be the only person working on this code in 6 months. Tests are not just bug-catchers; they are living documentation. When a new engineer joins the team, they can read your tests and instantly understand exactly what inputs your functions expect and what outputs they produce. Writing tests is non-negotiable."

## 15. Hands-on Exercise
**Intermediate Exercise:**
1. Create a file named `calculator.py`.
2. Write a function:
   ```python
   def add(a, b):
       return a + b
   ```
3. Create a file named `test_calculator.py`.
4. Import the function: `from calculator import add`
5. Write two tests:
   - `test_add_positive_numbers()` (assert that 2+2=4)
   - `test_add_negative_numbers()` (assert that -1 + -1 = -2)
6. Open your terminal and run `pytest`.

*Expected Outcome:* The terminal will display green text indicating 2 tests passed.

## 16. Interview Questions
**Beginner:**
Q: What is the required naming convention for files and functions when using `pytest`?
A: Both the file name and the test function names must begin with `test_` (e.g., `test_auth.py` and `def test_login():`). Otherwise, the `pytest` discovery engine will ignore them.

**Intermediate:**
Q: How does `pytest` prevent broken code from being deployed in a CI/CD pipeline?
A: When a pipeline executes the `pytest` command, the framework runs all assertions. If even a single assertion fails, `pytest` terminates and returns an OS Exit Code of 1 (Failure). The CI/CD runner reads this exit code, halts the pipeline, and prevents subsequent deployment steps from running.

**Advanced / Production Scenario:**
Q: You have a function that checks the disk space of a server using the `subprocess` module. How do you write a unit test for this without actually running the `df -h` command on the CI/CD runner?
A: I would use Python's built-in `unittest.mock` library (specifically the `@patch` decorator) to "mock" or "intercept" the `subprocess.run` call during the test. Instead of executing the real OS command, the mock would return a fake string simulating the output of `df -h`. I can then assert that my Python parsing logic correctly extracts the disk percentage from that fake string.

## 17. Chapter Summary
Unit testing transforms automation from "scripts that usually work" into robust software engineering. By writing modular functions and testing them with `pytest` and `assert`, you create a mandatory safety net that allows CI/CD pipelines to confidently deploy your code without human supervision.

## 18. Quick Revision Notes
- Install via: **`pip install pytest`**
- File and function names must start with **`test_`**.
- The **`assert`** keyword is the core of testing (it crashes if False).
- Modular code (Functions) is required for testing.
- Add `pytest` to your CI/CD YAML file before the deployment step.
- Unit tests should run completely offline (use Mocks for cloud APIs).


---

# Module 46 — Code Quality

## 1. Chapter Introduction
Have you ever worked on a team where one engineer uses single quotes (`'`), another uses double quotes (`"`), one engineer indents with 4 spaces, and another indents with 2? The resulting script looks like a chaotic ransom note. In DevOps, code is read 10 times more often than it is written. If code is messy, it is hard to read. If it is hard to read, bugs will hide in plain sight. In this module, we learn how to enforce absolute uniformity across your entire engineering team using Automated Formatters and Linters.

## 2. What You Will Learn
- The difference between Formatting and Linting.
- How `black` automatically formats your code to the industry standard.
- How `flake8` analyzes your code for hidden bugs and unused variables.
- How to add Formatting and Linting as mandatory gates in your CI/CD pipeline.

## 3. Why This Topic Matters in DevOps
Arguments about "code style" (e.g., "Should we put a space after this comma?") waste thousands of hours of engineering time in Pull Request reviews. In modern DevOps, humans do not review code formatting. We delegate that to robots. By running `black` and `flake8` in a CI/CD pipeline, the pipeline will instantly reject any messy code before a human even looks at it. This forces the entire team to write code that looks like it was written by a single, highly disciplined engineer.

## 4. Concept Explained in Simple Language
### Formatting (`black`)
A formatter doesn't care if your code works; it only cares what it *looks* like. `black` is known as the "Uncompromising Code Formatter." You point it at an ugly script, and it instantly rewrites the script into a perfectly beautiful, standardized format. 

### Linting (`flake8`)
A linter reads your code like a grammar teacher looking for logical mistakes. It won't change your code, but it will yell at you. For example, if you `import os` at the top of your script, but never actually use the `os` module, `flake8` will throw an error and fail the pipeline.

## 5. Real-World Analogy
Imagine writing a book.
- **The Formatter (`black`):** The typesetter who ensures the margins are exactly 1 inch, the font is Times New Roman, and every paragraph is indented identically.
- **The Linter (`flake8`):** The editor who points out that you introduced a character named "Bob" in Chapter 1, but never mentioned him again (an unused variable).

## 6. Basic Example: The Power of `black`
First, install the tool: `pip install black`.

**Before `black` (Ugly Code):**
```python
def  calculate (x,y ):
  return   x+y
my_list=[1,   2,3,
4]
```

**Run the tool in your terminal:**
```bash
black my_script.py
```

**After `black` (Beautiful Code):**
```python
def calculate(x, y):
    return x + y

my_list = [1, 2, 3, 4]
```
*Notice how Black fixed the spacing, fixed the indentation, and merged the messy list onto a single line. It requires zero configuration. It just works.*

## 7. Step-by-Step Example: The strictness of `flake8`
First, install the tool: `pip install flake8`.

Let's look at a script that technically works, but is logically sloppy.
```python
# sloppy.py
import sys
import os

def check_status():
    status = "running"
    print("Server is active")

check_status()
```

**Run the tool in your terminal:**
```bash
flake8 sloppy.py
```

**Output:**
```text
sloppy.py:2:1: F401 'sys' imported but unused
sloppy.py:3:1: F401 'os' imported but unused
sloppy.py:6:5: F841 local variable 'status' is assigned to but never used
```
`flake8` caught that we imported `sys` and `os` but never used them, and we created a `status` variable that does nothing. This prevents your scripts from bloating over time.

## 8. DevOps Example: CI/CD Pipeline Enforcement
Running these tools on your laptop is helpful, but engineers are lazy. They will forget. To guarantee pristine code, you must enforce it in the pipeline.

**File: `.github/workflows/deploy.yml`**
```yaml
      - name: Install dependencies
        run: pip install black flake8

      - name: Enforce Code Formatting
        # The --check flag tells Black NOT to fix the code, 
        # but to CRASH (Exit Code 1) if the code needs fixing!
        run: black --check .

      - name: Run Linter
        # Flake8 crashes (Exit Code 1) if it finds any logical errors.
        run: flake8 .

      - name: Run Unit Tests
        run: pytest
```
Now, if an engineer pushes messy code, the CI/CD pipeline turns red at the "Enforce Code Formatting" step and blocks the deployment.

## 9. Cloud Example: Terraform and CloudFormation
This concept is not limited to Python! DevOps extends this philosophy to all Infrastructure as Code (IaC). 
- If you write Terraform, the pipeline will run `terraform fmt -check` (Formatter) and `tflint` (Linter).
- If you write CloudFormation (YAML), the pipeline will run `cfn-lint`.
The philosophy remains identical: Robots check style; humans review architecture.

## 10. Production Example: Configuring `flake8`
By default, `flake8` can be slightly too strict. For example, it restricts lines to 79 characters (an ancient rule from the 1980s). In modern development, 88 or 120 characters is standard. We configure `flake8` by adding a `.flake8` hidden file to the root of our repository.

**File: `.flake8`**
```ini
[flake8]
max-line-length = 88
extend-ignore = E203
```
Now, when the CI/CD pipeline runs `flake8 .`, it will automatically read this configuration file and apply the custom rules.

## 11. Common Mistakes
- **Formatting after Linting in the pipeline:** You should always run `black` *before* `flake8`. If you don't, `flake8` might throw an error about spacing, which `black` was going to fix anyway. 
- **Arguing with `black`:** You might think `black` formatted a line in an ugly way. Let it go. The value of `black` is not that it creates perfect art; the value is that it stops all arguments. Embrace the standard.

## 12. Troubleshooting
**Error:** The CI/CD pipeline fails at `black --check .` with the message "1 file would be reformatted."
**Fix:** The pipeline is telling you that you pushed messy code. The pipeline will not fix it for you (it shouldn't push commits on your behalf). You must run `black .` on your laptop, commit the newly formatted files, and push again.

## 13. Security Considerations
Linting has massive security benefits. A common security bug is accidentally hardcoding an API token in a script, testing it, and then leaving the variable there unused when you switch to `os.environ`. A linter like `flake8` will immediately flag the unused variable, prompting you to delete the hardcoded secret before it gets merged into the `main` branch.

## 14. Senior Engineer's Perspective
**Junior Engineer:** "I spent 30 minutes in the Pull Request telling Sarah she needs to put a space after every comma in her dictionary."
**Senior Engineer:** "You just wasted 30 minutes of company time. Human beings should never discuss code formatting in a Pull Request. We discuss architecture, security, and logic. I am adding `black` to the CI/CD pipeline today. From now on, the pipeline will handle the commas."

## 15. Hands-on Exercise
**Beginner Exercise:**
1. Open your terminal and run `pip install black flake8`.
2. Create a file called `messy.py` and deliberately write ugly code:
   ```python
   import sys
   def add( a,b):
     return a+b
   ```
3. Run `flake8 messy.py`. Notice the error about the unused `sys` import.
4. Delete `import sys`.
5. Run `black messy.py`. 
6. Open `messy.py` in your editor and look at the perfectly formatted code!

## 16. Interview Questions
**Beginner:**
Q: What is the difference between `black` and `flake8`?
A: `black` is a formatter; it automatically rewrites your code to ensure spacing, quotes, and line breaks are perfectly standardized. `flake8` is a linter; it does not change your code, but it analyzes it for logical errors, unused imports, and bad practices.

**Intermediate:**
Q: Why do we use the `--check` flag when running `black` in a CI/CD pipeline?
A: In a CI/CD pipeline, we do not want the runner to silently modify the code and deploy it without a record. The `--check` flag tells `black` to simply return an Exit Code of 1 (Failure) if the code does not match the standard, forcing the developer to fix it locally and commit the formatted version.

**Advanced / Production Scenario:**
Q: A developer complains that `flake8` is failing their build because a single line of text in a massive dictionary is 95 characters long, but the team's limit is 88. Is there a way to bypass the linter for just one specific line?
A: Yes, you can tell `flake8` to ignore a specific line by appending `# noqa` (No Quality Assurance) to the end of the line in the Python script. This tells the linter to skip evaluation for that line only, which is useful for long strings or URLs that cannot be broken up.

## 17. Chapter Summary
Automation is not just for infrastructure; it is for code quality. By implementing `black` and `flake8` into your workflow and CI/CD pipelines, you eliminate human arguments over style, catch hidden bugs early, and ensure that every script in your repository is clean, readable, and professional.

## 18. Quick Revision Notes
- **`black`:** The uncompromising formatter. Fixes spacing and layout.
- **`flake8`:** The strict linter. Finds unused variables and logical errors.
- **`black --check`:** Use this in pipelines to fail if code is messy.
- CI/CD Order: Formatter (`black`) -> Linter (`flake8`) -> Tests (`pytest`).
- Stop arguing about style; let the robots do it.


---

