const GOAL = 50;

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
    const today = new Date();
    return `replyCount_${today.toISOString().split("T")[0]}`; // e.g. replyCount_2025-07-23
}

function updateCounterDisplay(count) {
    let box = document.getElementById("reply-counter-box");
    if (!box) {
        box = document.createElement("div");
        box.id = "reply-counter-box";
        document.body.appendChild(box);
    }
    box.innerText = `Replies today: ${count} / Goal: ${GOAL}`;
}

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

// On load, show today's counter
(async () => {
    cleanupOldCounters();
    
    const key = getTodayKey();
    const data = await chrome.storage.local.get([key]);
    const count = data[key] || 0;
    updateCounterDisplay(count);
})();
