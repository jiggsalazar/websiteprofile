# Website update workflow

- Website source is `static-site/`; the live domain is https://madebyjigg.com/.
- For user-requested website edits, implement and verify locally, commit and
  push to GitHub, then wait for the `Deploy website to DreamHost` Actions run.
- Use the GitHub → DreamHost deployment workflow rather than manually uploading
  through File Manager. See `DEPLOYMENT.md` for checks, setup, and recovery.
- Do not report a change as live until deployment and its live checks succeed.
  If the hosting secret is missing, preserve the work and explain the required
  setup; do not claim automatic deployment is connected.
- Never read, print, commit, or request the hosting password in chat. The user
  enters it directly as the GitHub Actions repository secret.
