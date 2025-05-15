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
        className={`cursor-pointer text-sm font-medium px-4 py-3 rounded-md ${
          isActive ? "bg-cyan-600/50 text-white" : "text-black hover:bg-gray-100"
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
            <div className="absolute top-[calc(100%_+_0.5rem)] left-1/2 transform -translate-x-1/2 z-50">
              <motion.div
                transition={transition}
                layoutId="active"
                className="bg-white backdrop-blur-sm rounded-md overflow-hidden border border-gray-200 shadow-lg"
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
      className="relative rounded-md text-black flex justify-center items-center space-x-2 px-4 py-1"
    >
      {children}
    </nav>
  );
};

// Updated MobileMenu component with correct props
export const MobileMenu = ({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="absolute top-16 left-0 right-0 bg-white rounded-b-md shadow-xl border-b border-x border-gray-200 py-2 z-50"
    >
      <div className="flex flex-col">
        {children}
      </div>
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
      className={`px-6 py-3 ${
        isActive ? "bg-cyan-600/50 text-white" : "hover:bg-gray-100"
      }`}
      onClick={() => {
        setActive(item);
        if (onClick) onClick();
      }}
    >
      <p className={`text-sm font-medium ${isActive ? "text-white" : "text-black"}`}>{item}</p>
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
    <Link href={href} className="flex space-x-3 hover:bg-gray-50 p-2 rounded-md transition-colors">
      <Image
        src={src}
        width={140}
        height={70}
        alt={title}
        className="flex-shrink-0 rounded-md shadow-md object-cover"
      />
      <div>
        <h4 className="text-lg font-bold mb-1 text-black">{title}</h4>
        <p className="text-gray-600 text-sm max-w-[10rem]">{description}</p>
      </div>
    </Link>
  );
};

export const HoveredLink = ({
  children,
  href,
  className,
  ...rest
}: {
  children: React.ReactNode;
  href: string;
  className?: string;
  [key: string]: any;
}) => {
  return (
    <Link 
      href={href} 
      className={`text-black hover:text-cyan-600 transition-colors ${className || ""}`}
      {...rest}
    >
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
      className="block focus:outline-none p-2"
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      <div className="w-6 flex flex-col gap-1.5">
        <span className={`block h-0.5 w-full bg-black transition-transform duration-300 ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
        <span className={`block h-0.5 w-full bg-black transition-opacity duration-300 ${isOpen ? 'opacity-0' : 'opacity-100'}`}></span>
        <span className={`block h-0.5 w-full bg-black transition-transform duration-300 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
      </div>
    </button>
  );
};