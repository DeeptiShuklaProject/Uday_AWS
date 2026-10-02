# Level 0 — IT, Linux, Networking & Cloud Prerequisites

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Beginner |
| **Theory Duration** | 12 hours |
| **Practical Duration** | 16 hours |
| **Prerequisites** | None — this is the starting point |
| **Lab Required** | Yes — Any Linux machine (VM, WSL2, or Cloud instance) |
| **Interview Importance** | ⭐⭐⭐⭐ (4/5) |
| **Industry Importance** | ⭐⭐⭐⭐⭐ (5/5) |
| **Certification Alignment** | CKA, CKAD, CKS (Linux fundamentals), AWS SA (Networking) |

---

## Learning Objectives

After completing this module, the learner will be able to:

1. Navigate the Linux filesystem and understand the Filesystem Hierarchy Standard (FHS).
2. Manage Linux processes, services, users, groups, and file permissions.
3. Configure and troubleshoot SSH access.
4. Install and manage software packages on Debian and RHEL-based distributions.
5. Inspect and troubleshoot CPU, memory, disk, and network resource usage.
6. Use essential text processing tools (`grep`, `awk`, `sed`, `find`) in pipelines.
7. Explain IP addressing, CIDR notation, subnetting, and routing.
8. Describe the OSI and TCP/IP networking models.
9. Understand DNS resolution, TLS/SSL, load balancing, and NAT.
10. Diagnose network connectivity issues using `ping`, `traceroute`, `dig`, `ss`, `curl`, and `tcpdump`.

---

## Prerequisites

None. This module assumes zero prior Linux or networking knowledge. A learner who already has strong Linux and networking skills may skim this module and proceed to Level 1.

---

# PART A — LINUX SYSTEMS ENGINEERING

---

## 1. Introduction to Linux

### 1.1 What is Linux?

**Simple Analogy:**
Think of your computer as a restaurant. The **kernel** is the kitchen — it does all the actual work (cooking food, managing ovens, controlling inventory). The **shell** is the waiter — it takes your orders (commands) and delivers them to the kitchen. The **applications** are the menu items you order.

**Technical Explanation:**
Linux is an open-source, Unix-like operating system kernel created by Linus Torvalds in 1991. When people say "Linux," they usually mean a complete operating system (kernel + userspace tools + package manager + init system), which is called a **Linux distribution**.

Key characteristics:
- **Open Source:** Source code is freely available (GPL license).
- **Multi-user:** Multiple users can use the system simultaneously.
- **Multi-tasking:** Multiple processes run concurrently.
- **Portable:** Runs on everything from embedded devices to supercomputers.
- **Stable & Secure:** Preferred for servers, cloud infrastructure, and containers.

### 1.2 Why Linux Matters for Kubernetes Engineers

| Fact | Implication |
| :--- | :--- |
| Kubernetes runs exclusively on Linux nodes | You must understand Linux process management, networking, and filesystems |
| Container runtimes (`containerd`, `CRI-O`) use Linux kernel features | Namespaces and cgroups are Linux kernel primitives |
| 96%+ of public cloud servers run Linux | Enterprise Kubernetes clusters run on Linux (Amazon Linux 2023, Ubuntu, RHEL) |
| Troubleshooting K8s = Troubleshooting Linux | `journalctl`, `dmesg`, `ss`, `iptables`, `tcpdump` are daily tools |

### 1.3 Linux Distributions

A **distribution** (distro) is a packaged version of Linux with a specific kernel version, package manager, init system, and default software.

| Distribution | Family | Package Manager | Init System | Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **Ubuntu** (22.04/24.04 LTS) | Debian | `apt` | `systemd` | Development, Cloud, Kubernetes labs |
| **Amazon Linux 2023** | Fedora/RHEL | `dnf` | `systemd` | AWS EC2, EKS worker nodes |
| **RHEL 9** (Red Hat Enterprise) | RHEL | `dnf` | `systemd` | Enterprise production servers |
| **CentOS Stream 9** | RHEL | `dnf` | `systemd` | Free RHEL-compatible development |
| **Alpine Linux** | Independent | `apk` | OpenRC | Minimal container base images |
| **Debian 12 (Bookworm)** | Debian | `apt` | `systemd` | Stable servers, container images |

**For this course:** We recommend **Ubuntu 22.04 LTS** for labs and **Amazon Linux 2023** for AWS EKS worker node familiarity.

---

## 2. Linux Filesystem Hierarchy Standard (FHS)

### 2.1 The Directory Tree

**Simple Analogy:**
The Linux filesystem is like a large office building. The root `/` is the main entrance. Each floor (directory) has a specific purpose — HR is on one floor, IT on another. You don't put marketing files in the IT room.

```
/                          ← Root of the entire filesystem
├── bin/                   ← Essential user command binaries (ls, cp, cat, grep)
├── sbin/                  ← System administration binaries (fdisk, iptables, reboot)
├── boot/                  ← Boot loader files (kernel image, GRUB config)
├── dev/                   ← Device files (hard disks, terminals, null device)
├── etc/                   ← System-wide configuration files
│   ├── hosts              ← Local DNS hostname-to-IP mapping
│   ├── resolv.conf        ← DNS resolver configuration
│   ├── ssh/sshd_config    ← SSH server configuration
│   ├── systemd/           ← systemd service configurations
│   ├── kubernetes/        ← Kubernetes configuration (on K8s nodes)
│   └── containerd/        ← Container runtime configuration
├── home/                  ← User home directories (/home/uday/)
├── lib/                   ← Shared libraries for /bin and /sbin
├── mnt/                   ← Temporary mount points
├── opt/                   ← Optional/third-party application software
├── proc/                  ← Virtual filesystem exposing kernel/process info
│   ├── cpuinfo            ← CPU information
│   ├── meminfo            ← Memory information
│   └── <PID>/             ← Per-process information
├── root/                  ← Home directory of root user
├── run/                   ← Runtime variable data (PID files, sockets)
├── sys/                   ← Virtual filesystem for kernel objects (devices, modules)
├── tmp/                   ← Temporary files (cleared on reboot)
├── usr/                   ← Secondary hierarchy (user programs, libraries, docs)
│   ├── bin/               ← Non-essential user commands
│   ├── sbin/              ← Non-essential system admin commands
│   ├── lib/               ← Libraries
│   ├── local/             ← Locally installed software
│   └── share/             ← Architecture-independent data (man pages, docs)
└── var/                   ← Variable data (logs, caches, spools)
    ├── log/               ← System and application log files
    │   ├── syslog         ← General system log
    │   ├── auth.log       ← Authentication log
    │   └── pods/          ← Kubernetes Pod container logs (on K8s nodes)
    ├── lib/               ← Variable state data (databases, package info)
    └── tmp/               ← Temporary files preserved between reboots
```

### 2.2 Directories Critical for Kubernetes Engineers

| Directory | Kubernetes Relevance |
| :--- | :--- |
| `/etc/kubernetes/` | kubeadm configuration, admin.conf, kubelet config, PKI certificates |
| `/etc/containerd/` | Container runtime configuration (`config.toml`) |
| `/var/log/pods/` | Container stdout/stderr logs for all Pods on this node |
| `/var/lib/kubelet/` | kubelet state directory, Pod volumes, device plugins |
| `/var/lib/containerd/` | Container image layers and snapshots |
| `/var/lib/etcd/` | etcd database directory (on control plane nodes) |
| `/proc/` | Process inspection (used by `top`, `ps`, resource monitoring) |
| `/sys/fs/cgroup/` | cgroup filesystem (container resource limits) |
| `/run/containerd/` | containerd runtime socket |

### 2.3 Commands for Filesystem Navigation

| Command | Purpose | Example | Expected Output |
| :--- | :--- | :--- | :--- |
| `pwd` | Print current working directory | `pwd` | `/home/uday` |
| `ls -la` | List all files with permissions | `ls -la /etc/` | Detailed file listing with permissions, owner, size |
| `cd` | Change directory | `cd /var/log/` | (Changes directory) |
| `tree -L 2` | Display directory tree (2 levels deep) | `tree -L 2 /etc/kubernetes/` | Graphical directory structure |
| `stat` | Display detailed file/directory info | `stat /etc/hosts` | Inode, size, timestamps, permissions |
| `file` | Determine file type | `file /bin/ls` | `ELF 64-bit LSB pie executable` |

