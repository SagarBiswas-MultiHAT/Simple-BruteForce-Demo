const elements = {
    startBtn: document.getElementById("startBtn"),
    pauseBtn: document.getElementById("pauseBtn"),
    resetBtn: document.getElementById("resetBtn"),
    runApiBtn: document.getElementById("runApiBtn"),
    exportBtn: document.getElementById("exportBtn"),
    statusText: document.getElementById("statusText"),
    attemptsText: document.getElementById("attemptsText"),
    rateText: document.getElementById("rateText"),
    elapsedText: document.getElementById("elapsedText"),
    etaText: document.getElementById("etaText"),
    outcomeText: document.getElementById("outcomeText"),
    spaceText: document.getElementById("spaceText"),
    entropyText: document.getElementById("entropyText"),
    estimateText: document.getElementById("estimateText"),
    pinLength: document.getElementById("pinLength"),
    charset: document.getElementById("charset"),
    fixedPin: document.getElementById("fixedPin"),
    maxAttempts: document.getElementById("maxAttempts"),
    rateLimit: document.getElementById("rateLimit"),
    rateLimitValue: document.getElementById("rateLimitValue"),
    captcha: document.getElementById("captcha"),
    lockout: document.getElementById("lockout"),
    lockoutThreshold: document.getElementById("lockoutThreshold"),
    lockoutSeconds: document.getElementById("lockoutSeconds"),
    jitter: document.getElementById("jitter"),
    jitterValue: document.getElementById("jitterValue"),
    useApi: document.getElementById("useApi"),
    apiUrl: document.getElementById("apiUrl"),
    log: document.getElementById("log"),
    chart: document.getElementById("rateChart"),
};

const chartCtx = elements.chart.getContext("2d");

const state = {
    running: false,
    paused: false,
    attempts: 0,
    elapsed: 0,
    attemptsPerSecond: 0,
    lastTick: null,
    attemptCarry: 0,
    targetPin: "",
    found: false,
    lockoutRemaining: 0,
    rateHistory: [],
    logCount: 0,
};

const CHARSETS = {
    numeric: "0123456789",
    alphabet: "abcdefghijklmnopqrstuvwxyz",
    alnum: "0123456789abcdefghijklmnopqrstuvwxyz",
    full: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
};

function formatNumber(value) {
    return new Intl.NumberFormat().format(Math.floor(value));
}

