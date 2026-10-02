<!-- TODO: Rewrite and humanize content from 03-python-linux\module-12-running-commands.md, 03-python-linux\module-13-environment-variables.md -->

# Module 12 — Running Linux Commands from Python

## 1. Chapter Introduction
Python is incredibly powerful, but it doesn't reinvent the wheel. Linux already has tools that have been perfected over 40 years: `grep`, `awk`, `ping`, `systemctl`, and `tar`. As a DevOps engineer, you do not need to write a Python script from scratch to ping a server. Instead, you need Python to act as a general commanding the Linux shell. In this module, we will learn how to execute shell commands from Python safely and capture their output using the `subprocess` module.

## 2. What You Will Learn
- Why `os.system()` is dangerously obsolete.
- How to use `subprocess.run()` to execute Linux commands.
- Capturing standard output (`stdout`) and standard error (`stderr`).
- Passing arguments to commands securely to avoid Shell Injection.
- Checking return codes to verify if a command succeeded.

## 3. Why This Topic Matters in DevOps
Imagine you need to write a script that updates 50 Ubuntu servers. You need to run `apt-get update`. If you use Bash, error handling is painful. If you use Python's `subprocess`, you can run the command, capture the exact text output, check the exit code, and if it fails, format an alert as a JSON object and push it to a Slack API. Combining the raw power of Linux binaries with the logic and API capabilities of Python is the definition of modern infrastructure automation.

## 4. Concept Explained in Simple Language
### Subprocess
A "process" is a running program. When your Python script is running, it is the main process. A "subprocess" is a *child* program that Python launches. Python says to Linux, "Please run this `ping` command, wait for it to finish, and hand the results back to me." 

### stdout vs. stderr
Linux commands output text to two different channels:
- **stdout (Standard Output):** The normal output when things go right.
- **stderr (Standard Error):** The output when things blow up.
Python can listen to both channels separately, allowing you to react differently based on what type of text comes back.

## 5. Real-World Analogy
Think of Python as the CEO of a company. 
The CEO doesn't personally mop the floors. They hire a janitor (the Linux command) to do it. 
- Using `subprocess` is like the CEO telling the janitor: "Go mop the floor. Come back and tell me when you are done."
- **stdout** is the janitor saying: "The floor is clean."
- **stderr** is the janitor saying: "The mop broke."
- **The Exit Code** is the janitor handing in a form: `0` for success, `1` for failure.

## 6. Basic Example: Running a Simple Command
We no longer use `os.system()`. We use `subprocess.run()`.

```python
import subprocess

# Let's run a simple 'ls' command
print("Listing files...")

# By default, subprocess.run prints the output directly to the screen
result = subprocess.run(["ls", "-l"])

print("Command finished.")
```
*Notice how we pass the command as a List (`["ls", "-l"]`), not as a single string (`"ls -l"`). This is critical for security, which we will discuss below.*

## 7. Step-by-Step Example: Capturing Output
Usually, you don't want the command to print to the screen. You want Python to capture the text so you can parse it or save it.

```python
import subprocess

# 1. We run the 'whoami' command.
# 2. capture_output=True tells Python to save the result, not print it.
# 3. text=True tells Python we want a normal String, not raw binary bytes.
result = subprocess.run(["whoami"], capture_output=True, text=True)

# The result object contains the stdout, stderr, and the returncode
output = result.stdout.strip() # Strip the hidden newline

print(f"The Linux system reports the user is: {output}")
```

## 8. DevOps Example: Checking Service Status
Let's write a script that checks if the Nginx web server is running. If it isn't, we'll capture the error.

```python
import subprocess

# 'systemctl is-active nginx' returns 'active' if running.
result = subprocess.run(
    ["systemctl", "is-active", "nginx"],
    capture_output=True, 
    text=True
)

# Check the return code. 0 means success (active). Non-zero means failure.
if result.returncode == 0:
    print("Nginx is running smoothly.")
else:
    print("CRITICAL: Nginx is down!")
    print(f"Error details: {result.stdout.strip()}") 
```

## 9. Cloud Example: Wrapping Cloud CLIs
The AWS, Azure, and GCP CLIs are just Linux commands. If a Python library (like Boto3) doesn't support a brand-new cloud feature yet, you can use `subprocess` to run the CLI directly from Python.

```python
import subprocess

# Running an AWS CLI command to get the caller identity
aws_command = ["aws", "sts", "get-caller-identity", "--output", "json"]

result = subprocess.run(aws_command, capture_output=True, text=True)

if result.returncode == 0:
    print("Successfully connected to AWS.")
    # You could now use the json module to parse result.stdout!
else:
    print(f"AWS CLI failed: {result.stderr}")
```