---

## 3. Linux Processes & Services

### 3.1 Process Fundamentals

**Simple Analogy:**
A process is like an employee working on a task. Each employee has a unique **employee ID** (PID), reports to a **manager** (parent process), and uses company **resources** (CPU, memory). If an employee misbehaves, the CEO (root user) can fire them (`kill`).

**Technical Explanation:**
A **process** is an instance of a running program. Every process has:
- **PID (Process ID):** Unique integer identifier.
- **PPID (Parent Process ID):** The PID of the process that created it.
- **UID (User ID):** The user who owns the process.
- **State:** Running (R), Sleeping (S), Stopped (T), Zombie (Z), Dead (X).
- **Priority/Nice value:** Scheduling priority (-20 highest to 19 lowest).

### 3.2 Process Inspection Commands

#### `ps` — Process Snapshot

```bash
# Purpose: Display information about active processes
# Syntax: ps [options]

# Example 1: Show all processes with full format
ps aux

# Expected Output:
# USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
# root         1  0.0  0.1 169456 13288 ?        Ss   08:00   0:02 /usr/lib/systemd/systemd
# root       512  0.0  0.2  47856 20480 ?        Ss   08:00   0:01 /usr/bin/containerd
# root       845  0.5  0.3 1267856 28416 ?       Ssl  08:00   0:15 /usr/bin/kubelet

# Example 2: Show process tree
ps auxf

# Example 3: Filter processes
ps aux | grep kubelet

# Real-world usage: Check if kubelet is running on a Kubernetes node
# Common error: Confusing BSD-style (aux) with UNIX-style (-ef) syntax
```

#### `top` / `htop` — Real-Time Process Monitor

```bash
# Purpose: Interactive real-time process viewer
# Syntax: top [options]

# Example: Monitor processes sorted by CPU usage
top -o %CPU

# Expected Output (header):
# top - 10:30:45 up 5 days,  2:15,  1 user,  load average: 0.52, 0.38, 0.29
# Tasks: 128 total,   1 running, 127 sleeping,   0 stopped,   0 zombie
# %Cpu(s):  3.2 us,  1.1 sy,  0.0 ni, 95.5 id,  0.1 wa,  0.0 hi,  0.1 si,  0.0 st
# MiB Mem :   7953.5 total,   2145.2 free,   3280.1 used,   2528.2 buff/cache
# MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   4322.6 avail Mem

# Key metrics to watch:
# load average: 0.52, 0.38, 0.29  ← 1-min, 5-min, 15-min CPU load averages
# %wa (I/O wait): High value = disk bottleneck
# %st (steal time): High on VMs = host overcommitted (noisy neighbor)

# Real-world usage: Investigating high CPU on a Kubernetes node
# htop is the enhanced, color-coded alternative (install: apt install htop)
```

### 3.3 Process Signals

Signals are software interrupts sent to processes.

| Signal | Number | Description | Kubernetes Relevance |
| :--- | :--- | :--- | :--- |
| `SIGTERM` | 15 | Graceful termination request | Kubernetes sends this first when deleting a Pod |
| `SIGKILL` | 9 | Forceful kill (cannot be caught) | Sent after `terminationGracePeriodSeconds` expires |
| `SIGHUP` | 1 | Hangup / Reload configuration | Used to reload process config without restart |
| `SIGINT` | 2 | Keyboard interrupt (Ctrl+C) | Stopping foreground processes |
| `SIGSTOP` | 19 | Pause process | Debugging |
| `SIGCONT` | 18 | Resume paused process | Debugging |

```bash
# Purpose: Send a signal to a process
# Syntax: kill [-signal] <PID>

# Example 1: Graceful termination
kill 1234           # Sends SIGTERM (default)
kill -15 1234       # Explicitly sends SIGTERM

# Example 2: Force kill (use as last resort)
kill -9 1234        # Sends SIGKILL

# Example 3: Kill all processes by name
killall containerd
pkill -f "kube-proxy"

# Common mistake: Using kill -9 as the first option.
# Always try SIGTERM first to allow graceful cleanup.
```

### 3.4 `systemd` and `systemctl` — Service Management

**Simple Analogy:**
`systemd` is like a building manager. When you start the building (boot the server), the manager ensures all critical systems turn on in the right order — electricity first, then water, then elevators. It monitors each system and restarts any that fail.

**Technical Explanation:**
`systemd` is the init system (PID 1) on modern Linux distributions. It manages:
- **Services (daemons):** Background processes like `kubelet`, `containerd`, `sshd`.
- **Targets:** Groups of services representing system states (`multi-user.target`, `graphical.target`).
- **Timers:** Scheduled tasks (cron replacement).
- **Sockets:** On-demand service activation.

#### Service Unit File Anatomy (`/etc/systemd/system/kubelet.service`)

```ini
[Unit]
Description=kubelet: The Kubernetes Node Agent
Documentation=https://kubernetes.io/docs/
Wants=network-online.target
After=network-online.target containerd.service

[Service]
ExecStart=/usr/bin/kubelet \
  --config=/var/lib/kubelet/config.yaml \
  --container-runtime-endpoint=unix:///run/containerd/containerd.sock \
  --kubeconfig=/etc/kubernetes/kubelet.conf
Restart=always
RestartSec=10
StartLimitInterval=0

[Install]
WantedBy=multi-user.target
```

| Section | Directive | Meaning |
| :--- | :--- | :--- |
| `[Unit]` | `After=containerd.service` | Start kubelet only after containerd is running |
| `[Service]` | `Restart=always` | Auto-restart if process crashes |
| `[Service]` | `RestartSec=10` | Wait 10 seconds before restarting |
| `[Install]` | `WantedBy=multi-user.target` | Enable on boot when multi-user target is active |

#### `systemctl` Commands

```bash
# Purpose: Control and inspect systemd services
# Syntax: systemctl <action> <service-name>

# Start a service
sudo systemctl start kubelet
# → Expected result: Service starts, no output on success

# Stop a service
sudo systemctl stop kubelet

# Restart a service (stop + start)
sudo systemctl restart kubelet

# Reload configuration without restarting
sudo systemctl reload nginx

# Enable a service to start at boot
sudo systemctl enable kubelet
# → Expected output: Created symlink /etc/systemd/system/multi-user.target.wants/kubelet.service

# Disable auto-start at boot
sudo systemctl disable kubelet

# Check service status
sudo systemctl status kubelet
# → Expected output:
# ● kubelet.service - kubelet: The Kubernetes Node Agent
#    Loaded: loaded (/etc/systemd/system/kubelet.service; enabled; vendor preset: enabled)
#    Active: active (running) since Mon 2026-08-18 08:00:00 UTC; 5h ago
#    Main PID: 845 (kubelet)
#    Tasks: 15 (limit: 4915)
#    Memory: 42.3M
#    CGroup: /system.slice/kubelet.service
#            └─845 /usr/bin/kubelet --config=/var/lib/kubelet/config.yaml

# Check if a service is active
systemctl is-active kubelet
# → Output: active

# Check if a service is enabled (starts at boot)
systemctl is-enabled kubelet
# → Output: enabled

# List all running services
systemctl list-units --type=service --state=running

# Reload systemd after modifying unit files
sudo systemctl daemon-reload

# Real-world usage: After installing Kubernetes components,
#   you enable and start kubelet and containerd.
# Common error: Forgetting daemon-reload after editing a .service file.
```

---

## 4. Users, Groups & File Permissions

### 4.1 Users and Groups

**Simple Analogy:**
Think of a company office. Each **user** is an employee with a badge (username + UID). Each **group** is a department (Engineering, HR, Finance). An employee can belong to multiple departments. File access is controlled by checking the employee's badge and department membership.

