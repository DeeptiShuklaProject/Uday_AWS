# CHAPTER 29 — SYSTEMD AND SYSTEMCTL FUNDAMENTALS

---

## 1. Introduction

### Why This Topic Exists
When a Linux server boots, it needs to start the network, mount the hard drives, launch the firewall, and start the web server in a specific order. If the web server crashes later that day, something needs to automatically restart it. In modern Linux distributions (RHEL 7+, Ubuntu 15.04+), this massive responsibility is handled by **systemd**, the initialization system and service manager. It replaces the legacy SysVinit system, offering parallel startup, robust dependency management, and automated service recovery.

### Why Linux Administrators Use It
System administrators spend a massive portion of their day interacting with `systemd` via the `systemctl` command. They use it to start, stop, restart, and check the status of applications. They also write custom `systemd` unit files to ensure that their company's proprietary applications start automatically on boot and restart automatically if they crash.

### Why Companies Care About It
High Availability (HA). If a critical microservice crashes at 3:00 AM, the company cannot wait for an administrator to wake up and type `./start.sh`. By wrapping the microservice in a `systemd` service unit, the OS guarantees it will automatically restart within milliseconds of a crash, ensuring zero downtime for customers.

---

## 2. Learning Objectives

By the end of this chapter, you will be able to:
- Understand the role of `systemd` as PID 1.
- Manage service states (start, stop, restart, reload, status) using `systemctl`.
- Manage service startup behavior (enable, disable) during boot.
- Differentiate between a running service and an enabled service.
- Understand the structure of a systemd `.service` unit file.
- Create and deploy a custom systemd service for a user-defined script.

---

## 3. Beginner-Friendly Explanation

Think of `systemd` as the General Manager of a luxury hotel:
- When the hotel opens for the day (Boot), the Manager doesn't do the cleaning. Instead, they read a master checklist (`systemd` Unit Files).
- "Start the electricity first. Then start the plumbing. Once plumbing is running, wake up the cleaning staff." (Dependency Management).
- During the day, if the chef unexpectedly quits (a Service Crash), the Manager instantly detects it and calls a replacement chef from the agency (Auto-Restart).
- As an administrator, you act as the Hotel Owner. You use the telephone (`systemctl` command) to tell the Manager: "Stop the restaurant service right now," or "Check the status of the valet service."

---

## 4. Core Theory

### 4.1 Systemd as PID 1
When the Linux Kernel finishes loading into RAM, it launches exactly one process: `systemd` (assigned PID 1). `systemd` then takes over and launches every other process on the system. If `systemd` dies, the kernel panics and the server crashes.

### 4.2 Systemd Units
`systemd` manages resources through "Units". There are many types, but the most common is the **Service Unit** (`.service`). A service unit file tells `systemd` exactly how to start, stop, and monitor an application.
*Unit files are stored in:*
- `/usr/lib/systemd/system/` (Package manager defaults - Do not edit).
- `/etc/systemd/system/` (Administrator custom configurations - Overrides defaults).

### 4.3 Running State vs Enabled State
This is a critical distinction that trips up many beginners:
- **Running / Stopped (Current State):** Is the application running *right now*? Controlled by `systemctl start` and `systemctl stop`.
- **Enabled / Disabled (Boot State):** Will the application start *automatically* the next time the server reboots? Controlled by `systemctl enable` and `systemctl disable`.

### 4.4 Restart vs Reload
- **Restart:** Completely kills the application and starts it fresh. This disrupts active users (e.g., dropping active database connections).
- **Reload:** Politely asks the application to re-read its configuration file without terminating the main process. Active connections are preserved. (Not all applications support this, but web servers like Nginx/Apache do).

---

## 5. Internal Working

### The `enable` Symlink Mechanism
How does `systemd` know what to start on boot?
When you run `systemctl enable httpd`, `systemd` doesn't write to a database. It simply creates a filesystem symbolic link (symlink) from the application's unit file in `/usr/lib/systemd/` into a specific boot target directory in `/etc/systemd/system/multi-user.target.wants/`. 
During boot, `systemd` looks inside that `wants/` folder and starts everything it finds. When you run `systemctl disable httpd`, it just deletes the symlink.

---

## 6. Production Architecture

