"""
Learning Module Definitions
Contains all learning modules (Python, ML, Web Dev, etc.) with topics organized by level.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class Topic(BaseModel):
    """Individual learning topic."""
    id: str
    title: str
    description: str
    difficulty: int = Field(ge=1, le=5)  # 1-5 scale
    prerequisites: List[str] = []  # Topic IDs that are prerequisites
    estimated_time: int = Field(ge=15, le=180)  # Estimated minutes


class ModuleLevel(BaseModel):
    """Collection of topics for a specific level."""
    name: str
    topics: List[Topic]
    learning_objectives: List[str]
    total_estimated_hours: float


class LearningModule(BaseModel):
    """A complete learning module (e.g., Python, ML)."""
    id: str
    name: str
    description: str
    beginner: ModuleLevel
    intermediate: ModuleLevel
    advanced: ModuleLevel


# ====================== PYTHON MODULE DEFINITION ======================

PYTHON_MODULE = LearningModule(
    id="python",
    name="Python Programming",
    description="Comprehensive Python programming from basics to advanced concepts",
    
    beginner=ModuleLevel(
        name="Beginner",
        learning_objectives=[
            "Understand Python syntax and basic programming concepts",
            "Write simple programs using control structures",
            "Work with basic data types and collections",
            "Create and use functions effectively"
        ],
        topics=[
            Topic(
                id="py_basics_1",
                title="Python Installation & Setup",
                description="Install Python, set up development environment, write first program",
                difficulty=1,
                estimated_time=60
            ),
            Topic(
                id="py_basics_2",
                title="Variables and Data Types",
                description="Learn about integers, floats, strings, booleans, and type conversion",
                difficulty=1,
                estimated_time=45
            ),
            Topic(
                id="py_basics_3",
                title="Basic Operators",
                description="Arithmetic, comparison, logical, and assignment operators",
                difficulty=1,
                estimated_time=30
            ),
            Topic(
                id="py_control_1",
                title="Conditional Statements",
                description="if, elif, else statements and conditional expressions",
                difficulty=2,
                estimated_time=45
            ),
            Topic(
                id="py_control_2",
                title="Loops: For and While",
                description="Iterating with for loops, while loops, break and continue",
                difficulty=2,
                estimated_time=60
            ),
            Topic(
                id="py_functions_1",
                title="Functions Basics",
                description="Defining functions, parameters, return values",
                difficulty=2,
                estimated_time=60
            ),
            Topic(
                id="py_data_1",
                title="Lists and Tuples",
                description="Working with ordered collections, indexing, slicing",
                difficulty=2,
                estimated_time=45
            ),
            Topic(
                id="py_data_2",
                title="Dictionaries and Sets",
                description="Key-value pairs, unique collections, set operations",
                difficulty=2,
                estimated_time=60
            ),
            Topic(
                id="py_strings",
                title="String Operations",
                description="String methods, formatting, f-strings, regular expressions basics",
                difficulty=2,
                estimated_time=45
            ),
            Topic(
                id="py_basics_4",
                title="Basic Input/Output",
                description="Reading from console, writing output, simple file operations",
                difficulty=2,
                estimated_time=30
            ),
        ],
        total_estimated_hours=7.5
    ),
    
    intermediate=ModuleLevel(
        name="Intermediate",
        learning_objectives=[
            "Master object-oriented programming in Python",
            "Handle files and exceptions properly",
            "Use advanced data structures and comprehensions",
            "Work with modules and packages"
        ],
        topics=[
            Topic(
                id="py_oop_1",
                title="Classes and Objects",
                description="Defining classes, creating objects, instance methods",
                difficulty=3,
                prerequisites=["py_functions_1"],
                estimated_time=60
            ),
            Topic(
                id="py_oop_2",
                title="Inheritance and Polymorphism",
                description="Class inheritance, method overriding, polymorphism",
                difficulty=3,
                prerequisites=["py_oop_1"],
                estimated_time=60
            ),
            Topic(
                id="py_oop_3",
                title="Encapsulation and Properties",
                description="Private attributes, getters/setters, property decorator",
                difficulty=3,
                prerequisites=["py_oop_1"],
                estimated_time=45
            ),
            Topic(
                id="py_advanced_1",
                title="List Comprehensions",
                description="Creating lists with comprehensions, nested comprehensions",
                difficulty=3,
                prerequisites=["py_data_1"],
                estimated_time=30
            ),
            Topic(
                id="py_advanced_2",
                title="Lambda Functions",
                description="Anonymous functions, map, filter, reduce",
                difficulty=3,
                prerequisites=["py_functions_1"],
                estimated_time=45
            ),
            Topic(
                id="py_modules",
                title="Modules and Packages",
                description="Importing modules, creating packages, __init__.py",
                difficulty=2,
                estimated_time=45
            ),
            Topic(
                id="py_files",
                title="File Handling",
                description="Reading/writing files, different file modes, with statement",
                difficulty=3,
                estimated_time=60
            ),
            Topic(
                id="py_exceptions",
                title="Exception Handling",
                description="try/except/finally blocks, custom exceptions",
                difficulty=3,
                estimated_time=45
            ),
            Topic(
                id="py_json",
                title="Working with JSON",
                description="json module, serialization, deserialization",
                difficulty=2,
                estimated_time=30
            ),
            Topic(
                id="py_env",
                title="Virtual Environments",
                description="venv, pip, requirements.txt, dependency management",
                difficulty=2,
                estimated_time=45
            ),
        ],
        total_estimated_hours=7.5
    ),
    
    advanced=ModuleLevel(
        name="Advanced",
        learning_objectives=[
            "Understand and use decorators and generators",
            "Implement context managers",
            "Explore concurrent and asynchronous programming",
            "Apply design patterns and optimization techniques"
        ],
        topics=[
            Topic(
                id="py_decorators",
                title="Decorators",
                description="Function decorators, class decorators, decorator with arguments",
                difficulty=4,
                prerequisites=["py_functions_1", "py_oop_1"],
                estimated_time=60
            ),
            Topic(
                id="py_generators",
                title="Generators and Iterators",
                description="yield keyword, generator expressions, itertools module",
                difficulty=4,
                prerequisites=["py_functions_1"],
                estimated_time=60
            ),
            Topic(
                id="py_context",
                title="Context Managers",
                description="with statement, implementing context managers",
                difficulty=4,
                estimated_time=45
            ),
            Topic(
                id="py_concurrent_1",
                title="Threading Basics",
                description="Threading module, race conditions, locks",
                difficulty=5,
                prerequisites=["py_oop_1"],
                estimated_time=60
            ),
            Topic(
                id="py_concurrent_2",
                title="Asynchronous Programming",
                description="async/await, asyncio module, event loops",
                difficulty=5,
                prerequisites=["py_concurrent_1"],
                estimated_time=90
            ),
            Topic(
                id="py_design",
                title="Design Patterns",
                description="Singleton, Factory, Observer patterns in Python",
                difficulty=4,
                prerequisites=["py_oop_2"],
                estimated_time=90
            ),
            Topic(
                id="py_optimization",
                title="Performance Optimization",
                description="Profiling, caching, algorithm optimization",
                difficulty=5,
                estimated_time=60
            ),
            Topic(
                id="py_metaprogramming",
                title="Metaprogramming",
                description="Metaclasses, descriptors, dynamic attribute creation",
                difficulty=5,
                prerequisites=["py_oop_2", "py_decorators"],
                estimated_time=90
            ),
            Topic(
                id="py_libs_1",
                title="NumPy Basics",
                description="Arrays, vectorized operations, mathematical functions",
                difficulty=4,
                estimated_time=60
            ),
            Topic(
                id="py_libs_2",
                title="Pandas Basics",
                description="DataFrames, Series, data manipulation",
                difficulty=4,
                estimated_time=90
            ),
        ],
        total_estimated_hours=9.0
    )
)

# ====================== MODULE REGISTRY ======================

MODULES: Dict[str, LearningModule] = {
    "python": PYTHON_MODULE,
    # Future modules will be added here
    # "machine_learning": ML_MODULE,
    # "web_development": WEB_MODULE,
    # "sql": SQL_MODULE,
}

def get_module(module_id: str) -> Optional[LearningModule]:
    """Get a learning module by ID."""
    return MODULES.get(module_id.lower())

def get_available_modules() -> List[str]:
    """Get list of available module IDs."""
    return list(MODULES.keys())

def get_level_topics(module_id: str, level: str) -> List[Topic]:
    """Get topics for a specific module and level."""
    module = get_module(module_id)
    if not module:
        return []
    
    level_map = {
        "beginner": module.beginner,
        "intermediate": module.intermediate,
        "advanced": module.advanced
    }
    
    level_data = level_map.get(level.lower())
    return level_data.topics if level_data else []