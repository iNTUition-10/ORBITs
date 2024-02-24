import json

def parse_course_schedules(data):
    course_schedules = {}
    for course in data:
        course_code = course['Coursecode']
        course_schedules[course_code] = []
        for choice in course.get('Choices', []):
            sessions = []
            for session in choice.get('Timetable', []):
                session_details = {
                    'Type': session[0],
                    'Group': session[1],
                    'Day': session[2],
                    'start': parse_time_slot(session[3])[0],
                    'end': parse_time_slot(session[3])[1],
                    # 'Time': parse_time_slot(session[3]),
                    'Venue': session[4],
                    'Weeks': parse_weeks(session[5])  # Assume parse_weeks is defined
                }
                sessions.append(session_details)
            course_schedules[course_code].append({'Index': choice['Index'], 'Sessions': sessions})
    return course_schedules

def parse_time_slot(time_slot_str):
    """
    Example input: "1130to1220"
    Output: (1130, 1220)
    """
    start_time, end_time = time_slot_str.split('to')
    return int(start_time), int(end_time)

def parse_weeks(week_str):
    weeks = []
    for part in week_str.replace('Teaching Wk', '').split(','):
        if '-' in part:
            start, end = map(int, part.split('-'))
            weeks.extend(range(start, end + 1))
        else:
            weeks.append(int(part))
    return weeks

# def is_conflict(time1, time2):
def sessions_overlap(session1, session2):
    """
    Check if two time slots conflict, considering week, day, and time.
    Each time slot is a dictionary with keys: 'weeks', 'day', 'start', 'end'.
    """
    # Check if there is any common week
    week_overlap = any(week in session2['Weeks'] for week in session1['Weeks'])
    if not week_overlap:
        return False  # No common week, no conflict

    # Check if the day is the same
    if session1['Day'] != session2['Day']:
        return False  # Different days, no conflict

    # Check time overlap
    return not (session1['end'] <= session2['start'] or session1['start'] >= session2['end'])

def find_conflict_free_schedule(course_schedules):
    conflict_free_schedule = {}
    
    
    # user customize data
    
    
    for course_code, indexes in course_schedules.items():
        for index_info in indexes:
            index = index_info['Index']
            sessions = index_info['Sessions']
            is_conflict = False
            
            for other_course, other_indexes in conflict_free_schedule.items():
                for other_session in other_indexes['Sessions']:
                    for session in sessions:
                        if sessions_overlap(session, other_session):
                            is_conflict = True
                            break
                    if is_conflict:
                        break
                if is_conflict:
                    break
                    
            if not is_conflict:
                conflict_free_schedule[course_code] = {'Index': index, 'Sessions': sessions}
                break  # Once a conflict-free index is found, move to the next course

    # Print the conflict-free schedule
    if len(conflict_free_schedule) == len(course_schedules):
        output_conflict_free_schedule_to_json(conflict_free_schedule)
    else:
        print("A conflict-free schedule could not be found for all courses.")

def format_weeks(weeks_list):
    if not weeks_list:
        return ""
    sorted_weeks = sorted(weeks_list)
    formatted_weeks = []
    start = sorted_weeks[0]
    for i in range(1, len(sorted_weeks)):
        if sorted_weeks[i] != sorted_weeks[i-1] + 1:
            if start == sorted_weeks[i-1]:
                formatted_weeks.append(str(start))
            else:
                formatted_weeks.append(f"{start}-{sorted_weeks[i-1]}")
            start = sorted_weeks[i]
    if start == sorted_weeks[-1]:
        formatted_weeks.append(str(start))
    else:
        formatted_weeks.append(f"{start}-{sorted_weeks[-1]}")
    return ','.join(formatted_weeks)

def output_conflict_free_schedule_to_json(conflict_free_schedule):
    output_data = []
    for course_code, info in conflict_free_schedule.items():
        course_data = {
            "Coursecode": course_code,
            "Choices": [{
                "Index": info['Index'],
                "Timetable": [{
                    **session,
                    "Weeks": format_weeks(session['Weeks'])  # Format weeks here
                } for session in info['Sessions']]
            }]
        }
        output_data.append(course_data)

    with open('output.json', 'w') as file:
        json.dump(output_data, file, indent=4)

# Use this function at the end of find_conflict_free_schedule if a conflict-free schedule is found
# output_conflict_free_schedule_to_json(conflict_free_schedule, 'output_schedule.json')


# Main Function
# Load JSON data from a file
with open('test.json', 'r') as file:
    data = json.load(file)

course_schedules=parse_course_schedules(data)
            
# Assuming `course_schedules` is populated with course data including parsed weeks
find_conflict_free_schedule(course_schedules)


