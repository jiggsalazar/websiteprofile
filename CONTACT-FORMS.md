# Contact delivery

The homepage Let's Chat dialog and /contact/ share assets/contact-forms.js.
They submit to the existing FormSubmit endpoint for jiggsalazar89@gmail.com.
The owner confirmed receipt of an initial diagnostic email on October 19, 2026.

Both forms check the provider's JSON success value, not only the HTTP status.
A request times out after 20 seconds. No automatic retries are made, since a
timed-out request may still have been delivered. Failed or uncertain submissions
preserve the visitor's fields and expose email and Messenger alternatives.
The Email Jigg link includes the current form contents in a draft; visitors must
send it using their email app. Drafts are not stored in browser storage.

Without JavaScript, /contact/ posts through FormSubmit's standard HTML endpoint
and uses native field validation. Homepage Let's Chat links point to /contact/
when the modal script is unavailable. Keep the recipient activated in FormSubmit;
changing it can require a new confirmation email. Check Spam if delivery changes.

Run node --test tests/contact_forms.test.cjs as well as the Python tests before
deployment. GitHub Actions runs both suites and verifies the shared script and
stylesheet against the live site. Browser-test both forms after changing delivery
code and verify receipt in the recipient inbox; provider acceptance alone is not
proof of inbox delivery. Hosting, connectivity, provider outages, and recipient
spam filters can still interrupt delivery. Do not promise uninterrupted delivery.
