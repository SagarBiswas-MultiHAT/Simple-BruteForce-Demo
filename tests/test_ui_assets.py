from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]


def test_assets_exist():
    missing = [
        asset
        for asset in ("index.html", "app.js", "styles.css")
        if not (REPO_ROOT / asset).is_file()
    ]
    assert not missing, f"Missing assets: {', '.join(missing)}"


def test_index_includes_script_and_canvas():
    markup = (REPO_ROOT / "index.html").read_text(encoding="utf-8")
    assert '<script src="app.js"></script>' in markup
    assert 'id="rateChart"' in markup


def test_index_has_control_buttons():
    markup = (REPO_ROOT / "index.html").read_text(encoding="utf-8")
    required_ids = [
        "startBtn",
        "pauseBtn",
        "resetBtn",
        "runApiBtn",
        "exportBtn",
    ]
    missing = [id_ for id_ in required_ids if f'id="{id_}"' not in markup]
    assert not missing, f"Missing controls: {', '.join(missing)}"
