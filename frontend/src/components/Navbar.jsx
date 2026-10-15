import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHome = location.pathname === "/";

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ease-in-out 
      ${isHome && !scrolled ? "bg-white/10 backdrop-blur-lg" : "bg-white shadow-md"}`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Left: Logo */}
        <img src="/logo.png" width={40} className="mr-2" />
        <NavLink
          to="/"
          className={`text-xl font-bold tracking-wide transition-colors duration-500 
          ${isHome && !scrolled ? "text-white" : "text-gray-900"}`}
        >
          HydroChain
        </NavLink>

        {/* Center: Nav Links */}
        <div className="flex-1 flex justify-center space-x-6">
          {["Home", "About", "Workflow", "Features", "Contact"].map((item) => (
            <a
              key={item}
              href={item === "Home" ? "/" : `#${item.toLowerCase()}`}
              className={`${isHome && !scrolled
                ? "text-white hover:text-gray-200"
                : "text-gray-800 hover:text-green-600"
                }`}
            >
              {item}
            </a>
          ))}
        </div>

        {/* Right: Auth Buttons */}
        <div className="flex items-center space-x-4">
          <NavLink
            to="/login"
            className={({ isActive }) =>
              `px-5 py-2 rounded-full font-medium transition-all duration-500 ${isHome && !scrolled
                ? "text-white hover:text-gray-200"
                : "text-gray-800 hover:text-green-600"
              } ${isActive ? "text-green-600 font-semibold" : ""}`
            }
          >
            Login
          </NavLink>
          <NavLink
            to="/register"
            className="px-5 py-2 rounded-full font-semibold transition-all duration-500 bg-green-600 text-white hover:bg-green-700"
          >
            Register Now
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
