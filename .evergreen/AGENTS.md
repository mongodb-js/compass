# Working in `.evergreen/`

- Edit `buildvariants-and-tasks.in.yml`, never the generated `.yml`. After any template change run `npm run update-evergreen-config` (or `node .evergreen/template-yml.js` if the Evergreen CLI is unavailable) and include the regenerated file in the same change.
- Mirror an existing sibling instead of inventing a new shape: functions, tasks, variants, expansion names (`<function>_test_args`), tags.
- Tags have consequences: every task of a `run-on-pr` variant runs on every PR (`cron` does not exclude it), `required-for-publish-*` tasks block releases. Slow or cloud-provisioning tasks get their own untagged variant with `cron`.
- Never put secrets or environment-specific IDs in these files; define them as Evergreen project variables (Project Settings → Variables) and reference them as `${…}` expansions.
- Long-running steps must emit output regularly (idle `timeout_secs`), or raise the timeout on the function with a comment saying why.
- Verify with a patch build (`evergreen patch`) selecting only the variants/tasks you touched.
