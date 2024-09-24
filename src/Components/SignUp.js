import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import './Auth.css';

function SignUp() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  const getErrorMessage = (error) => {
    if (error.response) {
      return `Server responded with status code ${error.response.status}: ${error.response.data.message || error.response.data}`;
    } else if (error.request) {
      console.error('Error request:', error.request);
      return 'No response received from the server. Please try again later.';
    } else {
      console.error('Error message:', error.message);
      return `Network Error: ${error.message}`;
    }
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const isValidLength = password.length >= minLength;
    const isCommonPattern = /password|1234|qwerty|abcd/.test(password.toLowerCase());

    if (!isValidLength) return 'Password must be at least 8 characters long.';
    if (!hasUpperCase) return 'Password must contain at least one uppercase letter.';
    if (!hasLowerCase) return 'Password must contain at least one lowercase letter.';
    if (!hasNumber) return 'Password must contain at least one number.';
    if (isCommonPattern) return 'Password should not contain common words or easily guessed patterns.';
    return '';
  };

  const validatePhoneNumber = (phoneNumber) => {
    const phonePattern = /^\d{10}$/;
    return phonePattern.test(phoneNumber) ? '' : 'Phone number must be exactly 10 digits long.';
  };

  const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email) ? '' : 'Please enter a valid email address.';
  };

  const validateName = (name) => {
    const namePattern = /^[A-Za-z]+$/;
    return namePattern.test(name) ? '' : 'Name should contain only alphabets.';
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    const newErrors = {};

    const firstNameError = validateName(firstName);
    if (firstNameError) newErrors.firstName = firstNameError;

    const lastNameError = validateName(lastName);
    if (lastNameError) newErrors.lastName = lastNameError;

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    const phoneNumberError = validatePhoneNumber(phoneNumber);
    if (phoneNumberError) newErrors.phoneNumber = phoneNumberError;

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/signup', {
        firstName,
        lastName,
        phoneNumber,
        email,
        password,
      });

      if (response.data.success) {
        setErrors({ general: 'You have signed up successfully' });
      } else {
        setErrors({ general: 'Signup failed' });
      }
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = getErrorMessage(error);

      if (error.response && error.response.data.field === 'phoneNumber') {
        setErrors({ phoneNumber: error.response.data.message });
      } else if (error.response && error.response.data.field === 'email') {
        setErrors({ email: error.response.data.message });
      } else {
        setErrors({ general: `An error occurred during signup: ${errorMessage}` });
      }
    }
  };

  return (
    <div className="main">
    <div className="auth-page">
      <h2>Sign Up</h2>
      <form onSubmit={handleSignUp}>
        <div>
          <label>First Name</label>
          <input
            type="text"
            name="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          {errors.firstName && <p className="error-message">{errors.firstName}</p>}
        </div>
        <div>
          <label>Last Name</label>
          <input
            type="text"
            name="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          {errors.lastName && <p className="error-message">{errors.lastName}</p>}
        </div>
        <div>
          <label>Phone Number</label>
          <input
            type="tel"
            name="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
          {errors.phoneNumber && <p className="error-message">{errors.phoneNumber}</p>}
        </div>
        <div>
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {errors.email && <p className="error-message">{errors.email}</p>}
        </div>
        <div>
          <label>Password</label>
          <div className="password-input-container">
            <input
              type={passwordVisible ? 'text' : 'password'}
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="toggle-password-btn"
            >
              <FontAwesomeIcon icon={passwordVisible ? faEyeSlash : faEye} />
            </button>
          </div>
          {errors.password && <p className="error-message">{errors.password}</p>}
        </div>
        <div>
          <label>Confirm Password</label>
          <div className="password-input-container">
            <input
              type={confirmPasswordVisible ? 'text' : 'password'}
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              className="toggle-password-btn"
            >
              <FontAwesomeIcon icon={confirmPasswordVisible ? faEyeSlash : faEye} />
            </button>
            </div>
          {errors.password && <p className="error-message">{errors.password}</p>}
        </div>
        
        <button type="submit">Sign Up</button>
      </form>
      {errors.general && <p className="error-message">{errors.general}</p>}
    </div></div>
  );
}

export default SignUp;  
         
