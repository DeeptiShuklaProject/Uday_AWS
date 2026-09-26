<!-- TODO: Rewrite and humanize content from 05-python-apis\module-19-api-auth-security.md -->

# Module 19 — API Authentication & Security

## 1. Chapter Introduction
We have spent the last 15 modules learning the individual puzzle pieces of Python: Variables, Lists, Dictionaries, Loops, Functions, Linux Integration, Error Handling, and the `requests` module. In this chapter, we put all the pieces together. We are going to build a comprehensive, production-grade script that acts as a Cloud Resource Checker. It will query a Mock Cloud API for a list of servers, identify which servers are offline, and generate a formatted alert.

## 2. What You Will Learn
- How to structure a professional Python script from top to bottom.
- How to combine `requests` with Error Handling (`try/except`).
- How to securely inject API tokens using `os.environ`.
- How to parse a complex JSON response and iterate through it using `for` loops.
- How to write modular code using Functions.

## 3. Why This Topic Matters in DevOps
This specific pattern—fetching data, filtering the data, and alerting on anomalies—represents roughly 40% of the code a DevOps engineer writes. Whether you are checking if SSL certificates are about to expire, if Kubernetes pods are crashing, or if AWS billing has spiked, the underlying architecture of the script is exactly the same as the one we are building today.

## 4. Concept Explained in Simple Language
### The Architecture of an Automation Script
A production script should read like a story, broken into three clear chapters:
1. **The Setup:** Import libraries and grab secrets from the OS.
2. **The Logic (Functions):** Define *how* to do the work. One machine fetches data, another machine filters it.
3. **The Execution (Main block):** The director that actually tells the machines to turn on and run in the correct order.

## 5. Real-World Analogy
Think of this script like running a restaurant.
- **Imports & Secrets:** Unlocking the doors and turning on the lights.
- **Functions:** The recipes (how to cook the food).
- **The Execution:** The kitchen manager actually shouting, "Cook recipe #1, then cook recipe #2!"

## 6. Basic Example: The Skeleton
Before writing the full script, let's look at the skeleton.

```python
import os
import requests

# 1. SETUP: Get secrets
API_TOKEN = os.environ.get("CLOUD_API_TOKEN")

# 2. LOGIC: Define the functions
def get_server_data():
    pass # 'pass' means "I will write this later"

def find_offline_servers(data):
    pass 

# 3. EXECUTION: Run the script
if __name__ == "__main__":
    # This weird looking block ensures the script only runs if we call it directly.
    print("Starting Cloud Resource Checker...")
```

## 7. Step-by-Step Example: Building the Script
Let's build the full script. We will use a public testing URL (`https://jsonplaceholder.typicode.com/users`) to mock our Cloud API. We will pretend the "users" are actually "servers", and we want to find the ones in the "Gwenborough" region.

**File: `resource_checker.py`**

```python
#!/usr/bin/env python3
import os
import sys
import requests

# --- 1. SETUP ---
# In a real script, this would be "https://api.aws.com/servers"
API_URL = "https://jsonplaceholder.typicode.com/users"

# Ensure our environment variable exists (Module 13)
API_TOKEN = os.environ.get("CLOUD_API_TOKEN")
if not API_TOKEN:
    print("CRITICAL: CLOUD_API_TOKEN is missing!")
    sys.exit(1)

# --- 2. LOGIC (FUNCTIONS) ---
def fetch_cloud_inventory(url: str, token: str) -> list:
    """Fetches the JSON inventory from the Cloud Provider."""
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        # We always use a timeout (Module 15)
        response = requests.get(url, headers=headers, timeout=10)
        
        # Will instantly throw an error if status is 404, 500, etc.
        response.raise_for_status() 
        
        # Convert JSON string to a Python List of Dictionaries
        return response.json()
        
    except requests.exceptions.RequestException as e:
        # Catches Timeouts, Connection Errors, and HTTP Errors (Module 9)
        print(f"ERROR: Failed to reach Cloud API: {e}")
        sys.exit(1)

def filter_critical_servers(inventory: list, target_city: str) -> list:
    """Filters the inventory to find servers in a specific city."""
    critical_servers = []
    
    # Loop through the massive list (Module 7)
    for server in inventory:
        # Safely extract data using .get() (Module 6)
        # Note: The mock API nests city inside an 'address' dictionary.
        address = server.get("address", {})
        city = address.get("city", "Unknown")
        
        if city == target_city:
            critical_servers.append(server.get("name"))
            
    return critical_servers

# --- 3. EXECUTION ---
if __name__ == "__main__":
    print(f"Connecting to {API_URL}...")
    
    # 1. Fetch the data
    all_servers = fetch_cloud_inventory(API_URL, API_TOKEN)
    print(f"Successfully fetched {len(all_servers)} servers.")
    
    # 2. Filter the data
    problem_servers = filter_critical_servers(all_servers, "Gwenborough")
    
    # 3. Alerting Logic
    if len(problem_servers) > 0:
        print("\nALERT! Found critical servers in target region:")
        for name in problem_servers:
            print(f" - {name}")
    else:
        print("\nAll clear. No critical servers found in target region.")
        
    sys.exit(0)
```

