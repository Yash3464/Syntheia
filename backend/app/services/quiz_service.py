"""
Quiz Service
Handles quiz evaluation and skill assessment.
(Currently a stub – will be expanded later)
"""

class QuizService:
    """
    Service for quiz logic.
    Provides questions and evaluates answers.
    """

    def __init__(self):
        # Mock questions database
        self.question_pool = {
            "python": [
                {"q": "How do you declare a variable in Python?", "options": ["var x = 5", "x = 5", "int x = 5", "let x = 5"], "a": 1},
                {"q": "What is the correct file extension for Python files?", "options": [".py", ".python", ".pyt", ".pt"], "a": 0},
                {"q": "Which function is used to output text to the console?", "options": ["console.log()", "print()", "echo()", "write()"], "a": 1},
                {"q": "What is a list in Python?", "options": ["An immutable sequence", "A mutable sequence", "A key-value pair collection", "A set of unique items"], "a": 1},
                {"q": "How do you start a comment in Python?", "options": ["//", "/*", "#", "--"], "a": 2}
            ],
            "react": [
                {"q": "What is JSX?", "options": ["A CSS framework", "A syntax extension for JS", "A database engine", "A routing library"], "a": 1},
                {"q": "How do you define a component in React?", "options": ["class Component {}", "function Component() {}", "Both of above", "None of above"], "a": 2},
                {"q": "What hook is used for state management?", "options": ["useEffect", "useMemo", "useState", "useContext"], "a": 2},
                {"q": "What is the virtual DOM?", "options": ["A direct copy of the real DOM", "A lightweight representation of the real DOM", "A CSS selector engine", "A server-side rendering tool"], "a": 1}
            ]
        }

    def get_quiz_for_topics(self, topics: list, count: int = 3):
        """Get a list of quiz questions based on topics."""
        import random
        all_qs = []
        for topic in topics:
            topic_lower = topic.lower()
            # Try to match topic in pool
            for key in self.question_pool:
                if key in topic_lower:
                    all_qs.extend(self.question_pool[key])
        
        # Fallback questions if no topic matches
        if not all_qs:
            all_qs = [
                {"q": "Which of these is fundamental to learning any skill?", "options": ["Consistency", "Luck", "Speed", "Isolation"], "a": 0},
                {"q": "Retaining information is better done through:", "options": ["Active recall", "Passive reading", "Binge watching", "Memorizing"], "a": 0},
                {"q": "A good learning session should usually include:", "options": ["Frequent distractions", "Focused deep work", "Multitasking", "No breaks"], "a": 1}
            ]
        
        # Return unique random questions
        selected = random.sample(all_qs, min(count, len(all_qs)))
        return selected

    def evaluate_quiz(self, answers):
        """
        Evaluate quiz answers.
        
        Answers format: [{'question': str, 'selected': int, 'correct': int}]
        """
        correct_count = sum(1 for a in answers if a['selected'] == a['correct'])
        total = len(answers)
        score_pct = (correct_count / total * 100) if total > 0 else 0
        
        passed = score_pct >= 60
        
        return {
            "score": correct_count,
            "total": total,
            "score_percentage": score_pct,
            "passed": passed,
            "message": "Excellent!" if passed else "Keep studying!"
        }
