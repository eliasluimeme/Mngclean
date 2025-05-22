"use client";

import { motion, useInView, animate, useMotionValue } from "framer-motion";
import { Button } from "@/components/lui/button";
import { ArrowRight } from "lucide-react";
import { useRef, useEffect } from "react";
import Link from "next/link";

const stats = [
  { number: 500, label: "Happy Clients", suffix: "+" },
  { number: 4.9, label: "Rating", decimals: 1 },
  { number: 24, label: "Support", suffix: "/7" },
];

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  suffix?: string;
}

const AnimatedNumber = ({
  value,
  decimals = 0,
  suffix = "",
}: AnimatedNumberProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const count = useMotionValue(0);

  useEffect(() => {
    if (isInView) {
      const animation = animate(count, value, {
        duration: 2,
        ease: "easeOut",
        onUpdate: (latest) => {
          if (ref.current) {
            ref.current.textContent = latest.toFixed(decimals) + suffix;
          }
        },
      });
      return animation.stop;
    }
  }, [isInView, value, decimals, suffix, count]);

  return (
    <motion.div className="relative">
      <motion.div
        ref={ref}
        className="text-3xl md:text-4xl font-bold gradient-text"
      >
        0{suffix}
      </motion.div>
      <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl blur-xl -z-10" />
    </motion.div>
  );
};

const Hero = () => {
  return (
    <div className="relative min-h-[100dvh] flex items-center">
      {/* Background Image with Parallax */}
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/img1.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/50 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent z-10" />

      {/* Content */}
      <div className="container-custom relative z-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="space-y-8"
          >
            <div className="inline-block">
              <div className="highlight-box px-4 py-2 rounded-full">
                <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  Services de Nettoyage Professionnel
                </span>
              </div>
            </div>

            <h1 className="heading-xl">
              Votre Espace,{" "}
              <span className="gradient-text">Notre Expertise</span>
            </h1>

            <p className="text-body max-w-lg">
              Découvrez l&apos;excellence du nettoyage professionnel. Nous
              transformons votre espace en un environnement impeccable pendant
              que vous vous concentrez sur l&apos;essentiel.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link href="#services">
                  <Button size="lg" className="btn-primary w-full sm:w-auto">
                    <span className="relative z-10">Réserver</span>
                    <ArrowRight className="ml-2 h-4 w-4 relative z-10" />
                  </Button>
                </Link>
              </motion.div>

              {/* <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto glass-panel border-2 hover:bg-white/80"
                >
                  Learn More
                </Button>
              </motion.div> */}
            </div>

            {/* Updated Stats Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="grid grid-cols-3 gap-8 pt-8"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="group relative">
                  <motion.div
                    className="text-center p-4 rounded-2xl transition-all duration-300 hover:scale-105"
                    whileHover={{ y: -5 }}
                  >
                    <AnimatedNumber
                      value={stat.number}
                      decimals={stat.decimals || 0}
                      suffix={stat.suffix || ""}
                    />
                    <div className="text-sm text-muted-foreground mt-2 font-medium">
                      {stat.label}
                    </div>
                  </motion.div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Content - Decorative Elements */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative hidden md:block"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
