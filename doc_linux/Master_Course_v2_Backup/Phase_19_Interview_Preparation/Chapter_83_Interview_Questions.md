# CHAPTER 83 — TOP 50 LINUX INTERVIEW QUESTIONS

---

## 1. Introduction

### Why This Topic Exists
The Linux interview is notoriously difficult. Unlike some IT fields where you can talk your way through high-level concepts, Linux interviews are deeply technical. Senior Engineers will ask you to write raw bash commands on a whiteboard, explain the internal architecture of the Linux Kernel, and troubleshoot broken systems entirely from memory. You cannot fake your way through a Linux interview.

### Why Linux Administrators Use It
Linux professionals use a structured Q&A format to drill themselves before interviews, ensuring that when the pressure is on, the exact command syntax or architectural concept comes to mind instantly.

### Why Companies Care About It
Companies use these questions as a brutal filter. If a candidate claims to have 5 years of Linux experience, but cannot explain the difference between a Hard Link and a Soft Link, the hiring manager immediately knows the candidate lied on their resume, and the interview is over in 5 minutes.

---

## 2. Learning Objectives

By the end of this chapter, you will be able to:
- Answer the most common technical screening questions with absolute confidence.
- Understand the deeper architectural "Why" behind the commands, which is what Senior Engineers are actually listening for.
- Navigate questions spanning Filesystems, Permissions, Networking, Processes, and Troubleshooting.

---

## 3. The Top 50 Questions

*(The questions are broken down by category. Do not just memorize the answer. Understand the underlying concept so you can adapt if the interviewer twists the scenario).*

### Category 1: Filesystem and Architecture

**1. What is the Linux Boot Process?**
A: BIOS/UEFI -> MBR/GPT -> GRUB (Bootloader) -> Kernel -> Init (Systemd) -> Runlevels (Targets).

**2. What is the difference between an absolute path and a relative path?**
A: An absolute path always starts from the absolute root directory (`/var/log/messages`). A relative path starts from the directory you are currently sitting in (`./messages` or `../log/messages`).

**3. What is an Inode?**
A: An Inode (Index Node) is a data structure on the hard drive that stores the metadata of a file (Ownership, Permissions, Size, Timestamps, and the physical disk block locations). It does NOT store the filename or the file contents.

**4. What happens if a server runs out of Inodes, but `df -h` shows the hard drive is only 50% full?**
A: The server will refuse to create any new files, throwing a "No space left on device" error. This usually happens when an application creates millions of tiny 1-byte files, consuming all the Inode addresses before filling up the physical disk space. (Use `df -i` to verify).

**5. What is the exact difference between a Hard Link and a Soft (Symbolic) Link?**
A: A Soft Link is just a shortcut pointing to a filename; if you delete the original file, the Soft Link breaks (dangling link). A Hard Link points directly to the underlying Inode on the hard drive; if you delete the original filename, the data remains perfectly intact and accessible via the Hard Link. (Hard links cannot span different filesystems).

**6. Explain the purpose of the `/proc` directory.**
A: `/proc` is a virtual filesystem (pseudo-filesystem) that does not exist on the hard drive. It exists entirely in RAM and provides a real-time window into the running Linux Kernel and active processes (e.g., `/proc/cpuinfo` or `/proc/1234/`).

**7. What is the difference between Swap space and Physical RAM?**
A: RAM is fast, volatile memory. If RAM fills up 100%, the Linux Kernel prevents a crash by moving the oldest, least-used data from RAM onto a dedicated partition on the slow hard drive. This hard drive partition is called Swap.

**8. You accidentally deleted a critical file. However, you know a background process is still actively writing to it. Can you recover the file, and how?**
A: Yes! Because Linux doesn't actually delete the physical data from the hard drive until all processes let go of the file descriptor. You can use `lsof | grep deleted` to find the Process ID (PID) and File Descriptor (FD) number, then navigate to `/proc/<PID>/fd/<FD>`, and simply copy the active data stream into a new file to save it.

**9. Explain the Linux FHS (Filesystem Hierarchy Standard). Where are variable logs stored? Where are static system binaries stored?**
A: Variable logs are stored in `/var/log`. Static, system-critical binary commands (like `ls` and `cp`) required for boot are stored in `/bin` or `/usr/bin`. Administrator commands are in `/sbin`.

