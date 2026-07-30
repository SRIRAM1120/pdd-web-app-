import requests
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium_model.pages.auth_page import AuthPage
from selenium_model.pages.public_page import PublicPage

BASE = "http://127.0.0.1:5174"

def test_smoke_login_page_renders(driver):
    page = AuthPage(driver).open()
    assert "Continue your flow" in driver.page_source
    assert len(driver.find_elements(By.CSS_SELECTOR, "input")) >= 2

def test_invalid_login_is_handled(driver):
    page = AuthPage(driver).open()
    page.login("not-a-user@example.com", "Incorrect123")
    assert page.visible_error()

def test_signup_mandatory_validation(driver):
    PublicPage(driver).open("/signup")
    driver.find_element(By.CSS_SELECTOR, "form .primary-button").click()
    errors = WebDriverWait(driver, 5).until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".field-error")))
    assert len(errors) >= 3

def test_forgot_password_form(driver):
    PublicPage(driver).open("/forgot-password")
    assert "Let’s get you back in" in driver.page_source
    button = driver.find_element(By.CSS_SELECTOR, ".primary-button")
    assert not button.is_enabled()

def test_protected_workspace_redirects_anonymous_user(driver):
    PublicPage(driver).open("/account")
    WebDriverWait(driver, 10).until(EC.url_contains("/signin"))
    assert "/signin" in driver.current_url

def test_legal_links_render(driver):
    for path, heading in [("/privacy", "Privacy Policy"), ("/terms", "Terms of Service")]:
        PublicPage(driver).open(path)
        assert heading in driver.page_source

def test_pwa_manifest_is_valid():
    response = requests.get(BASE + "/manifest.webmanifest", timeout=10)
    manifest = response.json()
    assert response.status_code == 200
    assert manifest["name"] == "BiasSense AI"
    assert manifest["display"] == "standalone"
    assert len(manifest["icons"]) >= 3

def test_static_assets_and_links_are_not_broken():
    for path in ["/", "/signin", "/signup", "/forgot-password", "/privacy", "/terms", "/icon-192.png", "/icon-512.png"]:
        assert requests.get(BASE + path, timeout=10).status_code == 200

def test_accessibility_basics(driver):
    AuthPage(driver).open()
    assert driver.find_element(By.CSS_SELECTOR, "html").get_attribute("lang") == "en"
    assert all(field.get_attribute("aria-invalid") is not None for field in driver.find_elements(By.CSS_SELECTOR, "input[required]"))
