import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import "./Register.css";

const RegisterForm = () => {
  const [userType, setUserType] = useState("student");
  const [formData, setFormData] = useState({ name: "", profileName: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDropdownToggle = (open) => {
    setIsDropdownOpen(open);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, profileName, email, password } = formData;

    // Frontend validation for profile name
    const profileNameRegex = /^[a-zA-Z0-9_]+$/;
    if (!profileNameRegex.test(profileName)) {
      toast.warning("Profile name must contain only letters, numbers, and underscores.");
      return;
    }

    // Basic validation
    if (!name || !profileName || !email || !password) {
      toast.warning("Please fill in all fields");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          profileName: formData.profileName,
          email: formData.email,
          password: formData.password,
          userType: userType
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        navigate("/login");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Registration failed. Please check if the server is running.");
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Register</h2>
        <form className="register-form" onSubmit={handleSubmit}>
          
          {/* User Role Selection */}
                    <div 
                      className={`role-dropdown-container ${isDropdownOpen ? "expanded" : ""}`} 
                    >
                      <label className="role-label">
                        <FaUser className="icon" /> Select Role:
                        <select 
                          value={userType} 
                          onChange={(e) => setUserType(e.target.value)} 
                          onFocus={() => handleDropdownToggle(true)}
                          onBlur={() => handleDropdownToggle(false)}
                          className="role-dropdown"
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                        </select>
                      </label>
                    </div>

          {/* Name Field */}
          <div className="input-group">
            <FaUser className="icon" />
            <input 
              type="text" 
              name="name" 
              placeholder="Full Name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
            />
          </div>

          {/* Profile Name Field */}
          <div className="input-group">
            <FaUser className="icon" />
              <input 
                type="text" 
                name="profileName" 
                placeholder="User Name" 
                value={formData.profileName} 
                onChange={handleChange} 
                autoComplete="off"
                required 
              />
          </div>

          {/* Email Field */}
          <div className="input-group">
            <FaEnvelope className="icon" />
            <input 
              type="email" 
              name="email" 
              placeholder="Email Address" 
              value={formData.email} 
              onChange={handleChange}
              autoComplete="off" 
              required 
            />
          </div>

          {/* Password Field */}
          <div className="input-group">
            <FaLock className="icon" />
            <input 
              type={showPassword ? "text" : "password"} 
              name="password" 
              placeholder="Password" 
              value={formData.password} 
              onChange={handleChange} 
              autoComplete="off"
              required 
            />
            <span 
              className="toggle-password" 
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "👁️" : "🔒"}
            </span>
          </div>

          {/* Register Button */}
          <button type="submit" className="register-button">Register</button>

          {/* Already have an account? */}
          <p className="login-link">Already have an account? <a href="/login">Login</a></p>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
