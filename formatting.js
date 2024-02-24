function createHtmlTable(conflictFreeSchedule) {
    // Create the header rows for the table
    const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const timeSlots = [
        ['0800', '0830'], ['0830', '0930'], ['0930', '1030'],
        ['1030', '1130'], ['1130', '1230'], ['1230', '1330'],
        ['1330', '1430'], ['1430', '1530'], ['1530', '1630'],
        ['1630', '1730'], ['1730', '1830'], ['1830', '1930'],
        ['1930', '2030'], ['2030', '2130'], ['2130', '2230'],
        ['2230', '2330'],
    ];

    // Start the HTML table
    let htmlTable = '<table border="1">\n';
    htmlTable += '  <tr>\n';
    htmlTable += '    <th>TIME/DAY</th>\n';
    daysOfWeek.forEach(day => {
        htmlTable += `    <th>${day}</th>\n`;
    });
    htmlTable += '  </tr>\n';

    // Create rows for time slots
    timeSlots.forEach(([start, end]) => {
        htmlTable += '  <tr>\n';
        htmlTable += `    <td>${start} to ${end}</td>\n`;
        daysOfWeek.forEach(day => {
            const cellContent = getCellContent(conflictFreeSchedule, day, start, end);
            htmlTable += `    <td>${cellContent}</td>\n`;
        });
        htmlTable += '  </tr>\n';
    });

    // Close the HTML table
    htmlTable += '</table>';
    return htmlTable;
}

function getCellContent(schedule, day, start, end) {
    // Search for a course that has a session in this time slot
    for (const course in schedule) {
        const details = schedule[course];
        for (const session of details['Sessions']) {
            if (session['Day'] === day && session['start'] === start) {
                return `${course} ${session['Type']} ${session['Group']} ${session['Weeks']}`;
            }
        }
    }
    return "";
}