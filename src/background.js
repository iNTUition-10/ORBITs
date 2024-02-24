// 扩展程序的 Service Worker 在后台监控浏览器事件。
// Service Worker 是特殊的 JavaScript 环境，用于处理事件，并会在不需要时终止。

// 仅监听STARS网站
const stars_url = 'https://wish.wis.ntu.edu.sg/pls/webexe/AUS_STARS_PLANNER.planner'
const info_url = 'https://wish.wis.ntu.edu.sg/pls/webexe/AUS_STARS_PLANNER.course_info'


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

// 此函数用于获取课程时间信息，后台请求防止出现CORS跨域问题
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request.action == "FETCH_COURSES") {
        console.log("background.js received FETCH_COURSE request", request)
        const { acad, semester, p1, p2, FullPart, matric } = request.form
        const { courses, cookies } = request
        requests = []
        for(var i=0; i<request.courses.length;i++){
            console.log("Dealing with ", courses[i])
            var details = {
                acad,
                semester,
                p1,
                p2,
                FullPart,
                matric,
                r_subj_code: courses[i].hash,
            }
            var formBody = [];
            for (var property in details) {
              var encodedKey = encodeURIComponent(property);
              var encodedValue = encodeURIComponent(details[property]);
              formBody.push(encodedKey + "=" + encodedValue);
            }
            formBody = formBody.join("&");
            requests.push(fetch(info_url, {method: 'POST', body: formBody, headers: {
                'Accept': "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookies,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }}))
        }
        console.log(requests)
        Promise.all(requests).then(responses => {
            console.log("All requests completed")
            responses = responses.map((response) => response.text())
            console.log(responses)
            courses = []
            for(var i = 0;i<responses.length;i++){
                res = responses[i]
                res = DOMParser.parseFromString(res, 'text/html')
                code = res.querySelector('[title="Add to Course Codes list"]').parentNode.href.split("'")[1]
                if(res.includes("for course is not available.")){

                }
            }
        })
    }
})

// runtime.onInstalled()。
// 此方法可让扩展程序在安装时设置初始状态或完成一些任务。
chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({text: 'OFF'}) // 将扩展程序的图标上的徽章设置为“OFF”
})