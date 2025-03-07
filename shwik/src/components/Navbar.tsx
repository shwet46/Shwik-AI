"use client";
import React, { useState } from "react";
import { HoveredLink, Menu, MenuItem, ProductItem } from "./ui/navbar-menu";
import { cn } from "@/utils/utils";
import Link from "next/link";

function Navbar({ className }: { className?: string }) {
    const [active, setActive] = useState<string | null>(null);
    return (
      <div
        className={cn("fixed  top-10 inset-x-0 font-bold max-w-2xl mx-auto z-50", className)}
      >
        <Menu setActive={setActive}>
          <Link href={"#"}>
          <MenuItem setActive={setActive} active={active} item="Home"></MenuItem>
          </Link>
          <Link href={"#"}>
          <MenuItem setActive={setActive} active={active} item="Doc-Gen"></MenuItem>
          </Link>
          <Link href={"#"}>
          <MenuItem setActive={setActive} active={active} item="Summarizer"></MenuItem>
          </Link>  
        </Menu>
      </div>
    );
  }

export default Navbar