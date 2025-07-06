"use client";

import { Trophy, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface NavbarProps {
    showLeaderboard?: boolean;
}

export default function Navbar({ showLeaderboard = true }: NavbarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const router = useRouter();

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const goToHome = () => {
        router.push('/');
    };

    const goToLeaderboard = () => {
        router.push('/leaderboard');
        setIsMenuOpen(false); // Close menu on mobile
    };

    return (
        <nav className="bg-black border-b border-gray-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center cursor-pointer" onClick={goToHome}>
                        <h1 className="text-xl font-bold text-white">AptoSigma</h1>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            {showLeaderboard && (
                                <button
                                    onClick={goToLeaderboard}
                                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                                >
                                    <Trophy className="w-4 h-4 mr-2" />
                                    Leaderboard
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        {showLeaderboard && (
                            <button
                                onClick={toggleMenu}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            >
                                <Menu className={`block h-6 w-6 ${isMenuOpen ? 'hidden' : ''}`} />
                                <X className={`block h-6 w-6 ${isMenuOpen ? '' : 'hidden'}`} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            {isMenuOpen && showLeaderboard && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-900 border-t border-gray-800">
                        <button
                            onClick={goToLeaderboard}
                            className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors w-full text-left"
                        >
                            <Trophy className="w-4 h-4 mr-2" />
                            Leaderboard
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}
