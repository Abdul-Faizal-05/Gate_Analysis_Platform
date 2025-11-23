require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase Client
const supabaseUrl = process.env.supabase_url;
const supabaseKey = process.env.supabase_key;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase URL or Key is missing in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test Supabase Connection
const testConnection = async () => {
    try {
        const { data, error } = await supabase.from('users').select('count').limit(1);
        if (error) {
            console.log('⚠️  Table "users" not found or connection issue:', error.message);
            console.log('📝 Please create a "users" table in your Supabase database');
        } else {
            console.log('✅ Successfully connected to Supabase!');
        }
    } catch (err) {
        console.log('⚠️  Supabase connection test failed:', err.message);
    }
};

//registration endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { name, profileName, email, password, userType } = req.body;

        // Validation
        if (!name || !profileName || !email || !password || !userType) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate profile name format (letters, numbers, underscores only)
        const profileNameRegex = /^[a-zA-Z0-9_]+$/;
        if (!profileNameRegex.test(profileName)) {
            return res.status(400).json({
                success: false,
                message: 'Profile name must contain only letters, numbers, and underscores'
            });
        }

        // Check if email already exists
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Check if profile name already exists
        const { data: existingProfile, error: profileCheckError } = await supabase
            .from('users')
            .select('profile_name')
            .eq('profile_name', profileName)
            .single();

        if (existingProfile) {
            return res.status(409).json({
                success: false,
                message: 'Profile name already taken'
            });
        }

        // Hash the password before storing
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user into Supabase
        const { data, error } = await supabase
            .from('users')
            .insert([
                {
                    name: name,
                    profile_name: profileName,
                    email: email,
                    password: hashedPassword,
                    user_type: userType,
                    created_at: new Date().toISOString()
                }
            ])
            .select();

        if (error) {
            console.error('Supabase insert error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to register user',
                error: error.message
            });
        }

        console.log('✅ User registered successfully:', email);
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: data[0].id,
                name: data[0].name,
                profileName: data[0].profile_name,
                email: data[0].email,
                userType: data[0].user_type
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: error.message
        });
    }
});

//Login Endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Query user from database
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Compare the provided password with the hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login time (optional)
        await supabase
            .from('users')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', user.id);

        console.log('✅ User logged in successfully:', email);

        // Return user data (excluding password)
        res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                profileName: user.profile_name,
                email: user.email,
                userType: user.user_type,
                createdAt: user.created_at
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message
        });
    }
});

// Get all problems endpoint
app.get('/api/problems', async (req, res) => {
    try {
        // Fetch all problems
        const { data: problems, error: problemsError } = await supabase
            .from('problems')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (problemsError) {
            console.error('Error fetching problems:', problemsError);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch problems',
                error: problemsError.message
            });
        }

        // For each problem, fetch its options or NAT answers based on type
        const problemsWithDetails = await Promise.all(
            problems.map(async (problem) => {
                if (problem.question_type === 'mcq' || problem.question_type === 'msq') {
                    // Fetch options for MCQ/MSQ
                    const { data: options, error: optionsError } = await supabase
                        .from('problem_options')
                        .select('*')
                        .eq('problem_id', problem.id)
                        .order('order_index', { ascending: true });

                    if (optionsError) {
                        console.error(`Error fetching options for problem ${problem.id}:`, optionsError);
                        return { ...problem, options: [] };
                    }

                    return {
                        ...problem,
                        options: options.map(opt => ({
                            text: opt.option_text,
                            displayText: opt.display_text,
                            isCorrect: opt.is_correct
                        }))
                    };
                } else if (problem.question_type === 'nat') {
                    // Fetch NAT answer
                    const { data: natAnswers, error: natError } = await supabase
                        .from('nat_answers')
                        .select('*')
                        .eq('problem_id', problem.id)
                        .single();

                    if (natError) {
                        console.error(`Error fetching NAT answer for problem ${problem.id}:`, natError);
                        return { ...problem, natAnswer: null };
                    }

                    return {
                        ...problem,
                        natAnswer: {
                            correctAnswer: natAnswers.correct_answer,
                            answerText: natAnswers.answer_text,
                            tolerance: natAnswers.tolerance,
                            answerUnit: natAnswers.answer_unit
                        }
                    };
                }

                return problem;
            })
        );

        console.log(`✅ Fetched ${problemsWithDetails.length} problems from database`);

        res.status(200).json({
            success: true,
            problems: problemsWithDetails,
            total: problemsWithDetails.length
        });

    } catch (error) {
        console.error('Error in /api/problems:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching problems',
            error: error.message
        });
    }
});

