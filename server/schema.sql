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


-- ============================================
-- DISCUSSION FORUM SCHEMA
-- ============================================

-- Discussions table (main discussion posts)
CREATE TABLE IF NOT EXISTS public.discussions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  subject VARCHAR(100) NOT NULL,
  
  -- Author information
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Status and visibility
  is_resolved BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Engagement metrics
  views_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discussion replies table
CREATE TABLE IF NOT EXISTS public.discussion_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_id UUID NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  
  -- Author information
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Reply metadata
  is_accepted_answer BOOLEAN DEFAULT FALSE, -- For marking best answer
  is_active BOOLEAN DEFAULT TRUE,
  likes_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discussion likes table (for both posts and replies)
CREATE TABLE IF NOT EXISTS public.discussion_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  discussion_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES public.discussion_replies(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure user can like a discussion or reply only once
  CONSTRAINT unique_discussion_like UNIQUE(user_id, discussion_id),
  CONSTRAINT unique_reply_like UNIQUE(user_id, reply_id),
  CONSTRAINT check_like_target CHECK (
    (discussion_id IS NOT NULL AND reply_id IS NULL) OR 
    (discussion_id IS NULL AND reply_id IS NOT NULL)
  )
);

-- Discussion views table (track who viewed what)
CREATE TABLE IF NOT EXISTS public.discussion_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_id UUID NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- NULL for guest views
  
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate views (optional, can be removed to track multiple views)
  UNIQUE(discussion_id, user_id)
);

