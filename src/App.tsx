import React, {type FC} from "react";
import './App.css';
import {FileText, Gavel, Home, LogOut} from 'lucide-react';
import {
    BrowserRouter,
    type Location,
    type NavigateFunction,
    Route,
    Routes,
    useLocation,
    useNavigate
} from 'react-router-dom';
import SubmissionsPage from "./pages/SubmissionsPage.tsx";
import HomePage from "./pages/HomePage.tsx";
import JudgesPage from "./pages/JudgesPage.tsx";
import {AuthProvider} from "./lib/AuthProvider.tsx";
import {useAuth} from "./hooks/useAuth.ts";
import {AuthForm} from "./auth/AuthForm.tsx";

const Layout: FC<{ children: React.ReactNode }> = ({children}) => {
    const navigate: NavigateFunction = useNavigate();
    const location: Location = useLocation();
    const {logout} = useAuth();

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

                <button className="nav-button logout-button" onClick={async () => {
                    await logout();
                    navigate('/');
                }}>
                    <LogOut size={buttonSize}/>
                </button>
            </nav>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

const AppRoutes: FC = () => {
    const {user} = useAuth();

    if (!user) {
        return <AuthForm/>;
    }
    
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<HomePage/>}/>
                <Route path="/submission" element={<SubmissionsPage/>}/>
                <Route path="/judge" element={<JudgesPage/>}/>
            </Routes>
        </Layout>
    );
}

const App: FC = () => {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes/>
            </BrowserRouter>
        </AuthProvider>
    );
};

export default App;