**10. What is LVM, and why is it superior to standard partitioning?**
A: LVM (Logical Volume Management) separates physical hard drives from the filesystem. It allows an administrator to combine multiple physical hard drives (PVs) into a massive storage pool (VG), and carve out flexible partitions (LVs) that can be resized or spanned across physical disks seamlessly with zero downtime.

---

### Category 2: Permissions and Security

**11. What does the permission `chmod 755` mean?**
A: Read, Write, Execute for the Owner (7). Read and Execute for the Group (5). Read and Execute for Everyone Else (5).

**12. What is the SUID (Set Owner User ID) bit?**
A: It is a special permission (Numeric 4000, or `s` in the owner execute spot). When a standard user executes a file with the SUID bit set, the file temporarily executes with the full privileges of the file's owner (usually `root`). The `passwd` command requires this so normal users can write to `/etc/shadow`.

**13. What is the Sticky Bit?**
A: It is a special permission (Numeric 1000, or `t` in the world execute spot) usually applied to shared directories like `/tmp`. It ensures that only the creator of a file (or the root user) can delete or rename that file, preventing users from deleting each other's temporary files.

**14. What is a Umask?**
A: The default filter that subtracts permissions from newly created files and directories. A umask of `022` takes the default directory permission of `777`, subtracts `022`, resulting in a safe default directory permission of `755`.

**15. You set a folder to `chmod 777`. Your developer tries to create a file in it, but gets "Permission Denied." What security system is blocking them?**
A: SELinux (Security-Enhanced Linux) is likely operating in Enforcing mode. Even if standard standard DAC (Discretionary Access Control like `chmod`) allows the action, the SELinux MAC (Mandatory Access Control) policy will violently block the action if the context labels do not match.

**16. How do you view the SELinux context of a file, and how do you temporarily change SELinux to Permissive mode?**
A: Run `ls -Z` to view the context. Run `setenforce 0` to change it to Permissive mode (it will log the violation, but allow the action to proceed).

**17. What is the difference between `/etc/passwd` and `/etc/shadow`?**
A: `/etc/passwd` stores public user account information (Username, UID, GID, Home Directory, Default Shell). It is world-readable. `/etc/shadow` stores the highly sensitive, encrypted password hashes and password aging policies. It is strictly readable only by `root`.

**18. How do you lock a user account without deleting the user?**
A: Use `usermod -L <username>` (Locks the password in `/etc/shadow` by prepending a `!`), or change their default shell to `/sbin/nologin`.

**19. What is the principle of least privilege, and how does `sudo` enforce it?**
A: The principle states a user should only have the exact permissions necessary to do their job, and nothing more. `sudo` enforces this by allowing administrators to define explicit rules in `/etc/sudoers`, granting a user the ability to run exactly one specific command as root (e.g., restarting nginx), rather than giving them the full root password.

**20. A user's SSH key is rejected. You check the server, and their Public Key is correctly pasted into `~/.ssh/authorized_keys`. The permissions on the `.ssh` folder are `777`. Why is SSH failing?**
A: SSH fails precisely *because* the permissions are `777`. SSH is designed to be paranoid. If the `.ssh` folder or `authorized_keys` file has loose permissions that allow other users to read or write to them, SSH assumes the key has been compromised and silently drops the connection. The directory MUST be `700` and the file `600`.

---

### Category 3: Process Management

**21. What is a Daemon?**
A: A background process that runs continuously, detached from any controlling terminal, usually waiting to handle requests (e.g., `sshd`, `httpd`).

**22. Explain the difference between `SIGTERM` (15) and `SIGKILL` (9).**
A: `SIGTERM` is a polite request. It asks the application to gracefully save its data, close its open files, and shut down. `SIGKILL` is a violent assassination by the Linux Kernel. The application is instantly terminated without any chance to clean up, which can result in corrupted databases or orphaned lock files.

**23. You type a command and hit Enter. The command takes 3 hours to run, and your terminal is frozen. How do you safely move it to the background so you can keep working?**
A: Press `Ctrl + Z` to suspend the process. Then type `bg` to force the suspended process to resume running in the background. (You can later use `fg` to bring it back to the foreground).

