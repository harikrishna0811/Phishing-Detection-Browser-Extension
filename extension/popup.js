/**
 * popup.js: Handles the Chrome extension popup for phishing detection.
 * Displays URL status, allows reporting, and logs user interactions for analytics.
 */

// Log when the popup is opened
document.addEventListener('DOMContentLoaded', () => {
  logInteraction('popup_opened');
  checkUrlStatus();
});

// Check the current URL's phishing status
function checkUrlStatus() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
          const url = tabs[0].url;
          document.getElementById('url').textContent = url;

          // Send URL to Flask API for prediction
          fetch('http://localhost:5000/predict', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: url })
          })
          .then(response => response.json())
          .then(data => {
              const statusElement = document.getElementById('status');
              if (data.result === 'phishing') {
                  statusElement.textContent = 'Warning: Phishing Detected!';
                  statusElement.style.color = 'red';
                  document.getElementById('container').style.backgroundColor = '#ffcccc';
              } else {
                  statusElement.textContent = 'Safe: No Phishing Detected';
                  statusElement.style.color = 'green';
                  document.getElementById('container').style.backgroundColor = '#ccffcc';
              }
          })
          .catch(error => {
              console.error('Error checking URL:', error);
              document.getElementById('status').textContent = 'Error: Could not check URL';
              document.getElementById('status').style.color = 'orange';
          });
      } else {
          document.getElementById('status').textContent = 'Error: No active tab';
          document.getElementById('status').style.color = 'orange';
      }
  });
}

// Handle report button click
document.getElementById('reportButton').addEventListener('click', () => {
  const url = document.getElementById('url').textContent;
  const label = document.getElementById('reportType').value === 'phishing' ? 1 : 0;

  // Log the report click interaction
  logInteraction('report_clicked');

  // Send report to Flask API
  fetch('http://localhost:5000/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url, label: label })
  })
  .then(response => response.json())
  .then(data => {
      alert(data.message || 'URL reported successfully!');
  })
  .catch(error => {
      console.error('Error reporting URL:', error);
      alert('Error reporting URL');
  });
});

// Log interactions to Flask API
function logInteraction(action) {
  fetch('http://localhost:5000/log_interaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: action })
  })
  .catch(error => console.error('Error logging interaction:', error));
}