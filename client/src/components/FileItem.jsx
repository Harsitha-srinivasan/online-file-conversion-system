import { useState, useEffect } from 'react';
import { FaFileAlt, FaFileImage, FaDownload, FaExchangeAlt, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';

const FileItem = ({ file, onUpdate }) => {
    const [converting, setConverting] = useState(false);

    const getSupportedFormats = () => {
        const ext = file.originalName.split('.').pop().toLowerCase();

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
            txt: [{ value: 'pdf', label: 'PDF Document' }],
            jpg: [
                { value: 'png', label: 'Image (PNG)' },
                { value: 'pdf', label: 'PDF Document' }
            ],
            png: [
                { value: 'jpg', label: 'Image (JPG)' },
                { value: 'pdf', label: 'PDF Document' }
            ]
        };

        return formats[ext] || [];
    };

    const supportedFormats = getSupportedFormats();
    const [targetFormat, setTargetFormat] = useState(supportedFormats[0]?.value || '');

    // Reset target format when file changes or on mount
    useEffect(() => {
        if (supportedFormats.length > 0 && !targetFormat) {
            setTargetFormat(supportedFormats[0].value);
        }
    }, [file.originalName, supportedFormats]);

    const isImage = file.mimeType.startsWith('image/');

    const handleConvert = async () => {
        if (!targetFormat) {
            toast.error('Please select a target format');
            return;
        }

        setConverting(true);
        try {
            await api.post('/convert', {
                fileId: file._id,
                targetFormat
            });
            toast.success('Conversion successful!');
            onUpdate();
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
            toast.error('Conversion failed: ' + errorMsg);
        } finally {
            setConverting(false);
        }
    };

    return (
        <div className="glass-card p-4 rounded-xl mb-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="bg-slate-800 p-3 rounded-lg text-2xl text-secondary">
                    {isImage ? <FaFileImage /> : <FaFileAlt />}
                </div>
                <div>
                    <h4 className="font-bold truncate max-w-[200px]" title={file.originalName}>{file.originalName}</h4>
                    <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.mimeType}</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                {/* Conversion Controls */}
                <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
                    {supportedFormats.length > 0 ? (
                        <>
                            <select
                                className="bg-transparent text-sm px-2 py-1 outline-none cursor-pointer"
                                value={targetFormat}
                                onChange={(e) => setTargetFormat(e.target.value)}
                            >
                                {supportedFormats.map(fmt => (
                                    <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleConvert}
                                disabled={converting}
                                className="bg-primary hover:bg-indigo-600 px-3 py-1 rounded text-sm flex items-center gap-1 transition disabled:opacity-50"
                            >
                                {converting ? <FaSpinner className="animate-spin" /> : <FaExchangeAlt />}
                                {converting ? 'Converting...' : 'Convert'}
                            </button>
                        </>
                    ) : (
                        <span className="text-xs text-slate-500 px-2 py-1 italic">No conversions available</span>
                    )}
                </div>

                {/* Download Original */}
                <a
                    href={`http://localhost:5000/api/files/download/${file._id}?token=${localStorage.getItem('token')}`}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition"
                    title="Download Original"
                    download
                >
                    <FaDownload />
                </a>
            </div>

            {/* Conversion History / Links */}
            {file.conversions?.length > 0 && (
                <div className="w-full md:w-auto border-t border-slate-700 pt-2 mt-2 md:mt-0 md:border-0 md:pt-0">
                    <p className="text-xs text-slate-400 mb-1">Conversions:</p>
                    <div className="flex flex-wrap gap-2">
                        {file.conversions.map((conv, idx) => (
                            <a
                                key={idx}
                                href={`http://localhost:5000/converted/${conv.convertedPath.split(/[\\/]/).pop()}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-green-900 text-green-400 flex items-center gap-1 transition"
                            >
                                <FaCheckCircle /> {conv.targetFormat.toUpperCase()}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileItem;
