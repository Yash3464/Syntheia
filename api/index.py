import os
import sys

# Add the backend directory AND the project root to sys.path
# so we can import 'app' (from backend/) and 'database' (from root/)
_this_dir = os.path.dirname(os.path.abspath(__file__))
_project_root = os.path.dirname(_this_dir)          # Syntheia/
_backend_dir = os.path.join(_project_root, 'backend')  # Syntheia/backend/

for _path in [_project_root, _backend_dir]:
    if _path not in sys.path:
        sys.path.insert(0, _path)

from app.main import app
