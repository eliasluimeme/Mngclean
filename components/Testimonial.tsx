"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import gsap from "gsap";

interface Testimonial {
  id: number;
  content: string;
  author: string;
  role: string;
  rating: number;
  service: string;
}

interface TestimonialCardProps {
  testimonial: Testimonial;
}

const testimonials = [
  {
    id: 1,
    content:
      "Wallah l'équipe dial ndhafa 10/10! Koulchi propre w mretteb, w les produits li kaykhddmo bihom kay7iydou ga3 tachi. La3ez zwiiiin!",
    author: "Amina Lahlou",
    role: "Cliente Régulière",
    rating: 5,
    service: "Ménage Régulier",
  },
  {
    id: 2,
    content:
      "Moul lkhedma m3allem! Jaw ba3d les travaux w daro khdma li makaynach. Daba garrage wllat ahsen men qbel, choukran bzaaaf!",
    author: "Youssef Tahiri",
    role: "Propriétaire",
    rating: 5,
    service: "Nettoyage Fin de Chantier",
  },
  {
    id: 3,
    content:
      "Saloni rje3 jdiiid! Ma3reft kifach daro liha, walakin l'équipe khddmat khdma nqia. 7ta les taches li knt bagha n7iydhom depuis longtemps mchaw!",
    author: "Sanaa Ziani",
    role: "Cliente Satisfaite",
    rating: 5,
    service: "Nettoyage Tapis & Canapés",
  },
  {
    id: 4,
    content:
      "Kayjiwni f lweqt toujours, w kay3tiwni un service VIP. Déjà 6 mois w ana m3ahom w jamais ma3endi chi mochkil. Nass m7terfin bzzaf!",
    author: "Omar Bahmed",
    role: "Client Fidèle",
    rating: 5,
    service: "Ménage Régulier",
  },
  {
    id: 5,
    content:
      "Hado nas serieux f khedmthom! Le prix mzian w service top. Kol merra kayjibo m3ahom les produits dyalhom w kaykhdmo b precision. Merci l'équipe!",
    author: "Ghita Assia",
    role: "Abonnée Mensuelle",
    rating: 5,
    service: "Ménage Régulier",
  },
];

const TestimonialCard = ({ testimonial }: TestimonialCardProps) => (
  <motion.div
    className="flex-shrink-0 w-[300px] md:w-[600px] px-6 md:px-12 flex flex-col items-center"
    whileHover={{ scale: 1.01 }}
    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
  >
    <div className="flex gap-1 mb-3 md:mb-4">
      {[...Array(testimonial.rating)].map((_, i) => (
        <Star
          key={i}
          className="w-2 h-2 md:w-3 md:h-3 fill-primary text-primary"
        />
      ))}
    </div>

    <blockquote className="text-lg md:text-2xl font-light text-center mb-4 md:mb-6 leading-relaxed font-serif italic">
      {testimonial.content}
    </blockquote>

    <div className="flex flex-col items-center">
      <div className="h-[1px] w-4 md:w-6 bg-primary mb-3 md:mb-4" />
      <div className="font-medium text-sm md:text-base">
        {testimonial.author}
      </div>
      <div className="text-xs md:text-sm text-muted-foreground mt-0.5">
        {testimonial.role}
      </div>
      <div className="text-xs md:text-sm font-medium text-primary mt-0.5">
        {testimonial.service}
      </div>
    </div>
  </motion.div>
);

export function Testimonial() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    const container = containerRef.current;

    if (scrollContainer && container) {
      // Clone first few testimonials and append to end for seamless loop
      const firstCard = container.children[0] as HTMLElement;
      if (firstCard) {
        const clonedItems = firstCard.cloneNode(true) as HTMLElement;
        container.appendChild(clonedItems);
      }

      // Base animation
      animationRef.current = gsap.to(container, {
        x: `-${50}%`,
        duration: 50,
        ease: "none",
        repeat: -1,
        paused: false,
      });

      const handleMouseEnter = () => {
        if (animationRef.current) {
          gsap.to(animationRef.current, {
            timeScale: 0,
            duration: 0.8,
            ease: "power2.out",
            overwrite: true,
          });
        }
      };

      const handleMouseLeave = () => {
        if (animationRef.current) {
          gsap.to(animationRef.current, {
            timeScale: 1,
            duration: 0.8,
            ease: "power2.inOut",
            overwrite: true,
          });
        }
      };

      scrollContainer.addEventListener("mouseenter", handleMouseEnter);
      scrollContainer.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        scrollContainer.removeEventListener("mouseenter", handleMouseEnter);
        scrollContainer.removeEventListener("mouseleave", handleMouseLeave);
        if (animationRef.current) {
          animationRef.current.kill();
        }
      };
    }
  }, []);

  return (
    <div className="py-24">
      <div className="container mx-auto mb-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Ce que disent nos clients
          </h2>
          <div className="h-[1px] w-16 bg-gradient-to-r from-primary to-secondary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">
            Découvrez les expériences de nos clients satisfaits
          </p>
        </motion.div>
      </div>

      <div
        ref={scrollRef}
        className="relative w-full overflow-hidden cursor-default"
      >
        <div ref={containerRef} className="flex w-fit">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Testimonial;
