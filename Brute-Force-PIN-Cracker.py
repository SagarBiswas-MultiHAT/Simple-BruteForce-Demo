#!/usr/bin/env python3
"""
pin_bruteforce_sim.py — Educational PIN brute-force simulator

This script simulates brute-forcing a 4-digit PIN (0000-9999) against a local mock system.
**SAFETY NOTE:** This is an offline simulation for learning only. Do NOT use this
against any real or remotely accessible system.

Features:
- Clean function separation for generate/attempt/brute-force logic
- CLI flags to control verbosity, deterministic seeding, and fixed PIN for tests
- Logging instead of uncontrolled prints
- Small progress indicator and summary output
- Unit-testable design
"""

from __future__ import annotations
import argparse
import logging
import random
import sys
import time
from typing import Tuple, Optional

# --- Constants and configuration ---
PIN_LENGTH = 4
MAX_COMBINATIONS = 10 ** PIN_LENGTH  # 10000 for 4-digit PINs


# --- Mock system interface (kept intentionally simple & local) ---
def generate_pin(seed: Optional[int] = None) -> str:
    """
    Generate a random PIN formatted as zero-padded string of length PIN_LENGTH.
    If `seed` is provided, the RNG is seeded for deterministic output (useful for testing).
    """
    if seed is not None:
        random.seed(seed)
    n = random.randint(0, MAX_COMBINATIONS - 1)
    return f"{n:0{PIN_LENGTH}d}"


def attempt_pin(guess: str, actual_pin: str) -> str:
    """
    Mock system response. Returns 'SYSTEM BREACHED' on correct guess,
    otherwise returns 'ACCESS DENIED'.
    """
    return "SYSTEM BREACHED" if guess == actual_pin else "ACCESS DENIED"


# --- Brute-force logic ---
def brute_force(
    actual_pin: str,
    *,
    verbose: bool = False,
    max_attempts: Optional[int] = None,
    show_progress: bool = True
) -> Tuple[Optional[str], int]:
    """
    Try all possible PINs from "0000" to "9999". Returns (found_pin, attempts_made).
    If not found within max_attempts (if provided), returns (None, attempts_made).
    """
    attempts = 0
    for num in range(MAX_COMBINATIONS):
        attempts += 1
        if max_attempts is not None and attempts > max_attempts:
            # Reached user-specified attempt limit
            return None, attempts - 1

        guess = f"{num:0{PIN_LENGTH}d}"
        response = attempt_pin(guess, actual_pin)

        if verbose:
            logging.debug("Trying PIN %s -> %s", guess, response)

        # optional progress print: every 10% or every 1000 attempts (configurable)
        if show_progress and (num % 1000 == 0 or num == MAX_COMBINATIONS - 1):
            percent = (num + 1) / MAX_COMBINATIONS * 100
            logging.info("Progress: %d/%d (%.1f%%)", num + 1, MAX_COMBINATIONS, percent)

        if response == "SYSTEM BREACHED":
            return guess, attempts

    return None, attempts


# --- CLI / main ---
def parse_args(argv: Optional[list[str]] = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        prog="pin_bruteforce_sim",
        description="Educational local simulator: brute-force a 4-digit PIN (0000-9999).",
    )
    p.add_argument("--seed", "-s", type=int, default=None,
                   help="Optional RNG seed for reproducible PIN generation (testing only).")
    p.add_argument("--fixed-pin", "-p", type=str, default=None,
                   help="Skip RNG and use the provided 4-digit PIN (e.g. 0042). For testing only.")
    p.add_argument("--max-attempts", "-m", type=int, default=None,
                   help="Stop after N attempts (useful for limiting runtime during demos).")
    p.add_argument("--quiet", "-q", action="store_true",
                   help="Quiet mode: minimal info (only final summary).")
    p.add_argument("--verbose", "-v", action="store_true",
                   help="Verbose debug mode (logs each attempt at DEBUG level).")
    p.add_argument("--no-progress", action="store_true",
                   help="Disable periodic progress info.")
    return p.parse_args(argv)


def configure_logging(verbose: bool, quiet: bool) -> None:
    if quiet:
        level = logging.WARNING
    elif verbose:
        level = logging.DEBUG
    else:
        level = logging.INFO

    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)-5s: %(message)s",
        datefmt="%H:%M:%S",
    )


def main(argv: Optional[list[str]] = None) -> int:
    args = parse_args(argv)
    configure_logging(args.verbose, args.quiet)

    # Validate fixed PIN if provided
    if args.fixed_pin is not None:
        if len(args.fixed_pin) != PIN_LENGTH or not args.fixed_pin.isdigit():
            logging.error("Invalid --fixed-pin value. Must be exactly %d digits.", PIN_LENGTH)
            return 2
        actual_pin = args.fixed_pin
        logging.info("Using fixed PIN (testing mode).")
    else:
        actual_pin = generate_pin(seed=args.seed)
        logging.info("Generated random PIN (local simulation).")

    logging.debug("Actual PIN (for debugging only): %s", actual_pin)

    start_time = time.time()
    found_pin, attempts = brute_force(
        actual_pin,
        verbose=args.verbose,
        max_attempts=args.max_attempts,
        show_progress=not args.no_progress and not args.verbose,
    )
    elapsed = time.time() - start_time

    if found_pin is not None:
        logging.info("SYSTEM BREACHED — Correct PIN: %s (attempts: %d, time: %.3fs)", found_pin, attempts, elapsed)
        # Also print to stdout for easy capture by demos/tests
        print(f"Correct PIN found: {found_pin} (attempts={attempts}, elapsed={elapsed:.3f}s)")
        return 0
    else:
        logging.warning("PIN not found within limit. Attempts: %d, time: %.3fs", attempts, elapsed)
        print(f"PIN not found (attempts={attempts}, elapsed={elapsed:.3f}s)")
        return 1


if __name__ == "__main__":
    sys.exit(main())
