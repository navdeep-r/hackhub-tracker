// Generate matrix rain effect
const matrix = document.getElementById('matrix');
const chars = '01';
for (let i = 0; i < 8; i++) {
    const column = document.createElement('div');
    column.className = 'matrix-column';
    column.style.left = Math.random() * 100 + '%';
    column.style.animationDuration = (Math.random() * 3 + 2) + 's';
    column.style.animationDelay = Math.random() * 2 + 's';
    column.textContent = Array(20).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('\n');
    matrix.appendChild(column);
}

/**
 * HackHub Tracker - Popup Script
 * Displays extension status and auth token information
 */

function formatTimestamp(timestamp) {
    if (!timestamp) return '--:--:--';
    const date = new Date(timestamp);
    return date.toLocaleString();
}

async function updateStatus() {
    try {
        const { token } = await chrome.runtime.sendMessage({ action: 'getAuthToken' })
        const authToken = token

        const tokenStatus = document.getElementById('token-status');
        const syncTime = document.getElementById('sync-time');
        const statusText = document.getElementById('status-text');
        const statusIcon = document.querySelector('.status-icon');

        if (authToken) {
            const truncated = '0x' + authToken.substring(0, 8).toUpperCase() + '...';
            tokenStatus.textContent = truncated;
            tokenStatus.classList.remove('inactive');
            statusText.textContent = 'CONNECTED';
            statusText.classList.remove('inactive');
            statusIcon.classList.remove('inactive');
        } else {
            tokenStatus.textContent = '0xNULL';
            tokenStatus.classList.add('inactive');
            statusText.textContent = 'DISCONNECTED';
            statusText.classList.add('inactive');
            statusIcon.classList.add('inactive');
        }

        syncTime.textContent = formatTimestamp(Date.now());
    } catch (error) {
        console.error('Error updating status:', error);
    }
}

// Update status on load
updateStatus();

// Refresh button
document.getElementById('refresh-btn').addEventListener('click', function () {
    updateStatus();

    // Send message to background to force token check
    chrome.runtime.sendMessage({ action: 'logEvent', message: 'Manual refresh triggered' });
});

// Auto-refresh every 30 seconds
setInterval(updateStatus, 30000);
