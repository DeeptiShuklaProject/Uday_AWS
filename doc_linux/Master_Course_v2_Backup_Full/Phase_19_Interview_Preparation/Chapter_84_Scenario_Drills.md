# CHAPTER 84 — SCENARIO-BASED INTERVIEW DRILLS

---

## 1. Introduction

### Why This Topic Exists
In modern interviews for Senior Systems Administrator, DevOps Engineer, or Cloud Architect roles, interviewers rarely ask "What does the `ls` command do?" Instead, they present complex, multi-layered architectural failures and say: "The website is down. What do you do?" These are called **Scenario-Based Questions**. They are designed to test your troubleshooting methodology, your grace under pressure, and your ability to isolate a problem across the OSI model.

### Why Linux Administrators Use It
Professionals use scenario drills to develop a systematic troubleshooting framework. When a production server crashes at 2:00 AM, panic is not an option. You must have a mental checklist that starts at Layer 1 (Hardware/Network) and moves up to Layer 7 (Application).

### Why Companies Care About It
Companies don't hire you for the days when everything works perfectly. They hire you for the worst day of the year. They use these scenario drills to ensure you have the analytical mindset required to restore a million-dollar application during a catastrophic outage.

---

## 2. Learning Objectives

By the end of this chapter, you will be able to:
- Adopt the "Bottom-Up" troubleshooting methodology (OSI Model).
- Navigate ambiguous failure scenarios.
- Articulate your thought process out loud during an interview.
- Troubleshoot high-load emergencies, storage exhaustion, and network isolation.

---

## 3. The Golden Rule of Scenario Interviews

**Think Out Loud.**
If the interviewer says, "The database is slow," and you stare silently at the wall for 60 seconds trying to guess the exact perfect answer, you have failed the interview. The interviewer wants to hear your logic.
Start broadly: *"First, I would verify the alert is accurate. Then, I would log into the server and check the raw CPU and Load Average using `top` to determine if we are CPU bound or I/O bound..."*

---

## 4. Scenario 1: The "Website is Down" Drill

**The Prompt:**
"You get an alert on your phone. Customers are complaining that `www.company.com` is completely unreachable. Walk me through exactly how you would troubleshoot this from start to finish."

**The Expected Answer (The Methodology):**

1. **Verify the scope:** Is the site down for everyone, or just the person complaining? I will run `curl -v http://www.company.com` from my own laptop to verify the outage and check the exact HTTP status code.
2. **DNS Resolution (Layer 7 Network):** Does the URL resolve to an IP? I will run `nslookup www.company.com` or `dig www.company.com`. If it doesn't resolve, our DNS servers are down or the domain expired.
3. **Network Connectivity (Layer 3/4):** If DNS works, I will `ping` the IP to see if the server is physically online. If it pings, I will use `nc -vz <IP> 80` to see if the web port is accepting connections. If `nc` times out, a firewall or AWS Security Group is blocking it.
4. **Server Investigation:** If the port is open but the site is throwing a 502 Bad Gateway or timing out, I will SSH into the server.
5. **Service Health:** I will run `systemctl status nginx`. Is it running? Did it crash?
6. **Log Analysis:** I will `tail -f /var/log/nginx/error.log`. (At this point in the interview, the interviewer might say, *'The log says Permission Denied.'*)
7. **Resolution:** If it says Permission Denied, I will check the directory ownership (`ls -ld /var/www`), standard permissions (`chmod`), and finally the SELinux context (`ls -Z`).

---

## 5. Scenario 2: The Silent 100% CPU

**The Prompt:**
"You receive a monitoring alert that a critical Linux application server has been sitting at 100% CPU for the last 30 minutes. You SSH into the server. You run `top`. The `top` output shows the CPU is at 100%, but oddly, none of the processes listed in `top` are using more than 1% CPU. What is going on, and how do you find the culprit?"

