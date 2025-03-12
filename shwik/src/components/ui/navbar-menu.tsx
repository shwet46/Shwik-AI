"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

const transition = {
  type: "spring",
  mass: 0.5,
  damping: 11.5,
  stiffness: 100,
  restDelta: 0.001,
  restSpeed: 0.001,
};

export const MenuItem = ({
  setActive,
  active,
  item,
  children,
  onClick,
}: {
  setActive: (item: string) => void;
  active: string | null;
  item: string;
  children?: React.ReactNode;
  onClick?: () => void;
}) => {
  const isActive = active === item;
  
  return (
    <div 
      onMouseEnter={() => setActive(item)} 
      className="relative"
      onClick={onClick}
    >
      <motion.p
        transition={{ duration: 0.3 }}
        className={`cursor-pointer px-4 py-2 ${
          isActive ? "bg-cyan-600/50 text-black" : "text-black hover:opacity-[0.9]"
        }`}
      >
        {item}
      </motion.p>
      {active !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={transition}
        >
          {isActive && children && (
            <div className="absolute top-[calc(100%_+_1.7rem)] left-1/2 transform -translate-x-1/2">
              <motion.div
                transition={transition}
                layoutId="active"
                className="bg-white backdrop-blur-sm rounded-md overflow-hidden border border-black/[0.2] shadow-xl"
              >
                <motion.div layout className="w-max h-full p-4">
                  {children}
                </motion.div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export const Menu = ({
  setActive,
  children,
}: {
  setActive: (item: string | null) => void;
  children: React.ReactNode;
}) => {
  return (
    <nav
      onMouseLeave={() => setActive(null)}
      className="relative rounded-md border border-transparent text-black shadow-input flex justify-center space-x-4 px-8 py-2"
    >
      {children}
    </nav>
  );
};

// New component for mobile menu
export const MobileMenu = ({
  setActive,
  active,
  isOpen,
  onClose,
  children,
}: {
  setActive: (item: string | null) => void;
  active: string | null;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  if (!isOpen) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="absolute top-14 left-0 right-0 bg-white rounded-md shadow-xl border border-black/[0.1] py-2 mx-4"
    >
      {children}
    </motion.div>
  );
};

// Mobile menu item component
export const MobileMenuItem = ({
  item,
  active,
  setActive,
  onClick,
}: {
  item: string;
  active: string | null;
  setActive: (item: string) => void;
  onClick?: () => void;
}) => {
  const isActive = active === item;
  
  return (
    <div
      className={`px-4 py-3 ${
        isActive ? "bg-cyan-600/50" : "hover:bg-gray-100"
      }`}
      onClick={() => {
        setActive(item);
        if (onClick) onClick();
      }}
    >
      <p className="text-black">{item}</p>
    </div>
  );
};

export const ProductItem = ({
  title,
  description,
  href,
  src,
}: {
  title: string;
  description: string;
  href: string;
  src: string;
}) => {
  return (
    <Link href={href} className="flex space-x-2">
      <Image
        src={src}
        width={140}
        height={70}
        alt={title}
        className="flex-shrink-0 shadow-2xl"
      />
      <div>
        <h4 className="text-2xl font-bold mb-1 text-black">{title}</h4>
        <p className="text-black text-sm max-w-[10rem]">{description}</p>
      </div>
    </Link>
  );
};

export const HoveredLink = ({ children, ...rest }: any) => {
  return (
    <Link {...rest} className="text-black hover:text-black">
      {children}
    </Link>
  );
};

// Hamburger button component
export const HamburgerButton = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className="block md:hidden focus:outline-none"
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      <div className="w-6 flex flex-col gap-1">
        <span className={`block h-0.5 w-full bg-black transition-transform duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
        <span className={`block h-0.5 w-full bg-black transition-opacity duration-300 ${isOpen ? 'opacity-0' : 'opacity-100'}`}></span>
        <span className={`block h-0.5 w-full bg-black transition-transform duration-300 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
      </div>
    </button>
  );
};