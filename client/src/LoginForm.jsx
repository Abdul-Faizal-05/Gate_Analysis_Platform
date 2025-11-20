import React, { useState } from "react";
import { FaLock, FaEnvelope } from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "./Login.css"; // Import styles

const LoginForm = ({ onLogin }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission (Login)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (data.success) {
        // Store user data in localStorage for session management
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userType', data.user.userType);

        // Call the parent callback to refresh user state
        if (onLogin) {
          onLogin();
        }

        toast.success(data.message);

        // Navigate based on user role
        if (data.user.userType === 'teacher') {
          navigate("/home2"); // Teacher dashboard
        }
        if (data.user.userType === 'admin') {
          navigate("/home3"); // Admin dashboard
        }
        else {
          navigate("/home"); // Student dashboard
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please check if the server is running.");
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async () => {
    const email = prompt("Enter your registered email:");
    if (email) {
      toast.info("Password reset feature is frontend-only (no backend)");
    } else {
      toast.warning("Please enter a valid email.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login</h2>

        <form className="login-form" onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="input-group">
            <FaEnvelope className="icon" />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password Field */}
          <div className="input-group">
            <FaLock className="icon" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Forgot Password */}
          <p className="forgot-password">
            <a href="#" onClick={handleForgotPassword}>Forgot Password?</a>
          </p>

          {/* Login Button */}
          <button className="login-button" type="submit">Login</button>
        </form>

        {/* Signup Link */}
        <p className="signup-link">
          Don't have an account? <a href="/register">Sign up</a>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
