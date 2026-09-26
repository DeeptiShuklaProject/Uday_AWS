# Chapter 5: Functions and Modularity

## Introduction

As a DevOps engineer, you will quickly find yourself writing the exact same code over and over again. Maybe you have a 20-line block of code that checks if a server is online and healthy. If you need to do that in 5 different places in your deployment script, copying and pasting those 20 lines creates a 100-line mess. 

Functions allow you to write code once, package it, give it a name, and reuse it infinitely. If you build a CI/CD deployment tool, it needs to validate credentials, build a Docker container, push it to a registry, and update Kubernetes. If you write this as one giant, 500-line script, it becomes impossible to read, test, or debug. By breaking it down into distinct functions (`validate_creds()`, `build_image()`, `update_k8s()`), your main execution logic becomes 4 lines long and highly readable. Functions are the foundation of modular engineering.

## The Core Idea: Reusable Logic

A function is essentially a mini-program inside your script. It is a machine that takes some raw materials (Inputs/Arguments), does a specific job, and spits out a finished product (Return value).

- **`def` (Define):** This tells Python you are building a new function.
- **Arguments:** The inputs where you pass data into the function.
- **`return`:** The statement that passes the final result back out to the main script.

## Essential Code Patterns

### Defining and Calling a Function

```python
# 1. Defining the function (Building the machine)
def greet_server(hostname):
    message = f"Hello, {hostname}. You are online."
    return message

# 2. Calling the function (Using the machine)
result = greet_server("web-01")
print(result) # Output: Hello, web-01. You are online.
```

### Multiple Arguments

Functions can take multiple inputs to perform calculations or construct complex objects.

```python
def calculate_uptime_percentage(total_hours, downtime_hours):
    uptime = total_hours - downtime_hours
    percentage = (uptime / total_hours) * 100
    
    # We round it to 2 decimal places before returning
    return round(percentage, 2)

monthly_uptime = calculate_uptime_percentage(720, 2.5)
print(f"Server Uptime: {monthly_uptime}%") # Output: Server Uptime: 99.65%
```

## In Production

### Reusable DevOps Logic

Let's build a practical function that takes a raw, messy IP address string from a log file, cleans it, and checks if it belongs to an internal local network. You can use this single block of logic anywhere in your infrastructure codebase.

```python
def is_internal_ip(raw_ip):
    clean_ip = raw_ip.strip()
    
    if clean_ip.startswith("10.") or clean_ip.startswith("192.168."):
        return True
    else:
        return False

# Now we can cleanly reuse this logic
print(is_internal_ip("   10.0.5.10 \n")) # Output: True
print(is_internal_ip("8.8.8.8"))          # Output: False
```

### Keyword Arguments for Readability

When automating cloud resources, functions often take many arguments. Python allows **Keyword Arguments**, which means you explicitly state the name of the input when you call the function. This vastly improves readability.

```python
def deploy_server(instance_type, region, ami_id):
    print(f"Deploying {instance_type} in {region} using {ami_id}...")
    return "i-0987654321"

# Bad readability: What do these random strings mean?
server_id = deploy_server("t3.micro", "us-east-1", "ami-12345")

# Excellent readability: The order doesn't even matter!
server_id = deploy_server(
    region="us-east-1",
    instance_type="t3.micro",
    ami_id="ami-12345"
)
```

### Default Values and Type Hints

In production, you want your functions to be foolproof and self-documenting. You can provide **Default Values** (so an argument becomes optional), and **Type Hints** (to tell other engineers exactly what type of data the function expects).

```python
# 'hostname' must be a String.
# 'retries' is an Integer, defaulting to 3 if not provided.
# '-> bool' means this function will return a Boolean.

def check_health(hostname: str, retries: int = 3) -> bool:
    print(f"Checking {hostname}. Max retries: {retries}")
    # Mock logic
    return True

# Call with default retries
check_health("db-01") 

# Call with custom retries
check_health("web-02", retries=5) 
```

## Watch Out For

- **Forgetting to `return`:** If your function just uses `print()`, the data is shown on the screen but lost to the script. The main script receives `None`. Always use `return` to pass actionable data back to the automation workflow.
- **Variable Scope:** Variables created *inside* a function die when the function ends (local scope). You cannot use them outside the function unless you `return` them. This is actually a feature, not a bug, because it prevents memory leaks and keeps your global state clean.
- **DRY Principle:** "Don't Repeat Yourself." If you write the same block of code twice in a script, it should immediately be extracted into a function. Functions make code testable; you can write an automated test specifically for `check_health()` without running the entire deployment script.

## Practice / Try This

Write a function named `format_server_tag`.
- It should take two arguments: `environment` and `app_name`.
- It should return a string formatted as: `"[ENVIRONMENT] - APP_NAME"`
- Ensure both the `environment` and `app_name` are forced to uppercase, regardless of how the user inputs them. (Hint: use the `.upper()` string method).

Test it by calling:
```python
tag = format_server_tag("prod", "billing_api")
print(tag)
```
