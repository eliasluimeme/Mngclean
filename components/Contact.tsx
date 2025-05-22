"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/lui/button";
import { Input } from "@/components/lui/input";
import { useState } from "react";
import { Check } from "lucide-react";

const Contact = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    city: "",
    district: "",
    size: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Submit to Google Sheets
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "contact",
          data: formData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      setIsSuccess(true);
      setIsLoading(false);

      // Wait for animation before opening WhatsApp
      setTimeout(() => {
        // Prepare WhatsApp message
        const message = `
*Nouvelle Demande de Contact*
---------------------------
*Informations Client:*
Nom: ${formData.fullName}
Téléphone: ${formData.phone}
Email: ${formData.email}
Ville: ${formData.city}
Quartier: ${formData.district}
Superficie: ${formData.size}m²
        `.trim();

        // Open WhatsApp
        const whatsappUrl = `https://wa.me/212616090788?text=${encodeURIComponent(
          message
        )}`;
        window.open(whatsappUrl, "_blank");
      }, 1000);
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsLoading(false);
      // You might want to show an error message to the user here
    }
  };

  return (
    <div className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Contactez-nous
          </h2>
          <div className="h-[1px] w-16 bg-gradient-to-r from-primary to-secondary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">
            Laissez-nous vos coordonnées et nous vous contacterons dans les plus
            brefs délais
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="max-w-xl mx-auto"
        >
          <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-white/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/10"
          >
            <div>
              <label className="text-sm font-medium mb-1 block">
                Nom et prénom <span className="text-primary">*</span>
              </label>
              <Input
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="Votre nom complet"
                className="h-12 text-base bg-white/50 focus:bg-white border-2 rounded-xl"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Numéro de téléphone <span className="text-primary">*</span>
              </label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="Ex: 0661234567"
                className="h-12 text-base bg-white/50 focus:bg-white border-2 rounded-xl"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Adresse e-mail <span className="text-primary">*</span>
              </label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="votre@email.com"
                className="h-12 text-base bg-white/50 focus:bg-white border-2 rounded-xl"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Ville <span className="text-primary">*</span>
              </label>
              <Input
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                placeholder="Votre ville"
                className="h-12 text-base bg-white/50 focus:bg-white border-2 rounded-xl"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Quartier <span className="text-primary">*</span>
              </label>
              <Input
                name="district"
                value={formData.district}
                onChange={handleChange}
                required
                placeholder="Votre quartier"
                className="h-12 text-base bg-white/50 focus:bg-white border-2 rounded-xl"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Superficie (m²) <span className="text-primary">*</span>
              </label>
              <Input
                name="size"
                type="number"
                value={formData.size}
                onChange={handleChange}
                required
                placeholder="Surface en m²"
                className="h-12 text-base bg-white/50 focus:bg-white border-2 rounded-xl"
              />
            </div>

            <Button
              type="submit"
              className={`w-full h-14 text-base font-medium rounded-xl transition-all duration-300 ${
                isSuccess
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              }`}
              disabled={isLoading || isSuccess}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
              ) : isSuccess ? (
                <div className="flex items-center justify-center gap-2">
                  <Check className="w-6 h-6 animate-[checkmark_0.4s_ease-in-out_forwards]" />
                  <span className="animate-[fadeIn_0.3s_ease-in-out]">
                    Terminé
                  </span>
                </div>
              ) : (
                "Envoyer"
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
