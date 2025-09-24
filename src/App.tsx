import React, {type FC} from "react";
import './App.css';
import {FileText, Gavel, Home} from 'lucide-react';
import {BrowserRouter, Route, Routes, useLocation, useNavigate} from 'react-router-dom';
import SubmissionsPage from "./pages/SubmissionsPage.tsx";
import HomePage from "./pages/HomePage.tsx";
import JudgesPage from "./pages/JudgesPage.tsx";

const Layout: FC<{ children: React.ReactNode }> = ({children}) => {
    const navigate = useNavigate();
    const location = useLocation();

    const buttonSize: number = 20;

    return (
        <div className="app-container">
            <nav className="sidebar">
                <button
                    className={`nav-button home-button ${location.pathname === '/' ? 'active' : ''}`}
                    disabled={location.pathname === '/'}
                    onClick={() => navigate('/')}
                >
                    <Home size={buttonSize}/>
                </button>

                <button
                    className={`nav-button submissions-button ${location.pathname === '/submission' ? 'active' : ''}`}
                    disabled={location.pathname === '/submission'}
                    onClick={() => navigate('/submission')}
                >
                    <FileText size={buttonSize}/>
                </button>

                <button
                    className={`nav-button judge-button ${location.pathname === '/judge' ? 'active' : ''}`}
                    disabled={location.pathname === '/judge'}
                    onClick={() => navigate('/judge')}
                >
                    <Gavel size={buttonSize}/>
                </button>
            </nav>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

const App: FC = () => {
    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<HomePage/>}/>
                    <Route path="/submission" element={<SubmissionsPage/>}/>
                    <Route path="/judge" element={<JudgesPage/>}/>
                </Routes>
            </Layout>
        </BrowserRouter>
    );
};

export default App;