## 10. Production Example: Handling Timeouts
In production, a command like `ping` or a network request might hang forever. If the subprocess hangs, your Python script hangs forever too. Always use the `timeout` parameter.

```python
import subprocess

target_ip = "8.8.8.8"

try:
    print(f"Pinging {target_ip}...")
    # Ping 4 times. If it takes longer than 10 seconds, kill it!
    result = subprocess.run(
        ["ping", "-c", "4", target_ip],
        capture_output=True,
        text=True,
        timeout=10
    )
    print("Ping successful.")
except subprocess.TimeoutExpired:
    print(f"CRITICAL: The ping command timed out after 10 seconds. {target_ip} is unreachable.")
```

## 11. Common Mistakes
- **Using `shell=True`:** This is incredibly dangerous. `subprocess.run("ls -l", shell=True)` forces Python to open a full Bash shell. If you pass user input into this, a hacker can easily destroy your server. Always pass arguments as a List without `shell=True`.
- **Forgetting `text=True`:** If you forget this, `result.stdout` will be raw bytes (e.g., `b'hello\n'`), which will crash string methods like `.split()`.

## 12. Troubleshooting
**Error:** `FileNotFoundError: [Errno 2] No such file or directory: 'ping'`
**Fix:** Python cannot find the command you are trying to run. Ensure the command is installed on the server, or provide the absolute path to the binary (e.g., `["/bin/ping", "-c", "4", "8.8.8.8"]`).

## 13. Security Considerations: Shell Injection
If you use `shell=True` and incorporate external input, you are vulnerable to **Shell Injection**.
Imagine this code: `subprocess.run(f"ping -c 1 {user_input}", shell=True)`
If a malicious user submits `8.8.8.8; rm -rf /`, the shell will ping Google, finish, and then instantly delete your entire hard drive.
By using lists: `["ping", "-c", "1", user_input]`, Linux treats the malicious input strictly as a hostname, fails the ping gracefully, and never executes the `rm -rf` command. **Lists protect you from injection.**

## 14. Senior Engineer's Perspective
**Junior Engineer:** "I needed to parse a CSV file, so I used `subprocess.run(['awk', '-F', ',', '{print $1}', 'data.csv'])`."
**Senior Engineer:** "Stop treating Python like a Bash wrapper. If Python has a native, built-in way to do something (like the `csv` module, or reading files), use Python. You should only use `subprocess` when interacting with external binaries that Python cannot replicate easily (like `systemctl`, `docker`, or `terraform`). Spawning a subprocess is slow and uses heavy OS resources compared to native Python code."

## 15. Hands-on Exercise
**Intermediate Exercise:**
Write a Python script that runs the `df -h` command (which checks disk space on Linux/macOS).
1. Use `subprocess.run()`.
2. Pass the arguments as a list.
3. Capture the output as a string.
4. If the command succeeds (`returncode == 0`), print the output.
5. If it fails, print the error message.

*(If you are on Windows, run the `ipconfig` command instead of `df -h`)*

*Expected Outcome:* The script will output the disk space statistics of your computer, captured directly by Python.

## 16. Interview Questions
**Beginner:**
Q: Why do we use `subprocess.run()` instead of `os.system()`?
A: `subprocess` allows you to capture the `stdout` (output) and `stderr` (errors) into variables, check return codes, and implement strict timeouts. `os.system()` just dumps text to the screen and offers no control.

**Intermediate:**
Q: How do you prevent Shell Injection attacks when using `subprocess`?
A: You must pass the command and its arguments as a Python List (e.g., `["ls", "-l"]`), and you must absolutely ensure that `shell=True` is omitted or set to `False`. This forces the OS to treat arguments strictly as data, not as executable shell code.

**Advanced / Production Scenario:**
Q: Your Python script triggers a database backup via `subprocess.run(["pg_dump", ...])`. The database is huge, and occasionally the script hangs indefinitely. How do you fix this?
A: I would add the `timeout` parameter to the `subprocess.run()` call (e.g., `timeout=3600` for 1 hour). I would also wrap the call in a `try/except` block catching `subprocess.TimeoutExpired`. If it times out, the exception block will trigger an alert notifying the on-call engineer that the backup process is stuck.

## 17. Chapter Summary
The `subprocess` module is what turns Python into a DevOps powerhouse. It allows you to wrap legacy Linux commands, cloud CLIs, and infrastructure tools inside robust, testable Python logic. By capturing output, checking return codes, and enforcing timeouts, you make the chaotic Linux shell completely predictable.