// Get problems by subject endpoint
app.get('/api/problems/subject/:subject', async (req, res) => {
    try {
        const { subject } = req.params;

        const { data: problems, error } = await supabase
            .from('problems')
            .select('*')
            .eq('subject', subject)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch problems',
                error: error.message
            });
        }

        res.status(200).json({
            success: true,
            problems,
            total: problems.length
        });

    } catch (error) {
        console.error('Error fetching problems by subject:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Submit problem attempt endpoint
app.post('/api/problems/attempt', async (req, res) => {
    try {
        const {
            userId,
            problemId,
            selectedOptions,
            natAnswerValue,
            natAnswerText,
            isCorrect,
            score,
            timeTaken,
            userExplanation
        } = req.body;

        // Validation
        if (!userId || !problemId || isCorrect === undefined || score === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Get current attempt number for this user-problem combination
        const { data: existingAttempts, error: countError } = await supabase
            .from('user_problem_attempts')
            .select('attempt_number')
            .eq('user_id', userId)
            .eq('problem_id', problemId)
            .order('attempt_number', { ascending: false })
            .limit(1);

        const attemptNumber = existingAttempts && existingAttempts.length > 0
            ? existingAttempts[0].attempt_number + 1
            : 1;

        // Insert the attempt
        const { data: attempt, error: insertError } = await supabase
            .from('user_problem_attempts')
            .insert([{
                user_id: userId,
                problem_id: problemId,
                attempt_number: attemptNumber,
                selected_options: selectedOptions || null,
                nat_answer_value: natAnswerValue || null,
                nat_answer_text: natAnswerText || null,
                is_correct: isCorrect,
                score: score,
                time_taken: timeTaken || null,
                user_explanation: userExplanation || null,
                attempted_at: new Date().toISOString()
            }])
            .select();

        if (insertError) {
            console.error('Error inserting attempt:', insertError);
            return res.status(500).json({
                success: false,
                message: 'Failed to save attempt',
                error: insertError.message
            });
        }

        console.log(`✅ Problem attempt saved for user ${userId}, problem ${problemId}`);

        res.status(201).json({
            success: true,
            message: 'Attempt saved successfully',
            attempt: attempt[0]
        });

    } catch (error) {
        console.error('Error in problem attempt:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while saving attempt',
            error: error.message
        });
    }
});

// Get user progress endpoint
app.get('/api/progress/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Fetch user's progress summary
        const { data: progressSummary, error: summaryError } = await supabase
            .from('user_progress_summary')
            .select('*')
            .eq('user_id', userId);

        if (summaryError) {
            console.error('Error fetching progress summary:', summaryError);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch progress',
                error: summaryError.message
            });
        }

        // Fetch user's completed problems with details
        const { data: attempts, error: attemptsError } = await supabase
            .from('user_problem_attempts')
            .select(`
                *,
                problems (id, subject, topic, title, difficulty)
            `)
            .eq('user_id', userId)
            .order('attempted_at', { ascending: false });

        if (attemptsError) {
            console.error('Error fetching attempts:', attemptsError);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch attempts',
                error: attemptsError.message
            });
        }

        // Transform attempts data
        const completedProblems = attempts.map(attempt => ({
            id: attempt.problem_id,
            subject: attempt.problems?.subject,
            topic: attempt.problems?.topic,
            title: attempt.problems?.title,
            difficulty: attempt.problems?.difficulty,
            score: attempt.score,
            isCorrect: attempt.is_correct,
            attemptedAt: attempt.attempted_at,
            attemptNumber: attempt.attempt_number
        }));

        res.status(200).json({
            success: true,
            progressSummary: progressSummary || [],
            completedProblems,
            totalAttempts: attempts.length
        });

    } catch (error) {
        console.error('Error fetching user progress:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching progress',
            error: error.message
        });
    }
});

// ============================================
// DISCUSSION FORUM ENDPOINTS
// ============================================

