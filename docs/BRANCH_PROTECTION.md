# Protecting `main`

This is for maintainers. It explains the rules that stop anyone from pushing straight to `main`, and how to switch them on.

## What the rules do

| Rule | Effect |
|---|---|
| Require a pull request | Nobody pushes commits to `main` directly. Changes arrive through a PR |
| Required approval (1) | A reviewer must approve before merging |
| Code owner review | [`CODEOWNERS`](../.github/CODEOWNERS) names the owner, whose approval is needed on every PR |
| Dismiss stale approvals | New commits after an approval require a fresh review |
| Resolve conversations | All review threads must be resolved before merging |
| Required status checks | CI jobs **Frontend (lint, types, build)** and **Backend (tests)** must pass, on a branch up to date with `main` |
| Block force pushes and deletion | History of `main` can't be rewritten or deleted |
| Bypass: repository admins | The repo owner can merge their own PRs without a second reviewer |

Who can do what once this is on:

- **Strangers** can't push to the repo at all. They can fork and open a pull request.
- **Collaborators** (write access) can create branches and open PRs, but can't push to `main`.
- **The owner** (admin) can bypass the review requirement, which is what lets a solo maintainer merge their own PRs. Prefer using PRs anyway.

## Turn it on

Do this **after** the repository is public (rulesets also work on private repos with a paid plan).

### Option A: import the ruleset (fastest)

1. Repo **Settings → Rules → Rulesets → New ruleset → Import a ruleset**.
2. Choose [`.github/rulesets/protect-main.json`](../.github/rulesets/protect-main.json).
3. Review the settings and click **Create**.
4. Make sure at least one CI run has finished on a pull request so the two check names exist and can be selected as required.

### Option B: GitHub CLI

```bash
gh api -X POST repos/junaid-1013/Symptoms-Sense/rulesets --input .github/rulesets/protect-main.json
```

### Option C: classic branch protection (UI)

**Settings → Branches → Add branch protection rule** for `main`, then tick: *Require a pull request before merging* (1 approval, dismiss stale approvals, require review from Code Owners, require conversation resolution), *Require status checks to pass* (add the two jobs above, require branches to be up to date), *Do not allow bypassing the above settings* **off** for the owner, and leave *Allow force pushes* and *Allow deletions* off.

## Other settings worth enabling

- **Settings → General → Pull Requests:** allow squash merging, enable *Automatically delete head branches*.
- **Settings → Code security:** turn on *Private vulnerability reporting* (used by [SECURITY.md](../SECURITY.md)), *Dependabot alerts*, and *Secret scanning with push protection*.
- **Settings → Actions → General:** set *Fork pull request workflows* to require approval for first-time contributors, and keep default workflow permissions read-only.
- **Settings → Collaborators:** give trusted people *Write* access. Everyone else contributes through forks.

## Adding or changing required checks

The required check names are the `name:` of each job in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). If you rename a job, update the ruleset too, or merges will wait forever for a check that no longer exists.
