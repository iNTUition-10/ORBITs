const stars_url = 'https://wish.wis.ntu.edu.sg/pls/webexe/AUS_STARS_PLANNER.planner'

console.log("popup.js loaded")
function toPage(i) {
    console.log("from ", currentPage, " to ", i)
    document.getElementById(i).classList.add('active')
    document.getElementById(currentPage).classList.remove('active')
    currentPage = i
}
var currentPage
chrome.tabs.query({active:true, currentWindow: true}, (tabs) => {
    if(tabs[0].url.startsWith(stars_url)){
        currentPage = 'home'
        document.getElementById(currentPage).classList.add('active')
    }else{
        currentPage = 'block'
        document.getElementById(currentPage).classList.add('active')
    }
})
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action == "UPDATE_POPUP"){
        console.log("popup.js received UPDATE_POPUP request")
        document.getElementById('status').innerHTML = request.status
        document.getElementById('status').style.color = request.color
    }
})

document.getElementById("home-to-select").addEventListener("click", () => {toPage('select')});
document.getElementById("select-to-apply").addEventListener("click", () => {
    console.log("popup.js generateSchedule")
    document.getElementById('select-to-apply').disabled = true
    chrome.storage.session.get(['fetched_courses']).then(data => {
        console.log("popup.js get data from session storage", data)
        console.log("popup.js get dayOff and pref from input", document.getElementById('dayOff').value, document.getElementById('pref').value)
        findConflictFreeSchedule(data.fetched_courses, document.getElementById('dayOff').value, document.getElementById('pref').value).then((response) => {
            if(!response){
                console.log("popup.js no conflict free schedule")
                alert("No conflict free schedule found")
                return
            }
            console.log("popup.js conflict free schedule found, save to storage, ", response)
            chrome.storage.local.set({'optimized': response}, () => {
                document.getElementById('select-to-apply').disabled = false
                toPage('applydiv')
            })
        })
    })
});

document.getElementById('apply').addEventListener('click', function() {
    document.getElementById('apply').disabled = true
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "APPLY"}, (data) => {
            console.log("popup.js APPLY_SCHEDULE received response")
            console.log(data)
            document.getElementById('apply').disabled = false
            toPage('home')
        })
    })
})

document.getElementById('fetch').addEventListener('click', function() {
    document.getElementById('fetch').disabled = true
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
                    console.log("popup.js change to select page")
                    document.getElementById('fetch').disabled = false
                    toPage('select')
                })
            })
        })
    })
})



// mode_v5_plugin.js

function parseTimeSlot(timeSlotStr) {
    const [startTime, endTime] = timeSlotStr.split('to');
    return [parseInt(startTime, 10), parseInt(endTime, 10)];
}

function parseWeeks(weekStr) {
    return weekStr.replace('Teaching Wk', '').split(',').flatMap(part => {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            return Array.from({ length: end - start + 1 }, (_, i) => start + i);
        } else {
            return [parseInt(part, 10)];
        }
    });
}

function sessionsOverlap(session1, session2) {
    console.log("overlap test session1", session1)
    console.log("overlap test session2", session2)
    const weekOverlap = session1.Weeks.some(week => session2.Weeks.includes(week));
    if (!weekOverlap) return false;
    if (session1.Day !== session2.Day) return false;
    return !(session1.end <= session2.start || session1.start >= session2.end);
}

function parseCourseSchedules(data, dayOff, userPreference) {
    const courseSchedules = {};
    data.forEach(course => {
        const courseCode = course.Coursecode;
        let choices = course.Choices.map(choice => {
            const sessions = choice.Timetable.map(session => ({
                Type: session[0],
                Group: session[1],
                Day: session[2],
                start: parseTimeSlot(session[3])[0],
                end: parseTimeSlot(session[3])[1],
                Venue: session[4],
                Weeks: parseWeeks(session[5])
            }));
            return { Index: choice.Index, Sessions: sessions };
        });
        console.log("CHOICES1", choices)
        // Sort based on user preference
        if (userPreference == '1') { // No early classes
            choices = choices.sort((a, b) => Math.min(...b.Sessions.map(session => session.start)) - Math.min(...a.Sessions.map(session => session.start)));
            console.log("CHOICES2", choices)
        } else if (userPreference == '2') { // Longer weekends
            choices = choices.sort((a, b) => {
                const aHasMonAndFri = (a.Sessions.some(s => s.Type != "Lec/Studio" && s.Day === 'Mon') && a.Sessions.some(s => s.Type != "Lec/Studio" && s.Day === 'Fri'));
                const bHasMonAndFri = (b.Sessions.some(s => s.Type != "Lec/Studio" && s.Day === 'Mon') && a.Sessions.some(s => s.Type != "Lec/Studio" && s.Day === 'Fri'));
                if(aHasMonAndFri){
                    if(bHasMonAndFri){
                        return 0
                    }else{
                        return 1
                    }
                }else if(bHasMonAndFri){
                    return -1
                }
                const aHasMonOrFri = a.Sessions.some(s => (s.Type.toUpperCase() != "LEC/STUDIO" && s.Day === 'Mon') || (s.Type.toUpperCase() != "LEC/STUDIO" && s.Day === 'Fri'));
                const bHasMonOrFri = b.Sessions.some(s => (s.Type.toUpperCase() != "LEC/STUDIO" && s.Day === 'Mon') || (s.Type.toUpperCase() != "LEC/STUDIO" && s.Day === 'Fri'));
                return (aHasMonOrFri === bHasMonOrFri) ? 0 : aHasMonOrFri ? 1 : -1;
            });
        } else if(dayOff){
            console.log("dayOff", dayOff)
            choices = choices.sort((c, b) => {
                const aHas = c.Sessions.some(s => ((s.Type.toUpperCase() != "LEC/STUDIO") && (s.Day == dayOff)));
                const bHas = b.Sessions.some(s => ((s.Type.toUpperCase() != "LEC/STUDIO") && (s.Day == dayOff)));
                return (aHas == bHas) ? 0 : aHas ? 1 : -1;
            })
        }
        courseSchedules[courseCode] = choices;
    });
    return courseSchedules;
}

