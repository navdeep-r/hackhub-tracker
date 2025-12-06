/**
 * HackHub Tracker - Content Script (Smart Scanner)
 * Detects registration button clicks on hackathon platforms
 */

// Configuration
const WEBHOOK_URL = 'http://localhost:3000/api/extension-webhook';
const REGISTER_KEYWORDS = [
    'register',
    'apply',
    'sign up',
    'signup',
    'join',
    'enroll',
    'participate',
    'attend'
];

// Track recent clicks to prevent duplicates
const recentClicks = new Set();
const CLICK_COOLDOWN = 2000; // 2 seconds

/**
 * Get auth token from storage
 */
async function getAuthToken() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'getAuthToken' }, (response) => {
            resolve(response?.token || null);
        });
    });
}

/**
 * Check if element or parent contains registration keywords
 */
function isRegistrationButton(element) {
    // Check up to 5 parent levels
    let current = element;
    let depth = 0;
    const maxDepth = 5;

    while (current && depth < maxDepth) {
        // Check text content
        const text = current.textContent || current.innerText || '';
        const normalizedText = text.toLowerCase().trim();

        // Check for keywords
        for (const keyword of REGISTER_KEYWORDS) {
            if (normalizedText.includes(keyword)) {
                return { found: true, keyword, element: current };
            }
        }

        // Check attributes (aria-label, title, etc.)
        const ariaLabel = current.getAttribute('aria-label') || '';
        const title = current.getAttribute('title') || '';
        const combined = (ariaLabel + ' ' + title).toLowerCase();

        for (const keyword of REGISTER_KEYWORDS) {
            if (combined.includes(keyword)) {
                return { found: true, keyword, element: current };
            }
        }

        current = current.parentElement;
        depth++;
    }

    return { found: false };
}

/**
 * Send registration event to webhook
 */
async function sendRegistrationEvent(keyword, element) {
    try {
        const userToken = await getAuthToken();

        if (!userToken) {
            console.warn('[HackHub Tracker] No auth token found. User may not be logged in.');
            alert('⚠️ HackHub Tracker: Please log in to HackHub first to track registrations.');
            return;
        }

        const payload = {
            userToken: userToken,
            currentUrl: window.location.href,
            timestamp: Date.now(),
            keyword: keyword,
            elementText: element.textContent?.substring(0, 100) || '',
            domain: window.location.hostname
        };

        console.log('[HackHub Tracker] Sending registration event:', payload);

        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('[HackHub Tracker] ✅ Successfully tracked registration:', result);

            // Success notification
            alert(`✅ HackHub Tracker: Registration tracked successfully!\n\nURL: ${window.location.href}\nKeyword: "${keyword}"`);

            // Log to background for debugging
            chrome.runtime.sendMessage({
                action: 'logEvent',
                message: `Registration tracked: ${keyword} on ${window.location.hostname}`
            });
        } else {
            console.error('[HackHub Tracker] ❌ Webhook failed:', response.status, response.statusText);
            alert(`❌ HackHub Tracker: Failed to track registration (${response.status})`);
        }
    } catch (error) {
        console.error('[HackHub Tracker] ❌ Error sending registration event:', error);
        alert(`❌ HackHub Tracker: Network error - ${error.message}`);
    }
}

/**
 * Handle click events with event delegation
 */
function handleClick(event) {
    const target = event.target;

    // Check if this is a registration button
    const result = isRegistrationButton(target);

    if (result.found) {
        // Create unique identifier for this click
        const clickId = `${window.location.href}-${result.keyword}-${Date.now()}`;

        // Check cooldown to prevent duplicate tracking
        if (recentClicks.has(clickId.split('-').slice(0, 2).join('-'))) {
            console.log('[HackHub Tracker] Click ignored (cooldown period)');
            return;
        }

        // Add to recent clicks
        const cooldownKey = clickId.split('-').slice(0, 2).join('-');
        recentClicks.add(cooldownKey);
        setTimeout(() => recentClicks.delete(cooldownKey), CLICK_COOLDOWN);

        console.log('[HackHub Tracker] 🎯 Registration button detected!', {
            keyword: result.keyword,
            url: window.location.href,
            elementText: result.element.textContent?.substring(0, 50)
        });

        // Send to webhook
        sendRegistrationEvent(result.keyword, result.element);
    }
}

/**
 * Initialize the tracker
 */
function initializeTracker() {
    console.log('[HackHub Tracker] Content script loaded on:', window.location.href);

    // Add click event listener with delegation
    document.addEventListener('click', handleClick, true);

    // Also listen for button clicks specifically (for SPAs)
    document.addEventListener('submit', (event) => {
        const form = event.target;
        const submitButton = form.querySelector('[type="submit"]');
        if (submitButton) {
            handleClick({ target: submitButton });
        }
    }, true);

    console.log('[HackHub Tracker] ✅ Smart Scanner active');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTracker);
} else {
    initializeTracker();
}

// Re-check on dynamic content loads (for SPAs)
const observer = new MutationObserver(() => {
    // Observer is just for logging - actual detection happens on click
    console.log('[HackHub Tracker] DOM mutation detected');
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