## 18. Quick Revision Notes
- Use **`subprocess.run()`** for running commands.
- Pass commands as a **List** `["ping", "8.8.8.8"]`.
- Never use **`shell=True`** (Shell Injection risk).
- Use **`capture_output=True, text=True`** to save output to strings.
- **`result.stdout`**: Success text.
- **`result.stderr`**: Error text.
- **`result.returncode`**: `0` means success.
- Always use **`timeout=X`** to prevent infinite hanging.


---

# Module 13 — Environment Variables & Secrets

## 1. Chapter Introduction
If there is one absolute rule in DevOps, it is this: **Never hardcode secrets into your scripts.** A secret is any sensitive data: a database password, an AWS Access Key, or a third-party API token. If you write `password = "admin123"` in a Python script and push that script to GitHub, hackers will find it in seconds, and your company's data will be stolen. In this module, we learn how to securely pass secrets to Python scripts using the Linux operating system.

## 2. What You Will Learn
- What Environment Variables are in Linux.
- How to read Environment Variables in Python using `os.environ`.
- Using `.env` files for local development.
- Why Environment Variables are the industry standard for passing secrets to Docker and Kubernetes.

## 3. Why This Topic Matters in DevOps
Modern infrastructure follows the "Twelve-Factor App" methodology. A core principle of this methodology is "Store config in the environment." Your Python script should be completely blind to where it is running (Local laptop vs. Staging vs. Production) and what credentials it is using. The Linux server (or Docker container) injects the credentials into the script at runtime via Environment Variables. This ensures your code is identical everywhere, but the secrets remain securely on the server.

## 4. Concept Explained in Simple Language
### Environment Variables
Think of a Linux server as an office building. The "Environment" is the air inside the building. 
An Environment Variable is a sticky note floating in the air. 
- You can write a note: `export DB_PASS="secret123"`. Now that note is floating in the Linux environment.
- Any program running in that terminal (like a Python script) can grab that sticky note, read it, and use it.
- When the terminal is closed, the sticky notes disappear. They are never saved to a hard drive or pushed to GitHub.

## 5. Real-World Analogy
Imagine a delivery driver (your Python script). 
- **Hardcoding:** You tattoo the building's alarm code onto the driver's forehead. If anyone takes a picture of the driver (pushing to GitHub), the code is compromised forever.
- **Environment Variables:** The security guard at the gate (Linux) whispers the alarm code into the driver's ear right as they enter. The driver uses it, finishes the delivery, and leaves. The code is never written down on the driver's body.

## 6. Basic Example: Reading Environment Variables
First, in your Linux terminal, you create the variable:
```bash
export SERVER_PORT="8080"
```

Then, in your Python script:
```python
import os

# os.environ is a Dictionary containing all the floating Linux sticky notes
# We use .get() to avoid crashing if the variable doesn't exist
port = os.environ.get("SERVER_PORT")

if port:
    print(f"Starting server on port {port}...")
else:
    print("WARNING: SERVER_PORT not found. Defaulting to 80.")
    port = "80"
```

## 7. Step-by-Step Example: Enforcing Secrets
Sometimes, a script *cannot* run without a secret. You want it to crash immediately if the secret is missing, rather than causing a cryptic error later.

```python
import os
import sys

# We use os.environ["KEY"] instead of .get(). 
# This will intentionally throw a KeyError if the secret is missing.
try:
    aws_key = os.environ["AWS_ACCESS_KEY_ID"]
    aws_secret = os.environ["AWS_SECRET_ACCESS_KEY"]
except KeyError as e:
    print(f"CRITICAL: Missing environment variable: {e}")
    print("Please set your AWS credentials before running this script.")
    sys.exit(1) # Tell Linux we failed

print("Credentials found. Connecting to AWS...")
```

## 8. DevOps Example: The `.env` File
In local development, typing `export VAR="value"` every time you open a terminal is annoying. Developers use a `.env` file to store these variables locally.

**File: `.env` (NEVER COMMIT THIS TO GITHUB! Add it to `.gitignore`)**
```env
DB_HOST=10.0.0.5
DB_PASS=supersecret
```

Python doesn't read `.env` files automatically. We use a third-party library called `python-dotenv` to inject them into `os.environ`.

```python
# You must install this first: pip install python-dotenv
import os
from dotenv import load_dotenv

# This reads the .env file and throws the sticky notes into the air
load_dotenv()

db_host = os.environ.get("DB_HOST")
print(f"Connecting to database at {db_host}...")
```

## 9. Cloud Example: CI/CD Pipelines
When you run a Python script in a GitHub Action or a Jenkins pipeline, you don't use `.env` files. You store the secrets in the GitHub/Jenkins UI. The pipeline software automatically runs `export DB_PASS="xxx"` in the hidden Linux runner just milliseconds before it executes your Python script. Your Python script simply calls `os.environ.get("DB_PASS")` and it works flawlessly, completely unaware that it is running inside a cloud pipeline.

