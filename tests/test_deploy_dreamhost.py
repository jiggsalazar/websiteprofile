import importlib.util
from pathlib import Path
from types import SimpleNamespace
import stat
import unittest
from unittest.mock import Mock

spec = importlib.util.spec_from_file_location(
    'deploy', Path(__file__).resolve().parents[1] / 'scripts/deploy_dreamhost.py',
)
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)


class DeploymentTests(unittest.TestCase):
    def test_only_public_paths_can_be_uploaded(self):
        for name in ['index.html', 'about/index.html', 'assets/messenger.js']:
            self.assertTrue(deploy.public_file(name))
        for name in ['../index.html', '/index.html', 'assets/../../secret',
                     '.env', 'assets/.env', 'static-server.js', '.git/config']:
            self.assertFalse(deploy.public_file(name))

    def test_upload_is_atomic(self):
        sftp = Mock()
        sftp.normalize.return_value = deploy.REMOTE
        sftp.lstat.side_effect = [SimpleNamespace(st_mode=stat.S_IFDIR),
                                 SimpleNamespace(st_mode=stat.S_IFREG),
                                 FileNotFoundError()]
        deploy.upload(sftp, 'index.html', b'new homepage')
        sftp.posix_rename.assert_called_once_with(
            deploy.REMOTE + '/index.html.uploading', deploy.REMOTE + '/index.html',
        )

    def test_failed_transfer_never_replaces_live_file(self):
        sftp = Mock()
        sftp.normalize.return_value = deploy.REMOTE
        sftp.lstat.side_effect = [SimpleNamespace(st_mode=stat.S_IFDIR),
                                 SimpleNamespace(st_mode=stat.S_IFREG),
                                 FileNotFoundError()]
        sftp.putfo.side_effect = OSError('connection lost')
        with self.assertRaises(OSError):
            deploy.upload(sftp, 'index.html', b'new homepage')
        sftp.posix_rename.assert_not_called()

    def test_remote_symlink_is_rejected(self):
        sftp = Mock()
        sftp.normalize.return_value = deploy.REMOTE
        sftp.lstat.side_effect = [SimpleNamespace(st_mode=stat.S_IFDIR),
                                 SimpleNamespace(st_mode=stat.S_IFLNK)]
        with self.assertRaises(ValueError):
            deploy.upload(sftp, 'index.html', b'new homepage')
        sftp.putfo.assert_not_called()

    def test_mail_secret_is_private_and_outside_document_root(self):
        sftp = Mock()
        sftp.normalize.return_value = '/home/dh_924vay'
        sftp.lstat.side_effect = [SimpleNamespace(st_mode=stat.S_IFDIR),
                                 FileNotFoundError(), FileNotFoundError()]
        deploy.configure_mail(sftp, 'abcd efgh ijkl mnop')  # Fake app password.
        target = deploy.MAIL_DIRECTORY + '/smtp.json'
        self.assertFalse(target.startswith(deploy.REMOTE + '/'))
        sftp.chmod.assert_any_call(deploy.MAIL_DIRECTORY, 0o700)
        sftp.chmod.assert_any_call(target + '.uploading', 0o600)
        sftp.posix_rename.assert_called_once_with(target + '.uploading', target)

    def test_mail_secret_does_not_follow_symlinks_or_erase_existing_config(self):
        sftp = Mock()
        deploy.configure_mail(sftp, '')
        sftp.putfo.assert_not_called()
        sftp.normalize.return_value = '/home/dh_924vay'
        sftp.lstat.return_value = SimpleNamespace(st_mode=stat.S_IFLNK)
        with self.assertRaises(ValueError):
            deploy.configure_mail(sftp, 'abcdefghijklmnop')
        sftp.putfo.assert_not_called()


if __name__ == '__main__':
    unittest.main()
