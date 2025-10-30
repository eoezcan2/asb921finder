/*
 * ASB921FINDER V1.7
 * Fügt eine Filterleiste direkt in die Seite old.samariter.at ein.
 * V1.7: MutationObserver wartet jetzt auf die ERSTE DIENSTZEILE
 * (tr[class^="dienstid"]) statt nur auf den Container (#dpl).
 * Dies ist der robusteste Weg, um Timing-Probleme zu beheben.
 */

// ##################################################################
// NEUER STARTPUNKT (V1.7)
// ##################################################################

// 1. Prüfen, ob die erste Dienstzeile (die Daten) schon da ist.
const initialRow = document.querySelector('tr[class^="dienstid"]');

if (initialRow) {
  // Fall 1: Seite war schnell, Zeile ist schon da.
  runExtensionSetup();
} else {
  // Fall 2: Seite lädt dynamisch. Wir müssen warten.
  const observer = new MutationObserver((mutations, obs) => {
    // Wir suchen bei JEDER Änderung, ob die erste Zeile jetzt da ist.
    const firstRow = document.querySelector('tr[class^="dienstid"]');

    if (firstRow) {
      // Die erste Zeile wurde gefunden! Jetzt können wir starten.
      runExtensionSetup();
      obs.disconnect(); // Stoppe die Beobachtung, wir sind fertig.
    }
  });

  // Starte die Beobachtung des gesamten Dokuments
  observer.observe(document.body, {
    childList: true, // Achte auf hinzugefügte/entfernte Kinder
    subtree: true    // Beobachte auch alle Unterelemente
  });
}

/**
 * Haupt-Setup-Funktion. Wird aufgerufen, sobald die ERSTE DIENSTZEILE gefunden wurde.
 */
function runExtensionSetup() {
  // Sicherheits-Check: Führe alles nur einmal aus.
  if (document.getElementById('asb921-filter-box')) {
    return;
  }

  // Finde das #dpl Element, das jetzt existieren MUSS,
  // da die Zeile (firstRow) ja darin liegt.
  const targetElement = document.querySelector('#dpl');

  if (!targetElement) {
    console.error("ASB921Finder: Konnte #dpl nicht finden, obwohl Zeilen da sind. Breche ab.");
    return;
  }

  injectFilterUI(targetElement); // UI einfügen
  preprocessAndFillDates();      // Datumszellen VOR dem Filtern füllen
}


// ##################################################################
// UNVERÄNDERTE FUNKTIONEN (AB HIER)
// ##################################################################

/**
 * Erzeugt die HTML-Filterleiste und fügt sie an der gewünschten Stelle ein.
 */
function injectFilterUI(targetElement) {
  const filterBox = document.createElement('div');
  filterBox.id = "asb921-filter-box"; // Wichtig, um Duplikate zu verhindern

  filterBox.style = "padding: 12px; background: #f0f0f0; border-bottom: 3px solid #739418; margin-bottom: 10px; position: sticky; top: 0; z-index: 9999; font-family: Arial, sans-serif;";

  filterBox.innerHTML = `
    <div>
      <strong style="margin-right: 10px;">ASB921 Filter:</strong>

      <input type="text" id="asb-filter-datum" placeholder="Datum"
             style="margin-right: 5px; padding: 5px; font-size: 14px;">

      <input type="text" id="asb-filter-name" placeholder="Name (HA MUSTERMANN, MUSTERFRAU,..)"
             style="margin-right: 5px; padding: 5px; font-size: 14px; width: 200px;">

      <button id="asb-filter-reset" style="padding: 5px 10px; font-size: 14px; margin-right: 15px;">Reset</button>

      <a href="#" id="asb-toggle-advanced" style="font-size: 12px; color: #333;">[+] Erweiterte Suche</a>
    </div>

    <div id="asb-advanced-box" style="display: none; margin-top: 10px; padding-top: 10px; border-top: 1px solid #ccc;">
      <input type="text" id="asb-filter-col1" placeholder="Lenker"
             style="margin-right: 5px; padding: 5px; font-size: 14px; width: 140px;">

      <input type="text" id="asb-filter-col2" placeholder="Teamleiter"
             style="margin-right: 5px; padding: 5px; font-size: 14px; width: 140px;">

      <input type="text" id="asb-filter-col3" placeholder="Dritter"
             style="margin-right: 5px; padding: 5px; font-size: 14px; width: 140px;">

      <input type="text" id="asb-filter-col4" placeholder="Vierter"
             style="margin-right: 5px; padding: 5px; font-size: 14px; width: 140px;">
    </div>
  `;

  targetElement.parentNode.insertBefore(filterBox, targetElement);

  // Event Listeners
  document.getElementById('asb-filter-datum').addEventListener('input', applyFilter);
  document.getElementById('asb-filter-name').addEventListener('input', applyFilter);
  document.getElementById('asb-filter-reset').addEventListener('click', resetFilter);
  document.getElementById('asb-toggle-advanced').addEventListener('click', toggleAdvancedFilter);
  document.getElementById('asb-filter-col1').addEventListener('input', applyFilter);
  document.getElementById('asb-filter-col2').addEventListener('input', applyFilter);
  document.getElementById('asb-filter-col3').addEventListener('input', applyFilter);
  document.getElementById('asb-filter-col4').addEventListener('input', applyFilter);
}