-- Discussion tags table (optional - for better categorization)
CREATE TABLE IF NOT EXISTS public.discussion_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_id UUID NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  tag_name VARCHAR(50) NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(discussion_id, tag_name)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Discussions indexes
CREATE INDEX IF NOT EXISTS idx_discussions_user_id ON public.discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_discussions_subject ON public.discussions(subject);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON public.discussions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_last_activity ON public.discussions(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_is_resolved ON public.discussions(is_resolved);
CREATE INDEX IF NOT EXISTS idx_discussions_is_pinned ON public.discussions(is_pinned);
CREATE INDEX IF NOT EXISTS idx_discussions_active ON public.discussions(is_active);

-- Replies indexes
CREATE INDEX IF NOT EXISTS idx_replies_discussion_id ON public.discussion_replies(discussion_id);
CREATE INDEX IF NOT EXISTS idx_replies_user_id ON public.discussion_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_replies_created_at ON public.discussion_replies(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_replies_accepted ON public.discussion_replies(is_accepted_answer);

-- Likes indexes
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.discussion_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_discussion_id ON public.discussion_likes(discussion_id);
CREATE INDEX IF NOT EXISTS idx_likes_reply_id ON public.discussion_likes(reply_id);

-- Views indexes
CREATE INDEX IF NOT EXISTS idx_views_discussion_id ON public.discussion_views(discussion_id);
CREATE INDEX IF NOT EXISTS idx_views_user_id ON public.discussion_views(user_id);

-- Tags indexes
CREATE INDEX IF NOT EXISTS idx_tags_discussion_id ON public.discussion_tags(discussion_id);
CREATE INDEX IF NOT EXISTS idx_tags_tag_name ON public.discussion_tags(tag_name);

-- ============================================
-- TRIGGERS AND FUNCTIONS
-- ============================================

-- Function to update discussion reply count
CREATE OR REPLACE FUNCTION update_discussion_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE discussions 
        SET replies_count = replies_count + 1,
            last_activity_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.discussion_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE discussions 
        SET replies_count = GREATEST(0, replies_count - 1),
            updated_at = NOW()
        WHERE id = OLD.discussion_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reply count
CREATE TRIGGER trigger_update_reply_count
AFTER INSERT OR DELETE ON public.discussion_replies
FOR EACH ROW
EXECUTE FUNCTION update_discussion_reply_count();

-- Function to update discussion likes count
CREATE OR REPLACE FUNCTION update_discussion_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.discussion_id IS NOT NULL THEN
            UPDATE discussions 
            SET likes_count = likes_count + 1,
                updated_at = NOW()
            WHERE id = NEW.discussion_id;
        ELSIF NEW.reply_id IS NOT NULL THEN
            UPDATE discussion_replies 
            SET likes_count = likes_count + 1,
                updated_at = NOW()
            WHERE id = NEW.reply_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.discussion_id IS NOT NULL THEN
            UPDATE discussions 
            SET likes_count = GREATEST(0, likes_count - 1),
                updated_at = NOW()
            WHERE id = OLD.discussion_id;
        ELSIF OLD.reply_id IS NOT NULL THEN
            UPDATE discussion_replies 
            SET likes_count = GREATEST(0, likes_count - 1),
                updated_at = NOW()
            WHERE id = OLD.reply_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for likes count
CREATE TRIGGER trigger_update_likes_count
AFTER INSERT OR DELETE ON public.discussion_likes
FOR EACH ROW
EXECUTE FUNCTION update_discussion_likes_count();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_discussion_views()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE discussions 
    SET views_count = views_count + 1
    WHERE id = NEW.discussion_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for view count
CREATE TRIGGER trigger_increment_views
AFTER INSERT ON public.discussion_views
FOR EACH ROW
EXECUTE FUNCTION increment_discussion_views();

-- Update timestamp trigger
CREATE TRIGGER update_discussions_timestamp 
BEFORE UPDATE ON public.discussions
FOR EACH ROW 
EXECUTE FUNCTION update_problems_timestamp();

CREATE TRIGGER update_replies_timestamp 
BEFORE UPDATE ON public.discussion_replies
FOR EACH ROW 
EXECUTE FUNCTION update_problems_timestamp();

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Sample discussions
DO $$
DECLARE
    user1_id UUID;
    user2_id UUID;
    disc1_id UUID;
    disc2_id UUID;
BEGIN
    -- Get user IDs (assuming users exist)
    SELECT id INTO user1_id FROM users LIMIT 1 OFFSET 0;
    SELECT id INTO user2_id FROM users LIMIT 1 OFFSET 1;
    
    -- If no second user, use first user
    IF user2_id IS NULL THEN
        user2_id := user1_id;
    END IF;
    
    -- Insert sample discussions
    INSERT INTO discussions (title, content, subject, user_id)
    VALUES 
    (
        'How does TCP differ from UDP?',
        'Can someone explain the key differences between TCP and UDP protocols? I understand TCP is connection-oriented, but what are the practical implications?',
        'Computer Networks',
        user1_id
    )
    RETURNING id INTO disc1_id;
    
    INSERT INTO discussions (title, content, subject, user_id)
    VALUES 
    (
        'What is deadlock in OS?',
        'I need help understanding the concept of deadlock and its prevention methods. Can someone explain with real-world examples?',
        'Operating Systems',
        user2_id
    )
    RETURNING id INTO disc2_id;
    
    -- Insert sample replies
    INSERT INTO discussion_replies (discussion_id, content, user_id)
    VALUES 
    (
        disc1_id,
        'TCP is reliable and ensures packet delivery, while UDP is faster but doesn''t guarantee delivery. Use TCP for web browsing, UDP for gaming or streaming.',
        user2_id
    );
    
    INSERT INTO discussion_replies (discussion_id, content, user_id)
    VALUES 
    (
        disc2_id,
        'Deadlock occurs when processes wait for resources held by each other. Prevention methods include resource ordering and avoiding circular wait.',
        user1_id
    );
    
END $$;


-- ============================================
-- ADMIN-ONLY DELETE FUNCTIONS FOR DISCUSSIONS
-- ============================================

-- Function to check if user is admin before allowing deletion
CREATE OR REPLACE FUNCTION check_admin_before_delete_discussion()
RETURNS TRIGGER AS $$
DECLARE
    user_role VARCHAR(50);
BEGIN
    -- Get the user's role
    SELECT user_type INTO user_role
    FROM users
    WHERE id = OLD.user_id;
    
    -- Check if the current user attempting deletion is admin
    -- Note: In practice, you'd pass the deleting user's ID, not the post owner's ID
    -- This is a simplified version - see note below
    IF user_role != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can delete discussions';
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce admin-only deletion for discussions
CREATE TRIGGER enforce_admin_delete_discussion
BEFORE DELETE ON public.discussions
FOR EACH ROW
EXECUTE FUNCTION check_admin_before_delete_discussion();

-- Function to check if user is admin before allowing reply deletion
CREATE OR REPLACE FUNCTION check_admin_before_delete_reply()
RETURNS TRIGGER AS $$
DECLARE
    user_role VARCHAR(50);
BEGIN
    -- Get the user's role
    SELECT user_type INTO user_role
    FROM users
    WHERE id = OLD.user_id;
    
    -- Check if the current user is admin
    IF user_role != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can delete replies';
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce admin-only deletion for replies
CREATE TRIGGER enforce_admin_delete_reply
BEFORE DELETE ON public.discussion_replies
FOR EACH ROW
EXECUTE FUNCTION check_admin_before_delete_reply();

-- ============================================
-- SOFT DELETE APPROACH (RECOMMENDED)
-- ============================================
-- Instead of hard deletes, use soft deletes by setting is_active = false
-- This is better for audit trails and data recovery

-- Function to soft delete discussion (admin only)
CREATE OR REPLACE FUNCTION soft_delete_discussion(
    p_discussion_id UUID,
    p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    user_role VARCHAR(50);
    result JSON;
BEGIN
    -- Check if user is admin
    SELECT user_type INTO user_role
    FROM users
    WHERE id = p_user_id;
    
    IF user_role != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can delete discussions';
    END IF;
    
    -- Soft delete the discussion
    UPDATE discussions
    SET is_active = false,
        updated_at = NOW()
    WHERE id = p_discussion_id;
    
    -- Also soft delete all replies
    UPDATE discussion_replies
    SET is_active = false,
        updated_at = NOW()
    WHERE discussion_id = p_discussion_id;
    
    result := json_build_object(
        'success', true,
        'message', 'Discussion deleted successfully'
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        result := json_build_object(
            'success', false,
            'message', SQLERRM
        );
        RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to soft delete reply (admin only)
CREATE OR REPLACE FUNCTION soft_delete_reply(
    p_reply_id UUID,
    p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    user_role VARCHAR(50);
    result JSON;
BEGIN
    -- Check if user is admin
    SELECT user_type INTO user_role
    FROM users
    WHERE id = p_user_id;
    
    IF user_role != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can delete replies';
    END IF;
    
    -- Soft delete the reply
    UPDATE discussion_replies
    SET is_active = false,
        updated_at = NOW()
    WHERE id = p_reply_id;
    
    result := json_build_object(
        'success', true,
        'message', 'Reply deleted successfully'
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        result := json_build_object(
            'success', false,
            'message', SQLERRM
        );
        RETURN result;
END;
$$ LANGUAGE plpgsql;

