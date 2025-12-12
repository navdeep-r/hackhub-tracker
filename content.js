/**
 * HackHub Tracker - Content Script (Smart Scanner)
 * Detects registration button clicks on hackathon platforms
 */

// Configuration
const WEBHOOK_URL = 'https://hackhub-cit-1.onrender.com/extension-webhook';
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

// // Track recent clicks to prevent duplicates
// const recentClicks = new Set();
// const CLICK_COOLDOWN = 2000; // 2 seconds

// Track last auto-registered URL for Unstop to avoid duplicates
let lastUnstopAutoUrl = null;
let lastDevpostAutoUrl = null;

/**
 * Check if current page is an Unstop hackathon page
 * e.g. https://unstop.com/hackathons/<name>
 */
function isOnUnstopHackathonPage() {
    return window.location.hostname.endsWith('unstop.com');
}

function isOnDevpostHackathonPage() {
    return window.location.hostname.endsWith('devpost.com') && !window.location.hostname.startsWith('devpost.com') && window.location.pathname == '/';
}

/**
 * Build canonical Unstop hackathon URL without query params
 * e.g. https://unstop.com/hackathons/<name>
 */
function getUnstopCanonicalUrl() {
    return `https://unstop.com${window.location.pathname}`;
}
function getDevpostCanonicalUrl() {
    return `https://${window.location.hostname}`;
}

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
// function isRegistrationButton(element) {
//     // Climb up to 5 parent levels
//     let node = element;
//     let depth = 0;

//     while (node && depth < 5) {
//         console.log("Checking:", node, node.textContent);

//         // Only check visible text (no aria/title stuff)
//         const text = (node.textContent || "")
//             .toLowerCase()
//             .trim();

//         // strict match: has the word `register`
//         if (text.includes("register")) {
//             return { found: true, keyword: "register", element: node };
//         }

//         node = node.parentElement;
//         depth++;
//     }

//     return { found: false };
// }


/**
 * Send registration event to webhook
 */
async function sendRegistrationEvent(keyword, element, overrideUrl) {
    console.log('[Tracker] sendreg fired');

    try {
        const userToken = await getAuthToken();

        if (!userToken) {
            console.warn('[HackHub Tracker] No auth token found. User may not be logged in.');
            console.log('⚠️ HackHub Tracker: Please log in to HackHub first to track registrations.');
            return;
        }

        const currentUrl = overrideUrl;

        const payload = {
            userToken,
            currentUrl,
            timestamp: Date.now(),
            keyword,
            elementText: element.textContent?.substring(0, 100) || '',
            domain: window.location.hostname
        };

        console.log('[HackHub Tracker] Sending registration event:', payload);

        res = await (chrome.runtime.sendMessage({
            action: "trackRegistration",
            payload
        }));

        // console.log("rel: ", res)

    } catch (error) {
        console.error('[HackHub Tracker] ❌ Error sending registration event:', error);
        console.log(`❌ HackHub Tracker: Network error - ${error.message}`);
    }
}

/**
 * Unstop-specific auto-detection:
 * If the user is on https://unstop.com/hackathons/<name>
 * and the element with id "un-register-btn" contains "You've Registered",
 * we auto-send a registration event (once per URL).
 */
