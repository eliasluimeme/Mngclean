import { Facebook, Instagram, Phone, Mail, MapPin } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-background border-t border-white/10">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Mng Clean</h3>
            <p className="text-sm text-muted-foreground">
              Services de nettoyage professionnel à Casablanca. Qualité,
              fiabilité et satisfaction garantie.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#services"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Nettoyage Régulier
                </Link>
              </li>
              <li>
                <Link
                  href="#services"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Nettoyage Professionnel
                </Link>
              </li>
              <li>
                <Link
                  href="#services"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Nettoyage Après Travaux
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                +212 641-875028
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                contact@cleanmng.ma
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                Casablanca, Maroc
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Suivez-nous</h3>
            <div className="flex gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-sm text-center text-muted-foreground">
            © {new Date().getFullYear()} Clean MNG. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
