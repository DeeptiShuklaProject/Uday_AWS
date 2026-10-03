# Chapter 22 — AWS KMS (Key Management Service)

---

## Prerequisite Chapters
- Chapter 01 — AWS IAM (key policies, grants)
- Chapter 02 — Amazon S3 (SSE-KMS encryption)
- Chapter 06 — Amazon RDS (database encryption)

## Used In Production Practicals
- Practical 17 — Secure S3 + KMS
- Practical 03 — Secure Secrets
- Practical 15 — Flagship Production Architecture
- Every service that uses encryption at rest

---

## 1. Learning Objectives

By the end of this chapter, you will be able to:

1. **Explain** KMS key types, key policies, and envelope encryption.
2. **Create** Customer Managed Keys (CMKs) with proper key policies.
3. **Encrypt** data at rest for S3, EBS, RDS, and Secrets Manager.
4. **Implement** key rotation and cross-account key sharing.
5. **Configure** grants and ViaService conditions.
6. **Troubleshoot** KMS permission errors and throttling.
7. **Answer** interview questions about encryption and key management.

---

## 2. What is AWS KMS?

KMS is a managed service to create and control **encryption keys** used to protect your data across AWS services. Keys never leave KMS unencrypted — they're generated and used inside FIPS 140-2 validated hardware security modules (HSMs).

### Key Characteristics
- **Centralized key management** — create, rotate, disable, audit keys
- **Integrated with 100+ services** — S3, EBS, RDS, Lambda, Secrets Manager
- **Envelope encryption** — encrypt data keys, not your data directly
- **Audit trail** — every key usage logged in CloudTrail
- **FIPS 140-2 Level 2** — hardware-validated security

---

## 3. Why Do We Need It?

### Without KMS
```
Encryption keys stored in:
  - Application config files (exposed in git)
  - Environment variables (visible in console)
  - Separate key management system (complex, expensive)
  
Problems:
  - Key rotation is manual
  - No audit trail of key usage
  - Keys can be accidentally exposed
  - No centralized control
```

### With KMS
```
Keys managed centrally by AWS:
  - Never leave HSM unencrypted
  - Automatic rotation (annual)
  - Full audit trail in CloudTrail
  - Fine-grained access control via key policies
  - Integrated with every AWS service
```

---

## 4. Real-World Production Use Cases

### 1. S3 Data Encryption
All objects encrypted with SSE-KMS. Bucket policy denies unencrypted uploads. Audit who accessed which key via CloudTrail.

### 2. Database Encryption
RDS encrypted at rest with CMK. Snapshots automatically encrypted. Cross-region copy re-encrypts with destination region key.

### 3. Secrets Encryption
Secrets Manager encrypts all secrets with KMS. Separate key per application for blast radius isolation.

### 4. EBS Volume Encryption
All EBS volumes encrypted by default (account-level setting). Snapshots encrypted. AMIs encrypted.

---

## 5. Core Concepts

### Key Types

| Type | Managed By | Rotation | Cost | Use Case |
|------|-----------|----------|------|----------|
| **AWS Owned** | AWS (invisible to you) | AWS manages | Free | Default S3 encryption |
| **AWS Managed** | AWS (`aws/s3`, `aws/ebs`) | Annual, automatic | Free* | Service default encryption |
| **Customer Managed (CMK)** | You | Optional (annual) | $1/month/key | Fine-grained control |
| **Imported Key Material** | You provide key | Manual | $1/month | Regulatory requirement |

*Free for the key, but API calls are charged ($0.03/10,000 requests)

### Key Policy (THE Most Important Concept)

KMS keys have a **resource-based policy** (key policy) that is the PRIMARY authorization mechanism:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Enable root account access",
            "Effect": "Allow",
            "Principal": {"AWS": "arn:aws:iam::123456789012:root"},
            "Action": "kms:*",
            "Resource": "*"
        },
        {
            "Sid": "Allow key administrators",
            "Effect": "Allow",
            "Principal": {"AWS": "arn:aws:iam::123456789012:role/KeyAdminRole"},
            "Action": [
                "kms:Create*", "kms:Describe*", "kms:Enable*", "kms:List*",
                "kms:Put*", "kms:Update*", "kms:Revoke*", "kms:Disable*",
                "kms:Get*", "kms:Delete*", "kms:TagResource",
                "kms:ScheduleKeyDeletion", "kms:CancelKeyDeletion"
            ],
            "Resource": "*"
        },
        {
            "Sid": "Allow key usage",
            "Effect": "Allow",
            "Principal": {"AWS": "arn:aws:iam::123456789012:role/AppRole"},
            "Action": [
                "kms:Encrypt", "kms:Decrypt", "kms:ReEncrypt*",
                "kms:GenerateDataKey", "kms:DescribeKey"
            ],
            "Resource": "*"
        },
        {
            "Sid": "Allow cross-account access",
            "Effect": "Allow",
            "Principal": {"AWS": "arn:aws:iam::222222222222:root"},
            "Action": [
                "kms:Encrypt", "kms:Decrypt", "kms:GenerateDataKey", "kms:DescribeKey"
            ],
            "Resource": "*"
        }
    ]
}
```

**Critical**: Without the root account statement, you can lock yourself out of the key!

### Envelope Encryption
```
Problem: KMS can only encrypt up to 4 KB of data directly

