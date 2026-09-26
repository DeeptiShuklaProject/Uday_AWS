<!-- TODO: Rewrite and humanize content from 07-git-github\module-25-git-automation.md, 07-git-github\module-26-github-gitlab-apis.md -->

# Module 25 — Git Automation

## 1. Chapter Introduction
Git is the version control backbone of every DevOps workflow. But most engineers only use Git manually—typing `git add`, `git commit`, `git push`. In this module, we will learn how to automate Git operations with Python using the `GitPython` library, enabling scripts that clone repositories, create branches, commit changes, and manage releases programmatically.

## 2. What You Will Learn
- How to use GitPython to interact with Git repositories.
- How to clone, commit, push, and manage branches programmatically.
- How to automate changelog generation.
- How to integrate Git operations into DevOps scripts.

## 3. Why This Topic Matters in DevOps
CI/CD pipelines are triggered by Git events. Deployment scripts need to tag releases. Configuration management tools pull from Git repositories. A DevOps engineer who can automate Git operations can build self-service platforms, automated release workflows, and infrastructure-as-code pipelines.

## 4. Basic Example
```python
# pip install gitpython
from git import Repo

# Clone a repository
repo = Repo.clone_from("https://github.com/org/project.git", "./project")

# Check current branch
print(f"Current branch: {repo.active_branch.name}")

# List all branches
for branch in repo.branches:
    print(f"  Branch: {branch.name}")
```

## 5. DevOps Example: Automated Commit and Push
```python
from git import Repo
import datetime

def commit_config_change(repo_path, file_path, message=None):
    """Stage, commit, and push a configuration file change."""
    repo = Repo(repo_path)
    repo.index.add([file_path])

    if not message:
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        message = f"Auto-update: {file_path} at {timestamp}"

    repo.index.commit(message)
    origin = repo.remote("origin")
    origin.push()
    print(f"✅ Committed and pushed: {message}")
```

## 6. Production Example: Release Tagging
```python
from git import Repo

def create_release_tag(repo_path, version, message):
    """Create an annotated Git tag for a release."""
    repo = Repo(repo_path)

    if version in [tag.name for tag in repo.tags]:
        print(f"⚠️ Tag {version} already exists")
        return

    repo.create_tag(version, message=message)
    repo.remote("origin").push(version)
    print(f"✅ Release tag {version} created and pushed")
```

## 7. Interview Questions
**Intermediate:** Q: How would you automate the process of updating a version file, committing, tagging, and pushing in a release pipeline? A: Use GitPython to read the repo, update the version file, stage it with `repo.index.add()`, commit with a release message, create an annotated tag, and push both the commit and tag to the remote.

## 8. Quick Revision Notes
- Install: `pip install gitpython`
- Clone: `Repo.clone_from(url, path)`
- Commit: `repo.index.add([files])` → `repo.index.commit(message)`
- Push: `repo.remote("origin").push()`
- Tags: `repo.create_tag(name, message=msg)`
- Always check `repo.is_dirty()` before committing


---

# Module 26 — GitHub/GitLab APIs

## 1. Chapter Introduction
Git manages your code locally, but GitHub and GitLab manage your code in the cloud—including pull requests, issues, releases, webhooks, and team permissions. In this module, we will learn how to interact with the GitHub API (and GitLab API) using Python to automate repository management, create pull requests, manage issues, and trigger workflows.

## 2. What You Will Learn
- How to authenticate with the GitHub API using personal access tokens.
- How to list repositories, create issues, and manage pull requests.
- How to automate release creation with asset uploads.
- How to set up webhooks for event-driven automation.
- GitLab API equivalents for the same operations.

## 3. DevOps Example: List Open Pull Requests
```python
import requests
import os

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
HEADERS = {"Authorization": f"token {GITHUB_TOKEN}", "Accept": "application/vnd.github.v3+json"}

def list_open_prs(owner, repo):
    url = f"https://api.github.com/repos/{owner}/{repo}/pulls"
    response = requests.get(url, headers=HEADERS, params={"state": "open"})
    response.raise_for_status()

    for pr in response.json():
        print(f"#{pr['number']} — {pr['title']} (by {pr['user']['login']})")

# list_open_prs("kubernetes", "kubernetes")
```

## 4. Production Example: Create a Release
```python
def create_github_release(owner, repo, tag, name, body):
    url = f"https://api.github.com/repos/{owner}/{repo}/releases"
    payload = {"tag_name": tag, "name": name, "body": body, "draft": False}
    response = requests.post(url, headers=HEADERS, json=payload)
    response.raise_for_status()
    print(f"✅ Release {tag} created: {response.json()['html_url']}")
```

## 5. Senior Engineer's Perspective
**Junior Engineer:** "I create releases manually through the GitHub UI."
**Senior Engineer:** "Releases should be automated as part of your CI/CD pipeline. A Python script that creates the release, generates the changelog from commits, and uploads build artifacts means releases are repeatable, auditable, and can happen at any time without human intervention."

## 6. Quick Revision Notes
- GitHub API base: `https://api.github.com`
- Auth: `Authorization: token <PAT>` header
- PRs: `GET /repos/{owner}/{repo}/pulls`
- Issues: `POST /repos/{owner}/{repo}/issues`
- Releases: `POST /repos/{owner}/{repo}/releases`
- Webhooks: Configure in repo settings → triggers HTTP POST to your endpoint
- GitLab API: `https://gitlab.com/api/v4/projects/{id}/...`


---

