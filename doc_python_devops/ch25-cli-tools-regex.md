<!-- TODO: Rewrite and humanize content from 13-advanced-python\module-42-regex.md, 13-advanced-python\module-44-cli-tools.md -->

# Module 42 — Regular Expressions for DevOps

## 1. Chapter Introduction
Regular expressions (regex) are the most powerful text-processing tool in a DevOps engineer's toolkit. Parsing IP addresses from log files, extracting error codes from stack traces, validating hostnames, and searching through configuration files—all of these require regex. In this module, we will learn practical regex patterns for real DevOps work.

## 2. DevOps Examples
```python
import re

# Extract IP addresses from a log file
log_line = '192.168.1.50 - - [27/Aug/2026:10:30:00] "GET /api/health" 200'
ip_match = re.search(r'\d+\.\d+\.\d+\.\d+', log_line)
print(ip_match.group())  # 192.168.1.50

# Find all ERROR lines
log_data = "INFO: Started\nERROR: Connection refused\nINFO: Retrying\nERROR: Timeout"
errors = re.findall(r'^ERROR:.*$', log_data, re.MULTILINE)
print(errors)  # ['ERROR: Connection refused', 'ERROR: Timeout']

# Validate a hostname
def is_valid_hostname(hostname):
    pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$'
    return bool(re.match(pattern, hostname))
```

## 3. Quick Revision Notes
- `re.search(pattern, string)` — Find first match
- `re.findall(pattern, string)` — Find all matches
- `re.sub(pattern, replacement, string)` — Replace matches
- `\d` = digit, `\w` = word char, `\s` = whitespace, `.` = any char
- `+` = one or more, `*` = zero or more, `?` = zero or one
- `^` = start of line, `$` = end of line
- Always use raw strings: `r'\d+'` (prevents backslash conflicts)


---

# Module 44 — Command-Line Tools with Python

## 1. Chapter Introduction
The best DevOps tools are CLI tools. `kubectl`, `terraform`, `docker`—all are command-line programs. In this module, we will learn how to build professional CLI tools using Python's `argparse` module and the popular `click` library, turning your automation scripts into polished, user-friendly command-line applications.

## 2. DevOps Example: CLI with argparse
```python
import argparse

def main():
    parser = argparse.ArgumentParser(description="DevOps Server Manager")
    parser.add_argument("action", choices=["list", "start", "stop"], help="Action to perform")
    parser.add_argument("--region", default="us-east-1", help="Cloud region")
    parser.add_argument("--environment", choices=["dev", "staging", "prod"], required=True)
    parser.add_argument("--dry-run", action="store_true", help="Show what would happen without acting")

    args = parser.parse_args()

    print(f"Action: {args.action}")
    print(f"Region: {args.region}")
    print(f"Environment: {args.environment}")
    print(f"Dry Run: {args.dry_run}")

if __name__ == "__main__":
    main()

# Usage: python server_mgr.py list --environment prod --dry-run
```

## 3. Production Example: Click-Based CLI
```python
# pip install click
import click

@click.group()
def cli():
    """DevOps Automation CLI"""
    pass

@cli.command()
@click.option("--region", default="us-east-1", help="Cloud region")
@click.option("--env", type=click.Choice(["dev", "staging", "prod"]), required=True)
def list_servers(region, env):
    """List all servers in a region and environment."""
    click.echo(f"Listing servers in {region} ({env})...")

@cli.command()
@click.argument("server_id")
@click.confirmation_option(prompt="Are you sure you want to stop this server?")
def stop_server(server_id):
    """Stop a specific server."""
    click.echo(f"Stopping {server_id}...")

if __name__ == "__main__":
    cli()
```

## 4. Quick Revision Notes
- `argparse` — Standard library, no install needed
- `click` — Third-party, more elegant API (`pip install click`)
- Always include `--help` documentation for every argument
- Add `--dry-run` flag to all destructive operations
- Use `click.Choice` or `argparse.choices` for enum-like validation
- Package CLI tools with `entry_points` in `setup.py` for system-wide installation


---

