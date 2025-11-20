import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaHome, FaChartLine, FaBook, FaQuestionCircle, FaDatabase, FaSignOutAlt, FaComments, FaTrophy, FaPlus } from 'react-icons/fa';
import './Navigation.css';

const Navigation = ({ user, userRole = 'student', onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    // Clear user data from localStorage
    localStorage.removeItem('user');
    
    // Call the parent callback to refresh user state
    if (onLogout) {
      onLogout();
    }
    
    toast.success("Successfully logged out!");
    navigate("/login");
  };

  // Don't show navigation on landing, login, and register pages
  if (["/", "/login", "/register"].includes(location.pathname)) {
    return null;
  }

  const studentNavLinks = [
    { path: '/home', icon: <FaHome />, text: 'Home' },
    { path: '/dashboard', icon: <FaChartLine />, text: 'Dashboard' },
    { path: '/problems', icon: <FaDatabase />, text: 'Problems' },
    { path: '/quiz', icon: <FaQuestionCircle />, text: 'Quiz' },
    { path: '/contest', icon: <FaTrophy />, text: 'Contest' },
    { path: '/discuss', icon: <FaComments />, text: 'Discuss' }
  ];

  const teacherNavLinks = [
    { path: '/contest', icon: <FaTrophy />, text: 'Contest' },
    { path: '/testcreation', icon: <FaPlus />, text: 'Contest Create' },
    { path: '/discuss', icon: <FaComments />, text: 'Discuss' },
  ];

  return (
    <nav className="main-navigation">
      <div className="nav-container">
        <Link to={userRole === 'teacher' ? '/home2' : '/home'} className="nav-logo">
          BreakiT!
        </Link>

        <div className="nav-links">
          {(userRole === 'student' ? studentNavLinks : teacherNavLinks).map(link => (
            <Link 
              key={link.path}
              to={link.path} 
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.icon}
              <span>{link.text}</span>
            </Link>
          ))}
        </div>

        <div className="user-section">
          {user && (
            <>
              <div className="user-info">
                <div className="user-avatar-container">
                  <div className="user-avatar">
                    {user.name ? user.name[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U')}
                  </div>
                  <div className="custom-tooltip">{user.name || user.email || 'User'}</div>
                </div>
              </div>
              <button onClick={handleLogout} className="logout-button">
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
