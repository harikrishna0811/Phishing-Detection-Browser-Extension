Phishing Detection Extension and API (Local XAMPP Setup)
This project consists of a Chrome browser extension and a Flask API to detect, block, and report phishing URLs using machine learning, configured for a local XAMPP server. When a phishing URL is detected, the webpage is blocked with a red warning message, and a centered popup with a red background appears. Legitimate URLs display a green popup when checked. The popup includes a "Report" button to classify URLs as "Phishing" or "Legitimate."
Directory Structure
phishing-detection/
├── flask-api/               # Directory for model files (created at runtime)
├── app.py                   # Flask API main file
├── config.py                # Configuration file
├── model_training.py        # Model training script
├── .env                     # Environment variables
├── README.md                # This file
└── extension/               # Browser extension files
    ├── manifest.json
    ├── background.js
    ├── content.js
    ├── popup.html
    ├── popup.js
    ├── styles.css
    ├── icon48.png           # Extension icon (48x48)
    ├── icon128.png          # Extension icon (128x128)

Prerequisites

XAMPP: Installed and running with MySQL (default port 3306).
Python: Version 3.8+ installed.
Google Chrome: Version 88+ recommended for automatic popup functionality.
Icons: icon48.png (48x48 pixels) and icon128.png (128x128 pixels) in extension/.

Setup Instructions
1. Configure XAMPP

Start XAMPP:

Open XAMPP Control Panel (C:\xampp\xampp-control.exe or via Start menu).
Click "Start" next to MySQL.


Create Database:

Open a browser and go to http://localhost/phpmyadmin.
Click "New" to create a database named phishing_detection.
Select the phishing_detection database and run this SQL in the SQL tab:CREATE TABLE reported_urls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    url TEXT NOT NULL,
    label INT NOT NULL,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);




Seed Database for Testing:

In phpMyAdmin, run:INSERT INTO reported_urls (url, label) VALUES
('http://phishing.example.com', 1),
('http://legitimate.example.com', 0),
('http://test-phish.com', 1),
('http://safe-site.com', 0);




Verify MySQL Credentials:

Default XAMPP MySQL user is root with an empty password ('').
If you set a custom password, update MYSQL_PASSWORD in .env.



2. Set Up Python Environment

Install Python:

Download and install Python 3.8+ from python.org if not installed.
Ensure "Add Python to PATH" is checked during installation.


Install Dependencies:

Open Command Prompt (Windows key + R, type cmd, press Enter).
Navigate to the phishing-detection folder (after unzipping):cd path\to\phishing-detection


Install required packages:pip install flask flask-cors mysql-connector-python pandas scikit-learn python-dotenv





3. Configure Environment

Edit .env in the phishing-detection folder using Notepad:
Update MYSQL_PASSWORD if you have a custom MySQL password.
Ensure API_URL=http://localhost:5000.


Example .env:MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DB=phishing_detection
FLASK_ENV=development
API_URL=http://localhost:5000



4. Run the Flask API

In Command Prompt, navigate to phishing-detection:cd path\to\phishing-detection


Create the flask-api folder if it doesn’t exist:mkdir flask-api


Run the API:python app.py


Keep the Command Prompt open; the API runs on http://localhost:5000.

5. Train the Model

In the same Command Prompt (open a new one if needed):cd path\to\phishing-detection
python model_training.py


Verify that flask-api/phishing_model.pkl and flask-api/vectorizer.pkl are created.

6. Load the Chrome Extension

Open Chrome and go to chrome://extensions/.
Enable "Developer mode" (top right).
Click "Load unpacked" and select the phishing-detection/extension folder.
Ensure icon48.png and icon128.png are in the extension folder.

Testing the Blocking Feature

Simulate Phishing URLs:

Since you can’t directly visit http://phishing.example.com, use a local server or test with URLs the model recognizes:
Option 1: Set up a local web server (e.g., XAMPP Apache):
Place a test HTML file (e.g., phish.html) in C:\xampp\htdocs with content: <h1>Test Phishing Page</h1>.
Access http://localhost/phish.html and ensure the model flags it (see below).


Option 2: Use the popup to test known phishing URLs:
Open the extension popup on any page.
Report http://test-phish.com as phishing via the "Report" button.
Retrain the model (python model_training.py).
Test by checking http://test-phish.com in the popup (manually enter it in the browser if needed).






Verify Blocking:

Visit a URL the model flags as phishing (e.g., http://test-phish.com after reporting and retraining).
Expected behavior:
The page is blocked, showing a red warning: “Warning: Phishing Detected! This website is a phishing attempt and has been blocked for your safety.”
A centered red popup appears (Chrome 88+), showing: “Warning: This website may be a phishing attempt!”
If the popup doesn’t open, a native alert appears: “Warning: This website is a phishing attempt! The page has been blocked.”


Check the Console (right-click page, Inspect, Console tab) for logs:
Look for “Checking URL:”, “API response:”, and “Phishing detected, blocking page”.
Errors like “Error sending message” or “Prediction error” indicate issues.




Test Legitimate URLs:

Visit a known legitimate URL (e.g., http://safe-site.com after reporting it as legitimate).
Open the popup manually (click the extension icon).
Expected: Green popup with “This website appears legitimate.”


Debugging:

If the page isn’t blocked:
Ensure app.py is running (http://localhost:5000).
Check Console logs for errors.
Verify the model files exist (flask-api/phishing_model.pkl, flask-api/vectorizer.pkl).
Confirm the URL is in the database and flagged as phishing:SELECT * FROM reported_urls WHERE url = 'http://test-phish.com' AND label = 1;


Retrain the model if needed.


If the popup doesn’t appear, ensure Chrome is version 88+ (chrome://version).



Usage

The extension checks URLs when you visit a webpage.
If a URL is flagged as phishing:
The webpage is blocked with a red warning message.
A centered red popup appears (Chrome 88+).


If a URL is legitimate, the popup (opened manually or via "Check URL") is green.
In the popup:
Click "Check URL" to recheck.
Select "Phishing" or "Legitimate" from the dropdown, click "Report URL".


To retrain the model:python model_training.py
