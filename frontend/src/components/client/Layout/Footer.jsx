import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F3460] text-white pt-15 pb-8 px-5 relative border-t border-white/10">
            <div className="max-w-7xl mx-auto relative z-2">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
                    {/* Brand Section */}
                    <div className="flex flex-col gap-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10">
                                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                        <linearGradient id="footerLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" style={{ stopColor: '#FF6B6B' }} />
                                            <stop offset="100%" style={{ stopColor: '#7FFFD4' }} />
                                        </linearGradient>
                                    </defs>
                                    <circle cx="50" cy="50" r="45" fill="url(#footerLogoGradient)" opacity="0.1" />
                                    <path d="M20 60 L35 40 L50 55 L65 35 L80 50" stroke="url(#footerLogoGradient)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="35" cy="40" r="3" fill="url(#footerLogoGradient)" />
                                    <circle cx="50" cy="55" r="3" fill="url(#footerLogoGradient)" />
                                    <circle cx="65" cy="35" r="3" fill="url(#footerLogoGradient)" />
                                    <rect x="25" y="65" width="50" height="15" rx="7" fill="url(#footerLogoGradient)" opacity="0.3" />
                                </svg>
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-[#FF6B6B] to-[#7FFFD4] bg-clip-text text-transparent">
                                Sleeky
                            </span>
                        </div>
                        <p className="text-gray-400 leading-relaxed mb-5">
                            Capturing Earth's most extraordinary landscapes through cutting-edge technology and artistic vision.
                        </p>
                        <div className="flex gap-4">
                            {['📘', '📷', '🐦', '💼'].map((icon, index) => (
                                <a key={index} href="#" className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center text-gray-400 no-underline transition-all duration-300 backdrop-blur-sm hover:bg-gradient-to-r hover:from-[#FF6B6B] hover:to-[#7FFFD4] hover:text-white hover:-translate-y-1">
                                    {icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Other footer sections... */}
                </div>

                <div className="border-t border-white/10 pt-8 flex justify-between items-center flex-wrap gap-5">
                    <div className="text-gray-400 text-sm">
                        © 2026 Sleeky Photography. All rights reserved.
                    </div>
                    <div className="text-gray-400 text-sm">
                        Designed by <a href="https://templatemo.com" target="_blank" rel="noopener noreferrer" className="text-[#FF6B6B] no-underline transition-colors duration-300 hover:text-[#7FFFD4]">TemplateMo</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;