## 10. Production Example: Type Casting
Remember Module 4? Environment variables are ALWAYS Strings. If you pass a timeout value, you must convert it.

```python
import os

# The environment variable is a string: "30"
raw_timeout = os.environ.get("API_TIMEOUT", "10") 

# Cast it to an integer for mathematical logic
actual_timeout = int(raw_timeout)

print(f"Will timeout after {actual_timeout} seconds.")
```

## 11. Common Mistakes
- **Pushing `.env` to GitHub:** The absolute worst mistake you can make. Always add `.env` to your `.gitignore` file the second you create it.
- **Using `.get()` for mandatory secrets:** If a database password is required, don't use `os.environ.get("DB_PASS", "default")`. You don't want a default password. You want the script to crash loudly so you know the configuration is broken.
- **Forgetting type casting:** `if os.environ.get("DEBUG") == True:` will never work, because the environment variable is the *string* `"True"`, not the *boolean* `True`.

## 12. Troubleshooting
**Error:** `KeyError: 'AWS_ACCESS_KEY_ID'`
**Fix:** Your script is demanding an environment variable that Linux doesn't have. Run `echo $AWS_ACCESS_KEY_ID` in your terminal to verify it is missing. Then run `export AWS_ACCESS_KEY_ID="your_key"`.

## 13. Security Considerations: `print()` Leaks
If you are debugging a script, you might be tempted to write `print(os.environ)` to see what variables are available. **Never do this in production.** This will dump every single secret, password, and API token into your plain-text application logs, making them visible to anyone who has access to the log viewer (like DataDog or Splunk). Treat `os.environ` like radioactive material; only extract what you need, and never print the raw values.

## 14. Senior Engineer's Perspective
**Junior Engineer:** "I have a `config.py` file with all the database IPs and passwords, and I just import it into my main script. It's so clean!"
**Senior Engineer:** "It's clean, but it's a massive security violation. If that `config.py` ends up in version control, we are compromised. Furthermore, what happens when we deploy to Staging? Do you edit the `config.py` manually? No. Delete `config.py`. Make the script read from `os.environ`. That way, the Staging server injects the Staging database IP, and the Production server injects the Production database IP, and the script code never changes."

## 15. Hands-on Exercise
**Beginner Exercise:**
1. Open a Linux terminal (or macOS, or WSL).
2. Set a variable: `export MY_FAVORITE_CLOUD="AWS"`
3. Write a short Python script (`check_cloud.py`) that imports `os`.
4. Read the variable: `cloud = os.environ.get("MY_FAVORITE_CLOUD", "Unknown")`
5. Print it out: `print(f"Deploying to: {cloud}")`
6. Run the script and see it grab the variable from the OS!

*Expected Outcome:* The script prints "Deploying to: AWS".

## 16. Interview Questions
**Beginner:**
Q: Why should you never hardcode passwords in a Python script?
A: Hardcoded secrets will be permanently recorded in version control (like Git). Anyone with access to the repository—or if the repository leaks publicly—will have immediate access to your critical infrastructure.

**Intermediate:**
Q: How does a Docker container pass configuration data to the Python app running inside it?
A: Docker passes configuration data primarily through Environment Variables. When launching the container (e.g., `docker run -e DB_HOST=10.0.0.5`), Docker injects the variable into the isolated Linux environment, and the Python app reads it using `os.environ.get("DB_HOST")`.

**Advanced / Production Scenario:**
Q: You have a script that requires an API token. If the token is missing, the script defaults to `None`, makes an unauthenticated API call, and crashes with a confusing HTTP 401 error deep in the code. How do you improve this?
A: I would fail fast. At the very top of the script, I would use `token = os.environ["API_TOKEN"]` (which raises a `KeyError` if missing), or I would write an explicit check: `if not token: sys.exit("CRITICAL: API_TOKEN is required.")`. Failing immediately with a clear message prevents the script from executing bad logic and saves hours of debugging.

## 17. Chapter Summary
Environment Variables are the bridge between your static Python code and the dynamic, secure realities of modern infrastructure. By utilizing `os.environ`, your scripts become secure, portable, and compliant with cloud-native best practices (like the Twelve-Factor App methodology). 

## 18. Quick Revision Notes
- **`os.environ`**: A dictionary of all Linux environment variables.
- **`os.environ.get("KEY", "default")`**: Safe reading (returns default if missing).
- **`os.environ["KEY"]`**: Strict reading (crashes if missing).
- Environment variables are ALWAYS strings. Remember to type cast.
- Never commit `.env` files to Git.
- Never `print()` raw secrets or the whole `os.environ` dictionary.


---

