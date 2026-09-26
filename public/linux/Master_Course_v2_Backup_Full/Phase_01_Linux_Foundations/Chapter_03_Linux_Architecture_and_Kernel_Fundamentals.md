# CHAPTER 03 — LINUX ARCHITECTURE AND KERNEL FUNDAMENTALS

## 1. Introduction

The Linux operating system is not a monolithic black box. It is a precisely engineered, layered architecture where each layer has a specific responsibility. Understanding these layers — from bare-metal hardware at the bottom to user-space applications at the top — is essential for troubleshooting, performance tuning, security hardening, and system design. 

When a production server experiences high CPU load, memory exhaustion, or I/O bottlenecks, the engineer must understand which layer is causing the problem. Is it a runaway user-space process? A kernel driver issue? A hardware failure? Understanding Linux architecture enables precise root-cause analysis. Companies invest in engineers who understand how Linux works internally — not just how to type commands. An engineer who understands kernel-space vs user-space, context switching, system calls, and memory management can design more efficient infrastructure, prevent outages, and resolve incidents faster.

Think of the Linux operating system as a large commercial airport:
- **Hardware Layer (The Physical Airport)** — Runways, terminals, hangars. These are the physical CPU, RAM, hard drives, and network cards.
- **Kernel Layer (Air Traffic Control)** — The central command centre that manages processes, memory, storage, and networking.
- **Shell Layer (The Control Tower Radio)** — Translates commands between pilots (users) and Air Traffic Control (kernel). 
- **User Space (Passengers and Airlines)** — The applications (like Nginx, MySQL) that use the facilities but cannot directly access the runway without passing through designated gates (system calls).

## 2. Linux Architecture and Kernel Fundamentals

### The Four Layers of Linux Architecture

```text
Hardware
   ↓
Kernel
   ↓
Shell
   ↓
User Space
```

- **Hardware Layer:** CPU, RAM, NVMe/SSD, NIC.
- **Linux Kernel:** Process Scheduler, Memory Manager, Virtual Filesystem (VFS), Network Stack, Device Drivers, Security.
- **Shell:** Command Interpreter (bash, zsh). Translates user commands to system calls.
- **User Space:** Applications (nginx, mysql, bash) and Libraries (glibc).

### Kernel Responsibilities
| Kernel Subsystem | Responsibility |
|:---|:---|
| **Process Scheduler** | Decides which process runs on which CPU core and for how long. |
| **Memory Manager** | Allocates RAM pages and manages virtual memory/swap. |
| **Virtual Filesystem (VFS)** | Provides a unified interface to different filesystem types. |
| **Network Stack** | Implements TCP/IP protocols and manages sockets. |
| **Device Drivers** | Interfaces with hardware devices. |
| **Security Framework** | Enforces access controls (DAC and SELinux). |

### Kernel Space vs User Space
- **Kernel Space:** A protected memory region where the kernel executes with full hardware access privileges.
- **User Space:** A restricted memory region where applications run without direct hardware access. 
- Applications must use **system calls** to request kernel services.

### System Calls (Syscalls)
System calls are the API gateway between user space and kernel space. When an application needs to interact with hardware, it invokes a system call.
- `open()` — Open a file descriptor.
- `read()` — Read data from a file descriptor.
- `write()` — Write data to a file descriptor.
- `fork()` — Create a new child process.

> [!NOTE]
> Deep coverage of Kernel Modules and their configuration has been moved to **Phase 05**, and detailed OOM (Out Of Memory) Killer tuning is covered in later advanced administration chapters. 

## 3. Essential Commands

| Command | Purpose | Example | Notes |
|:---|:---|:---|:---|
| `lsmod` | List loaded kernel modules | `lsmod` | Shows size and dependencies |
| `modinfo` | Display module metadata | `modinfo ext4` | Shows description and author |
| `cat /proc/cpuinfo` | View CPU details | `cat /proc/cpuinfo` | Kernel's view of processors |
| `cat /proc/meminfo` | View Memory details | `cat /proc/meminfo` | Look for `MemAvailable` |
| `dmesg` | View kernel ring buffer | `dmesg -T` | Crucial for hardware/driver errors |

