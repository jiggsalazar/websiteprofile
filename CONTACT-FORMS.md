# Contact delivery

The homepage Let's Chat dialog and /contact/ share assets/contact-forms.js.
They submit to /contact/send.php on DreamHost, which forwards to the existing
FormSubmit endpoint for jiggsalazar89@gmail.com using a fixed destination and TLS
verification until Gmail SMTP is configured. This avoids requiring browsers to
connect directly to FormSubmit.
The owner confirmed receipt of an initial diagnostic email on October 19, 2026.
Later direct and server-side submissions failed intermittently. Do not treat
the initial diagnostic as proof of uninterrupted service.

## Finish authenticated Gmail delivery

1. The owner creates a Google app password for jiggsalazar89@gmail.com, with
   2-Step Verification enabled: https://myaccount.google.com/apppasswords .
   Do not request, read, print, or enter the password in chat or source code.
2. The owner enters it directly as the repository Actions secret
   CONTACT_SMTP_PASSWORD. This is an app password, not the normal Gmail password.
3. Run Deploy website to DreamHost again. The deployer writes smtp.json inside
   /home/dh_924vay/.madebyjigg-mail/ with a private directory (0700) and file (0600).
   No credential goes inside the public website, manifest, or commit marker.
4. Submit through both live forms and have the owner confirm inbox receipt.

When configured, PHPMailer v7.1.1 uses Gmail SMTP over verified TLS on port 465.
It sends from and to the fixed owner address and sets Reply-To to the validated
visitor email. No SMTP debug output is enabled. The vendored library comes from
https://github.com/PHPMailer/PHPMailer/releases/tag/v7.1.1 and retains its LGPL
license. Authentication errors return a failure, never a fake success or an
automatic resend through another provider. Missing secrets preserve any existing
server configuration. Revoke/replace the Google app password if compromised.

Both the server and forms check JSON success values, not only the HTTP status.
The server validates sizes/addresses, rejects cross-origin requests and header
injection, and limits each source IP to five attempts per ten minutes. Its single
rate-limit file uses hashed IPs, expires entries, and lives outside the web root.
No message contents are saved to disk. Forwarding has a 15-second timeout.
A browser request times out after 40 seconds. No automatic retries are made, since a
timed-out request may still have been delivered. Failed or uncertain submissions
preserve the visitor's fields and expose email and Messenger alternatives.
The Email Jigg link includes the current form contents in a draft; visitors must
send it using their email app. Drafts are not stored in browser storage.

Without JavaScript, /contact/ posts through FormSubmit's standard HTML endpoint
and uses native field validation. Homepage Let's Chat links point to /contact/
when the modal script is unavailable. Keep the recipient activated in FormSubmit;
changing it can require a new confirmation email. Check Spam if delivery changes.

Run node --test tests/contact_forms.test.cjs and php tests/contact_endpoint_test.php
as well as the Python tests before
deployment. GitHub Actions runs both suites and verifies the shared script and
stylesheet against the live site and checks that the PHP handler executes and
refuses GET requests. Browser-test both forms after changing delivery
code and verify receipt in the recipient inbox; provider acceptance alone is not
proof of inbox delivery. Hosting, connectivity, provider outages, and recipient
spam filters can still interrupt delivery. Do not promise uninterrupted delivery.
