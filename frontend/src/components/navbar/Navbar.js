import React, { useState } from 'react'
import './navbar.css'
import { Link, useNavigate } from 'react-router-dom'

const Navbar = () => {
    return (
        <div className="navbar">
            <div className='nav-logo'>
                <Link to='/'><img className='logo' src='../sseicon.png' alt='logo' /></Link>
                <p>Landslide Jira Management Automation</p>
            </div>
            <ul className='nav-menu'>
                <li><Link style={{ textDecoration: 'none', color: 'black' }} to='/'>Home</Link></li>
                <li><Link style={{ textDecoration: 'none', color: 'black' }} to='/automation'>Automation</Link></li>
                <li><Link style={{ textDecoration: 'none', color: 'black' }} to='/manual'>Manual</Link></li>
            </ul>
        </div>
        
    );
};

export default Navbar;