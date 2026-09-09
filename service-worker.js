// service-worker.js
// Gère la mise en cache pour un fonctionnement hors-ligne et une ouverture instantanée.
// IMPORTANT : à chaque modification importante du site, changez CACHE_NAME (ex: culture-v2)
// pour forcer la mise à jour du cache chez vos clients.

const CACHE_NAME = "culture-v4";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./admin.html",
  "./manifest.json",
  "./css/style.css",
  "./css/admin.css",
  "./js/config.js",
  "./js/store.js",
  "./js/app.js",
  "./js/admin.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./assets/logo/culture-logo.jpg",
  "./assets/hero.jpg",
  "./assets/produits/ail.jpg",
  "./assets/produits/arachide-bambara.jpg",
  "./assets/produits/aubergines.jpg",
  "./assets/produits/aubergine-garden-egg.jpg",
  "./assets/produits/avocat.jpg",
  "./assets/produits/bananes-plantains.jpg",
  "./assets/produits/betterave.jpg",
  "./assets/produits/brocoli.jpg",
  "./assets/produits/carottes.jpg",
  "./assets/produits/celeri.jpg",
  "./assets/produits/champignons-frais.jpg",
  "./assets/produits/chou.jpg",
  "./assets/produits/chou-fleur.jpg",
  "./assets/produits/chou-kale.jpg",
  "./assets/produits/citrouille.jpg",
  "./assets/produits/concombres.jpg",
  "./assets/produits/corete-potagere.jpg",
  "./assets/produits/coriandre.jpg",
  "./assets/produits/cresson.jpg",
  "./assets/produits/epinards.jpg",
  "./assets/produits/feuilles-damarante.jpg",
  "./assets/produits/feuilles-de-citrouille.jpg",
  "./assets/produits/feuilles-de-manioc.jpg",
  "./assets/produits/feuilles-de-moringa.jpg",
  "./assets/produits/feuilles-de-niebe.jpg",
  "./assets/produits/gingembre.jpg",
  "./assets/produits/gombo.jpg",
  "./assets/produits/haricots-verts.jpg",
  "./assets/produits/ignames.jpg",
  "./assets/produits/laitue.jpg",
  "./assets/produits/mais.jpg",
  "./assets/produits/manioc-frais.jpg",
  "./assets/produits/morelle-noire.jpg",
  "./assets/produits/navet.jpg",
  "./assets/produits/oignons-blancs.jpg",
  "./assets/produits/oignons-rouges.jpg",
  "./assets/produits/oignons-verts.jpg",
  "./assets/produits/patates-douces.jpg",
  "./assets/produits/persil.jpg",
  "./assets/produits/petits-pois.jpg",
  "./assets/produits/piment-habanero.jpg",
  "./assets/produits/piment-oiseau.jpg",
  "./assets/produits/piment-rouge-pili-pili.jpg",
  "./assets/produits/piments-verts.jpg",
  "./assets/produits/poireaux.jpg",
  "./assets/produits/poivrons.jpg",
  "./assets/produits/poivrons-verts.jpg",
  "./assets/produits/pommes-de-terre.jpg",
  "./assets/produits/radis-blanc.jpg",
  "./assets/produits/roquette.jpg",
  "./assets/produits/tomates.jpg",
  "./assets/social/whatsapp.png",
  "./assets/social/instagram.png",
  "./assets/social/tiktok.png",
  "./assets/social/facebook.png",
  "./assets/social/linkedin.png",
  "./assets/social/youtube.png",
  "./assets/social/phone.png",
  "./assets/social/googlemaps.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // On ne met jamais en cache les appels vers Google Sheet (toujours en réseau)
  if (event.request.url.includes("script.google.com")) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request)
          .then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            return response;
          })
          .catch(() => cached)
      );
    })
  );
});
