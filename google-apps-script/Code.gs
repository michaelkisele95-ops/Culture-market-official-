/*
  ============================================================
  Code.gs — Script Google Apps Script pour Culture
  ============================================================
  À COLLER dans l'éditeur Apps Script lié à votre Google Sheet.
  Voir GUIDE.md pour la procédure complète, étape par étape.

  Ce script crée automatiquement 4 feuilles dans votre Google Sheet :
  Produits, Commandes, Comptes, Livreurs
  et expose deux fonctions :
    - doGet  : renvoie toutes les données au format JSON (bouton "Importer")
    - doPost : reçoit toutes les données au format JSON et les enregistre (bouton "Exporter")
*/

const SHEETS = {
  produits: "Produits",
  commandes: "Commandes",
  comptes: "Comptes",
  livreurs: "Livreurs"
};

function _getOrCreateSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function _writeObjectsToSheet(sheetName, objects) {
  const sheet = _getOrCreateSheet(sheetName);
  sheet.clear();
  if (!objects || !objects.length) return;
  // Union de toutes les clés présentes (et pas seulement le 1er objet) pour ne perdre
  // aucun champ si certains enregistrements ont des propriétés que d'autres n'ont pas.
  const headersSet = {};
  objects.forEach(obj => Object.keys(obj).forEach(k => { headersSet[k] = true; }));
  const headers = Object.keys(headersSet);
  sheet.appendRow(headers);
  const rows = objects.map(obj => headers.map(h => {
    const v = obj[h];
    if (v === undefined || v === null) return "";
    return typeof v === "object" ? JSON.stringify(v) : v;
  }));
  if (rows.length) sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

function _readObjectsFromSheet(sheetName) {
  const sheet = _getOrCreateSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).filter(row => row.some(cell => cell !== "")).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      // Tente de reconvertir les champs JSON (ex: lignes de commande)
      if (typeof val === "string" && (val.startsWith("[") || val.startsWith("{"))) {
        try { val = JSON.parse(val); } catch (e) { /* garder tel quel */ }
      }
      obj[h] = val;
    });
    return obj;
  });
}

// ============================================================
// SÉCURITÉ ADMIN — le mot de passe n'est JAMAIS écrit dans le code
// du site (donc invisible via F12 / "voir le code source").
// Il est stocké ici, côté serveur, dans les "Propriétés du script" :
// Apps Script → icône ⚙️ Paramètres du projet → Propriétés du script
// → Ajouter une propriété → clé : ADMIN_PASSWORD, valeur : votre mot de passe.
// ============================================================
function _checkPassword(pwd) {
  const real = PropertiesService.getScriptProperties().getProperty("ADMIN_PASSWORD");
  if (!real) {
    return { ok: false, error: "Aucun mot de passe configuré côté serveur (ADMIN_PASSWORD manquant dans les Propriétés du script)." };
  }
  return { ok: pwd === real };
}

// Appelé en GET (avec ou sans paramètres) → renvoie toutes les données à jour
function doGet(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(5000); // évite de lire pendant qu'une écriture est en cours ; on continue même si non obtenu
  let payload;
  try {
    payload = {
      produits: _readObjectsFromSheet(SHEETS.produits),
      commandes: _readObjectsFromSheet(SHEETS.commandes),
      comptes: _readObjectsFromSheet(SHEETS.comptes),
      livreurs: _readObjectsFromSheet(SHEETS.livreurs)
    };
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

// Appelé en POST avec { action: "export", produits, commandes, comptes, livreurs }
// (le nom "export" correspond à "exporter DEPUIS le site VERS le Sheet")
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    // ---- Connexion admin (mot de passe vérifié ici, jamais dans le JS du site) ----
    if (body.action === "login") {
      const result = _checkPassword(body.password || "");
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ---- Verrou : évite que deux téléphones écrivent en même temps et se corrompent ----
    const lock = LockService.getScriptLock();
    const gotLock = lock.tryLock(10000); // attend jusqu'à 10s qu'une éventuelle autre écriture se termine
    if (!gotLock) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "Le serveur est occupé, réessayez dans un instant." }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    try {
      // ---- Écriture des données envoyées vers le Sheet (une ou plusieurs collections) ----
      if (body.produits) _writeObjectsToSheet(SHEETS.produits, body.produits);
      if (body.commandes) _writeObjectsToSheet(SHEETS.commandes, body.commandes);
      if (body.comptes) _writeObjectsToSheet(SHEETS.comptes, body.comptes);
      if (body.livreurs) _writeObjectsToSheet(SHEETS.livreurs, body.livreurs);
    } finally {
      lock.releaseLock();
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
