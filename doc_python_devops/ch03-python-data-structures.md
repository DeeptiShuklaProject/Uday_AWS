# Chapter 3: Data Structures (Lists, Tuples, Sets & Dictionaries)

## Introduction

In the previous chapter, we learned how to store a single piece of data—like a single server name—in a single variable. But what happens when you query your cloud infrastructure and get back 5,000 servers? You certainly can't create 5,000 variables. You need structural containers to hold bulk data.

In Python, these containers are called Data Structures. When you run a command like "Get all AWS EC2 instances," AWS doesn't return a single string. It returns a massive JSON payload. In Python, a JSON object maps directly to a Dictionary, and a JSON array maps to a List. If you do not master these core data structures, you will struggle to interact with any modern Cloud API, Kubernetes cluster, or CI/CD system.

## The Core Idea: Organizing Bulk Data

There are four primary data structures in Python, each designed for a specific use case:

- **Lists `[]`**: An ordered collection. Think of it as a line of boxes where each box holds an item. You can add items to the end, remove them, or look at a specific item by its position. Lists are the workhorse of Python data management.
- **Tuples `()`**: Exactly like a List, except it is locked. Once you create a Tuple, you cannot add, remove, or change the items inside. Tuples are used to protect data that must never change accidentally during a script's execution (like fixed GPS coordinates or a database IP and Port).
- **Sets `{}`**: An unordered collection with one strict rule: no duplicates allowed. If you try to add "server1" to a Set three times, it will only store it once. Sets are heavily used in DevOps to find unique items, like extracting unique IP addresses from a massive log file.
- **Dictionaries `{"key": "value"}`**: A labeled filing cabinet. Instead of finding data by its position (like in a List), you find data by its label (the Key). To find a server's IP address, you don't ask for "item number 3"; you ask for the label `"ip_address"`. This is how you parse JSON.

## Essential Examples

### Lists and Dictionaries

Lists keep the order of the data you put in. Dictionaries map keys to values.

```python
# A list of server names
servers = ["web-01", "web-02", "db-01"]

# Access the first server using its index (starts at 0)
print(servers[0])  # Output: web-01

# Add a new server to the end of the list
servers.append("cache-01")


# A dictionary representing a single server's configuration
server_info = {
    "hostname": "web-01",
    "ip": "10.0.0.5",
    "is_active": True
}

# Retrieve the IP address by calling its key
print(server_info["ip"])  # Output: 10.0.0.5

# Update the active status
server_info["is_active"] = False
```

### Tuples and Sets

Tuples protect data. Sets enforce uniqueness.

```python
# Database connection tuple: (IP, Port) - Immutable!
db_connection = ("192.168.1.50", 5432)

print(db_connection[1]) # Output: 5432

# db_connection[1] = 8080  <-- THIS WILL CRASH! Tuples cannot be changed.


# A list of IPs parsed from a log, containing duplicates
log_ips = ["10.0.0.1", "10.0.0.2", "10.0.0.1", "10.0.0.1"]

# Convert the list to a set to automatically strip out the duplicates
unique_ips = set(log_ips)
print(unique_ips) # Output: {'10.0.0.1', '10.0.0.2'}
```

## In Production

### Working with API Responses

Often, you will encounter a List that contains multiple Dictionaries. This is the standard architectural format for most Cloud APIs.

```python
# A list of server dictionaries (simulating a mock API response)
inventory = [
    {"name": "web-01", "status": "running"},
    {"name": "web-02", "status": "stopped"},
    {"name": "db-01", "status": "running"}
]

# To get the status of the second server:
# inventory[1] grabs the dictionary. Then ["status"] grabs the value from that dictionary.
print(inventory[1]["status"])  # Output: stopped
```

If you use Boto3 to request your AWS EC2 instances, the response will look exactly like a complex, nested Python Dictionary. Extracting specific data requires navigating through Lists and Dictionaries simultaneously.

```python
# Simplified AWS API Response
aws_response = {
    "Reservations": [
        {
            "Instances": [
                {"InstanceId": "i-1234567890abcdef0", "State": {"Name": "running"}}
            ]
        }
    ]
}

# Extracting the Instance ID
instance_id = aws_response["Reservations"][0]["Instances"][0]["InstanceId"]
print(instance_id) # Output: i-1234567890abcdef0
```

### Safe Dictionary Extraction

In production, assuming a Key always exists in a Dictionary is dangerous. If you ask for `server_info["region"]` and the API didn't return a region key, your entire script will crash with a `KeyError`. Always use the `.get()` method.

```python
server_info = {"hostname": "web-01", "ip": "10.0.0.5"}

# BAD: Will crash if "region" is missing
# region = server_info["region"] 

# GOOD: .get() returns None (or a specified default value) if the key is missing.
region = server_info.get("region", "us-east-1") 
print(f"Server is in {region}")
```

### Performance Optimization with Sets

Searching through a List is inefficient. Python has to check every single item one by one (O(n) time complexity). If you have a list of 100,000 banned IP addresses and need to check if an incoming connection is on the list, a List will slow your script down drastically.

If you convert that list into a Set (`banned_set = set(banned_list)`), checking for membership (`if ip in banned_set:`) becomes nearly instant (O(1) time complexity), regardless of whether there are 10 IPs or 10 million. Knowing *which* data structure to use is what separates a scripter from a software engineer.

## Watch Out For

- **`KeyError`:** Occurs when you try to access a dictionary key that doesn't exist using bracket notation (`dict["missing"]`). Use `dict.get("missing")` to handle missing data gracefully.
- **`IndexError`:** Occurs when you try to access an item in a list that doesn't exist (e.g., asking for `my_list[5]` when the list only holds 3 items).
- **Modifying Tuples:** Attempting to append to or alter a Tuple will result in a `TypeError`. If the data needs to change during runtime, use a List instead.
- **Security with Dictionaries:** When parsing dictionaries from untrusted sources (like an external webhook), never blindly pass the entire dictionary into a database or shell command. Extract only the keys you explicitly expect to prevent injection vulnerabilities.

## Practice / Try This

You have the following dictionary representing the configuration of a Kubernetes Pod:
```python
pod = {
    "metadata": {"name": "nginx-pod", "namespace": "production"},
    "status": {"phase": "Running", "restarts": 2}
}
```

Write a short script to:
1. Print the pod's namespace.
2. Use `.get()` to safely fetch the pod's "cpu_limit" from the "metadata" dictionary. If it doesn't exist, provide a default fallback of `"500m"`.
3. Print the CPU limit.
