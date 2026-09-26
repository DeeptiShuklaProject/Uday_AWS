# Chapter_02_prerequisites

## 🎯 Learning Objectives
In this chapter, you will learn how to:
- Install and verify the required local development tools.
- Configure virtual environments to manage python packages.
- Install the `uv` toolchain and verify Docker container configurations.
- Verify AWS account authentication and API credentials access.

### Importance of This Chapter
If developer dependencies are misconfigured, subsequent deployment commands will fail. Setting up your environment correctly ensures a smooth workflow.

---

## 📦 Technical Terms Explained

> **📦 Technical Term Explained**
>
> **Term:** SDK (Software Development Kit)
>
> **Simple Explanation:** An SDK is a collection of pre-written code, libraries, and utilities that developers use to build applications for a specific platform or service.
>
> **Why do we need it?** Instead of writing raw HTTP requests to call Bedrock APIs, developers use the Bedrock Python SDK to write clean Python code.
>
> **Where is it used?** In your Python scripts, where you import `boto3` or `bedrock_agent_core` classes.

---

> **📦 Technical Term Explained**
>
> **Term:** AWS CLI (Command Line Interface)
>
> **Simple Explanation:** The AWS CLI is a command-line tool that lets you interact with AWS services using commands in your terminal instead of clicking buttons in the AWS Console.
>
> **Why do we need it?** It allows you to authenticate your local machine with AWS, manage services, and automate deployments.
>
> **Where is it used?** In your terminal or command prompt to configure credentials, check permissions, and upload files.

---

> **📦 Technical Term Explained**
>
> **Term:** Virtual Environment
>
> **Simple Explanation:** A virtual environment is an isolated directory on your computer containing its own Python installation and set of libraries, separate from your system-wide Python.
>
> **Why do we need it?** It prevents package version conflicts between different Python projects on your machine.
>
> **Where is it used?** When developing Python applications locally to keep project dependencies isolated.

---

> **📦 Technical Term Explained**
>
> **Term:** `uv`
>
> **Simple Explanation:** `uv` is a high-performance Python package installer and resolver written in Rust. It serves as a fast alternative to `pip`.
>
> **Why do we need it?** It installs and resolves package dependencies up to 10-100x faster than standard `pip`.
>
> **Where is it used?** In your terminal to create virtual environments, install packages, and manage dependencies.

---

> **📦 Technical Term Explained**
>
> **Term:** `pip`
>
> **Simple Explanation:** `pip` is the standard package manager for Python, used to download and install packages from the Python Package Index (PyPI).
>
> **Why do we need it?** It downloads the external libraries and packages required by your application.
>
> **Where is it used?** In your terminal to install packages.

---

> **📦 Technical Term Explained**
>
> **Term:** Docker
>
> **Simple Explanation:** Docker is a platform that package code and its dependencies into a lightweight, standalone container, ensuring the application runs consistently across different machines.
>
> **Why do we need it?** It package your agent code, Python runtime, and libraries into a container image that can be deployed to the cloud.
>
> **Where is it used?** On your local machine to build and test container images, and in Amazon ECR to host deployment images.

---

> **📦 Technical Term Explained**
>
> **Term:** Container
>
> **Simple Explanation:** A container is a running instance of a Docker image, containing the application code, runtime environment, system tools, and libraries.
>
> **Why do we need it?** It provides an isolated runtime environment for the application.
>
> **Where is it used?** In the compute runtime to execute your agent code.

---

## 🛠️ Step-by-Step Installation and Verification

Follow these steps to install and verify each tool.

