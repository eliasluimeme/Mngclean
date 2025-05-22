"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/lui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/lui/sheet";
import Image from "next/image";

const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 w-full z-50 backdrop-blur-sm bg-white/80"
    >
      <div className="container mx-auto flex justify-between items-center">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="text-2xl font-bold text-primary"
        >
          <Image src="/logo.png" alt="Mng Clean Logo" width={40} height={40} />
        </motion.div>
        <nav className="hidden md:flex items-center space-x-6">
          <NavItem href="#home">Home</NavItem>
          <NavItem href="#services">Services</NavItem>
          <NavItem href="#testimonials">Testimonials</NavItem>
          <NavItem href="#contact">Contact</NavItem>
        </nav>
        <div className="flex items-center space-x-4">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="neu-pressed p-2 rounded-xl"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl hover:bg-transparent"
                  >
                    <Menu className="h-[1.2rem] w-[1.2rem]" />
                  </Button>
                </motion.div>
              </SheetTrigger>
              <SheetContent>
                <nav className="flex flex-col space-y-6 mt-8">
                  <NavItem href="#home" mobile>
                    Home
                  </NavItem>
                  <NavItem href="#services" mobile>
                    Services
                  </NavItem>
                  <NavItem href="#testimonials" mobile>
                    Testimonials
                  </NavItem>
                  <NavItem href="#contact" mobile>
                    Contact
                  </NavItem>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

interface NavItemProps {
  href: string;
  children: React.ReactNode;
  mobile?: boolean;
}

const NavItem = ({ href, children, mobile = false }: NavItemProps) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className={mobile ? "" : "neu-flat px-4 py-2 rounded-xl"}
  >
    <a
      href={href}
      className={`text-foreground hover:text-primary transition-colors duration-300 ${
        mobile ? "text-lg" : ""
      }`}
    >
      {children}
    </a>
  </motion.div>
);

export default Header;
