function addPhishingLabel(anchor, result) {
  // Prevent duplicate label by checking if the next sibling is already a label
  if (anchor.nextSibling?.classList?.contains('phishing-label-host')) return;

  const confidence = Math.round(result.confidence * 100);
  const text = result.result === 'phishing'
    ? `Phishy (${confidence}%)`
    : `Legit (${confidence}%)`;

  // Create wrapper span
  const host = document.createElement('span');
  host.className = 'phishing-label-host';
  host.style.marginLeft = '8px';
  host.style.display = 'inline-block';

  // Attach shadow DOM
  const shadow = host.attachShadow({ mode: 'open' });

  // Label element
  const label = document.createElement('span');
  label.textContent = text;
  label.setAttribute('role', 'status');
  label.setAttribute('aria-label', text);

  // Style
  const style = document.createElement('style');
  style.textContent = `
    span {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      color: white;
      background-color: ${result.result === 'phishing' ? 'red' : 'green'};
      direction: ltr !important;
      unicode-bidi: plaintext !important;
      white-space: nowrap;
      display: inline-block;
    }
  `;

  shadow.appendChild(style);
  shadow.appendChild(label);

  // Insert label after the anchor
  anchor.insertAdjacentElement('afterend', host);
}

function checkAndLabelLinks() {
  const anchors = document.querySelectorAll('a[href^="http"]:not([data-checked])');

  anchors.forEach((anchor, index) => {
    anchor.setAttribute('data-checked', 'true');

    // Send URL to background for phishing check
    setTimeout(() => {
      chrome.runtime.sendMessage({ action: 'checkURL', url: anchor.href }, response => {
        if (response && response.success && response.result) {
          addPhishingLabel(anchor, response.result);
        }
      });
    }, index * 50); // Throttle to prevent overload
  });
}

function observeSearchResults() {
  const observer = new MutationObserver(() => {
    checkAndLabelLinks();
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

(function init() {
  const searchDomains = [
    'google.com/search',
    'bing.com/search',
    'duckduckgo.com',
    'search.yahoo.com'
  ];

  if (searchDomains.some(domain => window.location.href.includes(domain))) {
    checkAndLabelLinks();
    observeSearchResults();
  }
})();
