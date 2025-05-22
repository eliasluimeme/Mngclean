"use client";

import { motion } from "framer-motion";
import { Shield, Clock, Award, Users, Sparkles, ThumbsUp } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Service Professionnel",
    description:
      "Une équipe qualifiée et formée pour des résultats exceptionnels",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Clock,
    title: "Disponibilité 7j/7",
    description: "Nous nous adaptons à votre emploi du temps",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: Award,
    title: "Qualité Garantie",
    description: "Satisfaction garantie ou reprise gratuite du service",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    icon: Users,
    title: "Équipe Expérimentée",
    description:
      "Personnel formé et expérimenté dans le nettoyage professionnel",
    color: "from-orange-500 to-orange-600",
  },
  {
    icon: Sparkles,
    title: "Produits Premium",
    description: "Utilisation de produits professionnels et écologiques",
    color: "from-pink-500 to-pink-600",
  },
  {
    icon: ThumbsUp,
    title: "Service Client 24/7",
    description: "Support client disponible pour répondre à vos besoins",
    color: "from-cyan-500 to-cyan-600",
  },
];

const Features = () => {
  return (
    <div className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Pourquoi Nous Choisir
          </h2>
          <div className="h-[1px] w-16 bg-gradient-to-r from-primary to-secondary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">
            Découvrez ce qui fait de nous le meilleur choix pour vos besoins de
            nettoyage
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative bg-white/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
              <div
                className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${feature.color} rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
