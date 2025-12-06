/**
 * HackHub Tracker - Background Service Worker
 * Manages authentication token synchronization from HackHub domain
 */

// Configuration
const HACKHUB_DOMAINS = ['http://localhost:3000', 'https://hackhub.com'];
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
                console.log('[HackHub Tracker] Auth token found:', token.substring(0, 10) + '...');

                // Save to chrome.storage.local
                await chrome.storage.local.set({
                    authToken: token,
                    lastSynced: Date.now(),
                    domain: domain
                });

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
async function startTokenSync() {
    // Initial fetch
    await fetchAuthToken();

    // Set up periodic checking
    setInterval(async () => {
        await fetchAuthToken();
    }, TOKEN_CHECK_INTERVAL);
}

/**
 * Listen for messages from content script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getAuthToken') {
        chrome.storage.local.get(['authToken'], (result) => {
            sendResponse({ token: result.authToken || null });
        });
        return true; // Keep channel open for async response
    }

    if (request.action === 'logEvent') {
        console.log('[HackHub Tracker]', request.message);
    }
});

/**
 * Extension installation/startup handler
 */
chrome.runtime.onInstalled.addListener(() => {
    console.log('[HackHub Tracker] Extension installed/updated');
    startTokenSync();
});

// Start token sync when service worker loads
startTokenSync();

console.log('[HackHub Tracker] Background service worker initialized');
