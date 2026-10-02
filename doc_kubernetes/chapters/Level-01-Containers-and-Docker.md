# Level 1 — Containers & Docker Engineering

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Beginner |
| **Theory Duration** | 8 hours |
| **Practical Duration** | 12 hours |
| **Prerequisites** | Level 0 — Linux & Networking Fundamentals |
| **Lab Required** | Yes — Linux machine with Docker Engine installed |
| **Interview Importance** | ⭐⭐⭐⭐⭐ (5/5) |
| **Industry Importance** | ⭐⭐⭐⭐⭐ (5/5) |
| **Certification Alignment** | CKAD (Container fundamentals), CKA (Runtime understanding) |

---

## Learning Objectives

After completing this module, the learner will be able to:

1. Explain the difference between virtual machines and containers.
2. Describe how Linux namespaces and cgroups enable containers.
3. Build optimized Docker images using multi-stage Dockerfiles.
4. Manage container lifecycle (create, start, stop, remove, inspect).
5. Configure container networking, volumes, and environment variables.
6. Write Docker Compose files for multi-container applications.
7. Implement container health checks, logging, and resource limits.
8. Understand OCI standards and container runtimes (`containerd`, `runc`).

---

## Prerequisites

- Comfortable with Linux CLI (Level 0).
- Understanding of processes, filesystem, and networking basics.

---

## 1. Virtualization vs Containerization

### 1.1 The Evolution of Application Deployment

```
Era 1: Bare Metal (2000s)         Era 2: Virtual Machines (2010s)       Era 3: Containers (2015+)
┌─────────────────────┐          ┌─────────────────────┐              ┌─────────────────────┐
│ App A │ App B │App C│          │ VM 1    │ VM 2      │              │Ctr 1│Ctr 2│Ctr 3│Ctr4│
│───────┴───────┴─────│          │┌───────┐│┌─────────┐│              │─────┴─────┴─────┴────│
│   Operating System  │          ││ App A ││| App B   ││              │   Container Runtime  │
│─────────────────────│          ││ Libs  │││ Libs    ││              │   (containerd)       │
│     Hardware        │          ││ Guest │││ Guest   ││              │─────────────────────│
└─────────────────────┘          ││  OS   │││  OS     ││              │   Host OS Kernel     │
                                 │└───────┘│└─────────┘│              │─────────────────────│
                                 │─────────────────────│              │     Hardware         │
                                 │    Hypervisor       │              └─────────────────────┘
                                 │─────────────────────│
                                 │    Host OS          │
                                 │─────────────────────│
                                 │    Hardware         │
                                 └─────────────────────┘

Problems:                         Improvement:                         Improvement:
- Resource waste                 - Better utilization                 - Near-instant startup
- No isolation                   - Isolation via hypervisor           - Minimal overhead
- Dependency conflicts           - Each VM has own OS                 - Shares host kernel
- Slow provisioning              - BUT: Heavy (GB per VM)             - Lightweight (MB per container)
                                 - Slow boot (minutes)                - Extreme density (100s per host)
```

### 1.2 Comparison Table: Virtual Machines vs Containers

| Feature | Virtual Machine | Container |
| :--- | :--- | :--- |
| **Isolation Level** | Hardware-level (hypervisor) | OS-level (kernel namespaces) |
| **Includes Guest OS?** | Yes (full OS per VM) | No (shares host kernel) |
| **Startup Time** | Minutes (boot entire OS) | Milliseconds to seconds |
| **Size** | Gigabytes (OS + app + libs) | Megabytes (app + libs only) |
| **Resource Overhead** | High (CPU, RAM for guest OS) | Minimal |
| **Density** | 10–20 VMs per server | 100–1000+ containers per server |
| **Portability** | VM images tied to hypervisor | OCI images run anywhere |
| **Hypervisor Examples** | VMware ESXi, KVM, Hyper-V, Xen | N/A |
| **Runtime Examples** | N/A | containerd, CRI-O, runc |
| **Use Case** | Running different OSes, strong isolation | Microservices, CI/CD, cloud-native apps |

**Key Insight:** Containers are **NOT** lightweight VMs. They are **isolated processes** running on the host kernel. There is no separate operating system inside a container.

---

## 2. Linux Kernel Primitives That Enable Containers

### 2.1 Namespaces — Process Isolation

**Simple Analogy:**
Namespaces are like one-way mirrors in an office. Each team (container) can see their own workspace but cannot see other teams. Each team believes they have the entire building to themselves.

**Technical Explanation:**
Linux namespaces partition kernel resources so that one set of processes sees one set of resources, while another set of processes sees a different set.

| Namespace | Isolates | Container Effect |
| :--- | :--- | :--- |
| **PID** | Process IDs | Container sees PID 1 as its init process; cannot see host processes |
| **NET** | Network interfaces, IPs, ports, routing tables | Container gets its own network stack, IP address, port space |
| **MNT** | Mount points, filesystem hierarchy | Container has its own filesystem root (from image layers) |
| **UTS** | Hostname, domain name | Container can have its own hostname |
| **IPC** | Inter-process communication (semaphores, message queues) | Containers cannot interfere with each other's IPC |
| **USER** | User and group IDs | UID 0 inside container can map to non-root on host |
| **CGROUP** | Cgroup root directory view | Container sees only its own cgroup hierarchy |

