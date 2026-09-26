# CHAPTER 04 — LINUX BOOT PROCESS: FROM POWER ON TO LOGIN

## 1. Introduction

When you press the power button on a Linux server, a precise six-stage sequence executes in under 30 seconds to bring the system from a powered-off state to a fully operational multi-user environment. Understanding this boot sequence is critical for diagnosing boot failures, recovering unbootable servers, configuring boot parameters, and managing system run levels.

In production environments, servers that fail to boot represent critical outages. An engineer who understands the boot process can identify whether a failure occurred at the firmware stage, the bootloader (GRUB2), the kernel, or the init system (systemd). This knowledge enables precise troubleshooting and recovery without waiting for vendor support. A payment processing server that fails to boot after a kernel update during a maintenance window can cost the business heavily. Engineers who can quickly diagnose and recover from boot failures reduce Mean Time to Recovery (MTTR).

Think of the Linux boot process like waking up and getting ready for work in the morning:
1. **Stage 1 — BIOS/UEFI:** Your alarm clock rings. It performs a quick self-check (POST).
2. **Stage 2 — MBR/GPT:** You find the instructions for today's routine.
3. **Stage 3 — GRUB2:** Your morning planner asks which outfit you want to wear today (Which kernel version do you want to boot?).
4. **Stage 4 — Kernel Loading:** You put on your clothes. The kernel takes control of all your body functions (hardware).
5. **Stage 5 — Initramfs:** You grab a temporary backpack containing just enough tools to get out the door — a minimal root filesystem.
6. **Stage 6 — systemd:** Your personal assistant starts all your daily tasks in the correct order (network, ssh, web server) and announces "Ready for work!" (login prompt).

## 2. Boot Process Stages

### The Six Stages of Linux Boot Process

```text
Firmware
   ↓
Bootloader
   ↓
Kernel
   ↓
initramfs
   ↓
systemd
   ↓
Services / Login
```

**Stage 1 — Firmware (BIOS / UEFI):**
- Hardware initialisation. Performs POST (Power-On Self-Test) checking CPU, RAM, and peripheral hardware. Searches for boot devices.

**Stage 2 — Bootloader (MBR / GPT):**
- Locates the start of the boot code. MBR (Master Boot Record) or GPT (GUID Partition Table) contains the instructions to load the main bootloader.

**Stage 3 — GRUB2 (Grand Unified Bootloader v2):**
- Configuration file: `/etc/default/grub`. Displays the boot menu with available kernel versions.
- Loads the selected kernel into memory and passes boot parameters.

**Stage 4 — Linux Kernel:**
- Decompresses into RAM, initialises core subsystems (memory, CPU scheduler).
- Mounts the initramfs image.

**Stage 5 — Initramfs (Initial RAM Filesystem):**
- Contains essential drivers (storage, LVM, RAID) needed to find and mount the real root (`/`) partition. Control is passed to `/sbin/init` (systemd).

**Stage 6 — systemd (PID 1) and Services:**
- The first user-space process (PID 1). Starts services in parallel based on dependency chains until the system reaches its target state.

### systemd Targets

| systemd Target | Legacy Runlevel | Description |
|:---|:---|:---|
| `rescue.target` | 1 / S | Single-user rescue mode (root shell, minimal services) |
| `multi-user.target` | 3 | Multi-user with networking (CLI — **Production Standard**) |
| `graphical.target` | 5 | Multi-user with networking and GUI desktop |
| `emergency.target` | N/A | Minimal emergency shell (root FS mounted read-only) |

> [!NOTE]
> Detailed recovery procedures such as Root Password Recovery via GRUB2 are covered in the advanced Troubleshooting and Recovery chapters.

## 3. Essential Commands

