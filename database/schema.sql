-- Database schema for Syntheia (for future implementation)

-- Users table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    experience_level VARCHAR(20) DEFAULT 'beginner',
    current_goal TEXT,
    preferred_learning_style VARCHAR(20) DEFAULT 'mixed',
    daily_study_time_minutes INT DEFAULT 60,
    preferred_difficulty VARCHAR(20) DEFAULT 'balanced',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_updates BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Learning paths table
CREATE TABLE learning_paths (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    module_id VARCHAR(50) NOT NULL,
    level VARCHAR(20) NOT NULL,
    pace VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    target_end_date DATE,
    actual_end_date DATE,
    total_days INT NOT NULL,
    completed_days INT DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Daily tasks table
CREATE TABLE daily_tasks (
    id VARCHAR(36) PRIMARY KEY,
    learning_path_id VARCHAR(36) NOT NULL,
    day_number INT NOT NULL,
    task_date DATE,
    topic_ids JSON NOT NULL,
    topics JSON NOT NULL,
    estimated_time_minutes INT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    actual_time_minutes INT,
    completion_date TIMESTAMP,
    notes TEXT,
    resources JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (learning_path_id) REFERENCES learning_paths(id) ON DELETE CASCADE,
    UNIQUE KEY unique_day_path (learning_path_id, day_number)
);

-- Task completions table
CREATE TABLE task_completions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    task_id VARCHAR(100) NOT NULL,
    completion_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    time_spent_minutes INT NOT NULL,
    confidence_score INT CHECK (confidence_score BETWEEN 1 AND 5),
    notes TEXT,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_learning_paths_user ON learning_paths(user_id);
CREATE INDEX idx_learning_paths_active ON learning_paths(is_active);
CREATE INDEX idx_daily_tasks_path ON daily_tasks(learning_path_id);
CREATE INDEX idx_daily_tasks_status ON daily_tasks(status);
CREATE INDEX idx_task_completions_user ON task_completions(user_id);
CREATE INDEX idx_task_completions_date ON task_completions(completion_date);