```bash
# Demonstrate: Viewing namespaces of a running container process
# After running a Docker container:
docker run -d --name test-ns nginx:1.25-alpine

# Find the container's PID on the host
docker inspect test-ns --format '{{.State.Pid}}'
# → Output: 12345

# View the namespaces of that process
ls -la /proc/12345/ns/
# → Output:
# lrwxrwxrwx 1 root root 0 Aug 18 10:00 cgroup -> 'cgroup:[4026532511]'
# lrwxrwxrwx 1 root root 0 Aug 18 10:00 ipc -> 'ipc:[4026532509]'
# lrwxrwxrwx 1 root root 0 Aug 18 10:00 mnt -> 'mnt:[4026532507]'
# lrwxrwxrwx 1 root root 0 Aug 18 10:00 net -> 'net:[4026532512]'
# lrwxrwxrwx 1 root root 0 Aug 18 10:00 pid -> 'pid:[4026532510]'
# lrwxrwxrwx 1 root root 0 Aug 18 10:00 uts -> 'uts:[4026532508]'

# Each namespace has a unique inode number — containers in different namespaces
# see different views of the kernel resources.

# Enter a container's namespace from the host
sudo nsenter -t 12345 -n ip addr show
# → Shows the container's network interfaces (not the host's)

docker rm -f test-ns
```

### 2.2 Control Groups (cgroups) — Resource Limiting

**Simple Analogy:**
Cgroups are like departmental budgets. Each department (container) gets a fixed budget for office supplies (CPU), floor space (memory), and bandwidth (I/O). If a department tries to exceed its budget, it gets throttled or cut off.

**Technical Explanation:**
Control Groups (cgroups) limit, account for, and isolate resource usage of process groups.

| cgroup Controller | Controls | Container Effect |
| :--- | :--- | :--- |
| **cpu** | CPU time allocation | `--cpus=2` limits container to 2 CPU cores |
| **cpuset** | CPU core pinning | Pins container to specific cores |
| **memory** | Memory usage limit | `--memory=512m` limits to 512MB; OOMKilled if exceeded |
| **blkio** | Block I/O bandwidth | Throttles disk read/write speed |
| **pids** | Maximum number of processes | Prevents fork bombs |
| **devices** | Access to device files | Controls GPU, disk access |

```bash
# View cgroup hierarchy (cgroups v2)
ls /sys/fs/cgroup/

# After running a container with limits:
docker run -d --name cgroup-demo --memory=256m --cpus=0.5 nginx:1.25-alpine

# View the container's cgroup memory limit
docker inspect cgroup-demo --format '{{.HostConfig.Memory}}'
# → Output: 268435456 (256MB in bytes)

# What happens when memory limit is exceeded?
# The Linux OOM (Out-Of-Memory) Killer terminates the process.
# In Kubernetes, this shows as Exit Code 137 (128 + SIGKILL signal 9).

docker rm -f cgroup-demo
```

### 2.3 Union File System (Overlay2) — Layered Filesystem

**Simple Analogy:**
Think of image layers like transparent sheets stacked on an overhead projector. Each sheet adds or modifies content. The bottom sheet is the base OS, the next adds libraries, the next adds your application. When you run the container, a writable sheet is placed on top — any changes you make only affect this top sheet.

```
┌──────────────────────────────────────────────┐
│  Writable Container Layer (Read-Write)       │ ← Changes saved here (ephemeral)
├──────────────────────────────────────────────┤
│  Layer 4: COPY app.jar /app/ (app code)      │ ← Read-only
├──────────────────────────────────────────────┤
│  Layer 3: RUN pip install -r requirements.txt│ ← Read-only
├──────────────────────────────────────────────┤
│  Layer 2: RUN apt-get install -y python3     │ ← Read-only
├──────────────────────────────────────────────┤
│  Layer 1: Base Image (ubuntu:22.04)          │ ← Read-only
└──────────────────────────────────────────────┘

Key concepts:
- Image layers are READ-ONLY and shared between containers
- Container layer is READ-WRITE (copy-on-write)
- When a container is deleted, only the writable layer is destroyed
- Image layers are cached — unchanged layers are not re-downloaded or re-built
```

---

## 3. Container Lifecycle & OCI Standards

### 3.1 Open Container Initiative (OCI)

The **OCI** defines industry standards for container formats and runtimes:

| OCI Specification | Purpose | Example |
| :--- | :--- | :--- |
| **OCI Image Spec** | Standard format for container images | Docker images, Podman images |
| **OCI Runtime Spec** | Standard API for container runtimes | `runc` (reference implementation) |
| **OCI Distribution Spec** | Standard API for image registries | Docker Hub, ECR, Harbor |

