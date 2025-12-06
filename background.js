// background.js - 负责管理图标状态

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 接收到 content.js 发来的报警信号
    if (request.action === "update_badge" && sender.tab) {
        // 设置红色背景
        chrome.action.setBadgeBackgroundColor({
            tabId: sender.tab.id,
            color: "#FF0000"
        });
        // 设置文本为 "!"
        chrome.action.setBadgeText({
            tabId: sender.tab.id,
            text: "!"
        });
    }
});