# Chapter 30: Systemd Targets and Journalctl

> **Phase**: Phase_05_Process_and_Job_Management | **Chapter**: 30 of 85 | **Difficulty**: Intermediate | **Estimated Time**: 3-4 hours

---

## 1. Service Overview


> [!TIP]
> **Video Tutorial:** [Click here to watch the complete step-by-step practical demonstration on YouTube](#)
**Systemd Targets and Journalctl** covers systemd targets and journalctl - a critical Linux system administration skill. In enterprise environments, mastery of systemd targets and journalctl is required for production server management, security compliance, and system reliability.

**Why This Matters**:
- Enterprise Linux environments depend on correct systemd targets and journalctl configuration
- Security audits and compliance frameworks require systemd targets and journalctl expertise
- Production incidents are frequently caused by misconfigured systemd targets and journalctl
- RHCSA/LFCS certification exams test this knowledge directly

**Career Relevance**: Required for SysAdmin, DevOps Engineer, and Cloud Infrastructure roles across all major industries.

---

## 2. Learning Objectives

By the end of this chapter, you will be able to:

- [ ] Explain the core concepts of systemd targets and journalctl from first principles
- [ ] Configure and manage systemd targets and journalctl in a production Linux environment
- [ ] Troubleshoot common systemd targets and journalctl failures using systematic diagnosis
- [ ] Apply security hardening best practices for systemd targets and journalctl
- [ ] Monitor systemd targets and journalctl status and interpret diagnostic output
- [ ] Complete hands-on labs simulating real production scenarios
- [ ] Answer RHCSA/LFCS exam questions on this topic

**Chapter Unlock Flow**: Read -> Lab Practice -> Task Challenge -> Knowledge Check -> Next Chapter Unlock

---

## 3. Prerequisites

| Prerequisite | Why Needed |
|---|---|
| Linux command line basics | Execute all commands in labs |
| File system navigation | Locate config files and logs |
| Text editor (vim/nano) | Edit configuration files |
| sudo/root access concepts | Apply privileged operations |
| Previous chapter completion | Progressive skill building |

> **Tip**: Review Chapter 29 if you need a refresher before proceeding.

---

## 4. Real-world Analogy

Think of **systemd targets and journalctl** like a city infrastructure management system:

- City zones (residential/commercial/industrial) = Linux systemd targets and journalctl organizational layers
- Building code inspectors = Linux systemd targets and journalctl policy enforcement
- Emergency services override = root superuser privileges
- Traffic signal coordination = systemd targets and journalctl resource access management
- Infrastructure cascading failures = systemd targets and journalctl misconfiguration cascading through services

This mental model helps you predict system behavior before running commands.

---

## 5. Business Use Cases

| Industry | Use Case | Business Impact |
|---|---|---|
| Finance | PCI-DSS compliance requires systemd targets and journalctl audit trails | Regulatory fines avoided |
| Healthcare | HIPAA mandates strict systemd targets and journalctl controls | Patient data protected |
| E-commerce | systemd targets and journalctl configuration prevents data breaches | Revenue loss prevented |
| Government | FISMA requires systemd targets and journalctl documentation | Contract compliance maintained |
| SaaS | Multi-tenant systemd targets and journalctl isolation | Customer data separated |

**Production Example**: A Fortune 500 company 4-hour outage traced to incorrect systemd targets and journalctl configuration - preventable with this chapter's knowledge.

---

## 6. Core Concepts: Core Theory

### Fundamental Principles of Systemd Targets and Journalctl

**Systemd Targets and Journalctl** is a critical component of Linux administration.

Legacy content will be integrated here.

### Key Terminology

| Term | Definition | Example |
|---|---|---|
| Systemd Targets and Journalctl Concept | Core definition | Example |
|---|---|---|

### Conceptual Hierarchy

```
Systemd Targets and Journalctl Hierarchy Structure
```

---

## 7. Core Architecture

```mermaid
flowchart TD
    A[User Space] -->|System Call| B(Kernel Space)
    B --> C{Virtual File System / Core Subsystem}
    C -->|Hardware Interaction| D[Physical Hardware / Storage]
    C -->|Service Management| E[Systemd / Daemons]
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:4px
```

```mermaid
flowchart TD
    A[User Application] --> B[System Call Interface]
    B --> C[Kernel Space]
    C --> D[systemd targets and journalctl Subsystem]
    D --> E[Hardware / Resources]
    D --> F[Security Layer]
    F --> G[Audit Log]
    E --> H[Output / Result]
```

**Processing Pipeline**:
1. **Request Initiation** - User or daemon triggers systemd targets and journalctl operation
2. **Kernel Evaluation** - Kernel validates permissions and policies
3. **Subsystem Processing** - systemd targets and journalctl subsystem executes the operation
4. **Result Return** - Success or error returned to caller
5. **Audit Recording** - Operation logged for compliance

---

## 8. System Components

Core components of Systemd Targets and Journalctl

### Configuration Files

| File / Path | Purpose | Key Parameters |
|---|---|---|
| `/etc/systemdtargetsandjournalctl.conf` | Main config file | `setting=value` |

```mermaid
flowchart LR
    SYSTEMD[systemd] --> SVC[Service]
    SVC --> CONFIG[Config Files]
    SVC --> LOG[Log Files]
    SVC --> DEPS[Dependencies]
    DEPS --> KERNEL[Kernel Modules]
```

---

## 9. Configuration

### Step-by-Step Configuration Guide

**Step 1**: Verify current state
```bash
systemctl status systemd || echo 'Service not found'
```

### Production Configuration Template

```bash
# Production-grade systemd targets and journalctl configuration
# Generated by: Linux Master Course v2 - Chapter 30
# Environment: RHEL 9 / CentOS Stream 9

# Configuration for Systemd Targets and Journalctl
```

### Verification Commands

```bash
# Verify Systemd Targets and Journalctl
echo 'Verifying systemd targets and journalctl'
```

---

## 10. Hands-on Labs


### Lab Setup
> **Lab Environment**: Make sure your local Linux virtual machine (Ubuntu 22.04 or RHEL 9) is booted and you are connected via SSH as the 
oot or a sudo enabled user.
> **Terminal Required**: Open your Linux terminal and type each command yourself. Never copy-paste blindly!
> **Terminal Required**: Open your Linux terminal and type each command yourself.

### Lab 1: Basic Systemd Targets and Journalctl Configuration

**Scenario**: You are a SysAdmin at DataCore Inc. Configure systemd targets and journalctl on a new RHEL 9 server before production launch.

**Goal**: Configure and verify systemd targets and journalctl without being told the exact commands.

**Step 1: Audit Current State**

<details>
<summary>Hint 1: Conceptual Approach</summary>
Before running commands, always identify what state the system is currently in. Think about what command shows service or filesystem status.
</details>

<details>
<summary>Hint 2: Relevant Commands</summary>
You might want to use `systemctl status`, `cat /etc/*`, or standard diagnostic commands like `ls -la` and `stat`.
</details>

<details>
<summary>Hint 3: Full Solution</summary>

```bash
# Execute the relevant diagnostic command for this topic
systemctl status <service_name>
# Or
ls -la /relevant/path
```
</details>
- Clue: Check the current systemd targets and journalctl state before making changes
- Direction: Use status/query commands appropriate to this subsystem
- Concept: Always audit before modifying - prevents unintended changes

**Step 2: Apply Configuration**
- Clue: Identify which configuration file or command controls systemd targets and journalctl
- Direction: Use `man` pages or `--help` to discover the right parameters
- Concept: Configuration files follow hierarchical override patterns

**Step 3: Verify the Change**
- Clue: A change is not complete until independently verified
- Direction: Use query commands (not the apply command) to confirm
- Concept: Verification prevents silent failures in production

### Lab 2: Intermediate Systemd Targets and Journalctl Troubleshooting

**Scenario**: PROD-WEB-01 shows systemd targets and journalctl-related issues. A service fails to start with permission errors.

**Investigation Approach**:
1. Read the error message carefully - what exactly is failing?
2. Check service logs: `journalctl -xeu <service>`
3. Identify which systemd targets and journalctl element is causing the block
4. Apply the minimal fix needed - avoid over-permissioning
5. Verify the service starts and keeps running

**Hints** (use only if stuck):
- Clue: The error contains the specific systemd targets and journalctl element that is misconfigured
- Direction: Compare against a known-good server configuration
- Concept: systemd targets and journalctl errors have specific codes - look them up in `man`

### Lab 3: Advanced Systemd Targets and Journalctl - Production Simulation

**Scenario**: On-call at 2 AM. Alert: Critical service DOWN on PROD-DB-01.
Root cause: systemd targets and journalctl misconfiguration from a recent change.

**Timeline**:
- T+0: Acknowledge alert
- T+5: SSH to affected server, check service status
- T+10: Review recent systemd targets and journalctl changes in audit log
- T+15: Apply targeted fix
- T+20: Verify service recovery
- T+25: Write incident report draft

---

## 11. Code Examples

### Example 1: Basic Usage

```bash
# Basic usage of Systemd Targets and Journalctl
```

### Example 2: Production Management Script

```bash
#!/bin/bash
# Production systemd targets and journalctl management script
set -euo pipefail
LOGFILE="/var/log/systemd_targets_and__mgmt.log"

echo 'Checking systemd targets and journalctl'
echo 'Applying systemd targets and journalctl'
echo 'Verifying systemd targets and journalctl'
```

### Example 3: Automation and Integration

```bash
#!/bin/bash
# Automation for Systemd Targets and Journalctl
```

---

## 12. Security Deep Dive

**Principle of Least Privilege**: Grant the minimum systemd targets and journalctl access required. Never use overly broad permissions.

### Attack Vectors and Mitigations

| Attack Vector | Risk | Mitigation |
|---|---|---|
| Misconfigured systemd targets and journalctl permissions | HIGH | Regular `auditctl` reviews |
| Privilege escalation via systemd targets and journalctl | CRITICAL | SELinux/AppArmor enforcement |
| Configuration drift | MEDIUM | Ansible idempotent playbooks |
| Unpatched systemd targets and journalctl components | HIGH | Automated patch management |

### Hardening Checklist

- [ ] Disable unused systemd targets and journalctl features
- [ ] Enable audit logging for all systemd targets and journalctl changes
- [ ] Apply SELinux boolean restrictions where applicable
- [ ] Document all exceptions with business justification
- [ ] Review systemd targets and journalctl configuration quarterly
- [ ] Enforce via configuration management (Ansible/Puppet)

---

## 13. Monitoring and Observability

### Key Metrics

| Metric | Normal Range | Alert Threshold | Command |
|---|---|---|---|
| Health | OK | Error | `check_systemd` |

### Log Analysis

```bash
journalctl -f | grep -i "systemd"
journalctl --since "1 hour ago" | grep -iE "error|failed|denied"
ausearch -ts today | grep "systemd"
```

---

## 14. Performance and Cost Optimization

Performance tuning for Systemd Targets and Journalctl

### Benchmarking Commands

```bash
# Benchmark Systemd Targets and Journalctl
```

| Configuration | CPU Impact | Memory Impact | Recommendation |
|---|---|---|---|
| Default | Low | Low | Good for dev/test |
| Hardened | Medium | Low | Recommended for prod |
| Full audit | High | Medium | Compliance environments |

---

## 15. Enterprise Integration

| Tool | Integration Method | Use Case |
|---|---|---|
| Ansible | Native module | Automated configuration |
| Puppet/Chef | Native resource types | Policy enforcement |
| SIEM (Splunk) | Log forwarding | Security monitoring |
| ServiceNow | API integration | Change management |
| Nagios/Zabbix | Plugin scripts | Health monitoring |

### Ansible Playbook Example

```yaml
---
- name: Configure Systemd Targets and Journalctl
  hosts: linux_servers
  become: yes
  tasks:
    - name: Install prerequisites
      package:
        name: "{{ item }}"
        state: present
      loop:
        - systemd
    - name: Verify operational
      command: systemctl is-active systemd || true
      register: result
      changed_when: false
  handlers:
    - name: restart_service
      service:
        name: "systemd"
        state: restarted
        enabled: yes
```

---

## 16. Real Industry Use Cases

### Use Case 1: Financial Services

**Challenge**: PCI-DSS audit failed due to incorrect systemd targets and journalctl configuration on 200 payment processing servers
**Solution**: Automated systemd targets and journalctl remediation using Ansible across the entire fleet
**Result**: Audit passed, $2M fine avoided, 4-hour implementation time

### Use Case 2: Healthcare Provider

**Challenge**: HIPAA violation risk due to over-permissioned systemd targets and journalctl settings
**Solution**: Implemented least-privilege systemd targets and journalctl model with quarterly reviews
**Result**: Zero systemd targets and journalctl-related audit findings for 3 consecutive years

### Use Case 3: E-commerce Platform

**Challenge**: Peak sale season outage caused by systemd targets and journalctl misconfiguration during deployment
**Solution**: systemd targets and journalctl configuration tested in staging, validated via automated tests
**Result**: Zero systemd targets and journalctl incidents in subsequent 4 peak seasons

---

## 17. Architecture Patterns

### Pattern 1: Centralized Management

```mermaid
flowchart TD
    MGMT[Management Server - Ansible Controller] --> PROD[Production Nodes]
    MGMT --> STAGE[Staging Nodes]
    MGMT --> DEV[Dev Nodes]
    PROD --> AUDIT[Audit Log Aggregator]
    STAGE --> AUDIT
    AUDIT --> SIEM[SIEM / Splunk]
```

### Pattern 2: Defense in Depth

| Layer | Component | Role |
|---|---|---|
| Layer 1 | Network Firewall | Block unauthorized access |
| Layer 2 | Host Firewall | Service-level restrictions |
| Layer 3 | SELinux/AppArmor | Mandatory access control |
| Layer 4 | Application | Application-level enforcement |
| Layer 5 | Audit | Operation logging |

---

## 18. Production Incident War Room

### INC-1030: Systemd Targets and Journalctl Production Failure

**Severity**: P1 - Critical | **Affected**: PROD-APP-01, PROD-APP-02

**Incident Timeline**

| Time | Event |
|---|---|
| 02:14 | Alert: Service health check FAILED |
| 02:18 | On-call SysAdmin SSHs to PROD-APP-01 |
| 02:22 | Triage: systemd targets and journalctl service not responding |
| 02:31 | Root cause: systemd targets and journalctl configuration corrupted |
| 02:38 | Fix applied from last-known-good backup |
| 02:40 | Service recovery verified |

**Diagnosis Commands**

```bash
systemctl status <service>
journalctl -xeu <service> --since "30 min ago"
# Diagnose Systemd Targets and Journalctl
journalctl -xe | grep -i systemd
```

**Resolution**

```bash
# Fix for Systemd Targets and Journalctl
systemctl restart systemd
systemctl restart <service> && systemctl is-active <service>
```

**Post-Incident Actions**:
1. Update runbook with diagnosis steps
2. Add config validation to CI/CD pipeline
3. Implement config change alerting
4. Team retrospective within 48 hours

**Lessons Learned**:
- Validate systemd targets and journalctl configuration changes before production
- Backup configs: `cp config config.bak.$(date +%Y%m%d_%H%M%S)`
- Pre-test all changes in staging environment

---

## 19. Production Best Practices

1. **Never modify production systemd targets and journalctl without a tested rollback plan**
2. **Always test in staging first - identical to production environment**
3. **Use configuration management - never make manual changes**
4. **Document every exception with business justification and approval**
5. **Automate compliance checks - weekly, report to management**
6. **Keep configuration in version control (Git)**
7. **Review systemd targets and journalctl audit logs weekly - anomalies indicate incidents or drift**

| Environment | Risk Tolerance | Change Window | Testing Required |
|---|---|---|---|
| Development | High | Anytime | Basic smoke test |
| Staging | Medium | Business hours | Full regression |
| Production | Zero | Approved window only | Full + rollback tested |
| DR/Backup | Low | Scheduled only | Identical to prod |

---

## 20. Migration Strategies

**Pre-Migration Checklist**:
- [ ] Document current systemd targets and journalctl configuration completely
- [ ] Test new configuration in isolated environment
- [ ] Get sign-off from security team
- [ ] Schedule maintenance window
- [ ] Prepare rollback procedure

```bash
# Phase 1: Backup
# Backup Systemd Targets and Journalctl data
cp -r /etc/systemd /backup/

# Phase 2: Apply
# Apply Systemd Targets and Journalctl migration

# Phase 3: Validate
# Verify Systemd Targets and Journalctl migration

# Phase 4: Rollback if needed
# Rollback Systemd Targets and Journalctl migration
```

---

## 21. CI/CD Integration

```yaml
stages:
  - validate
  - test
  - deploy

validate_config:
  stage: validate
  script:
    - echo 'Validating systemd targets and journalctl'

test_in_staging:
  stage: test
  script:
    - ansible-playbook -i inventory/staging deploy.yml
    - ./tests/verify_systemd_targets.sh

deploy_to_prod:
  stage: deploy
  when: manual
  script:
    - ansible-playbook -i inventory/production deploy.yml
```

### Automated Test Suite

```bash
#!/bin/bash
PASS=0; FAIL=0
run_test() {
    result=$(eval "$2" 2>&1)
    if echo "$result" | grep -q "$3"; then
        echo "PASS: $1"; ((PASS++))
    else
        echo "FAIL: $1"; ((FAIL++))
    fi
}

run_test 'check_install' 'which systemd || echo missing' 'missing'
echo "Results: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ] && exit 0 || exit 1
```

---

## 22. Practical Projects

### Beginner Project: Systemd Targets and Journalctl Audit Script

**Goal**: Write a shell script auditing systemd targets and journalctl configuration with color-coded compliance report.

**Requirements**:
1. Check if systemd targets and journalctl is properly configured
2. Identify any insecure settings
3. Output color-coded report (GREEN=pass, RED=fail)
4. Save report to `/var/log/audit_report_$(date +%Y%m%d).txt`

```bash
#!/bin/bash
echo "=== Systemd Targets and Journalctl Audit Report ==="
echo "Server: $(hostname) | Date: $(date)"
# Add your audit checks here
```

### Intermediate Project: Ansible Role for Systemd Targets and Journalctl

**Goal**: Create Ansible role deploying systemd targets and journalctl consistently across a 3-server fleet.

**Requirements**: RHEL 8/9 and Ubuntu 22.04 support, ansible-lint clean, molecule tests.

### Advanced Project: High-Availability Systemd Targets and Journalctl

**Goal**: Configure systemd targets and journalctl in HA with automatic failover. RTO < 30 seconds.

### Enterprise Project: Systemd Targets and Journalctl Compliance Framework (100+ Servers)

**Components**: Ansible Tower, weekly compliance scan, Splunk dashboard, ServiceNow integration.

---

## 23. Interview Preparation

### Fresher Questions (0-1 years)

**Q1**: What is Systemd Targets and Journalctl and why is it important in Linux system administration?
**Answer**: Systemd Targets and Journalctl is essential for enterprise Linux because it ensures proper management and functionality of systemd targets and journalctl.

**Q2**: What commands do you use to check the current systemd targets and journalctl status?
```bash
# Check systemd targets and journalctl status
```

**Q3**: How do you troubleshoot a systemd targets and journalctl-related service failure?
**Answer**: Check `systemctl status <service>`, review `journalctl -xeu <service>`, inspect systemd targets and journalctl configuration files, check audit logs with `ausearch`, apply minimum fix, verify recovery.

### Experienced Questions (2-5 years)

**Q4**: How do you manage systemd targets and journalctl changes across 500 servers without downtime?
**Answer**: Ansible rolling updates (`serial: 10%`), staging-first, pre/post health checks, Git rollback branches, CI/CD approval gates.

**Q5**: Describe a systemd targets and journalctl production incident and resolution.
**Answer**: Use STAR method. Reference INC-1030 from Section 18 as a template.

**Q6**: How do you prevent systemd targets and journalctl configuration drift?
**Answer**: Ansible idempotent tasks scheduled weekly, SIEM alerting on unauthorized changes, file integrity monitoring (AIDE/Tripwire).

### Expert Questions (5+ years)

**Q7**: Design a systemd targets and journalctl strategy for 2,000-server multi-datacenter environment.
**Answer**: Canary deployments, blue-green for critical systems, Ansible Tower RBAC, GitOps with automated rollback, Prometheus/Grafana monitoring.

**Q8**: Balance systemd targets and journalctl security hardening with application compatibility?
**Answer**: Audit mode before enforcement, exception register with justification, policy customization rather than disabling, CI/CD pipeline integration.

---

## 24. Certification Practice

| RHCSA Objective | Chapter Coverage | Practice Command |
|---|---|---|
| Configure Systemd Targets and Journalctl | Section 9 | `systemd` |

### Practice Question 1 (Scenario-based):
RHEL 9 `httpd` fails to start after a systemd targets and journalctl configuration change. Describe troubleshooting steps.

**Expected Approach**:
1. `systemctl status httpd` - identify the specific error
2. `journalctl -xeu httpd` - get detailed error context
3. Check systemd targets and journalctl configuration relevant to httpd
4. Apply targeted fix
5. `systemctl restart httpd && systemctl is-active httpd`

### Practice Question 2 (Configuration):
Configure systemd targets and journalctl so the `webapp` service can write to `/var/data/webapp/`.

```bash
# Practice Systemd Targets and Journalctl configuration
```

---

## 25. Knowledge Check

**Section A: Conceptual Understanding**

1. What is the primary purpose of Systemd Targets and Journalctl in Linux? (2 marks)
2. Explain the core purpose of Systemd Targets and Journalctl in enterprise Linux environments. (3 marks)
3. Why should you configure systemd targets and journalctl properly rather than disabling it entirely? (2 marks)

**Section B: Practical Commands**

4. Write the command to check systemd targets and journalctl status on a RHEL 9 system. (1 mark)
5. Write the command to apply a systemd targets and journalctl configuration change permanently. (1 mark)
6. How would you verify that a systemd targets and journalctl change has taken effect? (2 marks)

**Section C: Troubleshooting**

7. A service fails with 'Permission denied' - list 3 possible systemd targets and journalctl-related causes. (3 marks)
8. How do you determine if systemd targets and journalctl is the root cause vs. a file permission issue? (3 marks)

**Passing Score**: 15/17 required to unlock the next chapter.

> If you score below 15, review Sections 6, 9, and 10, then retry the Knowledge Check.

---

## 26. Cheat Sheet

```bash
# STATUS AND CHECKING
# Status commands for Systemd Targets and Journalctl

# CONFIGURATION
# Config commands for Systemd Targets and Journalctl

# TROUBLESHOOTING
# Troubleshooting commands for Systemd Targets and Journalctl

# SECURITY AND AUDIT
# Security commands for Systemd Targets and Journalctl
```

| Scenario | Command | Notes |
|---|---|---|
| Action | Command | Notes |
| Configure | `vi /etc/systemd.conf` | Main configuration |

---

## 27. Chapter Summary

In this chapter, you mastered **Systemd Targets and Journalctl** - a critical Linux system administration skill.

**Core Knowledge Gained**:
- Mastered the fundamental concepts of Systemd Targets and Journalctl
- Configured and verified Systemd Targets and Journalctl components
- Troubleshot common Systemd Targets and Journalctl issues using systematic methods

**Practical Skills Acquired**:
- Configured systemd targets and journalctl from scratch in a lab environment
- Troubleshot systemd targets and journalctl failures using systematic approach
- Applied security hardening for systemd targets and journalctl
- Created automation scripts for systemd targets and journalctl management

**Enterprise Readiness**:
- Integrated systemd targets and journalctl with Ansible automation
- Solved production incident INC-1030
- Prepared for RHCSA/LFCS exam questions

**Chapter 30 Complete** - Chapter 31 is now unlocked.

---

## 28. Further Learning

### Official Documentation

- [Red Hat Enterprise Linux 9 Administration Guide](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/9)
- Linux man pages: `man systemd`
- The Linux Command Line by William Shotts (http://linuxcommand.org/tlcl.php)

### Study Schedule

| Day | Activity | Time |
|---|---|---|
| Day 1 | Read Sections 1-9 | 60 min |
| Day 2 | Complete Labs 1-2 | 90 min |
| Day 3 | Lab 3 + Beginner Project | 90 min |
| Day 4 | Review + Knowledge Check | 45 min |
| Day 5 | Proceed to Chapter 31 | - |

### Related Chapters

| Chapter | Topic | Relationship |
|---|---|---|
| Chapter 29 | Previous Topic | Foundation for this chapter |
| Chapter 31 | Next Topic | Builds on this chapter |
| Chapter 75 | Docker and Containers | Containerization context |
| Chapter 81 | Ansible Basics | Automate management |
| Chapter 85 | Capstone Project | Combine all skills |

---
*Chapter 30 of 85 | Linux System Administrator Master Course v2*