```bash
# Key files:
# /etc/passwd  — User account information (username:x:UID:GID:comment:home:shell)
# /etc/shadow  — Encrypted passwords (only root-readable)
# /etc/group   — Group definitions (groupname:x:GID:members)

# View current user
whoami
# → Output: uday

# View current user's UID, GID, and group memberships
id
# → Output: uid=1000(uday) gid=1000(uday) groups=1000(uday),27(sudo),999(docker)

# Create a new user
sudo useradd -m -s /bin/bash -G sudo,docker devops-engineer
# → -m: Create home directory
# → -s /bin/bash: Set default shell
# → -G sudo,docker: Add to supplementary groups

# Set password for user
sudo passwd devops-engineer

# Create a new group
sudo groupadd k8s-admins

# Add existing user to a group
sudo usermod -aG k8s-admins devops-engineer
# → -a: Append (don't remove from existing groups)
# → -G: Supplementary groups

# Delete a user
sudo userdel -r devops-engineer
# → -r: Remove home directory and mail spool

# Switch user
su - devops-engineer
# → -: Load the user's environment

# Common mistake: Forgetting -a with usermod -G removes the user from ALL other groups.
```

### 4.2 File Permissions Deep Dive

```
Permission structure for: ls -la /etc/kubernetes/admin.conf

-rw------- 1 root root 5641 Aug 18 08:00 /etc/kubernetes/admin.conf
│├──┤├──┤├──┤ │ │    │    │              │
│ │   │   │  │ │    │    │              └─ Filename
│ │   │   │  │ │    │    └─ Last modified date
│ │   │   │  │ │    └─ File size in bytes
│ │   │   │  │ └─ Owning group
│ │   │   │  └─ Owning user
│ │   │   │  └─ Hard link count
│ │   │   └─ Others permissions (---)  = No access
│ │   └─ Group permissions (---)  = No access
│ └─ Owner permissions (rw-)  = Read + Write
└─ File type (-=file, d=directory, l=symlink)
```

**Permission Values:**

| Symbol | Numeric | On File | On Directory |
| :--- | :--- | :--- | :--- |
| `r` (read) | 4 | View file contents | List directory contents |
| `w` (write) | 2 | Modify file contents | Create/delete files in directory |
| `x` (execute) | 1 | Run as program/script | Enter directory (`cd`) |
| `-` (none) | 0 | No permission | No permission |

```bash
# Purpose: Change file permissions
# Syntax: chmod [mode] <file>

# Numeric mode examples:
chmod 644 config.yaml    # Owner: rw-, Group: r--, Others: r--
chmod 600 admin.conf     # Owner: rw-, Group: ---, Others: --- (private)
chmod 755 script.sh      # Owner: rwx, Group: r-x, Others: r-x (executable)
chmod 700 .ssh/          # Owner: rwx, Group: ---, Others: --- (SSH directory)

# Symbolic mode examples:
chmod u+x script.sh      # Add execute for owner
chmod g-w config.yaml    # Remove write for group
chmod o-rwx secret.key   # Remove all permissions for others
chmod a+r README.md      # Add read for all (a = all)

# Purpose: Change file ownership
# Syntax: chown [owner]:[group] <file>

# Change owner and group
sudo chown root:root /etc/kubernetes/admin.conf
sudo chown -R uday:uday /home/uday/.kube/    # -R: Recursive

# Purpose: Set default permissions for new files
# umask subtracts from default (files: 666, directories: 777)
umask 022    # New files: 644, New dirs: 755 (standard)
umask 077    # New files: 600, New dirs: 700 (restrictive)

# Real-world usage: Kubernetes kubeconfig files MUST be 600 or kubectl warns.
# Common error: Setting /etc/kubernetes/admin.conf to world-readable (644)
#   allows any user to access the cluster with admin privileges.
```

### 4.3 `sudo` — Superuser Access

```bash
# Purpose: Execute a command as another user (default: root)
# Syntax: sudo [options] <command>

# Run a command as root
sudo systemctl restart kubelet

# Edit sudoers file safely
sudo visudo

# Example sudoers entry:
# uday ALL=(ALL:ALL) NOPASSWD: ALL
# → User "uday" on ANY host, can run ANY command as ANY user, without password

# Check what sudo commands are available
sudo -l

# Real-world usage: Kubernetes installation commands require root access.
# Best practice: Use sudo instead of logging in as root.
# Common error: Editing /etc/sudoers directly (use visudo for syntax checking).
```

---

## 5. SSH (Secure Shell)

### 5.1 SSH Fundamentals

**Simple Analogy:**
SSH is like a secure, encrypted telephone line between two computers. Before you can talk, you exchange credentials to prove your identity. Nobody else can eavesdrop on the conversation.

```bash
# Purpose: Connect to a remote machine securely
# Syntax: ssh [options] user@hostname

# Basic connection
ssh uday@192.168.1.100
ssh uday@my-server.example.com

# Connect on a non-standard port
ssh -p 2222 uday@192.168.1.100

# Connect with a specific private key
ssh -i ~/.ssh/my-key.pem ec2-user@10.0.1.50

# Execute a command on a remote machine without interactive shell
ssh uday@server "kubectl get nodes"

# SSH with verbose output (debugging connection issues)
ssh -vvv uday@192.168.1.100
```

### 5.2 SSH Key Pair Authentication

```bash
# Purpose: Generate an SSH key pair (public + private key)
# Syntax: ssh-keygen [options]

# Generate ED25519 key pair (recommended, more secure than RSA)
ssh-keygen -t ed25519 -C "uday@kubernetes-lab"
# → Prompts for file location (default: ~/.ssh/id_ed25519)
# → Prompts for passphrase (recommended for security)

# Generate RSA 4096-bit key pair (legacy compatibility)
ssh-keygen -t rsa -b 4096 -C "uday@kubernetes-lab"

# Copy public key to remote server
ssh-copy-id -i ~/.ssh/id_ed25519.pub uday@192.168.1.100

# Verify key permissions (CRITICAL)
chmod 700 ~/.ssh/
chmod 600 ~/.ssh/id_ed25519          # Private key: owner read/write only
chmod 644 ~/.ssh/id_ed25519.pub      # Public key: readable by all
chmod 600 ~/.ssh/authorized_keys     # Authorized keys: owner read/write only

# Common error: SSH refuses connection due to "permissions too open"
# Fix: chmod 600 on private key file
```

### 5.3 SSH Configuration (`~/.ssh/config`)

```bash
# Purpose: Create shortcuts for SSH connections
# File: ~/.ssh/config

Host k8s-master
    HostName 10.0.1.10
    User ubuntu
    IdentityFile ~/.ssh/k8s-lab.pem
    Port 22
    StrictHostKeyChecking no

Host k8s-worker-1
    HostName 10.0.1.11
    User ubuntu
    IdentityFile ~/.ssh/k8s-lab.pem

# Usage: Now you can connect with just:
ssh k8s-master
ssh k8s-worker-1
```

---

## 6. Environment Variables

```bash
# Purpose: Set and manage environment variables

# View all environment variables
env
printenv

# View a specific variable
echo $HOME
echo $PATH
echo $USER
echo $SHELL

# Set a variable for the current session
export KUBECONFIG=/etc/kubernetes/admin.conf
export AWS_REGION=us-east-1

# Set a variable permanently (add to ~/.bashrc or ~/.bash_profile)
echo 'export KUBECONFIG=$HOME/.kube/config' >> ~/.bashrc
source ~/.bashrc    # Reload without logging out

# Unset a variable
unset KUBECONFIG

# Kubernetes-relevant environment variables:
# KUBECONFIG         — Path to kubeconfig file
# KUBE_EDITOR        — Editor for kubectl edit (e.g., vim, nano)
# AWS_ACCESS_KEY_ID  — AWS authentication
# AWS_SECRET_ACCESS_KEY — AWS authentication
# AWS_DEFAULT_REGION — Default AWS region
# DOCKER_HOST        — Docker daemon endpoint
# PATH               — Executable search path
```

---

## 7. Package Management

### 7.1 Debian/Ubuntu (`apt`)

