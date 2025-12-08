/**
 * HackHub Tracker - Popup Script
 * Displays extension status and auth token information
 */

function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString(); // human readable full date/time
}

async function updateStatus() {
    try {
        // const result = await chrome.storage.local.get(['lastSynced', 'domain']);
        const { token } = await chrome.runtime.sendMessage({ action: 'getAuthToken' })
        const authToken = token

        const tokenStatus = document.getElementById('token-status');
        const syncTime = document.getElementById('sync-time');
        const statusText = document.getElementById('status-text');
        const statusIndicator = document.querySelector('.status-indicator');

        if (authToken) {
            const truncated = authToken.substring(0, 8) + '...';
            tokenStatus.textContent = truncated;
            statusText.textContent = 'Active';
            statusIndicator.className = 'status-indicator status-active';
        } else {
            tokenStatus.textContent = 'Not Found';
            statusText.textContent = 'No Token';
            statusIndicator.className = 'status-indicator status-inactive';
        }

        syncTime.textContent = formatTimestamp(Date.now());
    } catch (error) {
        console.error('Error updating status:', error);
    }
}

// Update status on load
updateStatus();

// Refresh button
document.getElementById('refresh-btn').addEventListener('click', () => {
    updateStatus();

    // Send message to background to force token check
    chrome.runtime.sendMessage({ action: 'logEvent', message: 'Manual refresh triggered' });
});

// Auto-refresh every 5 seconds
setInterval(updateStatus, 30000);
