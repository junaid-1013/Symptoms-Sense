# Contributing to Symptoms Sense

Thanks for helping! This guide covers how to propose changes. By taking part you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- **Report a bug** or **suggest a feature** with an [issue](../../issues/new/choose). Search existing issues first.
- **Improve the docs**: typos, missing steps and clearer explanations are all welcome.
- **Fix an issue or build a feature.** For anything non-trivial, comment on the issue first so we can agree on the approach before you invest time.
- **Security problems** must *not* be filed as public issues. See [SECURITY.md](SECURITY.md).

## The `main` branch is protected

Nobody pushes directly to `main`, including collaborators. All changes land through a pull request that passes CI and gets a review from a maintainer. See [docs/BRANCH_PROTECTION.md](docs/BRANCH_PROTECTION.md) for the exact rules.

## Workflow

1. **Fork** the repository (collaborators can branch directly) and clone it.
2. **Create a branch** from an up-to-date `main`:
   ```bash
   git checkout main && git pull
   git checkout -b feat/short-description
   ```
   Use `feat/`, `fix/`, `docs/`, `refactor/`, `test/` or `chore/` prefixes.
3. **Set up** the project following the [README](README.md#getting-started).
4. **Make your change.** Keep it focused: one concern per pull request.
5. **Check it** (see below).
6. **Commit** with a clear message and **push** your branch.
7. **Open a pull request** against `main` and fill in the template.

### Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/): `type: short summary in the imperative`.

```
feat: add reschedule button to appointment cards
fix: keep pending chat actions across turns
docs: explain the reminder timezone setting
```

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`. Explain the *why* in the body when it isn't obvious.

## Before you open a pull request

**Backend** (from `Backend/`):

```bash
python -m pytest tests -q
```

- Add or update tests for behaviour you change.
- Changed a model? Add an Alembic migration (`alembic revision --autogenerate -m "..."`) and review it.

**Frontend** (from `Frontend/`):

```bash
npm run lint
npx tsc --noEmit
npm run build
```

- Check your change in the browser at desktop and phone widths.
- Reuse components from `src/components/ui` and theme colour tokens.

CI runs the same checks on every pull request.

## Code guidelines

- Match the style of the surrounding code. Keep comments to the *why*, not the *what*.
- **Never commit secrets.** `.env` files are ignored; only `*.sample` files are tracked, and they must contain placeholders only.
- **Health content:** don't present output as a diagnosis or medication advice. The assistant suggests *types of specialists* and encourages professional care.
- **Writes need consent:** in the chat assistant, any action that books, cancels or changes data must go through the propose-then-confirm flow.
- **Demo data** must be fictional. Don't add real people's names, contacts or medical details. Stock photos must come from sources that allow reuse.

## Pull request review

- A maintainer reviews every pull request; expect questions and requests for changes.
- Keep the branch up to date with `main` and resolve review threads before merging.
- Maintainers squash or merge once CI is green and the review is approved.

## Getting help

Open a [discussion or issue](../../issues) with what you tried and what you saw. Include versions and error messages.
