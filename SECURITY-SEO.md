# Security and SEO maintenance

The site is a static HTML/CSS/JavaScript export hosted on DreamHost. WordPress
plugins mentioned in exported asset paths are not a live WordPress admin or
database. Keep changes in this repository and deploy through GitHub Actions.

## Implemented

- HTTPS and one canonical host (`https://madebyjigg.com/`), with redirect rules
  for `www` and explicit `index.html` URLs.
- HSTS for this host, content-type sniffing protection, frame restrictions,
  reduced referrer exposure, and camera/microphone/location/payment restrictions.
- An enforced Content Security Policy. Inline JavaScript is allowed by exact
  SHA-256 hashes generated during deployment; arbitrary inline scripts and inline
  event handlers are blocked. Existing inline CSS remains allowed because the
  exported design and interaction scripts depend on it.
- GSAP and ScrollTrigger are served locally at the version already used by the
  site. Remote Google Fonts and the existing FormSubmit email service are
  explicitly permitted. Messenger opens an external conversation link.
- Disabled directory listings and denied HTTP access to deployment manifests,
  incomplete uploads, and common environment/backup/database/log filenames.
- Unique page titles and descriptions; absolute canonical and social URLs;
  social preview metadata; accurate Person, WebSite, page and breadcrumb schema.
- A four-page XML sitemap and robots.txt sitemap discovery. Demo previews and
  the custom 404 page are marked noindex.
- Image alternative text or explicit decorative alternatives, asynchronous
  image decoding, and lazy loading for below-fold photos.
- HTML, CSS and JavaScript revalidate on each visit so updates are not hidden by
  stale browser caches. Existing image caching is preserved.

## Before reporting a deployment as complete

Run `python -m unittest discover -s tests -p 'test_*.py'`, then push and wait for
the DreamHost workflow. Check the live headers, HTTP/www redirects, sitemap,
404 status, portrait/portfolio images, Messenger link, and mobile layout.
The uploader preserves pre-existing DreamHost .htaccess rules outside its
managed block and restores the old configuration if live deployment checks fail.

## Owner steps

- Verify the domain in Google Search Console and submit
  `https://madebyjigg.com/sitemap.xml`. Verification requires the owner's Google
  account; deployment alone does not submit the site or guarantee indexing/rank.
- Send a real contact-form inquiry from another device and confirm email delivery.
  No test message is sent by the automated checks. FormSubmit may require the
  owner to activate the destination email address; Messenger remains available.
- Keep GitHub and DreamHost accounts protected with two-factor authentication and
  replace the GitHub SFTP secret whenever the DreamHost SFTP password changes.
- Review dependencies and the pinned DreamHost host key when the host changes.

These measures reduce common risks; they do not establish that a site can never
be compromised or guarantee a particular Google ranking.
