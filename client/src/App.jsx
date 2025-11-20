import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LandingPage from "./LandingPage";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import Home from "./Home";
import Discuss from "./Discuss";
import Dashboard from "./components/Dashboard/Dashboard";
import Quiz from "./components/Quiz/Quiz";
import Navigation from "./components/Navigation/Navigation";
import Problems from "./components/Problems/Problems";
import TestRoom from "./components/TestRoom/TestRoom";
import Contest from "./components/Contest/Contest";
import TestPage from "./components/TestPage/TestPage";
import TestCreation from "./components/TestCreation/TestCreation";
import Home2 from "./Home2";
import Home3 from "./Home3";

function App() {
  // Get user from localStorage (set during login)
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setUserRole(userData.userType);
    }
  }, []);

  // Function to update user state (can be used after logout)
  const refreshUser = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setUserRole(userData.userType);
    } else {
      setUser(null);
      setUserRole(null);
    }
  };

  return (
    <>
      <Router>
        <Navigation user={user} userRole={userRole} onLogout={refreshUser} />
        <div className="app-container">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginForm onLogin={refreshUser} />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/home" element={<Home user={user} />} />
            <Route path="/home2" element={<Home2 user={user} />} />
            <Route path="/home3" element={<Home3 user={user} />} />
            <Route path="/problems" element={<Problems />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/discuss" element={<Discuss />} />
            <Route path="/testcreation" element={<TestCreation />} />
            <Route path="/contest" element={<Contest />} />
            <Route path="/test-room" element={<TestRoom />} />
            <Route path="/test/:id" element={<TestRoom />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
        <ToastContainer position="bottom-right" />
      </Router>
    </>
  );
}

export default App;
