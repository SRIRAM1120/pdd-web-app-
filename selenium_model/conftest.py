import json
import time
from pathlib import Path
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

ROOT = Path(__file__).parent
SCREENSHOTS = ROOT / "screenshots"
EVIDENCE = ROOT / "evidence"
LOGS = ROOT / "logs"
for folder in (SCREENSHOTS, EVIDENCE, LOGS):
    folder.mkdir(parents=True, exist_ok=True)

RESULTS = []

@pytest.fixture
def driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1440,1100")
    options.add_argument("--no-first-run")
    options.add_argument("--no-default-browser-check")
    options.set_capability("goog:loggingPrefs", {"browser": "ALL"})
    browser = webdriver.Chrome(options=options)
    browser.set_page_load_timeout(30)
    yield browser
    (LOGS / "browser_console.json").write_text(json.dumps(browser.get_log("browser"), indent=2), encoding="utf-8")
    browser.quit()

@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()
    if report.when != "call":
        return
    screenshot = ""
    browser = item.funcargs.get("driver")
    if browser:
        screenshot_path = SCREENSHOTS / f"{item.name}_{report.outcome}.png"
        browser.save_screenshot(str(screenshot_path))
        screenshot = str(screenshot_path.relative_to(ROOT.parent))
    RESULTS.append({
        "test_id": item.name,
        "module": item.module.__name__.split(".")[-1],
        "scenario": item.name.replace("_", " "),
        "expected": "Requested behavior operates without browser errors",
        "actual": str(report.longrepr)[:500] if report.failed else "Behavior matched expectation",
        "status": report.outcome.upper(),
        "duration": round(report.duration, 3),
        "screenshot": screenshot,
    })

def pytest_sessionfinish(session, exitstatus):
    (EVIDENCE / "test_results.json").write_text(json.dumps(RESULTS, indent=2), encoding="utf-8")
