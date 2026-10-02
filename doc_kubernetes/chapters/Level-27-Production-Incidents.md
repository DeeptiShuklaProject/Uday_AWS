# Level 27 — Production Incident Scenarios

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Advanced |
| **Theory Duration** | 4 hours |
| **Practical Duration** | 6 hours |
| **Prerequisites** | Level 26 — Troubleshooting |
| **Lab Required** | Yes — Simulated break-and-fix |
| **Interview Importance** | ⭐⭐⭐⭐⭐ (5/5) — Separates mid-level from senior |
| **Industry Importance** | ⭐⭐⭐⭐⭐ (5/5) |
| **Certification Alignment** | CKA, CKS, SRE certifications |

---

## Learning Objectives

After completing this module, the learner will be able to:

1. Respond to real-world production incidents using a structured approach.
2. Diagnose cascading failures in microservice architectures.
3. Perform post-incident reviews and write incident reports.
4. Implement preventive measures to avoid common production incidents.

---

## 1. Incident Response Framework

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    Incident Response Process                             │
│                                                                          │
│  1. DETECT — Alert fires (PagerDuty, Slack, Grafana alert)              │
│     "What alerted? What is the impact? Who is affected?"                │
│                                                                          │
│  2. TRIAGE — Classify severity                                          │
│     SEV1: Full outage, revenue impact        → All hands on deck        │
│     SEV2: Partial outage, degraded service   → On-call engineer + lead  │
│     SEV3: Minor issue, no user impact        → Next business day        │
│                                                                          │
│  3. DIAGNOSE — Identify root cause                                      │
│     "What changed recently? Any deployments? Infrastructure changes?"    │
│     → Check: kubectl get events, dashboards, recent deployments         │
│                                                                          │
│  4. MITIGATE — Stop the bleeding                                        │
│     "What is the fastest way to restore service?"                       │
│     → Rollback deployment, scale up, fail over, restart Pods            │
│                                                                          │
│  5. RESOLVE — Fix the root cause                                        │
│     → Code fix, config change, infrastructure fix                       │
│                                                                          │
│  6. POST-MORTEM — Learn and prevent                                     │
│     → What happened? Why? How to prevent? Action items.                 │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Common Production Incidents

### Incident 1: Cascading OOMKill During Traffic Spike

```
Scenario:
  Black Friday sale → 5x normal traffic
  HPA scales Pods from 5 to 20
  Each Pod consumes 400MB memory (limit: 512MB)
  20 Pods × 400MB = 8GB → Node has 16GB but system + other Pods use 10GB
  Node enters MemoryPressure → kubelet evicts Pods → More Pods OOMKilled
  Cascade: fewer Pods → more traffic per Pod → more OOMKills

Timeline:
  09:00 — Traffic spike begins
  09:05 — HPA scales to 15 replicas
  09:08 — Node memory at 95%, MemoryPressure condition
  09:10 — Evictions begin, 3 Pods killed
  09:12 — Remaining Pods receive more traffic, memory spikes
  09:15 — 5 more Pods OOMKilled, service degraded
  09:20 — Alert fires, on-call engineer responds

Resolution:
  1. Immediate: kubectl scale deployment web-app --replicas=30 (add capacity)
  2. Karpenter provisions 2 new nodes (30 seconds)
  3. New Pods scheduled on new nodes
  4. Service restored at 09:25

Prevention:
  • Set memory requests closer to actual usage (not too low)
  • Use Karpenter with aggressive scale-up
  • Set PodDisruptionBudgets to prevent mass eviction
  • Implement request rate limiting in Ingress
  • Load test before high-traffic events
```

### Incident 2: Bad Deployment Causes 500 Errors

