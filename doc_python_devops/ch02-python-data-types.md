# Chapter 2: Python Essentials: Data Types and Strings

## Introduction

Programming languages are essentially tools to manipulate data. Before you can write a script that queries a cloud provider or parses a log file, you have to understand how Python represents and stores information. We won't be using generic programming examples like `apple_count = 5`. Instead, we'll look at how a DevOps engineer handles infrastructure data.

When you query AWS for a list of servers, the cloud provider doesn't just return raw text; it returns structured data. A server ID might be a string of characters, its CPU usage might be a decimal number, and its running state might be a boolean (True/False). If you don't know how to store, convert, and manipulate these basic data types, you cannot automate infrastructure effectively.

Equally important is string manipulation. In DevOps, almost everything you interact with is text. Logs are text. Configuration files are text. IP addresses are text. If you want to find out why a server crashed, you need to read the log files. String manipulation is the core of log analysis and configuration management.

## The Core Idea: Variables and Types

A variable is a labeled container where you store data. Unlike C++ or Java, Python doesn't require you to declare what kind of data the container will hold. Python figures it out automatically based on what you assign to it.

Here are the fundamental data types you will use constantly:
- **String (`str`):** Text. Always wrapped in quotes. (e.g., `"srv-web-01"`)
- **Integer (`int`):** Whole numbers. (e.g., `443`)
- **Float (`float`):** Numbers with decimals. (e.g., `75.5`)
- **Boolean (`bool`):** True or False. Python is case-sensitive, so note the capital T and F. (e.g., `True`)

Think of these types like tags on a physical server rack:
- The hostname tag says "Database-Primary" (String).
- The tag showing the number of hard drives says 4 (Integer).
- The temperature gauge reads 22.5 degrees (Float).
- The green power light being on means Powered = True (Boolean).

## Essential Examples: Variables and Casting

### Basic Variable Assignment
```python
# This is a comment. Python ignores it. 
# Use comments to explain WHY you are doing something, not WHAT you are doing.
server_name = "web-prod-01"    # String
port_number = 80               # Integer
cpu_usage = 85.5               # Float
is_running = True              # Boolean

print(server_name)
```

### Type Casting (Converting Data)
Sometimes data comes back in the wrong format. For example, if you read a port number from a text configuration file, Python imports it as a String (`"80"`), not an Integer (`80`). You cannot perform numerical operations on a String!

```python
# 1. Read from a hypothetical text file
port_from_file = "80"

# 2. Check the type
print(type(port_from_file))  # Output: <class 'str'>

# 3. Convert (cast) the string to an integer
actual_port = int(port_from_file)

# 4. Check the type again
print(type(actual_port))     # Output: <class 'int'>
```

## Essential Examples: String Manipulation

Because so much of DevOps relies on parsing text, you need to know how to tear strings apart and put them back together.

### Indexing and Slicing
A string is just a sequence of characters. Python assigns an index to every character, starting at **0**.
You can extract a single character, or a "slice" of characters.

```python
hostname = "db-prod-eu-west-1"

# Indexing: Get the first letter
first_char = hostname[0]

# Slicing: [start:stop] -> Stops BEFORE the stop index.
db_prefix = hostname[0:2] 
print(db_prefix) # Output: db
```

### String Methods
Strings come with built-in tools (methods) to modify or analyze them.
- `strip()`: Removes invisible whitespace (like spaces or newlines) from the edges. Crucial when reading lines from a file.
- `split()`: Chops a string into pieces based on a separator (like a space or comma), returning a list of the pieces.
- `replace()`: Swaps one piece of text for another.

```python
# A messy string from a log file
raw_input = "   192.168.1.100\n"

# strip() removes the spaces and the hidden newline (\n)
clean_ip = raw_input.strip()

# replace() swaps parts of the string
masked_ip = clean_ip.replace("100", "XXX")
```

### Modern String Formatting (f-strings)
Concatenating strings with `+` is messy and requires manual type casting for numbers. The modern Python standard is the **f-string**. By prefixing the string with `f`, you can inject variables directly into the text using curly braces `{}`.

```python
hostname = "redis-cache-eu-west"
memory_gb = 16

# Old, messy way:
# summary = "Server " + hostname + " has " + str(memory_gb) + "GB of RAM."

# Modern f-string:
summary = f"Server {hostname} has {memory_gb}GB of RAM."
print(summary)
```

## In Production: Log Parsing

Extracting data from an Apache/Nginx log line is a classic DevOps automation task.

```python
log_line = "10.0.0.5 - - [12/Oct/2023:14:32:01] 'GET /index.html' 404 512"

# We split the string by spaces to isolate the fields.
pieces = log_line.split(" ")

ip_address = pieces[0]
status_code = pieces[-2]

print(f"Alert: IP {ip_address} hit a {status_code} error.")
# Output: Alert: IP 10.0.0.5 hit a 404 error.
```

When building production tools, you must assume your inputs are flawed. A script might crash if it tries to split an empty string or access an index that doesn't exist.

```python
def extract_ip(log_line):
    # Check 1: Is the string empty after stripping?
    if not log_line.strip():
        return "ERROR: Empty Log Line"
    
    # Check 2: Does it contain our expected delimiter?
    if " " not in log_line:
        return "ERROR: Invalid Log Format"
        
    pieces = log_line.split(" ")
    return pieces[0]
```

## Watch Out For

- **Unreadable Variable Names:** In DevOps, you don't write code for the compiler; you write it for the engineer who is on-call next year when the system breaks. Using `s = "192.168.1.1"` is unacceptable. Use `db_primary_ip_address = "192.168.1.1"`. Optimize for readability, always.
- **Off-by-one errors:** Forgetting that Python starts counting at 0, not 1.
- **Hardcoded Secrets:** Never hardcode secrets (like passwords or API keys) directly into variables in your script. If you push the code to a repository, attackers will find those credentials instantly. Always use environment variables for sensitive data.
- **Strings are immutable:** You cannot change a string directly in place. `hostname[0] = "x"` will cause an error. You must create a new string entirely.
- **Forgetting to save method results:** Calling `my_string.strip()` does absolutely nothing to `my_string` unless you save the result: `my_string = my_string.strip()`.

## Practice / Try This

You have a string representing an environment variable injected into a Docker container:
`env_var = "DATABASE_URL=postgres://user:password@db.acmecorp.com:5432/production"`

Write a quick script that:
1. Splits the string to extract just the URL part (everything after the `=`).
2. Splits the resulting URL to extract just the domain name (`db.acmecorp.com`).
3. Uses an f-string to print: `The database is hosted at db.acmecorp.com`
