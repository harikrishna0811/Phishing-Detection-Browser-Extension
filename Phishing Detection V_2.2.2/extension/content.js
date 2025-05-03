/**
 * Content script to check URLs and block phishing pages.
 * Executes at document_start to prevent page rendering if phishing is detected.
 */

function blockPage() {
  // Prevent further rendering
  document.documentElement.innerHTML = '';
  const warning = document.createElement('div');
  warning.className = 'phishing-warning';
  warning.innerHTML = `
    <h1>Warning: Phishing Detected!</h1>
    <p>This website is a phishing attempt and has been blocked for your safety.</p>
    <p>Please report this URL using the extension popup.</p>
  `;
  document.body.appendChild(warning);

  // Inject styles for the warning
  const style = document.createElement('style');
  style.textContent = `
    .phishing-warning {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background-color: #ff4d4d;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      text-align: center;
      padding: 20px;
      margin: 0;
    }
    .phishing-warning h1 {
      font-size: 24px;
      margin: 0 0 10px;
    }
    .phishing-warning p {
      font-size: 16px;
      margin: 5px 0;
    }
  `;
  document.head.appendChild(style);
  console.log('Page blocked successfully'); // Debug log
}

// Check URL immediately at document_start
(function () {
  const url = window.location.href;
  console.log('Checking URL:', url); // Debug log
  chrome.runtime.sendMessage({
    action: 'checkURL',
    url: url
  }, response => {
    if (chrome.runtime.lastError) {
      console.error('Error sending message:', chrome.runtime.lastError);
      return;
    }
    if (response && response.success && response.result === 'phishing') {
      console.log('Phishing detected, blocking page'); // Debug log
      blockPage();
    }
  });
})();

// Listen for blockPage messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'blockPage') {
    console.log('Received blockPage message'); // Debug log
    blockPage();
  }
});