**The Expected Answer:**
This is a classic trap. `top` only shows user-space processes by default. If the CPU is at 100% but no process is claiming it, the CPU is likely stuck in **Wait I/O (wa)** or **Steal (st)** time.
1. I will look at the specific CPU metrics line in `top` (`%Cpu(s):  1.0 us,  2.0 sy,  0.0 ni,  0.0 id, 97.0 wa`).
2. If `wa` (Wait I/O) is at 97%, it means the CPU is completely idle, but it is blocked waiting for a broken, incredibly slow hard drive or NFS network mount to respond to a read request.
3. To confirm this, I will run `iostat -x 1` to look for a disk with 100% utilization and massive queue times, or I will use `iotop` to find the specific process that is thrashing the disk.
4. *(Bonus points for Cloud environments):* If it is a Virtual Machine in AWS, I will check the `st` (Steal) metric. If Steal time is 95%, it means the physical hypervisor host is completely overloaded by other "noisy neighbor" VMs, and Amazon is throttling our CPU. The only fix is to stop and start the instance to migrate it to healthy hardware.

---

## 6. Scenario 3: The Ghost Space

**The Prompt:**
"A developer pages you. The web server cannot upload images. They run `df -h /var` and it shows the partition is 100% full. You log in as root. You run `du -sh /var/*` to find the largest files. You delete a massive 50GB `nginx.log` file using `rm -f /var/log/nginx.log`. You run `df -h /var` again. It STILL says 100% full. The 50GB did not return. Where did the space go, and how do you fix it without rebooting?"

**The Expected Answer:**
This is a fundamental test of how the Linux VFS (Virtual File System) handles inodes and file descriptors.
1. Deleting a file with `rm` only removes the filename pointer from the directory. If a running process (like Nginx) still holds an open File Descriptor pointing to that inode, the Linux Kernel will NOT release the physical data blocks on the hard drive.
2. The space is still consumed by the "ghost" file held in memory by Nginx.
3. I will run the command `lsof +L1` (or `lsof | grep deleted`) to list all files that have been deleted but are still held open by a process.
4. It will show Nginx holding the deleted log file. To release the 50GB of space instantly, I will reload or restart the Nginx process (`systemctl reload nginx`), which forces it to close the old file descriptor and release the blocks back to the filesystem.
5. *(Best Practice Note):* I would also explain that to prevent this in the future, we should use `logrotate` with the `copytruncate` directive, or truncate the file directly (`> /var/log/nginx.log`) rather than using `rm`.

---

## 7. Scenario 4: The Read-Only Outage

**The Prompt:**
"At 9:00 AM, every single database query on the primary PostgreSQL server starts failing. You SSH into the machine. You try to create a simple text file: `touch /tmp/test.txt`. The terminal throws an error: `Read-only file system`. The hard drive has locked itself. What causes this, and how do you recover?"

**The Expected Answer:**
1. A Linux kernel will forcefully remount a filesystem as "Read-Only" if it detects catastrophic data corruption or physical hardware I/O errors. It does this to prevent the OS from shredding its own data permanently.
2. I will immediately check the Kernel Ring Buffer using `dmesg -T | grep -i "error\|EXT4\|XFS"`. This will likely reveal low-level SCSI errors, confirming a dying physical disk or a severed iSCSI SAN connection.
3. I will check `/var/log/messages` (if it was written before the lock).
4. Because the filesystem is locked, I cannot fix it while it is mounted. If this is a physical server with a dying RAID array, I need hardware replacement.
5. If the hardware is healthy, but the filesystem metadata is just corrupted, I must reboot the server, drop into Emergency/Rescue mode (or boot from a Live CD), ensuring the drive remains UNMOUNTED, and run an aggressive filesystem check: `fsck -y /dev/sda1`.
6. Once `fsck` repairs the corrupted inodes, I can reboot the server normally.

---

## 8. Scenario 5: The SSH Lockout

**The Prompt:**
"You inherited a production AWS EC2 server. You apply some security patches and update the firewall rules. You type `systemctl restart sshd`. Suddenly, your terminal session freezes and drops. You try to reconnect: `ssh admin@10.0.1.50`. It times out immediately. You are completely locked out of the server. Walk me through your thought process to regain access."

