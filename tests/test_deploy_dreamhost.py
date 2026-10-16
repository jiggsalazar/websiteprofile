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


if __name__ == '__main__':
    unittest.main()
