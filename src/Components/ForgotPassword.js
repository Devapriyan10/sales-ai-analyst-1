import React, { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setError('');  // Clear any previous error
    setMessage('');  // Clear any previous message
  };

  const handleResetPassword = async () => {
    const auth = getAuth();
    
    try {
      // Send the password reset email
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent. Please check your inbox.');
      setError('');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email. Please enter a registered email.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address. Please enter a valid email.');
      } else {
        setError('Error resetting password. Please try again later.');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      handleResetPassword();
    } else {
      setError('Please enter your email.');
    }
  };

  return (
    <div className='main'>
    <div className="forgot-password-container">
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Enter your registered email"
            required
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}
        <button type="submit">Send Reset Email</button>
      </form>
      <button onClick={() => navigate('/login')}>Back to Login</button>
    </div>
    </div>
  );
}

export default ForgotPassword;
