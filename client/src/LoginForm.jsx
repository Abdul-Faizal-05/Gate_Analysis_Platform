import React, { useState } from "react";
import { FaUser, FaLock, FaEnvelope } from "react-icons/fa";
import "./Login.css"; // Import styles
import { signInWithEmailAndPassword } from "firebase/auth";
import {auth} from "./firebase";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
  const [userType, setUserType] = useState("student");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const navigate = useNavigate();

  const handleDropdownToggle = (open) => {
    setIsDropdownOpen(open);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try{
      const email = formData.email;
      const password = formData.password;
      await signInWithEmailAndPassword(auth,email,password);
      console.log("User login successfully");
      toast.success("user login successfully");
      navigate("/home");
    }
    catch(error){
      toast.warning(error.message);
    }
  };

  const handleForgotPassword = async () => {
    const email = prompt('Enter your email:');
    const newPassword = prompt('Enter your new password:');
    if (email && newPassword) {
      try {
        // Sign in the user to get the current user
        const userCredential = await auth.signInWithEmailAndPassword(email, prompt('Enter your current password:'));
        const user = userCredential.user;
        // Update password in Firebase
        await user.updatePassword(newPassword);
        alert('Password updated successfully!');
      } catch (error) {
        alert('Error updating password: ' + error.message);
      }
    } else {
      alert('Email and password must be provided.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login</h2>

        {/* Login Form */}
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

          {/* Forgot Password Link */}
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
