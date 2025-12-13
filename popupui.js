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
    return date.toLocaleString(); // human readable full date/time
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
            const truncated = authToken.substring(0, 8) + '...';
            if (tokenStatus) tokenStatus.textContent = truncated;
            if (tokenStatus) tokenStatus.classList.remove('inactive');
            if (statusText) statusText.textContent = 'CONNECTED';
            if (statusText) statusText.classList.remove('inactive');
            if (statusIcon) statusIcon.classList.remove('inactive');
        } else {
            if (tokenStatus) tokenStatus.textContent = 'NOT FOUND';
            if (tokenStatus) tokenStatus.classList.add('inactive');
            if (statusText) statusText.textContent = 'DISCONNECTED';
            if (statusText) statusText.classList.add('inactive');
            if (statusIcon) statusIcon.classList.add('inactive');
        }

        if (syncTime) syncTime.textContent = formatTimestamp(Date.now());
    } catch (error) {
        console.error('Error updating status:', error);
    }
}