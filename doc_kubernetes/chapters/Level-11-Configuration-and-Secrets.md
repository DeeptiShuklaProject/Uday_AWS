# Level 11 — Configuration Management: ConfigMaps & Secrets

---

## Module Metadata

| Property | Value |
| :--- | :--- |
| **Difficulty** | Intermediate |
| **Theory Duration** | 4 hours |
| **Practical Duration** | 4 hours |
| **Prerequisites** | Level 10 — Kubernetes Storage |
| **Lab Required** | Yes — Any running Kubernetes cluster |
| **Interview Importance** | ⭐⭐⭐⭐⭐ (5/5) |
| **Industry Importance** | ⭐⭐⭐⭐⭐ (5/5) |
| **Certification Alignment** | CKA, CKAD (Application Configuration — 18% of CKAD), CKS |

---

## Learning Objectives

After completing this module, the learner will be able to:

1. Create and manage ConfigMaps using literals, files, and directories.
2. Inject ConfigMaps into Pods as environment variables and volume mounts.
3. Create and manage Kubernetes Secrets with different types.
4. Understand Secret encoding, encryption at rest, and security limitations.
5. Integrate with AWS Secrets Manager using the External Secrets Operator.
6. Implement configuration hot-reloading without Pod restarts.

---

## 1. ConfigMap — Non-Sensitive Configuration

### 1.1 Concept

**Simple Analogy:** A ConfigMap is like a settings file that your application reads at startup. Instead of baking settings into the container image, you provide them externally so the same image works across dev, staging, and production.

### 1.2 Creating ConfigMaps

```bash
# ─── From Literals ──────────────────────────────────────────
kubectl create configmap app-config \
  --from-literal=DB_HOST=postgres.production.svc.cluster.local \
  --from-literal=DB_PORT=5432 \
  --from-literal=LOG_LEVEL=info \
  --from-literal=CACHE_TTL=300

# ─── From a File ────────────────────────────────────────────
# Create a config file
cat > app.properties << 'EOF'
database.host=postgres.production.svc
database.port=5432
database.pool.size=10
cache.ttl.seconds=300
log.level=info
EOF

kubectl create configmap app-file-config --from-file=app.properties

# ─── From a Directory (all files become keys) ───────────────
mkdir -p config/
echo "upstream backend { server backend:8080; }" > config/upstream.conf
echo "server_name app.example.com;" > config/server-name.conf

kubectl create configmap nginx-config --from-file=config/

# ─── From YAML (Declarative) ────────────────────────────────
```

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production
data:
  # Simple key-value pairs
  DB_HOST: "postgres.production.svc.cluster.local"
  DB_PORT: "5432"
  LOG_LEVEL: "info"
  CACHE_TTL: "300"

  # Multi-line configuration file
  nginx.conf: |
    server {
      listen 80;
      server_name app.example.com;

      location / {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
      }

      location /health {
        return 200 'OK';
      }
    }

  # JSON configuration
  app-config.json: |
    {
      "database": {
        "host": "postgres.production.svc",
        "port": 5432,
        "poolSize": 10
      },
      "cache": {
        "ttl": 300,
        "enabled": true
      }
    }
```

### 1.3 Using ConfigMap as Environment Variables

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-env-demo
spec:
  containers:
  - name: app
    image: myapp:v1.0
    env:
    # Individual keys
    - name: DATABASE_HOST
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: DB_HOST
    - name: DATABASE_PORT
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: DB_PORT

    # OR: Load ALL keys as environment variables at once
    envFrom:
    - configMapRef:
        name: app-config
        # All keys become env vars: DB_HOST, DB_PORT, LOG_LEVEL, etc.
```

### 1.4 Using ConfigMap as Volume Mount

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-volume-demo
spec:
  containers:
  - name: nginx
    image: nginx:1.25-alpine
    volumeMounts:
    - name: nginx-config
      mountPath: /etc/nginx/conf.d/     # Mount directory
      readOnly: true
    - name: app-json-config
      mountPath: /app/config/app.json   # Mount single file
      subPath: app-config.json          # Use subPath to mount as file, not directory
      readOnly: true
  volumes:
  - name: nginx-config
    configMap:
      name: app-config
      items:                             # Select specific keys
      - key: nginx.conf
        path: default.conf              # Rename the file
  - name: app-json-config
    configMap:
      name: app-config
```

### 1.5 Hot-Reloading ConfigMaps

```
Method 1: Volume Mount (auto-updates)
  • ConfigMap mounted as a volume is auto-updated by kubelet (60-90 seconds).
  • Application MUST watch for file changes (inotify) and reload.
  • Works automatically for nginx (after signal) and some frameworks.

