"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useAnimation } from "framer-motion";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  index: number;
}

const Section = ({ children, className = "", id, index }: SectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { margin: "-45% 0px -45% 0px" });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    } else {
      controls.start("hidden");
    }
  }, [isInView, controls]);

  const variants = {
    hidden: (index: number) => ({
      opacity: 0,
      y: 100,
      scale: 0.95,
      rotateX: index % 2 === 0 ? 15 : -15,
      filter: "blur(10px)",
    }),
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 120,
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <section
      id={id}
      className={`min-h-screen flex items-center justify-center py-20 ${className}`}
      ref={ref}
    >
      <motion.div
        className="w-full perspective-1000"
        initial="hidden"
        animate={controls}
        variants={variants}
        custom={index}
      >
        {children}
      </motion.div>
    </section>
  );
};

export default Section;