### 3.2 Container Runtime Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    Container Runtime Stack                      │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  High-Level Runtime (CRI-compliant daemon)               │  │
│  │  containerd  or  CRI-O                                   │  │
│  │  - Image management (pull, push, store)                  │  │
│  │  - Container lifecycle management                        │  │
│  │  - Exposes CRI (Container Runtime Interface) gRPC API    │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │ OCI Runtime Spec                    │
│  ┌────────────────────────▼─────────────────────────────────┐  │
│  │  Low-Level Runtime (OCI-compliant)                       │  │
│  │  runc                                                    │  │
│  │  - Creates Linux namespaces                              │  │
│  │  - Sets up cgroups                                       │  │
│  │  - Configures seccomp/AppArmor                          │  │
│  │  - Executes the container process                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  Kubernetes Integration:                                        │
│  kubelet ──(CRI gRPC)──► containerd ──(OCI)──► runc ──► container│
└────────────────────────────────────────────────────────────────┘
```

### 3.3 Container Lifecycle States

```
[ Image Pulled ] ──► [ Container Created ] ──► [ Container Started (Running) ]
                                                          │
                                                ┌─────────┴──────────┐
                                                ▼                    ▼
                                        [ Container Paused ]   [ Container Stopped ]
                                                │                    │
                                                ▼                    ▼
                                        [ Container Unpaused ]  [ Container Removed ]
```

---

## 4. Docker Installation

```bash
# Purpose: Install Docker Engine on Ubuntu 22.04
# Reference: https://docs.docker.com/engine/install/ubuntu/

# Step 1: Remove old versions
sudo apt-get remove docker docker-engine docker.io containerd runc 2>/dev/null

# Step 2: Install prerequisites
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# Step 3: Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Step 4: Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Step 5: Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Step 6: Add current user to docker group (avoid sudo for docker commands)
sudo usermod -aG docker $USER
newgrp docker    # Apply group change without logout

# Step 7: Verify installation
docker version
docker info
docker run hello-world

# Expected output for hello-world:
# Hello from Docker!
# This message shows that your installation appears to be working correctly.
```

---

## 5. Docker Images

### 5.1 Image Fundamentals

**Simple Analogy:**
A Docker image is like a **recipe** (Dockerfile) that produces a **meal kit** (image) with all ingredients pre-measured. When you open the kit and cook (run), you get a **prepared dish** (container). Multiple people can use the same meal kit to cook independent dishes simultaneously.

```bash
# Purpose: List local images
docker images
# → Expected output:
# REPOSITORY   TAG       IMAGE ID       CREATED       SIZE
# nginx        1.25      a8758716bb6a   2 weeks ago   187MB
# ubuntu       22.04     174c8c134b2a   3 weeks ago   77.9MB
# alpine       3.19      ace17d5d883e   4 weeks ago   7.73MB

# Purpose: Pull an image from Docker Hub
# Syntax: docker pull <repository>:<tag>
docker pull nginx:1.25-alpine
# → Downloads image layers, shows progress per layer

# Purpose: Inspect image details
docker inspect nginx:1.25-alpine

# Purpose: View image layer history
docker history nginx:1.25-alpine
# → Shows each layer, the command that created it, and its size

# Purpose: Remove an image
docker rmi nginx:1.25-alpine
# Common error: "image is in use by container" — remove container first

# Purpose: Remove all unused images
docker image prune -a
```

### 5.2 Image Naming Convention

```
registry.example.com / namespace / repository : tag    @ sha256:digest
│                      │           │            │        │
│                      │           │            │        └─ Immutable content hash
│                      │           │            └─ Version label (default: latest)
│                      │           └─ Image name
│                      └─ Organization / user
└─ Registry hostname (default: docker.io)

Examples:
docker.io/library/nginx:1.25              → Docker Hub official nginx
docker.io/mycompany/web-app:v2.1.0        → Custom app on Docker Hub
123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app:build-42  → AWS ECR
gcr.io/google-containers/pause:3.9        → Google Container Registry

WARNING: Never use :latest in production.
  - "latest" is not "the newest version" — it is just a default tag name.
  - It is mutable — someone can push a different image with the same tag.
  - Use specific version tags or SHA256 digests for reproducibility.
```

---

## 6. Dockerfile Deep Dive

### 6.1 Dockerfile Instruction Reference

```dockerfile
# ─── BASIC DOCKERFILE ANATOMY ───────────────────────────────────────────
# Every instruction creates a new image layer. Minimize layers for efficiency.

# FROM: Base image (REQUIRED as first instruction)
# Sets the starting filesystem and environment
FROM ubuntu:22.04

# LABEL: Metadata (maintainer, version, description)
LABEL maintainer="uday@example.com"
LABEL version="1.0"
LABEL description="Example application container"

# ENV: Set environment variables (available during build AND at runtime)
ENV APP_HOME=/app
ENV NODE_ENV=production

# ARG: Build-time variables (available only during build, NOT at runtime)
ARG APP_VERSION=1.0.0

# WORKDIR: Set working directory for subsequent instructions
# Creates the directory if it doesn't exist
WORKDIR /app

# RUN: Execute commands during build (each RUN creates a layer)
# Best practice: Chain commands with && and clean up in the same layer
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# COPY: Copy files from build context to image
# Syntax: COPY <src> <dest>
COPY package.json package-lock.json ./
COPY src/ ./src/

# ADD: Like COPY but can also extract archives and download URLs
# Prefer COPY unless you need extraction
ADD app.tar.gz /app/

# RUN: Install application dependencies
RUN npm ci --production

# EXPOSE: Document which ports the container listens on
# NOTE: This does NOT publish the port — it's documentation only
EXPOSE 8080

# USER: Switch to a non-root user (security best practice)
RUN groupadd -r appuser && useradd -r -g appuser -s /bin/false appuser
USER appuser

