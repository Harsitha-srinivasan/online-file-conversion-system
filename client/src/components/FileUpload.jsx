import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaCloudUploadAlt, FaFileAlt, FaTimes, FaExchangeAlt, FaSpinner, FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../services/api';

const FileUpload = ({ onUploadSuccess }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [targetFormat, setTargetFormat] = useState('');
    const [converting, setConverting] = useState(false);
    const [convertedFileUrl, setConvertedFileUrl] = useState(null);

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setSelectedFile(file);
            setConvertedFileUrl(null);
            // Set default target format based on file type
            const ext = file.name.split('.').pop().toLowerCase();
            const formatOptions = getSupportedFormats(ext);
            if (formatOptions.length > 0) {
                setTargetFormat(formatOptions[0].value);
            }
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        noClick: !!selectedFile // Disable clicking the container if file is already selected
    });

    const getSupportedFormats = (ext) => {
        const formats = {
            pdf: [
                { value: 'docx', label: 'Word (DOCX)' },
                { value: 'compress', label: 'Compress PDF' },
                { value: 'txt', label: 'Text (TXT)' },
                { value: 'png', label: 'Image (PNG)' },
                { value: 'jpg', label: 'Image (JPG)' }
            ],
            docx: [{ value: 'pdf', label: 'PDF Document' }],
            doc: [{ value: 'pdf', label: 'PDF Document' }],
            txt: [{ value: 'pdf', label: 'PDF' }],
            jpg: [{ value: 'png', label: 'PNG' }, { value: 'pdf', label: 'PDF' }],
            jpeg: [{ value: 'png', label: 'PNG' }, { value: 'pdf', label: 'PDF' }],
            png: [{ value: 'jpg', label: 'JPG' }, { value: 'pdf', label: 'PDF' }],
            ppt: [{ value: 'pdf', label: 'PDF' }],
            pptx: [{ value: 'pdf', label: 'PDF' }]
        };
        return formats[ext] || [];
    };

    const handleConvert = async (e) => {
        e.stopPropagation();
        if (!selectedFile || !targetFormat) return;

        setConverting(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        const toastId = toast.loading("Processing...");

        try {
            // 1. Upload
            const uploadRes = await api.post('/files/upload', formData);
            const fileId = uploadRes.data.data._id;

            // 2. Convert
            const convertRes = await api.post('/convert', {
                fileId,
                targetFormat
            });

            setConvertedFileUrl(convertRes.data.convertedFileUrl);
            toast.update(toastId, { render: "Conversion successful!", type: "success", isLoading: false, autoClose: 3000 });
            if (onUploadSuccess) onUploadSuccess();
        } catch (err) {
            toast.update(toastId, { render: "Error: " + (err.response?.data?.error || err.message), type: "error", isLoading: false, autoClose: 3000 });
        } finally {
            setConverting(false);
        }
    };

    const clearSelection = (e) => {
        e.stopPropagation();
        setSelectedFile(null);
        setTargetFormat('');
        setConvertedFileUrl(null);
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="max-w-3xl mx-auto mb-12">
            <div
                {...getRootProps()}
                className={`glass-card relative border-2 border-dashed rounded-3xl transition-all duration-300 min-h-[280px] flex flex-col items-center justify-center p-8
                    ${isDragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-slate-700 hover:border-slate-500 bg-slate-900/40'}
                    ${selectedFile ? 'border-none bg-slate-900/60' : 'cursor-pointer'}
                `}
            >
                {!selectedFile && <input {...getInputProps()} />}

                {!selectedFile ? (
                    <div className="text-center animate-fade-in">
                        <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-700 group-hover:bg-slate-700 transition">
                            <FaCloudUploadAlt className="text-4xl text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-3">Drag & drop a file here</h2>
                        <p className="text-slate-400 mb-2">or click to browse your files</p>
                        <div className="flex flex-wrap justify-center gap-2 mt-6">
                            {['PDF', 'DOCX', 'TXT', 'JPG', 'PNG'].map(fmt => (
                                <span key={fmt} className="bg-slate-800 text-slate-500 py-1 px-3 rounded-full text-[10px] font-bold tracking-widest">{fmt}</span>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="w-full animate-scale-in">
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
                            <div className="flex items-center gap-4 text-left">
                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary text-3xl">
                                    <FaFileAlt />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white max-w-[300px] truncate" title={selectedFile.name}>
                                        {selectedFile.name}
                                    </h3>
                                    <p className="text-slate-400 text-sm font-medium">{formatSize(selectedFile.size)}</p>
                                </div>
                            </div>
                            <button
                                onClick={clearSelection}
                                className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full flex items-center justify-center transition border border-slate-700"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {!convertedFileUrl ? (
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="flex-1 w-full">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">Target Format</label>
                                    <select
                                        value={targetFormat}
                                        onChange={(e) => setTargetFormat(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-slate-200 outline-none focus:border-primary transition"
                                    >
                                        {getSupportedFormats(selectedFile.name.split('.').pop().toLowerCase()).map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                        {getSupportedFormats(selectedFile.name.split('.').pop().toLowerCase()).length === 0 && (
                                            <option value="">No conversions available</option>
                                        )}
                                    </select>
                                </div>

                                <div className="w-full md:w-auto pt-6">
                                    <button
                                        onClick={handleConvert}
                                        disabled={converting || !targetFormat}
                                        className="w-full bg-primary hover:bg-indigo-600 disabled:opacity-50 text-white font-bold py-3.5 px-10 rounded-xl transition flex items-center justify-center gap-3 shadow-lg shadow-primary/20"
                                    >
                                        {converting ? <FaSpinner className="animate-spin text-xl" /> : <FaExchangeAlt className="text-lg" />}
                                        {converting ? 'Processing...' : 'Start Conversion'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center animate-fade-in">
                                <h4 className="text-green-400 font-bold mb-4 flex items-center justify-center gap-2">
                                    <FaDownload /> Your converted file is ready!
                                </h4>
                                <div className="flex gap-4 justify-center">
                                    <a
                                        href={`http://localhost:5000${convertedFileUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg shadow-green-500/20"
                                    >
                                        Download Now
                                    </a>
                                    <button
                                        onClick={clearSelection}
                                        className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-xl transition border border-slate-700"
                                    >
                                        Convert Another
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUpload;
