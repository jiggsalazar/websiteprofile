# Website publishing

The publishing route is Codex → GitHub `main` → GitHub Actions → DreamHost →
https://madebyjigg.com/.

The `Deploy website to DreamHost` workflow runs whenever website files or the
deployment configuration are pushed to `main`. Pull requests stay unpublished
until merged into `main`. The workflow can also be run manually from Actions.

## One-time connection

In https://github.com/jiggsalazar/websiteprofile/settings/secrets/actions create
the repository secret **DREAMHOST_SFTP_PASSWORD**. Its value is the SFTP password
for DreamHost website user **dh_924vay**, not the DreamHost panel password.
Enter it directly into GitHub. Never put the password in chat, a tracked file,
an issue, or a command argument.

The server, account, and destination are already configured:

- Host: `sin1-shared-01.dreamhost.com`, SFTP port `22`.
- Username: `dh_924vay`.
- Website directory: `/home/dh_924vay/madebyjigg.com`.

Shell/SSH access does not need to be enabled. The workflow uses SFTP only.
The server's Ed25519 public host key observed during setup is pinned in
`scripts/dreamhost_known_hosts`. If DreamHost replaces the host or its key,
verify the replacement with DreamHost before updating the pin.

After adding the secret, run **Deploy website to DreamHost** from the Actions
tab and confirm that all steps succeed. `deployment-version.json` on the live
site reports the deployed Git commit. A failed or pending run is not a completed
publication.

## Future updates

1. Edit files in `static-site/` and check the requested behavior locally.
2. Run `python -m unittest discover -s tests -p test_deploy_dreamhost.py` and
   `python scripts/deploy_dreamhost.py --check`.
3. Commit and push to `main`, or merge an approved pull request into `main`.
4. Wait for the GitHub deployment workflow to succeed before reporting the site
   live. Inspect failed logs and fix the cause rather than uploading by hand.

Only Git-tracked public site files are uploaded. Local launchers, repository
configuration, passwords, and untracked files are excluded. Assets upload before
HTML; each file is replaced atomically after transfer. The workflow compares
hashes with its previous deployment and verifies all four public pages, the
shared CSS, Messenger script, and commit marker over HTTPS. Concurrent deploys
are serialized. It preserves existing server-only files and does not delete
files removed from Git; intentionally retiring a public URL needs an explicit
removal or redirect.

Existing cached images/CSS/JavaScript can remain cached briefly. When changing
an asset, update its version in the referring page or give it a new filename.

Edits made directly in DreamHost do not sync back to GitHub. Keep GitHub as the
source of truth. To roll back a site change, revert its Git commit and push the
revert; the same workflow publishes it.
