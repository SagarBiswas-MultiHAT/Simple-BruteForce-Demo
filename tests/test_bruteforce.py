import subprocess
import sys
from pathlib import Path


def test_fixed_pin_quick_run():
    repo_root = Path(__file__).resolve().parents[1]
    script = repo_root / "Brute-Force-PIN-Cracker.py"
    assert script.exists(), f"Script not found at {script}"

    proc = subprocess.run(
        [sys.executable, str(script), "--fixed-pin", "0000", "--quiet"],
        capture_output=True,
        text=True,
        timeout=10,
    )

    # script exits with 0 on success
    assert proc.returncode == 0, proc.stderr or proc.stdout
    assert "Correct PIN found" in proc.stdout