```bash
# Purpose: Install, update, and remove software packages
# Used on: Ubuntu, Debian, Linux Mint

# Update package index (fetch latest package lists)
sudo apt update
# → Expected: Lists of packages are updated

# Upgrade all installed packages
sudo apt upgrade -y

# Install a package
sudo apt install -y curl wget vim net-tools jq tree

# Search for a package
apt search containerd

# Show package info
apt show containerd.io

# Remove a package
sudo apt remove vim

# Remove package + configuration files
sudo apt purge vim

# Clean up unused packages
sudo apt autoremove -y

# Common error: Running apt install without apt update first
#   leads to "Unable to locate package" errors.
```

### 7.2 RHEL/Amazon Linux (`dnf` / `yum`)

```bash
# Purpose: Install, update, and remove software packages
# Used on: RHEL, CentOS Stream, Fedora, Amazon Linux 2023

# Update all packages
sudo dnf update -y

# Install a package
sudo dnf install -y curl wget vim net-tools jq

# Search for a package
dnf search containerd

# Remove a package
sudo dnf remove vim

# List installed packages
dnf list installed

# Note: On older RHEL/CentOS 7, use `yum` instead of `dnf`
#   (same syntax, dnf is the modern replacement)
```

---

## 8. Log Management

### 8.1 `journalctl` — systemd Journal

```bash
# Purpose: Query and display logs from the systemd journal
# Syntax: journalctl [options]

# View all logs (latest last)
journalctl

# Follow logs in real-time (like tail -f)
journalctl -f

# View logs for a specific service
journalctl -u kubelet
journalctl -u containerd
journalctl -u sshd

# Follow logs for kubelet in real-time
journalctl -u kubelet -f

# View logs since a specific time
journalctl -u kubelet --since "2026-08-18 08:00:00"
journalctl -u kubelet --since "1 hour ago"

# View only error/critical messages
journalctl -u kubelet -p err

# View kernel messages (equivalent to dmesg)
journalctl -k

# Show logs with no paging (useful for piping)
journalctl -u kubelet --no-pager

# View last 50 lines
journalctl -u kubelet -n 50

# Real-world usage: First command when kubelet is not starting:
#   journalctl -u kubelet -n 100 --no-pager
# Common error: Not specifying -u (unit) and getting overwhelmed by all logs
```

### 8.2 Traditional Log Files

```bash
# Key log files:
# /var/log/syslog          — General system log (Ubuntu/Debian)
# /var/log/messages        — General system log (RHEL/CentOS)
# /var/log/auth.log        — Authentication log (SSH logins, sudo)
# /var/log/kern.log        — Kernel messages
# /var/log/dmesg           — Boot messages
# /var/log/cloud-init.log  — Cloud instance initialization

# View last 100 lines of a log
tail -100 /var/log/syslog

# Follow a log file in real-time
tail -f /var/log/auth.log

# Search for patterns in logs
grep "Failed password" /var/log/auth.log
grep -i "error" /var/log/syslog | tail -20

# View kernel ring buffer
dmesg | tail -20
dmesg -T    # Human-readable timestamps
```

---

## 9. Disk Management

```bash
# Purpose: Inspect and manage disk space and block devices

# Show disk space usage (human-readable)
df -h
# → Expected output:
# Filesystem      Size  Used Avail Use% Mounted on
# /dev/xvda1       50G   12G   38G  24% /
# /dev/xvdb       100G   45G   55G  45% /var/lib/containerd

# Show directory space usage
du -sh /var/log/
# → Output: 2.3G   /var/log/

du -sh /var/lib/containerd/
# → Output: 15G    /var/lib/containerd/

# Show top disk consumers in a directory
du -sh /var/lib/* | sort -rh | head -10

# List block devices
lsblk
# → Expected output:
# NAME    MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
# xvda    202:0    0   50G  0 disk
# └─xvda1 202:1    0   50G  0 part /
# xvdb    202:16   0  100G  0 disk /var/lib/containerd

# Show filesystem type
blkid

# Mount a filesystem
sudo mount /dev/xvdb /mnt/data

# Kubernetes relevance:
# - Node DiskPressure condition triggers Pod eviction
# - Container images and logs consume disk space
# - EBS volumes must be formatted and mounted
# Common error: Running out of disk space on /var/lib/containerd (container images)
```

---

## 10. CPU and Memory

```bash
# Purpose: Inspect CPU and memory resources

# Show CPU information
lscpu
# Key fields: Architecture, CPU(s), Thread(s) per core, Model name

cat /proc/cpuinfo | grep "model name" | head -1
# → Output: model name : Intel(R) Xeon(R) Platinum 8375C CPU @ 2.90GHz

# Show number of CPU cores
nproc
# → Output: 4

# Show memory information (human-readable)
free -h
# → Expected output:
#               total        used        free      shared  buff/cache   available
# Mem:          7.8Gi       3.2Gi       2.1Gi       12Mi       2.5Gi       4.3Gi
# Swap:         2.0Gi          0B       2.0Gi

# Key: Available = free + reclaimable cache (actual usable memory)
# Kubernetes uses "available" not "free" for resource calculations

# Show system uptime and load average
uptime
# → Output: 10:30:45 up 5 days, 2:15, 1 user, load average: 0.52, 0.38, 0.29
# Load average: 1-minute, 5-minute, 15-minute
# Rule of thumb: Load average should be ≤ number of CPU cores

# Detailed system resource usage
vmstat 1 5
# → Shows CPU, memory, I/O, and system stats every 1 second, 5 iterations

# I/O statistics
iostat -xz 1 3

# Kubernetes relevance:
# - kubelet reports node CPU and memory capacity to the API server
# - Resource requests and limits are enforced via cgroups
# - OOMKilled occurs when a container exceeds its memory limit
# Common error: Not distinguishing between "free" and "available" memory
```

---

## 11. Essential Text Processing Tools

### 11.1 `grep` — Pattern Searching

```bash
# Purpose: Search for patterns in files or command output
# Syntax: grep [options] <pattern> [file...]

# Search for a string in a file
grep "error" /var/log/syslog

# Case-insensitive search
grep -i "error" /var/log/syslog

# Recursive search in directory
grep -r "image:" /etc/kubernetes/manifests/

# Show line numbers
grep -n "apiVersion" deployment.yaml

# Invert match (show lines NOT matching)
grep -v "^#" /etc/containerd/config.toml    # Exclude comments

# Count matching lines
grep -c "error" /var/log/syslog

# Show context (3 lines before and after match)
grep -B3 -A3 "CrashLoopBackOff" pod-events.log

# Extended regex (multiple patterns)
grep -E "error|warning|critical" /var/log/syslog

# Use with pipes
kubectl get pods | grep -i "error"
ps aux | grep kubelet | grep -v grep

# Real-world usage: Searching Kubernetes logs for specific errors
# Common error: Forgetting -i for case-insensitive searches
```

### 11.2 `awk` — Text Processing Language

```bash
# Purpose: Pattern scanning and processing language
# Syntax: awk 'pattern {action}' [file]

# Print specific columns (fields)
# $1=first column, $2=second, $NF=last column
kubectl get pods | awk '{print $1, $3}'
# → Prints Pod name and status columns

# Filter rows by condition
df -h | awk '$5 > "80%" {print $1, $5, $6}'
# → Shows filesystems above 80% usage

# Custom field separator
awk -F: '{print $1, $3}' /etc/passwd
# → Prints username and UID (colon-delimited)

# Sum a column
kubectl top pods | awk 'NR>1 {sum += $3} END {print "Total CPU:", sum "m"}'

# Count occurrences
awk '{count[$3]++} END {for (s in count) print s, count[s]}' access.log

# Real-world usage: Extracting specific data from kubectl output
```

### 11.3 `sed` — Stream Editor

