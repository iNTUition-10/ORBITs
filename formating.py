import json
from datetime import time

def create_html_table(conflict_free_schedule):
    # Create the header rows for the table
    days_of_week = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    time_slots = [
        ('0800', '0830'), ('0830', '0930'), ('0930', '1030'),
        ('1030', '1130'), ('1130', '1230'), ('1230', '1330')
        ('1330', '1430'), ('1430', '1530'), ('1530', '1630'),
        ('1630', '1730'), ('1730', '1830'), ('1830', '1930'),
        ('1930', '2030'), ('2030', '2130'), ('2130', '2230'),
        ('2230', '2330'),
    ]

    # Start the HTML table
    html_table = '<table border="1">\n'
    html_table += '  <tr>\n'
    html_table += '    <th>TIME/DAY</th>\n'
    for day in days_of_week:
        html_table += f'    <th>{day}</th>\n'
    html_table += '  </tr>\n'
    
    # Create rows for time slots
    for start, end in time_slots:
        html_table += '  <tr>\n'
        html_table += f'    <td>{start} to {end}</td>\n'
        for day in days_of_week:
            cell_content = get_cell_content(conflict_free_schedule, day, start, end)
            html_table += f'    <td>{cell_content}</td>\n'
        html_table += '  </tr>\n'
    
    # Close the HTML table
    html_table += '</table>'
    return html_table

def get_cell_content(schedule, day, start, end):
    # Search for a course that has a session in this time slot
    for course, details in schedule.items():
        for session in details['Sessions']:
            if session['Day'] == day and session['start'] == start:
                return f"{course} {session['Type']} {session['Group']} {session['Weeks']}"
    return ""  # Return empty string if no session is found for this slot

# Generate the HTML table
html_table = create_html_table(conflict_free_schedule)