# HEALTHCHECK: Define container health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/healthz || exit 1

# ENTRYPOINT: Main executable (not easily overridden)
ENTRYPOINT ["node"]

# CMD: Default arguments to ENTRYPOINT (can be overridden at runtime)
CMD ["server.js"]
```

### 6.2 `ENTRYPOINT` vs `CMD`

| Scenario | Dockerfile | `docker run myimage` | `docker run myimage /bin/sh` |
| :--- | :--- | :--- | :--- |
| CMD only | `CMD ["python", "app.py"]` | Runs: `python app.py` | Runs: `/bin/sh` (CMD overridden) |
| ENTRYPOINT only | `ENTRYPOINT ["python"]` | Runs: `python` (no args) | Runs: `python /bin/sh` (appended) |
| Both | `ENTRYPOINT ["python"]` + `CMD ["app.py"]` | Runs: `python app.py` | Runs: `python /bin/sh` |

**Rule:** Use `ENTRYPOINT` for the main command, `CMD` for default arguments.

### 6.3 Multi-Stage Build (Production Best Practice)

**Problem:** Build tools (compilers, package managers) add hundreds of MBs to the final image but are not needed at runtime.

**Solution:** Multi-stage builds — use one stage for building, copy only the compiled output to a minimal runtime stage.

```dockerfile
# ─── Stage 1: Build (large image with build tools) ──────────────────
FROM node:20-alpine AS builder
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY src/ ./src/
COPY tsconfig.json ./
RUN npm run build     # Compiles TypeScript to JavaScript in /build/dist/

# ─── Stage 2: Production (minimal runtime image) ────────────────────
FROM node:20-alpine AS production

# Security: Run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy ONLY the compiled output and production dependencies
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/node_modules ./node_modules
COPY package.json ./

# Set ownership to non-root user
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
```

**Result:**
- Build stage image: ~450MB (includes TypeScript compiler, dev dependencies)
- Production image: ~120MB (only Node.js runtime + compiled JavaScript)

### 6.4 Dockerfile Best Practices

```dockerfile
# ✅ DO: Use specific base image tags
FROM node:20.11-alpine3.19

# ❌ DON'T: Use latest or vague tags
FROM node:latest
FROM node

# ✅ DO: Use .dockerignore to exclude unnecessary files
# .dockerignore contents:
# node_modules
# .git
# .env
# *.md
# Dockerfile
# docker-compose.yml

# ✅ DO: Combine RUN commands to reduce layers
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# ❌ DON'T: Create separate layers for each command
RUN apt-get update
RUN apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*

# ✅ DO: Copy dependency files first, then source code (layer caching)
COPY package.json package-lock.json ./
RUN npm ci
COPY src/ ./src/          # Source changes don't invalidate npm install layer

# ❌ DON'T: Copy everything at once (any file change re-runs npm install)
COPY . .
RUN npm ci

# ✅ DO: Run as non-root user
USER 10001

# ❌ DON'T: Run as root (security vulnerability)
# (no USER instruction = runs as root)

# ✅ DO: Use COPY instead of ADD (unless you need tar extraction)
COPY config.json /app/

# ✅ DO: Consider Distroless or scratch for the smallest, most secure images
FROM gcr.io/distroless/nodejs20-debian12
```

---

## 7. Docker Container Management

### 7.1 Container Lifecycle Commands

```bash
# ─── CREATE & RUN ───────────────────────────────────────────────────

# Purpose: Run a container (pull image if needed, create, and start)
# Syntax: docker run [options] <image> [command]

# Run interactively (attached terminal)
docker run -it ubuntu:22.04 /bin/bash
# → -i: Interactive (keep STDIN open)
# → -t: Allocate a pseudo-TTY

# Run in detached mode (background)
docker run -d --name my-nginx -p 8080:80 nginx:1.25-alpine
# → -d: Detach (run in background)
# → --name: Assign a name (otherwise Docker generates a random name)
# → -p 8080:80: Map host port 8080 to container port 80

# Run with environment variables
docker run -d --name my-app \
  -e DATABASE_HOST=db.example.com \
  -e DATABASE_PORT=5432 \
  -e APP_ENV=production \
  my-app:v1.0

# Run with resource limits
docker run -d --name limited-app \
  --memory=256m \
  --cpus=0.5 \
  --pids-limit=100 \
  my-app:v1.0

# Run with a specific restart policy
docker run -d --name resilient-app \
  --restart=unless-stopped \
  my-app:v1.0
# Restart policies: no | on-failure[:max-retries] | always | unless-stopped

# ─── INSPECT & MONITOR ─────────────────────────────────────────────

# Purpose: List running containers
docker ps
# → Expected output:
# CONTAINER ID   IMAGE              COMMAND                  STATUS       PORTS                  NAMES
# a1b2c3d4e5f6   nginx:1.25-alpine  "/docker-entrypoint.…"   Up 5 min    0.0.0.0:8080->80/tcp   my-nginx

# List all containers (including stopped)
docker ps -a

# Purpose: View detailed container information
docker inspect my-nginx

# View container resource usage (live)
docker stats
# → Expected output:
# CONTAINER ID   NAME       CPU %   MEM USAGE / LIMIT     MEM %   NET I/O        BLOCK I/O
# a1b2c3d4e5f6   my-nginx   0.02%   5.25MiB / 7.773GiB   0.07%   1.45kB / 0B    0B / 0B

