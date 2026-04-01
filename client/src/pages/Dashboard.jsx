import { useState, useEffect } from 'react';
import FileUpload from '../components/FileUpload';
import FileItem from '../components/FileItem';
import api from '../services/api';
import { motion } from 'framer-motion';
import { FaBoxes, FaCloudUploadAlt, FaHistory } from 'react-icons/fa';

const Dashboard = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchFiles = async () => {
        try {
            const res = await api.get('/files');
            setFiles(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    return (
        <div className="max-w-5xl mx-auto px-4 pb-20">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 pt-8 flex flex-col md:flex-row md:items-end justify-between gap-6"
            >
                <div>
                    <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight text-[var(--text-main)]">Workspace</h1>
                    <p className="text-[var(--text-muted)] text-lg max-w-xl">Upload, manage, and convert your documents with our high-precision system.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-indigo-500/5 border border-indigo-500/10 px-6 py-3 rounded-2xl">
                        <span className="text-xs font-black uppercase tracking-widest text-indigo-500 block mb-1">Total Files</span>
                        <span className="text-2xl font-black text-[var(--text-main)] leading-none">{files.length}</span>
                    </div>
                </div>
            </motion.div>

            {/* Upload Area */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-16"
            >
                <FileUpload onUploadSuccess={fetchFiles} />
            </motion.div>

            {/* Files List */}
            <div>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black flex items-center gap-3">
                        <div className="bg-pink-500/10 p-2 rounded-xl text-pink-500 text-xl">
                            <FaBoxes />
                        </div>
                        Recent Uploads
                    </h2>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
                        <p className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-xs">Loading files...</p>
                    </div>
                ) : files.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-24 glass-card rounded-[40px] border-dashed border-2 flex flex-col items-center gap-6"
                    >
                        <div className="w-24 h-24 bg-indigo-50/50 dark:bg-indigo-500/10 flex items-center justify-center rounded-full text-indigo-400 dark:text-indigo-300 text-4xl border border-indigo-100/50 dark:border-indigo-500/10">
                            <FaCloudUploadAlt />
                        </div>
                        <div>
                            <p className="text-xl font-black text-[var(--text-main)] mb-2">Workspace is Empty</p>
                            <p className="text-[var(--text-muted)]">Upload your first file to see it here!</p>
                        </div>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {files.map((file, index) => (
                            <motion.div
                                key={file._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <FileItem file={file} onUpdate={fetchFiles} />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