## 8. DevOps Example: Testing the Script
To run this script on a Linux server, you must first provide the required environment variable.

```bash
# This sets the variable just for this one execution
export CLOUD_API_TOKEN="super_secret_mock_token"

# Make it executable
chmod +x resource_checker.py

# Run it
./resource_checker.py
```

## 9. Cloud Example: Moving from Mock to Real
If you want to use this script in real life to query DigitalOcean or AWS, you only have to change the `API_URL`, the `Authorization` header format, and the dictionary keys inside the `filter_critical_servers` function. The core architecture—the error handling, timeouts, and logic flow—remains exactly the same.

## 10. Production Example: Logging vs. Printing
In our script, we used `print()`. In a true production environment, `print()` is often insufficient because it doesn't add timestamps or severity levels (like INFO, WARNING, ERROR). As you progress in your career, you will replace `print()` with Python's built-in `logging` module, which automatically formats output so systems like Datadog or ELK can parse it.

## 11. Common Mistakes
- **Writing logic in the global scope:** If you put your `requests.get()` call at the very top of the file (outside of a function), it will run immediately when the script is imported, making the script impossible to test safely. Always put logic inside functions.
- **Forgetting `sys.exit()`:** If the API fails, the script prints an error but finishes naturally with a `0` exit code. CI/CD pipelines will think it succeeded!

## 12. Troubleshooting
**Error:** `AttributeError: 'list' object has no attribute 'get'`
**Fix:** You tried to use `.get()` on a List instead of a Dictionary. Remember, APIs usually return a List containing Dictionaries. You must loop through the List first (`for item in my_list:`), and then use `.get()` on the `item`.

## 13. Security Considerations
Because our script accepts an Environment Variable for the token, it is highly secure. It can be run locally (using a `.env` file), run in Jenkins, or deployed as an AWS Lambda function, and the secrets are never exposed in the source code.

## 14. Senior Engineer's Perspective
**Junior Engineer:** "I wrote a 200-line script, but I didn't use any functions. It just runs top to bottom. It works, so what's the problem?"
**Senior Engineer:** "Imagine the Cloud Provider changes their API endpoint. In a top-to-bottom script, you have to read 200 lines to find where the API call happens. In our structured script, you know exactly where it is: inside `fetch_cloud_inventory()`. Furthermore, what if we want to write a second script that *just* fetches the inventory but does something else with it? Because we used functions, we can import `fetch_cloud_inventory` into the new script and reuse the code instantly. Modularity equals maintainability."

## 15. Hands-on Exercise
**Advanced Exercise:**
1. Copy the `resource_checker.py` script above into your code editor.
2. Run it locally (remember to export the dummy `CLOUD_API_TOKEN` first!).
3. Modify the `filter_critical_servers` function. Instead of searching for the city "Gwenborough", search for servers where the `username` is `"Kamren"`.
4. Run the script again and see if your modified logic correctly identifies the server name belonging to "Kamren".

## 16. Interview Questions
**Beginner:**
Q: What does `if __name__ == "__main__":` do at the bottom of a Python script?
A: It tells Python: "Only run the execution block if this script is being run directly from the terminal." If another Python script imports this file to reuse its functions, the execution block is safely ignored.

**Intermediate:**
Q: In the script above, what happens if the API token environment variable is completely missing?
A: The script hits the `if not API_TOKEN:` check at the top, prints a CRITICAL error message to the console, and immediately terminates using `sys.exit(1)`. This is a "fail-fast" mechanism.

**Advanced / Production Scenario:**
Q: You are asked to review a junior engineer's script. They have written an API checker that loops through a list of 1,000 servers. For each server, it opens an SSH connection to check disk space. The script takes 2 hours to run. How would you redesign it?
A: The script is suffering from synchronous blocking—it waits for server 1 to finish before checking server 2. I would redesign the script to use concurrency (like Python's `asyncio` or `ThreadPoolExecutor`). I would also write a function that performs the check on a single server, and then map that function concurrently across the list of 1,000 servers, reducing the execution time from hours to minutes.

## 17. Chapter Summary
Congratulations! You have just built a legitimate, production-style automation script. You have combined everything from Linux execution, environment variables, HTTP requests, JSON parsing, error handling, and logical control flow. You now understand the fundamental architecture of DevOps automation in Python.

## 18. Quick Revision Notes
- **Structure:** Setup (Secrets) -> Logic (Functions) -> Execution.
- **Fail Fast:** Check for required secrets at the very top of the script.
- **Modularity:** Keep API calls separate from Data Filtering logic.
- **`sys.exit(1)`:** Always exit with an error code on failure.
- **`if __name__ == "__main__":`**: Use this to control execution.


---