```
Scenario:
  Developer deploys v2.0 with a database migration bug
  Rolling update replaces v1.0 Pods with v2.0 Pods
  v2.0 Pods start returning HTTP 500 errors
  Readiness probes are too lenient (check /health but not database)

Timeline:
  14:00 — v2.0 deployment begins
  14:02 — First v2.0 Pod passes readiness probe (checks HTTP, not DB)
  14:03 — v1.0 Pod terminated, v2.0 serving traffic
  14:04 — Users start seeing 500 errors
  14:06 — Error rate alert fires
  14:08 — On-call engineer responds

Resolution:
  kubectl rollout undo deployment/web-app    # Instant rollback to v1.0

Prevention:
  • Readiness probes must check ALL dependencies (DB, cache, external APIs)
  • Use canary deployment (10% traffic to v2.0 first)
  • Automated rollback based on error rate metrics
  • Database migrations must be backward-compatible
```

### Incident 3: Node Failure in Single-AZ Deployment

```
Scenario:
  3 worker nodes, all in us-east-1a
  AWS hardware failure takes down 1 node
  3 critical Pods were on that node (no anti-affinity configured)
  Pods reschedule but remaining 2 nodes are at 90% capacity
  Some Pods stuck in Pending

Resolution:
  1. Karpenter/CA provisions replacement node
  2. Pods scheduled on new node

Prevention:
  • Spread nodes across 3 AZs (not single AZ)
  • Use Pod anti-affinity to spread replicas across nodes/AZs
  • Topology spread constraints with maxSkew: 1
  • Run minimum 2 replicas for all critical services
  • Never run single-instance for production workloads
```

---

## 3. Incident Report Template

```markdown
# Incident Report: [Title]

## Summary
[One-paragraph description of what happened]

## Impact
- Duration: [start time] to [end time] (X minutes)
- Affected users: [percentage or count]
- Services affected: [list]
- Revenue impact: [if applicable]

## Timeline
- HH:MM — [Event]
- HH:MM — [Event]
- HH:MM — [Resolution]

## Root Cause
[Technical explanation of what caused the incident]

## Resolution
[What was done to fix the incident]

## Action Items
- [ ] [Preventive measure 1] — Owner: [name] — Due: [date]
- [ ] [Preventive measure 2] — Owner: [name] — Due: [date]
- [ ] [Monitoring improvement] — Owner: [name] — Due: [date]

## Lessons Learned
[What the team learned from this incident]
```

---

## 4. Interview Questions

### Q1: Tell me about a production incident you handled.

**Expected Answer Structure:**
1. **Context**: What system, what scale, what was the service?
2. **Detection**: How did you discover the issue? (Alert, customer report, monitoring)
3. **Diagnosis**: What tools did you use? What was the root cause?
4. **Mitigation**: What was the immediate fix to restore service?
5. **Resolution**: What was the long-term fix?
6. **Prevention**: What changes were made to prevent recurrence?

---

### Q2: How do you prevent cascading failures in Kubernetes?

**Expected Answer:**
1. **Resource limits**: Prevent runaway containers from consuming all resources.
2. **PodDisruptionBudgets**: Limit simultaneous disruptions.
3. **Circuit breakers**: Service mesh (Istio) prevents cascading failures between services.
4. **Rate limiting**: Ingress-level rate limiting protects backends.
5. **Multi-AZ deployment**: Node failure in one AZ doesn't take down all replicas.
6. **HPA + Karpenter**: Auto-scale under load before resources exhaust.
7. **Readiness probes**: Don't send traffic to unhealthy Pods.

---

## 5. Summary

| Incident Type | Key Prevention |
| :--- | :--- |
| **OOMKill cascade** | Right-size memory; Karpenter for fast node scale-up |
| **Bad deployment** | Canary strategy; readiness probes checking all dependencies |
| **Node failure** | Multi-AZ; Pod anti-affinity; topology spread |
| **DNS failure** | Monitor CoreDNS; PDB for CoreDNS Pods |
| **Certificate expiry** | Cert-Manager auto-renewal; monitoring for expiry |
| **etcd exhaustion** | Monitor etcd size; prune old resources |

---

## 6. Practice Assignment

1. Simulate OOMKill by deploying a memory-intensive app with low limits. Observe and fix.
2. Deploy a bad image version. Practice rollback using `kubectl rollout undo`.
3. Drain a node and observe PDB enforcement. Verify services remain available.
4. Write an incident report for a simulated outage following the template above.
5. Design a set of alerts that would catch each incident type listed in this module.
