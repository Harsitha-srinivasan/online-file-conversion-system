import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaSignOutAlt, FaHistory, FaFilePdf, FaHome, FaColumns, FaExchangeAlt } from 'react-icons/fa';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <nav className="bg-slate-900 border-b border-slate-800 py-3 px-6 sticky top-0 z-50">
            <div className="container mx-auto flex items-center justify-between">
                <Link to="/dashboard" className="flex items-center gap-2 text-2xl font-bold text-white">
                    <div className="bg-primary p-2 rounded-lg">
                        <FaExchangeAlt />
                    </div>
                    <span>File<span className="text-secondary">Convert</span></span>
                </Link>

                <div className="hidden md:flex items-center gap-8 text-slate-300">
                    <NavLink to="/" className={({ isActive }) =>
                        `flex items-center gap-2 hover:text-white transition ${isActive ? 'text-primary font-semibold' : ''}`
                    }>
                        <FaHome /> Home
                    </NavLink>
                    <NavLink to="/dashboard" className={({ isActive }) =>
                        `flex items-center gap-2 hover:text-white transition ${isActive ? 'text-primary font-semibold' : ''}`
                    }>
                        <FaColumns /> Dashboard
                    </NavLink>
                    <NavLink to="/txt-to-pdf" className={({ isActive }) =>
                        `flex items-center gap-2 hover:text-white transition ${isActive ? 'text-primary font-semibold' : ''}`
                    }>
                        <FaFilePdf /> TXT → PDF
                    </NavLink>
                    <NavLink to="/history" className={({ isActive }) =>
                        `flex items-center gap-2 hover:text-white transition ${isActive ? 'text-primary font-semibold' : ''}`
                    }>
                        <FaHistory /> History
                    </NavLink>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                        <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase">
                            {user.username?.[0] || 'U'}
                        </div>
                        <span className="text-sm text-slate-300 font-medium">@{user.username}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 hover:bg-red-500/10 hover:text-red-500 text-slate-400 rounded-lg transition"
                        title="Logout"
                    >
                        <FaSignOutAlt />
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
