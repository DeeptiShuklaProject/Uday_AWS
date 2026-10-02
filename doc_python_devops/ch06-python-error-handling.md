# Chapter 6: Error and Exception Handling

## Introduction

In a perfect world, APIs never timeout, servers never run out of disk space, and users never type "potato" when prompted for an IP address. Unfortunately, DevOps takes place in the real world. Things break constantly. 

If your deployment script crashes abruptly when a cloud provider's API goes down for five seconds, it is not a production-grade script. Exception handling is the difference between an annoying pager alert waking you up at 3:00 AM and a resilient automated system that heals itself. In this chapter, we learn how to anticipate failure and handle it gracefully.

## The Core Idea: Anticipating Failure

An **Exception** occurs when your code is syntactically correct, but something happens *during* execution that Python can't resolve natively (e.g., trying to read a file that doesn't exist). 

Instead of letting the script crash, you can wrap dangerous code in a protective block:
- **`try`**: Python, please *try* to do this dangerous action.
- **`except`**: If it blows up, don't crash! Execute this fallback action instead.
- **`finally`**: Regardless of whether it blew up or succeeded, execute this cleanup action at the very end.

## Essential Code Patterns

### The Try/Except Block

```python
server = {"name": "db-01"}

try:
    # We TRY to access a key that doesn't exist
    print(server["ip_address"])
except KeyError:
    # We CATCH the specific error and prevent a crash
    print("WARNING: IP Address not found for this server!")

print("The script successfully reached the end.")
```

### Multiple Exceptions and Cleanup

Code can fail for multiple reasons. You can stack `except` blocks to handle different failures appropriately, and use `finally` to ensure resources (like files or network connections) are closed.

```python
def read_config_file(filename):
    try:
        # Dangerous action 1: File might not exist
        file = open(filename, "r")
        content = file.read()
        
        # Dangerous action 2: Content might not be a number
        timeout = int(content)
        print(f"Timeout set to {timeout}")
        
    except FileNotFoundError:
        print(f"ERROR: The file {filename} does not exist.")
    except ValueError:
        print("ERROR: The file must contain only numbers.")
    finally:
        print("Cleanup: This runs no matter what happens.")
```

## In Production

### Handling Network Timeouts
When communicating with external APIs or servers, timeouts are guaranteed to happen eventually. A resilient script anticipates this.

```python
import time

def mock_api_call():
    # Simulating an API that randomly fails
    raise TimeoutError("The cloud API did not respond.")

try:
    print("Connecting to AWS...")
    mock_api_call()
except TimeoutError as e:
    # 'as e' captures the exact error message from the system
    print(f"API Failed. Reason: {e}")
    print("We will wait 5 seconds and retry later.")
    # time.sleep(5)
```

### Manually Raising Exceptions
Sometimes, the system doesn't crash natively, but you *want* it to crash to prevent a catastrophic deployment. This is called raising an exception (`raise`).

```python
def deploy_to_production(environment):
    if environment != "production":
        # We manually trigger a crash to stop the deployment!
        raise ValueError("FATAL: You are trying to deploy a non-production config!")
    
    print("Deploying...")

try:
    deploy_to_production("staging")
except ValueError as e:
    print(e)
```

## Watch Out For

- **Never use bare `except:` blocks:** In production, you should almost never write a naked `except:` block. It catches *everything*, including you pressing `Ctrl+C` (`KeyboardInterrupt`) to stop a runaway script. This can cause runaway loops that you cannot kill. Always catch specific errors, or at least `except Exception as e:`.
- **Swallowing Exceptions:** Writing an `except` block that simply says `pass` (do nothing) is dangerous. If a database fails to update and you swallow the error silently, nobody knows the database is broken. Always log the error so you have a trail.
- **Leaking Secrets in Tracebacks:** When an exception isn't caught, Python prints a "Traceback"—a massive block of text showing exactly where the code failed. In a public-facing API, a traceback can accidentally reveal database passwords or infrastructure paths to an attacker. Always catch exceptions and return a generic error message, securely logging the full traceback internally.

## Practice / Try This

Write a function `divide_resources(total_ram, num_containers)` that returns `total_ram / num_containers`.
1. Wrap the division in a `try/except` block.
2. If `num_containers` is `0`, Python will natively throw a `ZeroDivisionError`. Catch this specific error and return the string `"Cannot divide by zero"`.
3. Test your function by calling `divide_resources(16, 0)` and printing the result.
