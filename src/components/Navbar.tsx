"use client";
import React, { useState, useEffect } from "react";
import {
  Menu,
  MenuItem,
  HamburgerButton,
  MobileMenu,
  MobileMenuItem,
  HoveredLink
} from "./ui/navbar-menu";
import { cn } from "@/utils/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";

const menuItems = [
  { name: "Home", href: "/" },
  { name: "Doc-Gen", href: "/doc-gen" },
  { name: "Summarizer", href: "/summary" },
];

function Navbar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [active, setActive] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const currentItem = menuItems.find(item => 
      item.href === pathname || 
      (pathname && pathname !== "/" && item.href !== "/" && pathname.startsWith(item.href))
    );
    
    if (currentItem) {
      setActive(currentItem.name);
    } else {
      setActive(null);
    }
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 bg-white shadow-md",
        className
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-xl font-bold text-cyan-600">
              {"<SB/>"}
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <Menu setActive={setActive}>
              {menuItems.map(({ name, href }) => (
                <Link key={name} href={href} className="no-underline">
                  <MenuItem 
                    item={name} 
                    active={active} 
                    setActive={setActive} 
                  />
                </Link>
              ))}
            </Menu>
          </div>

          {/* Hamburger menu - mobile only */}
          <div className="md:hidden">
            <HamburgerButton
              isOpen={isMobileMenuOpen}
              onClick={toggleMobileMenu}
            />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <MobileMenu
            isOpen={isMobileMenuOpen}
            onClose={closeMobileMenu}
          >
            {menuItems.map(({ name, href }) => (
              <Link key={name} href={href} className="no-underline">
                <MobileMenuItem
                  item={name}
                  active={active}
                  setActive={setActive}
                  onClick={closeMobileMenu}
                />
              </Link>
            ))}
          </MobileMenu>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;