<!-- TODO: Rewrite and humanize content from 10-docker\module-32-docker-fundamentals.md, 10-docker\module-33-python-docker.md -->

# Module 32 — Docker Fundamentals

## 1. Chapter Introduction
Before we automate Docker with Python, we need to understand Docker itself. In this module, we will cover the fundamentals of containerization—what Docker is, how it differs from virtual machines, the anatomy of a Dockerfile, and the essential Docker commands every DevOps engineer must know. This foundational knowledge is required before we use the Docker SDK in the next module.

## 2. What You Will Learn
- What containers are and how they differ from virtual machines.
- The Docker architecture (daemon, images, containers, registry).
- How to write a Dockerfile for Python applications.
- Essential Docker commands (build, run, stop, logs, exec).
- Docker networking and volume basics.

## 3. Key Concepts

| Concept | Description |
|---|---|
| **Image** | A read-only template with the application and its dependencies |
| **Container** | A running instance of an image |
| **Dockerfile** | Instructions to build an image |
| **Registry** | A storage location for images (Docker Hub, ECR, ACR, GCR) |
| **Volume** | Persistent storage that survives container restarts |
| **Network** | Isolated communication channel between containers |

## 4. DevOps Example: Dockerfile for a Python DevOps Script
```dockerfile
# Use a minimal Python base image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Copy requirements first (Docker caching optimization)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Set a non-root user for security
RUN useradd --create-home appuser
USER appuser

# Define the default command
CMD ["python", "health_checker.py"]
```

## 5. Docker vs Virtual Machines

| Feature | Docker Container | Virtual Machine |
|---|---|---|
| Boot time | Seconds | Minutes |
| Size | MBs | GBs |
| Isolation | Process-level | Hardware-level |
| OS | Shares host kernel | Full guest OS |
| Performance | Near-native | Overhead from hypervisor |
| Use case | Microservices, CI/CD | Legacy apps, full isolation |

## 6. Quick Revision Notes
- `docker build -t myapp:v1 .` — Build an image
- `docker run -d --name web myapp:v1` — Run a container
- `docker ps` — List running containers
- `docker logs web` — View container logs
- `docker exec -it web bash` — Open shell inside container
- `docker stop web && docker rm web` — Stop and remove
- Always use slim/alpine base images for smaller images
- Never run containers as root in production


---

# Module 33 — Python + Docker

## 1. Chapter Introduction
Welcome to Part VI. Throughout this book, we have discussed the DevOps nightmare: *"It works on my machine."* In Module 3, we solved this partially using `venv` and `requirements.txt`. But what if the production server has a different operating system? What if it's missing a required C++ library that Python needs? Docker is the ultimate solution. Docker allows you to package your Python script, its dependencies, and a complete mini-Linux operating system into a single, standardized box. In this module, we will "containerize" a Python application.

## 2. What You Will Learn
- What Docker is and how it differs from Virtual Machines.
- The anatomy of a `Dockerfile`.
- How to package a Python script into a Docker Image.
- Best practices for minimizing Image size (Alpine vs Slim).
- How to run the container and pass Environment Variables to it.

## 3. Why This Topic Matters in DevOps
Modern cloud architecture does not deploy raw Python code to servers. We deploy Docker containers to Kubernetes or AWS ECS. If you write a deployment script or a web API, you must know how to containerize it. A Docker container guarantees that your script will run absolutely identically on your MacBook, on a Jenkins CI/CD runner, and on an AWS production server.

## 4. Concept Explained in Simple Language
### What is a Docker Container?
A container is a shipping container for software. 
Before shipping containers were invented, loading a boat meant putting loose barrels, crates, and sacks into the cargo hold. It was chaos. Then, the standard steel shipping container was invented. Every truck, train, and boat in the world is designed to hold that exact same steel box, regardless of what is inside it.
Docker does this for code. You put your Python script inside a standard digital box (a Container). Any server in the world (AWS, Azure, Google) can run that box without knowing or caring that it contains Python.

