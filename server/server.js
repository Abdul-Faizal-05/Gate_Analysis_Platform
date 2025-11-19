require('dotenv').config();
const express = require('express');
const cors = require('cors');
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

        // Insert new user into Supabase
        const { data, error } = await supabase
            .from('users')
            .insert([
                {
                    name: name,
                    profile_name: profileName,
                    email: email,
                    password: password,
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

        // Check password (Note: In production, use bcrypt.compare() for hashed passwords)
        if (user.password !== password) {
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

app.listen(PORT, async () => {
    console.log('\n🚀 Server started successfully!');
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`🔗 Supabase URL: ${supabaseUrl}`);
    console.log('\n🔍 Testing Supabase connection...\n');
    await testConnection();
    console.log('\n📋 Available endpoints:');
    console.log(`   POST http://localhost:${PORT}/api/register`);
    console.log(`   POST http://localhost:${PORT}/api/login`);
    console.log('\n✨ Server is ready to accept requests!\n');
});
