import React from 'react';
import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div className='main'>
    <div className="landing-page">
      <h1>Welcome to Sales AI Analyst</h1>
      <div>
        <Link to="/login" className="btn">Login</Link>
        <Link to="/signup" className="btn">Sign Up</Link>
      </div>
    </div>
    </div>
  );
}

export default LandingPage;
