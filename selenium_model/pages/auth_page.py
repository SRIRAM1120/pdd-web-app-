from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class AuthPage:
    def __init__(self, driver, base_url="http://127.0.0.1:5174"):
        self.driver = driver
        self.base_url = base_url
        self.wait = WebDriverWait(driver, 15)

    def open(self):
        self.driver.get(self.base_url + "/signin")
        self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".auth-card")))
        return self

    def login(self, email, password):
        fields = self.driver.find_elements(By.CSS_SELECTOR, ".auth-card input")
        fields[0].send_keys(email)
        fields[1].send_keys(password)
        self.driver.find_element(By.CSS_SELECTOR, ".primary-button").click()

    def visible_error(self):
        return self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".notice.error"))).text