function formatSeconds(value) {
    if (!Number.isFinite(value)) return "--";
    if (value < 60) return `${value.toFixed(1)}s`;
    const mins = Math.floor(value / 60);
    const secs = Math.floor(value % 60);
    if (mins < 60) return `${mins}m ${secs}s`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m`;
}

function entropyBits(space) {
    return Math.log2(space);
}

function getSettings() {
    return {
        pinLength: clamp(parseInt(elements.pinLength.value, 10) || 4, 4, 8),
        charset: elements.charset.value,
        fixedPin: elements.fixedPin.value.trim(),
        maxAttempts: parseInt(elements.maxAttempts.value, 10) || null,
        rateLimit: parseInt(elements.rateLimit.value, 10) || 500,
        captchaEnabled: elements.captcha.checked,
        lockoutEnabled: elements.lockout.checked,
        lockoutThreshold: parseInt(elements.lockoutThreshold.value, 10) || 100,
        lockoutSeconds: parseInt(elements.lockoutSeconds.value, 10) || 30,
        jitter: parseInt(elements.jitter.value, 10) || 0,
    };
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function searchSpace(settings) {
    const charsetSize = CHARSETS[settings.charset].length;
    return Math.pow(charsetSize, settings.pinLength);
}

function indexToPin(index, settings) {
    const chars = CHARSETS[settings.charset];
    const base = chars.length;
    let value = index;
    let output = "";
    for (let i = 0; i < settings.pinLength; i += 1) {
        output = chars[value % base] + output;
        value = Math.floor(value / base);
    }
    return output.padStart(settings.pinLength, chars[0]);
}

function isFixedPinValid(settings) {
    if (!settings.fixedPin) return true;
    if (settings.fixedPin.length !== settings.pinLength) return false;
    const allowed = new Set(CHARSETS[settings.charset]);
    return [...settings.fixedPin].every((ch) => allowed.has(ch));
}

function pickTargetPin(settings) {
    if (settings.fixedPin) return settings.fixedPin;
    const space = searchSpace(settings);
    const randomIndex = Math.floor(Math.random() * space);
    return indexToPin(randomIndex, settings);
}

function effectiveRate(settings) {
    const captchaPenalty = settings.captchaEnabled ? 2.5 : 1;
    return Math.max(1, settings.rateLimit / captchaPenalty);
}

function estimatedTime(settings) {
    const space = searchSpace(settings);
    const rate = effectiveRate(settings);
    let estimate = space / rate;
    if (settings.lockoutEnabled && settings.lockoutThreshold > 0) {
        const cycles = Math.ceil(space / settings.lockoutThreshold);
        estimate += (cycles - 1) * settings.lockoutSeconds;
    }
    return estimate;
}

function updateEstimates() {
    const settings = getSettings();
    elements.rateLimitValue.textContent = settings.rateLimit.toString();
    elements.jitterValue.textContent = `${settings.jitter}%`;

    const space = searchSpace(settings);
    elements.spaceText.textContent = formatNumber(space);
    elements.entropyText.textContent = `${entropyBits(space).toFixed(1)} bits`;
    elements.estimateText.textContent = `~${formatSeconds(estimatedTime(settings))}`;

    if (!isFixedPinValid(settings)) {
        elements.fixedPin.classList.add("invalid");
    } else {
        elements.fixedPin.classList.remove("invalid");
    }
}

function logEvent(message) {
    const entry = document.createElement("div");
    entry.className = "log-entry";
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    elements.log.prepend(entry);
    state.logCount += 1;
    if (state.logCount > 40) {
        elements.log.removeChild(elements.log.lastChild);
        state.logCount -= 1;
    }
}

function updateUI() {
    elements.attemptsText.textContent = formatNumber(state.attempts);
    elements.rateText.textContent = state.attemptsPerSecond.toFixed(0);
    elements.elapsedText.textContent = formatSeconds(state.elapsed);
    elements.etaText.textContent = state.found
        ? "0s"
        : formatSeconds(Math.max(0, state.eta || 0));
    elements.outcomeText.textContent = state.found ? "PIN found" : "--";
    elements.statusText.textContent = state.running
        ? state.lockoutRemaining > 0
            ? `Locked (${state.lockoutRemaining.toFixed(0)}s)`
            : "Running"
        : "Idle";
}

function updateChart() {
    const { width, height } = elements.chart;
    chartCtx.clearRect(0, 0, width, height);
    chartCtx.strokeStyle = "rgba(61, 214, 198, 0.8)";
    chartCtx.lineWidth = 2;

    const values = state.rateHistory;
    if (values.length === 0) return;
    const maxValue = Math.max(...values, 1);
    chartCtx.beginPath();
    values.forEach((value, index) => {
        const x = (index / (values.length - 1)) * width;
        const y = height - (value / maxValue) * (height - 12) - 6;
        if (index === 0) chartCtx.moveTo(x, y);
        else chartCtx.lineTo(x, y);
    });
    chartCtx.stroke();
}

function resetSimulation() {
    state.running = false;
    state.paused = false;
    state.attempts = 0;
    state.elapsed = 0;
    state.attemptsPerSecond = 0;
    state.lastTick = null;
    state.attemptCarry = 0;
    state.found = false;
    state.lockoutRemaining = 0;
    state.eta = null;
    state.rateHistory = [];
    elements.pauseBtn.disabled = true;
    elements.startBtn.disabled = false;
    elements.outcomeText.textContent = "--";
    elements.statusText.textContent = "Idle";
    updateUI();
    updateChart();
}

function startSimulation() {
    const settings = getSettings();
    if (!isFixedPinValid(settings)) {
        logEvent("Fixed PIN does not match policy.");
        return;
    }
    state.running = true;
    state.paused = false;
    state.lastTick = performance.now();
    state.targetPin = pickTargetPin(settings);
    state.found = false;
    elements.pauseBtn.disabled = false;
    elements.startBtn.disabled = true;
    logEvent("Simulation started.");
    tick();
}

function pauseSimulation() {
    if (!state.running) return;
    state.paused = !state.paused;
    elements.pauseBtn.textContent = state.paused ? "Resume" : "Pause";
    logEvent(state.paused ? "Paused." : "Resumed.");
    if (!state.paused) {
        state.lastTick = performance.now();
        tick();
    }
}

function tick() {
    if (!state.running || state.paused) return;
    const now = performance.now();
    const delta = (now - state.lastTick) / 1000;
    state.lastTick = now;

    const settings = getSettings();
    const totalSpace = searchSpace(settings);
    const rateBase = effectiveRate(settings);
    const jitterFactor = 1 + (Math.random() * 2 - 1) * (settings.jitter / 100);
    const effective = Math.max(1, rateBase * jitterFactor);

    if (state.lockoutRemaining > 0) {
        state.lockoutRemaining = Math.max(0, state.lockoutRemaining - delta);
        state.attemptCarry = 0;
    } else {
        state.attemptCarry += effective * delta;
        const attemptsThisTick = Math.min(
            totalSpace - state.attempts,
            Math.floor(state.attemptCarry)
        );
        state.attemptCarry -= attemptsThisTick;

        for (let i = 0; i < attemptsThisTick; i += 1) {
            const guess = indexToPin(state.attempts, settings);
            state.attempts += 1;
            if (guess === state.targetPin) {
                state.found = true;
                state.running = false;
                logEvent(`PIN found: ${guess} after ${state.attempts} attempts.`);
                break;
            }
            if (
                settings.lockoutEnabled &&
                settings.lockoutThreshold > 0 &&
                state.attempts % settings.lockoutThreshold === 0
            ) {
                state.lockoutRemaining = settings.lockoutSeconds;
                logEvent("Lockout triggered.");
                break;
            }
            if (settings.maxAttempts && state.attempts >= settings.maxAttempts) {
                state.running = false;
                logEvent("Max attempts reached.");
                break;
            }
        }
    }

    state.elapsed += delta;
    state.attemptsPerSecond = effective;
    state.eta = (totalSpace - state.attempts) / Math.max(effective, 1);
    state.rateHistory.push(effective);
    if (state.rateHistory.length > 60) state.rateHistory.shift();

    updateUI();
    updateChart();

    if (state.running) {
        requestAnimationFrame(tick);
    } else {
        elements.pauseBtn.disabled = true;
        elements.startBtn.disabled = false;
        elements.pauseBtn.textContent = "Pause";
    }
}

async function runViaApi() {
    const settings = getSettings();
    if (!isFixedPinValid(settings)) {
        logEvent("Fixed PIN does not match policy.");
        return;
    }

    if (!elements.useApi.checked) {
        logEvent("Enable the local API toggle before running.");
        return;
    }

    const payload = {
        pin_length: settings.pinLength,
        charset: settings.charset,
        fixed_pin: settings.fixedPin || null,
        max_attempts: settings.maxAttempts,
        rate_limit: settings.rateLimit,
        captcha_enabled: settings.captchaEnabled,
        lockout_enabled: settings.lockoutEnabled,
        lockout_threshold: settings.lockoutThreshold,
        lockout_seconds: settings.lockoutSeconds,
    };

    logEvent("Sending request to local API...");
    try {
        const response = await fetch(elements.apiUrl.value, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) {
            logEvent(`API error: ${data.error || response.statusText}`);
            return;
        }
        state.attempts = data.attempts;
        state.elapsed = data.elapsed_seconds;
        state.attemptsPerSecond = data.attempts_per_second;
        state.found = data.found;
        elements.outcomeText.textContent = data.found ? "PIN found" : "Not found";
        elements.statusText.textContent = "API complete";
        logEvent(`API done: ${data.message}`);
        updateUI();
    } catch (error) {
        logEvent(`API request failed: ${error.message}`);
    }
}

function exportReport() {
    const settings = getSettings();
    const report = {
        generated_at: new Date().toISOString(),
        settings,
        results: {
            attempts: state.attempts,
            elapsed_seconds: parseFloat(state.elapsed.toFixed(3)),
            attempts_per_second: parseFloat(state.attemptsPerSecond.toFixed(1)),
            found: state.found,
        },
        estimates: {
            search_space: searchSpace(settings),
            entropy_bits: parseFloat(entropyBits(searchSpace(settings)).toFixed(2)),
            estimated_seconds: parseFloat(estimatedTime(settings).toFixed(2)),
        },
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bruteforce-report.json";
    link.click();
    URL.revokeObjectURL(url);
    logEvent("Report downloaded.");
}

function wireEvents() {
    elements.startBtn.addEventListener("click", startSimulation);
    elements.pauseBtn.addEventListener("click", pauseSimulation);
    elements.resetBtn.addEventListener("click", resetSimulation);
    elements.runApiBtn.addEventListener("click", runViaApi);
    elements.exportBtn.addEventListener("click", exportReport);
    elements.useApi.addEventListener("change", () => {
        elements.runApiBtn.disabled = !elements.useApi.checked;
    });

    [
        elements.pinLength,
        elements.charset,
        elements.fixedPin,
        elements.maxAttempts,
        elements.rateLimit,
        elements.captcha,
        elements.lockout,
        elements.lockoutThreshold,
        elements.lockoutSeconds,
        elements.jitter,
    ].forEach((el) => el.addEventListener("input", updateEstimates));
}

updateEstimates();
resetSimulation();
wireEvents();
logEvent("Ready to simulate.");
elements.runApiBtn.disabled = true;