Solution: Envelope Encryption
  1. Call kms:GenerateDataKey → KMS returns:
     a. Plaintext data key (use immediately, then discard)
     b. Encrypted data key (store alongside your data)
  2. Encrypt your data (any size) with the plaintext data key
  3. Delete plaintext data key from memory
  4. Store: encrypted data + encrypted data key

Decryption:
  1. Send encrypted data key to KMS → kms:Decrypt
  2. KMS returns plaintext data key
  3. Decrypt your data with the plaintext data key
  4. Delete plaintext data key from memory

Result: KMS never sees your data. Your data key is always encrypted at rest.
```

### Key Rotation
```
Automatic Rotation (CMK):
  - KMS generates new key material annually
  - Old key material preserved (for decrypting old data)
  - Key ID and ARN don't change (aliases still work)
  - Transparent to applications

Manual Rotation:
  - Create a new key
  - Update alias to point to new key
  - Old key used to decrypt old data
  - New key used for new encryption
```

### Grants
```
Grants = temporary, fine-grained permissions for a key

Use case: Allow EC2 to use the key only for encrypting EBS volumes
  → Create a grant with:
    - Grantee: ec2.amazonaws.com
    - Operations: Encrypt, Decrypt, GenerateDataKey
    - Constraints: EncryptionContext must match
```

---

## 6. Architecture

### KMS in Production Architecture

```mermaid
flowchart TD
    subgraph Apps["Applications"]
        EC2["EC2, App Server"]
        Lambda["Lambda, Function"]
        ECS["ECS, Container"]
    end
    
    subgraph KMS_Service["AWS KMS"]
        CMK["Customer Managed Key, $1/month + API calls"]
    end
    
    subgraph Encrypted["Encrypted Services"]
        S3["S3, SSE-KMS"]
        EBS["EBS, Encrypted Volumes"]
        RDS["RDS, Encrypted at Rest"]
        SM["Secrets Manager, Encrypted Secrets"]
    end
    
    Apps -->|kms:GenerateDataKey| CMK
    CMK -->|Data Key| Apps
    Apps -->|Encrypt data| Encrypted
    
    CloudTrail["CloudTrail, Key Usage Audit"]
    CMK -->|Log every call| CloudTrail
```

### KMS per Service Integration
```
S3:    Bucket → Default encryption → SSE-KMS → Key ARN
EBS:   Volume → Encryption → KMS Key
RDS:   Instance → Storage encryption → KMS Key (at creation only!)
SM:    Secret → Encryption key → KMS Key
EFS:   File system → Encryption → KMS Key
```

---

## 7. Important Components

### Key Aliases
```bash
# Alias = friendly name for a key (human-readable)
# Can point to only one key, can be updated
# Format: alias/my-key-name

aws kms create-alias --alias-name alias/prod-data --target-key-id $KEY_ID
aws kms update-alias --alias-name alias/prod-data --target-key-id $NEW_KEY_ID
```

### ViaService Condition
```json
{
    "Condition": {
        "StringEquals": {
            "kms:ViaService": "s3.ap-south-1.amazonaws.com"
        }
    }
}
// Key can only be used through S3, not directly
```

### S3 Bucket Key
```
Without Bucket Key:
  Each S3 PUT → KMS API call → GenerateDataKey
  1,000,000 objects → 1,000,000 KMS calls → $3,000

With Bucket Key:
  S3 generates a bucket-level key from KMS (one call)
  Uses bucket key to create per-object keys locally
  1,000,000 objects → ~1 KMS call → $0.003

Enable Bucket Key → save up to 99% on KMS costs for S3
```

---

## 8. How It Works

### Encrypt/Decrypt Flow
```
Encrypt (small data < 4 KB):
  App → kms:Encrypt(KeyId, Plaintext) → KMS returns CiphertextBlob

Decrypt:
  App → kms:Decrypt(CiphertextBlob) → KMS returns Plaintext
  (KMS determines which key was used from the ciphertext metadata)

Envelope Encrypt (large data):
  App → kms:GenerateDataKey(KeyId) → KMS returns {Plaintext, CiphertextBlob}
  App encrypts data with Plaintext key, stores CiphertextBlob
  App deletes Plaintext from memory
