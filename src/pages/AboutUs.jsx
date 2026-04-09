import React from 'react';
import { motion } from 'framer-motion';

const AboutUs = () => {
    return (
        <div className="min-h-screen bg-brand-slate flex flex-col items-center justify-center text-white p-6">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center"
            >
                <h1 className="text-5xl font-black uppercase tracking-widest mb-6">About Us</h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                    We are Sri Vinayaga Enterprises, global leaders in premium stone architectural solutions. 
                    This page is currently under construction. Please check back later for our full story.
                </p>
                <button 
                    onClick={() => window.history.back()}
                    className="mt-10 px-8 py-3 bg-brand-blue text-white font-bold rounded-2xl shadow-xl hover:bg-brand-blue-dark transition-all"
                >
                    Go Back
                </button>
            </motion.div>
        </div>
    );
};

export default AboutUs;
