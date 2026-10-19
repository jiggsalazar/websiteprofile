from html.parser import HTMLParser
import importlib.util
import json
from pathlib import Path
import re
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('deploy', ROOT / 'scripts/deploy_dreamhost.py')
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)


class Tags(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))


class SiteReadinessTests(unittest.TestCase):
    def test_metadata_and_images(self):
        titles, descriptions = set(), set()
        for name in deploy.PAGES:
            source = (ROOT / 'static-site' / name).read_text(encoding='utf-8-sig')
            parser = Tags()
            parser.feed(source)
            title = re.findall(r'<title>(.*?)</title>', source)
            self.assertEqual(len(title), 1)
            titles.add(title[0])
            canonical = [a['href'] for t, a in parser.tags if t == 'link' and a.get('rel') == 'canonical']
            self.assertEqual(len(canonical), 1)
            self.assertTrue(canonical[0].startswith('https://madebyjigg.com/'))
            desc = [a['content'] for t, a in parser.tags if t == 'meta' and a.get('name') == 'description']
            self.assertEqual(len(desc), 1)
            self.assertGreaterEqual(len(desc[0]), 100)
            self.assertLessEqual(len(desc[0]), 170)
            descriptions.add(desc[0])
            self.assertEqual(sum(t == 'h1' for t, _ in parser.tags), 1)
            for tag, attrs in parser.tags:
                if tag == 'img':
                    self.assertIn('alt', attrs)
                self.assertFalse(any(a.startswith('on') for a in attrs), 'Inline handler blocked by CSP')
                if tag == 'script':
                    self.assertFalse(attrs.get('src', '').startswith(('http:', 'https:')))
            schemas = re.findall(r'<script type="application/ld\+json">(.*?)</script>', source, re.S)
            self.assertEqual(len(schemas), 1)
            graph = json.loads(schemas[0])['@graph']
            self.assertTrue(any(item['@type'] == 'Person' for item in graph))
            self.assertNotIn('SearchAction', schemas[0])
        self.assertEqual(len(titles), 4)
        self.assertEqual(len(descriptions), 4)

    def test_sitemap(self):
        tree = ET.parse(ROOT / 'static-site/sitemap.xml')
        urls = [n.text for n in tree.findall('.//{*}loc')]
        self.assertEqual(set(urls), {'https://madebyjigg.com/', 'https://madebyjigg.com/about/',
                                    'https://madebyjigg.com/contact/', 'https://madebyjigg.com/portfolio/'})

    def test_both_contact_forms_have_working_fallbacks(self):
        for name in ('index.html', 'contact/index.html'):
            source = (ROOT / 'static-site' / name).read_text(encoding='utf-8')
            parser = Tags()
            parser.feed(source)
            forms = [a for tag, a in parser.tags if tag == 'form' and 'data-contact-form' in a]
            self.assertEqual(len(forms), 1)
            self.assertEqual(forms[0]['action'], 'https://formsubmit.co/jiggsalazar89@gmail.com')
            self.assertEqual(forms[0]['method'], 'POST')
            self.assertNotIn('novalidate', forms[0])
            self.assertIn('assets/contact-forms.js?v=20261019', source)
            self.assertIn('assets/contact-forms.css?v=20261019', source)
            self.assertTrue(any(t == 'a' and a.get('href') == 'mailto:jiggsalazar89@gmail.com'
                                and 'data-contact-email' in a for t, a in parser.tags))
            self.assertTrue(any(t == 'input' and a.get('name') == '_honey' for t, a in parser.tags))

    def test_security_header_rendering(self):
        template = (ROOT / 'static-site/.htaccess').read_bytes()
        files = {n: (ROOT / 'static-site' / n).read_bytes() for n in deploy.PAGES}
        rendered = deploy.security_config(template, files)
        self.assertNotIn(b'__INLINE_SCRIPT_HASHES__', rendered)
        self.assertIn(b"script-src 'self' 'sha256-", rendered)
        self.assertNotIn(b"script-src 'self' 'unsafe-inline'", rendered)
        csp = next(line for line in rendered.splitlines() if b'Header always set Content-Security-Policy' in line)
        self.assertLess(len(csp), 8000, 'Keep the CSP below Apache header limits')

    def test_existing_server_rules_are_preserved(self):
        template = (ROOT / 'static-site/.htaccess').read_bytes()
        existing = b'# DreamHost custom rules\nOptions -MultiViews\n'
        merged = deploy.merge_security_config(existing, template)
        self.assertIn(existing, merged)
        updated = deploy.merge_security_config(merged, template)
        self.assertEqual(updated.count(b'# BEGIN MADEBYJIGG MANAGED'), 1)
        self.assertIn(existing, updated)


if __name__ == '__main__':
    unittest.main()
