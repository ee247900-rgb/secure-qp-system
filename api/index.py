import sys
import os

# Ensure Vercel can find the backend package
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from backend.main import app
