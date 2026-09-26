<!-- TODO: Rewrite and humanize content from 12-monitoring\module-37-log-management.md, 13-advanced-python\module-43-python-logging.md -->

# Module 37 — Log Management with Python

## 1. Chapter Introduction
Logs are the black box of your infrastructure. When a deployment fails at 3 AM, logs are the first thing you check. In this module, we will learn how to parse, search, aggregate, and analyze log files using Python—from simple text parsing to structured log analysis.

## 2. What You Will Learn
- How to read and parse log files efficiently.
- Regular expressions for log pattern matching.
- How to aggregate log data and generate reports.
- How to tail logs in real-time with Python.
- Structured logging with JSON format.

## 3. DevOps Example: Parse Nginx Access Logs
```python
import re
from collections import Counter

def analyze_access_log(filepath):
    status_codes = Counter()
    ip_addresses = Counter()
    pattern = r'(\d+\.\d+\.\d+\.\d+).*?".*?" (\d{3})'

    with open(filepath) as f:
        for line in f:
            match = re.search(pattern, line)
            if match:
                ip_addresses[match.group(1)] += 1
                status_codes[match.group(2)] += 1

    print("Top 5 Status Codes:")
    for code, count in status_codes.most_common(5):
        print(f"  {code}: {count}")

    print("\nTop 5 IP Addresses:")
    for ip, count in ip_addresses.most_common(5):
        print(f"  {ip}: {count}")
```

## 4. Quick Revision Notes
- Use `re` module for log pattern matching
- Use `collections.Counter` for aggregation
- Read large logs line-by-line (never load entire file into memory)
- JSON-formatted logs are easier to parse than plain text
- `tail -f` equivalent: read file, seek to end, poll for new lines


---

# Module 43 — Python Logging

## 1. Chapter Introduction
`print()` is for debugging. `logging` is for production. In this module, we will replace every `print()` statement in our automation scripts with proper Python logging—configurable levels, file output, structured formats, and log rotation.

## 2. DevOps Example: Production-Grade Logging Setup
```python
import logging
import sys

def setup_logging(log_file="automation.log", level=logging.INFO):
    logger = logging.getLogger("devops")
    logger.setLevel(level)

    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # Console handler
    console = logging.StreamHandler(sys.stdout)
    console.setFormatter(formatter)
    logger.addHandler(console)

    # File handler
    file_handler = logging.FileHandler(log_file)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    return logger

logger = setup_logging()
logger.info("Deployment started")
logger.warning("Server web-03 is slow")
logger.error("Failed to connect to database")
logger.critical("Deployment aborted — rolling back")
```

## 3. Quick Revision Notes
- Levels: `DEBUG < INFO < WARNING < ERROR < CRITICAL`
- `logging.getLogger("name")` — Create named logger
- `logging.FileHandler("file.log")` — Log to file
- `logging.StreamHandler(sys.stdout)` — Log to console
- Never use `print()` in production automation scripts
- Use `RotatingFileHandler` to prevent log files from filling disk


---

