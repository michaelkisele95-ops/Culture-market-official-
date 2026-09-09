// admin.js — Espace de gestion privé Culture

document.addEventListener("DOMContentLoaded", () => {
  const cfg = CULTURE_CONFIG;

  // ---------- TOAST ----------
  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2200);
  }

  // ---------- CONNEXION SÉCURISÉE ----------
  // Aucun mot de passe n'est jamais écrit dans ce fichier ni dans config.js.
  // - Si googleScriptUrl est configuré : le mot de passe est vérifié côté serveur
  //   (Google Apps Script), donc invisible même en inspectant le code (F12).
  // - Sinon (mode local / hors-ligne) : au tout premier lancement, le mot de passe saisi
  //   est haché (SHA-256) et le hachage seul est gardé dans le navigateur — le mot de
  //   passe en clair ne transite ni n'est stocké nulle part.
  const loginScreen = document.getElementById("login-screen");
  const adminApp = document.getElementById("admin-app");
  const LOCAL_HASH_KEY = "culture_admin_hash_v1";

  async function sha256(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  function checkSession() {
    if (sessionStorage.getItem("culture_admin_ok") === "1") {
      loginScreen.style.display = "none";
      adminApp.classList.add("open");
      initAdmin();
    } else {
      // Affiche un indice sur le mode de sécurité actif
      const hint = document.getElementById("login-mode-hint");
      if (hint) {
        hint.textContent = cfg.googleScriptUrl
          ? "🔒 Vérification sécurisée via Google Sheet."
          : "🟡 Mode local (hors-ligne) — connectez Google Sheet pour une sécurité renforcée (voir GUIDE.md).";
      }
    }
  }

  async function attemptLogin(password) {
    const errorEl = document.getElementById("login-error");
    errorEl.textContent = "";

    if (cfg.googleScriptUrl) {
      // ---- Vérification côté serveur (recommandé) ----
      try {
        const res = await fetch(cfg.googleScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "login", password })
        });
        const data = await res.json();
        if (data.ok) {
          sessionStorage.setItem("culture_admin_ok", "1");
          checkSession();
        } else {
          errorEl.textContent = data.error || "Mot de passe incorrect.";
        }
      } catch (e) {
        errorEl.textContent = "Impossible de joindre Google Sheet pour vérifier le mot de passe.";
      }
    } else {
      // ---- Mode local (hors-ligne) ----
      const hash = await sha256(password);
      const stored = localStorage.getItem(LOCAL_HASH_KEY);
      if (!stored) {
        // Premier lancement : on définit ce mot de passe comme mot de passe local
        localStorage.setItem(LOCAL_HASH_KEY, hash);
        sessionStorage.setItem("culture_admin_ok", "1");
        toast("Mot de passe local créé ✅");
        checkSession();
      } else if (stored === hash) {
        sessionStorage.setItem("culture_admin_ok", "1");
        checkSession();
      } else {
        errorEl.textContent = "Mot de passe incorrect.";
      }
    }
  }

  document.getElementById("btn-login").addEventListener("click", () => {
    const val = document.getElementById("login-password").value;
    if (!val) return;
    attemptLogin(val);
  });
  document.getElementById("login-password").addEventListener("keydown", e => {
    if (e.key === "Enter") document.getElementById("btn-login").click();
  });
  document.getElementById("btn-logout").addEventListener("click", () => {
    sessionStorage.removeItem("culture_admin_ok");
    location.reload();
  });
  document.getElementById("link-reset-local").addEventListener("click", (e) => {
    e.preventDefault();
    if (cfg.googleScriptUrl) {
      alert("La sécurité est gérée par Google Sheet : modifiez la propriété ADMIN_PASSWORD dans Apps Script.");
      return;
    }
    if (confirm("Cela efface le mot de passe local actuel de CET appareil. Vous pourrez ensuite en redéfinir un nouveau. Continuer ?")) {
      localStorage.removeItem(LOCAL_HASH_KEY);
      toast("Mot de passe local réinitialisé. Définissez-en un nouveau.");
    }
  });

  checkSession();

  // ---------- INITIALISATION DE L'ADMIN (une fois connecté) ----------
  let initialized = false;
  function initAdmin() {
    if (initialized) { refreshAll(); return; }
    initialized = true;

    // Navigation entre vues
    document.querySelectorAll(".admin-sidebar nav button").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".admin-sidebar nav button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        document.querySelectorAll(".view").forEach(v => v.style.display = "none");
        document.getElementById("view-" + btn.dataset.view).style.display = "block";
      });
    });

    setupProduits();
    setupComptes();
    setupCommandes();
    setupLivreurs();
    setupSync();
    refreshAll(); // affichage immédiat avec le cache local (rapide)

    // Récupère les toutes dernières données du Sheet (autre téléphone / modif directe
    // dans le Sheet) avant de considérer l'admin comme "à jour".
    CultureStore.init().then(() => { refreshAll(); updateSyncBadge(); });

    // Vérification automatique toutes les 15s pendant que l'admin est ouvert.
    CultureStore.startAutoSync(() => { refreshAll(); }, 15000);
    setInterval(updateSyncBadge, 3000);
    updateSyncBadge();
  }

  function updateSyncBadge() {
    const el = document.getElementById("sync-badge");
    if (!el) return;
    const info = CultureStore.getSyncInfo();
    if (!info.enabled) {
      el.textContent = "⚪ Mode local uniquement (Google Sheet non configuré)";
      el.className = "sync-badge sync-off";
    } else if (info.syncing) {
      el.textContent = "🟡 Synchronisation…";
      el.className = "sync-badge sync-busy";
    } else if (info.lastError) {
      el.textContent = "🔴 Erreur de synchronisation : " + info.lastError;
      el.className = "sync-badge sync-error";
    } else if (info.lastPullAt) {
      const secs = Math.round((Date.now() - info.lastPullAt.getTime()) / 1000);
      const when = secs < 5 ? "à l'instant" : secs < 60 ? `il y a ${secs}s` : `il y a ${Math.round(secs/60)} min`;
      el.textContent = `🟢 Synchronisé avec Google Sheet — dernière vérification ${when}`;
      el.className = "sync-badge sync-ok";
    } else {
      el.textContent = "🟡 Connexion à Google Sheet…";
      el.className = "sync-badge sync-busy";
    }
  }

  function refreshAll() {
    renderDashboard();
    renderProduits();
    renderComptes();
    renderCommandes();
    renderLivreurs();
    document.getElementById("sync-url").textContent = cfg.googleScriptUrl || "(aucune — stockage local uniquement)";
  }

  // ==================== DASHBOARD ====================
  const STATUT_LABEL = {
    en_attente: "En attente", confirmee: "Confirmée", en_livraison: "En livraison",
    livree: "Livrée", annulee: "Annulée", approuve: "Approuvé", refuse: "Refusé"
  };

  function renderDashboard() {
    const produits = CultureStore.getProduits();
    const commandes = CultureStore.getCommandes();
    const comptes = CultureStore.getComptes();
    const enAttenteComptes = comptes.filter(c => c.statut === "en_attente").length;
    const caTotal = commandes.filter(c => c.statut !== "annulee").reduce((s, c) => s + c.total, 0);

    document.getElementById("stat-cards").innerHTML = `
      <div class="stat-card"><div class="num">${produits.length}</div><div class="lbl">Produits au catalogue</div></div>
      <div class="stat-card"><div class="num">${commandes.length}</div><div class="lbl">Commandes totales</div></div>
      <div class="stat-card"><div class="num">${enAttenteComptes}</div><div class="lbl">Comptes en attente</div></div>
      <div class="stat-card"><div class="num">${caTotal.toLocaleString("fr-FR")} FC</div><div class="lbl">Chiffre d'affaires (hors annulées)</div></div>
    `;
    const tbody = document.querySelector("#table-dashboard-commandes tbody");
    tbody.innerHTML = commandes.slice(-8).reverse().map(c => `
      <tr>
        <td>${c.id}</td><td>${c.clientNom}</td><td>${c.total.toLocaleString("fr-FR")} FC</td>
        <td><span class="badge badge-${c.statut}">${STATUT_LABEL[c.statut]}</span></td>
        <td>${new Date(c.date).toLocaleDateString("fr-FR")}</td>
      </tr>`).join("") || `<tr><td colspan="5" style="text-align:center;color:#999;">Aucune commande pour l'instant</td></tr>`;
  }

  // ==================== PRODUITS ====================
  function setupProduits() {
    document.getElementById("btn-nouveau-produit").addEventListener("click", () => openProduitModal());
    document.getElementById("btn-save-produit").addEventListener("click", () => {
      const id = document.getElementById("prod-id").value;
      const produit = {
        id: id || undefined,
        nom: document.getElementById("prod-nom").value.trim(),
        emoji: document.getElementById("prod-emoji").value.trim(),
        image: document.getElementById("prod-image").value.trim(),
        prix: parseInt(document.getElementById("prod-prix").value || "0", 10),
        unite: document.getElementById("prod-unite").value.trim() || "unité",
        description: document.getElementById("prod-description").value.trim(),
        disponible: document.getElementById("prod-dispo").checked
      };
      if (!produit.nom) { toast("Le nom du produit est requis."); return; }
      CultureStore.saveProduit(produit);
      document.getElementById("modal-produit").classList.remove("open");
      toast("Produit enregistré ✅");
      renderProduits(); renderDashboard();
    });
  }

  function openProduitModal(produit) {
    document.getElementById("modal-produit-titre").textContent = produit ? "Modifier le produit" : "Nouveau produit";
    document.getElementById("prod-id").value = produit ? produit.id : "";
    document.getElementById("prod-nom").value = produit ? produit.nom : "";
    document.getElementById("prod-emoji").value = produit ? produit.emoji : "";
    document.getElementById("prod-image").value = produit ? (produit.image || "") : "";
    document.getElementById("prod-prix").value = produit ? produit.prix : "";
    document.getElementById("prod-unite").value = produit ? produit.unite : "kg";
    document.getElementById("prod-description").value = produit ? produit.description : "";
    document.getElementById("prod-dispo").checked = produit ? produit.disponible : true;
    document.getElementById("modal-produit").classList.add("open");
  }

  function renderProduits() {
    const tbody = document.getElementById("table-produits");
    const produits = CultureStore.getProduits();
    tbody.innerHTML = produits.map(p => `
      <tr>
        <td>${p.image ? `<img src="${p.image}" alt="" style="width:36px;height:36px;object-fit:cover;border-radius:6px;">` : `<span style="font-size:1.3rem;">${p.emoji || "🥬"}</span>`}</td>
        <td>${p.nom}</td>
        <td>${p.prix.toLocaleString("fr-FR")} FC</td>
        <td>${p.unite}</td>
        <td>${p.disponible ? "✅" : "❌"}</td>
        <td>
          <button class="btn btn-outline btn-small" data-edit="${p.id}">Modifier</button>
          <button class="btn btn-danger btn-small" data-del="${p.id}">Supprimer</button>
        </td>
      </tr>`).join("") || `<tr><td colspan="6" style="text-align:center;color:#999;">Aucun produit</td></tr>`;

    tbody.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => {
      openProduitModal(produits.find(p => p.id === b.dataset.edit));
    }));
    tbody.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => {
      if (confirm("Supprimer ce produit ?")) { CultureStore.deleteProduit(b.dataset.del); renderProduits(); renderDashboard(); toast("Produit supprimé."); }
    }));
  }

  // ==================== COMPTES CLIENTS ====================
  function setupComptes() {}

  function renderComptes() {
    const tbody = document.getElementById("table-comptes");
    const comptes = CultureStore.getComptes();
    tbody.innerHTML = comptes.slice().reverse().map(c => `
      <tr>
        <td>${c.nom}</td><td>${c.telephone}</td><td>${c.adresse || "—"}</td>
        <td><span class="badge badge-${c.statut}">${STATUT_LABEL[c.statut] || c.statut}</span></td>
        <td>${new Date(c.dateCreation).toLocaleDateString("fr-FR")}</td>
        <td>
          ${c.statut !== "approuve" ? `<button class="btn btn-primary btn-small" data-approve="${c.id}">Approuver</button>` : ""}
          ${c.statut !== "refuse" ? `<button class="btn btn-outline btn-small" data-refuse="${c.id}">Refuser</button>` : ""}
          <button class="btn btn-danger btn-small" data-del-compte="${c.id}">Supprimer</button>
        </td>
      </tr>`).join("") || `<tr><td colspan="6" style="text-align:center;color:#999;">Aucune demande de compte</td></tr>`;

    tbody.querySelectorAll("[data-approve]").forEach(b => b.addEventListener("click", () => {
      CultureStore.majStatutCompte(b.dataset.approve, "approuve"); renderComptes(); renderDashboard(); toast("Compte approuvé ✅");
    }));
    tbody.querySelectorAll("[data-refuse]").forEach(b => b.addEventListener("click", () => {
      CultureStore.majStatutCompte(b.dataset.refuse, "refuse"); renderComptes(); renderDashboard(); toast("Compte refusé.");
    }));
    tbody.querySelectorAll("[data-del-compte]").forEach(b => b.addEventListener("click", () => {
      if (confirm("Supprimer ce compte définitivement ?")) { CultureStore.supprimerCompte(b.dataset.delCompte); renderComptes(); renderDashboard(); toast("Compte supprimé."); }
    }));
  }

  // ==================== COMMANDES ====================
  function setupCommandes() {
    document.getElementById("btn-confirm-assign").addEventListener("click", () => {
      const cmdId = document.getElementById("assign-commande-id").value;
      const livId = document.getElementById("assign-livreur-select").value;
      if (!livId) { toast("Choisissez un livreur."); return; }
      CultureStore.majCommande(cmdId, { livreurId: livId, statut: "en_livraison" });
      document.getElementById("modal-assigner").classList.remove("open");
      renderCommandes(); renderDashboard();
      toast("Livreur assigné ✅");
    });
  }

  function renderCommandes() {
    const tbody = document.getElementById("table-commandes");
    const commandes = CultureStore.getCommandes();
    const livreurs = CultureStore.getLivreurs();
    tbody.innerHTML = commandes.slice().reverse().map(c => {
      const livreur = livreurs.find(l => l.id === c.livreurId);
      return `
      <tr>
        <td>${c.id}</td><td>${c.clientNom}</td><td>${c.telephone}</td>
        <td>${c.total.toLocaleString("fr-FR")} FC</td>
        <td><span class="badge badge-${c.statut}">${STATUT_LABEL[c.statut]}</span></td>
        <td>${livreur ? livreur.nom : "—"}</td>
        <td>${new Date(c.date).toLocaleDateString("fr-FR")}</td>
        <td>
          <select data-statut="${c.id}" style="font-size:0.78rem;padding:4px;">
            ${Object.entries(STATUT_LABEL).filter(([k]) => ["en_attente","confirmee","en_livraison","livree","annulee"].includes(k)).map(([k, v]) =>
              `<option value="${k}" ${c.statut === k ? "selected" : ""}>${v}</option>`).join("")}
          </select>
          <button class="btn btn-outline btn-small" data-assign="${c.id}">🚴 Livreur</button>
        </td>
      </tr>`;
    }).join("") || `<tr><td colspan="8" style="text-align:center;color:#999;">Aucune commande</td></tr>`;

    tbody.querySelectorAll("[data-statut]").forEach(sel => sel.addEventListener("change", () => {
      CultureStore.majCommande(sel.dataset.statut, { statut: sel.value });
      renderCommandes(); renderDashboard();
      toast("Statut mis à jour.");
    }));
    tbody.querySelectorAll("[data-assign]").forEach(b => b.addEventListener("click", () => {
      document.getElementById("assign-commande-id").value = b.dataset.assign;
      const sel = document.getElementById("assign-livreur-select");
      const livreurs = CultureStore.getLivreurs();
      sel.innerHTML = livreurs.map(l => `<option value="${l.id}">${l.nom} — ${l.telephone}</option>`).join("") || `<option value="">Aucun livreur enregistré</option>`;
      document.getElementById("modal-assigner").classList.add("open");
    }));
  }

  // ==================== LIVREURS ====================
  function setupLivreurs() {
    document.getElementById("btn-nouveau-livreur").addEventListener("click", () => {
      document.getElementById("liv-id").value = "";
      document.getElementById("liv-nom").value = "";
      document.getElementById("liv-tel").value = "";
      document.getElementById("modal-livreur").classList.add("open");
    });
    document.getElementById("btn-save-livreur").addEventListener("click", () => {
      const id = document.getElementById("liv-id").value;
      const nom = document.getElementById("liv-nom").value.trim();
      const telephone = document.getElementById("liv-tel").value.trim();
      if (!nom || !telephone) { toast("Nom et téléphone requis."); return; }
      CultureStore.saveLivreur({ id: id || undefined, nom, telephone });
      document.getElementById("modal-livreur").classList.remove("open");
      renderLivreurs();
      toast("Livreur enregistré ✅");
    });
  }

  function renderLivreurs() {
    const tbody = document.getElementById("table-livreurs");
    const livreurs = CultureStore.getLivreurs();
    tbody.innerHTML = livreurs.map(l => `
      <tr>
        <td>${l.nom}</td><td>${l.telephone}</td>
        <td>
          <button class="btn btn-outline btn-small" data-edit-liv="${l.id}">Modifier</button>
          <button class="btn btn-danger btn-small" data-del-liv="${l.id}">Supprimer</button>
        </td>
      </tr>`).join("") || `<tr><td colspan="3" style="text-align:center;color:#999;">Aucun livreur enregistré</td></tr>`;

    tbody.querySelectorAll("[data-edit-liv]").forEach(b => b.addEventListener("click", () => {
      const l = livreurs.find(l => l.id === b.dataset.editLiv);
      document.getElementById("liv-id").value = l.id;
      document.getElementById("liv-nom").value = l.nom;
      document.getElementById("liv-tel").value = l.telephone;
      document.getElementById("modal-livreur").classList.add("open");
    }));
    tbody.querySelectorAll("[data-del-liv]").forEach(b => b.addEventListener("click", () => {
      if (confirm("Supprimer ce livreur ?")) { CultureStore.supprimerLivreur(b.dataset.delLiv); renderLivreurs(); toast("Livreur supprimé."); }
    }));
  }

  // ==================== SYNCHRONISATION GOOGLE SHEET ====================
  function setupSync() {
    document.getElementById("btn-export-sheet").addEventListener("click", async () => {
      const status = document.getElementById("sync-status");
      status.textContent = "Export en cours...";
      try {
        await CultureStore.exporterVersGoogleSheet();
        status.textContent = "✅ Export réussi vers Google Sheet.";
      } catch (e) {
        status.textContent = "❌ " + e.message;
      }
    });
    document.getElementById("btn-import-sheet").addEventListener("click", async () => {
      const status = document.getElementById("sync-status");
      status.textContent = "Import en cours...";
      try {
        await CultureStore.importerDepuisGoogleSheet();
        status.textContent = "✅ Import réussi. Données mises à jour.";
        refreshAll();
      } catch (e) {
        status.textContent = "❌ " + e.message;
      }
    });
  }
});
