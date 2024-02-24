console.log("popup.js loaded")
document.getElementById('add').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "GET_FORM0"}, (data) => {
            form = data.data
            cookies = data.cookies
            console.log("popup.js GET_FORM0 received response")
            console.log(form)
            cookies = cookies.replace("r=https%3A%2F%2Fwish.wis.ntu.edu.sg%2Fpls%2Fwebexe%2FAUS_STARS_PLANNER.planner","r=https%3A%2F%2Fwish.wis.ntu.edu.sg%2Fpls%2Fwebexe%2FAUS_STARS_PLANNER.course_info")
            console.log(cookies)
            chrome.tabs.sendMessage(tabs[0].id, {action: "GET_COURSES"}, (courses) => {
                console.log("popup.js GET_COURSES received response")
                courses = courses.data
                console.log(courses)
                console.log("Using form and courses to fetch course schedules...", form, courses)
                tabId = tabs[0].id
                chrome.runtime.sendMessage({action: "FETCH_COURSES", form, cookies, courses, tabId}, (response) => {
                    console.log("popup.js FETCH_COURSES received response")
                    console.log(response)
                })
            })
        })
    })
})