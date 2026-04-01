import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FiUpload, FiFile, FiDownload, FiX } from 'react-icons/fi';

const MergePDF = () => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [mergedFile, setMergedFile] = useState(null);
    const { user } = useAuth();

    const onDrop = (acceptedFiles) => {
        setFiles(prev => [...prev, ...acceptedFiles]);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf']
        },
        maxSize: 50 * 1024 * 1024 // 50MB
    });

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleMerge = async () => {
        if (files.length < 2) {
            toast.error('Please select at least 2 PDF files');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        try {
            const response = await api.post('/conversion/merge-pdf', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setMergedFile(response.data.data);
            toast.success('PDFs merged successfully!');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Merge failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = () => {
        if (mergedFile) {
            const token = encodeURIComponent(localStorage.getItem('token') || '');
            window.open(`http://localhost:5000/api/conversion/download/${mergedFile.fileName}?token=${token}`, '_blank');
        }
    };

    const reset = () => {
        setFiles([]);
        setMergedFile(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                        Merge PDF Files
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Combine multiple PDFs into one document
                    </p>
                </div>

                {!mergedFile ? (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
                        {/* Dropzone */}
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
                                ${isDragActive 
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                                    : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500'
                                }`}
                        >
                            <input {...getInputProps()} />
                            <FiUpload className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
                            {isDragActive ? (
                                <p className="text-lg text-indigo-600 dark:text-indigo-400">Drop your PDFs here...</p>
                            ) : (
                                <div>
                                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
                                        Drag & drop PDF files here, or click to select
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Maximum file size: 50MB per file
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* File List */}
                        {files.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Selected Files ({files.length})
                                </h3>
                                <div className="space-y-3">
                                    {files.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <FiFile className="text-indigo-600 dark:text-indigo-400 text-xl" />
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {file.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeFile(index)}
                                                className="text-red-500 hover:text-red-700 transition-colors"
                                            >
                                                <FiX className="text-xl" />
                                            </button>
                                        </div>
                                    ))}

                                    <div 
                                        {...getRootProps()} 
                                        className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-all hover:bg-gray-50 dark:hover:bg-slate-700/50"
                                    >
                                        <input {...getInputProps()} />
                                        <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                                            + Add more files to merge
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleMerge}
                                    disabled={uploading || files.length < 2}
                                    className="mt-6 w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    {uploading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Merging PDFs...
                                        </>
                                    ) : (
                                        'Merge PDFs'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 text-center">
                        <div className="mb-8">
                            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                                <FiDownload className="h-12 w-12 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Merge Complete!
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300">
                                Your PDF has been merged successfully
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                Total pages: {mergedFile.pageCount}
                            </p>
                        </div>

                        <div className="flex space-x-4">
                            <button
                                onClick={handleDownload}
                                className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                            >
                                <FiDownload className="mr-2" />
                                Download PDF
                            </button>
                            <button
                                onClick={reset}
                                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                            >
                                Merge More Files
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MergePDF;