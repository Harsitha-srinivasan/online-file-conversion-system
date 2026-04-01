import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FiUpload, FiFile, FiDownload, FiX, FiScissors } from 'react-icons/fi';

const SplitPDF = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [splitResults, setSplitResults] = useState(null);
    const [splitMode, setSplitMode] = useState('pages'); // 'pages' or 'ranges'
    const [splitPoints, setSplitPoints] = useState('');
    const [ranges, setRanges] = useState('');
    const { user } = useAuth();

    const onDrop = (acceptedFiles) => {
        setFile(acceptedFiles[0]);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf']
        },
        maxFiles: 1,
        maxSize: 50 * 1024 * 1024 // 50MB
    });

    const removeFile = () => {
        setFile(null);
    };

    const validateSplitPoints = (input) => {
        const points = input.split(',').map(p => parseInt(p.trim()));
        return points.every(p => !isNaN(p) && p > 0);
    };

    const validateRanges = (input) => {
        const ranges = input.split(',').map(r => r.trim());
        for (const range of ranges) {
            const [start, end] = range.split('-').map(p => parseInt(p));
            if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
                return false;
            }
        }
        return true;
    };

    const handleSplit = async () => {
        if (!file) {
            toast.error('Please select a PDF file');
            return;
        }

        if (splitMode === 'pages' && splitPoints) {
            if (!validateSplitPoints(splitPoints)) {
                toast.error('Invalid split points. Use comma-separated numbers (e.g., 3,5,7)');
                return;
            }
        }

        if (splitMode === 'ranges' && ranges) {
            if (!validateRanges(ranges)) {
                toast.error('Invalid ranges. Use format: 1-3,5-7,9-10');
                return;
            }
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        
        if (splitMode === 'pages' && splitPoints) {
            formData.append('splitPoints', JSON.stringify(splitPoints.split(',').map(p => parseInt(p))));
        }
        
        if (splitMode === 'ranges' && ranges) {
            const rangesArray = ranges.split(',').map(r => {
                const [start, end] = r.split('-').map(p => parseInt(p));
                return [start, end];
            });
            formData.append('ranges', JSON.stringify(rangesArray));
        }

        try {
            const response = await api.post('/conversion/split-pdf', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setSplitResults(response.data.data);
            toast.success('PDF split successfully!');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Split failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = (fileName) => {
        const token = encodeURIComponent(localStorage.getItem('token') || '');
        window.open(`http://localhost:5000/api/conversion/download/${fileName}?token=${token}`, '_blank');
    };

    const reset = () => {
        setFile(null);
        setSplitResults(null);
        setSplitPoints('');
        setRanges('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                        Split PDF Files
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Extract pages or split PDF into multiple documents
                    </p>
                </div>

                {!splitResults ? (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
                        {/* Dropzone */}
                        {!file ? (
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
                                    <p className="text-lg text-indigo-600 dark:text-indigo-400">Drop your PDF here...</p>
                                ) : (
                                    <div>
                                        <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
                                            Drag & drop a PDF file, or click to select
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Maximum file size: 50MB
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="mb-6">
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <FiFile className="text-indigo-600 dark:text-indigo-400 text-2xl" />
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
                                        onClick={removeFile}
                                        className="text-red-500 hover:text-red-700 transition-colors"
                                    >
                                        <FiX className="text-xl" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {file && (
                            <>
                                {/* Split Mode Selection */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Split Mode
                                    </label>
                                    <div className="flex space-x-4">
                                        <button
                                            onClick={() => setSplitMode('pages')}
                                            className={`flex-1 py-2 px-4 rounded-lg border ${
                                                splitMode === 'pages'
                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                    : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                                            }`}
                                        >
                                            Split at Pages
                                        </button>
                                        <button
                                            onClick={() => setSplitMode('ranges')}
                                            className={`flex-1 py-2 px-4 rounded-lg border ${
                                                splitMode === 'ranges'
                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                    : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                                            }`}
                                        >
                                            Page Ranges
                                        </button>
                                    </div>
                                </div>

                                {/* Split Options */}
                                {splitMode === 'pages' && (
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Split at Pages
                                        </label>
                                        <input
                                            type="text"
                                            value={splitPoints}
                                            onChange={(e) => setSplitPoints(e.target.value)}
                                            placeholder="e.g., 3,5,7 (split after pages 3,5,7)"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                                        />
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Leave empty to split every page individually
                                        </p>
                                    </div>
                                )}

                                {splitMode === 'ranges' && (
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Page Ranges
                                        </label>
                                        <input
                                            type="text"
                                            value={ranges}
                                            onChange={(e) => setRanges(e.target.value)}
                                            placeholder="e.g., 1-3,5-7,9-10"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
                                        />
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Specify page ranges separated by commas
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={handleSplit}
                                    disabled={uploading}
                                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    {uploading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Splitting PDF...
                                        </>
                                    ) : (
                                        <>
                                            <FiScissors className="mr-2" />
                                            Split PDF
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
                        <div className="text-center mb-8">
                            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                                <FiDownload className="h-12 w-12 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Split Complete!
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300">
                                Created {splitResults.results.length} files from {splitResults.totalPages} pages
                            </p>
                        </div>

                        <div className="space-y-3 mb-8">
                            {splitResults.results.map((result, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {result.range ? `Pages ${result.range}` : `Page ${result.page}`}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {result.pageCount} page{result.pageCount > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDownload(result.fileName)}
                                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        <FiDownload className="mr-2" />
                                        Download
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={reset}
                            className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                        >
                            Split Another PDF
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SplitPDF;