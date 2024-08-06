import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import Navbar from './components/navbar/Navbar';
import Home from './pages/Home';
import Automation from './pages/Automation';
import Manual from './pages/Manual';

const App = () => {
    return (
        <div className='App'>
        <BrowserRouter>
            <Navbar />
            <Routes>
                <Route path='/' element={<Home />} />   
                <Route path='/automation' element={<Automation />} />         
                <Route path='/manual' element={<Manual />} />                  
            </Routes>
        /</BrowserRouter>
        </div>
    );
};

export default App;