### Step 1: Install Git
1. Download the installer from the official page: [git-scm.com](https://git-scm.com/).
2. Run the installer and accept the default settings.
3. Open your terminal and run this verification command:
   ```bash
   git --version
   ```
- **Why this is required:** Git is used to clone samples, track changes, and manage code configurations.
- **Expected Output:**
  ```text
  git version 2.40.1.windows.1
  ```
- **Troubleshooting:** If the command is not recognized, verify that the Git executable path is included in your system's `PATH` environment variable.

---

### Step 2: Install Python 3.11
1. Download Python 3.11 from [python.org](https://www.python.org/downloads/).
2. Run the installer and check the box to **Add Python to PATH**.
3. Open your terminal and run this verification command:
   ```bash
   python --version
   ```
- **Why this is required:** Python is the programming language used to write your agent and run the deployment CLI.
- **Expected Output:**
  ```text
  Python 3.11.5
  ```
- **Troubleshooting:** On Windows, you may need to type `py --version` or restart your terminal after installation.

---

### Step 3: Install the `uv` Package Manager
1. Open your terminal and execute the installation script:
   - **macOS / Linux:**
     ```bash
     curl -LsSf https://astral.sh/uv/install.sh | sh
     ```
   - **Windows (PowerShell):**
     ```powershell
     powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
     ```
2. Verify the installation:
   ```bash
   uv --version
   ```
- **Why this is required:** `uv` manages virtual environments and syncs dependencies.
- **Expected Output:**
  ```text
  uv 0.2.10 (astral-sh 2026-02-15)
  ```
- **Troubleshooting:** Restart your terminal after installation to ensure the `uv` path is added to your environment variables.

---

### Step 4: Install the AWS CLI v2
1. Download the installer for your operating system from the [AWS CLI Install Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).
2. Run the installer.
3. Open your terminal and run this verification command:
   ```bash
   aws --version
   ```
- **Why this is required:** The AWS CLI is used to authenticate your machine and deploy resources to AWS.
- **Expected Output:**
  ```text
  aws-cli/2.15.15 Python/3.11.6 Windows/10 ...
  ```

---

### Step 5: Install Docker / Podman
1. Download and install Docker Desktop from [docker.com](https://www.docker.com/).
2. Open Docker Desktop and verify the Docker daemon is running in the background.
3. In your terminal, run this verification command:
   ```bash
   docker --version
   ```
- **Why this is required:** Docker is used to compile, test, and push the agent container image to ECR.
- **Expected Output:**
  ```text
  Docker version 24.0.7, build afdd53b
  ```

---

## 🔒 Verification of AWS Access

Verify that your AWS CLI is authenticated with your AWS account:
```bash
aws sts get-caller-identity
```

- **Why this is required:** Validates that your local terminal can communicate with AWS using your credentials.
- **Internals:** The CLI sends a request to the AWS Security Token Service (STS) to retrieve details about the active IAM user or role.
- **Expected Output:**
  ```json
  {
      "UserId": "AIDAX1234567890EXAMPLE",
      "Account": "123456789012",
      "Arn": "arn:aws:iam::123456789012:user/developer"
  }
  ```

---

## 📊 Visual Reference

Let's look at the outputs from the verification steps:

![Figure 2-1: Verification of AWS CLI authentication](images/agent_section_11.png)
*Caption: Output from the STS caller identity check.*
- **What to Observe:** The JSON structure containing the Account ID and user ARN.
- **Why it Matters:** Confirming these details ensures that subsequent deployment commands can access AWS resources.

---

## 🛠️ Common Mistakes & Troubleshooting
- **Mistake:** Command not found error for `python` or `aws`.
  - **Resolution:** Restart your terminal to refresh the environment variables. If the error persists, manually add the executable directories to your system's `PATH` variables.
- **Mistake:** Docker command fails with a connection error.
  - **Resolution:** Verify Docker Desktop is open and the Docker daemon status is active.

---

## 📝 Practical Exercise
Open your terminal and run the verification commands for Git, Python, `uv`, AWS CLI, and Docker. Copy the outputs into a text file named `pre_req_check.txt` in your sandbox directory to confirm your environment is ready.

---

## 🔄 Chapter Recap
- We installed and verified the required tools: Git, Python 3.11, `uv`, AWS CLI, and Docker.
- We confirmed the local machine can communicate with AWS using `aws sts get-caller-identity`.
- The environment is ready to configure AWS-side permissions and model access.