```bash
# Purpose: Perform text transformations on files or input streams
# Syntax: sed [options] 'command' [file]

# Replace first occurrence per line
sed 's/old-text/new-text/' file.yaml

# Replace all occurrences per line (global)
sed 's/old-text/new-text/g' file.yaml

# Replace in-place (modify the file)
sed -i 's/replicas: 1/replicas: 3/g' deployment.yaml

# Delete lines matching a pattern
sed '/^#/d' config.toml        # Delete comment lines
sed '/^$/d' config.toml        # Delete empty lines

# Print specific line range
sed -n '10,20p' deployment.yaml    # Print lines 10-20

# Insert text before a line
sed -i '/\[Service\]/i Environment="KUBELET_EXTRA_ARGS=--node-ip=10.0.1.10"' kubelet.service

# Real-world usage: Modifying configuration files in shell scripts
# Common error: Forgetting -i for in-place editing (sed prints to stdout by default)
```

### 11.4 `find` — File Search

```bash
# Purpose: Search for files and directories in a directory hierarchy
# Syntax: find <path> [options] [expression]

# Find files by name
find /etc -name "*.conf"

# Find files modified in the last 24 hours
find /var/log -mtime -1

# Find files larger than 100MB
find /var/lib -size +100M

# Find and delete old log files
find /var/log -name "*.log" -mtime +30 -delete

# Find files by permission
find /etc/kubernetes -perm 600

# Find and execute a command
find /etc/kubernetes/pki -name "*.crt" -exec openssl x509 -in {} -noout -enddate \;
# → Shows expiry date of all Kubernetes certificates

# Real-world usage: Finding expired certificates, large log files, old container images
```

### 11.5 `tar` — Archive Management

```bash
# Purpose: Create and extract compressed archives
# Syntax: tar [options] <archive> [files...]

# Create a compressed archive
tar -czf backup.tar.gz /etc/kubernetes/
# → c=create, z=gzip compression, f=filename

# Extract an archive
tar -xzf backup.tar.gz
# → x=extract, z=gzip, f=filename

# Extract to a specific directory
tar -xzf backup.tar.gz -C /tmp/restore/

# List contents without extracting
tar -tzf backup.tar.gz

# Create with verbose output
tar -czvf etcd-backup.tar.gz /var/lib/etcd/

# Real-world usage: Backing up etcd data, Kubernetes configurations
```

---

# PART B — COMPUTER NETWORKING FUNDAMENTALS

---

## 12. IP Addressing & Subnetting

### 12.1 IPv4 Address Anatomy

**Simple Analogy:**
An IP address is like a postal address. Just as "123 Main Street, Apt 4B, New York, NY 10001" uniquely identifies a location, an IP address like `192.168.1.100` uniquely identifies a device on a network. The **network portion** is like the city name (identifies the neighborhood), and the **host portion** is like the apartment number (identifies the specific device).

**Technical Explanation:**
An IPv4 address is a 32-bit number, written as four octets in dotted-decimal notation.

```
192    .   168   .    1    .   100
│           │          │         │
11000000  10101000  00000001  01100100
│           │          │         │
└───────────┴──────────┴─────────┘
        32 bits total
```

### 12.2 Private vs Public IP Addresses

| Type | Ranges (RFC 1918) | Routable on Internet? | Use Case |
| :--- | :--- | :--- | :--- |
| **Private** | `10.0.0.0/8` (10.0.0.0 – 10.255.255.255) | No | AWS VPCs, internal networks |
| **Private** | `172.16.0.0/12` (172.16.0.0 – 172.31.255.255) | No | Docker default bridge, internal |
| **Private** | `192.168.0.0/16` (192.168.0.0 – 192.168.255.255) | No | Home networks, lab environments |
| **Public** | Everything else | Yes | Internet-facing servers, load balancers |
| **Loopback** | `127.0.0.0/8` (typically `127.0.0.1`) | No | Localhost communication |

**Kubernetes Relevance:**
- **AWS VPC CIDR:** `10.0.0.0/16` (65,536 IPs for VPC)
- **Pod Network CIDR:** `192.168.0.0/16` (Calico default) or VPC CIDR (AWS VPC CNI)
- **Service CIDR:** `10.96.0.0/12` (default Kubernetes Service IP range)
- **Docker Bridge:** `172.17.0.0/16` (Docker default)

### 12.3 CIDR Notation & Subnetting

**Simple Analogy:**
CIDR notation is like saying "all apartments in Building A." `/24` means "the first 24 bits are the building address, the remaining 8 bits identify individual apartments."

```
10.0.1.0/24
│        │
│        └─ Prefix length: 24 bits are the network portion
│           Remaining 32-24 = 8 bits for hosts
│           2^8 = 256 addresses (254 usable, minus network + broadcast)
└─ Network address

Common CIDR blocks:
/8   = 16,777,216 IPs  (e.g., 10.0.0.0/8 — entire 10.x.x.x range)
/16  = 65,536 IPs      (e.g., 10.0.0.0/16 — AWS VPC)
/20  = 4,096 IPs       (e.g., 10.0.0.0/20 — Large subnet)
/24  = 256 IPs         (e.g., 10.0.1.0/24 — Standard subnet)
/28  = 16 IPs          (e.g., 10.0.1.0/28 — Small subnet, VPC CNI prefix delegation)
/32  = 1 IP            (e.g., 10.0.1.5/32 — Single host route)
```

**Subnet Calculation Example:**

```
VPC CIDR:    10.0.0.0/16  (65,536 IPs)

Subnets:
┌─────────────────────────────────────────────────────┐
│ Public Subnet A:   10.0.1.0/24   (256 IPs, AZ-a)   │
│ Public Subnet B:   10.0.2.0/24   (256 IPs, AZ-b)   │
│ Private Subnet A:  10.0.10.0/24  (256 IPs, AZ-a)   │
│ Private Subnet B:  10.0.20.0/24  (256 IPs, AZ-b)   │
└─────────────────────────────────────────────────────┘
```

---

## 13. Routing, Gateways & NAT

### 13.1 Routing

**Simple Analogy:**
Routing is like GPS navigation. When a data packet needs to go from point A to point B, the **routing table** is the map that tells it which road (interface) to take and which intersection (gateway) to turn at.

```bash
# View the routing table
ip route
# → Expected output:
# default via 10.0.1.1 dev eth0 proto dhcp metric 100
# 10.0.1.0/24 dev eth0 proto kernel scope link src 10.0.1.50
# 172.17.0.0/16 dev docker0 proto kernel scope link src 172.17.0.1

# Interpretation:
# default via 10.0.1.1  → All unknown destinations go to gateway 10.0.1.1
# 10.0.1.0/24 dev eth0  → Local subnet is directly reachable via eth0
# 172.17.0.0/16 dev docker0 → Docker network is reachable via docker0 bridge
```

### 13.2 Default Gateway

The **default gateway** is the router that forwards traffic to destinations outside the local subnet. In AWS, this is typically the first usable IP in the subnet (e.g., `10.0.1.1` for subnet `10.0.1.0/24`).

### 13.3 NAT (Network Address Translation)

```
┌──────────────────────────────────────────────────────────────────────┐
│                        NAT Gateway                                    │
│                                                                       │
│  Private IP (10.0.10.50)  ──►  NAT Gateway  ──►  Public IP (54.x.x.x)│
│  (EKS Worker Node)              (Translates)       (Internet-facing)  │
│                                                                       │
│  Purpose: Allows private subnet resources to access the internet      │
│           without exposing them with public IP addresses.              │
└──────────────────────────────────────────────────────────────────────┘

SNAT (Source NAT): Outbound — Changes source IP from private to public
                   Used by: NAT Gateway, Kubernetes kube-proxy (masquerade)
DNAT (Destination NAT): Inbound — Changes destination IP from public to private
                        Used by: Load Balancers, NodePort services
```

---

## 14. DNS (Domain Name System)

### 14.1 DNS Fundamentals

**Simple Analogy:**
DNS is the phone book of the internet. Instead of remembering `142.250.80.46`, you type `google.com` and DNS translates it to the IP address.

### 14.2 DNS Record Types

