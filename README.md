# Brute-Force PIN Cracker

## Overview

Welcome to the **Brute-Force PIN Cracker** project! This is a Python script that simulates a brute-force attack to guess a randomly generated 4-digit PIN code. The script attempts all possible combinations of 4 digits (from 0000 to 9999) until it finds the correct one. The mock system responds with either "ACCESS DENIED" or "SYSTEM BREACHED" based on the guessed PIN.

````
PS H:\GitHub Clone\Simple-BruteForce-Demo> python .\Brute-Force-PIN-Cracker.py
16:43:13 INFO : Generated random PIN (local simulation).
16:43:13 INFO : Progress: 1/10000 (0.0%)
 # Brute-Force PIN Cracker — Educational Simulator

 A small, self-contained Python simulation that demonstrates a brute-force attack against a local, mock 4-digit PIN (0000–9999). This project is purely educational: it illustrates how brute-force works, why short numeric PINs are weak, and how to write clean, testable scripts.

 Important: this repository contains an offline simulation only. Do NOT use this code against any real or remotely accessible systems. It's intended for learning and experimentation on local machines.

 Results and behavior are deterministic when using the `--seed` or `--fixed-pin` options, which makes the project easy to test and inspect.

 **Files of interest**
 - `Brute-Force-PIN-Cracker.py` — main script (executable with `python`).

 ## Quick start

 Prerequisites: Python 3.10+ (3.11 or 3.12 recommended).

 Clone and run:

 ```bash
 git clone https://github.com/yourusername/Simple-BruteForce-Demo.git
 cd Simple-BruteForce-Demo
 python Brute-Force-PIN-Cracker.py
````

Run with a fixed PIN (fast and reproducible):

```bash
python Brute-Force-PIN-Cracker.py --fixed-pin 0000 --quiet
```

Run with a deterministic random PIN (useful for demos/tests):

```bash
python Brute-Force-PIN-Cracker.py --seed 42
```

CLI highlights

- `--fixed-pin / -p`: Provide an exact 4-digit PIN to skip RNG (testing/demo).
- `--seed / -s`: Seed the RNG so the generated PIN is reproducible.
- `--max-attempts / -m`: Stop after N attempts (handy for demos).
- `--quiet / -q`: Minimal output (only final summary).
- `--verbose / -v`: Debug-level logging (prints attempt debug lines).
- `--no-progress`: Suppress periodic progress messages.

## What the script does (short)

1.  Generate a 4-digit PIN (random or fixed).
2.  Iterate from `0000` to `9999`, calling the local `attempt_pin` function.
3.  `attempt_pin` returns `SYSTEM BREACHED` on a correct guess or `ACCESS DENIED` otherwise.
4.  On success the script prints the correct PIN, number of attempts and elapsed time, then exits with code `0`.

Why this is useful

- Demonstrates algorithmic complexity for brute-force attacks.
- Shows how determinism (seeding) aids testing.
- Demonstrates clean CLI design, logging, and small, testable functions.

## Tests and development

This repository includes a tiny test suite so the CI workflow can validate functionality automatically.

Install dev dependencies locally:

```bash
python -m pip install -r requirements-dev.txt
```

Run tests:

```bash
pytest -q
```

Run formatting check (Black):

```bash
black --check .
```

If you want to apply formatting:

```bash
black .
```

## Continuous Integration (GitHub Actions)

This project includes a GitHub Actions workflow at `.github/workflows/ci.yml` that:

- checks out the code
- installs Python and dependencies
- runs `black --check` (formatting enforcement)
- runs the test suite (`pytest`)
- runs the script in a deterministic mode to ensure the runnable example executes

The CI is configured to run on pushes and pull requests to `main` / `master` and tests multiple Python versions.

## Code notes (for readers)

- The code is intentionally simple and split into small functions:
  - `generate_pin(seed: Optional[int]) -> str` — returns a zero-padded PIN string.
  - `attempt_pin(guess: str, actual_pin: str) -> str` — mock response function.
  - `brute_force(...) -> Tuple[Optional[str], int]` — core brute-force loop, returns the found pin and attempts used.
- Logging is used instead of uncontrolled prints so behavior can be quieted or made verbose via CLI flags.

## Security & ethics

This repository is for learning only. Do not, under any circumstances, use this code to target systems you do not own or have explicit permission to test. Performing unauthorized attacks is illegal and unethical.

## Contributing

Contributions are welcome: open issues or pull requests for bug fixes, clearer docs, or additional demo scenarios. Suggested small improvements:

- Add a timing benchmark for different PIN lengths.
- Add simulated rate limiting to demonstrate real-world mitigations.

When contributing:

1.  Fork the repo.
2.  Create a branch for your change.
3.  Run tests and formatting locally.
4.  Open a pull request describing your change.

## License

MIT — see the `LICENSE` file in this repository.

---

If you'd like, I can also tidy formatting, add more tests, or add a `pyproject.toml` to pin tooling versions. Which would you like next?
