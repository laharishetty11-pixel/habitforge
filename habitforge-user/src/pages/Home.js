import { Link } from "react-router-dom";
// ^ optional: download a scene from https://undraw.co/illustrations (try "habit" or "goals"),
//   recolor it to #10b981, and save it at this path. If you skip this, remove the
//   <div className="hero-image">...</div> block below and the import line.

function Home() {
  return (
    <div className="hero hero-bg">
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title">
            Welcome to <span>HabitForge</span>
          </h1>
          <p className="hero-subtitle">
            Build better habits together — track your progress, join groups,
            and stay accountable with people who share your goals.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary">Get Started</Link>
            <Link to="/login" className="btn btn-outline">Login</Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Home;