| Record Type | Purpose | Example |
| :--- | :--- | :--- |
| **A** | Maps hostname to IPv4 address | `app.example.com → 10.0.1.50` |
| **AAAA** | Maps hostname to IPv6 address | `app.example.com → 2001:db8::1` |
| **CNAME** | Alias pointing to another hostname | `www.example.com → app.example.com` |
| **MX** | Mail server for a domain | `example.com → mail.example.com (priority 10)` |
| **TXT** | Arbitrary text (SPF, DKIM, verification) | `example.com → "v=spf1 include:_spf.google.com"` |
| **SRV** | Service location (port + host) | `_https._tcp.example.com → 443 app.example.com` |
| **NS** | Nameserver for a zone | `example.com → ns-123.awsdns-15.com` |
| **PTR** | Reverse lookup (IP → hostname) | `50.1.0.10.in-addr.arpa → app.example.com` |

**Kubernetes DNS Records (CoreDNS):**
```
# Service A record:
my-service.default.svc.cluster.local → 10.96.0.100 (ClusterIP)

# Pod A record:
10-0-1-50.default.pod.cluster.local → 10.0.1.50 (Pod IP)

# Headless Service (StatefulSet):
my-db-0.my-db-headless.default.svc.cluster.local → 10.0.1.51 (Pod IP directly)
```

### 14.3 DNS Resolution Process

```
Application (curl google.com)
       │
       ▼
1. Check /etc/hosts (local file)
       │ (not found)
       ▼
2. Check local DNS cache
       │ (not found)
       ▼
3. Query /etc/resolv.conf nameserver (e.g., 169.254.169.253 on AWS)
       │
       ▼
4. Recursive DNS Resolver (AWS Route 53 Resolver / ISP DNS)
       │
       ├──► Root DNS Server (.)           → "Ask .com servers"
       │
       ├──► TLD DNS Server (.com)         → "Ask google.com nameservers"
       │
       └──► Authoritative DNS Server      → "google.com = 142.250.80.46"
              (google.com nameserver)
       │
       ▼
5. Response cached (TTL seconds) and returned to application
```

```bash
# DNS configuration file
cat /etc/resolv.conf
# → nameserver 169.254.169.253   (AWS VPC DNS resolver)
# → search us-east-1.compute.internal

# In Kubernetes Pods:
cat /etc/resolv.conf
# → nameserver 10.96.0.10        (CoreDNS Service ClusterIP)
# → search default.svc.cluster.local svc.cluster.local cluster.local
```

---

## 15. TCP/IP & OSI Models

### 15.1 OSI 7-Layer Model vs TCP/IP 4-Layer Model

```
┌─────────────────────┐     ┌─────────────────────┐
│   OSI 7-Layer Model │     │  TCP/IP 4-Layer Model│
├─────────────────────┤     ├─────────────────────┤
│ 7. Application      │ ──► │                     │
│ 6. Presentation     │ ──► │ 4. Application      │  HTTP, DNS, SSH, TLS
│ 5. Session          │ ──► │    (Layer 7)        │
├─────────────────────┤     ├─────────────────────┤
│ 4. Transport        │ ──► │ 3. Transport        │  TCP, UDP
│                     │     │    (Layer 4)        │  Ports, Connections
├─────────────────────┤     ├─────────────────────┤
│ 3. Network          │ ──► │ 2. Internet         │  IP, ICMP, Routing
│                     │     │    (Layer 3)        │  IP Addresses
├─────────────────────┤     ├─────────────────────┤
│ 2. Data Link        │ ──► │ 1. Network Access   │  Ethernet, MAC, ARP
│ 1. Physical         │ ──► │    (Layer 1-2)      │  Physical cables, Wi-Fi
└─────────────────────┘     └─────────────────────┘

Kubernetes Load Balancer Relevance:
- Layer 4 (NLB): Routes by IP + Port (TCP/UDP). Fast, no inspection.
- Layer 7 (ALB): Routes by HTTP path, hostname, headers. Smarter, slower.
```

### 15.2 TCP vs UDP

| Feature | TCP (Transmission Control Protocol) | UDP (User Datagram Protocol) |
| :--- | :--- | :--- |
| **Connection** | Connection-oriented (3-way handshake) | Connectionless |
| **Reliability** | Guaranteed delivery (ACKs, retransmissions) | Best-effort (no guarantees) |
| **Ordering** | Data arrives in order | No ordering guarantee |
| **Speed** | Slower (overhead from reliability) | Faster (minimal overhead) |
| **Use Case** | HTTP/HTTPS, SSH, Kubernetes API (6443) | DNS queries (53), streaming, gaming |
| **K8s Use** | API Server, kubelet, etcd communication | CoreDNS, some CNI tunnels |

### 15.3 TCP 3-Way Handshake

```
Client                          Server
  │                               │
  │──── SYN (seq=100) ──────────►│   Step 1: Client requests connection
  │                               │
  │◄─── SYN-ACK (seq=200,        │   Step 2: Server acknowledges + sends own SYN
  │      ack=101) ────────────────│
  │                               │
  │──── ACK (ack=201) ──────────►│   Step 3: Client acknowledges
  │                               │
  │◄──── Data Transfer ─────────►│   Connection established!
  │                               │
```

### 15.4 Important Ports

| Port | Protocol | Service | Kubernetes Relevance |
| :--- | :--- | :--- | :--- |
| 22 | TCP | SSH | Accessing nodes |
| 53 | TCP/UDP | DNS | CoreDNS |
| 80 | TCP | HTTP | Ingress |
| 443 | TCP | HTTPS | Ingress, API Server (sometimes) |
| 2379 | TCP | etcd client | API Server ↔ etcd |
| 2380 | TCP | etcd peer | etcd cluster replication |
| 6443 | TCP | Kubernetes API | kubectl, kubelet → API Server |
| 10250 | TCP | kubelet API | API Server → kubelet |
| 10259 | TCP | kube-scheduler | Scheduler health/metrics |
| 10257 | TCP | kube-controller-manager | Controller Manager health |
| 30000-32767 | TCP | NodePort range | NodePort Services |

---

## 16. HTTP/HTTPS & TLS/SSL

### 16.1 HTTP Basics

```bash
# HTTP Request Structure:
# METHOD URI HTTP/VERSION
# Headers
# (empty line)
# Body

# Example:
# GET /api/v1/namespaces/default/pods HTTP/1.1
# Host: kube-apiserver:6443
# Authorization: Bearer <token>
# Accept: application/json

# HTTP Response Status Codes:
# 2xx — Success (200 OK, 201 Created, 204 No Content)
# 3xx — Redirection (301 Moved, 302 Found)
# 4xx — Client Error (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found)
# 5xx — Server Error (500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable)

# Kubernetes API uses HTTPS (HTTP over TLS) on port 6443
```

### 16.2 TLS/SSL Handshake

```
Client (kubectl)                    Server (kube-apiserver)
      │                                       │
      │──── ClientHello ─────────────────────►│  Supported TLS versions, cipher suites
      │                                       │
      │◄──── ServerHello + Certificate ───────│  Server's X.509 certificate
      │                                       │
      │  Verifies certificate against CA      │
      │  (Kubernetes CA: /etc/kubernetes/pki/ca.crt)
      │                                       │
      │──── Key Exchange ────────────────────►│  Shared secret established
      │                                       │
      │◄═══ Encrypted Communication ════════►│  All subsequent data is encrypted
      │                                       │
```

**Kubernetes Certificate Files (`/etc/kubernetes/pki/`):**

| File | Purpose |
| :--- | :--- |
| `ca.crt` / `ca.key` | Cluster Certificate Authority |
| `apiserver.crt` / `apiserver.key` | API Server TLS certificate |
| `apiserver-kubelet-client.crt` | API Server → kubelet authentication |
| `etcd/ca.crt` | etcd Certificate Authority |
| `front-proxy-ca.crt` | Aggregation layer CA |

---

## 17. Load Balancing

