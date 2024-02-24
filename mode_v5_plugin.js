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
  const weekOverlap = session1.Weeks.some(week => session2.Weeks.includes(week));
  if (!weekOverlap) return false;
  if (session1.Day !== session2.Day) return false;
  return !(session1.end <= session2.start || session1.start >= session2.end);
}

function parseCourseSchedules(data, userPreference) {
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

      // Sort based on user preference
      if (userPreference === '1') { // No early classes
          choices = choices.sort((a, b) => Math.min(...b.Sessions.map(session => session.start)) - Math.min(...a.Sessions.map(session => session.start)));
      } else if (userPreference === '2') { // Longer weekends
          choices = choices.sort((a, b) => {
              const aHasMonOrFri = a.Sessions.some(s => s.Day === 'Mon' || s.Day === 'Fri');
              const bHasMonOrFri = b.Sessions.some(s => s.Day === 'Mon' || s.Day === 'Fri');
              return (aHasMonOrFri === bHasMonOrFri) ? 0 : aHasMonOrFri ? 1 : -1;
          });
      }

      courseSchedules[courseCode] = choices;
  });
  return courseSchedules;
}

async function findConflictFreeSchedule(courseSchedules, dayOff, userPreference) { // dayOff: 1-5 or -1, userPreference: 0=none, 1=no early classes, 2=longer weekends
  const updatedCourseSchedules = parseCourseSchedules(courseSchedules, userPreference);
  const conflictFreeSchedule = {};
  Object.entries(updatedCourseSchedules).forEach(([courseCode, indexes]) => {
      indexes.some(indexInfo => {
          const { Index: index, Sessions: sessions } = indexInfo;
          let isConflict = false;

          Object.values(conflictFreeSchedule).forEach(({ Sessions: otherSessions }) => {
              otherSessions.forEach(otherSession => {
                  sessions.forEach(session => {
                      if (sessionsOverlap(session, otherSession)) {
                          isConflict = true;
                      }
                  });
                  if (isConflict) return;
              });
              if (isConflict) return;
          });

          if (!isConflict) {
              conflictFreeSchedule[courseCode] = { Index: index, Sessions: sessions };
              return true; // Break the loop once a conflict-free index is found
          }
          return false; // Continue the loop
      });
  });

  if (Object.keys(conflictFreeSchedule).length === Object.keys(updatedCourseSchedules).length) {
      return outputConflictFreeSchedule(conflictFreeSchedule);
  } else {
      return false
  }
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

function outputConflictFreeSchedule(conflictFreeSchedule) {
  const outputData = Object.entries(conflictFreeSchedule).map(([courseCode, info]) => {
      return {
          Coursecode: courseCode,
          Index: info.Index,
      };
  });
  return outputData
}