import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaUserCircle, FaSignOutAlt, FaCog, FaUser, FaIdCard, FaSlidersH, FaShoppingBag } from 'react-icons/fa';
import "./Header.css";
import logo from '@/assets/images/logo.png'

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [user, setUser] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            // Giả định user có FullName
            setUser(JSON.parse(savedUser));
        }
        const handleScroll = () => setIsScrolled(window.scrollY > 100);
        window.addEventListener("scroll", handleScroll);

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleLogout = async () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        setUser(null);
        navigate("/home", { replace: true });
    };

    // Hàm chuyển hướng đến tab cụ thể trong trang Settings
    const navigateToSettingsTab = (tabKey) => {
        setIsDropdownOpen(false);
        // Điều hướng đến trang Setting và dùng state/query param để mở tab
        navigate(`/settings?tab=${tabKey}`);
    };

    const navLinks = [
        { href: "/home", label: "Home" },
        { href: "/services", label: "Service" },
        { href: "/itineraries", label: "Itinerary" },
        { href: "/community", label: "Community" },
        { href: "/provider", label: "Provider" },
    ];

    return (
        <header className={`header ${isScrolled ? "scrolled" : ""}`} id="header">
            <nav className="nav-container">
                {/* Logo */}
                <a
                    href="/home"
                    className="logo-container"
                    onClick={(e) => {
                        e.preventDefault();
                        navigate("/home");
                        setIsMenuOpen(false);
                    }}
                >
                    <img
                        src={logo}
                        alt="Logo Wanderly"
                        className="w-15 h-15 object-cover rounded-full logo-svg"
                    />
                    <span className="logo-text">Wanderly</span>
                </a>

                {/* Menu - Centered */}
                <ul className={`nav-menu ${isMenuOpen ? "active" : ""}`} id="navMenu">
                    {navLinks.map((link, i) => (
                        <li key={i}>
                            <NavLink
                                to={link.href}
                                end
                                className={({ isActive }) =>
                                    `nav-link ${isActive ? "active" : ""}`
                                }
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {link.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>

                {/* Action buttons và User Profile Dropdown */}
                <div className="flex items-center space-x-4">
                    {user ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={toggleDropdown}
                                className="focus:outline-none flex items-center p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                                aria-expanded={isDropdownOpen}
                                aria-haspopup="true"
                            >
                                <FaUserCircle className="text-3xl text-gray-700 cursor-pointer" />
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100/80">

                                    {/* MỤC 1: Tên người dùng và Email (Header của Dropdown) */}
                                    <div className="px-4 py-3 text-sm border-b border-gray-100 mb-1">
                                        <p className="font-semibold text-gray-900 truncate">{user.FullName || 'Tài khoản'}</p>
                                        <p className="text-xs text-gray-500 truncate">{user.Email || ''}</p>
                                    </div>

                                    {/* MỤC 2: My Profile (Public profile page) */}
                                    <button
                                        onClick={() => {
                                            setIsDropdownOpen(false);
                                            navigate('/profile');
                                        }}
                                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 transition-colors"
                                    >
                                        <FaUser className="mr-3 text-pink-500" /> My Profile
                                    </button>

                                    {/* MỤC 2.5: My Bookings */}
                                    <button
                                        onClick={() => {
                                            setIsDropdownOpen(false);
                                            navigate('/bookings');
                                        }}
                                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 transition-colors"
                                    >
                                        <FaShoppingBag className="mr-3 text-purple-500" /> My Bookings
                                    </button>

                                    {/* MỤC 3: Account Settings (Dẫn đến Settings tab Account) */}
                                    <button
                                        onClick={() => navigateToSettingsTab('account')}
                                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-cyan-50 transition-colors"
                                    >
                                        <FaIdCard className="mr-3 text-cyan-500" /> Account Settings
                                    </button>

                                    {/* MỤC 4: Settings (Dẫn đến Settings tab General) */}
                                    <button
                                        onClick={() => navigateToSettingsTab('general')}
                                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                                    >
                                        <FaSlidersH className="mr-3 text-blue-500" /> Settings
                                    </button>

                                    {/* MỤC 5: Đăng xuất */}
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 border-t border-gray-100 mt-1"
                                    >
                                        <FaSignOutAlt className="mr-3" /> Log out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Hiển thị nút Đăng nhập/Đăng ký nếu chưa đăng nhập
                        <div className="auth-buttons">
                            <button
                                className="btn-login"
                                onClick={() => { navigate("/login"); setIsMenuOpen(false); }}
                            >
                                Sign In
                            </button>
                            <button
                                className="btn-register"
                                onClick={() => { navigate("/register"); setIsMenuOpen(false); }}
                            >
                                Sign Up
                            </button>
                        </div>
                    )}
                </div>

                {/* Hamburger */}
                <button
                    className={`hamburger ${isMenuOpen ? "active" : ""}`}
                    id="hamburger"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </nav >
        </header >
    );
};

export default Header;