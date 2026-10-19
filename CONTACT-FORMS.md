# Contact delivery

The homepage Let's Chat dialog and /contact/ share assets/contact-forms.js.
They submit to /contact/send.php on DreamHost, which forwards to the existing
FormSubmit endpoint for jiggsalazar89@gmail.com using a fixed destination and TLS
verification. This avoids requiring browsers to connect directly to FormSubmit.
The owner confirmed receipt of an initial diagnostic email on October 19, 2026.

Both the server and forms check JSON success values, not only the HTTP status.
The server validates sizes/addresses, rejects cross-origin requests and header
injection, and limits each source IP to five attempts per ten minutes. Its single
rate-limit file uses hashed IPs, expires entries, and lives outside the web root.
No message contents are saved to disk. Forwarding has a 15-second timeout.
A request times out after 20 seconds. No automatic retries are made, since a
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
