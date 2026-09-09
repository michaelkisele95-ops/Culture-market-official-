/*
  store.js — Gère toutes les données de l'application :
  - Produits, Commandes, Comptes clients, Livreurs
  - Cache local (localStorage) : affichage instantané, fonctionne hors-ligne
  - Google Sheet = SOURCE DE VÉRITÉ dès que js/config.js > googleScriptUrl est configuré :
    * Au chargement, l'app récupère automatiquement les dernières données du Sheet.
    * Chaque modification (produit, commande, compte, livreur) est automatiquement
      renvoyée vers le Sheet, sans bouton à cliquer.
    * Une vérification périodique (toutes les 20 secondes) récupère les changements
      faits depuis un AUTRE téléphone ou directement dans le Sheet.
    → Aucune dépendance à un téléphone en particulier : le Sheet fait autorité pour tous.
*/

const CultureStore = (() => {
  const KEYS = {
    produits: "culture_produits",
    commandes: "culture_commandes",
    comptes: "culture_comptes",
    livreurs: "culture_livreurs"
  };

const PRODUITS_DEFAUT = [
    { id: "p1", nom: "Tomates", emoji: "🍅", image: "assets/produits/tomates.jpg", unite: "kg", prix: 4500, disponible: true, description: "" },
    { id: "p2", nom: "Oignons rouges", emoji: "🧅", image: "assets/produits/oignons-rouges.jpg", unite: "kg", prix: 5000, disponible: true, description: "" },
    { id: "p3", nom: "Oignons blancs", emoji: "🧅", image: "assets/produits/oignons-blancs.jpg", unite: "kg", prix: 5000, disponible: true, description: "" },
    { id: "p4", nom: "Oignons verts (ciboule)", emoji: "🌱", image: "assets/produits/oignons-verts.jpg", unite: "botte", prix: 6000, disponible: true, description: "" },
    { id: "p5", nom: "Piments verts", emoji: "🌶️", image: "assets/produits/piments-verts.jpg", unite: "kg", prix: 5000, disponible: true, description: "" },
    { id: "p6", nom: "Piment rouge (pili-pili)", emoji: "🌶️", image: "assets/produits/piment-rouge-pili-pili.jpg", unite: "kg", prix: 6000, disponible: true, description: "" },
    { id: "p7", nom: "Poivrons", emoji: "🫑", image: "assets/produits/poivrons.jpg", unite: "kg", prix: 7000, disponible: true, description: "" },
    { id: "p8", nom: "Ail", emoji: "🧄", image: "assets/produits/ail.jpg", unite: "kg", prix: 18000, disponible: true, description: "" },
    { id: "p9", nom: "Gingembre", emoji: "🫚", image: "assets/produits/gingembre.jpg", unite: "kg", prix: 15000, disponible: true, description: "" },
    { id: "p10", nom: "Carottes", emoji: "🥕", image: "assets/produits/carottes.jpg", unite: "kg", prix: 7000, disponible: true, description: "" },
    { id: "p11", nom: "Chou", emoji: "🥬", image: "assets/produits/chou.jpg", unite: "unité", prix: 3500, disponible: true, description: "" },
    { id: "p12", nom: "Aubergine", emoji: "🍆", image: "assets/produits/aubergines.jpg", unite: "kg", prix: 4500, disponible: true, description: "" },
    { id: "p13", nom: "Gombo", emoji: "🌿", image: "assets/produits/gombo.jpg", unite: "kg", prix: 6000, disponible: true, description: "" },
    { id: "p14", nom: "Concombre", emoji: "🥒", image: "assets/produits/concombres.jpg", unite: "kg", prix: 4500, disponible: true, description: "" },
    { id: "p15", nom: "Haricots verts", emoji: "🫛", image: "assets/produits/haricots-verts.jpg", unite: "kg", prix: 6000, disponible: true, description: "" },
    { id: "p16", nom: "Laitue", emoji: "🥬", image: "assets/produits/laitue.jpg", unite: "unité", prix: 3000, disponible: true, description: "" },
    { id: "p17", nom: "Feuilles de manioc", emoji: "🌿", image: "assets/produits/feuilles-de-manioc.jpg", unite: "botte", prix: 4000, disponible: true, description: "" },
    { id: "p18", nom: "Épinards", emoji: "🥬", image: "assets/produits/epinards.jpg", unite: "botte", prix: 4000, disponible: true, description: "" },
    { id: "p19", nom: "Persil", emoji: "🌿", image: "assets/produits/persil.jpg", unite: "botte", prix: 3500, disponible: true, description: "" },
    { id: "p20", nom: "Céleri", emoji: "🥬", image: "assets/produits/celeri.jpg", unite: "botte", prix: 10000, disponible: true, description: "" },
    { id: "p21", nom: "Pommes de terre", emoji: "🥔", image: "assets/produits/pommes-de-terre.jpg", unite: "kg", prix: 4000, disponible: true, description: "" },
    { id: "p22", nom: "Patates douces", emoji: "🍠", image: "assets/produits/patates-douces.jpg", unite: "kg", prix: 4000, disponible: true, description: "" },
    { id: "p23", nom: "Manioc frais", emoji: "🥔", image: "assets/produits/manioc-frais.jpg", unite: "kg", prix: 3500, disponible: true, description: "" },
    { id: "p24", nom: "Ignames", emoji: "🍠", image: "assets/produits/ignames.jpg", unite: "kg", prix: 6000, disponible: true, description: "" },
    { id: "p25", nom: "Bananes plantains", emoji: "🍌", image: "assets/produits/bananes-plantains.jpg", unite: "régime", prix: 4000, disponible: true, description: "" },
    { id: "p26", nom: "Maïs", emoji: "🌽", image: "assets/produits/mais.jpg", unite: "unité", prix: 3000, disponible: true, description: "" },
    { id: "p27", nom: "Avocat", emoji: "🥑", image: "assets/produits/avocat.jpg", unite: "kg", prix: 5000, disponible: true, description: "" },
    { id: "p28", nom: "Betterave", emoji: "🍠", image: "assets/produits/betterave.jpg", unite: "kg", prix: 5000, disponible: true, description: "" },
    { id: "p29", nom: "Citrouille", emoji: "🎃", image: "assets/produits/citrouille.jpg", unite: "kg", prix: 4000, disponible: true, description: "" },
    { id: "p30", nom: "Brocoli", emoji: "🥦", image: "assets/produits/brocoli.jpg", unite: "kg", prix: 8000, disponible: true, description: "" },
    { id: "p31", nom: "Chou-fleur", emoji: "🥦", image: "assets/produits/chou-fleur.jpg", unite: "unité", prix: 7000, disponible: true, description: "" },
    { id: "p32", nom: "Champignons frais", emoji: "🍄", image: "assets/produits/champignons-frais.jpg", unite: "kg", prix: 12000, disponible: true, description: "" },
    { id: "p33", nom: "Feuilles d'amarante", emoji: "🌿", image: "assets/produits/feuilles-damarante.jpg", unite: "botte", prix: 4000, disponible: true, description: "" },
    { id: "p34", nom: "Chou kale (sukuma wiki)", emoji: "🥬", image: "assets/produits/chou-kale.jpg", unite: "botte", prix: 5000, disponible: true, description: "" },
    { id: "p35", nom: "Feuilles de moringa", emoji: "🌿", image: "assets/produits/feuilles-de-moringa.jpg", unite: "botte", prix: 5000, disponible: true, description: "" },
    { id: "p36", nom: "Corète potagère (ewedu)", emoji: "🌿", image: "assets/produits/corete-potagere.jpg", unite: "botte", prix: 4000, disponible: true, description: "" },
    { id: "p37", nom: "Morelle noire (managu)", emoji: "🌿", image: "assets/produits/morelle-noire.jpg", unite: "botte", prix: 4000, disponible: true, description: "" },
    { id: "p38", nom: "Feuilles de niébé", emoji: "🌿", image: "assets/produits/feuilles-de-niebe.jpg", unite: "botte", prix: 4000, disponible: true, description: "" },
    { id: "p39", nom: "Feuilles de citrouille", emoji: "🌿", image: "assets/produits/feuilles-de-citrouille.jpg", unite: "botte", prix: 4000, disponible: true, description: "" },
    { id: "p40", nom: "Piment oiseau", emoji: "🌶️", image: "assets/produits/piment-oiseau.jpg", unite: "kg", prix: 8000, disponible: true, description: "" },
    { id: "p41", nom: "Roquette", emoji: "🌿", image: "assets/produits/roquette.jpg", unite: "botte", prix: 4500, disponible: true, description: "" },
    { id: "p42", nom: "Arachide bambara", emoji: "🥜", image: "assets/produits/arachide-bambara.jpg", unite: "kg", prix: 9000, disponible: true, description: "" },
    { id: "p43", nom: "Petits pois", emoji: "🫛", image: "assets/produits/petits-pois.jpg", unite: "kg", prix: 8000, disponible: true, description: "" },
    { id: "p44", nom: "Poireaux", emoji: "🌱", image: "assets/produits/poireaux.jpg", unite: "botte", prix: 5000, disponible: true, description: "" },
    { id: "p45", nom: "Navet", emoji: "🥔", image: "assets/produits/navet.jpg", unite: "kg", prix: 4500, disponible: true, description: "" },
    { id: "p46", nom: "Radis blanc (daikon)", emoji: "🥔", image: "assets/produits/radis-blanc.jpg", unite: "kg", prix: 4000, disponible: true, description: "" },
    { id: "p47", nom: "Aubergine locale (garden egg)", emoji: "🍆", image: "assets/produits/aubergine-garden-egg.jpg", unite: "kg", prix: 4000, disponible: true, description: "" },
    { id: "p48", nom: "Cresson", emoji: "🌿", image: "assets/produits/cresson.jpg", unite: "botte", prix: 4000, disponible: true, description: "" },
    { id: "p49", nom: "Coriandre", emoji: "🌿", image: "assets/produits/coriandre.jpg", unite: "botte", prix: 3500, disponible: true, description: "" },
    { id: "p50", nom: "Piment habanero (scotch bonnet)", emoji: "🌶️", image: "assets/produits/piment-habanero.jpg", unite: "kg", prix: 9000, disponible: true, description: "" },
    { id: "p51", nom: "Panier hebdomadaire complet", emoji: "🧺", image: "assets/hero.jpg", unite: "panier", prix: 20000, disponible: true, description: "Une sélection de nos produits phares en quantités utiles pour la semaine — économique par rapport à l'achat au détail." }
  ];

  function _get(key, defaut) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaut;
    } catch (e) {
      console.error("Erreur lecture store", key, e);
      return defaut;
    }
  }
  function _set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function uid(prefix) {
    return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ============================================================
  // ÉTAT DE SYNCHRONISATION (consulté par l'UI pour afficher un indicateur)
  // ============================================================
  const syncInfo = {
    enabled: false,      // true si googleScriptUrl est configuré
    syncing: false,       // une requête est en cours
    lastPullAt: null,      // Date du dernier téléchargement réussi depuis le Sheet
    lastPushAt: null,       // Date du dernier envoi réussi vers le Sheet
    lastError: null          // dernier message d'erreur (ou null)
  };
  function getSyncInfo() { return { ...syncInfo }; }

  function _cacheBustedUrl(base, extraParams) {
    const sep = base.includes("?") ? "&" : "?";
    let url = base + sep + "_t=" + Date.now();
    if (extraParams) url += "&" + extraParams;
    return url;
  }

  // Envoie UNE collection vers le Sheet (arrière-plan, ne bloque jamais l'UI).
  // Utilisé automatiquement après chaque modification locale.
  async function _pushCollection(key, data) {
    const url = CULTURE_CONFIG.googleScriptUrl;
    if (!url) return { ok: false, offline: true };
    syncInfo.syncing = true;
    try {
      const payload = {};
      payload[key] = data;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // évite le pre-flight CORS
        body: JSON.stringify(payload),
        cache: "no-store"
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Échec de synchronisation");
      syncInfo.lastPushAt = new Date();
      syncInfo.lastError = null;
      return json;
    } catch (e) {
      syncInfo.lastError = e.message || String(e);
      console.error("Erreur d'envoi vers Google Sheet (" + key + ")", e);
      return { ok: false, error: syncInfo.lastError };
    } finally {
      syncInfo.syncing = false;
    }
  }

  // Récupère TOUTES les données depuis le Sheet et remplace le cache local.
  // Le Sheet fait autorité : c'est la même donnée sur tous les téléphones.
  async function pullAll() {
    const url = CULTURE_CONFIG.googleScriptUrl;
    if (!url) return null;
    syncInfo.syncing = true;
    try {
      const res = await fetch(_cacheBustedUrl(url), { method: "GET", cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data.produits)) setProduits(data.produits);
      if (Array.isArray(data.commandes)) setCommandes(data.commandes);
      if (Array.isArray(data.comptes)) setComptes(data.comptes);
      if (Array.isArray(data.livreurs)) setLivreurs(data.livreurs);
      syncInfo.lastPullAt = new Date();
      syncInfo.lastError = null;
      return data;
    } catch (e) {
      syncInfo.lastError = e.message || String(e);
      console.error("Erreur de lecture depuis Google Sheet", e);
      return null;
    } finally {
      syncInfo.syncing = false;
    }
  }

  // À appeler une fois au démarrage (app.js / admin.js).
  // - Si le Sheet est configuré mais encore vide (tout premier lancement), on y envoie
  //   notre catalogue de départ pour "amorcer" la base commune à tous les téléphones.
  // - Sinon, on récupère ce qui existe déjà dans le Sheet (qui fait autorité).
  async function init() {
    const url = CULTURE_CONFIG.googleScriptUrl;
    syncInfo.enabled = !!url;
    if (!url) return { offline: true };

    const data = await pullAll();
    const sheetEstVide = !data || !Array.isArray(data.produits) || data.produits.length === 0;
    const dejaAmorce = localStorage.getItem("culture_sheet_bootstrapped") === "1";

    if (sheetEstVide && !dejaAmorce) {
      // Premier téléphone à se connecter : on amorce le Sheet avec le catalogue de départ.
      await _pushCollection("produits", getProduits());
      await _pushCollection("commandes", getCommandes());
      await _pushCollection("comptes", getComptes());
      await _pushCollection("livreurs", getLivreurs());
      localStorage.setItem("culture_sheet_bootstrapped", "1");
    }
    return { offline: false };
  }

  // Vérifie périodiquement si le Sheet a changé (modif faite depuis un autre téléphone,
  // ou directement dans Google Sheet) et prévient l'appelant via onChange().
  function startAutoSync(onChange, intervalMs) {
    if (!CULTURE_CONFIG.googleScriptUrl) return null;
    intervalMs = intervalMs || 20000;
    return setInterval(async () => {
      if (syncInfo.syncing) return; // évite les requêtes qui se chevauchent
      const before = JSON.stringify([getProduits(), getCommandes(), getComptes(), getLivreurs()]);
      await pullAll();
      const after = JSON.stringify([getProduits(), getCommandes(), getComptes(), getLivreurs()]);
      if (before !== after && typeof onChange === "function") onChange();
    }, intervalMs);
  }

  // Boutons "Forcer la synchronisation" de l'admin : envoie/récupère tout d'un coup.
  async function exporterVersGoogleSheet() {
    const url = CULTURE_CONFIG.googleScriptUrl;
    if (!url) throw new Error("Aucune URL Google Sheet configurée (voir config.js).");
    await _pushCollection("produits", getProduits());
    await _pushCollection("commandes", getCommandes());
    await _pushCollection("comptes", getComptes());
    await _pushCollection("livreurs", getLivreurs());
    if (syncInfo.lastError) throw new Error(syncInfo.lastError);
    return { ok: true };
  }
  async function importerDepuisGoogleSheet() {
    const url = CULTURE_CONFIG.googleScriptUrl;
    if (!url) throw new Error("Aucune URL Google Sheet configurée (voir config.js).");
    const data = await pullAll();
    if (!data) throw new Error(syncInfo.lastError || "Échec de la synchronisation.");
    return data;
  }

  // ---------- PRODUITS ----------
  function getProduits() {
    let p = _get(KEYS.produits, null);
    if (!p) { p = PRODUITS_DEFAUT; _set(KEYS.produits, p); }
    return p;
  }
  function setProduits(list) { _set(KEYS.produits, list); }
  function saveProduit(produit) {
    const list = getProduits();
    if (produit.id) {
      const idx = list.findIndex(p => p.id === produit.id);
      if (idx >= 0) list[idx] = produit; else list.push(produit);
    } else {
      produit.id = uid("p");
      list.push(produit);
    }
    setProduits(list);
    _pushCollection("produits", list);
    return produit;
  }
  function deleteProduit(id) {
    const list = getProduits().filter(p => p.id !== id);
    setProduits(list);
    _pushCollection("produits", list);
  }

  // ---------- COMPTES CLIENTS ----------
  function getComptes() { return _get(KEYS.comptes, []); }
  function setComptes(list) { _set(KEYS.comptes, list); }
  function creerDemandeCompte(data) {
    const list = getComptes();
    const compte = {
      id: uid("c"),
      nom: data.nom,
      telephone: data.telephone,
      adresse: data.adresse || "",
      statut: "en_attente", // en_attente | approuve | refuse
      dateCreation: new Date().toISOString()
    };
    list.push(compte);
    setComptes(list);
    _pushCollection("comptes", list);
    return compte;
  }
  function majStatutCompte(id, statut) {
    const list = getComptes();
    const c = list.find(c => c.id === id);
    if (c) { c.statut = statut; setComptes(list); _pushCollection("comptes", list); }
  }
  function supprimerCompte(id) {
    const list = getComptes().filter(c => c.id !== id);
    setComptes(list);
    _pushCollection("comptes", list);
  }

  // ---------- LIVREURS ----------
  function getLivreurs() { return _get(KEYS.livreurs, []); }
  function setLivreurs(list) { _set(KEYS.livreurs, list); }
  function saveLivreur(livreur) {
    const list = getLivreurs();
    if (livreur.id) {
      const idx = list.findIndex(l => l.id === livreur.id);
      if (idx >= 0) list[idx] = livreur; else list.push(livreur);
    } else {
      livreur.id = uid("l");
      list.push(livreur);
    }
    setLivreurs(list);
    _pushCollection("livreurs", list);
    return livreur;
  }
  function supprimerLivreur(id) {
    const list = getLivreurs().filter(l => l.id !== id);
    setLivreurs(list);
    _pushCollection("livreurs", list);
  }

  // ---------- COMMANDES ----------
  function getCommandes() { return _get(KEYS.commandes, []); }
  function setCommandes(list) { _set(KEYS.commandes, list); }
  function creerCommande(data) {
    const list = getCommandes();
    const commande = {
      id: uid("cmd"),
      clientNom: data.clientNom,
      telephone: data.telephone,
      adresse: data.adresse,
      lignes: data.lignes, // [{produitId, nom, qte, prixUnitaire}]
      total: data.total,
      statut: "en_attente", // en_attente | confirmee | en_livraison | livree | annulee
      livreurId: null,
      date: new Date().toISOString()
    };
    list.push(commande);
    setCommandes(list);
    _pushCollection("commandes", list);
    return commande;
  }
  function majCommande(id, patch) {
    const list = getCommandes();
    const c = list.find(c => c.id === id);
    if (c) { Object.assign(c, patch); setCommandes(list); _pushCollection("commandes", list); }
    return c;
  }
  function annulerCommande(id) { majCommande(id, { statut: "annulee" }); }

  return {
    getProduits, setProduits, saveProduit, deleteProduit,
    getComptes, setComptes, creerDemandeCompte, majStatutCompte, supprimerCompte,
    getLivreurs, setLivreurs, saveLivreur, supprimerLivreur,
    getCommandes, setCommandes, creerCommande, majCommande, annulerCommande,
    init, pullAll, startAutoSync, getSyncInfo,
    exporterVersGoogleSheet, importerDepuisGoogleSheet
  };
})();