```
                          ┌─────────────────────┐
                          │    Load Balancer     │
     Client Request ─────►│  (Distributes load) │
                          └──────────┬──────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
             ┌──────────┐    ┌──────────┐    ┌──────────┐
             │ Server 1 │    │ Server 2 │    │ Server 3 │
             └──────────┘    └──────────┘    └──────────┘

Layer 4 Load Balancer (AWS NLB):
  - Routes based on IP + Port
  - Very fast, no content inspection
  - TCP/UDP pass-through
  - Use for: Database connections, gRPC, raw TCP

Layer 7 Load Balancer (AWS ALB):
  - Routes based on HTTP path, hostname, headers
  - Can inspect and modify HTTP content
  - SSL/TLS termination
  - Use for: Web applications, REST APIs, microservices

Algorithms:
  - Round Robin: Distributes requests equally in sequence
  - Least Connections: Sends to server with fewest active connections
  - IP Hash: Consistent routing based on client IP (session affinity)
```

---

## 18. Firewalls: Security Groups vs Network ACLs

| Feature | Security Group (SG) | Network ACL (NACL) |
| :--- | :--- | :--- |
| **Scope** | Instance / ENI level | Subnet level |
| **State** | **Stateful** (return traffic auto-allowed) | **Stateless** (must allow return traffic explicitly) |
| **Rules** | Allow rules only (implicit deny) | Allow AND Deny rules |
| **Evaluation** | All rules evaluated (most permissive wins) | Rules evaluated in order (first match wins) |
| **Default** | Denies all inbound, allows all outbound | Allows all inbound and outbound |
| **K8s Use** | Control access to EKS worker nodes, API server | Rarely modified; SGs are primary |

---

## 19. Network Diagnostic Commands

### 19.1 `ping` — ICMP Connectivity Test

```bash
# Purpose: Test basic network connectivity (ICMP echo)
# Syntax: ping [options] <host>

ping 8.8.8.8
# → Expected output:
# PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.
# 64 bytes from 8.8.8.8: icmp_seq=1 ttl=118 time=1.23 ms

ping -c 4 google.com         # Send only 4 packets
ping -W 2 10.0.1.100         # Timeout after 2 seconds

# If ping fails: Check firewall rules, routing, DNS resolution
# Note: Some hosts/firewalls block ICMP — ping failure ≠ host unreachable
```

### 19.2 `traceroute` / `tracepath` — Path Tracing

```bash
# Purpose: Show the network path (hops) to a destination
# Syntax: traceroute <host>

traceroute 8.8.8.8
# → Expected output:
# 1  10.0.1.1 (10.0.1.1)  0.5 ms
# 2  10.0.0.1 (10.0.0.1)  1.2 ms
# 3  * * *                          ← Hop blocking ICMP
# 4  dns.google (8.8.8.8)  2.1 ms

# Useful for: Identifying where network connectivity breaks
```

### 19.3 `nslookup` & `dig` — DNS Queries

```bash
# Purpose: Query DNS servers for hostname resolution

# nslookup (simpler)
nslookup google.com
nslookup my-service.default.svc.cluster.local 10.96.0.10

# dig (more detailed, preferred for debugging)
# Purpose: DNS lookup with detailed output
# Syntax: dig [@server] <name> [type]

dig google.com
# → Shows QUESTION SECTION, ANSWER SECTION, authority, timing

dig +short google.com
# → Output: 142.250.80.46 (just the IP)

dig @10.96.0.10 my-service.default.svc.cluster.local
# → Query CoreDNS for a Kubernetes Service

dig +trace google.com
# → Shows full recursive resolution path (root → TLD → authoritative)

# Real-world usage: Debugging Kubernetes DNS resolution failures
```

### 19.4 `ss` / `netstat` — Socket Statistics

```bash
# Purpose: Display network connections, listening ports, and socket statistics
# ss is the modern replacement for netstat

# Show all TCP listening ports
ss -tlnp
# → Expected output:
# State   Recv-Q  Send-Q  Local Address:Port   Peer Address:Port  Process
# LISTEN  0       4096    0.0.0.0:6443          0.0.0.0:*          users:(("kube-apiserver",pid=1234))
# LISTEN  0       4096    0.0.0.0:10250         0.0.0.0:*          users:(("kubelet",pid=845))
# LISTEN  0       4096    127.0.0.1:2379        0.0.0.0:*          users:(("etcd",pid=456))

# Flags: -t=TCP, -l=listening, -n=numeric (no DNS), -p=show process

# Show all established connections
ss -tnp

# Show all UDP sockets
ss -ulnp

# Show connections to a specific port
ss -tnp | grep 6443

# Using netstat (legacy, may need net-tools package)
netstat -tlnp

# Real-world usage: Verifying that Kubernetes components are listening on expected ports
# Common error: Not using -n flag (DNS resolution delays output)
```

### 19.5 `curl` — HTTP Client

```bash
# Purpose: Transfer data to/from a server using HTTP/HTTPS
# Syntax: curl [options] <URL>

# Basic GET request
curl http://localhost:80

# Verbose output (see headers, TLS handshake)
curl -iv https://google.com

# Follow redirects
curl -L http://example.com

# POST with JSON data
curl -X POST http://localhost:8080/api/v1/data \
  -H "Content-Type: application/json" \
  -d '{"name": "test"}'

# Download a file
curl -O https://example.com/file.tar.gz

# Test Kubernetes API Server (with certificate)
curl --cacert /etc/kubernetes/pki/ca.crt \
     --cert /etc/kubernetes/pki/apiserver-kubelet-client.crt \
     --key /etc/kubernetes/pki/apiserver-kubelet-client.key \
     https://localhost:6443/api/v1/nodes

# Check HTTP status code only
curl -o /dev/null -s -w "%{http_code}" http://localhost:8080/healthz
# → Output: 200

# Real-world usage: Testing application endpoints, health checks, API connectivity
```

### 19.6 `ip` — Network Configuration

```bash
# Purpose: Show and manage network interfaces, addresses, and routes
# Syntax: ip [object] [command]

# Show all network interfaces and IP addresses
ip addr show
# (or short form: ip a)

# Show a specific interface
ip addr show eth0

# Show routing table
ip route show
# (or short form: ip r)

# Show link layer information (MAC addresses, MTU, state)
ip link show

# Show ARP/neighbor table
ip neigh show

# Real-world usage: Checking node IP addresses, Pod network interfaces
```

### 19.7 `tcpdump` — Packet Capture

```bash
# Purpose: Capture and analyze network traffic
# Syntax: tcpdump [options] [filter expression]

# Capture all traffic on any interface
sudo tcpdump -i any

# Capture traffic on a specific port
sudo tcpdump -i any port 6443

# Capture traffic to/from a specific host
sudo tcpdump -i any host 10.0.1.10

# Capture DNS traffic
sudo tcpdump -i any port 53

# Write capture to file (for Wireshark analysis)
sudo tcpdump -i any -w /tmp/capture.pcap port 443

# Capture with human-readable output, limit to 100 packets
sudo tcpdump -i any -c 100 -nn port 80

# Flags: -nn=don't resolve names/ports, -c=count, -w=write to file

# Real-world usage: Debugging network connectivity between Pods, DNS issues
# Common error: Forgetting sudo (tcpdump requires root privileges)
```

---

## 20. Hands-On Labs

### Lab 0.1: Linux Filesystem Exploration

**Objective:** Navigate the Linux filesystem and understand key directories.

```bash
# Step 1: Log into your Linux machine
ssh uday@your-linux-vm

# Step 2: Explore the filesystem
ls -la /
ls -la /etc/
ls -la /var/log/
cat /etc/os-release
cat /proc/cpuinfo | head -10
cat /proc/meminfo | head -10
df -h
free -h

# Step 3: Create a working directory
mkdir -p ~/k8s-labs/level-0
cd ~/k8s-labs/level-0
pwd
```

### Lab 0.2: User, Permissions & SSH

**Objective:** Create a user, configure permissions, and set up SSH key authentication.

```bash
# Step 1: Create a new user
sudo useradd -m -s /bin/bash k8s-student
sudo passwd k8s-student

# Step 2: Create a file and set restrictive permissions
echo "secret-api-key=abc123" > ~/k8s-labs/level-0/secret.txt
chmod 600 ~/k8s-labs/level-0/secret.txt
ls -la ~/k8s-labs/level-0/secret.txt
# Verify: Only owner has rw access

# Step 3: Generate SSH key pair
ssh-keygen -t ed25519 -f ~/.ssh/lab_key -N ""
ls -la ~/.ssh/
# Verify: lab_key is 600, lab_key.pub is 644
```