| Command | Purpose | Example | Notes |
|:---|:---|:---|:---|
| `systemctl get-default` | Check current default boot target | `systemctl get-default` | Returns multi-user.target or graphical.target |
| `systemctl set-default` | Set default boot target | `systemctl set-default multi-user.target` | Sets the server to boot without GUI |
| `systemctl isolate` | Switch to target immediately | `systemctl isolate rescue.target` | Use cautiously in production |
| `journalctl -b` | View current boot log | `journalctl -b -p err` | Excellent for troubleshooting boot failures |
| `systemd-analyze blame` | Boot time analysis | `systemd-analyze blame` | Shows slowest services |

## 4. Production Examples

### Boot Failure After Kernel Update
**Scenario:** After a `dnf update` that included a kernel upgrade, a RHEL 9 server fails to boot with a kernel panic.
**Recovery:** The administrator reboots the server, accesses the server console via IPMI/iLO, interrupts GRUB2 auto-boot, and selects the previous working kernel version from the GRUB2 menu to bring the server back online immediately. 

### Boot Time Optimization
**Scenario:** A heavily loaded application server takes over 3 minutes to boot, delaying auto-scaling group deployment.
**Action:** The engineer runs `systemd-analyze blame` and discovers that `NetworkManager-wait-online.service` is timing out, adding 60 seconds to the boot process. Adjusting the network configuration reduces boot time to 45 seconds.

## 5. Practical Labs

**Objective:** Understand system boot configuration and timing.
**Task 1:** Check your current default boot target using `systemctl get-default`.
**Expected Result:** You will see either `multi-user.target` or `graphical.target`.

**Task 2:** Analyse your boot time by running `systemd-analyze` and `systemd-analyze blame | head -10`.
**Expected Result:** You will see how long firmware, loader, kernel, and userspace took to load, and which individual services were the slowest.

## 6. Summary + Cheat Sheet

- Six boot stages: Firmware → Bootloader → Kernel → initramfs → systemd → Services.
- GRUB2 is the modern bootloader that passes parameters to the kernel.
- `initramfs` acts as a temporary root to load critical drivers before pivoting to the real root disk.
- `systemd` uses targets instead of legacy runlevels (`multi-user.target` is the standard server CLI).
- Use `journalctl -b` and `systemd-analyze blame` to troubleshoot and optimise boot sequences.

## 7. Interview Questions

### Basic
1. **Q: What are the six stages of the Linux boot process?**
   A: (1) BIOS/UEFI — hardware POST. (2) MBR/GPT — locates bootloader. (3) GRUB2 — selects and loads kernel. (4) Kernel — initialises hardware and mounts initramfs. (5) Initramfs — loads drivers, finds real root filesystem. (6) systemd — starts services and reaches default target.

### Intermediate
2. **Q: What is the difference between rescue mode and emergency mode?**
   A: Rescue mode (`rescue.target`) mounts all filesystems, starts basic services, and provides a root shell — useful for general troubleshooting. Emergency mode (`emergency.target`) provides a minimal root shell with the root filesystem mounted read-only — used when rescue mode itself fails (e.g., corrupt `/etc/fstab`).

3. **Q: How do you change the default boot target from graphical to command line?**
   A: `sudo systemctl set-default multi-user.target`

### Advanced
4. **Q: A server fails to boot after a kernel update. How do you recover?**
   A: (1) Reboot and press arrow keys to interrupt GRUB2 auto-boot. (2) Select the previous working kernel version from the GRUB2 menu. (3) Once booted, investigate the new kernel's compatibility. (4) If the new kernel is faulty, remove it: `sudo dnf remove kernel-5.14.0-xxx`. (5) Regenerate GRUB2: `sudo grub2-mkconfig -o /boot/grub2/grub.cfg`.

### Scenario-Based
5. **Q: A production server drops to emergency mode after rebooting. The screen shows "Failed to mount /data". What do you do?**
   A: (1) Enter root password at the emergency shell prompt. (2) Check `/etc/fstab` for the `/data` entry — likely a bad UUID or missing disk. (3) Comment out or fix the problematic line. (4) Run `systemctl daemon-reload`. (5) Test with `mount -a`. (6) Exit and `reboot`. (7) Investigate why the disk was missing (hardware failure, cloud volume detachment).

---
