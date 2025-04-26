"use client";
import React, { useState, useEffect } from "react";
import {
  Menu,
  MenuItem,
  HamburgerButton,
  MobileMenu,
  MobileMenuItem
} from "./ui/navbar-menu";
import { cn } from "@/utils/utils";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";

function Navbar({ className }: { className?: string }) {
  // Remove default active tab
  const [active, setActive] = useState<string | null>(null);
  // State for mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // State to track viewport size
  const [, setIsMobile] = useState(false);

  // Check for mobile viewport on client side
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // Standard md breakpoint
    };

    // Check on initial render
    checkMobile();

    // Add resize listener
    window.addEventListener("resize", checkMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div
      className={cn(
        // Fixed position with white background for all screens
        "fixed top-0 inset-x-0 font-bold z-50 bg-white shadow-sm",
        className
      )}
    >
      <div className="relative flex justify-between items-center px-4 py-2 md:py-0 mx-auto max-w-full md:w-full md:max-w-none">
        {/* Brand/Logo - visible on both mobile and desktop */}
        <div className="text-pink-900 text-lg md:hidden">{"<SB/>"}</div>

        {/* Hamburger menu - visible only on mobile */}
        <div className="md:hidden">
          <HamburgerButton 
            isOpen={isMobileMenuOpen} 
            onClick={toggleMobileMenu} 
          />
        </div>

        {/* Desktop menu - hidden on mobile */}
        <div className="hidden md:block w-full max-w-6xl mx-auto">
          <Menu setActive={setActive}>
            <Link href={"/"}>
              <MenuItem setActive={setActive} active={active} item="Home" />
            </Link>
            <Link href={"/poster"}>
              <MenuItem setActive={setActive} active={active} item="Poster" />
            </Link>
            <Link href={"/doc-gen"}>
              <MenuItem setActive={setActive} active={active} item="Doc-Gen" />
            </Link>
            <Link href={"/summary"}>
              <MenuItem setActive={setActive} active={active} item="Summarizer" />
            </Link>
          </Menu>
        </div>
      </div>

      {/* Mobile menu dropdown - conditionally rendered */}
      <AnimatePresence>
        <MobileMenu 
          isOpen={isMobileMenuOpen} 
          onClose={closeMobileMenu}
          setActive={setActive}
          active={active}
        >
          <Link href={"/"}>
            <MobileMenuItem 
              item="Home"
              active={active}
              setActive={setActive}
              onClick={closeMobileMenu}
            />
          </Link>
          <Link href={"/doc-gen"}>
            <MobileMenuItem 
              item="Doc-Gen"
              active={active}
              setActive={setActive}
              onClick={closeMobileMenu}
            />
          </Link>
          <Link href={"/summary"}>
            <MobileMenuItem 
              item="Summarizer"
              active={active}
              setActive={setActive}
              onClick={closeMobileMenu}
            />
          </Link>
        </MobileMenu>
      </AnimatePresence>
    </div>
  );
}

export default Navbar;