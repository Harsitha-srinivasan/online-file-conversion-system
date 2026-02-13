import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';

const Register = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await register(formData.username, formData.email, formData.password);
        if (success) navigate('/dashboard');
    };

    return (
        <Layout>
            <div className="flex justify-center items-center min-h-[80vh]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-8 rounded-2xl w-full max-w-md"
                >
                    <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Create Account
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-300">Username</label>
                            <input
                                type="text"
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition"
                                placeholder="johndoe"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-300">Email Address</label>
                            <input
                                type="email"
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-300">Password</label>
                            <input
                                type="password"
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 font-bold py-3 rounded-lg transition shadow-lg shadow-purple-500/20"
                        >
                            Sign Up
                        </button>
                    </form>
                    <p className="mt-6 text-center text-slate-400">
                        Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
                    </p>
                </motion.div>
            </div>
        </Layout>
    );
};

export default Register;
