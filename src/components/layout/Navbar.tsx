"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { logout } from "@/lib/auth-utils";
import { LogOut, User, Menu } from "lucide-react";

interface NavbarProps {
  title?: string;
}

const Navbar = ({ title }: NavbarProps) => {
  const { user, role, loading } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-blue-600">RBAC SaaS</span>
          </Link>
          {title && (
            <div className="h-6 w-[1px] bg-gray-200 mx-2 hidden sm:block" />
          )}
          {title && (
            <h1 className="text-sm font-medium text-gray-500 hidden sm:block">
              {title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-medium text-gray-900">{user.displayName}</span>
                <span className="text-xs text-gray-500 capitalize">{role}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Register</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;