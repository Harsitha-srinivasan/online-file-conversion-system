import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaCloudUploadAlt, FaFileAlt, FaTimes, FaExchangeAlt, FaSpinner, FaDownload, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../services/api';

const FileUpload = ({ onUploadSuccess }) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [targetFormat, setTargetFormat] = useState('');
    const [converting, setConverting] = useState(false);
    const [convertedFileUrl, setConvertedFileUrl] = useState(null);
    
    // Split options
    const [splitStart, setSplitStart] = useState(1);
    const [splitEnd, setSplitEnd] = useState(1);

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...acceptedFiles]);
            setConvertedFileUrl(null);
            
            // Auto-set target format if it's the first file
            if (selectedFiles.length === 0) {
                const ext = acceptedFiles[0].name.split('.').pop().toLowerCase();
                const formatOptions = getSupportedFormats(ext, acceptedFiles.length);
                if (formatOptions.length > 0) {
                    setTargetFormat(formatOptions[0].value);
                }
            }
        }
    }, [selectedFiles]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        noClick: selectedFiles.length > 0
    });

    const getSupportedFormats = (ext, fileCount) => {
        const formats = {
            pdf: [
                { value: 'docx', label: 'Word (DOCX)' },
                { value: 'pptx', label: 'PowerPoint (PPTX)' },
                { value: 'compress', label: 'Compress PDF' },
                { value: 'merge', label: 'Merge PDF' },
                { value: 'split', label: 'Split PDF' },
                { value: 'txt', label: 'Text (TXT)' },
                { value: 'png', label: 'Image (PNG)' },
                { value: 'jpg', label: 'Image (JPG)' }
            ],
            docx: [{ value: 'pdf', label: 'PDF Document' }],
            doc: [{ value: 'pdf', label: 'PDF Document' }],
            txt: [{ value: 'pdf', label: 'PDF Document' }],
            jpg: [
                { value: 'pdf', label: 'PDF Document' },
                { value: 'pptx', label: 'PowerPoint (PPTX)' },
                { value: 'png', label: 'PNG Image' }
            ],
            jpeg: [
                { value: 'pdf', label: 'PDF Document' },
                { value: 'pptx', label: 'PowerPoint (PPTX)' },
                { value: 'png', label: 'PNG Image' }
            ],
            png: [
                { value: 'pdf', label: 'PDF Document' },
                { value: 'pptx', label: 'PowerPoint (PPTX)' },
                { value: 'jpg', label: 'JPG Image' }
            ],
            ppt: [{ value: 'pdf', label: 'PDF Document' }],
            pptx: [{ value: 'pdf', label: 'PDF Document' }]
        };

        let options = formats[ext] || [];
        
        // If multiple files are selected, prioritize Merge
        if (fileCount > 1) {
            // Check if all files are PDF
            const allPdf = selectedFiles.every(f => f.name.toLowerCase().endsWith('.pdf'));
            if (allPdf) {
                return [{ value: 'merge', label: 'Merge PDF Documents' }];
            }
            // Check if all files are Images
            const allImages = selectedFiles.every(f => /\.(jpg|jpeg|png|webp)$/i.test(f.name));
            if (allImages) {
                return [
                    { value: 'pdf-merge', label: 'Merge to PDF' },
                    { value: 'pptx-merge', label: 'Merge to PowerPoint' }
                ];
            }
        }

        return options;
    };

    const handleConvert = async (e) => {
        e.stopPropagation();
        if (selectedFiles.length === 0 || !targetFormat) return;

        setConverting(true);
        const toastId = toast.loading("Processing...");

        try {
            if (targetFormat === 'merge') {
                // Upload all files
                const fileIds = [];
                for (const file of selectedFiles) {
                    const formData = new FormData();
                    formData.append('file', file);
                    const uploadRes = await api.post('/files/upload', formData);
                    fileIds.push(uploadRes.data.data._id);
                }

                // Call merge endpoint
                const mergeRes = await api.post('/convert/merge', { fileIds });
                setConvertedFileUrl(mergeRes.data.convertedFileUrl);
            } 
            else if (targetFormat === 'split') {
                // Upload first file
                const formData = new FormData();
                formData.append('file', selectedFiles[0]);
                const uploadRes = await api.post('/files/upload', formData);
                const fileId = uploadRes.data.data._id;

                // Call split endpoint
                const splitRes = await api.post('/convert/split', { 
                    fileId, 
                    startPage: splitStart, 
                    endPage: splitEnd 
                });
                setConvertedFileUrl(splitRes.data.convertedFileUrl);
            }
            else if (targetFormat === 'pdf-merge' || targetFormat === 'pptx-merge') {
                // Multi-image merge
                const fileIds = [];
                for (const file of selectedFiles) {
                    const formData = new FormData();
                    formData.append('file', file);
                    const uploadRes = await api.post('/files/upload', formData);
                    fileIds.push(uploadRes.data.data._id);
                }

                const finalFormat = targetFormat === 'pdf-merge' ? 'pdf' : 'pptx';
                const mergeRes = await api.post('/files/convert-multiple', { 
                    fileIds, 
                    targetFormat: finalFormat 
                });
                setConvertedFileUrl(mergeRes.data.convertedFileUrl);
            }
            else {
                // Standard conversion
                const formData = new FormData();
                formData.append('file', selectedFiles[0]);
                const uploadRes = await api.post('/files/upload', formData);
                const fileId = uploadRes.data.data._id;

                const convertRes = await api.post('/convert', {
                    fileId,
                    targetFormat
                });
                setConvertedFileUrl(convertRes.data.convertedFileUrl);
            }

            toast.update(toastId, { render: "Process successful!", type: "success", isLoading: false, autoClose: 3000 });
            if (onUploadSuccess) onUploadSuccess();
        } catch (err) {
            toast.update(toastId, { render: "Error: " + (err.response?.data?.error || err.message), type: "error", isLoading: false, autoClose: 3000 });
        } finally {
            setConverting(false);
        }
    };

    const removeFile = (index, e) => {
        e.stopPropagation();
        const newFiles = [...selectedFiles];
        newFiles.splice(index, 1);
        setSelectedFiles(newFiles);
        if (newFiles.length === 0) {
            setTargetFormat('');
            setConvertedFileUrl(null);
        }
    };

    const clearSelection = (e) => {
        if (e) e.stopPropagation();
        setSelectedFiles([]);
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

    const firstFileExt = selectedFiles.length > 0 ? selectedFiles[0].name.split('.').pop().toLowerCase() : '';
    const formatOptions = getSupportedFormats(firstFileExt, selectedFiles.length);

    return (
        <div className="max-w-3xl mx-auto mb-12 animate-fade-in">
            <div
                {...getRootProps()}
                className={`glass-card p-16 rounded-[48px] text-center cursor-pointer transition-all duration-700 hover-lift floating ${isDragActive ? 'border-2 border-dashed border-indigo-500 scale-[1.02] bg-indigo-50/50 dark:bg-indigo-950/20' : ''
                    } ${selectedFiles.length > 0 ? 'border-none p-0 overflow-hidden' : ''}`}
            >
                {selectedFiles.length === 0 ? (
                    <>
                        <input {...getInputProps()} />
                        <div className="animate-fade-in">
                            <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-500/40 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                                <FaCloudUploadAlt className="text-4xl text-white relative z-10" />
                            </div>
                            <h2 className="text-4xl font-black mb-4 tracking-tight text-[var(--text-main)] hover-glow cursor-default">File Upload</h2>
                            <p className="text-[var(--text-muted)] mb-8 text-xl font-medium max-w-md mx-auto leading-relaxed">Drag and drop your files here to <span className="text-indigo-500 font-bold italic">start</span> the conversion process.</p>
                            <div className="flex flex-wrap justify-center gap-3">
                                {[
                                    { name: 'PDF', class: 'bg-red-500/10 text-red-600 border-red-500/20' },
                                    { name: 'DOCX', class: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
                                    { name: 'PPTX', class: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
                                    { name: 'JPG', class: 'bg-pink-500/10 text-pink-600 border-pink-500/20' },
                                    { name: 'PNG', class: 'bg-purple-500/10 text-purple-600 border-purple-500/20' }
                                ].map(fmt => (
                                    <span key={fmt.name} className={`${fmt.class} py-1.5 px-4 rounded-xl text-[10px] font-black tracking-widest uppercase border transition-colors duration-300`}>{fmt.name}</span>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="w-full flex flex-col h-full animate-fade-in text-left">
                        <div className="p-10 border-b border-[var(--border-color)] bg-slate-50/50 dark:bg-slate-800/20">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em]">Selected Assets</h3>
                                <button
                                    onClick={clearSelection}
                                    className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest"
                                >
                                    Clear All
                                </button>
                            </div>
                            
                            <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-900/30 rounded-2xl border border-[var(--border-color)] group hover:border-indigo-300 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center text-xl">
                                                <FaFileAlt />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-[var(--text-main)] truncate max-w-[200px]" title={file.name}>{file.name}</p>
                                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">{formatSize(file.size)}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => removeFile(index, e)}
                                            className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 transition-colors"
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                ))}
                                
                                {((targetFormat === 'merge') || 
                                  (selectedFiles.length > 0 && selectedFiles.every(f => /\.(jpg|jpeg|png|webp)$/i.test(f.name)) && (targetFormat === 'pdf' || targetFormat === 'pptx' || targetFormat === 'pdf-merge' || targetFormat === 'pptx-merge'))) && (
                                    <label className="flex items-center gap-4 p-4 border-2 border-dashed border-indigo-200 dark:border-indigo-900/30 rounded-2xl cursor-pointer hover:bg-indigo-50/30 transition-colors">
                                        <input 
                                            type="file" 
                                            multiple 
                                            accept={targetFormat === 'merge' ? '.pdf' : 'image/*'} 
                                            className="hidden" 
                                            onChange={(e) => {
                                                if (e.target.files.length > 0) {
                                                    const newFiles = Array.from(e.target.files);
                                                    setSelectedFiles(prev => [...prev, ...newFiles]);
                                                    
                                                    // Automatically switch to merge format if more than 1 file
                                                    if (selectedFiles.length + newFiles.length > 1) {
                                                        if (targetFormat === 'pdf') setTargetFormat('pdf-merge');
                                                        if (targetFormat === 'pptx') setTargetFormat('pptx-merge');
                                                    }
                                                }
                                            }}
                                        />
                                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 rounded-xl flex items-center justify-center text-xl">
                                            <FaPlus />
                                        </div>
                                        <p className="text-xs font-black text-indigo-500 uppercase tracking-widest">
                                            {targetFormat === 'merge' ? 'Add more PDFs to merge' : 'Add more images'}
                                        </p>
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="p-10">
                            {!convertedFileUrl ? (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
                                        <div className="md:col-span-12 lg:col-span-7">
                                            <label className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-4 block px-1">Target Format</label>
                                            <div className="relative">
                                                <select
                                                    value={targetFormat}
                                                    onChange={(e) => setTargetFormat(e.target.value)}
                                                    className="w-full bg-transparent border border-[var(--border-color)] rounded-2xl px-6 py-5 text-[var(--text-main)] outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 transition-all font-black uppercase tracking-widest text-xs appearance-none cursor-pointer shadow-sm hover:border-indigo-300"
                                                >
                                                    {formatOptions.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">
                                                    <FaExchangeAlt />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="md:col-span-12 lg:col-span-5">
                                            <button
                                                onClick={handleConvert}
                                                disabled={converting || !targetFormat}
                                                className="w-full btn-primary !py-5 flex items-center justify-center gap-4 text-sm tracking-[0.2em] uppercase"
                                            >
                                                {converting ? <FaSpinner className="animate-spin text-xl" /> : <FaExchangeAlt className="text-xl" />}
                                                {converting ? 'Processing' : 'Convert'}
                                            </button>
                                        </div>
                                    </div>

                                    {targetFormat === 'split' && (
                                        <div className="p-8 bg-indigo-50/30 dark:bg-indigo-950/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/20 animate-fade-in">
                                            <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-6">Split Parameters</h4>
                                            <div className="flex items-center gap-6">
                                                <div className="flex-1">
                                                    <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase mb-2 block">Start Page</label>
                                                    <input 
                                                        type="number" 
                                                        value={splitStart} 
                                                        onChange={(e) => setSplitStart(parseInt(e.target.value) || 1)}
                                                        min="1"
                                                        className="w-full bg-white dark:bg-slate-900 border border-[var(--border-color)] rounded-xl px-4 py-3 outline-none focus:border-indigo-400 text-sm font-bold"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase mb-2 block">End Page</label>
                                                    <input 
                                                        type="number" 
                                                        value={splitEnd} 
                                                        onChange={(e) => setSplitEnd(parseInt(e.target.value) || 1)}
                                                        min="1"
                                                        className="w-full bg-white dark:bg-slate-900 border border-[var(--border-color)] rounded-xl px-4 py-3 outline-none focus:border-indigo-400 text-sm font-bold"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-500/5 dark:to-emerald-500/5 border border-green-500/10 rounded-[40px] p-12 text-center animate-fade-in shadow-inner">
                                    <h4 className="text-green-600 dark:text-green-400 text-2xl font-black mb-8 flex items-center justify-center gap-4">
                                        <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-500/20 floating">
                                            <FaDownload />
                                        </div>
                                        Transformation Complete
                                    </h4>
                                    <div className="flex flex-col sm:flex-row gap-6 justify-center mt-4">
                                        <a
                                            href={`${convertedFileUrl.startsWith('http') ? convertedFileUrl : `http://localhost:5000${convertedFileUrl}`}?token=${encodeURIComponent(localStorage.getItem('token') || '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-green-600 hover:bg-green-700 text-white font-black py-5 px-12 rounded-[24px] transition-all shadow-2xl shadow-green-600/30 active:scale-95 flex items-center justify-center gap-3 tracking-widest uppercase text-xs"
                                        >
                                            <FaDownload /> Download Result
                                        </a>
                                        <button
                                            onClick={clearSelection}
                                            className="btn-secondary !py-5 px-10 border-green-500/10 hover:bg-green-100/50 transition-colors uppercase tracking-widest text-xs"
                                        >
                                            New Operation
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default FileUpload;