```

---

## 9. AWS Console Walkthrough

### Create a Customer Managed Key
1. **KMS Console** → **Create key**
2. **Key type**: Symmetric (encrypt/decrypt)
3. **Key usage**: Encrypt and decrypt
4. **Alias**: `prod-data-key`
5. **Key administrators**: Admin role
6. **Key users**: Application role
7. Click **Create key**

---

## 10. AWS CLI Commands

```bash
# Create key
KEY_ID=$(aws kms create-key \
    --description "Production data encryption key" \
    --key-usage ENCRYPT_DECRYPT \
    --query 'KeyMetadata.KeyId' --output text)

# Create alias
aws kms create-alias --alias-name alias/prod-data --target-key-id $KEY_ID

# Enable automatic rotation
aws kms enable-key-rotation --key-id $KEY_ID

# Verify rotation status
aws kms get-key-rotation-status --key-id $KEY_ID

# Encrypt data
aws kms encrypt --key-id alias/prod-data \
    --plaintext fileb://secret.txt \
    --output text --query CiphertextBlob | base64 --decode > encrypted.bin

# Decrypt data
aws kms decrypt --ciphertext-blob fileb://encrypted.bin \
    --output text --query Plaintext | base64 --decode > decrypted.txt

# Generate data key (envelope encryption)
aws kms generate-data-key --key-id alias/prod-data \
    --key-spec AES_256

# List keys
aws kms list-keys --query 'Keys[*].KeyId'

# Describe key
aws kms describe-key --key-id alias/prod-data

# Schedule key deletion (7-30 day waiting period)
aws kms schedule-key-deletion --key-id $KEY_ID --pending-window-in-days 30
```

### Python (Boto3)
```python
import boto3
import base64

kms = boto3.client('kms')

# Encrypt
response = kms.encrypt(
    KeyId='alias/prod-data',
    Plaintext=b'My secret data'
)
ciphertext = response['CiphertextBlob']

# Decrypt
response = kms.decrypt(CiphertextBlob=ciphertext)
plaintext = response['Plaintext']

# Generate data key (envelope encryption)
response = kms.generate_data_key(
    KeyId='alias/prod-data',
    KeySpec='AES_256'
)
plaintext_key = response['Plaintext']       # Use to encrypt, then delete
encrypted_key = response['CiphertextBlob']  # Store alongside encrypted data
```

---

## 11. Hands-On Practical

### Practical: End-to-End Encryption with KMS

#### Objective
Create a CMK, encrypt S3 objects, enforce encryption via bucket policy, and verify audit trail.

#### Step 1 — Create CMK
```bash
KEY_ID=$(aws kms create-key --description "S3 encryption key" --query 'KeyMetadata.KeyId' --output text)
aws kms create-alias --alias-name alias/s3-data --target-key-id $KEY_ID
aws kms enable-key-rotation --key-id $KEY_ID
```

#### Step 2 — Configure S3 Default Encryption
```bash
aws s3api put-bucket-encryption --bucket my-secure-bucket \
    --server-side-encryption-configuration '{
        "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "aws:kms", "KMSMasterKeyID": "alias/s3-data"}, "BucketKeyEnabled": true}]
    }'
```

#### Step 3 — Enforce Encryption via Bucket Policy
```bash
aws s3api put-bucket-policy --bucket my-secure-bucket --policy '{
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Deny", "Principal": "*", "Action": "s3:PutObject",
        "Resource": "arn:aws:s3:::my-secure-bucket/*",
        "Condition": {"StringNotEquals": {"s3:x-amz-server-side-encryption": "aws:kms"}}
    }]
}'
```

#### Validation
```bash
# Upload and verify encryption
aws s3 cp test.txt s3://my-secure-bucket/
aws s3api head-object --bucket my-secure-bucket --key test.txt \
    --query '{Encryption:ServerSideEncryption,KeyId:SSEKMSKeyId}'

# Check CloudTrail for key usage
aws cloudtrail lookup-events --lookup-attributes AttributeKey=ResourceType,AttributeValue=AWS::KMS::Key
```

---

## 12. Production Architecture

### Production KMS Configuration
```
Keys:
  - One CMK per application/data classification
  - Separate key admin and key user roles
  - Automatic rotation enabled
  - Alias for human-readable reference

Service Integration:
  S3:   SSE-KMS with Bucket Key enabled
  EBS:  Default encryption enabled at account level
  RDS:  Encrypted at creation (CMK)
  EFS:  Encrypted at creation (CMK)
  SM:   Per-secret CMK (optional, default: aws/secretsmanager)

Cross-account:
  - Key policy grants access to target account root
  - Target account IAM policy allows kms:Decrypt
  - Both must allow for cross-account to work