async function checkUnstopRegistration() {
    if (!isOnUnstopHackathonPage()) return;
    console.log("on unstop hackathon page");

    const btn = document.getElementById("un-register-btn");
    console.log("checked for btn");
    if (!btn) {
        // Not registered yet / button not present
        return;
    }

    const text = (btn.textContent || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

    console.log("button found");
    // Match the "You've Registered" text (case-insensitive)
    if (!(text.includes("you've registered") || text.includes("view details"))) {
        return;
    }

    const canonicalUrl = getUnstopCanonicalUrl();

    // Avoid duplicate sends for same page
    if (lastUnstopAutoUrl === canonicalUrl) {
        console.log('[HackHub Tracker] Unstop auto: already tracked for', canonicalUrl);
        return;
    }

    lastUnstopAutoUrl = canonicalUrl;

    console.log('[HackHub Tracker] Unstop auto-detect: user registered on', canonicalUrl);

    // await sendRegistrationEvent('unstop-auto', btn, canonicalUrl);
    console.log("registered unstop");
}

async function checkDevpostRegistration() {
    if (!isOnDevpostHackathonPage()) return;

    const btn = document.getElementById('create-project-sidebar-cta');

    if (!btn) {
        // Not registered yet / button not present
        return;
    }

    const text = (btn.textContent || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

    // Match the "Start Project" text (case-insensitive)
    if (!(text.includes("start project"))) return;

    const canonicalUrl = getDevpostCanonicalUrl();

    // Avoid duplicate sends for same page
    if (lastDevpostAutoUrl === canonicalUrl) {
        console.log('[HackHub Tracker] Devpost auto: already tracked for', canonicalUrl);
        return;
    }

    lastDevpostAutoUrl = canonicalUrl;

    console.log('[HackHub Tracker] Devpost auto-detect: user registered on', canonicalUrl);

    // await sendRegistrationEvent('devpost-auto', btn, canonicalUrl);
    console.log("registered devpost");
}

/**
 * Handle click events with event delegation
*/
// function handleClick(event) {
//     console.log('[Tracker] handleClick fired');

//     const target = event.target;

//     // Check if this is a registration button
//     const result = isRegistrationButton(target);

//     if (!result.found) return
//     // Create unique identifier for this click
//     const clickId = `${window.location.href}-${result.keyword}-${Date.now()}`;

//     // Check cooldown to prevent duplicate tracking
//     if (recentClicks.has(clickId.split('-').slice(0, 2).join('-'))) {
//         console.log('[HackHub Tracker] Click ignored (cooldown period)');
//         return;
//     }

//     // Add to recent clicks
//     const cooldownKey = clickId.split('-').slice(0, 2).join('-');
//     recentClicks.add(cooldownKey);
//     setTimeout(() => recentClicks.delete(cooldownKey), CLICK_COOLDOWN);

//     console.log('[HackHub Tracker] 🎯 Registration button detected!', {
//         keyword: result.keyword,
//         url: window.location.href,
//         elementText: result.element.textContent?.substring(0, 50)
//     });

//     // Send to webhook
//     sendRegistrationEvent(result.keyword, result.element);

// }

/**
 * Initialize the tracker
*/
// Add near the top, after configuration:
// const HACKHUB_HOSTS = ['localhost', 'hackhub-cit.vercel.app', 'hackhub-cit-1.onrender.com', 'hackhub.com'];

/**
 * Check if we are on HackHub itself
*/
// function isOnHackHub() {
//     const host = window.location.hostname;
//     // Adjust this if you serve HackHub from a custom dev host
//     return HACKHUB_HOSTS.includes(host);
// }

/**
 * Initialize the tracker
*/
function initializeTracker() {
    console.log('[HackHub Tracker] Content script loaded on:', window.location.href);
    console.log(getDevpostCanonicalUrl());
    // If we're on an Unstop hackathon page, try auto-detect once on load
    if (isOnUnstopHackathonPage()) {
        console.log('[HackHub Tracker] Unstop hackathon page detected:', window.location.href);
        checkUnstopRegistration();

    } else if (isOnDevpostHackathonPage()) {
        console.log('[HackHub Tracker] Devpost hackathon page detected:', window.location.href);
        checkDevpostRegistration();

    }
    // } else {
    //     // // Add click event listener with delegation
    //     // document.addEventListener('click', handleClick, true);

    //     // // Also listen for button clicks specifically (for SPAs)
    //     // document.addEventListener('submit', (event) => {
    //     //     const form = event.target;
    //     //     const submitButton = form.querySelector('[type="submit"]');
    //     //     if (submitButton) {
    //     //         handleClick({ target: submitButton });
    //     //     }
    //     // }, true);
    //     // console.log('[HackHub Tracker] Old click logic active for NON-Unstop pages');

}


// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTracker);
} else {
    initializeTracker();
}

// Re - check on dynamic content loads(for SPAs)
const observer = new MutationObserver(() => {
    if (isOnUnstopHackathonPage()) checkUnstopRegistration();
    else if (isOnDevpostHackathonPage()) checkDevpostRegistration();

    console.log('[HackHub Tracker] DOM mutation detected');
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
