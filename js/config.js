/*
  ============================================================
  CONFIG.JS — C'EST ICI QUE VOUS PERSONNALISEZ VOTRE SITE
  ============================================================
  Modifiez uniquement les valeurs entre guillemets " ".
  Ne touchez pas aux noms des propriétés (à gauche des ":").
*/

const CULTURE_CONFIG = {
  // ---------- IDENTITÉ ----------
  nomEntreprise: "Culture",
  slogan: "Cultiver une meilleure manière de vivre",
  logo: "assets/logo/culture-logo.jpg", // logo officiel Culture (médaillon)

  presentation:
    "Culture est une entreprise agri-marketing qui cultive et distribue des produits frais, sains et locaux : légumes, aromates et paniers hebdomadaires livrés directement chez vous ou en point relais. Notre mission : rapprocher le marché local de votre table.",

  // ---------- CONTACT ----------
  // "contact" = contact principal (utilisé pour les commandes et le bouton WhatsApp).
  // "contactSecondaire" = deuxième contact affiché sur la page Contact.
  contact: {
    responsable: "Tshilanda Tshomba Djenny",
    telephone: "+243 993 867 191",
    whatsapp: "243993867191", // format international SANS le "+" ni espace (pour les liens wa.me)
    email: "kahengaexauce47@gmail.com"
  },
  contactSecondaire: {
    responsable: "Mambu Felo Precylia",
    telephone: "+243 992 999 381",
    whatsapp: "243992999381",
    email: "precyliafelo@yahoo.com"
  },

  // ---------- RÉSEAUX SOCIAUX (laissez vide "" si vous n'avez pas le compte) ----------
  reseauxSociaux: {
    facebook: "",
    instagram: "",
    tiktok: "",
    whatsappChaine: ""
  },

  // ---------- LOCALISATION ----------
  localisation: {
    adresseTexte: "Commune de ..., Ville ...",
    // Lien Google Maps de votre point de vente (clic droit sur Google Maps > "Partager" > "Intégrer une carte" pour l'iframe,
    // ou simplement collez le lien normal ici, il sera utilisé pour le bouton "Ouvrir dans Maps")
    lienGoogleMaps: "https://maps.google.com/?q=Culture+Market",
    latitude: 0.0,
    longitude: 0.0
  },

  // ---------- LIVRAISON ----------
  livraison: {
    horaires: "9h à 11h",
    jours: "Du lundi au samedi",
    zoneCouverte: "À préciser"
  },

  // ---------- GOOGLE SHEET (synchronisation) ----------
  // Laissez vide pour utiliser uniquement le stockage local (fonctionne sans internet).
  // Voir GUIDE.md pour savoir comment obtenir cette URL (déploiement Google Apps Script).
  googleScriptUrl: "https://script.google.com/macros/s/AKfycbzVJhfUWNlm39AHxNQc3KR0hF0iCwmK_t5pELvOiIZLVY9XqwBQ9Hu8BdzqPddrGk2v/exec",

  // ---------- SÉCURITÉ ADMIN ----------
  // ⚠️ IMPORTANT : le mot de passe admin n'est PAS stocké ici (ni dans aucun fichier du site).
  // Il n'existe donc AUCUN mot de passe visible via F12 / "voir le code source".
  //
  // → Méthode recommandée (sécurisée) : configurez "googleScriptUrl" ci-dessus, puis définissez
  //   votre mot de passe dans Google Apps Script (Paramètres du projet → Propriétés du script
  //   → clé "ADMIN_PASSWORD"). Voir GUIDE.md, section 5.
  //
  // → Méthode locale (mode hors-ligne / test, avant d'avoir configuré Google Sheet) :
  //   la toute première fois que vous ouvrez admin.html, le mot de passe que vous saisissez
  //   est enregistré (sous forme chiffrée) uniquement sur VOTRE appareil, jamais dans un
  //   fichier du site. Voir GUIDE.md, section 4, pour les détails et les limites de ce mode.
};
