<!-- TODO: Rewrite and humanize content from 05-python-apis\module-17-internet-http-fundamentals.md, 05-python-apis\module-18-rest-apis-with-python.md -->

# Module 17 — Internet & HTTP Fundamentals

## 1. Chapter Introduction
Welcome to Part IV. If Linux is the foundation of DevOps, APIs (Application Programming Interfaces) are the nervous system. The days of clicking around in a web browser to launch a server are over. Today, we write code that talks directly to AWS, Azure, GitHub, and Kubernetes. In this module, we will demystify what an API actually is, how the internet communicates, and how to read JSON—the universal language of the cloud.

## 2. What You Will Learn
- What a REST API is and how it works over HTTP.
- The meaning of HTTP Status Codes (200, 404, 500).
- The four main HTTP verbs (GET, POST, PUT, DELETE).
- What JSON is and how it maps directly to Python Dictionaries.
- How to parse JSON data using Python's built-in `json` module.

## 3. Why This Topic Matters in DevOps
When you run a command like `aws ec2 describe-instances`, your computer doesn't magically reach inside an Amazon data center. The AWS CLI simply formats an HTTP request and sends it over the internet to Amazon's API. Amazon's API reads the request and replies with a massive block of text formatted as JSON. If you want to build your own automation tools, integrate with Slack, or trigger GitHub Actions, you must know how to construct API requests and parse JSON responses.

## 4. Concept Explained in Simple Language
### What is an API?
An API is a digital waiter at a restaurant. 
You (the client) sit at a table. The kitchen (the server/cloud provider) has the food (the data/servers). You cannot just walk into the kitchen and cook your own food. You must look at the menu, give your order to the waiter (the API), and the waiter brings the food back to you.

### What is JSON?
JSON (JavaScript Object Notation) is the format in which the waiter brings you the food. It is simply a highly structured text string. Because it looks almost exactly like a Python Dictionary, it is incredibly easy to parse in Python.

## 5. Real-World Analogy
- **HTTP GET:** You ask the waiter, "Can I see the menu?" (Reading data)
- **HTTP POST:** You tell the waiter, "I want to order a burger." (Creating data, like a new server)
- **HTTP PUT:** You tell the waiter, "Actually, change my order from a burger to a salad." (Updating data)
- **HTTP DELETE:** You tell the waiter, "Cancel my order." (Deleting data, like terminating a server)

## 6. Basic Example: Python and JSON
Let's look at how similar JSON is to a Python dictionary.

**A Raw JSON String (from an API):**
```json
{
  "hostname": "web-01",
  "status": "running",
  "tags": ["prod", "frontend"]
}
```

**Parsing it in Python:**
```python
import json

# Imagine this string came back from an AWS API
api_response_string = '{"hostname": "web-01", "status": "running"}'

# 1. json.loads() means "Load String". It converts the JSON text into a Python Dictionary.
server_data = json.loads(api_response_string)

# 2. Now you can treat it like a normal dictionary!
print(server_data["status"])  # Output: running
```

## 7. Step-by-Step Example: Generating JSON
APIs don't just send you JSON; they expect you to send JSON to them when you want to create something (POST).

```python
import json

# 1. We start with a Python Dictionary
new_server_config = {
    "instance_type": "t2.micro",
    "region": "us-east-1",
    "dry_run": True
}

# 2. json.dumps() means "Dump String". It converts the Dictionary into a JSON formatted text string.
# We add indent=4 to make it readable for humans (Pretty Print)
json_payload = json.dumps(new_server_config, indent=4)

print("This text is ready to be sent to an API:")
print(json_payload)
```

## 8. DevOps Example: Handling Deep JSON
Cloud APIs often return deeply nested JSON. You must chain dictionary keys and list indexes to find the data.

```python
import json

complex_json_string = """
{
    "data": {
        "clusters": [
            {"name": "k8s-prod", "nodes": 12},
            {"name": "k8s-dev", "nodes": 3}
        ]
    }
}
"""

parsed_data = json.loads(complex_json_string)

# Navigate the structure: dictionary -> dictionary -> list -> dictionary -> value
dev_cluster_nodes = parsed_data["data"]["clusters"][1]["nodes"]
print(f"The dev cluster has {dev_cluster_nodes} nodes.") # Output: 3
```

## 9. Cloud Example: HTTP Status Codes
When the API (waiter) replies, it always gives a 3-digit Status Code to tell you if the request succeeded.

