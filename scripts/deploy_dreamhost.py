"""Deploy tracked public website files over SFTP, without requiring shell access."""

import argparse
import base64
import hashlib
import io
import json
import os
import re
from pathlib import Path, PurePosixPath
import stat
import subprocess
import time
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'static-site'
HOST = 'sin1-shared-01.dreamhost.com'
USER = 'dh_924vay'
REMOTE = '/home/dh_924vay/madebyjigg.com'
URL = 'https://madebyjigg.com'
MANIFEST = '.deployment-manifest.json'
MARKER = 'deployment-version.json'
PAGES = ('index.html', 'about/index.html', 'portfolio/index.html', 'contact/index.html')
PUBLIC_DIRS = {'assets', 'about', 'contact', 'portfolio', 'previews', 'wp-content'}
PUBLIC_ROOT = {'index.html', '.htaccess', 'robots.txt', 'sitemap.xml', '404.html', 'favicon.svg'}


def public_file(name):
    if name in PUBLIC_ROOT:
        return True
    path = PurePosixPath(name)
    if path.is_absolute() or '..' in path.parts or any(p.startswith('.') for p in path.parts):
        return False
    return name == 'index.html' or (len(path.parts) > 1 and path.parts[0] in PUBLIC_DIRS)


def security_config(template, files):
    hashes = set()
    for name, data in files.items():
        if name.endswith('.html'):
            html = data.decode('utf-8-sig').replace('\r\n', '\n').replace('\r', '\n')
            for attrs, body in re.findall(r'<script\b([^>]*)>(.*?)</script\s*>', html, re.I | re.S):
                if not re.search(r'\bsrc\s*=', attrs, re.I) and body.strip():
                    digest = base64.b64encode(hashlib.sha256(body.encode()).digest()).decode()
                    hashes.add("'sha256-" + digest + "'")
    return template.replace(b'__INLINE_SCRIPT_HASHES__', ' '.join(sorted(hashes)).encode())


def merge_security_config(existing, managed):
    start = b'# BEGIN MADEBYJIGG MANAGED'
    end = b'# END MADEBYJIGG MANAGED'
    if start in existing:
        before, rest = existing.split(start, 1)
        if end not in rest:
            raise ValueError('Incomplete managed .htaccess block; refusing to overwrite')
        _, after = rest.split(end, 1)
        return before + managed.strip() + after
    return managed.rstrip() + b'\n\n' + existing


def collect_files():
    result = subprocess.run(
        ['git', 'ls-files', '-z', '--', 'static-site'], cwd=ROOT,
        check=True, capture_output=True,
    )
    files = {}
    for tracked in result.stdout.decode().split('\0'):
        if not tracked:
            continue
        name = PurePosixPath(tracked).relative_to('static-site').as_posix()
        if public_file(name):
            source = SITE / name
            if source.is_symlink():
                raise ValueError(f'Symlinks are not deployable: {name}')
            files[name] = source.read_bytes()
    for name in PAGES + ('assets/responsive.css', 'assets/messenger.js',
                         'assets/contact-forms.js', 'assets/contact-forms.css'):
        if name not in files or not files[name]:
            raise ValueError(f'Required website file is missing or empty: {name}')
    if '.htaccess' in files:
        files['.htaccess'] = security_config(files['.htaccess'], files)
    return files


def file_hash(data):
    return hashlib.sha256(data).hexdigest()


def ensure_directory(sftp, path):
    """Never follow a remote symlink outside the site's document root."""
    if path == REMOTE:
        if sftp.normalize(path) != REMOTE or not stat.S_ISDIR(sftp.lstat(path).st_mode):
            raise ValueError('DreamHost document root is missing or resolves elsewhere')
        return
    if not path.startswith(REMOTE + '/'):
        raise ValueError('Upload path is outside the document root')
    parent = str(PurePosixPath(path).parent)
    ensure_directory(sftp, parent)
    try:
        info = sftp.lstat(path)
    except FileNotFoundError:
        sftp.mkdir(path)
        info = sftp.lstat(path)
    if not stat.S_ISDIR(info.st_mode):
        raise ValueError(f'Refusing non-directory or symlink: {path}')


