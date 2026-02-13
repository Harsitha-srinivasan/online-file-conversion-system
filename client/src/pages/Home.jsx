import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFileUpload, FaHistory, FaCheckCircle, FaFilePdf, FaLongArrowAltRight } from 'react-icons/fa';

const Home = () => {
    return (
        <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="text-center py-16 md:py-24">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
                        Convert Files with <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                            Extreme Precision
                        </span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
                        The ultimate tool for all your file conversion needs. FAST, FREE, and strictly PRIVATE.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/dashboard"
                            className="bg-primary hover:bg-indigo-600 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center gap-2 group"
                        >
                            Get Started Now <FaLongArrowAltRight className="group-hover:translate-x-1 transition" />
                        </Link>
                        <Link
                            to="/txt-to-pdf"
                            className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 px-10 rounded-2xl transition border border-slate-700"
                        >
                            Quick TXT to PDF
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-20 border-t border-slate-900">
                <div className="glass-card p-8 rounded-3xl text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary text-3xl mx-auto mb-6">
                        <FaFileUpload />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Easy Upload</h3>
                    <p className="text-slate-400 text-sm">Drag and drop your files. We support various formats including PDF, DOCX, and Images.</p>
                </div>
                <div className="glass-card p-8 rounded-3xl text-center">
                    <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary text-3xl mx-auto mb-6">
                        <FaFilePdf />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Direct Conversion</h3>
                    <p className="text-slate-400 text-sm">Need a PDF from text? Use our direct input tool to generate PDFs in seconds.</p>
                </div>
                <div className="glass-card p-8 rounded-3xl text-center">
                    <div className="w-16 h-16 bg-green-400/10 rounded-2xl flex items-center justify-center text-green-400 text-3xl mx-auto mb-6">
                        <FaHistory />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Cloud History</h3>
                    <p className="text-slate-400 text-sm">Keep track of all your conversions. Download them again anytime from your history.</p>
                </div>
            </div>

            {/* CTA Section */}
            <div className="my-20 glass-card p-12 rounded-[40px] text-center bg-gradient-to-br from-indigo-900/20 to-slate-900 border border-slate-800">
                <h2 className="text-3xl font-bold mb-4">Start Converting Today</h2>
                <p className="text-slate-400 mb-8 max-w-xl mx-auto">Join thousands of users who trust FileConvert for their document needs.</p>
                <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4].map(i => (
                        <FaCheckCircle key={i} className="text-green-500 text-sm" />
                    ))}
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-widest ml-2">Secure & Encrypted</span>
                </div>
            </div>
        </div>
    );
};

export default Home;
