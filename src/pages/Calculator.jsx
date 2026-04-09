import React from 'react';
import { motion } from 'framer-motion';
import TileCalculator from '../components/TileCalculator';

const CalculatorPage = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-slate-50 relative overflow-hidden pt-32 pb-20 selection:bg-brand-blue selection:text-white font-sans"
        >
            {/* High-End Architectural Background */}
            <div className="absolute inset-0 pointer-events-none z-0">
                {/* Dynamic Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-slate-200/50"></div>
                
                {/* Sophisticated Mesh Blobs */}
                <motion.div 
                    animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.4, 0.6, 0.4],
                        x: [0, 50, 0],
                        y: [0, -30, 0]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-[10%] -right-[10%] w-[800px] h-[800px] bg-blue-600/10 blur-[120px] rounded-full"
                />
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                        x: [0, -40, 0],
                        y: [0, 60, 0]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute top-[30%] -left-[10%] w-[700px] h-[700px] bg-cyan-600/10 blur-[120px] rounded-full"
                />
                
                {/* Architectural Elements - Darker Grid */}
                <div className="absolute inset-0 opacity-[0.08]" style={{ 
                    backgroundImage: `linear-gradient(#334155 1.5px, transparent 1.5px), linear-gradient(90deg, #334155 1.5px, transparent 1.5px)`,
                    backgroundSize: '60px 60px'
                }}></div>

                {/* Glassy Floating Shapes */}
                <motion.div 
                    animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/4 left-10 w-32 h-32 border-2 border-blue-500/20 rounded-full blur-[0.5px]"
                />
                <motion.div 
                    animate={{ y: [0, 30, 0], rotate: [45, 55, 45] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-1/4 right-10 w-64 h-64 border-2 border-cyan-500/20 rounded-3xl blur-[0.5px]"
                />
            </div>

            <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
                {/* Header Section */}
                <div className="mb-16 space-y-6">
                    <div className="space-y-4">
                        <span className="text-brand-blue font-black uppercase tracking-[0.5em] text-[10px]">Material Protocol</span>
                        <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase text-slate-900 leading-none">
                            Smart Tile <br /> <span className="text-brand-blue">Estimator</span>
                        </h1>
                    </div>

                    <p className="text-slate-500 text-sm max-w-2xl leading-relaxed font-bold uppercase tracking-widest">
                        Plan your flooring with precision. Enter your room dimensions and tile size to instantly calculate the number of tiles required, including additional allowance for cutting and wastage.
                    </p>
                </div>

                {/* Calculator Component */}
                <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden">
                    <TileCalculator className="!shadow-none !rounded-none" />
                </div>
            </div>
        </motion.div>
    );
};

export default CalculatorPage;
