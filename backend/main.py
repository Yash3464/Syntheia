from app.core.planner import generate_learning_plan

if __name__ == "__main__":
    pathway = [
        "Python Basics",
        "Control Flow",
        "Functions",
        "Data Structures",
        "Statistics",
        "Machine Learning Basics"
    ]

    pace = "medium"

    plan = generate_learning_plan(pathway, pace)

    print("Generated Learning Plan:\n")
    for day_plan in plan:
        print(day_plan)
