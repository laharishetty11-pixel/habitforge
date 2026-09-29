import React from "react";

function SplashScreen({ fadeOut }) {
  return (
    <div className={`splash-screen ${fadeOut ? "fade-out" : ""}`}>
      <div className="splash-logo">🌱 HabitForge</div>
      <div className="splash-tagline">Build better habits together</div>
      <div className="splash-spinner"></div>
    </div>
  );
}

export default SplashScreen;