/**
 * Geht alle Zeilen einmalig beim Laden durch und füllt leere
 * Datums- und Tag-Zellen mit dem Wert der letzten "Kopfzeile".
 */
function preprocessAndFillDates() {
  let aktuellesDatum = "";
  let aktuellerTag = "";
  const rows = document.querySelectorAll('tr[class^="dienstid"]');

  rows.forEach(row => {
    const tagZelle = row.cells[0];
    const datumZelle = row.cells[1];

    let tagText = tagZelle.innerText.trim();
    let datumText = datumZelle.innerText.trim();

    if (datumText !== "") {
      aktuellesDatum = datumText;
      aktuellerTag = tagText;
    } else {
      tagZelle.innerText = aktuellerTag;
      datumZelle.innerText = aktuellesDatum;
      tagZelle.style.color = "#555";
      datumZelle.style.color = "#555";
    }
  });
}


/**
 * Zeigt die erweiterte Suche an oder versteckt sie.
 */
function toggleAdvancedFilter(e) {
  e.preventDefault();
  const box = document.getElementById('asb-advanced-box');
  const link = document.getElementById('asb-toggle-advanced');

  if (box.style.display === 'none') {
    box.style.display = 'block';
    link.innerText = '[-] Erweiterte Suche';
  } else {
    box.style.display = 'none';
    link.innerText = '[+] Erweiterte Suche';
  }
}

/**
 * Die Haupt-Filterlogik.
 */
function applyFilter() {
  const filterDatumEl = document.getElementById('asb-filter-datum');
  const filterNameEl = document.getElementById('asb-filter-name');
  const filterCol1El = document.getElementById('asb-filter-col1');
  const filterCol2El = document.getElementById('asb-filter-col2');
  const filterCol3El = document.getElementById('asb-filter-col3');
  const filterCol4El = document.getElementById('asb-filter-col4');

  const rows = document.querySelectorAll('tr[class^="dienstid"]');

  rows.forEach(row => {

    const targetDatum = row.cells[1].innerText.trim().toLowerCase();

    const nameCells = row.querySelectorAll('td.dpl_pos');
    let allNamesInRow = "";
    nameCells.forEach(cell => {
      allNamesInRow += cell.innerText.trim().toLowerCase() + " ";
    });

    const nameCol1 = (nameCells[0] ? nameCells[0].innerText.trim().toLowerCase() : "");
    const nameCol2 = (nameCells[1] ? nameCells[1].innerText.trim().toLowerCase() : "");
    const nameCol3 = (nameCells[2] ? nameCells[2].innerText.trim().toLowerCase() : "");
    const nameCol4 = (nameCells[3] ? nameCells[3].innerText.trim().toLowerCase() : "");

    const datumMatch = checkMatch(targetDatum, filterDatumEl);
    const nameMatch = checkMatch(allNamesInRow, filterNameEl);
    const col1Match = checkMatch(nameCol1, filterCol1El);
    const col2Match = checkMatch(nameCol2, filterCol2El);
    const col3Match = checkMatch(nameCol3, filterCol3El);
    const col4Match = checkMatch(nameCol4, filterCol4El);

    if (datumMatch && nameMatch && col1Match && col2Match && col3Match && col4Match) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

/**
 * Hilfsfunktion, die ein Feld (inputEl) gegen einen Text (targetText) prüft.
 */
function checkMatch(targetText, inputEl) {
  const filterValue = inputEl.value.trim().toLowerCase();

  if (filterValue === "") {
    return true;
  }

  const filterTerms = filterValue.split(',')
    .map(term => term.trim())
    .filter(term => term !== "");

  if (filterTerms.length === 0) {
    return true;
  }

  return filterTerms.some(term => targetText.includes(term));
}


/**
 * Setzt die Filterfelder zurück.
 */
function resetFilter() {
  document.getElementById('asb-filter-datum').value = "";
  document.getElementById('asb-filter-name').value = "";
  document.getElementById('asb-filter-col1').value = "";
  document.getElementById('asb-filter-col2').value = "";
  document.getElementById('asb-filter-col3').value = "";
  document.getElementById('asb-filter-col4').value = "";

  document.getElementById('asb-advanced-box').style.display = 'none';
  document.getElementById('asb-toggle-advanced').innerText = '[+] Erweiterte Suche';

  applyFilter();
}