### Image vs. Container
- **Docker Image:** The blueprint. The recipe for the container. It is a static, read-only file.
- **Docker Container:** The actual, running instance of the blueprint. You can launch 10 containers from 1 Image.

## 5. Real-World Analogy
- **Dockerfile:** The blueprint for building a food truck. (Instructions)
- **Docker Image:** The fully built food truck, parked in a garage, engines off. (Read-only template)
- **Docker Container:** The food truck driving around the city, serving food. (The running process)

## 6. Basic Example: The Python Script
Before we can use Docker, we need a simple Python script to put inside it. Let's imagine a script that pulls a target URL from an environment variable and checks if it's online.

**File: `monitor.py`**
```python
import os
import requests
import time

target = os.environ.get("TARGET_URL", "https://google.com")

while True:
    try:
        response = requests.get(target, timeout=5)
        print(f"[{target}] Status: {response.status_code}")
    except Exception as e:
        print(f"[{target}] FAILED: {e}")
        
    time.sleep(10) # Check every 10 seconds
```
**File: `requirements.txt`**
```text
requests==2.31.0
```

## 7. Step-by-Step Example: The Dockerfile
To put this script into a container, we create a file named exactly `Dockerfile` (no extension) in the same directory.

**File: `Dockerfile`**
```dockerfile
# 1. Start from an existing blueprint: A minimal Python 3.10 Linux OS
FROM python:3.10-slim

# 2. Tell Docker to work inside this directory inside the container
WORKDIR /app

# 3. Copy our requirements file into the container
COPY requirements.txt .

# 4. Install the Python libraries inside the container
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy the actual script into the container
COPY monitor.py .

# 6. What command should the container run when it starts?
CMD ["python", "monitor.py"]
```

## 8. DevOps Example: Building and Running
Now we use the Docker CLI to build the Image and run the Container.

**1. Build the Image (Do this on your laptop or in a CI/CD pipeline)**
```bash
# -t gives it a name (tag). The '.' means "look in the current directory for the Dockerfile"
docker build -t my-python-monitor .
```

**2. Run the Container**
```bash
# We run the image. 
# -e passes an Environment Variable from the host machine directly into the container!
docker run -e TARGET_URL="https://github.com" my-python-monitor
```

**Output:**
```text
[https://github.com] Status: 200
[https://github.com] Status: 200
```

## 9. Cloud Example: Pushing to a Registry
Once the image is built, it lives on your laptop. To get it to the cloud, you push the image to a Docker Registry (like DockerHub, AWS ECR, or GitHub Container Registry), just like pushing code to Git.

```bash
docker tag my-python-monitor aws_account_id.dkr.ecr.us-east-1.amazonaws.com/my-monitor:v1
docker push aws_account_id.dkr.ecr.us-east-1.amazonaws.com/my-monitor:v1
```
Now, an AWS EC2 instance can simply `docker pull` that image and run it perfectly.

## 10. Production Example: Optimizing Image Size
If you use `FROM python:3.10`, the resulting image will be over 900MB because it contains a full Debian Linux OS. In production, we use "slim" or "alpine" variants.

- `python:3.10-slim`: Removes unnecessary Linux packages. (~120MB)
- `python:3.10-alpine`: Uses a completely different, microscopic Linux distribution called Alpine. (~50MB). *Warning: Alpine uses a different C-compiler (musl instead of glibc), which can cause complex Python libraries like `numpy` or `pandas` to fail during installation.*

**Rule of thumb:** Start with `-slim`. It is the safest balance between small size and maximum compatibility.

## 11. Common Mistakes
- **Putting secrets in the Dockerfile:** NEVER write `ENV API_TOKEN=12345` inside a Dockerfile. Anyone who downloads the image can read the secrets in plaintext. Pass secrets using `docker run -e` at runtime (Module 13).
- **Copying everything:** `COPY . .` will copy your `.env` file, your `.git` folder, and your local `venv` into the container. This makes the image massive and insecure. Always use a `.dockerignore` file.

