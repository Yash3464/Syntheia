"""
Core Planner Logic
Responsible for generating a day-wise learning plan
based on pathway and learner pace.
"""

def generate_learning_plan(pathway, pace):
    """
    Args:
        pathway (list): list of skills/topics in order
        pace (str): 'slow', 'medium', or 'fast'

    Returns:
        list: day-wise learning plan
    """

    if pace == "slow":
        topics_per_day = 1
    elif pace == "fast":
        topics_per_day = 3
    else:
        topics_per_day = 2  # medium

    plan = []
    day = 1
    index = 0

    while index < len(pathway):
        daily_topics = pathway[index:index + topics_per_day]

        plan.append({
            "day": day,
            "tasks": daily_topics,
            "status": "pending"
        })

        index += topics_per_day
        day += 1

    return plan
