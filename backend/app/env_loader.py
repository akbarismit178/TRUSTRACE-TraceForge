import os
from pathlib import Path

def load_dotenv_custom():
    """
    Loads environment variables from .env files located in
    the backend folder or the project root directory.
    """
    current_dir = Path(__file__).resolve().parent
    candidates = [
        current_dir.parent / ".env",          # backend/.env
        current_dir.parent.parent / ".env",   # root .env
    ]

    for env_path in candidates:
        if env_path.exists() and env_path.is_file():
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith("#") or "=" not in line:
                            continue
                        key, val = line.split("=", 1)
                        key = key.strip()
                        val = val.strip().strip("\"'")
                        if key:
                            os.environ[key] = val
            except Exception:
                pass

load_dotenv_custom()