```mermaid
graph TD
    subgraph The Systemd Ecosystem
        Sysctl["systemctl (CLI Tool)"]
        PID1["PID 1: systemd (Daemon)"]
        UnitDir["/etc/systemd/system/"]
        App["Nginx Web Server"]
    end

    Sysctl -->|Sends commands| PID1
    PID1 -->|Reads configs| UnitDir
    PID1 -->|Spawns and monitors| App
    App -.->|Crashes| PID1
    PID1 -->|Auto-restarts| App
```

---

## 7. Command-by-Command Explanation

### 7.1 `systemctl status httpd`
- **Purpose:** Shows whether Apache is running, enabled, its PID, memory usage, and the last 10 log messages.

### 7.2 `systemctl start httpd`
- **Purpose:** Starts the Apache service immediately.

### 7.3 `systemctl enable httpd`
- **Purpose:** Configures Apache to start automatically on the next server reboot.

### 7.4 `systemctl enable --now httpd`
- **Purpose:** A massive time-saver. It Enables AND Starts the service simultaneously.

### 7.5 `systemctl list-units --type=service --state=running`
- **Purpose:** Displays a table of all currently running services on the system.

### 7.6 `systemctl daemon-reload`
- **Purpose:** If you manually create or edit a `.service` file using `vim`, `systemd` does not know about it. You must run this command to tell `systemd` to scan the disk for new/updated unit files.

---

## 8. Syntax Breakdown

```ini
# Inside an example: /etc/systemd/system/myapp.service

[Unit]
Description=My Custom Python Application
After=network.target
│
[Service]
ExecStart=/usr/bin/python3 /opt/myapp/main.py
Restart=always
User=appuser
│
[Install]
WantedBy=multi-user.target
```
- **[Unit]:** Metadata and dependencies. `After=network.target` means "Do not start this until the network is fully up."
- **[Service]:** The execution logic. `ExecStart` is the absolute path to the command. `Restart=always` guarantees high availability. `User=` ensures it runs securely, not as root.
- **[Install]:** Defines where the symlink goes when you run `systemctl enable`.

---

## 9. Parameter Explanation

| Command | Parameter | Description |
|:---|:---|:---|
| `systemctl` | `start` | Start immediately |
| `systemctl` | `stop` | Stop immediately |
| `systemctl` | `restart` | Stop and Start (Disruptive) |
| `systemctl` | `reload` | Re-read config (Non-disruptive) |
| `systemctl` | `enable` | Start on boot |
| `systemctl` | `disable` | Do not start on boot |
| `systemctl` | `mask` | Completely block service from starting (even manually) |
| `systemctl` | `unmask` | Remove the block |

---

## 10. Sample Output Analysis

**Scenario:** Checking a service that failed to start.
**Command:** `systemctl status sshd`

**Output:**
```text
● sshd.service - OpenSSH server daemon
   Loaded: loaded (/usr/lib/systemd/system/sshd.service; enabled; vendor preset: enabled)
   Active: active (running) since Sun 2026-07-26 10:00:00 UTC; 2h 30min ago
     Docs: man:sshd(8)
 Main PID: 1250 (sshd)
    Tasks: 1 (limit: 23512)
   Memory: 5.2M
   CGroup: /system.slice/sshd.service
           └─1250 /usr/sbin/sshd -D

Jul 26 10:00:00 server1 systemd[1]: Started OpenSSH server daemon.
Jul 26 10:05:12 server1 sshd[1250]: Accepted publickey for sachin from 192.168.1.50
```

**Analysis:**
- **Loaded:** Indicates the unit file location and confirms it is `enabled` (will survive a reboot).
- **Active:** It is `active (running)`. If it crashed, it would say `failed`. If stopped, `inactive`.
- **Main PID:** 1250. This is the master process ID.
- **CGroup:** Control Group. `systemd` places services in CGroups to track them accurately, preventing "runaway child processes" that evade `kill` commands.
- **Log tail:** The bottom two lines are pulled directly from the system journal, saving you the time of looking in `/var/log/`.

---

## 11. Architecture Diagram

```mermaid
graph LR
    subgraph Systemd Dependency Resolution
        Boot["System Boot"]
        Net["network.target"]
        DB["postgresql.service<br/>(Requires Network)"]
        Web["nginx.service<br/>(Requires DB)"]
    end

    Boot --> Net
    Net --> DB
    DB --> Web
    Note over Boot,Web: If Network fails to start,<br/>systemd will NOT start DB or Web.
```

