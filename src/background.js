/*
 * 别删！！！
 *                        _oo0oo_
 *                       o8888888o
 *                       88" . "88
 *                       (| -_- |)
 *                       0\  =  /0
 *                     ___/`---'\___
 *                   .' \\|     |// '.
 *                  / \\|||  :  |||// \
 *                 / _||||| -:- |||||- \
 *                |   | \\\  - /// |   |
 *                | \_|  ''\---/''  |_/ |
 *                \  .-\__  '-'  ___/-. /
 *              ___'. .'  /--.--\  `. .'___
 *           ."" '<  `.___\_<|>_/___.' >' "".
 *          | | :  `- \`.;`\ _ /`;.`/ - ` : | |
 *          \  \ `_.   \_ __\ /__ _/   .-` /  /
 *      =====`-.____`.___ \_____/___.-`___.-'=====
 *                        `=---='
 * 
 * 
 *      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * 
 *            佛祖保佑       永不宕机     永无BUG
 * 
 *        佛曰:  
 *                写字楼里写字间，写字间里程序员；  
 *                程序人员写程序，又拿程序换酒钱。  
 *                酒醒只在网上坐，酒醉还来网下眠；  
 *                酒醉酒醒日复日，网上网下年复年。  
 *                但愿老死电脑间，不愿鞠躬老板前；  
 *                奔驰宝马贵者趣，公交自行程序员。  
 *                别人笑我忒疯癫，我笑自己命太贱；  
 *                不见满街漂亮妹，哪个归得程序员？
 */

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
        const { courses, cookies, tabId } = request
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
            console.log(responses)
            r = []
            for(var i=0;i<responses.length;i++){
                r.push(responses[i].text())
            }
            Promise.all(r).then(responses => {
                console.log("text()")
                console.log(responses)
                p_courses = []
                parsers = []
                for(var i=0;i<responses.length;i++){
                    parsers.push(chrome.tabs.sendMessage(tabId, {action: "PARSE", html: responses[i]}))
                }
                Promise.all(parsers).then(data => {
                    console.log("background.js received PARSER response", )
                    console.log(data)
                    for(var i = 0;i<data.length;i++){    
                        p_courses.push({"Coursecode":data[i].code, "Choices": data[i].index})
                    }
                    console.log("All course index extracted, ", p_courses)
                    chrome.storage.session.set({"fetched_courses": p_courses}).then(() => {
                        console.log("Saved to session storage `fetched_courses`")
                        sendResponse({status: "Courses fetched", color: "green"})
                    })
                })
            })
        })
        return true
    }
})

