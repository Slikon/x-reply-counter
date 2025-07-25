let currentGoal = 50; // Default goal, will be loaded from storage

function cleanupOldCounters() {
    chrome.storage.local.get(null, (items) => {
        const todayKey = getTodayKey();
        for (const key of Object.keys(items)) {
            if (key.startsWith("replyCount_") && key !== todayKey) {
                chrome.storage.local.remove(key);
            }
        }
    });
}

function getTodayKey() {
    // Use local date (not UTC) so the counter resets at the user's local midnight
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(today.getDate()).padStart(2, '0');
    return `replyCount_${year}-${month}-${day}`; // e.g. replyCount_2025-07-23
}

function getMilestoneInfo(count, goal) {
    const percentage = (count / goal) * 100;
    
    if (percentage >= 100) {
        return {
            level: 'completed',
            message: '🎉 Goal Completed!',
            color: '#10b981', // green
            bgColor: 'rgba(16, 185, 129, 0.1)'
        };
    } else if (percentage >= 75) {
        return {
            level: 'high',
            message: '🔥 Almost there!',
            color: '#f59e0b', // amber
            bgColor: 'rgba(245, 158, 11, 0.1)'
        };
    } else if (percentage >= 50) {
        return {
            level: 'medium',
            message: '💪 Halfway done!',
            color: '#3b82f6', // blue
            bgColor: 'rgba(59, 130, 246, 0.1)'
        };
    } else if (percentage >= 25) {
        return {
            level: 'low',
            message: '⚡ Getting started!',
            color: '#8b5cf6', // purple
            bgColor: 'rgba(139, 92, 246, 0.1)'
        };
    } else {
        return {
            level: 'start',
            message: '',
            color: '#1da1f2', // twitter blue
            bgColor: 'rgba(29, 161, 242, 0.1)'
        };
    }
}

function updateCounterDisplay(count) {
    let box = document.getElementById("reply-counter-box");
    if (!box) {
        box = document.createElement("div");
        box.id = "reply-counter-box";
        document.body.appendChild(box);
    }
    
    const milestone = getMilestoneInfo(count, currentGoal);
    const percentage = Math.round((count / currentGoal) * 100);
    
    // Update content
    if (milestone.message) {
        box.innerHTML = `
            <div class="milestone-message">${milestone.message}</div>
            <div class="progress-text">Replies today: ${count} / ${currentGoal} (${percentage}%)</div>
        `;
    } else {
        box.innerHTML = `
            <div class="progress-text">Replies today: ${count} / ${currentGoal}</div>
        `;
    }
    
    // Update styling based on milestone
    box.style.backgroundColor = milestone.color;
    box.style.borderLeft = `4px solid ${milestone.color}`;
    
    // Add celebration animation for completed goal
    if (milestone.level === 'completed' && !box.classList.contains('celebration')) {
        box.classList.add('celebration');
        setTimeout(() => {
            box.classList.remove('celebration');
        }, 2000);
    }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'updateGoal') {
        currentGoal = message.goal;
        // Refresh display with new goal
        const key = getTodayKey();
        chrome.storage.local.get([key]).then((data) => {
            const count = data[key] || 0;
            updateCounterDisplay(count);
        });
    }
});

// Observe DOM for reply button clicks
document.addEventListener("click", async (e) => {
    if (e.target.closest('button[role="button"]')?.innerText?.toLowerCase() === "reply") {
        const key = getTodayKey();
        const data = await chrome.storage.local.get([key]);
        const count = (data[key] || 0) + 1;
        await chrome.storage.local.set({ [key]: count });
        updateCounterDisplay(count);
    }
});

// Listen for CMD + Enter keyboard shortcut to send replies
document.addEventListener("keydown", async (e) => {
    // Check for CMD + Enter (metaKey is CMD on Mac)
    if (e.metaKey && e.key === "Enter") {
        // Locate the Reply button for the active composer
        const replyButton = document.querySelector('button[data-testid="tweetButtonInline"]');
        const textInput = document.querySelector('span[data-text=true]');

        // Proceed only if the button exists AND is enabled (user has typed text)
        if (!replyButton || !textInput || textInput?.textContent.trim() === '') {
            return; // Nothing to do – either no button or empty input
        }

        const key = getTodayKey();
        const data = await chrome.storage.local.get([key]);
        const count = (data[key] || 0) + 1;
        await chrome.storage.local.set({ [key]: count });
        updateCounterDisplay(count);
    }
});

// On load, show today's counter
(async () => {
    cleanupOldCounters();
    
    // Load goal from storage
    const goalData = await chrome.storage.local.get(['dailyGoal']);
    currentGoal = goalData.dailyGoal || 50;
    
    const key = getTodayKey();
    const data = await chrome.storage.local.get([key]);
    const count = data[key] || 0;
    updateCounterDisplay(count);
})();