# View container logs
docker logs my-nginx                    # All logs
docker logs -f my-nginx                 # Follow (stream) logs
docker logs --tail 50 my-nginx          # Last 50 lines
docker logs --since 10m my-nginx        # Logs from last 10 minutes
docker logs -t my-nginx                 # Include timestamps

# ─── INTERACT WITH RUNNING CONTAINER ───────────────────────────────

# Purpose: Execute a command inside a running container
docker exec -it my-nginx /bin/sh
# → Opens an interactive shell inside the container

# Execute a single command
docker exec my-nginx cat /etc/nginx/nginx.conf
docker exec my-nginx ls -la /usr/share/nginx/html/

# Copy files between host and container
docker cp my-nginx:/etc/nginx/nginx.conf ./nginx.conf    # Container → Host
docker cp ./index.html my-nginx:/usr/share/nginx/html/   # Host → Container

# ─── STOP & REMOVE ─────────────────────────────────────────────────

# Purpose: Stop a running container (sends SIGTERM, then SIGKILL after 10s)
docker stop my-nginx
docker stop -t 30 my-nginx    # Wait 30 seconds before SIGKILL

# Purpose: Start a stopped container
docker start my-nginx

# Purpose: Restart a container
docker restart my-nginx

# Purpose: Remove a stopped container
docker rm my-nginx

# Purpose: Force remove a running container (stop + remove)
docker rm -f my-nginx

# Purpose: Remove all stopped containers
docker container prune

# ─── SYSTEM CLEANUP ────────────────────────────────────────────────

# Remove all unused resources (images, containers, networks, volumes)
docker system prune -a --volumes
# WARNING: This removes everything not currently in use!

# Show disk usage by Docker
docker system df
```

---

## 8. Docker Networking

### 8.1 Network Drivers

```
┌───────────────────────────────────────────────────────────────────────────┐
│                        Docker Network Drivers                             │
│                                                                           │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                │
│  │   bridge     │     │    host     │     │    none      │                │
│  │  (default)   │     │             │     │              │                │
│  │             │     │             │     │              │                │
│  │ Container   │     │ Container   │     │ Container    │                │
│  │ has own IP  │     │ shares host │     │ no network   │                │
│  │ NAT to host │     │ network     │     │ (isolated)   │                │
│  └─────────────┘     └─────────────┘     └─────────────┘                │
│                                                                           │
│  Bridge: Default. Containers get IPs on docker0 subnet (172.17.0.0/16).  │
│          Port publishing (-p) needed for external access.                 │
│  Host:   Container uses host's network stack directly. No port mapping.  │
│          Best performance, but no network isolation.                       │
│  None:   Container has no network interfaces. Complete isolation.         │
└───────────────────────────────────────────────────────────────────────────┘
```

### 8.2 User-Defined Bridge Networks

```bash
# Purpose: Create a custom bridge network
docker network create my-app-network

# Run containers on the custom network
docker run -d --name frontend --network my-app-network nginx:1.25-alpine
docker run -d --name backend --network my-app-network node:20-alpine

# Key benefit: Containers on the same user-defined bridge can resolve
# each other by container NAME (built-in DNS).
docker exec frontend ping backend     # Works! DNS resolves "backend"
docker exec frontend curl http://backend:3000  # Reaches backend by name

# Default bridge does NOT provide DNS resolution between containers.
# Always use user-defined bridge networks in practice.

# List networks
docker network ls

# Inspect a network
docker network inspect my-app-network

# Remove a network
docker network rm my-app-network

# Cleanup
docker rm -f frontend backend
```

---

## 9. Docker Volumes & Persistent Storage

### 9.1 The Storage Problem

Containers are **ephemeral** — when a container is removed, all data written inside the container's writable layer is **lost forever**. Volumes solve this by providing persistent storage that outlives the container.

### 9.2 Storage Types

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           Docker Storage Types                               │
│                                                                              │
│  1. tmpfs mount          2. Bind Mount           3. Named Volume             │
│  ┌──────────────┐       ┌──────────────┐        ┌──────────────┐            │
│  │ Host Memory  │       │ Host Path    │        │ Docker-managed│            │
│  │ (RAM only)   │       │ /host/path   │        │ /var/lib/     │            │
│  │ Ephemeral    │       │              │        │ docker/volumes│            │
│  └──────┬───────┘       └──────┬───────┘        └──────┬───────┘            │
│         │                      │                       │                     │
│         ▼                      ▼                       ▼                     │
│  ┌──────────────────────────────────────────────────────────────┐            │
│  │                     Container Filesystem                     │            │
│  └──────────────────────────────────────────────────────────────┘            │
│                                                                              │
│  Use cases:                                                                  │
│  tmpfs: Sensitive secrets, session data (never written to disk)              │
│  Bind: Development (mount source code), config files                         │
│  Volume: Production data persistence (databases, uploads, logs)              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 9.3 Volume Commands

```bash
# ─── Named Volumes (Recommended for Production) ────────────────────

# Create a named volume
docker volume create app-data

# Run container with volume attached
docker run -d --name db \
  -v app-data:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=secret \
  postgres:16-alpine

