/**
 * Background service worker for phishing detection extension.
 * Handles API requests and messaging with popup/content scripts.
 * Signals content script to block phishing pages and opens popup.
 */

const API_URL = 'http://localhost:5000'; // Local Flask API

// Listen for messages from content or popup scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkURL') {
    checkPhishing(message.url)
      .then(result => {
        console.log('API response:', result); // Debug log
        if (result.result === 'phishing') {
          // Get active tab if sender.tab is unavailable
          const tabIdPromise = sender.tab && sender.tab.id
            ? Promise.resolve(sender.tab.id)
            : chrome.tabs.query({ active: true, currentWindow: true })
                .then(tabs => tabs[0]?.id);

          tabIdPromise.then(tabId => {
            if (tabId) {
              // Signal content script to block the page
              chrome.tabs.sendMessage(tabId, { action: 'blockPage', url: message.url }, response => {
                if (chrome.runtime.lastError) {
                  console.error('Error sending blockPage message:', chrome.runtime.lastError);
                }
              });
            } else {
              console.warn('No valid tab ID found for blocking');
            }

            // Attempt to open the popup programmatically
            try {
              chrome.action.openPopup();
              chrome.runtime.sendMessage({ action: 'showPhishingAlert', url: message.url });
            } catch (e) {
              console.warn('Popup open failed:', e);
              alert('Warning: This website is a phishing attempt! The page has been blocked.');
            }
          }).catch(err => {
            console.error('Error getting tab ID:', err);
          });
        }
        sendResponse({ success: true, result });
      })
      .catch(error => {
        console.error('Check URL error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }
});

/**
 * Check if a URL is phishing by calling the backend API
 * @param {string} url - The URL to check
 * @returns {Promise<Object>} - API response
 */
async function checkPhishing(url) {
  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking URL:', error);
    throw error;
  }
}

/**
 * Report a phishing URL to the backend
 * @param {string} url - The URL to report
 * @param {number} label - 1 for phishing, 0 for legitimate
 * @returns {Promise<Object>} - API response
 */
async function reportPhishing(url, label) {
  try {
    const response = await fetch(`${API_URL}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, label }),
    });

    if (!response.ok) {
      throw new Error(`Report error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error reporting URL:', error);
    throw error;
  }
}

// Handle report requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'reportPhishing') {
    reportPhishing(message.url, message.label)
      .then(result => sendResponse({ success: true, message: result.message }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});