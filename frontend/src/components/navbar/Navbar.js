import React from 'react';
import './navbar.css';
import { NavLink } from 'react-router-dom';

const Navbar = () => {
    return (
        <div className="navbar">
            <div className='nav-logo'>
                <NavLink to='/'><img className='logo' src='../sseicon.png' alt='logo' /></NavLink>
                <p>Landslide Jira Management Automation</p>
            </div>
            <ul className='nav-menu'>
                <li><NavLink exact to='/' activeClassName="active">Home</NavLink></li>
                <li><NavLink to='/automation' activeClassName="active">Automation</NavLink></li>
                <li><NavLink to='/manual' activeClassName="active">Manual</NavLink></li>
            </ul>
        </div>
    );
};

export default Navbar;