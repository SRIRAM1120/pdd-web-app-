from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class PublicPage:
    def __init__(self, driver, base_url="http://127.0.0.1:5174"):
        self.driver, self.base_url = driver, base_url
        self.wait = WebDriverWait(driver, 15)

    def open(self, path="/"):
        self.driver.get(self.base_url + path)
        self.wait.until(EC.presence_of_element_located((By.ID, "root")))
        return self