# Data in /var/lib/postgresql/data persists even if container is removed
docker rm -f db
# Volume still exists:
docker volume ls
# → app-data

# Re-create container with same volume — data is preserved!
docker run -d --name db-new \
  -v app-data:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=secret \
  postgres:16-alpine

# ─── Bind Mounts (Recommended for Development) ─────────────────────

# Mount a host directory into the container
docker run -d --name dev-app \
  -v $(pwd)/src:/app/src \
  -v $(pwd)/config.json:/app/config.json:ro \
  -p 3000:3000 \
  node:20-alpine

# → $(pwd)/src is live-synced: edit on host → changes appear in container
# → :ro makes config.json read-only inside the container

# ─── Volume Management ─────────────────────────────────────────────

# List volumes
docker volume ls

# Inspect a volume
docker volume inspect app-data

# Remove a volume
docker volume rm app-data

# Remove all unused volumes
docker volume prune

# Cleanup
docker rm -f db-new
```

---

## 10. Docker Compose

### 10.1 Why Docker Compose?

When an application has multiple containers (frontend, backend, database, cache), managing them individually with `docker run` becomes tedious. Docker Compose lets you define all services in a single YAML file and manage them together.

### 10.2 `docker-compose.yml` Structure

```yaml
# docker-compose.yml
# Purpose: Define a multi-container application stack

version: "3.9"       # Compose file format version (optional in newer Docker)

services:
  # ─── Frontend Service ────────────────────────────────
  frontend:
    image: nginx:1.25-alpine
    container_name: frontend
    ports:
      - "80:80"                        # Host:Container port mapping
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro  # Bind mount config
    depends_on:
      - backend                        # Start backend before frontend
    networks:
      - app-network
    restart: unless-stopped

  # ─── Backend Service ─────────────────────────────────
  backend:
    build:
      context: ./backend               # Build from Dockerfile in ./backend/
      dockerfile: Dockerfile
    container_name: backend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_HOST=database         # Service name as hostname (DNS)
      - DATABASE_PORT=5432
      - DATABASE_NAME=myapp
      - DATABASE_USER=appuser
      - DATABASE_PASSWORD=${DB_PASSWORD}  # Read from .env file
    depends_on:
      database:
        condition: service_healthy     # Wait for database health check
    networks:
      - app-network
    restart: unless-stopped

  # ─── Database Service ────────────────────────────────
  database:
    image: postgres:16-alpine
    container_name: database
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=appuser
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - db-data:/var/lib/postgresql/data   # Named volume for persistence
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U appuser -d myapp"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    networks:
      - app-network
    restart: unless-stopped

# ─── Named Volumes ───────────────────────────────────────
volumes:
  db-data:
    driver: local

# ─── Networks ────────────────────────────────────────────
networks:
  app-network:
    driver: bridge
```

### 10.3 Docker Compose Commands

```bash
# Purpose: Start all services defined in docker-compose.yml
docker compose up -d
# → -d: Detach (run in background)
# → Builds images if needed, creates networks, volumes, and starts containers

# View running services
docker compose ps

# View logs for all services
docker compose logs -f

# View logs for a specific service
docker compose logs -f backend

# Stop all services
docker compose stop

# Stop and remove all services, networks (preserves volumes)
docker compose down

# Stop, remove everything INCLUDING volumes (DATA LOSS)
docker compose down --volumes

# Rebuild images
docker compose build

# Restart a specific service
docker compose restart backend

# Scale a service (run multiple instances)
docker compose up -d --scale backend=3

# Execute a command in a running service container
docker compose exec database psql -U appuser -d myapp
```

---

## 11. Container Health Checks

```dockerfile
# Dockerfile HEALTHCHECK instruction
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/healthz || exit 1

# Parameters:
# --interval=30s      Check every 30 seconds
# --timeout=5s        Fail if check takes longer than 5 seconds
# --start-period=10s  Wait 10 seconds before starting checks (app startup time)
# --retries=3         Mark unhealthy after 3 consecutive failures
```

```bash
# Health check status visible in docker ps
docker ps
# → CONTAINER ID  IMAGE     STATUS                     NAMES
# → a1b2c3d4e5   my-app    Up 5 min (healthy)         my-app
# → f6g7h8i9j0   my-db     Up 5 min (health: starting) my-db

# Inspect health check results
docker inspect --format='{{json .State.Health}}' my-app | jq
```

---

## 12. Container Resource Limits

```bash
# Purpose: Limit container CPU and memory usage

# Memory limit (container is killed if exceeded → OOMKilled)
docker run -d --memory=512m --memory-swap=512m nginx:1.25-alpine
# → --memory=512m: Hard memory limit (512 MB)
# → --memory-swap=512m: Total memory+swap limit (setting equal disables swap)

# CPU limit
docker run -d --cpus=1.5 nginx:1.25-alpine
# → Container can use at most 1.5 CPU cores

# CPU shares (relative weight, default 1024)
docker run -d --cpu-shares=512 nginx:1.25-alpine
# → Gets half the CPU time compared to default containers under contention

# PID limit (prevent fork bombs)
docker run -d --pids-limit=100 nginx:1.25-alpine

# Real-world usage: All production containers should have resource limits
# Kubernetes maps these to resource requests and limits in PodSpec
```

---

## 13. Docker Registry & Image Management

### 13.1 Docker Hub (Public Registry)

```bash
# Login to Docker Hub
docker login
# → Enter username and password