// Get all discussions
app.get('/api/discussions', async (req, res) => {
    try {
        const { subject, resolved } = req.query;

        let query = supabase
            .from('discussions')
            .select(`
                *,
                users!discussions_user_id_fkey (
                    id,
                    name,
                    user_type
                )
            `)
            .eq('is_active', true)
            .order('is_pinned', { ascending: false })
            .order('last_activity_at', { ascending: false });

        // Apply filters
        if (subject && subject !== 'all') {
            query = query.eq('subject', subject);
        }
        if (resolved !== undefined) {
            query = query.eq('is_resolved', resolved === 'true');
        }

        const { data: discussions, error } = await query;

        if (error) {
            console.error('Error fetching discussions:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch discussions',
                error: error.message
            });
        }

        // Transform data for frontend
        const transformedDiscussions = discussions.map(disc => ({
            id: disc.id,
            title: disc.title,
            content: disc.content,
            subject: disc.subject,
            userId: disc.user_id,
            userName: disc.users?.name || 'Anonymous',
            userRole: disc.users?.user_type || 'Student',
            isResolved: disc.is_resolved,
            isPinned: disc.is_pinned,
            viewsCount: disc.views_count,
            repliesCount: disc.replies_count,
            likesCount: disc.likes_count,
            timestamp: disc.created_at,
            lastActivity: disc.last_activity_at
        }));

        res.status(200).json({
            success: true,
            discussions: transformedDiscussions,
            total: transformedDiscussions.length
        });

    } catch (error) {
        console.error('Error in /api/discussions:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get single discussion with replies
app.get('/api/discussions/:discussionId', async (req, res) => {
    try {
        const { discussionId } = req.params;
        const { userId } = req.query;

        // Fetch discussion
        const { data: discussion, error: discError } = await supabase
            .from('discussions')
            .select(`
                *,
                users!discussions_user_id_fkey (
                    id,
                    name,
                    user_type
                )
            `)
            .eq('id', discussionId)
            .single();

        if (discError || !discussion) {
            return res.status(404).json({
                success: false,
                message: 'Discussion not found'
            });
        }

        // Fetch replies
        const { data: replies, error: repliesError } = await supabase
            .from('discussion_replies')
            .select(`
                *,
                users!discussion_replies_user_id_fkey (
                    id,
                    name,
                    user_type
                )
            `)
            .eq('discussion_id', discussionId)
            .eq('is_active', true)
            .order('created_at', { ascending: true });

        if (repliesError) {
            console.error('Error fetching replies:', repliesError);
        }

        // Record view if userId provided
        if (userId) {
            await supabase
                .from('discussion_views')
                .upsert({
                    discussion_id: discussionId,
                    user_id: userId,
                    viewed_at: new Date().toISOString()
                }, {
                    onConflict: 'discussion_id,user_id'
                });
        }

        // Transform data
        const transformedReplies = (replies || []).map(reply => ({
            id: reply.id,
            content: reply.content,
            userId: reply.user_id,
            userName: reply.users?.name || 'Anonymous',
            userRole: reply.users?.user_type || 'Student',
            isAcceptedAnswer: reply.is_accepted_answer,
            likesCount: reply.likes_count,
            timestamp: reply.created_at
        }));

        res.status(200).json({
            success: true,
            discussion: {
                id: discussion.id,
                title: discussion.title,
                content: discussion.content,
                subject: discussion.subject,
                userId: discussion.user_id,
                userName: discussion.users?.name || 'Anonymous',
                userRole: discussion.users?.user_type || 'Student',
                isResolved: discussion.is_resolved,
                isPinned: discussion.is_pinned,
                viewsCount: discussion.views_count,
                repliesCount: discussion.replies_count,
                likesCount: discussion.likes_count,
                timestamp: discussion.created_at,
                replies: transformedReplies
            }
        });

    } catch (error) {
        console.error('Error fetching discussion:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Create new discussion
app.post('/api/discussions', async (req, res) => {
    try {
        const { userId, title, content, subject, tags } = req.body;

        // Validation
        if (!userId || !title || !content || !subject) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Insert discussion
        const { data: discussion, error } = await supabase
            .from('discussions')
            .insert([{
                user_id: userId,
                title: title,
                content: content,
                subject: subject,
                created_at: new Date().toISOString(),
                last_activity_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating discussion:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create discussion',
                error: error.message
            });
        }

        // Add tags if provided
        if (tags && tags.length > 0) {
            const tagInserts = tags.map(tag => ({
                discussion_id: discussion.id,
                tag_name: tag
            }));
            await supabase.from('discussion_tags').insert(tagInserts);
        }

        console.log(`✅ Discussion created: ${discussion.id}`);

        res.status(201).json({
            success: true,
            message: 'Discussion created successfully',
            discussion: discussion
        });

    } catch (error) {
        console.error('Error creating discussion:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Add reply to discussion
app.post('/api/discussions/:discussionId/replies', async (req, res) => {
    try {
        const { discussionId } = req.params;
        const { userId, content } = req.body;

        // Validation
        if (!userId || !content) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Insert reply
        const { data: reply, error } = await supabase
            .from('discussion_replies')
            .insert([{
                discussion_id: discussionId,
                user_id: userId,
                content: content,
                created_at: new Date().toISOString()
            }])
            .select(`
                *,
                users!discussion_replies_user_id_fkey (
                    id,
                    name,
                    user_type
                )
            `)
            .single();

        if (error) {
            console.error('Error adding reply:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to add reply',
                error: error.message
            });
        }

        console.log(`✅ Reply added to discussion ${discussionId}`);

        res.status(201).json({
            success: true,
            message: 'Reply added successfully',
            reply: {
                id: reply.id,
                content: reply.content,
                userId: reply.user_id,
                userName: reply.users?.name || 'Anonymous',
                userRole: reply.users?.user_type || 'Student',
                timestamp: reply.created_at
            }
        });

    } catch (error) {
        console.error('Error adding reply:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Toggle like on discussion or reply
app.post('/api/discussions/like', async (req, res) => {
    try {
        const { userId, discussionId, replyId } = req.body;

        // Validation
        if (!userId || (!discussionId && !replyId)) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Check if already liked
        let existingLike;
        if (discussionId) {
            const { data, error } = await supabase
                .from('discussion_likes')
                .select('*')
                .eq('user_id', userId)
                .eq('discussion_id', discussionId)
                .maybeSingle();

            existingLike = data;
            if (error && error.code !== 'PGRST116') {
                throw error;
            }
        } else {
            const { data, error } = await supabase
                .from('discussion_likes')
                .select('*')
                .eq('user_id', userId)
                .eq('reply_id', replyId)
                .maybeSingle();

            existingLike = data;
            if (error && error.code !== 'PGRST116') {
                throw error;
            }
        }

        if (existingLike) {
            // Unlike - remove the like
            const { error } = await supabase
                .from('discussion_likes')
                .delete()
                .eq('id', existingLike.id);

            if (error) {
                throw error;
            }

            res.status(200).json({
                success: true,
                message: 'Unliked successfully',
                liked: false
            });
        } else {
            // Like - add the like
            const { error } = await supabase
                .from('discussion_likes')
                .insert([{
                    user_id: userId,
                    discussion_id: discussionId || null,
                    reply_id: replyId || null
                }]);

            if (error) {
                throw error;
            }

            res.status(201).json({
                success: true,
                message: 'Liked successfully',
                liked: true
            });
        }

    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Check if user has liked discussion/reply
app.get('/api/discussions/like-status', async (req, res) => {
    try {
        const { userId, discussionId, replyId } = req.query;

        if (!userId || (!discussionId && !replyId)) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        let query = supabase
            .from('discussion_likes')
            .select('*')
            .eq('user_id', userId);

        if (discussionId) {
            query = query.eq('discussion_id', discussionId);
        } else {
            query = query.eq('reply_id', replyId);
        }

        const { data, error } = await query.maybeSingle();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        res.status(200).json({
            success: true,
            liked: !!data
        });

    } catch (error) {
        console.error('Error checking like status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Delete discussion (admin only)
app.delete('/api/discussions/:discussionId', async (req, res) => {
    try {
        const { discussionId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Check if user is admin
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('user_type')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.user_type !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can delete discussions'
            });
        }

        // Soft delete the discussion
        const { error: deleteError } = await supabase
            .from('discussions')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', discussionId);

        if (deleteError) {
            throw deleteError;
        }

        // Also soft delete all replies
        await supabase
            .from('discussion_replies')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('discussion_id', discussionId);

        console.log(`✅ Discussion ${discussionId} deleted by admin ${userId}`);

        res.status(200).json({
            success: true,
            message: 'Discussion deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting discussion:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Delete reply (admin only)
app.delete('/api/discussions/:discussionId/replies/:replyId', async (req, res) => {
    try {
        const { replyId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Check if user is admin
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('user_type')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.user_type !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can delete replies'
            });
        }

        // Soft delete the reply
        const { error: deleteError } = await supabase
            .from('discussion_replies')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', replyId);

        if (deleteError) {
            throw deleteError;
        }

        console.log(`✅ Reply ${replyId} deleted by admin ${userId}`);

        res.status(200).json({
            success: true,
            message: 'Reply deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting reply:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

app.listen(PORT, async () => {
    console.log('\n🚀 Server started successfully!');
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`🔗 Supabase URL: ${supabaseUrl}`);
    console.log('\n🔍 Testing Supabase connection...\n');
    await testConnection();
    console.log('\n📋 Available endpoints:');
    console.log(`   POST http://localhost:${PORT}/api/register`);
    console.log(`   POST http://localhost:${PORT}/api/login`);
    console.log(`   GET  http://localhost:${PORT}/api/problems`);
    console.log(`   GET  http://localhost:${PORT}/api/problems/subject/:subject`);
    console.log(`   POST http://localhost:${PORT}/api/problems/attempt`);
    console.log(`   GET  http://localhost:${PORT}/api/progress/:userId`);
    console.log(`   GET  http://localhost:${PORT}/api/discussions`);
    console.log(`   GET  http://localhost:${PORT}/api/discussions/:id`);
    console.log(`   POST http://localhost:${PORT}/api/discussions`);
    console.log(`   POST http://localhost:${PORT}/api/discussions/:id/replies`);
    console.log(`   POST http://localhost:${PORT}/api/discussions/like`);
    console.log(`   GET  http://localhost:${PORT}/api/discussions/like-status`);
    console.log(`   DELETE http://localhost:${PORT}/api/discussions/:id`);
    console.log(`   DELETE http://localhost:${PORT}/api/discussions/:id/replies/:replyId`);
    console.log('\n✨ Server is ready to accept requests!\n');
});
