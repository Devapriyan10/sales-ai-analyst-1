import React, { useEffect, useState } from 'react';
import '../home.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faSignOutAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAccountDetailsOpen, setIsAccountDetailsOpen] = useState(false);
  const [userDetails, setUserDetails] = useState({});

  useEffect(() => {
    const fetchUserDetails = async () => {
      const email = localStorage.getItem('userEmail');
      try {
        const response = await fetch(`/api/users/${email}`);
        if (response.ok) {
          const user = await response.json();
          setUserDetails(user);
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchUserDetails();
  }, []);

  const renderAccountDetailsForm = () => (
    <div className="account-details">
      <div className="back-button" onClick={() => setIsAccountDetailsOpen(false)}>
        <FontAwesomeIcon icon={faChevronLeft} /> Back
      </div>
      <h3>Account Details</h3>
      <form onSubmit={handleSaveDetails}>
        <label>
          Full Name:
          <input
            type="text"
            name="name"
            value={userDetails.name || ''}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Phone Number:
          <input
            type="tel"
            name="phone"
            value={userDetails.phone || ''}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Email Address:
          <input
            type="email"
            name="email"
            value={userDetails.email || ''}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Shop Name:
          <input
            type="text"
            name="shopName"
            value={userDetails.shopName || ''}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Shop Address:
          <input
            type="text"
            name="address"
            value={userDetails.address || ''}
            onChange={handleInputChange}
          />
        </label>
        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={() => setIsAccountDetailsOpen(false)}>
            Cancel
          </button>
          <button type="submit">Update</button>
        </div>
      </form>
    </div>
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserDetails({ ...userDetails, [name]: value });
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/account-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userDetails),
      });
      if (response.ok) {
        const updatedUser = await response.json();
        setUserDetails(updatedUser);
        setIsAccountDetailsOpen(false);
      } else {
        console.error('Error saving account details');
      }
    } catch (error) {
      console.error('Error saving account details:', error);
    }
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    navigate('/');
  };


  return (
  <>
  <div> Profile Page</div>;
  <div className="extra-content">
        <div className="profile-icon" onClick={toggleProfileMenu}>
          <FontAwesomeIcon icon={faUser} />
        </div>
        {isProfileMenuOpen && (
          <div className="profile-menu">
            <div className="user-name">Hi! {userDetails.name}</div>
            
            <div
              className="manage-account-btn"
              onClick={() => {
                setIsAccountDetailsOpen(true);
                setIsProfileMenuOpen(false);
              }}
            >
              Manage Account
            </div>
            <div className="profile-options">
              <div className="option" onClick={handleLogout}>
                <FontAwesomeIcon icon={faSignOutAlt} /> Logout
              </div>
            </div>
          </div>
        )}
        {isAccountDetailsOpen && renderAccountDetailsForm()}
      </div>
      </>)
};

export default Profile;
