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
        # Comprehensive questions database mapped by keywords
        self.question_pool = {
            "installation": [
                {"q": "Which command is commonly used to install Python packages?", "options": ["npm install", "pip install", "apt-get", "get-python"], "a": 1},
                {"q": "What is the purpose of the 'python --version' command?", "options": ["Update Python", "Check installed version", "Start the REPL", "Uninstall Python"], "a": 1}
            ],
            "variables": [
                {"q": "How do you declare a variable in Python?", "options": ["var x = 5", "x = 5", "int x = 5", "let x = 5"], "a": 1},
                {"q": "Which of these is NOT a valid Python variable name?", "options": ["my_var", "var_2", "2_var", "_var"], "a": 2}
            ],
            "operators": [
                {"q": "What is the result of 10 // 3 in Python?", "options": ["3.33", "3", "3.0", "1"], "a": 1},
                {"q": "Which operator is used for exponentiation (power)?", "options": ["^", "**", "power()", "exp()"], "a": 1}
            ],
            "conditional": [
                {"q": "Which keyword is used to check an additional condition if the first 'if' is false?", "options": ["else if", "elf", "elif", "case"], "a": 2},
                {"q": "Which logical operator is used to check if both conditions are true?", "options": ["&&", "and", "both", "||"], "a": 1}
            ],
            "loops": [
                {"q": "How do you exit a loop prematurely in Python?", "options": ["exit", "stop", "break", "continue"], "a": 2},
                {"q": "What does the 'range(5)' function generate?", "options": ["[1,2,3,4,5]", "[0,1,2,3,4,5]", "0 through 4", "1 through 5"], "a": 2}
            ],
            "functions": [
                {"q": "Which keyword is used to create a function?", "options": ["function", "def", "func", "create"], "a": 1},
                {"q": "What is a 'lambda' function?", "options": ["A recursive function", "An anonymous function", "A function that returns a list", "A high-order function"], "a": 1}
            ],
            "list": [
                {"q": "Which method adds an element to the end of a list?", "options": ["add()", "push()", "insert()", "append()"], "a": 3},
                {"q": "How do you access the last element of a list 'L'?", "options": ["L[0]", "L[len(L)]", "L[-1]", "L.last()"], "a": 2}
            ],
            "dictionary": [
                {"q": "How do you access a value in a dictionary 'd' with key 'k'?", "options": ["d('k')", "d['k']", "d.get_k()", "d{k}"], "a": 1},
                {"q": "Dictionaries in Python are collections of:", "options": ["Ordered items", "Unique items", "Key-value pairs", "Immutable values"], "a": 2}
            ],
            "oop": [
                {"q": "What is the correct way to instantiate a class 'MyClass'?", "options": ["obj = new MyClass()", "obj = MyClass()", "obj = create MyClass", "obj = MyClass"], "a": 1},
                {"q": "What does the 'self' parameter represent in a class method?", "options": ["The class itself", "The parent class", "The specific instance of the class", "Global scope"], "a": 2}
            ],
            "inheritance": [
                {"q": "How do you inherit from a class 'Parent' in Python?", "options": ["class Child extends Parent:", "class Child(Parent):", "class Child implements Parent:", "class Child <- Parent:"], "a": 1},
                {"q": "What does super() do?", "options": ["Exits the program", "Calls the parent class method", "Accesses global variables", "Creates a new class"], "a": 1}
            ],
            "advanced": [
                {"q": "What is a decorator in Python?", "options": ["A way to style console output", "A function that modifies another function", "A class attribute", "A type of list comprehension"], "a": 1},
                {"q": "Which keyword is used in a generator function to return a value but keep state?", "options": ["return", "emit", "yield", "produce"], "a": 2}
            ],
            "async": [
                {"q": "Which keyword marks a function as asynchronous?", "options": ["async", "await", "defer", "promise"], "a": 0},
                {"q": "Where should the 'await' keyword be used?", "options": ["Anywhere", "Only in async functions", "Only in loops", "Only in main"], "a": 1}
            ]
        }

    def get_quiz_for_topics(self, topics: list, count: int = 3):
        """Get a list of quiz questions based on topics."""
        import random
        all_qs = []
        topics_lower = [t.lower() for t in topics]
        
        # Priority mapping
        mapping = {
            "install": "installation",
            "variable": "variables",
            "operator": "operators",
            "if": "conditional",
            "condit": "conditional",
            "loop": "loops",
            "for": "loops",
            "while": "loops",
            "func": "functions",
            "def": "functions",
            "list": "list",
            "tuple": "list",
            "dict": "dictionary",
            "set": "dictionary",
            "map": "dictionary",
            "oop": "oop",
            "class": "oop",
            "object": "oop",
            "inherit": "inheritance",
            "super": "inheritance",
            "decorat": "advanced",
            "generat": "advanced",
            "yield": "advanced",
            "async": "async",
            "await": "async"
        }

        found_categories = set()
        for t in topics_lower:
            for key, cat in mapping.items():
                if key in t:
                    found_categories.add(cat)
        
        for cat in found_categories:
            all_qs.extend(self.question_pool[cat])
        
        # Fallback if no category matches well enough
        if len(all_qs) < count:
            # Add some variables/operators as safe defaults for beginners
            all_qs.extend(self.question_pool["variables"])
            all_qs.extend(self.question_pool["operators"])
        
        # Shuffle and return requested count
        random.shuffle(all_qs)
        
        # Ensure unique questions (by question text)
        seen = set()
        unique_qs = []
        for q in all_qs:
            if q['q'] not in seen:
                unique_qs.append(q)
                seen.add(q['q'])
        
        return random.sample(unique_qs, min(count, len(unique_qs)))

    def evaluate_quiz(self, answers):
        """
        Evaluate quiz answers.
        
        Answers format: [{'question': str, 'selected': int, 'correct': int}]
        """
        correct_count = sum(1 for a in answers if a['selected'] == a['correct'])
        total = len(answers)
        score_pct = round(correct_count / total * 100, 1) if total > 0 else 0
        
        passed = score_pct >= 60
        
        return {
            "score": correct_count,
            "total": total,
            "score_percentage": score_pct,
            "passed": passed,
            "message": "Excellent!" if passed else "Keep studying!"
        }
