-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  profile_name VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL, 
  user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('student', 'teacher', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_profile_name ON public.users(profile_name);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);

-- ============================================
-- PROBLEMS TABLE SCHEMA (Practice Cards)
-- ============================================

-- Main Problems table (stores all problem metadata)
CREATE TABLE IF NOT EXISTS public.problems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  question_text TEXT NOT NULL,
  subject VARCHAR(100) NOT NULL,
  topic VARCHAR(100) NOT NULL,
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  question_type VARCHAR(10) NOT NULL CHECK (question_type IN ('mcq', 'msq', 'nat')),
  marks DECIMAL(5,2) DEFAULT 1.0,
  solution_explanation TEXT,
  hints TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- MCQ/MSQ Options table (stores options for MCQ and MSQ questions)
CREATE TABLE IF NOT EXISTS public.problem_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  display_text TEXT NOT NULL,
  option_label CHAR(1) NOT NULL CHECK (option_label IN ('A', 'B', 'C', 'D', 'E', 'F')),
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(problem_id, option_label)
);

-- NAT Answers table (stores correct answers for NAT questions)
CREATE TABLE IF NOT EXISTS public.nat_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  correct_answer DECIMAL(10,4) NOT NULL,
  answer_text VARCHAR(255),
  tolerance DECIMAL(10,4) DEFAULT 0.0,
  answer_unit VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_problems_subject ON public.problems(subject);
CREATE INDEX IF NOT EXISTS idx_problems_topic ON public.problems(topic);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON public.problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_question_type ON public.problems(question_type);
CREATE INDEX IF NOT EXISTS idx_problems_active ON public.problems(is_active);
CREATE INDEX IF NOT EXISTS idx_problems_subject_topic ON public.problems(subject, topic);
CREATE INDEX IF NOT EXISTS idx_problem_options_problem_id ON public.problem_options(problem_id);
CREATE INDEX IF NOT EXISTS idx_nat_answers_problem_id ON public.nat_answers(problem_id);

-- ============================================
-- TRIGGER FOR AUTO-UPDATE TIMESTAMP
-- ============================================

CREATE OR REPLACE FUNCTION update_problems_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_problems_updated_at 
BEFORE UPDATE ON public.problems
FOR EACH ROW 
EXECUTE FUNCTION update_problems_timestamp();

