import Link from "next/link";
import { Home, Mail, Phone } from "lucide-react";

export function Footer() {
  const annee = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Colonne 1 : Marque */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-xl font-extrabold text-primary">
              <Home className="h-6 w-6" />
              AgenceWeb
            </Link>
            <p className="mt-4 text-sm text-gray-600">
              Votre partenaire de confiance pour trouver le bien immobilier de vos rêves, simplement et rapidement.
            </p>
          </div>

          {/* Colonne 2 : Navigation */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Explorer</h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li><Link href="/annonces" className="hover:text-primary transition-colors">Toutes les annonces</Link></li>
              <li><Link href="/annonces?type=VENTE" className="hover:text-primary transition-colors">Acheter</Link></li>
              <li><Link href="/annonces?type=LOCATION" className="hover:text-primary transition-colors">Louer</Link></li>
           </ul>
          </div>

          {/* Colonne 3 : Légal */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Légal</h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li><Link href="/cgu" className="hover:text-primary transition-colors">Conditions d&apos;utilisation</Link></li>
              <li><Link href="/confidentialite" className="hover:text-primary transition-colors">Politique de confidentialité</Link></li>
              <li><Link href="/mentions-legales" className="hover:text-primary transition-colors">Mentions légales</Link></li>
            </ul>
          </div>

          {/* Colonne 4 : Contact */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Contact</h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <a href="mailto:contact@agenceweb.fr" className="hover:text-primary transition-colors">contact@agenceweb.fr</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <a href="tel:+33123456789" className="hover:text-primary transition-colors">01 23 45 67 89</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Ligne du bas : Copyright */}
        <div className="mt-12 border-t border-gray-100 pt-8 text-center md:flex md:items-center md:justify-between md:text-left">
          <p className="text-sm text-gray-500">
            &copy; {annee} AgenceWeb. Tous droits réservés.
          </p>
          <p className="mt-2 text-sm text-gray-500 md:mt-0">
            Fait avec passion en France.
          </p>
        </div>
      </div>
    </footer>
  );
}