**24. What is a Zombie Process, and how do you kill it?**
A: A Zombie is a dead process that has finished executing, but its parent process failed to read its exit status. It consumes zero CPU or RAM, but it occupies a slot in the Process Table. You *cannot* kill a zombie (it is already dead). You must find the Parent Process (PPID) and kill the parent.

**25. What is the difference between `top` and `htop`?**
A: Both are real-time process monitoring tools. `top` is installed natively on all Linux systems and provides raw data. `htop` is a third-party, visually appealing tool that allows you to scroll vertically and horizontally, view CPU cores individually, and interactively kill processes with function keys.

**26. What does "Load Average" mean (e.g., 1.50, 1.10, 0.90)?**
A: It represents the number of processes waiting in the queue to use the CPU over the last 1, 5, and 15 minutes. On a single-core CPU, a load of 1.0 means the CPU is at exactly 100% capacity. A load of 1.5 means the CPU is overwhelmed, and half a process is waiting in line. On a 4-core CPU, the system is perfectly healthy until the load hits 4.0.

**27. What is the OOM Killer?**
A: The Out Of Memory Killer. A kernel mechanism that activates when the server runs completely out of RAM. It calculates which process is the biggest offender (usually Java or MySQL) and assassinates it with `SIGKILL` to prevent the entire operating system from crashing.

**28. How do you find which process is listening on Port 8080?**
A: `ss -tulpn | grep 8080` (or `netstat -tulpn | grep 8080` on older systems).

**29. What is systemd, and what command do you use to manage it?**
A: Systemd is the modern Init system (PID 1) responsible for bootstrapping the Linux OS and managing all background services. You manage it using the `systemctl` command.

**30. You need a script to run automatically every Sunday at 3:00 AM. Write the cron expression.**
A: `0 3 * * 0 /path/to/script.sh` (Minute 0, Hour 3, Every Day of Month, Every Month, Sunday=0).

---

### Category 4: Networking

**31. What is the difference between TCP and UDP?**
A: TCP is connection-oriented; it establishes a 3-way handshake and guarantees that packets arrive perfectly in order (used for SSH, HTTP). UDP is connectionless; it aggressively fires packets at the destination without checking if they arrived (used for DNS, Video Streaming, NTP).

**32. Describe the DNS Resolution process when you type `google.com`.**
A: 1. Checks the local `/etc/hosts` file. 2. Checks the local DNS cache. 3. Queries the Recursive Resolver listed in `/etc/resolv.conf`. 4. The Resolver queries the Root (.) Servers. 5. Queries the TLD (.com) Servers. 6. Queries the Authoritative Name Server for Google to get the final IP address.

**33. What command is used to trace the physical network path (all the routers) a packet takes to reach a destination?**
A: `traceroute` (or `mtr` for a continuous, real-time diagnostic trace).

**34. What is a Default Gateway?**
A: A router (usually IP address `.1` on a subnet). If a Linux server wants to send a packet to an IP address that is not on its local subnet, it blindly forwards the packet to the Default Gateway, trusting the gateway knows how to reach the public internet. (Viewed with `ip route`).

**35. A developer says the database server (10.0.5.50) is down. You want to see if Port 3306 is blocked by a firewall. You cannot use `ping` because ping only tests ICMP, not specific ports. What command do you use?**
A: `nc -vz 10.0.5.50 3306` (Netcat) or `telnet 10.0.5.50 3306`. If it times out, a firewall is blocking the traffic.

**36. What is the difference between `firewalld` and `iptables`?**
A: `iptables` is the legacy tool used to manually write complex routing rules directly into the Linux kernel (Netfilter). `firewalld` is a modern, dynamic front-end wrapper that manages iptables for you using easy-to-understand "Zones" (like public, trusted, drop).

**37. Explain Network Address Translation (NAT).**
A: NAT allows a private, internal IP address (like `192.168.1.10`) to access the public internet. The edge router intercepts the packet, strips off the private IP, replaces it with the router's own Public IP, sends the packet to the internet, and then reverses the process when the response comes back.

