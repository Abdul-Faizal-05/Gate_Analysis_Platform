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
    console.log('\n✨ Server is ready to accept requests!\n');
});