Method 2: Environment Variable (NO auto-update)
  • ConfigMap as env vars is set at container start and NEVER changes.
  • Pod must be restarted for env var changes to take effect.
  • Use: kubectl rollout restart deployment <name>

Recommendation: Use volume mounts for config files that need hot-reloading.
                Use env vars for simple settings that rarely change.
```

---

## 2. Secrets — Sensitive Configuration

### 2.1 Concept

A **Secret** is like a ConfigMap but intended for sensitive data (passwords, API keys, TLS certificates). Kubernetes provides additional protections:
- Base64 encoded (not encrypted by default).
- Can be encrypted at rest in etcd (with EncryptionConfiguration).
- Access controlled via RBAC.
- Not printed in `kubectl describe pod` output.

### 2.2 Secret Types

| Type | Purpose | Example |
| :--- | :--- | :--- |
| `Opaque` (default) | Arbitrary key-value data | Database passwords, API keys |
| `kubernetes.io/tls` | TLS certificate + private key | HTTPS certificates |
| `kubernetes.io/dockerconfigjson` | Container registry credentials | ECR/Docker Hub pull secrets |
| `kubernetes.io/basic-auth` | Username + password | Basic authentication |
| `kubernetes.io/ssh-auth` | SSH private key | Git SSH keys |
| `kubernetes.io/service-account-token` | ServiceAccount token | Auto-generated by K8s |

### 2.3 Creating Secrets

```bash
# ─── Opaque Secret (Generic) ────────────────────────────────
kubectl create secret generic db-credentials \
  --from-literal=username=admin \
  --from-literal=password='S3cr3tP@ssw0rd!'

# ─── TLS Secret ─────────────────────────────────────────────
kubectl create secret tls app-tls \
  --cert=tls.crt \
  --key=tls.key

# ─── Docker Registry Secret ─────────────────────────────────
kubectl create secret docker-registry ecr-secret \
  --docker-server=123456789012.dkr.ecr.us-east-1.amazonaws.com \
  --docker-username=AWS \
  --docker-password=$(aws ecr get-login-password --region us-east-1)
```

```yaml
# Declarative Secret (values must be base64 encoded)
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
  namespace: production
type: Opaque
data:
  username: YWRtaW4=                    # echo -n "admin" | base64
  password: UzNjcjN0UEBzc3cwcmQh        # echo -n "S3cr3tP@ssw0rd!" | base64

# Alternative: Use stringData (plaintext — K8s encodes it for you)
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
stringData:                              # Plaintext (auto-encoded to base64)
  username: admin
  password: S3cr3tP@ssw0rd!
```

### 2.4 Using Secrets in Pods

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-with-secrets
spec:
  containers:
  - name: app
    image: myapp:v1.0

    # Method 1: As environment variables
    env:
    - name: DB_USERNAME
      valueFrom:
        secretKeyRef:
          name: db-credentials
          key: username
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-credentials
          key: password

    # Method 2: As volume mount (files)
    volumeMounts:
    - name: db-creds
      mountPath: /etc/secrets
      readOnly: true
    # Creates files:
    # /etc/secrets/username  (containing "admin")
    # /etc/secrets/password  (containing "S3cr3tP@ssw0rd!")

  # Image pull from private registry
  imagePullSecrets:
  - name: ecr-secret

  volumes:
  - name: db-creds
    secret:
      secretName: db-credentials
      defaultMode: 0400               # Read-only by owner (restrictive permissions)
```

### 2.5 Security Considerations

```
┌──────────────────────────────────────────────────────────────────────────┐
│                 Kubernetes Secrets — Security Reality                     │
│                                                                          │
│  ⚠️  Base64 is NOT encryption. Anyone with access can decode:            │
│      echo "UzNjcjN0UEBzc3cwcmQh" | base64 -d                           │
│      → S3cr3tP@ssw0rd!                                                  │
│                                                                          │
│  ⚠️  Secrets are stored in plain base64 in etcd by default.             │
│                                                                          │
│  ✅  To secure Secrets:                                                  │
│     1. Enable encryption at rest (EncryptionConfiguration)               │
│     2. Restrict RBAC: only allow specific ServiceAccounts to read        │
│     3. Use External Secrets Operator + AWS Secrets Manager               │
│     4. Enable audit logging to track Secret access                       │
│     5. Avoid storing secrets in YAML manifests in Git                    │
│     6. Consider Sealed Secrets or SOPS for GitOps                        │
│                                                                          │
│  🛡️  AWS EKS encrypts etcd by default using AWS-managed KMS keys.       │
│      You can also use your own KMS key (customer-managed).               │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.6 Encryption at Rest

```yaml
# /etc/kubernetes/enc/encryption-config.yaml (kubeadm clusters)
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
- resources:
  - secrets
  providers:
  - aescbc:                             # AES-CBC encryption
      keys:
      - name: key1
        secret: <base64-encoded-32-byte-key>
  - identity: {}                        # Fallback: plaintext (for reading old secrets)