**38. What is the purpose of the Loopback address (`127.0.0.1`)?**
A: It is a virtual network interface inside the Linux Kernel used for local testing. If a web server and a database are installed on the exact same physical machine, the web server can connect to `127.0.0.1:3306` to reach the database instantly, without the packets ever touching the physical network card.

**39. What does the `ip a` command do?**
A: It lists all network interfaces, their MAC addresses, their IP addresses, and their current state (UP or DOWN). It is the modern replacement for `ifconfig`.

**40. You run a web server. A hacker is launching a Denial of Service (DoS) attack from IP `203.0.113.5`. Write the command to instantly drop all traffic from that IP.**
A: `iptables -A INPUT -s 203.0.113.5 -j DROP` or using firewalld: `firewall-cmd --add-rich-rule='rule family="ipv4" source address="203.0.113.5" drop'`.

---

### Category 5: Troubleshooting and Commands

**41. The `ls` command is running very slowly, taking 10 seconds to list files in a directory. What diagnostic tool can you use to see exactly which system calls the `ls` command is hanging on?**
A: `strace ls`

**42. How do you find the exact text "ERROR" in a massive log file, but you also want to see the 3 lines of context *before* and *after* the error?**
A: `grep -C 3 "ERROR" /var/log/application.log`

**43. A log file is currently 500MB and growing rapidly. You want to watch the new lines being added to the bottom of the file in real-time. Command?**
A: `tail -f /var/log/messages`

**44. A junior admin accidentally typed `rm -rf /` and pressed Enter. They canceled it after 2 seconds. The server hasn't crashed yet, but some binary commands are missing. You want to see exactly which files were deleted. Which file contains the user's bash history?**
A: `~/.bash_history` (Though in this specific scenario, a true professional relies on system backups, not bash history, to assess filesystem damage).

**45. Explain how to gracefully search for a file named "config.yml" across the entire `/etc` directory hierarchy.**
A: `find /etc -type f -name "config.yml"`

**46. You write a script. You want to replace every instance of the word "apple" with the word "orange" inside a massive text file, without opening it in `vim`. Command?**
A: `sed -i 's/apple/orange/g' filename.txt`

**47. A developer tells you they need to upload a 50GB database dump to your server, but their SSH session keeps dropping because they have a terrible Wi-Fi connection. How can they safely upload a 50GB file over a terrible connection?**
A: They should use `rsync -P` (or `--partial --progress`). If the Wi-Fi drops at 40GB, `rsync` will cleanly resume the transfer at exactly 40GB when the connection is restored, preventing them from starting over.

**48. What is the difference between `curl` and `wget`?**
A: `wget` is primarily designed for downloading files to the hard drive recursively. `curl` is a Swiss Army Knife for sending API requests (GET, POST, PUT), manipulating HTTP headers, and printing the raw HTTP response to standard output.

**49. A server reboots violently. You suspect a hardware failure (a bad stick of RAM). Where is the most critical place to look for low-level motherboard and kernel errors?**
A: The Kernel Ring Buffer, accessed via the `dmesg` command.

**50. You edit `/etc/fstab` and add a new NFS network mount. What command should you run IMMEDIATELY to test the file without rebooting the server? (If you don't run this and reboot, a typo will cause a Kernel Panic).**
A: `mount -a`. This forces the Kernel to parse `/etc/fstab` and mount everything in it. If it fails, it will tell you instantly, allowing you to fix the typo before a disastrous reboot.

---

## 23. Chapter Summary and Quick Revision Notes

- Interviewers test **Concepts**, not just syntax. (e.g., Don't just know how to type `ln -s`, know *why* a soft link breaks).
- **Filesystems:** Inodes, Hard/Soft Links, LVM, /proc.
- **Security:** SUID, Sticky Bit, Umask, SELinux, /etc/shadow.
- **Processes:** Daemons, Signals (15 vs 9), Zombies, Load Average, OOM Killer.
- **Networking:** TCP/UDP, DNS, Default Gateway, NAT.
- **Troubleshooting:** strace, dmesg, tail -f, grep, find, sed.
- Confidence is key. If you don't know the exact syntax of an `awk` command during an interview, explain the *logic* of how you would solve the problem. Senior engineers respect logical problem-solving more than rote memorization.