# Tag an image for pushing
docker tag my-app:v1.0 myusername/my-app:v1.0

# Push to Docker Hub
docker push myusername/my-app:v1.0

# Pull from Docker Hub
docker pull myusername/my-app:v1.0
```

### 13.2 AWS ECR (Private Registry)

```bash
# Authenticate Docker with ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.us-east-1.amazonaws.com

# Create ECR repository
aws ecr create-repository --repository-name my-app --region us-east-1

# Tag image for ECR
docker tag my-app:v1.0 123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app:v1.0

# Push to ECR
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app:v1.0

# Pull from ECR
docker pull 123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app:v1.0
```

---

## 14. Hands-On Labs

### Lab 1.1: Build and Run Your First Container

```bash
# Step 1: Create a project directory
mkdir -p ~/k8s-labs/level-1/hello-docker
cd ~/k8s-labs/level-1/hello-docker

# Step 2: Create a simple web application
cat > index.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Hello Docker</title></head>
<body>
  <h1>Hello from Docker Container!</h1>
  <p>Hostname: <!--#echo var="HOSTNAME"--></p>
</body>
</html>
EOF

# Step 3: Create a Dockerfile
cat > Dockerfile << 'EOF'
FROM nginx:1.25-alpine
COPY index.html /usr/share/nginx/html/index.html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1
EOF

# Step 4: Build the image
docker build -t hello-docker:v1 .

# Step 5: Run the container
docker run -d --name hello -p 8080:80 hello-docker:v1

# Step 6: Verify
curl http://localhost:8080
docker ps
docker logs hello
docker inspect hello --format '{{.State.Health.Status}}'

# Step 7: Clean up
docker rm -f hello
docker rmi hello-docker:v1
```

### Lab 1.2: Multi-Stage Build

```bash
# Step 1: Create a Go application
mkdir -p ~/k8s-labs/level-1/multi-stage
cd ~/k8s-labs/level-1/multi-stage

cat > main.go << 'EOF'
package main

import (
    "fmt"
    "net/http"
    "os"
)

func main() {
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        hostname, _ := os.Hostname()
        fmt.Fprintf(w, "Hello from Go container! Hostname: %s\n", hostname)
    })
    http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(200)
        fmt.Fprint(w, "OK")
    })
    fmt.Println("Server starting on :8080")
    http.ListenAndServe(":8080", nil)
}
EOF

cat > go.mod << 'EOF'
module hello-go
go 1.21
EOF

# Step 2: Create multi-stage Dockerfile
cat > Dockerfile << 'EOF'
# Stage 1: Build
FROM golang:1.21-alpine AS builder
WORKDIR /build
COPY go.mod main.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -o app .

# Stage 2: Runtime (scratch = empty base image, ~0 MB)
FROM scratch
COPY --from=builder /build/app /app
EXPOSE 8080
ENTRYPOINT ["/app"]
EOF

# Step 3: Build and compare sizes
docker build -t hello-go:v1 .
docker images hello-go
# → Notice: Image size is only ~6-7 MB (just the compiled binary!)

# Compare with single-stage:
# golang:1.21-alpine base = ~260 MB
# Our multi-stage build  = ~7 MB  (97% reduction)

# Step 4: Run
docker run -d --name go-app -p 8080:8080 hello-go:v1
curl http://localhost:8080

# Step 5: Cleanup
docker rm -f go-app
```

### Lab 1.3: Docker Compose Application Stack

```bash
# Step 1: Create project structure
mkdir -p ~/k8s-labs/level-1/compose-lab
cd ~/k8s-labs/level-1/compose-lab

# Step 2: Create .env file
cat > .env << 'EOF'
DB_PASSWORD=mysecretpassword
EOF

# Step 3: Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: "3.9"

services:
  web:
    image: nginx:1.25-alpine
    ports:
      - "80:80"
    depends_on:
      - api
    networks:
      - frontend
    restart: unless-stopped

  api:
    image: hashicorp/http-echo:0.2.3
    command: ["-text", "Hello from API container!"]
    ports:
      - "5678:5678"
    networks:
      - frontend
      - backend
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: testdb
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - backend
    restart: unless-stopped

volumes:
  pgdata:

networks:
  frontend:
  backend:
EOF

# Step 4: Start the stack
docker compose up -d

# Step 5: Verify
docker compose ps
curl http://localhost:5678
docker compose logs db

# Step 6: Explore networking
docker compose exec api ping -c 2 db    # API can reach DB (shared backend network)

