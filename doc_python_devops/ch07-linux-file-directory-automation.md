<!-- TODO: Rewrite and humanize content from 03-python-linux\module-10-python-linux.md, 03-python-linux\module-11-file-directory.md -->

# Module 10 — Python + Linux

## 1. Chapter Introduction
Welcome to Part III. The cloud is just someone else's Linux computer. Whether you are automating AWS EC2, managing a Docker container, or deploying to a Kubernetes Pod, the underlying operating system is almost always Linux. In this module, we will explore the relationship between Python and the Linux kernel, and why bridging this gap is a mandatory skill for a DevOps engineer.

## 2. What You Will Learn
- The conceptual architecture of Python running on Linux.
- The difference between Python built-in OS libraries and shell commands.
- File permissions and how Python handles them.
- How Python scripts run as background services (daemons).
- The "Shebang" (`#!`) and making scripts executable.

## 3. Why This Topic Matters in DevOps
If a deployment fails because a script cannot write a log file, the problem is not a Python bug—it is a Linux permissions issue. A DevOps engineer must understand how Python interacts with the Linux file system, memory, and processes. Without this understanding, you will spend hours debugging "Access Denied" errors and ghost processes.

## 4. Concept Explained in Simple Language
### Python is a Guest on the Linux System
Linux is the house. Python is a guest in that house. 
- The **Kernel** (Linux) owns the doors (Files), the electricity (CPU/Memory), and the rules (Permissions).
- Python cannot open a door without asking Linux for permission. 
- When you tell Python to `open("file.txt")`, Python actually translates that into a "system call," politely asking the Linux kernel to open the file. If Linux says no (because you don't have permission), Python throws a `PermissionError`.

## 5. Real-World Analogy
Imagine Linux is a strict librarian, and Python is a patron trying to read a rare book. 
Python doesn't just grab the book off the shelf. Python must fill out a request form (a system call) and hand it to the librarian. The librarian checks Python's ID card (Linux User Permissions). If the ID card doesn't have "Read" access for that book, the librarian rejects the request, and Python reports the failure back to you.

## 6. Basic Example: The Shebang
If you write a Python script on Linux, you don't want to type `python3 my_script.py` every time. You just want to type `./my_script.py`. 

To do this, you add a "Shebang" as the very first line of the file, and then give the file execute permissions in Linux.

**File: `hello_linux.py`**
```python
#!/usr/bin/env python3

print("Hello from the Linux file system!")
```

**Linux Terminal:**
```bash
# Make the file executable
chmod +x hello_linux.py

# Run it directly
./hello_linux.py
```

## 7. Step-by-Step Example: Understanding `os` Module
Python comes with a built-in module called `os` that acts as the bridge between your code and the Linux operating system.

```python
import os

# 1. Ask Linux what user is currently running this script
current_user = os.getlogin()
print(f"Running as: {current_user}")

# 2. Ask Linux for the current working directory
current_dir = os.getcwd()
print(f"I am executing inside: {current_dir}")

# 3. Check if a specific file exists before trying to open it
if os.path.exists("/var/log/syslog"):
    print("System log found.")
else:
    print("System log missing.")
```

## 8. DevOps Example: Permissions and Users
In DevOps, scripts often run as the `root` user to install software or restart services. If a script runs as a normal user, it will fail. We can use Python to verify the user before the script does any dangerous work.

```python
import os
import sys

def require_root():
    # In Linux, the root user always has the User ID (UID) of 0
    if os.getuid() != 0:
        print("CRITICAL: This deployment script must be run as root/sudo.")
        # Exit the script with an error code (1 means failure in Linux)
        sys.exit(1)
    
    print("Root access confirmed. Proceeding with deployment...")

# Run the check
require_root()
```

## 9. Cloud Example: Cloud-Init
When a new virtual machine boots up in AWS or Azure, a service called `cloud-init` runs exactly once to set up the server. You can pass a Python script to `cloud-init`. The cloud provider will automatically run your Python script as the `root` user to install packages, format hard drives, or download your application code. This is why knowing how Python interacts with Linux permissions is vital for cloud automation.

## 10. Production Example: Exit Codes
Linux relies entirely on "Exit Codes" to know if a script succeeded or failed. 
- Exit Code `0`: Success.
- Exit Code `1` (or anything else): Failure.

If you don't explicitly set an exit code when your Python script fails, Linux (and your CI/CD pipeline) will assume it succeeded!

```python
import sys

def backup_database():
    try:
        # Mocking a failure
        raise ConnectionError("Database timed out.")
    except Exception as e:
        print(f"Backup failed: {e}")
        # We MUST tell Linux the script failed, otherwise the pipeline will continue!
        sys.exit(1) 

backup_database()
# If we reach here, we tell Linux it was a success
sys.exit(0)
```

## 11. Common Mistakes
- **Running untrusted scripts as root:** Using `sudo python3 script.py` gives the script total control over the server. If the script contains malicious code or a critical bug (like `os.remove("/")`), it will destroy the server.
- **Ignoring Exit Codes:** Writing a Python script for Jenkins or GitHub Actions that catches an exception, prints an error, but forgets to call `sys.exit(1)`. The pipeline will see a green checkmark because the script technically finished running.

## 12. Troubleshooting
**Error:** `bash: ./script.py: Permission denied`
**Fix:** You added the shebang (`#!/usr/bin/env python3`), but you forgot to tell Linux that the file is allowed to be executed. Run `chmod +x script.py`.

## 13. Security Considerations
Files created by a Python script inherit the permissions of the user who ran the script. If you run a script as `root` that generates a configuration file, that file will be owned by `root`. If your web server (running as the `www-data` user) tries to read that configuration file, Linux will block it. Always be aware of *who* is running the script and *who* needs to read the output.

## 14. Senior Engineer's Perspective
**Junior Engineer:** "I wrote a Python script to restart the Nginx service. I'm just running `os.system('sudo systemctl restart nginx')` inside the script, but it keeps hanging."
**Senior Engineer:** "It's hanging because `sudo` is waiting for a password prompt that you can't see. Python is just a guest on the OS; it cannot bypass security. If a script needs to restart a service, the script itself must be executed with elevated privileges, or the Linux `sudoers` file must be configured to allow that specific command without a password. Don't embed `sudo` inside Python scripts."

## 15. Hands-on Exercise
**Beginner Exercise:**
1. Create a file named `check_env.py` on a Linux or macOS machine (or WSL on Windows).
2. Add the shebang `#!/usr/bin/env python3` to the top.
3. Write a script that imports `os` and prints out the current user ID using `os.getuid()` and the current working directory using `os.getcwd()`.
4. Make the script executable using `chmod +x check_env.py`.
5. Run it using `./check_env.py`.

*Expected Outcome:* The script executes without typing `python3` and prints your user ID (e.g., 1000) and your current directory path.

## 16. Interview Questions
**Beginner:**
Q: What is the purpose of the `#!/usr/bin/env python3` line at the top of a script?
A: It is called a "shebang." It tells the Linux operating system which interpreter to use to execute the file, allowing you to run the script directly as `./script.py`.

**Intermediate:**
Q: Why is it critical to use `sys.exit(1)` when your Python automation script encounters a fatal error?
A: If a script handles an exception but reaches the end of the file naturally, it returns an exit code of `0` (Success) to the operating system. CI/CD pipelines rely on exit codes. If you do not explicitly exit with a non-zero code, the pipeline will assume success and deploy broken code.

**Advanced / Production Scenario:**
Q: You write a script to download a backup file from an S3 bucket and save it to `/var/backups/`. The script works on your laptop but fails in the CI pipeline with a `PermissionError`. How do you resolve this securely?
A: The CI runner user does not have write permissions to `/var/backups/`. I have two options: I can run the script with elevated privileges (e.g., via sudo in the pipeline), or, much more securely, I can have the script download the file to a temporary, user-owned directory like `/tmp/` or the runner's workspace, and handle the privileged file move in a separate, tightly controlled configuration step.

## 17. Chapter Summary
Python is an incredibly powerful tool, but on a server, Linux is the ultimate authority. By understanding how Python requests resources from the kernel, how user permissions restrict those requests, and how exit codes communicate success or failure back to the operating system, you can write automation that respects the rules of the OS and integrates flawlessly with CI/CD pipelines.

## 18. Quick Revision Notes
- Linux controls permissions, CPU, and memory; Python must ask for access.
- **Shebang:** `#!/usr/bin/env python3` makes a script self-executing.
- **`chmod +x`:** Gives the file execute permissions in Linux.
- **`sys.exit(1)`:** Tells Linux (and CI pipelines) that the script failed.
- **`os.getuid() == 0`**: Checks if the script is running as root.
- Never hardcode `sudo` inside a Python script.


---

# Module 11 — File & Directory Automation

## 1. Chapter Introduction
Servers generate files constantly: log files, configuration backups, temporary cache files, and deployment artifacts. If left unchecked, a server's hard drive will fill up, causing a catastrophic failure (a "Disk Full" outage). As a DevOps engineer, automating the creation, reading, and deletion of files is a daily task. In this module, we move beyond simple Bash `rm` and `ls` commands and learn how to manage the Linux file system safely using Python.

## 2. What You Will Learn
- How to read and write files using the `with open()` context manager.
- The difference between the legacy `os` module and the modern `pathlib` module.
- How to search for specific files recursively.
- How to automate a safe log cleanup script.
- How to schedule this script using Linux `cron`.

## 3. Why This Topic Matters in DevOps
A common incident in any infrastructure is an application crashing because `/var/log` is 100% full. Writing a Python script to find log files older than 30 days, compress them, and delete the originals is a rite of passage. If you do this with a sloppy Bash script, a typo like `rm -rf / var/log` (notice the accidental space) will delete the entire operating system. Python's object-oriented path handling makes this task significantly safer.

## 4. Concept Explained in Simple Language
### Paths and `pathlib`
A file path is the address of a file on a computer (e.g., `/var/log/nginx/access.log`).
Historically, Python treated paths as simple strings. But strings are dumb; they don't know the difference between a folder and a file.
Python introduced `pathlib`, which treats paths as **Objects**. A Path Object is smart. You can ask it: "Are you a directory?", "Do you exist?", "What is your file extension?"

### The Context Manager (`with`)
When you open a file to read it, the operating system "locks" that file. If your script crashes before closing the file, the file stays locked, causing massive memory leaks or preventing other apps from writing to it. The `with open()` syntax is a magic box: as soon as the script steps out of the box, Python automatically unlocks and closes the file, even if the script crashed inside!

## 5. Real-World Analogy
Imagine renting a book from the library. 
- **Without `with open()`:** You rent the book, bring it home, start reading, fall asleep, and never return it. The library bans you.
- **With `with open()`:** You read the book inside the library. The moment you stand up to leave, the librarian automatically takes the book from your hands and puts it back on the shelf. You literally cannot forget to return it.

## 6. Basic Example: Reading and Writing Files
```python
# WRITING to a file
# "w" mode overwrites the file. "a" mode appends to it.
with open("server_status.txt", "w") as file:
    file.write("Server is healthy.\n")
    # File is automatically closed here!

# READING from a file
with open("server_status.txt", "r") as file:
    content = file.read()
    print(f"File says: {content}")
```

## 7. Step-by-Step Example: Introduction to `pathlib`
Let's see why `pathlib` is superior to handling raw strings.

```python
from pathlib import Path

# Create a Path object
log_dir = Path("/var/log")

# 1. Check if it exists
if log_dir.exists():
    print(f"{log_dir} exists.")

# 2. Check if it is a directory or a file
if log_dir.is_dir():
    print("It is a directory.")

# 3. Combine paths safely using the forward slash (/)
# This handles the slashes correctly regardless of Linux vs Windows!
nginx_log = log_dir / "nginx" / "access.log"
print(f"Full path is: {nginx_log}")
```

## 8. DevOps Example: Automated Log Cleanup
Let's write a script that finds all `.log` files in a directory and deletes them if they are too big.

```python
from pathlib import Path

# We use a local directory for testing so we don't accidentally delete real logs!
target_dir = Path("./mock_logs")

# 1. Ensure the directory exists
if not target_dir.exists():
    target_dir.mkdir() # Create it if missing!

# 2. Find all .log files (rglob = recursive search)
for log_file in target_dir.rglob("*.log"):
    
    # 3. Get the size in bytes
    size_in_bytes = log_file.stat().st_size
    size_in_mb = size_in_bytes / (1024 * 1024)
    
    # 4. Delete if over 100MB
    if size_in_mb > 100:
        print(f"Deleting huge log: {log_file.name}")
        log_file.unlink() # Safely deletes the file
    else:
        print(f"Keeping {log_file.name} ({size_in_mb:.2f} MB)")
```

## 9. Cloud Example: Downloading to a Temp Directory
When you download a configuration file from AWS S3, you shouldn't just save it to the current directory. You should save it to a temporary directory so the Linux OS cleans it up automatically when it reboots.

```python
from pathlib import Path

# /tmp is a standard Linux directory for temporary files
temp_file = Path("/tmp/aws_config_backup.json")

# Mock download
with open(temp_file, "w") as f:
    f.write('{"region": "us-east-1"}')

print(f"Config saved temporarily to {temp_file}")
```

## 10. Production Example: Handling Missing Directories
In production, you never assume a file or directory exists. If you try to create a file inside `/etc/myapp/` and the `myapp` folder doesn't exist, Python will crash with a `FileNotFoundError`.

```python
from pathlib import Path

config_dir = Path("/etc/myapp")
config_file = config_dir / "settings.conf"

# PRODUCTION SAFETY: Ensure the parent directory exists before writing!
# parents=True means it will create /etc/myapp if missing.
# exist_ok=True means it won't crash if /etc/myapp ALREADY exists.
config_dir.mkdir(parents=True, exist_ok=True)

with open(config_file, "w") as f:
    f.write("port=8080")
```

## 11. Common Mistakes
- **Forgetting `exist_ok=True`:** If you run `Path.mkdir()` twice, the second time it will crash because the directory already exists. Always use `exist_ok=True`.
- **Using strings for paths:** Concatenating strings (`"/var/log" + "/" + "syslog"`) is prone to double-slash errors and breaks completely if the script is ever run on Windows. Always use `pathlib`.
- **Not using `with open()`:** Using `file = open(...)` and forgetting to call `file.close()`.

## 12. Troubleshooting
**Error:** `PermissionError: [Errno 13] Permission denied: '/var/log/syslog'`
**Fix:** Your script is trying to read or delete a file owned by the `root` user, but you are running the script as a normal user. You either need to run the script via `sudo`, or change the permissions of the file.

## 13. Security Considerations
When writing a script that deletes files, **never** allow a user to pass a raw path into the script (e.g., a command-line argument like `python cleanup.py /target/path`). An attacker could pass `/` and delete your entire operating system. Always validate that the target path is restricted to a specific, safe directory (e.g., `if not str(target_path).startswith("/var/log"): sys.exit(1)`).

## 14. Senior Engineer's Perspective
**Junior Engineer:** "I need to run my Python cleanup script every night at 2:00 AM. Should I put a `while True:` loop in my script and use `time.sleep(86400)`?"
**Senior Engineer:** "No. That relies on the script running forever without crashing. Instead, write a script that runs exactly once and exits immediately. Then, tell the Linux `cron` daemon to execute that script every day at 2:00 AM. In DevOps, we let the OS handle scheduling; the script should only focus on the logic."

*Example Cron Job (Run `crontab -e` in Linux):*
`0 2 * * * /usr/bin/python3 /opt/scripts/cleanup.py`

## 15. Hands-on Exercise
**Beginner Exercise:**
1. Create a script that uses `pathlib` to create a directory called `backup_dir` in your current folder. Ensure it doesn't crash if the directory already exists.
2. Inside that directory, create a file called `status.txt` and write the word "SUCCESS" into it using `with open()`.
3. Use `pathlib` to verify the file exists and print its file size.

*Expected Outcome:* A new folder appears, containing `status.txt`, and the console prints "File exists. Size: 7 bytes."

## 16. Interview Questions
**Beginner:**
Q: Why is `with open("file.txt", "w") as f:` better than `f = open("file.txt", "w")`?
A: The `with` statement acts as a context manager. It guarantees that the file will be safely closed and the system lock released as soon as the block of code finishes, even if an exception occurs inside the block.

**Intermediate:**
Q: What is the advantage of using `pathlib` over manipulating path strings manually?
A: `pathlib` treats paths as intelligent objects rather than dumb strings. It automatically handles the differences between Windows (`\`) and Linux (`/`) path separators, and provides built-in methods for checking file existence, sizes, and recursive searching without needing to import multiple other modules.

**Advanced / Production Scenario:**
Q: You wrote a Python script to compress old log files. It runs fine manually, but when scheduled via Linux `cron`, it fails, saying it cannot find the log files. Why?
A: When you run a script manually, it executes in your current working directory. `cron` runs scripts in a minimal environment and usually defaults to the user's home directory. The script likely used a relative path (e.g., `./logs/`). To fix this, always use absolute paths (e.g., `/var/log/nginx/`) in automation scripts, or resolve the script's absolute path dynamically using `pathlib.Path(__file__).parent`.

## 17. Chapter Summary
File manipulation is the backbone of configuration management and system maintenance. By adopting `pathlib` for intelligent path routing, leveraging context managers (`with`) for safe file handling, and delegating scheduling to Linux `cron`, you ensure your automation is both safe and deeply integrated into the operating system.

## 18. Quick Revision Notes
- Use **`pathlib.Path`** instead of raw strings.
- **`dir / "file.txt"`**: Safely combines paths.
- **`Path.rglob("*.log")`**: Recursively searches for files.
- Always use **`with open(...) as file:`**.
- **`exist_ok=True`**: Prevents crashes when creating directories.
- Schedule Python scripts using Linux **`cron`**, not `while` loops.


---