**The Expected Answer:**
1. **Analyze the Mistake:** Because it timed out instantly (rather than rejecting my password), the issue is at the network layer. When I applied the firewall updates, I likely applied a rule that inadvertently dropped Port 22 (SSH), or I messed up the AWS Security Group.
2. **Accessing the Console:** Because SSH is dead, I cannot fix the server via the network. I must use "Out-of-Band" management. In AWS, this means I will log into the AWS Web Console, navigate to the EC2 instance, and use the **AWS Systems Manager (SSM) Session Manager**, or the **EC2 Serial Console** feature to gain a root terminal directly through the hypervisor, bypassing the EC2 firewall entirely.
3. **The Fix:** Once inside the serial console, I will run `iptables -L -n` or `firewall-cmd --list-all` to identify the blocking rule. I will flush the bad rule, explicitly allow Port 22, and test the SSH connection from my laptop again.
4. *(Physical Server Alternative):* If this was a physical server in a data center, I would log into the Dell iDRAC or HP iLO dedicated management interface to get a virtual KVM console screen to fix the firewall.

---

## 9. Scenario 6: The Fork Bomb (Advanced)

**The Prompt:**
"A rogue script is executed on a shared development server. Suddenly, the server grinds to an absolute halt. You manage to run `uptime` and the Load Average is 9,500. The server is completely unresponsive to new SSH connections. You have one existing SSH session open, but when you try to type `ps aux` or `ls`, the terminal says `bash: fork: Resource temporarily unavailable`. You cannot run any commands. How do you stop this without a hard reboot?"

**The Expected Answer:**
1. **Identify the Attack:** The error `fork: Resource temporarily unavailable` means the server has hit its `ulimit` for the maximum number of processes (PID exhaustion). This is a classic "Fork Bomb" attack, where a script infinitely duplicates itself until the process table is 100% full.
2. **Why commands fail:** I cannot run `ps`, `kill`, or `ls` because executing those external binary files requires the Bash shell to execute a `fork()` system call to spawn a child process. Because the process table is full, the kernel rejects the `fork()`.
3. **The Solution (Built-ins):** I MUST use Bash "Built-in" commands. Built-ins execute entirely within the memory space of the currently running Bash shell and do not require a `fork()`.
4. I will use the built-in `exec` command to replace my current shell with a kill command. Specifically, I will suspend the execution of the fork bomb using a specific signal.
5. If I can't spawn `kill`, I can attempt a Bash loop: `while true; do killall -STOP rogue_script; done`. (Note: Stopping them is better than killing them initially, because killing them instantly frees up a PID, which the remaining fork bombs will immediately steal to replicate again).
6. *(The Real-World Admin Answer):* If a server is compromised this badly and the Load is 9,500, spending 30 minutes trying to be a hero is a waste of company money. I will forcefully reboot the server (or send a SysRq magic key sequence to the kernel if physical) to clear the RAM, and then implement strict `ulimits` in `/etc/security/limits.conf` (e.g., `* hard nproc 1024`) to permanently prevent a single user from ever spawning enough processes to crash the server again.

---

## 10. Mini Project

The Mock Interview Drill.
1. Find a friend, a mentor, or use an AI chatbot.
2. Give them the scenarios above. Ask them to act as the interviewer.
3. DO NOT look at the answers.
4. Speak your troubleshooting steps *out loud*. Notice how often you say "um" or how quickly you jump to a conclusion without verifying the logs first. Practice remaining calm and explaining your diagnostic path.

---

## 23. Chapter Summary and Quick Revision Notes

- **The Golden Rule:** Think out loud. Explain *why* you are running a command.
- **Top-Down / Bottom-Up:** Use the OSI model. Check Physical -> Network -> Port -> App -> Logs.
- **Ghost Space:** Deleting a file that is actively open by a process does not free disk space (`lsof | grep deleted`).
- **100% CPU (Wait I/O):** If `top` shows 100% CPU but no processes using it, check `wa` (Wait I/O) for a dead hard drive.
- **Read-Only FS:** The Kernel locks the drive to prevent data corruption. Check `dmesg` and run `fsck` offline.
- **Resource Exhaustion:** Use `ulimit` to prevent Fork Bombs. If a server is too far gone, a reboot and policy fix is the most professional enterprise solution.

---

## 24. Cheat Sheet: Interview Phrases

When stuck, use these phrases to show seniority:
- *"Before making any changes, I would verify if there are any recent commits in our Configuration Management (Ansible) that might have altered this server."*
- *"I would check `/var/log/messages` and `dmesg` to ensure we aren't chasing an application bug when it's actually a hardware failure."*
- *"To minimize downtime, I would failover the VIP to the backup node using Keepalived while I investigate this broken primary node offline."*