def upload(sftp, name, data):
    if not public_file(name) and name not in {MANIFEST, MARKER}:
        raise ValueError(f'Unsafe deployment path: {name}')
    destination = REMOTE + '/' + name
    ensure_directory(sftp, str(PurePosixPath(destination).parent))
    temporary = destination + '.uploading'
    # Refuse existing symlinks, including an abandoned upload path.
    for path in (destination, temporary):
        try:
            if not stat.S_ISREG(sftp.lstat(path).st_mode):
                raise ValueError(f'Refusing non-regular file: {path}')
        except FileNotFoundError:
            pass
    sftp.putfo(io.BytesIO(data), temporary, file_size=len(data), confirm=True)
    sftp.chmod(temporary, 0o644)
    # OpenSSH atomic rename replaces each file only after its transfer succeeds.
    sftp.posix_rename(temporary, destination)


def verify(files, commit):
    # A unique query avoids a cached response hiding an unsuccessful upload.
    names = list(PAGES) + [MARKER, 'assets/messenger.js', 'assets/responsive.css']
    names += ['assets/contact-forms.js', 'assets/contact-forms.css']
    names += [n for n in ('robots.txt', 'sitemap.xml') if n in files]
    expected = dict(files)
    expected[MARKER] = json.dumps({'commit': commit}, sort_keys=True).encode()
    for attempt in range(6):
        try:
            for name in names:
                request = Request(f'{URL}/{name}?deploy={commit}', headers={'Cache-Control': 'no-cache'})
                with urlopen(request, timeout=30) as response:
                    if response.read() != expected[name]:
                        raise RuntimeError(f'Live file does not match GitHub: {name}')
                    if '.htaccess' in files and name in PAGES:
                        for header in ('Content-Security-Policy', 'Strict-Transport-Security',
                                       'X-Content-Type-Options', 'Referrer-Policy'):
                            if not response.headers.get(header):
                                raise RuntimeError(f'Missing live security header: {header}')
            print(f'Verified {URL} at commit {commit}')
            return
        except Exception:
            if attempt == 5:
                raise
            time.sleep(5)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Validate public files without connecting')
    args = parser.parse_args()
    files = collect_files()
    print(f'Validated {len(files)} tracked public website files')
    if args.check:
        return
    password = os.environ.get('DREAMHOST_SFTP_PASSWORD')
    if not password:
        raise SystemExit('Missing DREAMHOST_SFTP_PASSWORD GitHub Actions secret')
    commit = os.environ.get('DEPLOY_COMMIT') or subprocess.check_output(
        ['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True,
    ).strip()
    import paramiko
    with paramiko.SSHClient() as client:
        client.load_host_keys(str(ROOT / 'scripts/dreamhost_known_hosts'))
        client.set_missing_host_key_policy(paramiko.RejectPolicy())
        client.connect(HOST, port=22, username=USER, password=password,
                       allow_agent=False, look_for_keys=False, timeout=30,
                       auth_timeout=30, banner_timeout=30)
        client.get_transport().set_keepalive(30)
        with client.open_sftp() as sftp:
            ensure_directory(sftp, REMOTE)
            try:
                with sftp.open(REMOTE + '/' + MANIFEST) as remote_manifest:
                    previous = json.load(remote_manifest)
            except FileNotFoundError:
                previous = {}
            hashes = {name: file_hash(data) for name, data in files.items()}
            # Assets first, HTML last, so pages cannot reference unuploaded assets.
            changed = sorted((n for n in files if previous.get(n) != hashes[n]),
                             key=lambda n: (2 if n == '.htaccess' else 1 if n.endswith('.html') else 0, n))
            old_security = None
            for name in changed:
                data = files[name]
                if name == '.htaccess':
                    try:
                        with sftp.open(REMOTE + '/.htaccess', 'rb') as existing:
                            old_security = existing.read()
                    except FileNotFoundError:
                        old_security = b''
                    data = merge_security_config(old_security, data)
                upload(sftp, name, data)
                print(f'Uploaded {name}')
            upload(sftp, MARKER, json.dumps({'commit': commit}, sort_keys=True).encode())
            try:
                verify(files, commit)
            except Exception:
                if old_security is not None:
                    upload(sftp, '.htaccess', old_security)
                    print('Restored the previous server configuration after failed live checks')
                raise
            # Save the incremental manifest only after the public checks succeed.
            upload(sftp, MANIFEST, json.dumps(hashes, sort_keys=True).encode())
    summary = f'Deployed {commit} to {URL}; {len(changed)} files uploaded. Live checks passed.\n'
    print(summary)
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a', encoding='utf-8') as output:
            output.write(summary)


if __name__ == '__main__':
    main()
