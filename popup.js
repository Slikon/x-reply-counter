// Load current settings and display current progress
document.addEventListener('DOMContentLoaded', async () => {
    // Load current goal
    const goalData = await chrome.storage.local.get(['dailyGoal']);
    const currentGoal = goalData.dailyGoal || 50;
    document.getElementById('daily-goal').value = currentGoal;
    
    // Load current count for today
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayKey = `replyCount_${year}-${month}-${day}`;
    const countData = await chrome.storage.local.get([todayKey]);
    const currentCount = countData[todayKey] || 0;
    
    // Update progress display
    document.getElementById('current-count').textContent = `${currentCount} / ${currentGoal}`;
});

// Save settings
document.getElementById('save-settings').addEventListener('click', async () => {
    const goal = parseInt(document.getElementById('daily-goal').value);
    
    if (goal && goal > 0) {
        // Save goal to storage
        await chrome.storage.local.set({ dailyGoal: goal });
        
        // Update the counter display in all X tabs
        const tabs = await chrome.tabs.query({ url: "*://*.x.com/*" });
        for (const tab of tabs) {
            chrome.tabs.sendMessage(tab.id, { 
                type: 'updateGoal', 
                goal: goal 
            }).catch(() => {
                // Ignore errors if content script isn't loaded
            });
        }
        
        // Close popup
        window.close();
    }
}); 