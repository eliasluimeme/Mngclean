"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const partners = [
  { name: "Acme", logo: "/logos/acme.svg" },
  { name: "Aven", logo: "/logos/aven.svg" },
  { name: "Fox Hub", logo: "/logos/foxhub.svg" },
  { name: "Goldline", logo: "/logos/goldline.svg" },
  { name: "Muzica", logo: "/logos/muzica.svg" },
];

const Partners = () => {
  return (
    <div className="container-custom">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="heading-md">Partnered with Leading Innovators</h2>
        <p className="text-body mt-4">
          We collaborate with industry leaders to ensure the highest quality and
          innovation in your experience.
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary mt-6"
        >
          Contact us
        </motion.button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center justify-items-center opacity-70">
        {partners.map((partner, index) => (
          <motion.div
            key={partner.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="w-32 relative aspect-square"
          >
            <Image
              src={partner.logo}
              alt={partner.name}
              fill
              className="object-contain"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Partners;
