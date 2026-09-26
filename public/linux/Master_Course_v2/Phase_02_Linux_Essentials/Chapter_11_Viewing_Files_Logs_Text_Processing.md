# Chapter 11: Viewing Files, Logs & Text Processing — Incident Investigation

---

## 1. Service Overview


> [!TIP]
> **Video Tutorial:** [Click here to watch the complete step-by-step practical demonstration on YouTube](#)
### The High-Value Log Analysis Skill
Linux System Administration centers around log investigation. During production outages, security breaches, or performance degradation, SysAdmins must process multi-thousand-line log files (`/var/log/nginx/access.log`, `/var/log/messages`, `journalctl`) to isolate root causes in minutes using text processing pipelines (`cat`, `less`, `head`, `tail`, `grep`, `awk`, `sort`, `uniq`).

### Key Log Investigation Commands
- `tail -f` & `tail -F`: Follows live log files (`-F` auto-reattaches across log rotations).
- `zcat`, `zless`, `zgrep`: Inspects compressed archived log files (`.gz`) without extracting them to disk.
- `awk '{print $1}' | sort | uniq -c | sort -nr | head -n 10`: The Golden Text Pipeline for frequency analysis.

### Business Problem It Solves
- **MTTR Reduction**: Reduces Mean Time to Resolution during critical outages by extracting top failing endpoints, client IPs, and 500-series HTTP errors from massive log streams.

---

## 2. Learning Objectives
1. **Analyze** large production log streams using paging, filtering, and text slicing tools.
2. **Construct** analytical pipelines (`awk`, `grep`, `sort`, `uniq -c`) to aggregate IP addresses and error codes.
3. **Inspect** compressed historical logs (`zcat`, `zgrep`) and follow live rotated logs (`tail -F`).

---

## 3. Prerequisites
- Completion of Chapters 01–10.

---

## 4. Real-world Analogy
Log processing is like detective work at a crime scene:
- **`cat`**: Dumping the entire file cabinet onto the floor (only good for small files).
- **`less`**: Turning pages of a case file one by one forward and backward.
- **`tail -F`**: Standing at the security gate watching new cars drive through in real time.
- **`grep "500"`**: Scanning the register for entries marked "FAILED".
- **`awk | sort | uniq -c`**: Computerized finger-print tally counting the top suspects automatically.

---

## 5. Business Use Cases — Incident Investigation Pipeline

```mermaid
flowchart TD
    LogStream[Access Log Stream<br>/var/log/nginx/access.log] --> FilterError[Filter HTTP 5xx Errors<br>grep 'HTTP/1.1 500']
    FilterError --> ExtractIP[Extract Client IP Addresses<br>awk '{print $1}']
    ExtractIP --> SortIP[Sort IP List<br>sort]
    SortIP --> CountUniq[Tally Unique Occurrences<br>uniq -c]
    CountUniq --> TopThreats[Output Top 10 Attacking IPs<br>sort -nr | head -n 10]
```

---

## 6. Core Concepts: Incident Investigation

### Tailing Logs: `-f` vs `-F`
- `tail -f`: Follows the underlying file descriptor. If `logrotate` rotates or truncates the file, `tail -f` stops receiving updates.
- `tail -F`: Follows the file NAME. If the log is rotated, `tail -F` automatically re-attaches to the newly created log file seamlessly.

---

## 7. Internal Architecture

```mermaid
flowchart LR
    LogProducer[Nginx Daemon] -->|Appends Text| LogFile["/var/log/nginx/access.log"]
    LogFile -->|Inotify Event| TailF["tail -F Process"]
    TailF -->|Streams STDOUT| AdminTerminal[SysAdmin Terminal]
```

---

## 8. System Components
- `journalctl`: Querying tool for binary systemd journal logs (`journalctl -u nginx -n 100 --no-pager`).
- `zcat` / `zgrep`: Utilities for reading compressed `.gz` archived logs directly.

---

## 9. Configuration
Log Rotation configuration:
- `/etc/logrotate.conf` & `/etc/logrotate.d/`

---



### Reading Compressed Logs
Production logs are often compressed to save space.
- `zcat file.gz`: Reads compressed files like `cat`.
- `zless file.gz`: Pages compressed files like `less`.
- `zgrep pattern file.gz`: Searches compressed files like `grep`.

### Tailing Logs: `-f` vs `-F`
- `tail -f`: Follows the file descriptor. If the file is rotated or deleted, `tail` stops working.
- `tail -F`: Follows the file name. If the log is rotated (e.g. by `logrotate`), `tail` will automatically attach to the newly created file.

### Line Counting
- `wc -l`: Counts lines (not words or bytes).

## 10. Hands-on Labs


### Lab Setup
> **Lab Environment**: Make sure your local Linux virtual machine (Ubuntu 22.04 or RHEL 9) is booted and you are connected via SSH as the 
oot or a sudo enabled user.
> **Terminal Required**: Open your Linux terminal and type each command yourself. Never copy-paste blindly!
### Lab 1: 5,000-Line Production Log Audit Incident Lab
Analyze a sample log stream to extract top requesting IPs and HTTP 500 error counts.

```bash
# 1. Inspect the last 20 lines of system log
tail -n 20 /var/log/messages 2>/dev/null || journalctl -n 20 --no-pager

# 2. Count occurrences of 'ERROR' or 'Failed'
grep -ic "error" /var/log/messages 2>/dev/null || journalctl | grep -ic "error"

# 3. Golden Log Pipeline: Top 10 requesting IP addresses
cat << 'EOF' > /tmp/sample_access.log
192.168.1.50 - - [20/Jul/2026:10:00:01] "GET /api/v1/user HTTP/1.1" 200
192.168.1.50 - - [20/Jul/2026:10:00:02] "POST /api/v1/pay HTTP/1.1" 500
203.0.113.4 - - [20/Jul/2026:10:00:03] "GET /admin HTTP/1.1" 404
203.0.113.4 - - [20/Jul/2026:10:00:04] "GET /admin HTTP/1.1" 404
203.0.113.4 - - [20/Jul/2026:10:00:05] "GET /admin HTTP/1.1" 404
192.168.1.50 - - [20/Jul/2026:10:00:06] "POST /api/v1/pay HTTP/1.1" 500
EOF

awk '{print $1}' /tmp/sample_access.log | sort | uniq -c | sort -nr
```

#### Progressive Hint System
- **Level 1 (Clue)**: Use `awk '{print $1}'` to extract the first column (IP address).
- **Level 2 (Direction)**: Pipe `awk` output into `sort`, then `uniq -c`, then `sort -nr`.
- **Level 3 (Concept)**: `uniq -c` requires sorted input to group identical lines together accurately.

---


#### Progressive Hint System

<details>
<summary>Hint 1: Conceptual Approach</summary>
Before running commands, always identify what state the system is currently in. Think about what command shows service or filesystem status.
</details>

<details>
<summary>Hint 2: Relevant Commands</summary>
You might want to use `systemctl status`, `cat /etc/*`, or standard diagnostic commands like `ls -la` and `stat`.
</details>

<details>
<summary>Hint 3: Full Solution</summary>

```bash
# Execute the relevant diagnostic command for this topic
systemctl status <service_name>
# Or
ls -la /relevant/path
```
</details>

## 11. Code Examples

### Shell Script: Automated Log Threat Analyzer
```bash
#!/usr/bin/env bash
# Description: Analyzes log files for top IP threats and 500 errors
set -euo pipefail

LOG_FILE="${1:-/tmp/sample_access.log}"

if [ ! -f "$LOG_FILE" ]; then
    echo "Log file $LOG_FILE not found." >&2
    exit 1
fi

echo "=== TOP 5 REQUESTING CLIENT IPS ==="
awk '{print $1}' "$LOG_FILE" | sort | uniq -c | sort -nr | head -n 5

echo ""
echo "=== HTTP STATUS CODE BREAKDOWN ==="
awk '{print $9}' "$LOG_FILE" 2>/dev/null | sort | uniq -c | sort -nr || true
```

---

## 12. Security Deep Dive
- **Log Tampering Detection**: Attackers often clear logs using `cat /dev/null > /var/log/secure`. Prevent this by setting append-only attributes (`chattr +a /var/log/secure`).

---

## 13. Monitoring & Observability
- Follow live logs across services using `journalctl -f -u nginx -u httpd`.

---

## 14. Performance & Cost Optimization
- Always use `zgrep` on compressed `.gz` logs instead of decompressing files to disk using `gunzip` (saves disk space and I/O overhead).

---

## 15. Enterprise Integration
Shipped to Splunk, Datadog, or AWS CloudWatch Logs via vector / fluent-bit daemons.

---

## 16. Real Industry Use Cases
1. **DDoS Mitigation**: Extracting attacking IP addresses from Nginx logs and feeding them into iptables / AWS WAF.

---

## 17. Architecture Patterns

```mermaid
flowchart LR
    LogFile["/var/log/access.log"] --> Awk[awk '{print $1}']
    Awk --> Sort1[sort]
    Sort1 --> Uniq[uniq -c]
    Uniq --> Sort2[sort -nr]
    Sort2 --> Head[head -n 10]
```

---

## 18. Production Incident War Room

### Incident INC-1011: DDoS Attack & Connection Pool Exhaustion
- **Severity**: P1 / Critical | **Service Affected**: Web Application Cluster
- **Symptom**: Web cluster throws HTTP 504 Gateway Timeouts. Database connection pool exhausted.
- **Root Cause Analysis**: Malicious botnet from IP `203.0.113.4` sending 5,000 HTTP requests/sec to `/admin`.
- **Remediation Script**:
```bash
# 1. Identify attacking IP from live log stream
tail -n 10000 /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -nr | head -n 5

# 2. Block attacking IP using iptables firewall
sudo iptables -A INPUT -s 203.0.113.4 -j DROP
```

---

## 19. Production Best Practices
- Always use `tail -F` (capital F) when monitoring live logs that undergo log rotation.
- Never use `cat` on multi-gigabyte log files; use `less`, `grep`, or `tail`.

---

## 20. Migration Strategies
When moving from rsyslog to systemd-journald, update log audit scripts to use `journalctl`.

---

## 21. CI/CD Integration
Automate log error scanning in test suites using `grep -iE "error|exception|fatal"`.

---

## 22. Practical Projects
- **Lab Project**: Write a log parser script that alerts via email if HTTP 500 error count exceeds 50 in 5 minutes.

---

## 23. Interview Preparation
#### Q1: What is the exact purpose of `sort` between `awk` and `uniq -c` in the Golden Log Pipeline?
**Answer**: `uniq -c` only compares adjacent lines. If identical lines are not grouped together first by `sort`, `uniq -c` will fail to count duplicate occurrences across the file.

---

## 24. Certification Practice
**Question**: Which command reads compressed `.gz` log files without decompressing them to disk?
- A) `cat`
- B) `zcat` **(Correct)**
- C) `tar`
- D) `gzip -d`

---

## 25. Knowledge Check
1. **Interactive Quiz**: Which flag on `tail` ensures it auto-reattaches if a log file is rotated? (`-F`).

---

## 26. Cheat Sheet
| Pipeline Step | Command | Purpose |
| :--- | :--- | :--- |
| **Paging** | `less /var/log/messages` | Page forward (`f`) / backward (`b`) |
| **Live Stream** | `tail -F /var/log/nginx/access.log` | Follow live log across rotations |
| **Extraction** | `awk '{print $1}'` | Extract column 1 (IP address) |
| **Frequency** | `sort \| uniq -c \| sort -nr` | Count and rank top occurrences |
| **Compressed** | `zgrep "ERROR" file.log.gz` | Search inside gzipped log |

---

## 27. Chapter Summary
Log analysis using `tail -F`, `grep`, and the Golden Pipeline (`awk | sort | uniq -c | sort -nr`) is the primary diagnostic capability for resolving production outages.

---

## 28. Further Learning
- [GNU Awk User's Guide](https://www.gnu.org/software/gawk/manual/)
