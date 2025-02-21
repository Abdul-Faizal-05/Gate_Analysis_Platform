import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LandingPage from "./LandingPage";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import Home from "./Home";
import { auth, db} from "./firebase";
import Discuss from "./Discuss";
import Dashboard from "./components/Dashboard/Dashboard";
import Quiz from "./components/Quiz/Quiz";
import Navigation from "./components/Navigation/Navigation";
import Problems from "./components/Problems/Problems";
import TestRoom from "./components/TestRoom/TestRoom";
import Contest from "./components/Contest/Contest";
import TestPage from "./components/TestPage/TestPage"; // Import TestPage component
import TestCreation from "./components/TestCreation/TestCreation";
import Home2 from "./home2";
import { doc, getDoc } from "firebase/firestore"; 
import { initializeDatabase } from "./utils/initializeDB";

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);

      if (user) {
        try {
          let role = null;

          // Check if user exists in Students collection
          const studentDoc = await getDoc(doc(db, "Students", user.uid));
          if (studentDoc.exists()) {
            role = "student";
          } else {
            // If not found in Students, check in Teachers collection
            const teacherDoc = await getDoc(doc(db, "Teachers", user.uid));
            if (teacherDoc.exists()) {
              role = "teacher";
            }
          }

          if (role) {
            setUserRole(role);
            await initializeDatabase();
          } else {
            toast.error("User role not found. Please contact support.");
          }
        } catch (error) {
          console.error("Failed to fetch user role:", error);
          toast.error("Error fetching user role.");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Router>
        <Navigation user={user} />
        <div className="app-container">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route 
              path="/login" 
              element={user ? <Navigate to={userRole === "teacher" ? "/home2" : "/home"} /> : <LoginForm />} 
            />
            <Route 
              path="/register" 
              element={user ? <Navigate to={userRole === "teacher" ? "/home2" : "/home"} /> : <RegisterForm />} 
            />
            <Route 
              path="/home" 
              element={user && userRole === "student" ? <Home /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/home2" 
              element={user && userRole === "teacher" ? <Home2 /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/problems" 
              element={user ? <Problems /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/quiz" 
              element={user ? <Quiz /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/dashboard" 
              element={user ? <Dashboard /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/discuss" 
              element={user ? <Discuss /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/testcreation" 
              element={user ? <TestCreation /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/contest" 
              element={user ? <Contest /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/test-room" 
              element={user ? <TestRoom /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/test/:id" 
              element={user ? <TestRoom /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/test" 
              element={user ? <TestPage /> : <Navigate to="/login" />} 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
        <ToastContainer position="bottom-right" />
      </Router>
    </>
  );
}

export default App;
