/**
 * HackHub Tracker - Popup Script
 * Displays extension status and auth token information
 */

function formatTimestamp(timestamp) {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) {
        return 'Just now';
    } else if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes}m ago`;
    } else {
        const hours = Math.floor(diff / 3600000);
        return `${hours}h ago`;
    }
}

async function updateStatus() {
    try {
        const result = await chrome.storage.local.get(['authToken', 'lastSynced', 'domain']);

        const tokenStatus = document.getElementById('token-status');
        const syncTime = document.getElementById('sync-time');
        const statusText = document.getElementById('status-text');
        const statusIndicator = document.querySelector('.status-indicator');

        if (result.authToken) {
            const truncated = result.authToken.substring(0, 8) + '...';
            tokenStatus.textContent = truncated;
            statusText.textContent = 'Active';
            statusIndicator.className = 'status-indicator status-active';
        } else {
            tokenStatus.textContent = 'Not Found';
            statusText.textContent = 'No Token';
            statusIndicator.className = 'status-indicator status-inactive';
        }

        syncTime.textContent = formatTimestamp(result.lastSynced);
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
setInterval(updateStatus, 5000);
