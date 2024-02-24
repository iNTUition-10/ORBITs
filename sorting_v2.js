const fs = require('fs');
const readline = require('readline');

function parseTimeSlot(timeSlotStr) {
    const [startTime, endTime] = timeSlotStr.split('to');
    return [parseInt(startTime, 10), parseInt(endTime, 10)];
}

function parseWeeks(weekStr) {
    const weeks = [];
    weekStr.replace('Teaching Wk', '').split(',').forEach(part => {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            for (let i = start; i <= end; i++) {
                weeks.push(i);
            }
        } else {
            weeks.push(parseInt(part, 10));
        }
    });
    return weeks;
}

function sessionsOverlap(session1, session2) {
    const weekOverlap = session1.Weeks.some(week => session2.Weeks.includes(week));
    if (!weekOverlap) return false;
    if (session1.Day !== session2.Day) return false;
    return !(session1.end <= session2.start || session1.start >= session2.end);
}

function condenseWeeks(weeks) {
    weeks.sort((a, b) => a - b); // Ensure the weeks are sorted
    let result = [];
    let start = weeks[0];

    for (let i = 1; i < weeks.length; i++) {
        // If the current week is not consecutive
        if (weeks[i] !== weeks[i - 1] + 1) {
            if (start === weeks[i - 1]) {
                result.push(`${start}`);
            } else {
                result.push(`${start}-${weeks[i - 1]}`);
            }
            start = weeks[i];
        }
    }

    // Add the last range or single week
    if (start === weeks[weeks.length - 1]) {
        result.push(`${start}`);
    } else {
        result.push(`${start}-${weeks[weeks.length - 1]}`);
    }

    return result.join(',');
}


async function getUserInput(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(question, (input) => {
            rl.close();
            resolve(input);
        });
    });
}

async function parseCourseSchedules(data) {
    const courseSchedules = {};
    for (const course of data) {
        const courseCode = course.Coursecode;
        courseSchedules[courseCode] = [];
        for (const choice of course.Choices || []) {
            const sessions = [];
            for (const session of choice.Timetable || []) {
                const [start, end] = parseTimeSlot(session[3]);
                const sessionDetails = {
                    Type: session[0],
                    Group: session[1],
                    Day: session[2],
                    start: start,
                    end: end,
                    Venue: session[4],
                    Weeks: parseWeeks(session[5])
                };
                sessions.push(sessionDetails);
            }
            courseSchedules[courseCode].push({ Index: choice.Index, Sessions: sessions });
        }
    }
    return courseSchedules;
}

async function findConflictFreeSchedule(courseSchedules) {
    const conflictFreeSchedule = {};
    let dayOff = await getUserInput('Enter the day you want off, enter -1 to stop: ');
    let i = 1;
    courseSchedules.user101 = [];
    let newCourse = {
        Index: String(i),
        Sessions: [{
            Type: 'Lazy',
            Group: '114514',
            Day: 'Mon',
            start: 100,
            end: 200,
            Venue: 'Room 1',
            Weeks: Array.from({length: 13}, (_, i) => i + 1)
        }]
    };
    i += 1;
    courseSchedules.user101.push(newCourse);

    while (dayOff !== '-1') {
        const startOff = await getUserInput('Enter the start time you want off, in format of hourmin: ');
        const endOff = await getUserInput('Enter the end time you want off, in format of hourmin: ');
        newCourse = {
            Index: String(i),
            Sessions: [{
                Type: 'Lazy',
                Group: '114514',
                Day: dayOff,
                start: parseInt(startOff, 10),
                end: parseInt(endOff, 10),
                Venue: 'Room 1',
                Weeks: Array.from({length: 13}, (_, i) => i + 1)
            }]
        };
        i += 1;
        courseSchedules.user101.push(newCourse);
        dayOff = await getUserInput('Enter the day you want off, enter -1 to stop: ');
    }

    for (const [courseCode, indexes] of Object.entries(courseSchedules)) {
        for (const indexInfo of indexes) {
            const index = indexInfo.Index;
            const sessions = indexInfo.Sessions;
            let isConflict = false;

            for (const [otherCourse, otherIndexes] of Object.entries(conflictFreeSchedule)) {
                for (const otherSession of otherIndexes.Sessions) {
                    for (const session of sessions) {
                        if (sessionsOverlap(session, otherSession)) {
                            isConflict = true;
                            break;
                        }
                    }
                    if (isConflict) break;
                }
                if (isConflict) break;
            }

            if (!isConflict) {
                conflictFreeSchedule[courseCode] = { Index: index, Sessions: sessions };
                break; // Once a conflict-free index is found, move to the next course
            }
        }
    }

    if (Object.keys(conflictFreeSchedule).length === Object.keys(courseSchedules).length) {
        outputConflictFreeScheduleToJson(conflictFreeSchedule);
    } else {
        console.log("A conflict-free schedule could not be found for all courses.");
    }
}

function outputConflictFreeScheduleToJson(conflictFreeSchedule) {
    const outputData = Object.entries(conflictFreeSchedule).reduce((acc, [courseCode, info]) => {
        if (courseCode === 'user101') return acc;
        const courseData = {
            Coursecode: courseCode,
            Choices: [{
                Index: info.Index,
                Timetable: info.Sessions.map(session => ({
                    ...session,
                    Weeks: condenseWeeks(session.Weeks) // Format weeks here
                }))
            }]
        };
        acc.push(courseData);
        return acc;
    }, []);

    fs.writeFile('output.json', JSON.stringify(outputData, null, 4), (err) => {
        if (err) throw err;
        console.log('Conflict-free schedule has been saved to output.json');
    });
}

// Main function to load and process data
fs.readFile('test.json', 'utf8', async (err, data) => {
    if (err) throw err;
    const jsonData = JSON.parse(data);
    const courseSchedules = await parseCourseSchedules(jsonData);
    await findConflictFreeSchedule(courseSchedules);
});