# On EKS: Encryption is managed by AWS. Enable with:
# aws eks create-cluster ... --encryption-config '[{"resources":["secrets"],"provider":{"keyArn":"arn:aws:kms:..."}}]'
```

---

## 3. External Secrets Operator (ESO)

### 3.1 Why External Secrets?

| Problem | Solution |
| :--- | :--- |
| K8s Secrets stored in Git as base64 (insecure) | ESO syncs secrets from external stores |
| Manual secret rotation requires Pod restarts | ESO auto-syncs on schedule (e.g., every 1 hour) |
| No centralized secret management | AWS Secrets Manager / HashiCorp Vault as source of truth |
| No audit trail for secret access | Cloud provider audit logs track access |

### 3.2 Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                  External Secrets Operator                      │
│                                                                │
│  ┌──────────────────┐        ┌─────────────────────────────┐  │
│  │ ExternalSecret   │        │ External Secrets Operator    │  │
│  │ (K8s CRD)       │───────►│ (Controller running in       │  │
│  │                  │        │  kube-system)                │  │
│  │ Defines:        │        │                             │  │
│  │ - Secret store  │        │ Periodically syncs:         │  │
│  │ - Refresh rate  │        │ Reads from Secrets Manager  │  │
│  │ - Key mapping   │        │ Creates/updates K8s Secret  │  │
│  └──────────────────┘        └──────────────┬──────────────┘  │
│                                             │                  │
│                                             ▼                  │
│                              ┌──────────────────────────────┐ │
│                              │ AWS Secrets Manager           │ │
│                              │ (Source of truth)             │ │
│                              │                              │ │
│                              │ Secret: prod/db-credentials  │ │
│                              │ {"username":"admin",         │ │
│                              │  "password":"S3cr3tP@ss"}    │ │
│                              └──────────────────────────────┘ │
│                                             │                  │
│                              ┌──────────────▼──────────────┐  │
│                              │ Kubernetes Secret            │  │
│                              │ (Auto-created by ESO)        │  │
│                              │ name: db-credentials         │  │
│                              │ data:                        │  │
│                              │   username: YWRtaW4=         │  │
│                              │   password: UzNjcjN0UEBzcw== │  │
│                              └──────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### 3.3 ESO Configuration

```yaml
# Step 1: SecretStore (defines which external secret provider to use)
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: aws-secrets-manager
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
            namespace: kube-system
---
# Step 2: ExternalSecret (defines WHICH secret to sync)
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
  namespace: production
spec:
  refreshInterval: 1h                   # Sync from AWS every 1 hour
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: db-credentials                 # Name of the K8s Secret to create
    creationPolicy: Owner                # ESO manages the K8s Secret lifecycle
  data:
  - secretKey: username                  # Key in K8s Secret
    remoteRef:
      key: prod/db-credentials           # Secret name in AWS Secrets Manager
      property: username                 # JSON property within the secret
  - secretKey: password
    remoteRef:
      key: prod/db-credentials
      property: password
```

---

## 4. Environment Variables vs Volume Mounts

| Property | Environment Variables | Volume Mounts |
| :--- | :--- | :--- |
| **Update behavior** | NOT updated (set at container start) | Auto-updated by kubelet (~60-90s) |
| **Visible in** | `kubectl describe pod`, `docker inspect`, `/proc/PID/environ` | Files on filesystem (can set permissions) |
| **Format** | Simple key-value strings | Files (support complex configs, multi-line) |
| **Best for** | Simple settings (DB_HOST, PORT) | Config files (nginx.conf, app.yaml) |
| **Security** | Visible in process listing | Can set `defaultMode: 0400` for restricted access |

**Recommendation:**
- Use **env vars** for simple, atomic settings.
- Use **volume mounts** for complex config files and secrets that need hot-reloading.
- Use **volume mounts with restrictive permissions** for secrets.

---

## 5. Hands-On Lab

### Lab 11.1: ConfigMaps and Secrets

```bash
kubectl create namespace lab-11

# Create ConfigMap
kubectl create configmap app-settings \
  --from-literal=APP_ENV=production \
  --from-literal=LOG_LEVEL=info \
  --from-literal=MAX_CONNECTIONS=100 \
  -n lab-11

# Create Secret
kubectl create secret generic app-secrets \
  --from-literal=DB_PASSWORD='MyS3cretP@ss' \
  --from-literal=API_KEY='ak-123456789' \
  -n lab-11

# Deploy Pod using both
cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: config-demo
  namespace: lab-11