function cmpSessions(sessions, cfs){
    console.log("cmpSessions sessions ", sessions)
    console.log("cmpSessions cfs ", cfs)
    for(let k = 0; k < sessions.length;k++){
        session = sessions[k]
        for(let i = 0; i < Object.entries(cfs).length; i++){
            for(let j = 0; j < Object.entries(cfs)[i][1].sessions.length;j++){
                if(sessionsOverlap(session, Object.entries(cfs)[i][1].sessions[j])){
                    return false
                }
            }
        }
    }
    return true
}

function recursiveFind(conflictFreeSchedule, remain, outermost = false) {
    if (Object.keys(remain).length === 0) {
        return conflictFreeSchedule; 
    }

    const [current_code, current_index_array] = Object.entries(remain)[0];
    const r_remain = {...remain}; 
    delete r_remain[current_code]; 

    for (let i = 0; i < current_index_array.length; i++) {
        const sessions = current_index_array[i];
        if (!cmpSessions(sessions.Sessions, conflictFreeSchedule)) {
            continue;
        }
        const newConflictFreeSchedule = {...conflictFreeSchedule}; 
        newConflictFreeSchedule[current_code] = { index: sessions.Index, sessions: sessions.Sessions };

        if (Object.keys(r_remain).length === 0) {
            return newConflictFreeSchedule; 
        } else {
            const result = recursiveFind(newConflictFreeSchedule, r_remain); 
            if (result) return result; 
        }
    }

    if (outermost) {
        return false; 
    }
}

async function findConflictFreeSchedule(courseSchedules, dayOff, userPreference) { // dayOff: 1-5 or 0, userPreference: 0=none, 1=no early classes, 2=longer weekends
    const updatedCourseSchedules = parseCourseSchedules(courseSchedules, dayOff, userPreference);
    console.log(updatedCourseSchedules)
    const conflictFreeSchedule = {}
    r = recursiveFind(conflictFreeSchedule, updatedCourseSchedules, true)

    // Object.entries(updatedCourseSchedules).forEach(([courseCode, indexes]) => {
    //     indexes.some(indexInfo => {
    //         const { Index: index, Sessions: sessions } = indexInfo;
    //         let isConflict = false;

    //         Object.values(conflictFreeSchedule).forEach(({ Sessions: otherSessions }) => {
    //             otherSessions.forEach(otherSession => {
    //                 sessions.forEach(session => {
    //                     if (sessionsOverlap(session, otherSession)) {
    //                         isConflict = true;
    //                     }
    //                 });
    //                 if (isConflict) return;
    //             });
    //             if (isConflict) return;
    //         });

    //         if (!isConflict) {
    //             conflictFreeSchedule[courseCode] = { Index: index, Sessions: sessions };
    //             return true; // Break the loop once a conflict-free index is found
    //         }
    //         return false; // Continue the loop
    //     });
    // });

    if (!r) {
        console.log("popup.js conflict-free schedule not found")
    }
    return r
}

function formatWeeks(weeksList) {
    if (!weeksList.length) return "";
    const sortedWeeks = weeksList.sort((a, b) => a - b);
    const formattedWeeks = [];
    let start = sortedWeeks[0];

    sortedWeeks.forEach((week, i) => {
        if (week !== sortedWeeks[i - 1] + 1) {
            if (start === sortedWeeks[i - 1]) {
                formattedWeeks.push(`${start}`);
            } else {
                formattedWeeks.push(`${start}-${sortedWeeks[i - 1]}`);
            }
            start = week;
        }
    });

    if (start === sortedWeeks[sortedWeeks.length - 1]) {
        formattedWeeks.push(`${start}`);
    } else {
        formattedWeeks.push(`${start}-${sortedWeeks[sortedWeeks.length - 1]}`);
    }

    return formattedWeeks.join(',');
}
