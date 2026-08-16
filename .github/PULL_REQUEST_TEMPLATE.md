## What does this change?

<!-- A short summary and the reason for it. Link the issue: Closes #123 -->

## How was it tested?

<!-- Commands you ran and what you checked in the browser. Screenshots help for UI changes. -->

## Checklist

- [ ] My branch is up to date with `main` and the PR is focused on one concern
- [ ] Backend: `python -m pytest tests -q` passes (and I added tests where behaviour changed)
- [ ] Frontend: `npm run lint`, `npx tsc --noEmit` and `npm run build` pass
- [ ] Database changes include an Alembic migration
- [ ] No secrets, real personal data or large generated files are included
- [ ] Docs are updated if setup, configuration or behaviour changed
- [ ] Any chat action that changes data still goes through propose-then-confirm
