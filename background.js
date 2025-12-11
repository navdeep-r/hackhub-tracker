/**
 * HackHub Tracker - Background Service Worker
 * Manages authentication token synchronization from HackHub domain
 */

// Configuration
const HACKHUB_DOMAINS = [
    // Check backend first (where cookie is currently stored)
    'https://hackhub-cit-1.onrender.com/',
    'https://hackhub-cit.vercel.app/',
    // Localhost for development
    'http://localhost:5000/',
    'http://localhost:5173/',
    'http://localhost/',
    'https://localhost/',
    'https://hackhub.com/'
];
const TOKEN_CHECK_INTERVAL = 30000; // Check every 30 seconds
const AUTH_COOKIE_NAME = 'auth_token';

/**
 * Fetches the auth_token cookie from HackHub domain
 */
async function fetchAuthToken() {
    try {
        // Try localhost first, then production domain
        for (const domain of HACKHUB_DOMAINS) {
            const url = new URL(domain);

            // Get cookies for the domain
            const cookies = await chrome.cookies.getAll({
                url: domain,
                name: AUTH_COOKIE_NAME
            });

            if (cookies && cookies.length > 0) {
                const token = cookies[0].value;
                console.log('[HackHub Tracker] Auth token found:', token);

                return token;
            }
        }

        console.log('[HackHub Tracker] No auth token found in cookies');

        return null;

    } catch (error) {
        console.error('[HackHub Tracker] Error fetching auth token:', error);

        return null;
    }
}

/**
 * Periodic token synchronization
 */
// async function startTokenSync() {
//     // Initial fetch
//     await fetchAuthToken();

//     // Set up periodic checking
//     setInterval(async () => {
//         await fetchAuthToken();
//     }, TOKEN_CHECK_INTERVAL);
// }

/**
 * Listen for messages from content script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getAuthToken') {
        fetchAuthToken().then(token => {
            sendResponse({ token })
        })
        return true; // Keep channel open for async response
    }

    if (request.action === 'logEvent') {
        console.log('[HackHub Tracker]', request.message);
    }

    if (request.action === 'trackRegistration') {
        fetch('https://hackhub-cit-1.onrender.com/api/extension-webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request.payload)
        })
            .then(async res => {
                console.log('[HackHub Tracker] Webhook response status:', res.status);

                if (!res.ok) {
                    const text = await res.text();
                    console.error('[HackHub Tracker] Webhook failed:', res.status, text.substring(0, 200));
                    return;
                }

                return res.json();
            })
            .then(data => {
                if (data) {
                    console.log('[HackHub Tracker] Webhook success:', data);
                }
            })
            .catch(err => {
                console.error('[HackHub Tracker] Webhook error:', err);
            });

        return true;
    }
});

/**
 * Extension installation/startup handler
 */
chrome.runtime.onInstalled.addListener(() => {
    console.log('[HackHub Tracker] Extension installed/updated');
    // startTokenSync();
});

// Start token sync when service worker loads
// startTokenSync();

console.log('[HackHub Tracker] Background service worker initialized');
