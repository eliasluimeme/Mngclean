"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Johnson",
    text: "CleanCo has transformed my home! Their attention to detail is impressive.",
    rating: 5,
  },
  {
    name: "Mike Thompson",
    text: "Reliable, professional, and thorough. I highly recommend their services.",
    rating: 5,
  },
  {
    name: "Emily Davis",
    text: "The eco-friendly cleaning option was perfect for my family. Great job!",
    rating: 4,
  },
];

const Testimonials = () => {
  return (
    <div className="container mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-foreground">
          What Our Customers Say
        </h2>
        <p className="text-muted-foreground mt-2">
          Real feedback from real customers
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.name}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="neu-concave h-full p-6 rounded-2xl">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-foreground">
                    {testimonial.name}
                  </h3>
                  <div className="neu-pressed px-3 py-1 rounded-xl">
                    <div className="flex space-x-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 text-primary fill-current"
                        />
                      ))}
                      {[...Array(5 - testimonial.rating)].map((_, i) => (
                        <Star
                          key={i + testimonial.rating}
                          className="w-4 h-4 text-muted"
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground">{testimonial.text}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Testimonials;
