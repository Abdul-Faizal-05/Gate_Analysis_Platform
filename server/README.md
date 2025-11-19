# Server Setup - Registration Storage with Supabase

## ✅ What's Configured

The server is successfully initialized with:

- **Supabase Connection**: Connected to your Supabase project
- **Registration Endpoint**: `/api/register` endpoint ready to store user registrations
- **Express Server**: Running on port 5000

## 🗄️ Database Setup

### Step 1: Create the Users Table in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `omqrkkhdiugxknmihnap`
3. Navigate to **SQL Editor** in the left sidebar
4. Create a new query
5. Copy and paste the contents of `schema.sql` file
6. Click **Run** to execute the SQL script

This will create the `users` table with the following fields:

- `id` (UUID, Primary Key)
- `name` (Full name)
- `profile_name` (Username, unique)
- `email` (Email address, unique)
- `password` (Password - Note: Currently stored as plain text, should be hashed in production)
- `user_type` (student or teacher)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

## 🚀 Running the Server

```bash
# Navigate to server directory
cd server

# Install dependencies (if not already done)
npm install

# Start the server
npm start
# OR
node server.js
```

The server will start on `http://localhost:5000`

## 📡 API Endpoints

### 1. Health Check

```http
GET http://localhost:5000/api/health
```

**Response:**

```json
{
  "status": "OK",
  "message": "Server is running",
  "supabase": "Connected"
}
```

### 2. Register User

```http
POST http://localhost:5000/api/register
Content-Type: application/json

{
  "name": "John Doe",
  "profileName": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "userType": "student"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "uuid-here",
    "name": "John Doe",
    "profileName": "john_doe",
    "email": "john@example.com",
    "userType": "student"
  }
}
```

**Error Responses:**

- `400`: Missing fields or invalid profile name format
- `409`: Email or profile name already exists
- `500`: Server error

### 3. Login User

```http
POST http://localhost:5000/api/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "uuid-here",
    "name": "John Doe",
    "profileName": "john_doe",
    "email": "john@example.com",
    "userType": "student",
    "createdAt": "2025-11-19T..."
  }
}
```

**Error Responses:**

- `400`: Missing email or password
- `401`: Invalid email or password
- `500`: Server error

## 🔧 Environment Variables

The `.env` file contains:

```
supabase_url = https://omqrkkhdiugxknmihnap.supabase.co
supabase_key = [your-anon-key]
```

## 🔐 Security Notes

⚠️ **IMPORTANT for Production:**

1. **Password Hashing**: Currently passwords are stored as plain text. Before going to production, implement password hashing using bcrypt:

   ```bash
   npm install bcrypt
   ```

2. **Environment Variables**: Never commit `.env` file to version control

3. **CORS**: Update CORS settings in production to allow only your frontend domain

4. **Row Level Security**: The schema includes RLS policies for data protection

## 🧪 Testing the API

### Test Registration:

You can test registration with cURL:

```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "profileName": "test_user",
    "email": "test@example.com",
    "password": "password123",
    "userType": "student"
  }'
```

Or use the test script:

```bash
node test-registration.js
```

### Test Login:

You can test login with cURL:

```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Or use the test script:

```bash
node test-login.js
```

Or use Postman/Insomnia for easier testing.

## 🔗 Next Steps

1. ✅ Server is running
2. 📝 Create the `users` table in Supabase (see schema.sql)
3. 🧪 Test the registration endpoint
4. 🎨 Update your React frontend to connect to this API
5. 🔐 Implement password hashing before production

## 📞 Frontend Integration

Update your `RegisterForm.jsx`:

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch("http://localhost:5000/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formData.name,
        profileName: formData.profileName,
        email: formData.email,
        password: formData.password,
        userType: userType,
      }),
    });

    const data = await response.json();

    if (data.success) {
      toast.success(data.message);
      navigate("/login");
    } else {
      toast.error(data.message);
    }
  } catch (error) {
    toast.error("Registration failed. Please try again.");
  }
};
```