# Step 7: Cleanup
docker compose down --volumes
```

---

## 15. Troubleshooting Guide

| Problem | Diagnostic Command | Common Cause | Resolution |
| :--- | :--- | :--- | :--- |
| Container exits immediately | `docker logs <name>` | Application crash, missing config | Check logs, fix app configuration |
| `COPY failed: file not found` | Check build context | File not in build context, `.dockerignore` | Verify file path, check `.dockerignore` |
| Image build slow | `docker history <image>` | No layer caching, wrong COPY order | Copy dependency files before source code |
| Port already in use | `ss -tlnp \| grep <port>` | Another container/process on same port | Stop conflicting process, use different port |
| Container OOMKilled | `docker inspect <name>` | Memory limit exceeded | Increase `--memory` or fix application leak |
| Cannot pull from ECR | `docker pull` error message | Expired token, IAM permissions | Re-authenticate with `aws ecr get-login-password` |
| Volume data lost | `docker volume ls` | Used anonymous volume, `docker rm -v` | Use named volumes, avoid `--volumes` flag on removal |
| DNS not working between containers | `docker exec <name> ping <other>` | Using default bridge network | Use user-defined bridge network |

---

## 16. Interview Questions

### Q1: What is the difference between a Docker image and a Docker container?
**Expected Answer:** An image is a read-only, immutable template consisting of layered filesystem snapshots and metadata. A container is a running instance of an image — it adds a writable layer on top of the image layers. Multiple containers can run from the same image, each with its own writable layer.

**Follow-up:** What happens to data written inside a container when the container is removed?
**Answer:** The data in the writable container layer is permanently deleted. To persist data, you must use Docker volumes or bind mounts.

---

### Q2: How do Linux namespaces and cgroups enable containers?
**Expected Answer:** Namespaces provide **isolation** — each container gets its own view of PIDs, network, filesystem, hostname, users, and IPC. Cgroups provide **resource limiting** — they cap how much CPU, memory, and I/O a container can use. Together, they create lightweight, isolated environments without needing a separate OS kernel.

**Interviewer's Expectation:** The candidate understands that containers are NOT lightweight VMs — they are isolated processes sharing the host kernel.

---

### Q3: Explain multi-stage Docker builds. Why are they important?
**Expected Answer:** Multi-stage builds use multiple `FROM` statements in a single Dockerfile. The first stage uses a full build environment (compilers, package managers) to build the application. The final stage uses a minimal runtime image and copies only the compiled artifact using `COPY --from=builder`. This dramatically reduces the production image size (often by 90%+) and removes build tools that could be security vulnerabilities.

---

### Q4: What is the difference between `ENTRYPOINT` and `CMD` in a Dockerfile?
**Expected Answer:** `ENTRYPOINT` sets the main executable and cannot be easily overridden at runtime (use `--entrypoint` flag). `CMD` provides default arguments to `ENTRYPOINT` and can be overridden by passing arguments to `docker run`. Best practice: Use `ENTRYPOINT` for the command and `CMD` for default arguments.

---

### Q5: Why should containers run as non-root?
**Expected Answer:** If a container runs as root and an attacker exploits a vulnerability to escape the container (container breakout), they gain root access on the host. Running as a non-root user (e.g., `USER 10001`) limits the blast radius of a security breach. This is enforced in Kubernetes via `runAsNonRoot: true` in SecurityContext and Pod Security Standards (Restricted profile).

---

## 17. Best Practices

1. **Always use specific image tags** — never `:latest` in production.
2. **Use multi-stage builds** — keep production images small and secure.
3. **Run as non-root** — add `USER` instruction in Dockerfile.
4. **Use `.dockerignore`** — exclude `.git`, `node_modules`, secrets from build context.
5. **Order Dockerfile instructions for caching** — dependencies before source code.
6. **Set resource limits** — always use `--memory` and `--cpus`.
7. **Use named volumes for data** — not bind mounts in production.
8. **Use user-defined bridge networks** — built-in DNS resolution between containers.
9. **Scan images for vulnerabilities** — `docker scout`, `trivy`, `grype`.
10. **Never store secrets in images** — use environment variables or Docker secrets.

---

## 18. Common Mistakes

1. Using `:latest` tag — leads to unpredictable deployments.
2. Running as root inside containers — security vulnerability.
3. Installing unnecessary packages — increases attack surface and image size.
4. Not using `.dockerignore` — accidentally copying secrets or `.git` into image.
5. Creating too many layers — each `RUN` statement is a layer; combine with `&&`.
6. Storing data in the container writable layer — data lost on `docker rm`.
7. Using `ADD` when `COPY` suffices — `ADD` has unexpected behaviors (URL download, tar extraction).
8. Forgetting `--no-install-recommends` with `apt-get` — installs unnecessary packages.

---

## 19. Summary

| Concept | Key Takeaway |
| :--- | :--- |
| **Containers** | Isolated processes using Linux namespaces and cgroups — NOT lightweight VMs |
| **Images** | Read-only layered filesystem templates; always use specific version tags |
| **Dockerfile** | Multi-stage builds, non-root users, optimized layer ordering |
| **Networking** | User-defined bridge networks provide DNS resolution between containers |
| **Volumes** | Named volumes persist data; bind mounts for development live-reloading |
| **Compose** | Declarative multi-container orchestration for single-host environments |
| **Runtime** | containerd (high-level) → runc (low-level) → Linux kernel primitives |

---

## 20. Practice Assignment

1. Write a Dockerfile for a Python Flask application with multi-stage build.
2. Create a Docker Compose file with: Nginx reverse proxy → Python API → Redis cache → PostgreSQL database.
3. Set up resource limits (256MB memory, 0.5 CPU) on all containers.
4. Implement health checks for every service in the Compose file.
5. Use a named volume for PostgreSQL data and verify data persists after `docker compose down && docker compose up`.
6. Build the same application image twice — measure the build time difference when only source code changes (demonstrating layer caching).
7. Compare image sizes: single-stage build vs multi-stage build.
