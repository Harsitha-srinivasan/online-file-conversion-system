import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaSignOutAlt, FaHistory, FaFilePdf, FaHome, FaColumns, FaExchangeAlt, FaSun, FaMoon, FaFileInvoiceDollar } from 'react-icons/fa';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="glass-nav py-3 px-6 sticky top-0 z-50">
            <div className="container mx-auto flex items-center justify-between">
                <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 text-2xl font-bold">
                    <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/30">
                        <FaExchangeAlt />
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-pink-500">File<span className="font-extrabold">Convert</span></span>
                </Link>

                <div className="hidden md:flex items-center gap-8 text-[var(--text-muted)]">
                    {/* Only show Home link if NOT logged in */}
                    {!user && (
                        <NavLink to="/" className={({ isActive }) =>
                            `flex items-center gap-2 hover:text-[var(--text-main)] transition-colors ${isActive ? 'text-indigo-500 font-semibold' : ''}`
                        }>
                            <FaHome /> Home
                        </NavLink>
                    )}

                    {/* Show these only if logged in */}
                    {user && (
                        <>
                            <NavLink to="/dashboard" className={({ isActive }) =>
                                `flex items-center gap-2 hover:text-[var(--text-main)] transition-colors ${isActive ? 'text-indigo-500 font-semibold' : ''}`
                            }>
                                <FaColumns /> Dashboard
                            </NavLink>
                            <NavLink to="/txt-to-pdf" className={({ isActive }) =>
                                `flex items-center gap-2 hover:text-[var(--text-main)] transition-colors ${isActive ? 'text-indigo-500 font-semibold' : ''}`
                            }>
                                <FaFilePdf /> TXT → PDF
                            </NavLink>
                            <NavLink to="/history" className={({ isActive }) =>
                                `flex items-center gap-2 hover:text-[var(--text-main)] transition-colors ${isActive ? 'text-indigo-500 font-semibold' : ''}`
                            }>
                                <FaHistory /> History
                            </NavLink>
                            <NavLink to="/invoice-maker" className={({ isActive }) =>
                                `flex items-center gap-2 hover:text-[var(--text-main)] transition-colors ${isActive ? 'text-indigo-500 font-semibold' : ''}`
                            }>
                                <FaFileInvoiceDollar /> Invoice
                            </NavLink>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 bg-indigo-50/50 dark:bg-indigo-500/10 text-[var(--text-muted)] hover:text-indigo-500 rounded-xl transition-all border border-indigo-100 dark:border-indigo-500/20"
                        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        {theme === 'dark' ? <FaSun /> : <FaMoon />}
                    </button>

                    {user ? (
                        <>
                            <div className="flex items-center gap-2 bg-pink-50/50 dark:bg-pink-500/10 px-3 py-1.5 rounded-xl border border-pink-100 dark:border-pink-500/20">
                                <div className="w-6 h-6 bg-pink-500/20 text-pink-500 rounded-lg flex items-center justify-center text-[10px] font-black uppercase shadow-sm border border-pink-500/30">
                                    {user.username?.[0] || 'U'}
                                </div>
                                <span className="text-sm font-black text-pink-600 dark:text-pink-400 hide-mobile">@{user.username}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2.5 hover:bg-red-500/10 hover:text-red-500 text-[var(--text-muted)] rounded-xl transition-all border border-transparent hover:border-red-500/20"
                                title="Logout"
                            >
                                <FaSignOutAlt />
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                to="/login"
                                className="text-sm font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-indigo-500 px-4 py-2"
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="btn-primary py-2 px-6 text-xs"
                            >
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
