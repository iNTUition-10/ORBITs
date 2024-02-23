// 扩展程序的 Service Worker 在后台监控浏览器事件。
// Service Worker 是特殊的 JavaScript 环境，用于处理事件，并会在不需要时终止。

// 仅监听STARS网站
const stars_url = 'https://wish.wis.ntu.edu.sg/pls/webexe/AUS_STARS_PLANNER.planner' 


// onClicked: 点击操作图标时触发。如果操作具有弹出式窗口，则不会触发此事件。
chrome.action.onClicked.addListener(async (tab) => {
    if (tab.url.startsWith(stars_url)) {
        const prevState = await chrome.action.getBadgeText({tabId: tab.id})
        console.log(prevState)
        const nextState = prevState === "ON" ? "OFF" : "ON"
        await chrome.action.setBadgeText({
            tabId: tab.id,
            text: nextState
        })
        if (nextState === "ON") {
            // Insert the CSS file when the user turns the extension on
            await chrome.scripting.insertCSS({
                files: ["focus-mode.css"],
                target: { tabId: tab.id },
            });
        } else if (nextState === "OFF") {
            // Remove the CSS file when the user turns the extension off
            await chrome.scripting.removeCSS({
                files: ["focus-mode.css"],
                target: { tabId: tab.id },
            });
        }
    }
})

// runtime.onInstalled()。
// 此方法可让扩展程序在安装时设置初始状态或完成一些任务。
chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({text: 'OFF'}) // 将扩展程序的图标上的徽章设置为“OFF”
})