import { useState, useEffect } from 'react';
import { FaFileAlt, FaFileImage, FaDownload, FaExchangeAlt, FaSpinner, FaCheckCircle, FaTrashAlt, FaEdit, FaCheck, FaTimes, FaTrash } from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';

const FileItem = ({ file, onUpdate }) => {
    const [converting, setConverting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(file.originalName);
    const [renaming, setRenaming] = useState(false);
    const [isMerging, setIsMerging] = useState(false);
    const [availableFiles, setAvailableFiles] = useState([]);
    const [selectedFileIds, setSelectedFileIds] = useState([file._id]);
    const [loadingFiles, setLoadingFiles] = useState(false);

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
                { value: 'pdf', label: 'PDF Document' },
                { value: 'pptx', label: 'PowerPoint (PPTX)' }
            ],
            png: [
                { value: 'jpg', label: 'Image (JPG)' },
                { value: 'pdf', label: 'PDF Document' },
                { value: 'pptx', label: 'PowerPoint (PPTX)' }
            ],
            jpeg: [
                { value: 'png', label: 'Image (PNG)' },
                { value: 'pdf', label: 'PDF Document' },
                { value: 'pptx', label: 'PowerPoint (PPTX)' }
            ]
        };
        return formats[ext] || [];
    };

    const supportedFormats = getSupportedFormats();
    const [targetFormat, setTargetFormat] = useState(supportedFormats[0]?.value || '');

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
            if (isMerging && selectedFileIds.length > 1) {
                await api.post('/files/convert-multiple', { 
                    fileIds: selectedFileIds, 
                    targetFormat 
                });
                toast.success('Multi-file conversion started!');
            } else {
                await api.post('/convert', { fileId: file._id, targetFormat });
                toast.success('Conversion successful!');
            }
            onUpdate();
            setIsMerging(false);
        } catch (err) {
            toast.error('Conversion failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setConverting(false);
        }
    };

    const toggleMergeMode = async () => {
        if (!isMerging) {
            setLoadingFiles(true);
            try {
                const res = await api.get('/files');
                // Filter for images only, excluding current file which is already in selectedFileIds
                const images = res.data.data.filter(f => 
                    f._id !== file._id && 
                    f.mimeType.startsWith('image/')
                );
                setAvailableFiles(images);
                setIsMerging(true);
            } catch (err) {
                toast.error('Failed to load files');
            } finally {
                setLoadingFiles(false);
            }
        } else {
            setIsMerging(false);
            setSelectedFileIds([file._id]);
        }
    };

    const toggleFileSelection = (id) => {
        setSelectedFileIds(prev => 
            prev.includes(id) 
                ? prev.filter(fid => fid !== id) 
                : [...prev, id]
        );
    };

    const handleRename = async () => {
        if (!newName.trim() || newName === file.originalName) {
            setIsEditing(false);
            return;
        }
        setRenaming(true);
        try {
            await api.patch(`/files/${file._id}`, { newName });
            toast.success('File renamed');
            setIsEditing(false);
            onUpdate();
        } catch (err) {
            toast.error('Rename failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setRenaming(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this file and all its conversions?')) return;
        try {
            await api.delete(`/files/${file._id}`);
            toast.success('File deleted');
            onUpdate();
        } catch (err) {
            toast.error('Delete failed: ' + (err.response?.data?.error || err.message));
        }
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + ['Bytes', 'KB', 'MB', 'GB'][i];
    };

    return (
        <div className="glass-card p-6 rounded-[24px] mb-4 hover:border-indigo-500/30 transition-all duration-300 group">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5 w-full md:w-auto">
                    <div className={`w-14 h-14 ${isImage ? 'bg-pink-500/10 text-pink-500' : 'bg-indigo-500/10 text-indigo-500'} rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform`}>
                        {isImage ? <FaFileImage /> : <FaFileAlt />}
                    </div>
                    <div className="flex-1 min-w-0">
                        {isEditing ? (
                            <div className="flex items-center gap-2 mb-1">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="bg-white dark:bg-slate-800 border border-indigo-500/50 rounded-lg px-3 py-1 text-sm font-bold text-[var(--text-main)] w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRename();
                                        if (e.key === 'Escape') setIsEditing(false);
                                    }}
                                />
                                <button
                                    onClick={handleRename}
                                    disabled={renaming}
                                    className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
                                >
                                    {renaming ? <div className="w-3 h-3 border-2 border-t-green-500 rounded-full animate-spin"></div> : <FaCheck size={12} />}
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <FaTimes size={12} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 group/title">
                                <h4 className="font-bold text-lg truncate text-[var(--text-main)] max-w-xs" title={file.originalName}>{file.originalName}</h4>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="opacity-0 group-hover:opacity-100 group-hover/title:opacity-100 p-1 text-slate-400 hover:text-indigo-500 transition-all"
                                    title="Rename"
                                >
                                    <FaEdit size={12} />
                                </button>
                            </div>
                        )}
                        <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">{formatSize(file.size)} • {file.mimeType}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
                    {/* Conversion Controls */}
                    {supportedFormats.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 bg-indigo-50/50 dark:bg-indigo-500/10 p-1.5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                                <select
                                    className="bg-transparent text-sm font-bold px-3 py-1.5 outline-none cursor-pointer text-[var(--text-main)] appearance-none"
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
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                                >
                                    {converting ? <FaSpinner className="animate-spin" /> : <FaExchangeAlt />}
                                    {converting ? 'Converting...' : (isMerging ? 'Merge & Convert' : 'Convert')}
                                </button>
                            </div>
                            
                            {(isImage && (targetFormat === 'pdf' || targetFormat === 'pptx')) && (
                                <button
                                    onClick={toggleMergeMode}
                                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${isMerging ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-transparent text-indigo-500 border-indigo-500/30 hover:bg-indigo-500/5'}`}
                                >
                                    {isMerging ? 'Cancel Merge' : 'Add more images'}
                                </button>
                            )}
                        </div>
                    ) : (
                        <span className="text-xs text-indigo-400 dark:text-indigo-300 font-black px-4 py-2 bg-indigo-50/50 dark:bg-indigo-500/10 rounded-xl uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20">No Conversions</span>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        <a
                            href={`http://localhost:5000/api/files/download/${file._id}?token=${encodeURIComponent(localStorage.getItem('token') || '')}`}
                            className="w-10 h-10 bg-indigo-50/50 dark:bg-indigo-500/10 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-indigo-500 hover:border-indigo-500/50 border border-indigo-100 dark:border-indigo-500/20 transition-all active:scale-90"
                            title="Download Original"
                            download
                        >
                            <FaDownload />
                        </a>
                        <button
                            onClick={handleDelete}
                            className="w-10 h-10 bg-red-50/50 dark:bg-red-500/10 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-red-500 hover:border-red-500/50 border border-red-100 dark:border-red-500/20 transition-all active:scale-90"
                            title="Delete File"
                        >
                            <FaTrash />
                        </button>
                    </div>
                </div>
            </div>

            {/* Conversion History Tags */}
            {file.conversions?.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[var(--border-color)]">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Converted Versions</span>
                        <div className="flex flex-wrap gap-2">
                            {file.conversions.map((conv, idx) => {
                                const fmt = conv.targetFormat.toLowerCase();
                                const colorClass = fmt.includes('pdf') ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400' :
                                    fmt.includes('docx') ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' :
                                        fmt.includes('txt') ? 'bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400' :
                                            (fmt.includes('jpg') || fmt.includes('png') || fmt.includes('jpeg')) ? 'bg-pink-500/10 border-pink-500/20 text-pink-600 dark:text-pink-400' :
                                                'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400';
                                return (
                                    <a
                                        key={idx}
                                        href={`http://localhost:5000/api/conversion/download/${conv.convertedPath.split(/[\\/]/).pop()}?token=${encodeURIComponent(localStorage.getItem('token') || '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`px-3 py-1.5 ${colorClass} border rounded-lg text-xs font-bold flex items-center gap-2 hover:opacity-80 transition-all active:scale-95 group/tag`}
                                    >
                                        <FaCheckCircle className="text-[10px]" /> {conv.targetFormat.toUpperCase()}
                                        <FaDownload className="text-[10px] opacity-0 group-hover/tag:opacity-100 transition-opacity" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Merge Selection Area */}
            {isMerging && (
                <div className="mt-6 pt-6 border-t border-dashed border-indigo-500/20 anima-fade-in">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Select Images to Merge</span>
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full font-bold">{selectedFileIds.length} Selected</span>
                    </div>
                    {loadingFiles ? (
                        <div className="flex justify-center py-4">
                            <FaSpinner className="animate-spin text-indigo-500" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {availableFiles.length === 0 ? (
                                <p className="col-span-full text-center text-xs text-[var(--text-muted)] py-4">No other images found in your workspace.</p>
                            ) : (
                                availableFiles.map(f => (
                                    <label key={f._id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedFileIds.includes(f._id) ? 'bg-indigo-500/10 border-indigo-500' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-indigo-500/30'}`}>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={selectedFileIds.includes(f._id)}
                                            onChange={() => toggleFileSelection(f._id)}
                                        />
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedFileIds.includes(f._id) ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300'}`}>
                                            {selectedFileIds.includes(f._id) && <FaCheck size={8} />}
                                        </div>
                                        <span className="text-xs font-bold truncate flex-1 text-[var(--text-main)]">{f.originalName}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FileItem;
