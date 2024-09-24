import React, { useState } from 'react';
import Homecontent from './Homecontent';
import Chatbot from './Chatbot';
import Profile from './Profile';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { faBoxes, faChartLine, faClipboardList, faComments, faHome, faInfoCircle, faTags, faUser } from '@fortawesome/free-solid-svg-icons';
import SalesAnalysis from './SalesAnalysis';
import CategoricalAnalysis from './CategoricalAnalysis';
import InventoryAnalysis from './InventoryAnalysis';
import ProductAnalysis from './ProductAnalysis';
import AboutUs from './AboutUs';
import './style/style.css'
import './style/home.css'
const Mainhome = () => {
    const [activeComponent, setActiveComponent] = useState('Home');
    const [showProfile, setShowProfile] = useState(false);
    const handleProfileClick = () => {
        setShowProfile(!showProfile);  // Toggle profile component visibility
    };
    const renderContent = () => {
        switch (activeComponent) {
            case 'Home':
                return <Homecontent />;
            case 'Chatbot':
                return <Chatbot />;
            case 'profile':
                return <Profile />;
            case 'Sales Analysis':
                return <SalesAnalysis />;
            case 'Categorical Analysis':
                return <CategoricalAnalysis />;
            case 'Inventory Analysis':
                return <InventoryAnalysis />;
            case 'Product Analysis':
                return <ProductAnalysis />;
            case 'About Us':
                return <AboutUs />;
            default:
                return <Homecontent />;
        }
    };

    return (
        <div className="home" >
            <nav className='sidebar' >
                <h2>Sales-AI-Analyst</h2>
                <ul>
                    <p onClick={() => setActiveComponent('Home')}>
                        <FontAwesomeIcon icon={faHome} /> Home
                    </p>
                    <p onClick={() => setActiveComponent('Chatbot')}>
                        <FontAwesomeIcon icon={faComments} /> Chatbot
                    </p>
                    <p onClick={() => setActiveComponent('Sales Analysis')}>
                        <FontAwesomeIcon icon={faChartLine} /> Sales Analysis
                    </p>
                    <p onClick={() => setActiveComponent('Categorical Analysis')}>
                        <FontAwesomeIcon icon={faTags} /> Categorical Analysis
                    </p>
                    <p onClick={() => setActiveComponent('Inventory Analysis')}>
                        <FontAwesomeIcon icon={faBoxes} /> Inventory Analysis
                    </p>
                    <p onClick={() => setActiveComponent('Product Analysis')}>
                        <FontAwesomeIcon icon={faClipboardList} /> Product Analysis
                    </p>
                    <p onClick={() => setActiveComponent('About Us')}>
                        <FontAwesomeIcon icon={faInfoCircle} /> About Us
                    </p>
                </ul>
            </nav>

            <div className="main-content" >
                <div className="header">
                    <h1>{activeComponent}</h1>
                </div>
                {renderContent()}
            </div>

            <div className="extra-content">
                <div className='profileicon'
                    onMouseOver={handleProfileClick}
                >
                    <FontAwesomeIcon icon={faUser} style={{ cursor: 'pointer', width: '30px', height: '30px', marginLeft: '5px', marginTop: '5px' }} />
                </div>
                {showProfile && (
                    <div style={{ position: 'relative', zIndex: 1000 }}>
                        <Profile closeProfile={() => setShowProfile(false)} /> {/* Pass close function */}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Mainhome;
