import { useState, useEffect } from 'react';
import FileUpload from '../components/FileUpload';
import FileItem from '../components/FileItem';
import api from '../services/api';
import { motion } from 'framer-motion';

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
        <div className="max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-1">My Files</h1>
                        <p className="text-slate-400">Manage and convert your uploaded documents.</p>
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-12"
            >
                <FileUpload onUploadSuccess={fetchFiles} />
            </motion.div>

            <div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <span className="w-2 h-8 bg-primary rounded-full"></span>
                    Recent Uploads
                </h2>
                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="w-8 h-8 border-4 border-slate-700 border-t-primary rounded-full animate-spin"></div>
                    </div>
                ) : files.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
                        <p className="text-lg">No files uploaded yet.</p>
                        <p className="text-sm mt-1 text-slate-600">Drag and drop a file above to get started.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {files.map((file) => (
                            <FileItem key={file._id} file={file} onUpdate={fetchFiles} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
