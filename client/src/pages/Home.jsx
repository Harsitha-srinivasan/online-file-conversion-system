import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFileUpload, FaHistory, FaCheckCircle, FaFilePdf, FaLongArrowAltRight, FaMagic } from 'react-icons/fa';
import InteractiveBackground from '../components/InteractiveBackground';

const Home = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 py-20 min-h-[90vh] flex flex-col justify-center relative overflow-hidden text-center">
            <InteractiveBackground />
            <div className="flex flex-col items-center gap-10 mb-24 relative z-10">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] -z-10"></div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-10 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                        <FaMagic className="animate-pulse" /> New: Enhanced File Conversion
                    </div>

                    <h1 className="text-5xl md:text-8xl font-black mb-10 leading-[1.1] tracking-tight text-[var(--text-main)]">
                        Convert Files with <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                            Extreme Precision
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto mb-14 leading-relaxed font-medium">
                        The ultimate tool for all your file conversion needs. FAST, FREE, and strictly PRIVATE. Experience the next level of document management.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link
                            to="/register"
                            className="btn-primary w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-3 group text-lg hover:scale-105 transition-transform duration-300"
                        >
                            Get Started Now <FaLongArrowAltRight className="group-hover:translate-x-2 transition-transform" />
                        </Link>
                        <Link
                            to="/txt-to-pdf"
                            className="bg-transparent hover:bg-slate-500/5 text-[var(--text-main)] w-full sm:w-auto min-w-[200px] py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-[var(--border-color)] transition-all active:scale-95 flex items-center justify-center hover:border-indigo-500/30"
                        >
                            Quick TXT to PDF
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Features Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24 transition-all">
                {[
                    { title: "Easy Upload", desc: "Drag and drop your files. We support various formats including PDF, DOCX, and Images.", icon: <FaFileUpload />, color: "text-indigo-500", bg: "bg-indigo-500/10" },
                    { title: "Direct Conversion", desc: "Need a PDF from text? Use our direct input tool to generate PDFs in seconds.", icon: <FaFilePdf />, color: "text-pink-500", bg: "bg-pink-500/10" },
                    { title: "Cloud History", desc: "Keep track of all your conversions. Download them again anytime from your history.", icon: <FaHistory />, color: "text-green-500", bg: "bg-green-500/10" },
                    { title: "Invoice Maker", desc: "Generate professional invoices instantly and download them as PDF or JSON.", icon: <FaMagic />, color: "text-amber-500", bg: "bg-amber-500/10" }
                ].map((feature, idx) => (
                    <motion.div
                        key={idx}
                        className="glass-card p-10 rounded-[32px] text-center transition-all duration-300 group cursor-default"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.6, delay: idx * 0.1 }}
                        whileHover={{
                            y: -15,
                            scale: 1.02,
                            boxShadow: "0 30px 60px -15px rgba(99, 102, 241, 0.15)"
                        }}
                    >
                        <div className={`w-20 h-20 ${feature.bg} rounded-2xl flex items-center justify-center ${feature.color} text-4xl mx-auto mb-8 shadow-inner group-hover:rotate-6 group-hover:scale-110 transition-all duration-500`}>
                            {feature.icon}
                        </div>
                        <h3 className="text-2xl font-black mb-4 text-[var(--text-main)] group-hover:text-indigo-500 transition-colors uppercase tracking-tight">{feature.title}</h3>
                        <p className="text-[var(--text-muted)] leading-relaxed font-medium">{feature.desc}</p>
                    </motion.div>
                ))}
            </div>

            {/* CTA Section */}
            <motion.div
                className="my-20 glass-card p-16 rounded-[48px] text-center bg-transparent border-[var(--border-color)] relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-500"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
            >
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-pink-500/10 rounded-full blur-[100px] -z-10 group-hover:scale-110 transition-transform duration-700"></div>
                <h2 className="text-4xl md:text-5xl font-black mb-6 text-[var(--text-main)] transition-colors group-hover:text-indigo-500">Start Converting Today</h2>
                <p className="text-[var(--text-muted)] mb-10 max-w-xl mx-auto text-lg leading-relaxed font-medium">Join thousands of users who trust FileConvert for their document needs with enterprise-grade security.</p>
                <div className="flex flex-wrap justify-center gap-6">
                    {['Secure', 'Free', 'Fast', 'Private'].map((text, i) => (
                        <div key={i} className="flex items-center gap-2 bg-transparent px-4 py-2 rounded-full border border-[var(--border-color)] hover:border-indigo-500/50 hover:text-indigo-500 transition-all cursor-default group/item">
                            <FaCheckCircle className="text-green-500 text-sm group-hover/item:scale-110 transition-transform" />
                            <span className="text-xs font-black uppercase tracking-widest">{text}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default Home;
