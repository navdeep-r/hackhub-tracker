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
 * Terminal UI - Override the original popup.js functions to work with terminal elements
 */

// Override formatTimestamp to match terminal style
const originalFormatTimestamp = window.formatTimestamp;
window.formatTimestamp = function (timestamp) {
    if (!timestamp) return '--:--:--';
    const date = new Date(timestamp);
    return date.toLocaleString();
};

// Override updateStatus to work with terminal UI elements
const originalUpdateStatus = window.updateStatus;
window.updateStatus = async function () {
    try {
        const { token } = await chrome.runtime.sendMessage({ action: 'getAuthToken' })
        const authToken = token

        const tokenStatus = document.getElementById('token-status');
        const syncTime = document.getElementById('sync-time');
        const statusText = document.getElementById('status-text');
        const statusIcon = document.querySelector('.status-icon');

        if (authToken) {
            const truncated = '0x' + authToken.substring(0, 8).toUpperCase() + '...';
            if (tokenStatus) tokenStatus.textContent = truncated;
            if (tokenStatus) tokenStatus.classList.remove('inactive');
            if (statusText) statusText.textContent = 'CONNECTED';
            if (statusText) statusText.classList.remove('inactive');
            if (statusIcon) statusIcon.classList.remove('inactive');
        } else {
            if (tokenStatus) tokenStatus.textContent = '0xNULL';
            if (tokenStatus) tokenStatus.classList.add('inactive');
            if (statusText) statusText.textContent = 'DISCONNECTED';
            if (statusText) statusText.classList.add('inactive');
            if (statusIcon) statusIcon.classList.add('inactive');
        }

        if (syncTime) syncTime.textContent = window.formatTimestamp(Date.now());
    } catch (error) {
        console.error('Error updating status:', error);
    }
};

// Trigger initial update after override
updateStatus();