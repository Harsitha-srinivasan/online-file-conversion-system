import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import TxtToPdfPage from './pages/TxtToPdfPage'; // To be created
import HistoryPage from './pages/HistoryPage'; // To be created
import Navbar from './components/Navbar';
import { useAuth } from './context/AuthContext';

const PrivateRoute = ({ children, adminOnly = false }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    if (adminOnly && user.role !== 'admin') {
        return <Navigate to="/dashboard" />;
    }
    return children;
};

// Layout component to include Navbar
const MainLayout = ({ children }) => (
    <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <main className="container mx-auto py-8 px-4">
            {children}
        </main>
    </div>
);

function App() {
    return (
        <>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Private Routes */}
                <Route path="/" element={
                    <PrivateRoute><MainLayout><Home /></MainLayout></PrivateRoute>
                } />
                <Route path="/dashboard" element={
                    <PrivateRoute><MainLayout><Dashboard /></MainLayout></PrivateRoute>
                } />
                <Route path="/txt-to-pdf" element={
                    <PrivateRoute><MainLayout><TxtToPdfPage /></MainLayout></PrivateRoute>
                } />
                <Route path="/history" element={
                    <PrivateRoute><MainLayout><HistoryPage /></MainLayout></PrivateRoute>
                } />
                <Route path="/admin" element={
                    <PrivateRoute adminOnly={true}><MainLayout><AdminDashboard /></MainLayout></PrivateRoute>
                } />

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <ToastContainer
                position="bottom-right"
                theme="dark"
                autoClose={3000}
            />
        </>
    );
}

export default App;
