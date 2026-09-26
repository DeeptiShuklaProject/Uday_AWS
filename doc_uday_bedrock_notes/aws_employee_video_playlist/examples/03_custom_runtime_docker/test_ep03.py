import unittest
from ep03_boundary_check import MicroVMResourceManager

class TestEpisode03Runtime(unittest.TestCase):

    def test_memory_resource_checking_pass(self):
        status = MicroVMResourceManager.check_limits(max_mb_allowed=1024.0)
        self.assertTrue(status)

    def test_memory_resource_checking_fail(self):
        status = MicroVMResourceManager.check_limits(max_mb_allowed=0.01)
        self.assertFalse(status)

if __name__ == "__main__":
    unittest.main()