```

---

## 13. Security Best Practices

1. **Key policy least privilege** — separate key administrators from key users
2. **Always keep root account access** — prevents lockout from your own keys
3. **Enable automatic rotation** — rotates key material annually (old material preserved)
4. **Use aliases** — human-readable names, easy key swapping without code changes
5. **Use encryption context** — additional authentication data, logged in CloudTrail
6. **CMK per application/classification** — granular access control and blast radius
7. **ViaService conditions** — restrict key usage to specific AWS services only
8. **Enable CloudTrail** — all KMS API calls are logged for audit
9. **Never disable or delete without checking** — find all resources using the key first
10. **Use Bucket Key for S3** — reduces KMS calls by 99%, reduces cost significantly

---

## 14. High Availability

```
KMS Built-in HA:
  - KMS is a regional, managed service — multi-AZ by default
  - Key material stored in FIPS 140-2 Level 3 validated HSMs
  - Redundant copies across AZs within the region
  - No single AZ failure can cause key loss
  - 99.999999999% durability for key material

Availability Considerations:
  - KMS has request rate limits (per-second quotas)
  - Default: 5,500-30,000 requests/second (varies by operation and region)
  - Use data key caching to reduce dependency on KMS availability
  - Bucket Key reduces S3-to-KMS calls (availability improvement)
```

---

## 15. Scalability

```
Request Quotas:
  - Symmetric encrypt/decrypt: 5,500-30,000 req/sec (region-dependent)
  - GenerateDataKey: same shared quota as encrypt
  - Can request quota increase via AWS Support

Scaling Strategies:
  - S3 Bucket Key: reduces per-object KMS calls to per-bucket
  - Data key caching (AWS Encryption SDK): reuse data keys locally
  - Batch operations: encrypt/decrypt multiple items with same data key
  - Regional key replicas: Multi-Region keys reduce cross-region latency
```

---

## 16. Monitoring & Observability

```
CloudTrail (mandatory for KMS audit):
  - Every KMS API call logged: Encrypt, Decrypt, GenerateDataKey
  - Includes: who called, when, which key, encryption context
  - Use for: security audit, compliance, access investigation

CloudWatch Metrics:
  - None built-in for KMS (use CloudTrail + Athena for analytics)

Alarms to Set:
  - CloudTrail: alert on kms:DisableKey or kms:ScheduleKeyDeletion
  - CloudTrail: alert on kms:PutKeyPolicy changes
  - CloudTrail: alert on unauthorized kms:Decrypt attempts (AccessDenied)
  - Custom metric: track KMS API call rates (prevent throttling)
```

---

## 17. Cost Optimization

```
KMS Pricing:
  - Customer Managed Key: $1/month/key
  - AWS Managed Key: free (for the key itself)
  - API calls: $0.03 per 10,000 requests
  - Multi-Region replica keys: $1/month per replica

Cost Reduction:
  ✅ S3 Bucket Key: reduces API calls by 99% (biggest cost saver)
  ✅ Data key caching: reuse data keys, fewer GenerateDataKey calls
  ✅ Consolidate keys: don't create unnecessary keys
  ✅ AWS Managed keys for services where CMK control isn't needed
  ✅ Monitor API call volume: CloudTrail → identify excessive calls
```

---

## 18. Disaster Recovery

```
Key Durability:
  - KMS key material is regionally redundant (multi-AZ)
  - Cannot export AWS-generated key material
  - Deleted keys are gone FOREVER after waiting period

DR Strategies:
  - Multi-Region keys: same key material replicated across regions
    → encrypt in us-east-1, decrypt in eu-west-1 with same key
  - Cross-region snapshot copy: KMS re-encrypts with target region key
  - Imported key material: you control backup (but you manage durability)

Key Deletion Protection:
  - 7-30 day mandatory waiting period
  - Disable key instead of deleting (reversible)
  - CloudTrail alert on ScheduleKeyDeletion
  - Tag keys with "CanDelete: false" for critical keys
```

---

## 19. Troubleshooting

### Problem 1: "AccessDeniedException" on kms:Decrypt
```
Authorization check:
  1. Key policy allows the caller? (REQUIRED — always checked)
  2. IAM policy allows kms:Decrypt? (checked if key policy delegates to IAM)
  3. Cross-account? BOTH key policy AND IAM must allow
  4. KMS ViaService condition restricts to specific service?
  5. Encryption context matches? (if condition on grant)
```

### Problem 2: KMS Throttling (ThrottlingException)
```
Default limits:
  - Symmetric: 5,500-30,000 requests/sec (varies by region)
  
Solutions:
  - Enable S3 Bucket Key (reduces calls by 99%)
  - Use data key caching (AWS Encryption SDK)
  - Request limit increase via AWS Support
