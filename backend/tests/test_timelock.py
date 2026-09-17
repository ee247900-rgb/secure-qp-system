import unittest
from datetime import datetime, timezone, timedelta
from unittest.mock import patch
from services.timelock_service import check_release_allowed, format_countdown, is_within_download_window

class TestTimelock(unittest.TestCase):
    def test_release_allowed_past_time(self):
        current = datetime.now(timezone.utc)
        release = current - timedelta(hours=1)
        
        res = check_release_allowed(release, current)
        self.assertTrue(res['allowed'])
        self.assertEqual(res['remaining_seconds'], 0)

    def test_release_not_allowed_future_time(self):
        current = datetime.now(timezone.utc)
        release = current + timedelta(minutes=30)
        
        res = check_release_allowed(release, current)
        self.assertFalse(res['allowed'])
        self.assertEqual(res['remaining_seconds'], 1800)

    def test_format_countdown(self):
        self.assertEqual(format_countdown(0), "0s")
        self.assertEqual(format_countdown(45), "45s")
        self.assertEqual(format_countdown(125), "2m 5s")
        self.assertEqual(format_countdown(3665), "1h 1m 5s")

    def test_is_within_download_window(self):
        base_time = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
        
        with patch("services.timelock_service.get_server_time", return_value=base_time):
            release_time = base_time - timedelta(hours=1)
            self.assertTrue(is_within_download_window(release_time, window_minutes=120))
            
            release_time2 = base_time - timedelta(hours=3)
            self.assertFalse(is_within_download_window(release_time2, window_minutes=120))
            
            release_time3 = base_time + timedelta(hours=1)
            self.assertFalse(is_within_download_window(release_time3, window_minutes=120))

if __name__ == "__main__":
    unittest.main()