spec:
  containers:
  - name: app
    image: busybox:1.36
    command: ["sh", "-c", "echo 'ENV=$APP_ENV'; echo 'LOG=$LOG_LEVEL'; echo 'DB_PASS=$DB_PASSWORD'; echo 'API=$API_KEY'; cat /etc/secrets/DB_PASSWORD; sleep 3600"]
    envFrom:
    - configMapRef:
        name: app-settings
    env:
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: app-secrets
          key: DB_PASSWORD
    - name: API_KEY
      valueFrom:
        secretKeyRef:
          name: app-secrets
          key: API_KEY
    volumeMounts:
    - name: secret-vol
      mountPath: /etc/secrets
      readOnly: true
  volumes:
  - name: secret-vol
    secret:
      secretName: app-secrets
      defaultMode: 0400
EOF

# Verify
kubectl logs config-demo -n lab-11
kubectl exec config-demo -n lab-11 -- ls -la /etc/secrets/
kubectl exec config-demo -n lab-11 -- cat /etc/secrets/DB_PASSWORD

# Cleanup
kubectl delete namespace lab-11
```

---

## 6. Interview Questions

### Q1: What is the difference between ConfigMaps and Secrets?

**Expected Answer:**
ConfigMaps store non-sensitive configuration data as plain text. Secrets store sensitive data (passwords, tokens, certificates) as base64-encoded values with additional protections: RBAC restrictions, not shown in `kubectl describe pod`, can be encrypted at rest, and minimal data exposure in API responses. Functionally they're used the same way (env vars or volume mounts), but Secrets have security-oriented defaults.

**Common Mistake:** "Secrets are encrypted." By default, they are base64-encoded, not encrypted. Encryption at rest must be explicitly configured.

---

### Q2: How do you inject configuration into a Pod?

**Expected Answer:**
Two methods:
1. **Environment variables** — using `env[].valueFrom.configMapKeyRef/secretKeyRef` or `envFrom`. Simple key-value settings. NOT auto-updated.
2. **Volume mounts** — mount ConfigMap/Secret as files in the container filesystem. Supports complex config files. Auto-updated by kubelet (~60-90 seconds) when the ConfigMap/Secret is changed.

---

### Q3: How do you securely manage secrets in Kubernetes?

**Expected Answer:**
1. Enable encryption at rest for etcd (EncryptionConfiguration or EKS KMS).
2. Use External Secrets Operator to sync from AWS Secrets Manager (secrets never stored in Git).
3. Apply RBAC to restrict which ServiceAccounts can read Secrets.
4. Mount secrets as volumes with `defaultMode: 0400` (restrictive permissions).
5. Enable audit logging to track who accessed which secrets.
6. Use Sealed Secrets or SOPS for GitOps workflows (encrypted secrets in Git).
7. Rotate secrets regularly (ESO auto-syncs on schedule).

---

## 7. Best Practices

1. **Never hardcode configuration in Docker images** — use ConfigMaps for environment-specific settings.
2. **Never store secrets in Git** — use External Secrets Operator or Sealed Secrets.
3. **Use `stringData`** in Secret YAML for readability (K8s auto-encodes to base64).
4. **Mount secrets as volumes with `defaultMode: 0400`** — not as environment variables.
5. **Use `subPath`** when mounting a single config file to avoid replacing the entire directory.
6. **Enable encryption at rest** for Secrets in etcd.
7. **Use immutable ConfigMaps and Secrets** (`immutable: true`) when values never change — prevents accidental modification and improves performance.

---

## 8. Summary

| Concept | Key Takeaway |
| :--- | :--- |
| **ConfigMap** | Non-sensitive configuration; env vars or volume mounts; auto-updates via volume |
| **Secret** | Sensitive data; base64-encoded (not encrypted by default); RBAC protected |
| **Env Vars** | Simple values; NOT auto-updated; visible in process environment |
| **Volume Mounts** | Complex files; auto-updated (~60-90s); supports restrictive permissions |
| **Encryption** | Enable at rest for etcd; EKS uses KMS by default |
| **External Secrets** | Sync from AWS Secrets Manager; auto-rotation; secrets never in Git |

---

## 9. Practice Assignment

1. Create a ConfigMap with 5 key-value pairs. Inject them into a Pod as environment variables. Verify with `env`.
2. Create a ConfigMap with a multi-line `nginx.conf` file. Mount it into an nginx Pod and verify the custom config.
3. Create a Secret with database credentials. Mount it as a read-only volume with `defaultMode: 0400`.
4. Update a ConfigMap mounted as a volume. Wait 2 minutes and verify the file is auto-updated inside the Pod (without restart).
5. Update a ConfigMap used as an environment variable. Verify it is NOT updated until you restart the Pod.
6. Research: How would you use External Secrets Operator with AWS Secrets Manager?