### Lab 0.3: Process & Service Management

**Objective:** Inspect processes and manage services with systemctl.

```bash
# Step 1: Inspect running processes
ps aux | head -20
ps aux | grep ssh
top -bn1 | head -15

# Step 2: Check systemd services
systemctl list-units --type=service --state=running
systemctl status sshd
journalctl -u sshd -n 10

# Step 3: Create a simple service (optional, for understanding)
sudo tee /etc/systemd/system/hello.service > /dev/null <<EOF
[Unit]
Description=Hello World Service

[Service]
ExecStart=/bin/bash -c 'while true; do echo "Hello at $(date)"; sleep 60; done'
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl start hello
sudo systemctl status hello
journalctl -u hello -n 5
sudo systemctl stop hello
sudo systemctl disable hello
sudo rm /etc/systemd/system/hello.service
sudo systemctl daemon-reload
```

### Lab 0.4: Network Diagnostics

**Objective:** Practice DNS resolution, connectivity testing, and port scanning.

```bash
# Step 1: Test basic connectivity
ping -c 4 8.8.8.8
ping -c 4 google.com

# Step 2: DNS resolution
dig +short google.com
dig google.com
nslookup google.com
cat /etc/resolv.conf

# Step 3: Check listening ports
ss -tlnp
sudo ss -tlnp   # With process names

# Step 4: HTTP testing
curl -iv https://google.com 2>&1 | head -20
curl -o /dev/null -s -w "HTTP Status: %{http_code}\n" https://google.com

# Step 5: Trace network path
traceroute 8.8.8.8

# Step 6: Text processing pipeline
# Count unique IP addresses in auth.log
sudo grep "Failed password" /var/log/auth.log 2>/dev/null | \
  awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | head -10
```

---

## 21. Troubleshooting Guide

| Problem | Diagnostic Command | Common Cause | Resolution |
| :--- | :--- | :--- | :--- |
| Cannot SSH into server | `ssh -vvv user@host` | Wrong key permissions, firewall | `chmod 600 ~/.ssh/key`, check SG port 22 |
| Service not starting | `systemctl status <svc>`, `journalctl -u <svc>` | Config error, missing dependency | Read error logs, fix config, `daemon-reload` |
| Disk full | `df -h`, `du -sh /var/*` | Log files, container images | Clean logs, prune images, resize disk |
| DNS not resolving | `dig @nameserver domain`, `cat /etc/resolv.conf` | Wrong nameserver, network issue | Fix resolv.conf, check network connectivity |
| Cannot reach port | `ss -tlnp`, `curl -v host:port` | Service not running, firewall | Start service, open firewall port |
| High CPU / Load | `top`, `ps aux --sort=-%cpu` | Runaway process, insufficient resources | Kill process, scale instance |
| OOM (Out of Memory) | `dmesg \| grep -i oom`, `free -h` | Memory leak, insufficient RAM | Fix app, add memory, add swap (temporary) |

---

## 22. Interview Questions

### Q1: What is the difference between `/etc` and `/var`?
**Expected Answer:** `/etc` stores system-wide configuration files that are typically static (e.g., `sshd_config`, `resolv.conf`). `/var` stores variable data that changes during operation (e.g., logs in `/var/log/`, package databases in `/var/lib/`).

**Follow-up:** Where does Kubernetes store Pod logs?
**Answer:** `/var/log/pods/` on the node where the Pod is running.

---

### Q2: What is the difference between `SIGTERM` and `SIGKILL`?
**Expected Answer:** `SIGTERM` (signal 15) is a graceful termination request — the process can catch it, perform cleanup (close connections, save state), and exit. `SIGKILL` (signal 9) immediately terminates the process — it cannot be caught or ignored.

**Kubernetes Context:** When a Pod is deleted, Kubernetes sends `SIGTERM` to the containers. If they don't exit within `terminationGracePeriodSeconds` (default 30s), Kubernetes sends `SIGKILL`.

**Common Mistake:** Saying `kill -9` is the standard way to stop processes. Always try `SIGTERM` first.

---

### Q3: What is the difference between TCP and UDP? Give Kubernetes examples.
**Expected Answer:** TCP is connection-oriented, reliable, and ordered — used for the Kubernetes API Server (port 6443), SSH (port 22), and kubelet communication (port 10250). UDP is connectionless, faster, and best-effort — used for DNS queries (port 53) by CoreDNS.

---

### Q4: Explain CIDR notation `10.0.0.0/16`. How many usable IPs?
**Expected Answer:** `/16` means the first 16 bits are the network portion, leaving 16 bits for hosts. 2^16 = 65,536 total addresses. Subtract 2 (network address `10.0.0.0` and broadcast `10.0.255.255`) = 65,534 usable IPs. In AWS, 5 IPs per subnet are reserved (first 4 + last 1).

---

### Q5: What is the difference between Security Groups and Network ACLs?
**Expected Answer:** Security Groups are **stateful** (return traffic is automatically allowed) and operate at the instance/ENI level with only allow rules. NACLs are **stateless** (return traffic must be explicitly allowed) and operate at the subnet level with both allow and deny rules evaluated in order.

**Interviewer's Expectation:** The candidate should explain "stateful vs stateless" with examples.

---

## 23. Best Practices

1. **Never log in as root.** Use a regular user with `sudo` access.
2. **Set SSH key authentication only.** Disable password authentication in `sshd_config`.
3. **Keep SSH key permissions strict:** Private key = `600`, `.ssh/` directory = `700`.
4. **Use `systemctl` for service management.** Do not manually start background processes.
5. **Monitor disk space proactively.** Set alerts for `/var/lib/containerd` and `/var/log`.
6. **Understand CIDR notation deeply.** Kubernetes networking relies heavily on CIDR.
7. **Learn `journalctl` well.** It is the primary troubleshooting tool for node-level issues.
8. **Master text processing pipelines.** `grep | awk | sort | uniq` is a daily workflow.

---

## 24. Common Mistakes

1. Using `kill -9` before trying `kill` (SIGTERM).
2. Forgetting `sudo systemctl daemon-reload` after editing `.service` files.
3. Setting SSH private key permissions to `644` (too open — SSH refuses).
4. Confusing `free` memory with `available` memory.
5. Not understanding CIDR — miscalculating subnet capacity.
6. Using `netstat` on modern systems instead of `ss`.
7. Forgetting `-n` flag in `ss`/`netstat` (DNS resolution slows output).
8. Editing `/etc/sudoers` directly instead of using `visudo`.

---

## 25. Summary

| Topic | Key Takeaway |
| :--- | :--- |
| **Linux** | Kubernetes runs on Linux — understanding processes, services, permissions, and logs is mandatory |
| **Filesystem** | Know `/etc/kubernetes/`, `/var/log/pods/`, `/var/lib/kubelet/`, `/proc/`, `/sys/fs/cgroup/` |
| **systemd** | All K8s components (`kubelet`, `containerd`) run as systemd services |
| **Permissions** | Kubernetes config files must have strict permissions (600 for kubeconfig) |
| **Networking** | IP addressing, CIDR, DNS, TCP/UDP, TLS, and firewalls are foundational for K8s networking |
| **Diagnostics** | `ss`, `curl`, `dig`, `tcpdump`, `journalctl` are daily tools for K8s engineers |

---

## 26. Practice Assignment

1. Set up an Ubuntu 22.04 VM (locally or on AWS EC2).
2. Create a user named `k8s-admin` with sudo access and SSH key authentication.
3. Install `curl`, `wget`, `vim`, `jq`, `tree`, and `net-tools`.
4. Write a bash script that displays: hostname, IP address, CPU count, total memory, disk usage, and uptime.
5. Use `dig` to resolve `kubernetes.io` and identify all A records.
6. Use `ss` to list all listening TCP ports and identify the SSH service.
7. Calculate: How many usable IPs are in a `/24` subnet? A `/20` subnet?
8. Explain the difference between Security Groups and NACLs in your own words.
