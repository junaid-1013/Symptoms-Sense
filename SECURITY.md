# Security Policy

## Supported versions

Security fixes are applied to the latest code on `main`.

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately with GitHub's **[Report a vulnerability](../../security/advisories/new)** button (Security tab, *Advisories*). Include:

- What you found and where (file, endpoint or page).
- Steps to reproduce, and the impact you expect.
- Any proof of concept, with no real user data.

You can expect an acknowledgement within a few days and updates as we investigate. Please give us reasonable time to fix the issue before disclosing it publicly. We're happy to credit you in the fix if you'd like.

## Scope

In scope: the code in this repository, including authentication, authorisation, the AI assistant's tool calls, and handling of health-related data.

Out of scope: social engineering, denial-of-service, vulnerabilities in third-party services (OpenAI, Google, hosting providers), and issues that need a compromised device.

## For contributors and deployers

- Never commit credentials. Only `*.sample` environment files are tracked, with placeholders.
- If you ever commit a secret by mistake, **rotate it immediately**; deleting the file doesn't remove it from history.
- Set a strong `SECRET_KEY`, use `ENVIRONMENT=production` and HTTPS in any real deployment.
