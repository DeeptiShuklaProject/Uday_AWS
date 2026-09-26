# Chapter 4: Conditions and Loops

## Introduction

Without conditions and loops, a script is just a static list of commands executing blindly from top to bottom. Real DevOps automation requires intelligence. You don't just restart a server; you check *if* it is down before restarting it. You don't just process a single log file; you iterate over hundreds of them. 

Conditions give your script the ability to make decisions. Loops give your script the ability to scale those decisions across thousands of resources automatically. Mastering these two concepts is the core mechanism behind almost every infrastructure health-checker, cleanup tool, and CI/CD pipeline.

## The Core Idea: Giving Your Script a Brain

### Conditions (`if`, `elif`, `else`)
A condition is a fork in the road. You ask Python a Yes/No question based on the state of your infrastructure:
- **If** the CPU is over 90%, trigger a PagerDuty alert.
- **Else If (`elif`)** the CPU is over 75%, write a warning to the log.
- **Else** (otherwise), do nothing and exit cleanly.

### Loops (`for`, `while`)
- A **`for` loop** iterates over a known collection. It says: "Take this list of 10 servers, and execute this action on every single one of them, one by one, until the list is empty."
- A **`while` loop** waits for a state change. It says: "Keep doing this action repeatedly *until* a specific condition is met." (e.g., "Keep checking the API *while* the server status is 'pending'").

## Essential Code Patterns

### If / Else Logic
Python relies strictly on **indentation** (spaces) to know what code belongs inside a condition block.

```python
cpu_usage = 95

if cpu_usage > 90:
    print("CRITICAL: CPU is too high! Scaling up...")
elif cpu_usage > 75:
    print("WARNING: CPU is elevated. Monitoring...")
else:
    print("OK: CPU is normal.")
```

### The For Loop
Use `for` loops when you have a defined list of items to process, such as IP addresses or server objects.

```python
ip_addresses = ["10.0.0.1", "10.0.0.2", "10.0.0.3"]

for ip in ip_addresses:
    print(f"Pinging server: {ip}")
    
print("Finished pinging all servers.")
```

## In Production

### Looping Through Dictionaries
In cloud automation, you rarely loop through simple strings. You loop through lists of dictionaries representing complex resource states.

```python
servers = [
    {"hostname": "web-01", "status": "running"},
    {"hostname": "web-02", "status": "stopped"},
    {"hostname": "db-01", "status": "running"}
]

for server in servers:
    # We only want to take action IF the server is stopped
    if server["status"] == "stopped":
        print(f"Alert: {server['hostname']} is down! Attempting restart...")
```

### Polling with While Loops
When you ask AWS or Azure to provision a virtual machine, it doesn't happen instantly. You use a `while` loop to "poll" the API until the resource is ready.

```python
import time

server_status = "pending"
attempts = 0
max_attempts = 30

while server_status != "running":
    attempts += 1
    if attempts > max_attempts:
        print("ERROR: Server took too long to boot. Timeout reached.")
        break # Escape hatch!
        
    print(f"Attempt {attempts}: Status is {server_status}. Waiting...")
    time.sleep(10) # Wait 10 seconds before hitting the API again
    
    # In reality, you would make an API call here to update server_status
    if attempts >= 3:
        server_status = "running" # Mocking a successful boot

print("Server is finally running! Proceeding with configuration.")
```

### Loop Control: Break and Continue
When processing massive amounts of data, efficiency is critical.
- `continue`: Skip the rest of the loop for the current item and move to the next item immediately.
- `break`: Stop the loop completely and exit.

```python
logs = ["INFO: Booted", "INFO: Running", "CRITICAL: Database offline", "INFO: shutting down"]

for log in logs:
    if "INFO" in log:
        continue # Skip info logs, don't waste CPU processing them
        
    if "CRITICAL" in log:
        print(f"Found a critical error: {log}")
        break # We found the error, stop reading the remaining millions of logs!
```

## Watch Out For

- **Infinite While Loops:** If you write a `while` loop but forget to update the condition variable inside the loop (or the API never returns the expected state), the loop will run forever. This is how you accidentally launch a DDoS attack against your own internal APIs. Always implement a `time.sleep()` and an absolute timeout (`break`).
- **IndentationErrors:** Python enforces structure. If you use 4 spaces for the first line inside an `if` block, you must use 4 spaces for the second line. Mixing tabs and spaces will crash the script.
- **Denial of Service (DoS):** Be extremely careful when using `for` loops to process user-uploaded files or raw external data. A file with 10 billion lines will consume all your server's RAM and CPU if looped over without limits.

## Practice / Try This

You have a list of user configurations:
```python
users = [
    {"name": "Alice", "role": "admin"},
    {"name": "Bob", "role": "developer"},
    {"name": "Charlie", "role": "developer"}
]
```
Write a `for` loop that iterates through this list. Inside the loop, write an `if` condition:
- If the role is "admin", print `"{name} has root access."`
- Otherwise, print `"{name} has limited access."`