## 12. Troubleshooting
**Error:** `ModuleNotFoundError: No module named 'requests'` when running the container.
**Fix:** You either forgot to put `requests` in your `requirements.txt`, or you put `COPY monitor.py .` *before* the `RUN pip install` step and forgot to copy the requirements file entirely. Read the Dockerfile top-to-bottom carefully.

## 13. Security Considerations
By default, Docker runs your Python script as the `root` (Administrator) user inside the container. If a hacker breaches your Python app (e.g., via a vulnerability in `requests`), they are the root user inside the container, and might be able to break out into the host server. 
In production, always add a non-root user to the bottom of your Dockerfile:
```dockerfile
RUN useradd -m myuser
USER myuser
CMD ["python", "monitor.py"]
```

## 14. Senior Engineer's Perspective
**Junior Engineer:** "Why do we have to copy the `requirements.txt` on line 3, and then copy the `monitor.py` script on line 5? Why not just copy everything on line 3?"
**Senior Engineer:** "Docker uses Caching. Every line in a Dockerfile is a 'Layer'. If you change `monitor.py`, Docker has to rebuild every layer below it. If we copy *everything* on line 3, Docker will re-run `pip install` every single time we change a comment in our Python code, which takes 5 minutes. By copying the requirements first, Docker caches the installed libraries. Now, when we change `monitor.py`, the build takes 2 seconds because `pip install` is skipped. Order matters."

## 15. Hands-on Exercise
**Intermediate Exercise:**
1. Create a `monitor.py`, `requirements.txt`, and `Dockerfile` exactly as written in Sections 6 and 7.
2. In your terminal, build the image: `docker build -t test-app .`
3. Create a `.dockerignore` file and add `.git/` and `.env` to it, just to build good habits.
4. Run the container: `docker run test-app`. 
5. See it default to `https://google.com`. Press `Ctrl+C` to stop it.
6. Run it again, passing a custom URL: `docker run -e TARGET_URL="https://httpbin.org/status/404" test-app`

*Expected Outcome:* The second run will print a 404 Status instead of a 200, proving the container dynamically accepted your environment variable.

## 16. Interview Questions
**Beginner:**
Q: What is the difference between a Docker Image and a Docker Container?
A: An Image is the read-only blueprint (created by running `docker build`). A Container is the live, running instance of that Image (created by running `docker run`).

**Intermediate:**
Q: Why shouldn't you use `FROM ubuntu` and manually install Python inside your Dockerfile?
A: Using the official `FROM python:3.10-slim` image is much smaller, more secure, and officially maintained by the Python team. Manually installing Python on top of Ubuntu creates massive, slow-building images and introduces potential dependency hell.

**Advanced / Production Scenario:**
Q: You have a Python API running in a Docker container. When the container crashes, the logs disappear completely. How do you ensure logs are captured?
A: Docker captures anything sent to `stdout` and `stderr` (Standard Output/Error). Python, by default, sometimes buffers `print()` statements, meaning they don't immediately hit `stdout`. To fix this, I would run the container with the `PYTHONUNBUFFERED=1` environment variable, or use Python's built-in `logging` module to ensure logs stream directly to the container runtime, where they can be forwarded to DataDog or Splunk.

## 17. Chapter Summary
Docker is the bridge between software engineering and infrastructure. By containerizing your Python scripts, you eliminate environmental inconsistencies, secure your dependencies, and package your code into the universal shipping container of the cloud native world. 

## 18. Quick Revision Notes
- **Dockerfile:** Instructions for building an Image.
- **`FROM python:3.10-slim`:** The best base image for production.
- **`RUN`:** Executes Linux commands *during* the build (e.g., `pip install`).
- **`CMD`:** The final command executed *when the container starts*.
- Cache optimization: Copy `requirements.txt` *before* your code!
- Pass secrets at runtime using **`docker run -e`**, never in the Dockerfile.
- Run as a non-root user in production.


---

