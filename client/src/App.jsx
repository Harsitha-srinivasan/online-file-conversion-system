import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import TxtToPdfPage from './pages/TxtToPdfPage';
import MergePDF from './pages/MergePDF';
import SplitPDF from './pages/SplitPDF';
import PdfToPpt from './pages/PdfToPpt';
import PptToPdf from './pages/PPTtoPdf';
import HistoryPage from './pages/HistoryPage';
import InvoiceMaker from './pages/InvoiceMaker';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';

const PrivateRoute = ({ children, adminOnly = false }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-indigo-600 rounded-full animate-pulse"></div>
                    </div>
                </div>
                <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Loading your secure space...</p>
            </div>
        );
    }
    
    if (!user) return <Navigate to="/login" replace />;
    if (adminOnly && user.role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
};

function App() {
    const { theme } = useTheme();
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
                <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" replace />} />
                <Route path="/" element={<Layout><Home /></Layout>} />

                {/* Private Routes */}
                <Route path="/dashboard" element={
                    <PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>
                } />
                <Route path="/txt-to-pdf" element={
                    <PrivateRoute><Layout><TxtToPdfPage /></Layout></PrivateRoute>
                } />
                <Route path="/merge-pdf" element={
                    <PrivateRoute><Layout><MergePDF /></Layout></PrivateRoute>
                } />
                <Route path="/split-pdf" element={
                    <PrivateRoute><Layout><SplitPDF /></Layout></PrivateRoute>
                } />
                <Route path="/ppt-to-pdf" element={
                    <PrivateRoute><Layout><PptToPdf /></Layout></PrivateRoute>
                } />
                <Route path="/pdf-to-ppt" element={
                    <PrivateRoute><Layout><PdfToPpt /></Layout></PrivateRoute>
                } />
                <Route path="/history" element={
                    <PrivateRoute><Layout><HistoryPage /></Layout></PrivateRoute>
                } />
                <Route path="/invoice-maker" element={
                    <PrivateRoute><Layout><InvoiceMaker /></Layout></PrivateRoute>
                } />
                <Route path="/admin" element={
                    <PrivateRoute adminOnly={true}><Layout><AdminDashboard /></Layout></PrivateRoute>
                } />

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <ToastContainer
                position="bottom-right"
                theme={theme}
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </>
    );
}

export default App;