## 4. Production Examples

### Kernel Module Issue in Cloud Environment
An AWS EC2 instance running RHEL 9 was unable to mount an NFS share. Investigation with `dmesg | grep nfs` revealed the NFS kernel module was not loaded. Resolution: `modprobe nfs` loaded the module, and adding `nfs` to `/etc/modules-load.d/nfs.conf` ensured it loads automatically on every boot.

### OOM Killer Terminating Database
A MySQL database server experienced sudden process termination. Investigation of `dmesg | grep -i oom` revealed the kernel's Out-of-Memory (OOM) Killer terminated the `mysqld` process because available memory dropped to zero. Resolution: Increased server RAM and correctly configured MySQL's `innodb_buffer_pool_size`.

## 5. Practical Labs

**Objective:** Inspect kernel messages for hardware and driver information.
**Task:** Run `dmesg -T | head -30` to see boot-time kernel messages, and `dmesg -T --level=err` to view only errors.
**Expected Result:** You will see the kernel detecting hardware and loading drivers. If there are errors, they will be highlighted.

**Objective:** Examine memory from the kernel's perspective.
**Task:** Run `cat /proc/meminfo | head -10`.
**Expected Result:** You will see memory statistics.
**Challenge:** What is the difference between `MemFree` and `MemAvailable`? (Hint: The page cache uses free RAM to speed up file access).

## 6. Summary + Cheat Sheet

- Linux architecture has four layers: Hardware → Kernel → Shell → User Space.
- The kernel manages processes, memory, filesystems, networking, and device drivers.
- User-space applications access kernel services through system calls (syscalls).
- `MemAvailable` is the true measure of available memory, not `MemFree`.
- `dmesg` is the first place to check for hardware and kernel-level issues.

## 7. Interview Questions

### Basic
1. **Q: What are the four layers of Linux architecture?**
   A: Hardware, Kernel, Shell, and User Space.

2. **Q: What is a system call?**
   A: A system call is the programmatic interface through which user-space applications request services from the Linux kernel, such as file operations (`open`, `read`, `write`), process management (`fork`, `exec`), and network operations (`socket`, `connect`).

### Intermediate
3. **Q: What is the difference between kernel space and user space?**
   A: Kernel space is a protected memory region where the kernel executes with full hardware access privileges. User space is a restricted memory region where applications run without direct hardware access. Applications communicate with the kernel through system calls.

4. **Q: What is the OOM Killer and when does it activate?**
   A: The OOM (Out of Memory) Killer is a kernel mechanism that activates when the system runs out of physical RAM and swap space. It selects and terminates the process with the highest OOM score (typically the largest memory consumer) to free memory and prevent a complete system freeze.

### Advanced
5. **Q: A production server shows 95% memory used but applications are running normally. Should you be concerned?**
   A: Not necessarily. Linux aggressively uses free RAM for page cache (caching file data in memory for faster access). The critical metric is `MemAvailable` from `/proc/meminfo`, not `MemFree`. If `MemAvailable` is healthy (e.g., 20%+ of total RAM), the system is performing optimally. The page cache is reclaimable on demand when applications need memory.

### Scenario-Based
6. **Q: `dmesg` shows repeated messages: "Out of memory: Killed process 1234 (mysqld)". What do you do?**
   A: (1) Immediately check if MySQL is running: `systemctl status mysqld`. (2) Review the OOM kill details in `dmesg` to identify memory consumption. (3) Check MySQL's `innodb_buffer_pool_size` configuration — it may be consuming more RAM than available. (4) As a short-term fix, restart MySQL and reduce buffer pool size. (5) As a long-term fix, add more RAM to the server or migrate to a larger instance type.

---
