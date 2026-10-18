CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL DEFAULT 'Глеб',
  chat_id TEXT,
  timezone TEXT NOT NULL DEFAULT 'Europe/Moscow',
  reminder_enabled INTEGER NOT NULL DEFAULT 0,
  reminder_time TEXT NOT NULL DEFAULT '18:00',
  last_reminder_day TEXT,
  calorie_goal INTEGER NOT NULL DEFAULT 2700,
  protein_goal INTEGER NOT NULL DEFAULT 160,
  fat_goal INTEGER NOT NULL DEFAULT 80,
  carb_goal INTEGER NOT NULL DEFAULT 335,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  day_id TEXT NOT NULL,
  duration_sec INTEGER NOT NULL DEFAULT 0,
  exercises_json TEXT NOT NULL,
  completed_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(user_id, date);
CREATE TABLE IF NOT EXISTS meals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  title TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein REAL NOT NULL,
  fat REAL NOT NULL,
  carbs REAL NOT NULL,
  items_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, date);
CREATE TABLE IF NOT EXISTS weights (
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  kg REAL NOT NULL,
  PRIMARY KEY(user_id, date)
);

-- FORMA 2.0
CREATE TABLE IF NOT EXISTS waists (
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  cm REAL NOT NULL,
  PRIMARY KEY(user_id, date)
);
CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  calories REAL NOT NULL,
  protein REAL NOT NULL,
  fat REAL NOT NULL,
  carbs REAL NOT NULL,
  items_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS progress_photos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  object_key TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_progress_photos_user ON progress_photos(user_id, date DESC);
