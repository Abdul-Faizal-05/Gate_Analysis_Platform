import React, { useState } from "react";
import { FaLock, FaEnvelope } from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "./Login.css"; // Import styles

const LoginForm = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission (Login)
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Frontend-only validation
    if (formData.email && formData.password) {
      toast.success("Login successful! (Frontend only)");
      navigate("/home"); // Redirect to homepage
    } else {
      toast.error("Please fill in all fields");
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