---

## 12. Workflow Diagram

```mermaid
sequenceDiagram
    participant Dev
    participant Sysctl
    participant Systemd
    participant Kernel

    Note over Dev,Kernel: Deploying a Custom Service
    Dev->>Kernel: vim /etc/systemd/system/api.service
    Dev->>Sysctl: systemctl start api
    Sysctl-->>Dev: Error: Unit not found.
    Note right of Dev: Systemd caches configs in RAM.
    Dev->>Sysctl: systemctl daemon-reload
    Sysctl->>Systemd: Reload configs from disk
    Dev->>Sysctl: systemctl enable --now api
    Sysctl->>Systemd: Create symlink & Start Process
    Systemd->>Kernel: execve("/opt/api/start.sh")
    Kernel-->>Systemd: Process running (PID 888)
```

---

## 13. Real Production Examples

### Deploying a Go/Node.js/Python Application
Modern microservices do not daemonize themselves like old C programs. They just run in the foreground. Administrators write a `systemd` wrapper to manage them in production.
```bash
sudo vim /etc/systemd/system/node-app.service
```
*(Content)*:
```ini
[Unit]
Description=Corporate Node App

[Service]
ExecStart=/usr/bin/node /var/www/node/app.js
Restart=on-failure
User=nodeuser
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now node-app
```

### Masking Dangerous Services
Sometimes `systemctl disable` isn't enough. If another service depends on a disabled service, `systemd` will automatically start it anyway! To guarantee a service (like an insecure telnet daemon or unwanted firewall) NEVER starts, you `mask` it.
```bash
sudo systemctl mask firewalld
# This creates a symlink pointing to /dev/null, making it impossible to start.
```

---

## 14. Common Mistakes

1. **Forgetting `daemon-reload`** — If you edit a `.service` file and immediately type `systemctl restart app`, `systemd` will restart it using the *old* configuration stored in RAM. Always run `systemctl daemon-reload` after editing a unit file.
2. **Confusing Enable with Start** — An admin installs Apache (`dnf install httpd`), runs `systemctl start httpd`, and tests the website. It works. A week later, the server reboots for patching, and the website goes down because the admin forgot to run `systemctl enable httpd`.
3. **Using relative paths in ExecStart** — `ExecStart=python app.py` will fail. Systemd does not use a user's `$PATH` variable. You must use absolute paths for everything: `ExecStart=/usr/bin/python3 /opt/app/app.py`.

---

## 15. Best Practices

- Always use `enable --now` to combine enabling and starting into a single command.
- If a service fails to start, immediately run `systemctl status <service>` and `journalctl -xeu <service>` to see the exact error logs.
- Never run application services as root. Always define a `User=` directive in your custom `.service` files.

---

## 16. Security Considerations

- Systemd's `User=` directive allows privilege dropping. Systemd runs as root, binds to a low port (like 80 for web servers), and then seamlessly drops privileges to a normal user account to execute the application code. This prevents attackers from gaining root access if the application is exploited.

---

## 17. Performance Considerations

- Systemd significantly speeds up Linux boot times by starting unrelated services in parallel, rather than waiting for them to start sequentially one-by-one as SysVinit did.

---

## 18. Troubleshooting Guide

| Symptom | Root Cause | Resolution |
|:---|:---|:---|
| `Unit app.service could not be found` | Typo, or systemd needs reload | Check spelling in `/etc/systemd/system`, then run `systemctl daemon-reload` |
| Status shows `code=exited, status=203/EXEC` | Bad path or permissions | Verify `ExecStart` uses an absolute path and the file has `chmod +x` |
| `Failed to start: Unit is masked` | Service was masked administratively | Run `systemctl unmask servicename` |
| Status shows `active (exited)` | It's a oneshot script, not a daemon | This is normal for startup scripts (like applying firewall rules). It ran successfully and finished. |

---

## 19. Practical Labs

**Lab 29.1:** Service Investigation
```bash
systemctl status sshd
# Notice the path to the unit file.
systemctl cat sshd
# This prints the raw contents of the unit file to the screen without using vi.
```