```

### Problem 3: Can't Delete a KMS Key
```
KMS keys have mandatory 7-30 day waiting period before deletion
  - During wait: key is disabled (can't encrypt/decrypt)
  - Cancel: aws kms cancel-key-deletion --key-id KEY_ID
  - After wait: key material deleted permanently

If you delete a key used by existing encrypted data → DATA IS UNRECOVERABLE
```

---

## 20. Common Production Problems

| # | Problem | Root Cause | Prevention |
|---|---------|------------|------------|
| 1 | AccessDenied on decrypt | Key policy doesn't allow caller | Check key policy + IAM |
| 2 | KMS throttling | Too many API calls | Enable Bucket Key, cache data keys |
| 3 | Can't encrypt RDS after creation | Encryption must be set at creation | Always encrypt at creation |
| 4 | Cross-account decrypt fails | Only key policy set, not IAM | Both key policy AND IAM required |
| 5 | Deleted key, lost data | Key deleted after waiting period | Disable (don't delete) unless certain |
| 6 | High KMS costs | Per-API-call charging | Bucket Key, data key caching |
| 7 | Key rotation confusion | Old data uses old key material | Old material preserved automatically |
| 8 | Locked out of key | Removed root account from key policy | Always keep root access statement |

---

## 21. Real-World Scenario

### Scenario: Cross-Account Encrypted S3 Data Sharing

**Setup**: Account A has encrypted S3 data (CMK). Account B needs to read it.

**Solution**:
1. Account A: update KMS key policy → allow Account B root to Decrypt
2. Account B: create IAM policy → allow kms:Decrypt on Account A's key ARN
3. Account B: create IAM policy → allow s3:GetObject on Account A's bucket
4. Account A: update S3 bucket policy → allow Account B's role to GetObject

**Both** KMS key policy AND IAM policy must allow, **plus** S3 bucket policy.

---

## 22. Interview Questions

### Basic Questions (10)

**Q1: What is AWS KMS?**
A: KMS is a managed service for creating and controlling encryption keys. Keys are stored in hardware security modules (HSMs). Used to encrypt data across 100+ AWS services.

**Q2: What is the difference between AWS Managed and Customer Managed keys?**
A: AWS Managed (aws/s3, aws/ebs): AWS creates and manages, auto-rotates, free for the key. Customer Managed: you create, you set key policy, optional rotation, $1/month. Use CMK for fine-grained control and cross-account sharing.

**Q3: What is envelope encryption?**
A: KMS generates a data key. You encrypt your data with the data key. KMS encrypts the data key. Store: encrypted data + encrypted data key. KMS never sees your actual data.

**Q4: Why can't you directly encrypt large data with KMS?**
A: KMS has a 4 KB limit for direct encryption. Envelope encryption solves this: KMS encrypts a small data key, and you use that key to encrypt data of any size locally.

**Q5: What is a key policy?**
A: A resource-based policy attached to a KMS key. It's the PRIMARY authorization mechanism. Even if an IAM policy allows access, if the key policy doesn't, access is denied.

**Q6: What happens when you rotate a KMS key?**
A: New key material is generated. Old key material is preserved for decrypting existing data. The key ID and ARN don't change. Applications use the same alias. Rotation is transparent.

**Q7: How does S3 use KMS for encryption?**
A: SSE-KMS: S3 calls KMS to generate a data key for each object. The data key encrypts the object. The encrypted data key is stored as object metadata. On GET, S3 calls KMS to decrypt the data key.

**Q8: What is a KMS alias?**
A: A friendly name for a key (e.g., alias/prod-data). Points to one key ID. Can be updated to point to a different key (useful for manual key rotation).

**Q9: What is the S3 Bucket Key feature?**
A: S3 generates a bucket-level data key from KMS (one API call). Uses it to create per-object keys locally. Reduces KMS API calls by up to 99%, saving significant cost.

**Q10: Can you delete a KMS key immediately?**
A: No. There's a mandatory 7-30 day waiting period (configurable). During this period, the key is disabled. You can cancel deletion. After the period, key material is permanently deleted — any data encrypted with it is unrecoverable.

### Intermediate Questions (10)

**Q11: How does cross-account KMS access work?**
A: Two-step: 1) Key policy in Account A must allow the principal in Account B. 2) IAM policy in Account B must allow kms:Decrypt on Account A's key ARN. Both must allow.

**Q12: What is the difference between key policy and IAM policy for KMS?**
A: Key policy is always evaluated (primary). IAM policy is only evaluated if the key policy delegates to IAM (the root account statement enables this). Without the root statement, IAM policies are ignored.

**Q13: What is encryption context?**
A: Key-value pairs provided during encrypt/decrypt. They must match exactly for decryption. Logged in CloudTrail. Use for additional authorization and audit. Example: {"department": "finance"}.

**Q14: How do you encrypt an existing unencrypted EBS volume?**
A: Create snapshot → copy snapshot with encryption → create volume from encrypted snapshot. Or use `aws ec2 create-snapshot` → `aws ec2 copy-snapshot --encrypted` → `aws ec2 create-volume`.

**Q15: Can you change the KMS key used by RDS?**
A: No. RDS encryption key is set at creation and cannot be changed. To change: take snapshot → copy snapshot with new key → restore from copy.

**Q16: What is the difference between KMS grants and key policies?**
A: Key policies are static, resource-based policies that define long-term access to a key. Grants are programmatic, temporary delegations created with `CreateGrant` — ideal for AWS services (EBS, RDS) that need short-lived access on your behalf. Grants can be retired or revoked without editing the key policy, and they support grant constraints (encryption context). Use key policies for standing access, grants for dynamic, scoped delegation.

**Q17: When would you use asymmetric keys instead of symmetric keys?**
A: Symmetric keys (AES-256) never leave KMS and are used for most encryption (S3, EBS, RDS). Asymmetric keys (RSA, ECC) have a downloadable public key — use them when: 1) external parties without AWS credentials must encrypt data for you, 2) you need digital signatures (`Sign`/`Verify`) for code signing or JWTs, 3) you need key agreement (ECDH). Asymmetric keys do not support automatic rotation and cannot be used with most AWS service integrations.

**Q18: What are multi-Region keys?**
A: A set of interoperable keys in different Regions with the same key ID and key material. Data encrypted in us-east-1 can be decrypted in eu-west-1 by the replica key without a cross-Region call. Use for: DR, global DynamoDB tables, client-side encryption across Regions. Each replica has its own key policy. They are not global keys — you create a primary and explicitly replicate it.

**Q19: How does KMS integrate with CloudTrail?**
A: Every KMS API call (Encrypt, Decrypt, GenerateDataKey, CreateGrant, ScheduleKeyDeletion) is logged in CloudTrail with the caller identity, key ARN, encryption context, and source IP. Use it to audit who decrypted what, detect anomalous usage, and alert on dangerous actions (e.g., EventBridge rule on `ScheduleKeyDeletion` or `DisableKey`). Encryption context appears in plaintext in logs, so never put secrets in it.

**Q20: What is a custom key store and when do you need one?**
A: A custom key store backs KMS keys with key material held in your own AWS CloudHSM cluster (or an external key manager via XKS). Use when regulations require single-tenant HSMs under your exclusive control (FIPS 140-2 Level 3 with dedicated hardware) or keys held outside AWS. Trade-offs: higher cost (minimum 2 HSMs), you manage HSM availability, and no automatic rotation.

### Advanced Questions (10)

**Q21: Design a KMS key strategy for a multi-account organization.**
A: Central security account owns CMKs. Per-application keys (blast radius). Key policies grant access to specific workload accounts. Automatic rotation. CloudTrail logs all usage. AWS Config rule ensures encryption is enabled.

**Q22: Explain envelope encryption and how you would implement it.**
A: KMS `Encrypt` is limited to 4 KB, so large data uses envelope encryption: 1) Call `GenerateDataKey` — KMS returns a plaintext data key and the same key encrypted under your CMK. 2) Encrypt data locally with the plaintext key (AES-GCM). 3) Discard the plaintext key from memory. 4) Store the encrypted data key alongside the ciphertext. To decrypt: call KMS `Decrypt` on the encrypted data key, then decrypt data locally. The AWS Encryption SDK implements this with data key caching.

**Q23: Your application is getting ThrottlingException from KMS at scale. How do you fix it?**
A: KMS has per-account, per-Region request quotas (5,500–100,000 rps depending on Region and operation). Fixes: 1) Enable S3 Bucket Keys to cut S3-driven calls by ~99%. 2) Use data key caching in the Encryption SDK. 3) Add exponential backoff with jitter. 4) Spread load across keys/Regions if needed. 5) Request a quota increase via Service Quotas. Monitor with the CloudWatch `ThrottleCount` metric.

**Q24: Someone edited a key policy and now nobody can manage the key. How do you recover?**
A: If the policy removed the root account statement and all admin principals, the key becomes unmanageable. Recovery requires opening a case with AWS Support, who can restore access after verifying account ownership. Prevention: always keep the `arn:aws:iam::<account>:root` statement, use the `BypassPolicyLockoutSafetyCheck=false` default, and manage key policies through IaC with code review.

**Q25: When would you use BYOK (imported key material)?**
A: When compliance requires keys generated in your own on-premises HSM, or you need the ability to delete key material instantly (`DeleteImportedKeyMaterial`) and re-import later. Trade-offs: you are responsible for durability of the original material (AWS cannot recover it), no automatic rotation, and you can set an expiration date. Process: create key with origin EXTERNAL → get wrapping public key and import token → wrap material → `ImportKeyMaterial`.

**Q26: For DR, should you use separate per-Region CMKs or multi-Region keys?**
A: Per-Region CMKs: stronger isolation, but every cross-Region copy (snapshots, S3 replication) must re-encrypt with the destination key. Multi-Region keys: data encrypted in the primary Region decrypts directly in the DR Region — simpler for client-side encrypted data and global tables. Choose multi-Region keys when application-level ciphertext must move between Regions; per-Region keys are fine for AWS-service-managed encryption that re-encrypts on copy.

**Q27: How do you manage KMS keys with Terraform safely?**
A: Use `aws_kms_key` with `enable_key_rotation = true`, `deletion_window_in_days = 30`, and an explicit `policy` that includes the root account and a key-admin role. Add `aws_kms_alias` for a stable name. Set `lifecycle { prevent_destroy = true }` to block accidental `terraform destroy`. Reference keys by alias or ARN in other modules, and keep key definitions in a separate state from workloads.

**Q28: How does KMS help meet regulatory compliance (PCI DSS, HIPAA)?**
A: KMS HSMs are FIPS 140-2 validated (Level 3 in most Regions). It provides: centralized key management, automatic annual rotation, separation of duties (key admins vs key users in key policy), full audit trail via CloudTrail, and enforced deletion waiting periods. Pair with AWS Config rules (`kms-cmk-not-scheduled-for-deletion`, encryption-enabled rules) and Audit Manager for evidence.

**Q29: What is the difference between AWS managed keys and customer managed keys?**
A: AWS managed keys (`aws/s3`, `aws/rds`) are created automatically, rotate yearly, and their policies cannot be edited — so you cannot share them cross-account or restrict usage. Customer managed keys give full control: custom key policies, grants, cross-account access, configurable rotation, disabling and deletion. Use customer managed keys for production and any cross-account scenario.

**Q30: How would you enforce that all new S3 objects use a specific KMS key?**
A: 1) Set bucket default encryption to SSE-KMS with the key ARN and enable Bucket Key. 2) Add a bucket policy that denies `s3:PutObject` when `s3:x-amz-server-side-encryption-aws-kms-key-id` does not equal your key ARN. 3) Use an SCP or Config rule to detect buckets without SSE-KMS. This prevents uploads with a different key or SSE-S3.

### Scenario-Based Questions (10)

**Q31: A developer accidentally deleted a KMS key. How do you recover?**
A: If within the waiting period (7-30 days): `aws kms cancel-key-deletion`. If past the waiting period: key material is permanently gone — data encrypted with it is unrecoverable. Prevention: remove ScheduleKeyDeletion permission from non-admin roles.

**Q32: A Lambda function gets AccessDeniedException calling kms:Decrypt. How do you troubleshoot?**
A: Check in order: 1) Key policy — does it allow the Lambda execution role (or delegate to IAM via the root statement)? 2) IAM policy on the role — does it allow `kms:Decrypt` on the key ARN? 3) Encryption context — does the call pass the same context used at encryption? 4) Is the key disabled or pending deletion? 5) Any SCP or VPC endpoint policy denying KMS? CloudTrail's `errorMessage` for the failed Decrypt event usually tells you which layer denied it.

**Q33: Your KMS bill jumped 10x this month. How do you investigate?**
A: Use Cost Explorer filtered on KMS by usage type to confirm it is request cost. Then query CloudTrail (Athena or CloudTrail Lake) grouping KMS events by `eventName`, `userIdentity`, and key ARN. Common causes: S3 without Bucket Keys on a high-volume bucket, a Lambda calling Decrypt on every invocation without caching, or a retry loop. Fix with Bucket Keys, data key caching, and caching decrypted secrets.

**Q34: You need to move encrypted EBS snapshots to another Region. How?**
A: KMS keys are Regional, so you must re-encrypt: `aws ec2 copy-snapshot --source-region us-east-1 --kms-key-id <dest-region-key> --encrypted`. The copy is decrypted with the source key and re-encrypted with the destination key. The calling role needs Decrypt on the source key and Encrypt/GenerateDataKey/CreateGrant on the destination key. For cross-account, share the source key with the target account first.

**Q35: Decrypt fails with InvalidCiphertextException but permissions look correct. What is wrong?**
A: Most often an encryption context mismatch — the context at decrypt must exactly match (keys and values, case-sensitive) what was used at encrypt. Other causes: ciphertext was corrupted (e.g., base64 encoding issues), or it was encrypted under a different key/Region. Compare the encryption context in the Encrypt and Decrypt CloudTrail events to spot the difference.

**Q36: An auditor asks who decrypted customer data in the last 90 days. How do you answer?**
A: Query CloudTrail for `Decrypt` and `GenerateDataKey` events on the relevant key ARN. With CloudTrail Lake or Athena over S3 logs, filter by `resources.ARN` and time range, and group by `userIdentity.arn`. If encryption context includes identifiers (e.g., `tenantId`), you can report per-customer access. Export results as audit evidence.

**Q37: A key was disabled and production broke. How do you prevent this?**
A: Immediately re-enable with `aws kms enable-key`. Prevention: restrict `kms:DisableKey` and `kms:ScheduleKeyDeletion` to a small break-glass admin role; add an SCP denying them for everyone else; create EventBridge rules alerting on these API calls; and use the CloudWatch metric/alarm for usage attempts on disabled keys.

**Q38: How do you rotate to a completely new KMS key (not automatic rotation)?**
A: Create the new key → update the alias to point to the new key ID (apps using the alias pick it up for new encryption) → keep the old key enabled so existing ciphertext can still be decrypted → optionally re-encrypt existing data with `ReEncrypt` or a batch job → once nothing references the old key (check CloudTrail), disable it, then schedule deletion.

**Q39: A partner account needs to read objects in your SSE-KMS encrypted bucket. What do you configure?**
A: Three things: 1) Bucket policy allowing the partner role `s3:GetObject`. 2) KMS key policy allowing the partner account `kms:Decrypt` (on a customer managed key — AWS managed `aws/s3` cannot be shared). 3) In the partner account, an IAM policy granting the role both `s3:GetObject` and `kms:Decrypt` on your key ARN.

**Q40: How do you detect resources that are not encrypted with KMS across your organization?**
A: Enable AWS Config with an organization aggregator and managed rules such as `s3-bucket-server-side-encryption-enabled`, `encrypted-volumes`, `rds-storage-encrypted`, and `cloudtrail-encryption-enabled`. Feed findings into Security Hub. Remediate with SSM Automation, and prevent new unencrypted resources with SCPs (e.g., deny `ec2:CreateVolume` when `ec2:Encrypted` is false).

---

## 23. Scenario-Based Interview Questions

*(Covered in section 22 above — Q31 through Q40)*

---

## 24. Common Mistakes

1. **Removing root from key policy** — locks you out of the key
2. **Not enabling rotation** — compliance requirement in most organizations
3. **Using AWS Managed keys for cross-account** — can't share, use CMK
4. **Deleting keys** — disable instead of delete unless absolutely certain
5. **No Bucket Key for S3** — paying 100x more KMS API costs
6. **Same key for everything** — use separate keys per application/classification
7. **Not checking key policy** — IAM alone doesn't grant KMS access
8. **Encrypting RDS after creation** — must be set at creation time

---

## 25. Production Checklist

- [ ] CMK created for each application/data classification
- [ ] Key policy has root account access (prevent lockout)
- [ ] Key admin and key user roles separated
- [ ] Automatic rotation enabled on all CMKs
- [ ] Key aliases created for human readability
- [ ] S3 Bucket Key enabled (cost optimization)
- [ ] EBS default encryption enabled at account level
- [ ] RDS encryption enabled at creation
- [ ] CloudTrail logging all KMS API calls
- [ ] Cross-account key policies configured (if needed)
- [ ] Key deletion prevention (remove ScheduleKeyDeletion from non-admins)

---

## 26. Chapter Summary

KMS is the encryption foundation of AWS. Key takeaways:

1. **Customer Managed Keys for production** — $1/month, full control, audit trail
2. **Envelope encryption** — KMS encrypts data keys, you encrypt data
3. **Key policy is PRIMARY** — must allow access even if IAM allows
4. **Root account in key policy** — never remove (lockout risk)
5. **S3 Bucket Key** — reduces KMS API costs by up to 99%
6. **Automatic rotation** — transparent, old data still decryptable
7. **Cross-account = key policy + IAM** — both must allow
8. **Never delete keys hastily** — disable first, delete only when certain
9. **Separate keys per application** — blast radius isolation
10. **CloudTrail audits every key usage** — who decrypted what, when

---
---

# 🔬 Practical Lab 29 — KMS Encryption Architecture

## Lab Overview
| Item | Detail |
|------|--------|
| **Difficulty** | Intermediate |
| **Duration** | 25 minutes |
| **Cost** | $1/key/month |
| **Prerequisites** | Practical 23 (S3), Practical 16 (RDS) |
| **Lab Environment** | Environment 7 — Storage & Security |

### Step 1 — Create Customer Managed Key (CMK)
1. **KMS** → **Create key**
   - **Type**: Symmetric
   - **Alias**: `prod-data-key`
   - **Key admin**: Your admin user
   - **Key usage**: EC2 role, RDS service

📸 **Screenshot 01** — CMK Created
> **Verify**: Key shows "Enabled", alias "prod-data-key"

### Step 2 — Encrypt S3 Bucket with CMK
1. Bucket → **Properties** → **Default encryption** → SSE-KMS → Select `prod-data-key`

📸 **Screenshot 02** — S3 Using CMK Encryption
> **Verify**: Default encryption shows KMS with your key ARN

### Step 3 — Encrypt EBS Volume with CMK
```bash
aws ec2 create-volume --size 10 --volume-type gp3 \
    --encrypted --kms-key-id alias/prod-data-key \
    --availability-zone ap-south-1a
```

📸 **Screenshot 03** — Encrypted EBS Volume
> **Verify**: Encryption shows "Enabled", KMS key shows "prod-data-key"

🎯 **Interview Insight**: "AWS Managed Key vs Customer Managed Key?"
> **Strong answer**: "AWS Managed: free, auto-rotated yearly, can't control policy. Customer Managed: $1/month, you control the key policy (who can use/administer), configurable rotation, cross-account sharing, can disable/delete. Use CMK for compliance and multi-account architectures."
