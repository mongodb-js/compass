## Commit message conventions

This repository uses a Conventional Commits–style format to keep history readable and machine-friendly.

At a high level:

- Use a short, imperative subject line in the form:
  - `<type>(<scope>): <description>`
- Keep the subject line focused and concise.
- Use the body (optional) to explain the “why” when it’s not obvious from the diff.
- Use the footer (optional) for issue references or breaking change notes.

For full details on the expected types, scopes, and examples specific to this repo, see internal documentation or existing commit history for guidance.

### Pull request titles

When a pull request is associated with a COMPASS ticket, append the ticket number at the end of the PR title, for example:

- `feat(ai): enable prompt storage COMPASS-10468`

If there is no COMPASS ticket, do not invent one. Use a clear, descriptive title without a ticket number.
