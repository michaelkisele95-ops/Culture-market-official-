// app.js — Espace client Culture

document.addEventListener("DOMContentLoaded", () => {
  const cfg = CULTURE_CONFIG;
  let panier = {}; // { produitId: qte }

  // ---------- Enregistrement du service worker (mode PWA hors-ligne) ----------
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(console.error);
    });
  }

  // ---------- Habillage avec config.js ----------
  document.getElementById("nom-entreprise").textContent = cfg.nomEntreprise;
  document.getElementById("hero-nom").textContent = cfg.nomEntreprise;
  document.getElementById("slogan").textContent = cfg.slogan;
  document.getElementById("logo-img").src = cfg.logo || "assets/logo/culture-logo.jpg";
  document.getElementById("presentation-text").textContent = cfg.presentation;
  document.getElementById("annee").textContent = new Date().getFullYear();

  // ---------- CONTACTS (un ou plusieurs, cf. config.js) ----------
  const contacts = [cfg.contact, cfg.contactSecondaire].filter(Boolean);
  const contactsContainer = document.getElementById("contacts-container");
  contactsContainer.innerHTML = contacts.map(c => `
    <div class="card contact-card">
      <h3>${c.responsable}</h3>
      <ul class="contact-list">
        <li><span class="icon"><img src="assets/social/phone.png" alt="Téléphone" style="width:20px;height:20px;object-fit:contain;"></span> <a href="tel:${c.telephone.replace(/\s/g, "")}">${c.telephone}</a></li>
        <li><span class="icon">✉️</span> <a href="mailto:${c.email}">${c.email}</a></li>
      </ul>
      <a class="btn btn-primary btn-block" style="margin-top:10px;display:flex;align-items:center;justify-content:center;gap:8px;" href="https://wa.me/${c.whatsapp}" target="_blank">
        <img src="assets/social/whatsapp.png" alt="" style="width:20px;height:20px;object-fit:contain;"> Écrire sur WhatsApp
      </a>
    </div>
  `).join("");

  document.getElementById("adresse-texte").textContent = cfg.localisation.adresseTexte;
  document.getElementById("livraison-horaires").textContent = cfg.livraison.horaires;
  document.getElementById("livraison-jours").textContent = cfg.livraison.jours;
  document.getElementById("btn-maps").href = cfg.localisation.lienGoogleMaps;

  // Réseaux sociaux (icônes réelles, cf. assets/social/)
  const socialIcons = {
    facebook: "assets/social/facebook.png",
    instagram: "assets/social/instagram.png",
    tiktok: "assets/social/tiktok.png",
    whatsappChaine: "assets/social/whatsapp.png"
  };
  const socialRow = document.getElementById("social-row");
  Object.entries(cfg.reseauxSociaux).forEach(([key, url]) => {
    if (url) {
      const a = document.createElement("a");
      a.href = url; a.target = "_blank"; a.title = key;
      const img = document.createElement("img");
      img.src = socialIcons[key] || "";
      img.alt = key;
      a.appendChild(img);
      socialRow.appendChild(a);
    }
  });
  if (!socialRow.children.length) {
    socialRow.innerHTML = "<p style='font-size:0.8rem;color:#999;'>Liens à configurer dans js/config.js</p>";
  }

  // ======================================================
  // NAVIGATION PAR PAGES (écrans empilés avec animation)
  // Un clic ouvre une nouvelle "page" (aucun défilement/ancre).
  // ======================================================
  const stack = document.getElementById("app-stack");
  let currentPage = "accueil";

  function goToPage(target) {
    if (target === currentPage) { scrollStackTop(); return; }
    const oldEl = stack.querySelector(`.page[data-page="${currentPage}"]`);
    const newEl = stack.querySelector(`.page[data-page="${target}"]`);
    if (!newEl) return;

    document.querySelectorAll(".tab-nav button, .bottom-nav button").forEach(b => {
      b.classList.toggle("active", b.dataset.page === target);
    });

    if (oldEl) {
      oldEl.classList.remove("active");
      oldEl.classList.add("leaving");
      setTimeout(() => oldEl.classList.remove("leaving"), 240);
    }
    newEl.classList.add("active");
    currentPage = target;
    scrollStackTop();
  }
  function scrollStackTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.querySelectorAll("[data-page]").forEach(btn => {
    btn.addEventListener("click", () => goToPage(btn.dataset.page));
  });
  document.querySelectorAll("[data-nav]").forEach(btn => {
    btn.addEventListener("click", () => goToPage(btn.dataset.nav));
  });

  // ---------- Toast ----------
  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2200);
  }

  // ---------- Modales ----------
  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => document.querySelector(btn.dataset.close).classList.remove("open"));
  });

  // ---------- PRODUITS ----------
  function renderProduits() {
    const grid = document.getElementById("produits-grid");
    const produits = CultureStore.getProduits();
    grid.innerHTML = "";
    produits.forEach((p, i) => {
      const qte = panier[p.id] || 0;
      const div = document.createElement("div");
      div.className = "produit-card" + (p.disponible ? "" : " indisponible");
      div.style.animationDelay = (i * 0.06) + "s";
      const photo = p.image
        ? `<img src="${p.image}" alt="${p.nom}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'emoji-fallback\\'>${p.emoji || "🥬"}</div>'">`
        : `<div class="emoji-fallback">${p.emoji || "🥬"}</div>`;
      div.innerHTML = `
        <div class="photo-wrap">
          ${photo}
          <span class="prix-tag">${p.prix.toLocaleString("fr-FR")} FC</span>
        </div>
        <div class="infos">
          <h3>${p.nom}</h3>
          <div class="unite-label">par ${p.unite}</div>
          ${p.disponible ? `
            <div class="qte-row">
              <button data-act="moins" data-id="${p.id}">−</button>
              <input type="number" min="0" value="${qte}" data-qte="${p.id}" />
              <button data-act="plus" data-id="${p.id}">+</button>
            </div>
            <button class="btn-add" data-add="${p.id}">Ajouter au panier</button>
          ` : `<p style="color:#b33a3a;font-size:0.78rem;margin-top:auto;">Indisponible actuellement</p>`}
        </div>`;
      grid.appendChild(div);
    });

    grid.querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", () => {
      const input = grid.querySelector(`[data-qte="${b.dataset.id}"]`);
      let v = parseInt(input.value || "0", 10);
      v = b.dataset.act === "plus" ? v + 1 : Math.max(0, v - 1);
      input.value = v;
    }));
    grid.querySelectorAll("[data-add]").forEach(b => b.addEventListener("click", () => {
      const id = b.dataset.add;
      const input = grid.querySelector(`[data-qte="${id}"]`);
      const v = Math.max(1, parseInt(input.value || "1", 10));
      panier[id] = (panier[id] || 0) + v;
      input.value = panier[id];
      toast("Ajouté au panier ✅");
      renderPanier();
    }));
  }

  // ---------- PANIER ----------
  function renderPanier() {
    const produits = CultureStore.getProduits();
    const lignesDiv = document.getElementById("cart-lines");
    const entries = Object.entries(panier).filter(([, q]) => q > 0);
    let total = 0;
    if (!entries.length) {
      lignesDiv.innerHTML = `<div class="empty-state">Votre panier est vide. Ajoutez des produits depuis l'onglet « Produits ».</div>`;
    } else {
      lignesDiv.innerHTML = entries.map(([id, qte]) => {
        const p = produits.find(p => p.id === id);
        if (!p) return "";
        const sousTotal = p.prix * qte;
        total += sousTotal;
        return `<div class="cart-line"><span>${p.nom} × ${qte}</span><span>${sousTotal.toLocaleString("fr-FR")} FC</span></div>`;
      }).join("");
    }
    document.getElementById("cart-total").textContent = total.toLocaleString("fr-FR") + " FC";
    const countEl = document.getElementById("cart-count");
    const count = entries.reduce((s, [, q]) => s + q, 0);
    countEl.textContent = count;
    countEl.style.display = count > 0 ? "flex" : "none";
    return total;
  }

  document.getElementById("btn-commander").addEventListener("click", () => {
    const total = renderPanier();
    if (total <= 0) { toast("Votre panier est vide."); return; }
    document.getElementById("modal-commande").classList.add("open");
  });

  document.getElementById("btn-confirmer-commande").addEventListener("click", () => {
    const nom = document.getElementById("cmd-nom").value.trim();
    const tel = document.getElementById("cmd-tel").value.trim();
    const adresse = document.getElementById("cmd-adresse").value.trim();
    if (!nom || !tel || !adresse) { toast("Merci de remplir tous les champs."); return; }

    const produits = CultureStore.getProduits();
    const lignes = Object.entries(panier).filter(([, q]) => q > 0).map(([id, qte]) => {
      const p = produits.find(p => p.id === id);
      return { produitId: id, nom: p.nom, qte, prixUnitaire: p.prix };
    });
    const total = lignes.reduce((s, l) => s + l.qte * l.prixUnitaire, 0);

    const commande = CultureStore.creerCommande({ clientNom: nom, telephone: tel, adresse, lignes, total });

    const detail = lignes.map(l => `- ${l.nom} x${l.qte} (${(l.qte * l.prixUnitaire).toLocaleString("fr-FR")} FC)`).join("%0A");
    const texte = `Bonjour Culture, je souhaite passer une commande (Réf ${commande.id}) :%0A${detail}%0ATotal : ${total.toLocaleString("fr-FR")} FC%0AAdresse : ${adresse}%0ANom : ${nom}`;
    const lienWA = `https://wa.me/${cfg.contact.whatsapp}?text=${texte}`;

    panier = {};
    renderPanier();
    renderProduits();
    document.getElementById("modal-commande").classList.remove("open");
    toast("Commande envoyée ✅ Réf : " + commande.id);
    window.open(lienWA, "_blank");
  });

  // ---------- MES COMMANDES / LIVRAISON ----------
  const STATUT_LABEL = {
    en_attente: "En attente", confirmee: "Confirmée", en_livraison: "En livraison",
    livree: "Livrée", annulee: "Annulée"
  };

  document.getElementById("btn-lookup").addEventListener("click", async () => {
    const tel = document.getElementById("lookup-tel").value.trim();
    const zone = document.getElementById("mes-commandes-liste");
    if (!tel) { toast("Entrez votre numéro."); return; }
    zone.innerHTML = `<div class="empty-state">Recherche en cours…</div>`;
    await CultureStore.pullAll(); // s'assure d'avoir le tout dernier statut avant d'afficher
    const commandes = CultureStore.getCommandes().filter(c => c.telephone.replace(/\D/g, "").includes(tel.replace(/\D/g, "")));
    if (!commandes.length) { zone.innerHTML = `<div class="empty-state">Aucune commande trouvée pour ce numéro.</div>`; return; }
    const livreurs = CultureStore.getLivreurs();
    zone.innerHTML = commandes.reverse().map(c => {
      const livreur = livreurs.find(l => l.id === c.livreurId);
      const peutAnnuler = c.statut === "en_attente" || c.statut === "confirmee";
      return `
        <div class="card" style="margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong>Réf ${c.id}</strong>
            <span class="statut-pill statut-${c.statut}">${STATUT_LABEL[c.statut]}</span>
          </div>
          <p style="font-size:0.82rem;color:#666;margin:6px 0;">${new Date(c.date).toLocaleString("fr-FR")} — Total : ${c.total.toLocaleString("fr-FR")} FC</p>
          ${livreur ? `<div class="livreur-box">🚴 Livreur : <strong>${livreur.nom}</strong> — <a href="tel:${livreur.telephone}">${livreur.telephone}</a></div>` : ""}
          ${peutAnnuler ? `<button class="btn btn-danger" style="margin-top:8px;" data-annuler="${c.id}">Annuler la livraison</button>`
            : (c.statut === "en_livraison" ? `<button class="btn btn-outline" style="margin-top:8px;" data-demande="${c.id}">📞 Demander où en est ma livraison</button>` : "")}
        </div>`;
    }).join("");

    zone.querySelectorAll("[data-annuler]").forEach(b => b.addEventListener("click", () => {
      CultureStore.annulerCommande(b.dataset.annuler);
      toast("Commande annulée.");
      document.getElementById("btn-lookup").click();
    }));
    zone.querySelectorAll("[data-demande]").forEach(b => b.addEventListener("click", () => {
      window.open(`https://wa.me/${cfg.contact.whatsapp}?text=Bonjour, où en est ma livraison Réf ${b.dataset.demande} ?`, "_blank");
    }));
  });

  // ---------- ABONNEMENT / COMPTE / QR ----------
  document.getElementById("btn-abonner").addEventListener("click", () => {
    document.getElementById("modal-abonnement").classList.add("open");
  });
  document.getElementById("btn-envoyer-abonnement").addEventListener("click", () => {
    const nom = document.getElementById("ab-nom").value.trim();
    const telephone = document.getElementById("ab-tel").value.trim();
    const adresse = document.getElementById("ab-adresse").value.trim();
    if (!nom || !telephone) { toast("Nom et téléphone requis."); return; }
    const compte = CultureStore.creerDemandeCompte({ nom, telephone, adresse });
    localStorage.setItem("culture_mon_compte_id", compte.id);
    document.getElementById("modal-abonnement").classList.remove("open");
    toast("Demande envoyée ! En attente d'approbation.");
    renderQR();
  });

  function renderQR() {
    const zone = document.getElementById("qrcode-canvas");
    const caption = document.getElementById("qr-caption");
    zone.innerHTML = "";
    const monCompteId = localStorage.getItem("culture_mon_compte_id");
    if (!monCompteId) {
      caption.textContent = "Abonnez-vous pour générer votre QR code personnel.";
      return;
    }
    const comptes = CultureStore.getComptes();
    const compte = comptes.find(c => c.id === monCompteId);
    if (!compte) { caption.textContent = ""; return; }
    const lien = window.location.origin + window.location.pathname + "?compte=" + compte.id;
    if (window.QRCode) {
      new QRCode(zone, { text: lien, width: 160, height: 160, colorDark: "#163526", colorLight: "#f7f2e7" });
    }
    const label = compte.statut === "approuve" ? "✅ Compte actif" : compte.statut === "refuse" ? "❌ Demande refusée" : "⏳ En attente d'approbation";
    caption.textContent = label + " — scannez pour retrouver votre espace";
  }

  // ---------- INIT ----------
  // 1) Affichage immédiat avec les données déjà en cache (rapide, fonctionne hors-ligne)
  renderProduits();
  renderPanier();
  renderQR();

  // 2) Récupération des données à jour depuis Google Sheet (si configuré) — corrige
  //    automatiquement les écarts entre téléphones, sans action de l'utilisateur.
  CultureStore.init().then(() => {
    renderProduits();
    renderQR();
  });

  // 3) Vérification périodique : si quelqu'un modifie un prix ailleurs (autre téléphone,
  //    ou directement dans le Sheet), l'app se met à jour toute seule.
  CultureStore.startAutoSync(() => {
    renderProduits();
    renderQR();
  });
});
