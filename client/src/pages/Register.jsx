import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaUserPlus, FaExchangeAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const { register } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match"); // Replace with toast if available
            return;
        }
        setLoading(true);
        const success = await register(formData.username, formData.email, formData.password);
        setLoading(false);
        if (success) navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full -z-10">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[100px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-10">
                    <Link to="/" className="inline-flex items-center gap-3 text-3xl font-black mb-6 group">
                        <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-xl shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                            <FaExchangeAlt />
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-pink-500">File<span className="font-extrabold">Convert</span></span>
                    </Link>
                    <h2 className="text-2xl font-black text-[var(--text-main)]">Create Account</h2>
                    <p className="text-[var(--text-muted)] mt-2 font-medium">Join us for limitless conversions</p>
                </div>

                <div className="glass-card p-10 rounded-[40px] shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2 block px-1">Username</label>
                            <div className="relative group">
                                <FaUser className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-transparent border border-[var(--border-color)] rounded-2xl py-3.5 pl-14 pr-6 text-[var(--text-main)] outline-none focus:border-indigo-500 transition-all font-bold hover:border-indigo-400/30"
                                    placeholder="johndoe"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2 block px-1">Email Address</label>
                            <div className="relative group">
                                <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-transparent border border-[var(--border-color)] rounded-2xl py-3.5 pl-14 pr-6 text-[var(--text-main)] outline-none focus:border-indigo-500 transition-all font-bold hover:border-indigo-400/30"
                                    placeholder="name@company.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2 block px-1">Password</label>
                            <div className="relative group">
                                <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-transparent border border-[var(--border-color)] rounded-2xl py-3.5 pl-14 pr-6 text-[var(--text-main)] outline-none focus:border-indigo-500 transition-all font-bold hover:border-indigo-400/30"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="mb-2">
                            <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2 block px-1">Confirm Password</label>
                            <div className="relative group">
                                <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-transparent border border-[var(--border-color)] rounded-2xl py-3.5 pl-14 pr-6 text-[var(--text-main)] outline-none focus:border-indigo-500 transition-all font-bold hover:border-indigo-400/30"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary !py-4 flex items-center justify-center gap-3 mt-6"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FaUserPlus />}
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-[var(--text-muted)] text-sm font-bold">
                            Already have an account? {' '}
                            <Link to="/login" className="text-indigo-500 hover:text-indigo-600 transition-colors">Sign in</Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