- **2xx (Success):** E.g., `200 OK`, `201 Created` (Server successfully launched).
- **4xx (Client Error):** You messed up. E.g., `400 Bad Request`, `401 Unauthorized` (Bad password), `404 Not Found` (Server ID doesn't exist).
- **5xx (Server Error):** The cloud provider messed up. E.g., `500 Internal Server Error`, `503 Service Unavailable` (AWS is down).

*In automation, you must ALWAYS check the status code before parsing the JSON!*

## 10. Production Example: Safely Parsing APIs
In production, you cannot assume an API will actually return valid JSON. If an API gateway crashes, it might return an HTML error page (like a 502 Bad Gateway). If you run `json.loads()` on HTML, your script will crash.

```python
import json

bad_api_response = "<html><body>502 Bad Gateway</body></html>"

try:
    data = json.loads(bad_api_response)
except json.JSONDecodeError:
    print("CRITICAL: The API returned invalid JSON. The service might be down.")
```

## 11. Common Mistakes
- **Confusing single and double quotes:** JSON *requires* double quotes (`""`) for keys and strings. If you hand-write a JSON string with single quotes (`"{'key': 'value'}"`), `json.loads()` will crash.
- **Forgetting to serialize:** If you try to send a raw Python dictionary to a REST API over the internet, the HTTP protocol will fail. You must `json.dumps()` it into a string first.

## 12. Troubleshooting
**Error:** `json.decoder.JSONDecodeError: Expecting value: line 1 column 1 (char 0)`
**Fix:** You tried to parse an empty string or a non-JSON string. Print out the raw text you received from the API *before* running `json.loads()` to see what broken data you actually received.

## 13. Security Considerations
Never blindly trust the data inside a JSON response, especially if the API belongs to a third party. If a third-party API gets compromised, it might inject malicious URLs or excessively large data blocks into the JSON. Validate the data types (e.g., ensure `nodes` is actually an integer) before passing that data into internal shell commands or database queries.

## 14. Senior Engineer's Perspective
**Junior Engineer:** "The API documentation says it returns a list of servers. So I'll just write `servers = response['items']`."
**Senior Engineer:** "What if you ask the API for servers in a region that has zero servers? Will the API return an empty list `[]`, or will it omit the `items` key entirely? If it omits the key, your script crashes with a `KeyError`. In production, you must practice defensive programming. Use `servers = response.get('items', [])`. If the key is missing, you safely get an empty list, and the loop simply does nothing."

## 15. Hands-on Exercise
**Beginner Exercise:**
1. Import the `json` module.
2. Create a multiline string containing this JSON: `{"user": "admin", "permissions": ["read", "write"]}`
3. Use `json.loads()` to convert it to a dictionary.
4. Extract the second item in the permissions list ("write") and print it.

*Expected Outcome:* The script prints "write".

## 16. Interview Questions
**Beginner:**
Q: What is the difference between `json.loads()` and `json.dumps()`?
A: `loads()` (load string) converts a JSON formatted text string into a Python Dictionary. `dumps()` (dump string) converts a Python Dictionary into a JSON formatted text string.

**Intermediate:**
Q: Your Python script makes an API call to delete a user. The API returns an HTTP 403 status code. What does this mean?
A: A 4xx series code is a client error. Specifically, 403 means "Forbidden." It means my script successfully reached the API, and my authentication token is valid, but I do not have the authorization/permissions required to perform the delete action.

**Advanced / Production Scenario:**
Q: You are fetching metrics from an API every minute. Occasionally, the script crashes with `json.JSONDecodeError`. How would you fix this?
A: This usually happens when an API is temporarily overloaded or sitting behind a load balancer that returns an HTML error page (like a 502) instead of the expected JSON. I would wrap the `json.loads()` call in a `try/except` block catching `json.JSONDecodeError`. If it fails, I would log the raw text response for debugging, and gracefully retry the API call after a short `time.sleep()`.

## 17. Chapter Summary
APIs are the universal interface of modern infrastructure, and JSON is the language they speak. By understanding HTTP verbs, status codes, and how to seamlessly convert JSON text into Python dictionaries using `json.loads()`, you are now ready to start communicating with the cloud programmatically.

## 18. Quick Revision Notes
- **API:** The digital waiter connecting you to the cloud.
- **JSON:** Highly structured text that looks like a dictionary.
- **GET (Read), POST (Create), PUT (Update), DELETE (Destroy).**
- **200s:** Success. **400s:** Client Error. **500s:** Server Error.
- **`json.loads(string)`:** Text -> Dictionary.
- **`json.dumps(dict)`:** Dictionary -> Text.
- Always use `try/except json.JSONDecodeError`.


---

# Module 18 — REST APIs with Python

## 1. Chapter Introduction
You know what an API is, and you know how to parse JSON. Now, you need the tool to actually make the connection. While Python has a built-in module for web requests (`urllib`), it is notoriously complex and frustrating to use. Instead, the entire Python industry uses a third-party library called `requests`. It is so fundamental to modern Python that many engineers consider it part of the core language. In this module, we will use `requests` to talk to the internet.

## 2. What You Will Learn
- How to install and import the `requests` library.
- How to perform `GET` and `POST` requests.
- How to pass Headers (for authentication) and Query Parameters.
- How `requests` automatically handles JSON conversion.
- How to properly handle timeouts and connection errors in production.

## 3. Why This Topic Matters in DevOps
Imagine a server fails a health check. A modern DevOps response isn't just to restart the server; it's to trigger an automated alert. By using the `requests` module, you can write a script that sends a `POST` request to the Slack API, instantly messaging the on-call engineer with the exact error log. You can also use it to query GitHub for open Pull Requests, or tell Cloudflare to purge its cache. `requests` is your bridge to the rest of the SaaS world.

## 4. Concept Explained in Simple Language
### Sending a Request
Think of `requests` as a digital delivery driver. 
- You give the driver an address (the **URL**).
- You give the driver a package to deliver (the **JSON payload**).
- You give the driver a VIP badge so they can enter the building (the **Authentication Header**).

The driver goes to the address, drops off the package, shows the badge, and comes back with a receipt (the **Response**). The Response contains the Status Code and any data the server sent back.

## 5. Real-World Analogy
Calling an API with `requests` is like placing a phone order for a pizza.
- **URL:** The phone number of the pizzeria.
- **Method (POST):** You are creating a new order.
- **Headers:** "Hi, I have a VIP membership card, the number is 12345."
- **Payload (JSON):** "I want a large pepperoni."
- **Response:** "Your order is confirmed (Status 201), it will be ready in 20 minutes."

## 6. Basic Example: A Simple GET Request
Before you begin, you must install the library via your terminal: `pip install requests`

```python
import requests

# 1. We tell the driver to GET data from a public testing API
response = requests.get("https://api.github.com/events")

# 2. Check the receipt (Status Code)
print(f"Status Code: {response.status_code}") # Should be 200

# 3. Read the data
# requests is incredibly smart. If you call .json(), it automatically 
# runs json.loads() on the response text and gives you a Python Dictionary!
data = response.json()

print(f"The first event type is: {data[0]['type']}")
```

## 7. Step-by-Step Example: Passing Headers and Parameters
APIs usually require authentication (Headers) and filtering (Query Parameters). 

```python
import requests
import os

url = "https://api.mycompany.com/v1/servers"

# 1. Headers: Always use a dictionary. This is where secrets go.
# We pull the secret securely from the OS! (Module 13)
headers = {
    "Authorization": f"Bearer {os.environ.get('API_TOKEN')}",
    "Accept": "application/json"
}

# 2. Parameters: This adds "?region=us-east&status=running" to the URL automatically.
params = {
    "region": "us-east",
    "status": "running"
}

# 3. Make the request
response = requests.get(url, headers=headers, params=params)

if response.status_code == 200:
    print(response.json())
```

## 8. DevOps Example: A POST Request (Sending a Slack Alert)
Let's simulate sending an alert to a webhook. When sending data to an API, you must use the `json=` parameter.

```python
import requests

webhook_url = "https://hooks.slack.com/services/T0000/B000/XXXX"

# The data we want to send
alert_message = {
    "text": "CRITICAL: Database CPU is at 99%!"
}

# By passing our dictionary to the `json=` parameter, requests automatically
# runs json.dumps() for us, and sets the correct HTTP headers!
response = requests.post(webhook_url, json=alert_message)

if response.status_code == 200:
    print("Alert sent to Slack successfully.")
else:
    print(f"Failed to send alert: {response.status_code}")
```

## 9. Cloud Example: Error Checking
Instead of manually writing `if response.status_code == 200:`, the `requests` module has a built-in method to crash the script (throw an exception) if the API returns a 4xx or 5xx error.

```python
import requests

response = requests.get("https://httpbin.org/status/404")

# This checks the status code. If it's a 400 or 500 level error, 
# it raises an HTTPError exception automatically!
try:
    response.raise_for_status()
    print("Success!")
except requests.exceptions.HTTPError as err:
    print(f"The API call failed: {err}")
    # Output: The API call failed: 404 Client Error...
```

## 10. Production Example: Mandatory Timeouts
If an API goes down and stops responding, a `requests.get()` call will wait **forever**. It will hang your script indefinitely until you manually kill it. In production, you must *always* specify a timeout.

```python
import requests

try:
    # If the API doesn't respond in 5 seconds, it throws a Timeout exception.
    response = requests.get("https://github.com", timeout=5)
    print("Connected!")
except requests.exceptions.Timeout:
    print("CRITICAL: The API took longer than 5 seconds. Aborting.")
except requests.exceptions.ConnectionError:
    print("CRITICAL: The DNS failed or the server is completely offline.")
```

## 11. Common Mistakes
- **Forgetting `timeout=X`:** The number one cause of frozen automation scripts. Always set a timeout.
- **Hardcoding tokens in Headers:** Writing `"Authorization": "Bearer 12345abc"`. See Module 13. Use environment variables.
- **Using `data=` instead of `json=`:** If you pass a dictionary to `data=`, `requests` formats it as a traditional HTML form submission. If you pass it to `json=`, it formats it as modern JSON. APIs expect JSON.

## 12. Troubleshooting
**Error:** `ModuleNotFoundError: No module named 'requests'`
**Fix:** You forgot to install the library. Run `pip install requests` in your terminal. If you are using a virtual environment (Module 3), make sure it is activated before you install.

## 13. Security Considerations
When making requests to `https://` URLs, `requests` automatically verifies the SSL/TLS certificate of the server to prevent Man-In-The-Middle attacks. Sometimes, internal corporate servers have self-signed certificates, causing `requests` to throw an `SSLError`. 

You can bypass this by adding `verify=False` to your request. **Do not do this in production unless absolutely necessary.** If you disable verification on a public API, your script is highly vulnerable to interception and credential theft.

## 14. Senior Engineer's Perspective
**Junior Engineer:** "The API is failing with a 400 Bad Request, but my code looks perfect!"
**Senior Engineer:** "A 400 error means the server rejected *how* you formatted your request. Before guessing what's wrong, look at the server's exact response. Change your code to `print(response.text)`. Even if it's a 400 error, APIs usually send back a JSON payload explaining *exactly* which field is missing or formatted incorrectly."

## 15. Hands-on Exercise
**Intermediate Exercise:**
We are going to use a free, public testing API called HTTPBin.
1. Write a script that imports `requests`.
2. Make a `GET` request to `https://httpbin.org/get`
3. Pass a dictionary of parameters containing `{"user": "devops_student"}` using the `params=` argument.
4. Set a timeout of 5 seconds.
5. Extract the JSON from the response using `.json()`.
6. Print the entire JSON object to the screen.

*Expected Outcome:* You will see a large JSON dictionary printed, and inside the `"args"` key, you will see your `"user": "devops_student"` data reflected back to you.

## 16. Interview Questions
**Beginner:**
Q: Why do we use the `requests` module instead of Python's built-in `urllib`?
A: `requests` abstracts away the complex boilerplate required by `urllib`. It automatically handles JSON encoding/decoding, simplifies passing headers and parameters, and provides highly readable methods for HTTP verbs (like `.get()` and `.post()`).

**Intermediate:**
Q: What happens if you do not define a `timeout` parameter in a `requests.get()` call?
A: By default, `requests` has no timeout limit. If the target server is unresponsive but the network connection remains open, the script will hang indefinitely, potentially blocking CI/CD pipelines and consuming server resources forever.

**Advanced / Production Scenario:**
Q: You have a script that interacts with an external API. Sometimes it succeeds, but sometimes it throws a `ConnectionError` or `Timeout`. How do you make the script more resilient?
A: I would implement a retry mechanism. Instead of failing immediately on a `Timeout`, I would catch the exception and use a `for` loop to retry the request up to 3 times, implementing an "exponential backoff" (e.g., `time.sleep(2)`, then `sleep(4)`) between attempts to give the struggling API time to recover.

## 17. Chapter Summary
The `requests` module is the industry standard for HTTP communication in Python. By mastering how to send Headers, pass JSON payloads, and enforce strict timeouts, you can write automation scripts that interact securely and reliably with any cloud service or SaaS platform in the world.

## 18. Quick Revision Notes
- Install via: **`pip install requests`**
- **`requests.get(url, headers={}, params={}, timeout=5)`**: Read data.
- **`requests.post(url, headers={}, json={}, timeout=5)`**: Create data.
- **`response.json()`**: Automatically converts response to a Dictionary.
- **`response.status_code`**: Check the HTTP status (200 is good).
- **`response.raise_for_status()`**: Instantly crash on 4xx or 5xx errors.
- Always, always, always set a **`timeout`**!


---

