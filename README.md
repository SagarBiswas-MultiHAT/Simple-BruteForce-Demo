# Brute-Force Lab — Educational Simulation and Defensive Learning

This repository is the complete experience for understanding brute-force attacks and the defenses that slow them down. The entire simulation runs in the browser, so there is no CLI or Flask server required—just open `index.html`, flip the knobs, and watch the animation.

What you get:

- A GitHub Pages-ready demo that runs locally or can be deployed in seconds.
- A browser-driven simulation that models attempts, rate limiting, lockouts, captcha penalties, jitter, and reporting.
- A lightweight smoke-test suite that ensures the markup and script stay aligned.

Important: This repository does not target real systems. Everything here is a closed, local simulation for learning. Do not use these techniques against any system without explicit permission.

## Quick start (web demo)

Open the demo locally:

```bash
start index.html
```

Host it on GitHub Pages:

1. Push this repo to GitHub.
2. Go to Settings -> Pages.
3. Source: Deploy from branch, then select your default branch and root.
4. Save. Your demo will be available at the Pages URL.

The demo is fully static. All attack logic is simulated inside the browser for safety and clarity.

## Attack setup

Every control on the hero panel feeds into the simulation, and the metrics update instantly so you can see the math behind brute-force attacks.

- **PIN length** & **Character set**: Together they define the search space. A `4`-digit numeric PIN has 10,000 combinations; increasing length or adding alphabetic characters multiplies that space exponentially, which is reflected in the metrics below.
- **Fixed PIN (optional)**: Seed the simulation with a known PIN to reproduce a successful attack instantly. The field enforces the PIN length and charset you selected to avoid invalid guesses.
- **Max attempts (optional)**: Tell the demo to stop after `N` attempts so you can explore how partial sweeps behave. Useful for teaching or demonstrating patience/resilience metrics.

The **Search space**, **Entropy**, and **Estimated time** tiles show how configuration choices impact the attacker timeline and how defenses stretch out each attempt.

## Defenses

Each toggle under "Defenses" modifies the simulated timing model:

- **Rate limit (attempts/sec)**: A ceiling on how fast guesses are tried. The slider runs from 10 to 2000 attempts/sec, and the display shows the live value. Lower rates stretch out the attack and make metrics like ETA go up.
- **Captcha challenge**: When enabled, the demo applies a 2.5× penalty to the rate limit to emulate human verification delays. This models any challenge-response barrier that slows a brute-force script.
- **Lockout after failed attempts**: Turns on the lockout logic. The simulation pauses for `Lockout seconds` every `Lockout threshold` attempts, demonstrating how account lockouts can choke automation.
- **Lockout threshold**: How many guesses the attacker can make before the account locks out. Lower thresholds are stricter; higher thresholds give more room but still introduce penalties.
- **Lockout seconds**: The duration of each lockout period. Combine a short threshold with a long lockout to show how even a few wrong guesses can stall an attacker for minutes.
- **Jitter (%)**: Adds randomness to the attempts-per-second rate to model network latency, throttling, or inconsistent backoff. Higher jitter introduces more visible variability in the chart and makes ETA estimates bounce around, illustrating how unpredictability frustrates attackers.

## Web demo features

- Interactive brute-force simulation with real-time metrics
- Simulated defenses: rate limiting, lockout, captcha, jitter
- Configurable PIN policy (length + charset)
- Estimated time-to-crack and entropy
- Downloadable JSON report
- Optional local API mode
- Responsive, accessible UI

## Run modes & API

- **Run via API**: This button is intentionally disabled until you toggle "Use local API (Flask)". The payload mirrors the settings (PIN length, charset, rate limits, captcha, lockout, etc.), which demonstrates how a server-backed workflow could work.
- **API endpoint**: Defaults to `http://127.0.0.1:5000/api/bruteforce`. There is no server bundled with the repo—this field is purely illustrative so you can experiment with your own Flask or FastAPI service if you build one.
- **Event log**: Every major action—simulation start, lockout trigger, PIN found, API success/failure—drops a timestamped entry into the log. It keeps the last 40 entries so you can scroll through a run and see what the simulation is thinking.
- **Download report**: Exports a JSON summary of the settings, results (attempts, elapsed seconds, attempts/sec, found/not), and estimate data. Great for sharing on a security whiteboard or pairing it with a lesson plan.

## How the simulation works (short)

1. Build a search space from PIN length and charset.
2. Enumerate candidates in a deterministic order.
3. Compare the guess to a locally generated PIN.
4. Track attempts, rate, and estimated time.
5. Apply defenses (rate limit, lockout, captcha) to the timing model.

This mirrors how brute-force attacks scale without ever touching a real system.

## Tests and development

Install dev dependencies:

```bash
python -m pip install -r requirements-dev.txt
```

Run the smoke tests that make sure the hero UI, buttons, and script stay wired up:

```bash
pytest tests/test_ui_assets.py
```

## Security and ethics

This repo is for learning defensive security only. Unauthorized access attempts are illegal and unethical. Use this project to understand risks and build better protections, not to attack systems.

## License

MIT — see LICENSE.