**Lab 29.2:** State Manipulation (Requires a test service, e.g., chronyd or nginx)
```bash
sudo systemctl stop sshd
# DO NOT close your terminal, or you are locked out!
systemctl status sshd
sudo systemctl start sshd
```

**Lab 29.3:** Masking
```bash
sudo systemctl mask NetworkManager
sudo systemctl start NetworkManager  # Will fail
sudo systemctl unmask NetworkManager
```

---

## 20. Mini Project

Create a self-healing process.
1. Create a script `/tmp/crash.sh`:
   `#!/bin/bash`
   `sleep 30`
   `exit 1` (This simulates a crash).
2. `chmod +x /tmp/crash.sh`
3. Create `/etc/systemd/system/crasher.service`:
   `[Service]`
   `ExecStart=/tmp/crash.sh`
   `Restart=always`
   `RestartSec=2`
4. `sudo systemctl daemon-reload`
5. `sudo systemctl start crasher`
6. Run `systemctl status crasher` immediately. Notice it is running.
7. Wait 35 seconds. Run `systemctl status crasher` again. Notice it crashed, but systemd immediately restarted it, and it has a new PID!

---

## 21. Assignments

1. What is the difference between `systemctl restart` and `systemctl reload`?
2. What is the difference between the `running` state and the `enabled` state?
3. Why must you use absolute paths inside a `systemd` unit file?

---

## 22. Interview Questions

### Basic
1. **Q: What command do you use to ensure a web server automatically starts after a system reboot?**
   A: `systemctl enable httpd` (or `nginx`).

2. **Q: If you edit a custom service file in `/etc/systemd/system/`, what must you do before restarting the service?**
   A: You must run `systemctl daemon-reload` so systemd re-reads the disk and updates its internal cache.

### Intermediate
3. **Q: An administrator runs `systemctl disable iptables` to turn off an old firewall. However, after a reboot, `iptables` is running again. How is this possible, and how do you guarantee it never runs?**
   A: `disable` only removes the symlink for the default boot target. If another service that starts on boot has a dependency explicitly calling for `iptables`, systemd will start it anyway to satisfy the dependency. To guarantee it never runs, the administrator must use `systemctl mask iptables`, which links the unit to `/dev/null`.

4. **Q: You deploy a Python API. You write a systemd service file, but when you start it, it immediately fails with `status=203/EXEC`. What are the two most likely causes?**
   A: (1) The path provided in `ExecStart` is wrong, or a relative path was used instead of an absolute path. (2) The Python script lacks execution permissions (`chmod +x`), or the shebang (`#!/usr/bin/python3`) at the top of the script is missing/incorrect.

### Scenario-Based
5. **Q: You are managing a highly trafficked e-commerce site running Nginx. You updated the SSL certificates and need Nginx to use them. If you run `systemctl restart nginx`, active customers checking out will receive a "Connection Reset" error. How do you apply the certificates without dropping active customers?**
   A: I would use `systemctl reload nginx`. This sends a SIGHUP signal to the Nginx master process. Nginx will read the new certificates, spawn new worker processes for new incoming connections using the new certs, and allow existing worker processes to gracefully finish their current checkouts before shutting down. Zero downtime is achieved.

---

## 23. Chapter Summary and Quick Revision Notes

- `systemd` is PID 1, replacing SysVinit.
- `systemctl` is the primary CLI tool.
- **Enable/Disable:** Modifies boot behaviour (creates/deletes symlinks).
- **Start/Stop:** Modifies current running state.
- **Restart:** Kills and restarts (drops connections).
- **Reload:** Re-reads config gracefully (keeps connections).
- **daemon-reload:** Required after editing any `.service` file.
- Custom unit files belong in `/etc/systemd/system/`.

---

## 24. Cheat Sheet

| Command | Purpose |
|:---|:---|
| `systemctl start name` | Start service now |
| `systemctl stop name` | Stop service now |
| `systemctl enable name` | Start on boot |
| `systemctl disable name`| Do not start on boot |
| `systemctl enable --now name` | Start on boot AND Start now |
| `systemctl reload name` | Reload config gracefully |
| `systemctl status name` | Check health and view recent logs |
| `systemctl daemon-reload` | Re-read edited unit files |
| `systemctl mask name` | Forcefully block service from starting |
