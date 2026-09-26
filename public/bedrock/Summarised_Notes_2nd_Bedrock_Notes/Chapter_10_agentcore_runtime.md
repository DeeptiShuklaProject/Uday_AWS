# Chapter_10_agentcore_runtime

## 🎯 Learning Objectives
In this chapter, you will learn:
- How AWS Firecracker microVMs provide secure, hardware-isolated runtimes.
- The difference between container execution and microVM isolation.
- How AgentCore routes requests to active (warm) and new (cold) sessions.
- The default execution bounds, timeouts, and limits.

### Importance of This Chapter
Production applications require high security and predictable performance. Understanding how the runtime isolated VM environment works allows developers to design agents that comply with enterprise security requirements.

---

## 📦 Technical Terms Explained

> **📦 Technical Term Explained**
>
> **Term:** Firecracker
>
> **Simple Explanation:** AWS Firecracker is an open-source virtualization technology designed for creating and managing secure, multi-tenant containers and serverless functions.
>
> **Why do we need it?** It combines the speed of traditional containers with the security isolation of full virtual machines.
>
> **Where is it used?** In AWS serverless infrastructure (like AWS Lambda, Fargate, and Bedrock AgentCore) to isolate tenant code.

---

> **📦 Technical Term Explained**
>
> **Term:** Session
>
> **Simple Explanation:** A session is a series of interactions or exchanges between a user and an application that occurs within a specific period.
>
> **Why do we need it?** To track state and conversational history across multiple requests from the same user.
>
> **Where is it used?** In chat interfaces and agent runtimes to keep conversations context-aware.

---

> **📦 Technical Term Explained**
>
> **Term:** MicroVM (Micro Virtual Machine)
>
> **Simple Explanation:** A MicroVM is a lightweight virtual machine that boots in milliseconds, uses minimal memory, and runs a single application process inside an isolated kernel.
>
> **Why do we need it?** It provides a hardware-level security boundary to isolate user workloads.
>
> **Where is it used?** Under the hood of Bedrock AgentCore to host your active agent sessions.

---

## 🧠 Runtime Virtualization and Session Isolation

Unlike shared container platforms where multiple containers share a single operating system kernel, Bedrock AgentCore provides session isolation using **AWS Firecracker microVMs**.

```
┌────────────────────────────────────────────────────────┐
│                    PHYSICAL BARE-METAL SERVER          │
│                                                        │
│   ┌──────────────────────┐  ┌──────────────────────┐   │
│   │   Firecracker VM     │  │   Firecracker VM     │   │
│   │   (Session A)        │  │   (Session B)        │   │
│   │                      │  │                      │   │
│   │  ┌────────────────┐  │  │  ┌────────────────┐  │   │
│   │  │  Docker Image  │  │  │  │  │  Docker Image  │  │   │   │
│   │  │  (User Code)   │  │  │  │  │  (User Code)   │  │   │   │
│   │  └────────────────┘  │  │  └────────────────┘  │   │
│   └──────────┬───────────┘  └──────────┬───────────┘   │
│              │                         │               │
│              ▼                         ▼               │
│          Session A                 Session B           │
│        Isolated Kernel           Isolated Kernel       │
└────────────────────────────────────────────────────────┘
```

- **Hypervisor Boundaries:** Firecracker is a virtual machine monitor that uses Linux Kernel-based Virtual Machines (KVM) to launch lightweight microVMs.
- **Data Leak Prevention:** Because each user session is assigned a dedicated VM, there is no shared memory space or common kernel filesystem, protecting against cross-tenant data leaks.

---

## ⏱️ Warm Starts vs. Cold Starts

When an invoke request is received:
1. **Cold Start:** If the `session_id` does not match an active VM, AgentCore pulls the ECR container image and launches a new Firecracker microVM. This boot process takes only a few seconds.
2. **Warm Start:** Subsequent requests using the same `session_id` route to the warm VM, bypassing the boot process for immediate execution.
3. **Session Expiration:** The microVM remains active until it is decommissioned due to inactivity (usually 30 minutes) or reaches the maximum session duration limit of **8 hours**.

---

## ⏱️ Execution Bounds and Limits Reference

The table below summarizes the runtime parameters for AgentCore:

| Limit Parameter | Default Value | Description |
| :--- | :--- | :--- |
| **Max Payload Size** | 100 MB | The maximum size of incoming request payloads, allowing for large files or attachments. |
| **Synchronous Timeout** | 15 Minutes | The execution timeout for a single, blocking request before returning a gateway error. |
| **Streaming Timeout** | 60 Minutes | The execution limit for streaming responses (e.g., long research loops). |
| **Max Session Duration** | 8 Hours | The maximum lifespan of a single microVM session. |

---

## 📊 Visual Reference

Let's look at how the runtime manages deployment sessions.

![Figure 10-1: Compute Runtime Container Settings](images/agent_section_3.png)
*Caption: Deployment metrics for the compute runtime container.*
- **What to Observe:** The memory limits, timeouts, and execution constraints defined for the runtime VM.
- **Why it Matters:** Helps developers allocate appropriate resources for their application workflows.

---

## 🛠️ Common Mistakes & Troubleshooting
- **Mistake:** Writing files to the local filesystem `/tmp` and expecting them to be persistent across days.
  - **Resolution:** Because sessions terminate after 8 hours, write any persistent files to S3.
- **Mistake:** Synchronous request timeouts for tasks taking longer than 15 minutes.
  - **Resolution:** Configure the request to use streaming to avoid gateway timeouts.

---

## 📝 Practical Exercise
Create a script named `session_persistence.py` in your sandbox directory. Write code that saves a JSON file containing a counter value to `/tmp/counter.json` and updates it on subsequent requests using the same session ID. Verify that the counter increments on subsequent calls.

---

## 🔄 Chapter Recap
- We studied the internal virtualization engine of AgentCore based on AWS Firecracker.
- We analyzed session starts, data isolation, and execution bounds.
- We reviewed the system timeout and payload limits.
- We are ready to learn about the tool broker, the Agent Gateway.
