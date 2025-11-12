import React, { useState } from "react";
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

function App() {
  // Mock user state (no authentication)
  const [user] = useState({ email: "demo@example.com", name: "Demo User" });
  const [userRole] = useState("student"); // Default role

  return (
    <>
      <Router>
        <Navigation user={user} userRole={userRole} />
        <div className="app-container">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/home" element={<Home user={user} />} />
            <Route path="/home2" element={<Home2 />} />
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
