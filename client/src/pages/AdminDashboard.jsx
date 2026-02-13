import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { motion } from 'framer-motion';
import { FaUsers, FaFileAlt, FaHdd } from 'react-icons/fa';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/stats');
                setStats(res.data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

                {loading ? (
                    <p>Loading stats...</p>
                ) : stats ? (
                    <div className="grid md:grid-cols-3 gap-6">
                        <StatsCard
                            icon={<FaUsers />}
                            title="Total Users"
                            value={stats.users}
                            color="text-blue-400"
                        />
                        <StatsCard
                            icon={<FaFileAlt />}
                            title="Total Files"
                            value={stats.files}
                            color="text-green-400"
                        />
                        <StatsCard
                            icon={<FaHdd />}
                            title="Storage Used"
                            value={`${(stats.totalSizeBytes / 1024 / 1024).toFixed(2)} MB`}
                            color="text-purple-400"
                        />
                    </div>
                ) : (
                    <p className="text-red-400">Failed to load stats.</p>
                )}
            </div>
        </Layout>
    );
};

const StatsCard = ({ icon, title, value, color }) => (
    <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card p-6 rounded-xl flex items-center gap-4"
    >
        <div className={`text-3xl ${color} bg-slate-800 p-4 rounded-full`}>
            {icon}
        </div>
        <div>
            <h3 className="text-slate-400 text-sm uppercase font-bold">{title}</h3>
            <p className="text-3xl font-bold">{value}</p>
        </div>
    </motion.div>
);

export default AdminDashboard;
