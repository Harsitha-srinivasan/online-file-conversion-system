import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FiUpload, FiFile, FiDownload, FiX, FiFileText } from 'react-icons/fi';

const PdfToPpt = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [convertedFile, setConvertedFile] = useState(null);
    const [paying, setPaying] = useState(false);

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

    const handleConvert = async () => {
        if (!file) {
            toast.error('Please select a PDF file');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'pdf-to-ppt');

        try {
            const response = await api.post('/conversion/pdf-to-ppt', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                params: { type: 'pdf-to-ppt' }
            });

            setConvertedFile(response.data.data);
            toast.success('PDF converted to PPT successfully!');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Conversion failed');
        } finally {
            setUploading(false);
        }
    };

    const handlePayment = async () => {
        if (!convertedFile?._id) return;
        setPaying(true);
        try {
            await api.post(`/history/${convertedFile._id}/pay`);
            setConvertedFile({ ...convertedFile, isPaid: true });
            toast.success('Payment successful! You can now download your file.');
        } catch (error) {
            toast.error('Payment failed. Please try again.');
        } finally {
            setPaying(false);
        }
    };

    const handleDownload = () => {
        if (convertedFile) {
            const token = encodeURIComponent(localStorage.getItem('token') || '');
            window.open(`http://localhost:5000/api/conversion/download/${convertedFile.convertedFileName}?token=${token}`, '_blank');
        }
    };

    const reset = () => {
        setFile(null);
        setConvertedFile(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                        PDF to PPT Converter
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Convert PDF documents to editable PowerPoint presentations
                    </p>
                </div>

                {!convertedFile ? (
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
                                <FiFileText className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
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
                            <button
                                onClick={handleConvert}
                                disabled={uploading}
                                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                {uploading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Converting...
                                    </>
                                ) : (
                                    'Convert to PPT'
                                )}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 text-center">
                        <div className="mb-8">
                            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                                <FiDownload className="h-12 w-12 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Conversion Complete!
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300">
                                Your PDF has been converted to PowerPoint
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                Pages converted: {convertedFile.pageCount}
                            </p>
                        </div>

                        <div className="flex space-x-4">
                            {convertedFile.isPaid ? (
                                <button
                                    onClick={handleDownload}
                                    className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                                >
                                    <FiDownload className="mr-2" />
                                    Download PPT
                                </button>
                            ) : (
                                <button
                                    onClick={handlePayment}
                                    disabled={paying}
                                    className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                                >
                                    {paying ? 'Processing...' : 'Pay $5.00 to Download'}
                                </button>
                            )}
                            <button
                                onClick={reset}
                                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                            >
                                Convert Another
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PdfToPpt; 