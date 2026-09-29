import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));

  // Re-check login state on page changes, on login/logout, and when
  // another browser tab logs in or out
  useEffect(() => {
    const sync = () => setLoggedIn(!!localStorage.getItem("token"));
    sync();

    window.addEventListener("auth-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("auth-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-change"));
    navigate("/login");
  };

  const linkClass = ({ isActive }) => (isActive ? "active" : "");

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand">
        🌱 HabitForge
      </NavLink>
      <ul className="navbar-links">
        <li><NavLink to="/" end className={linkClass}>Home</NavLink></li>

        {loggedIn ? (
          <>
            <li><NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink></li>
            <li><NavLink to="/habits" className={linkClass}>Habits</NavLink></li>
            <li><NavLink to="/groups" className={linkClass}>Groups</NavLink></li>
            <li><NavLink to="/profile" className={linkClass}>Profile</NavLink></li>
            <li>
              <button onClick={handleLogout} className="navbar-logout-btn">
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li><NavLink to="/login" className={linkClass}>Login</NavLink></li>
            <li><NavLink to="/register" className={linkClass}>Register</NavLink></li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;