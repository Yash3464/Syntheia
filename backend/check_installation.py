"""
Check if all required packages are installed correctly.
"""

import sys
print(f"Python version: {sys.version}")

packages_to_check = [
    ("fastapi", "0.104.1"),
    ("uvicorn", "0.24.0"),
    ("pydantic", "2.5.0"),
    ("python-dotenv", "1.0.0"),
    ("pydantic-settings", "2.1.0"),
    ("sqlalchemy", "2.0.23"),
    ("alembic", "1.12.1"),
    ("openai", None),  # Any version
    ("numpy", None),   # Any version
    ("python-multipart", "0.0.6"),
]

print("\n🔍 Checking installed packages:")
print("=" * 50)

for package_name, expected_version in packages_to_check:
    try:
        module = __import__(package_name)
        version = getattr(module, '__version__', 'unknown')
        status = "✅"
        
        if expected_version and version != expected_version:
            status = f"⚠️ (has {version}, expected {expected_version})"
        
        print(f"{status} {package_name}: {version}")
    except ImportError:
        print(f"❌ {package_name}: NOT INSTALLED")

print("\n" + "=" * 50)
print("Testing SQLAlchemy import with Python 3.13 fix...")

# Try importing SQLAlchemy with fix
try:
    # Apply quick fix
    import sqlalchemy.util.langhelpers
    original = sqlalchemy.util.langhelpers.__init_subclass__
    
    def fixed_init_subclass(cls, *args, **kwargs):
        filtered = {k: v for k, v in kwargs.items() 
                   if k not in ['__firstlineno__', '__static_attributes__']}
        return original(cls, *args, **filtered)
    
    sqlalchemy.util.langhelpers.__init_subclass__ = fixed_init_subclass
    
    # Now try full import
    import sqlalchemy
    from sqlalchemy.engine import create_engine
    print(f"✅ SQLAlchemy works! Version: {sqlalchemy.__version__}")
    
except Exception as e:
    print(f"❌ SQLAlchemy error: {type(e).__name__}: {e}")

print("\n" + "=" * 50)
print("Testing core functionality...")

try:
    from pydantic import BaseModel
    
    class TestModel(BaseModel):
        name: str
        value: int
    
    test = TestModel(name="test", value=42)
    print(f"✅ Pydantic works: {test}")
    
    import fastapi
    print(f"✅ FastAPI works: {fastapi.__version__}")
    
    import uvicorn
    print(f"✅ Uvicorn works: {uvicorn.__version__}")
    
except Exception as e:
    print(f"❌ Core functionality error: {e}")