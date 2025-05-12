"use client";
import React, { useState, useEffect } from "react";
import {
  Menu,
  MenuItem,
  HamburgerButton,
  MobileMenu,
  MobileMenuItem,
} from "./ui/navbar-menu";
import { cn } from "@/utils/utils";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";

const menuItems = [
  { name: "Home", href: "/" },
  { name: "Doc-Gen", href: "/doc-gen" },
  { name: "Summarizer", href: "/summary" },
];

function Navbar({ className }: { className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div
      className={cn(
        "fixed top-0 inset-x-0 font-bold z-50 bg-white shadow-sm",
        className
      )}
    >
      <div className="relative flex justify-between items-center px-4 py-2 md:py-0 mx-auto max-w-full md:w-full md:max-w-none">
        {/* Logo */}
        <div className="text-pink-900 text-lg md:hidden">{"<SB/>"}</div>

        {/* Hamburger menu - mobile only */}
        <div className="md:hidden">
          <HamburgerButton
            isOpen={isMobileMenuOpen}
            onClick={toggleMobileMenu}
            aria-controls="mobile-menu"
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle navigation menu"
          />
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:block w-full max-w-6xl mx-auto">
          <Menu setActive={setActive}>
            {menuItems.map(({ name, href }) => (
              <Link key={name} href={href}>
                <MenuItem item={name} active={active} setActive={setActive} />
              </Link>
            ))}
          </Menu>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
          setActive={setActive}
          active={active}
        >
          {menuItems.map(({ name, href }) => (
            <Link key={name} href={href}>
              <MobileMenuItem
                item={name}
                active={active}
                setActive={setActive}
                onClick={closeMobileMenu}
              />
            </Link>
          ))}
        </MobileMenu>
      </AnimatePresence>
    </div>
  );
}

export default Navbar;