import type { Catalog } from './translations';

export const de: Catalog = {
  'importExport.codeView.aggregation':
    'Ergebnisse der folgenden Aggregation exportieren',
  'importExport.codeView.query': 'Ergebnisse der folgenden Abfrage exportieren',
  'importExport.export.errorCreatingFile':
    'Fehler beim Erstellen der Ausgabedatei.',
  'importExport.exportInProgress.subtitle':
    'Der Export ist deaktiviert, da bereits ein Export läuft.',
  'importExport.exportInProgress.title':
    'Leider ist derzeit nur ein Exportvorgang gleichzeitig möglich',
  'importExport.exportModal.advancedCsv': 'Erweitertes CSV-Format',
  'importExport.exportModal.aggregationOn': 'Aggregation auf {ns}',
  'importExport.exportModal.allFiles': 'Alle Dateien',
  'importExport.exportModal.back': 'Zurück',
  'importExport.exportModal.cancel': 'Abbrechen',
  'importExport.exportModal.collection': 'Collection {ns}',
  'importExport.exportModal.csvWarning':
    'Beim Export als CSV können Typinformationen verloren gehen. Das Format eignet sich nicht zur Sicherung deiner Daten.',
  'importExport.exportModal.escapeFormulae': 'Formeln in Daten maskieren',
  'importExport.exportModal.escapeFormulaeDescription':
    'Empfohlen für Datensätze mit benutzerdefinierten Daten',
  'importExport.exportModal.export': 'Exportieren…',
  'importExport.exportModal.fileError':
    'Fehler beim Erstellen der Ausgabedatei: {error}',
  'importExport.exportModal.fileType': 'Exportdateityp',
  'importExport.exportModal.learnMore': 'Mehr erfahren',
  'importExport.exportModal.next': 'Weiter',
  'importExport.exportModal.projectedOnly.prefix':
    'Es werden nur projizierte Felder exportiert. Um alle Felder zu exportieren, gehe zurück und lasse das Feld ',
  'importExport.exportModal.projectedOnly.project': 'Project',
  'importExport.exportModal.projectedOnly.suffix': ' leer.',
  'importExport.exportModal.select': 'Auswählen',
  'importExport.exportModal.targetFile': 'Zieldatei',
  'importExport.exportModal.title': 'Exportieren',
  'importExport.exportToast.aborted': 'Export abgebrochen.',
  'importExport.exportToast.completed': 'Export abgeschlossen.',
  'importExport.exportToast.exporting': '"{namespace}" wird exportiert…',
  'importExport.exportToast.exportingTo':
    '"{namespace}" wird nach {fileName} exportiert…',
  'importExport.exportToast.failed':
    'Export mit folgendem Fehler fehlgeschlagen:',
  'importExport.exportToast.processing.one':
    'Dokumente werden vor dem Export verarbeitet, {count} Dokument verarbeitet.',
  'importExport.exportToast.processing.other':
    'Dokumente werden vor dem Export verarbeitet, {count} Dokumente verarbeitet.',
  'importExport.exportToast.showFile': 'Datei anzeigen',
  'importExport.fieldOptions.allFields': 'Alle Felder',
  'importExport.fieldOptions.fieldsToExport': 'Zu exportierende Felder',
  'importExport.fieldOptions.projectHint.prefix': 'Du kannst auch das Feld ',
  'importExport.fieldOptions.projectHint.project': 'Project',
  'importExport.fieldOptions.projectHint.suffix':
    ' in der Abfrageleiste verwenden, um festzulegen, welche Felder zurückgegeben oder exportiert werden.',
  'importExport.fieldOptions.selectFieldsInTable':
    'Felder in Tabelle auswählen',
  'importExport.import.errorLogCreateFailed':
    'Die Fehlerprotokolldatei für den Import konnte nicht erstellt werden: {message}',
  'importExport.import.unableToLoadFile':
    'Die Datei konnte nicht geladen werden. Stelle sicher, dass die Datei gültiges CSV oder JSON ist. Fehler: {message}',
  'importExport.importFileInput.label': 'Importdatei:',
  'importExport.importFileInput.select': 'Auswählen',
  'importExport.importFileInput.title':
    'JSON- oder CSV-Datei zum Importieren auswählen',
  'importExport.importInProgress.subtitle':
    'Der Import ist deaktiviert, da bereits ein Import läuft.',
  'importExport.importInProgress.title':
    'Leider ist derzeit nur ein Importvorgang gleichzeitig möglich',
  'importExport.importModal.cancel': 'Abbrechen',
  'importExport.importModal.close': 'Schließen',
  'importExport.importModal.import': 'Importieren',
  'importExport.importModal.importing': 'Import läuft…',
  'importExport.importModal.learnMoreTypes': 'Mehr über Datentypen erfahren',
  'importExport.importModal.specifyFields': 'Felder und Typen festlegen',
  'importExport.importModal.title': 'Importieren',
  'importExport.importModal.toCollection': 'In Collection {ns}',
  'importExport.importToast.aborted': 'Import abgebrochen.',
  'importExport.importToast.abortedWithErrors':
    'Import mit folgenden Fehlern abgebrochen:',
  'importExport.importToast.bloated.description':
    'Die importierten Dokumente überschreiten möglicherweise eine für die Performance sinnvolle Größe.',
  'importExport.importToast.bloated.title': 'Möglicherweise zu große Dokumente',
  'importExport.importToast.completed': 'Import abgeschlossen.',
  'importExport.importToast.completedWithErrors':
    'Import {docsWritten}/{docsProcessed} mit Fehlern abgeschlossen:',
  'importExport.importToast.errors.one': '{count} Fehler.',
  'importExport.importToast.errors.other': '{count} Fehler.',
  'importExport.importToast.failed':
    'Import mit folgendem Fehler fehlgeschlagen:',
  'importExport.importToast.imported.one': '{count} Dokument importiert.',
  'importExport.importToast.imported.other': '{count} Dokumente importiert.',
  'importExport.importToast.importing': '{fileName} wird importiert…',
  'importExport.importToast.largeArray.description':
    'Einige der importierten Dokumente enthielten unbegrenzte Arrays, die die Effizienz beeinträchtigen können',
  'importExport.importToast.largeArray.title': 'Großes Array erkannt',
  'importExport.importToast.moreErrors':
    'Es sind weitere Fehler aufgetreten. Öffne das Fehlerprotokoll, um sie anzuzeigen.',
  'importExport.importToast.reviewDocuments': 'Dokumente prüfen',
  'importExport.importToast.viewErrorDetails': 'Fehlerdetails anzeigen',
  'importExport.importToast.viewLog': 'Protokoll anzeigen',
  'importExport.inProgress.cancel': 'Abbrechen',
  'importExport.jsonFormat.advanced': 'Erweitertes JSON-Format',
  'importExport.jsonFormat.canonical': 'Kanonisches Extended JSON',
  'importExport.jsonFormat.default': 'Standard-Extended-JSON',
  'importExport.jsonFormat.example': 'Beispiel:',
  'importExport.jsonFormat.learnMore': 'Mehr über das JSON-Format erfahren',
  'importExport.jsonFormat.relaxed': 'Relaxed Extended JSON',
  'importExport.jsonFormat.relaxedNote':
    'Große Zahlen (>= 2^^53) ändern sich mit diesem Format.',
  'importExport.jsonFormat.relaxedWarning':
    'Große Zahlen (>= 2^^53) verlieren im relaxed-EJSON-Format an Genauigkeit. Dieses Format wird im Hinblick auf die Datenintegrität nicht empfohlen.',
  'importExport.options.comma': 'Komma',
  'importExport.options.delimiter': 'Trennzeichen',
  'importExport.options.heading': 'Optionen',
  'importExport.options.ignoreEmptyStrings': 'Leere Zeichenfolgen ignorieren',
  'importExport.options.selectDelimiter': 'Trennzeichen auswählen',
  'importExport.options.semicolon': 'Semikolon',
  'importExport.options.space': 'Leerzeichen',
  'importExport.options.stopOnErrors': 'Bei Fehlern anhalten',
  'importExport.options.tab': 'Tabulator',
  'importExport.preview.arrayOf': 'Array von',
  'importExport.preview.blank': 'Leer',
  'importExport.preview.detectedTypes':
    'Dieses Feld enthält folgende erkannte Typen:',
  'importExport.preview.emptyString': 'leere Zeichenfolge',
  'importExport.preview.errorForType':
    '. Dies führt beim Typ {type} zu einem Fehler.',
  'importExport.preview.fieldType': 'Feldtyp',
  'importExport.preview.mixedData': 'Dieses Feld enthält gemischte Datentypen:',
  'importExport.preview.mixedNumeric':
    'Dieses Feld enthält gemischte numerische Typen:',
  'importExport.preview.rowContainsValue': 'Zeile {row} enthält den Wert ',
  'importExport.preview.standardize':
    'Wähle einen anderen Typ, um deine Daten zu vereinheitlichen.',
  'importExport.preview.typesDocs': 'Dokumentation zu Typen',
  'importExport.preview.valuesIgnored': 'Werte für {path} werden ignoriert',
  'importExport.preview.valuesImported': 'Werte für {path} werden importiert',
  'importExport.previewLoader.description':
    'Wir durchsuchen deine CSV-Datei Zeile für Zeile, um die Feldtypen zu erkennen. Du kannst diesen Schritt überspringen und die Feldtypen jederzeit während des Vorgangs manuell zuweisen.',
  'importExport.previewLoader.skip': 'Überspringen',
  'importExport.previewLoader.title': 'Feldtypen werden erkannt',
  'importExport.selectFields.addField': 'Feld hinzufügen',
  'importExport.selectFields.addNewField': 'Neues Feld hinzufügen',
  'importExport.selectFields.description.prefix':
    'Die Felder in der folgenden Tabelle stammen aus einer ',
  'importExport.selectFields.description.sample': 'Stichprobe',
  'importExport.selectFields.description.suffix':
    ' von Dokumenten in der Collection. Füge fehlende Felder hinzu, die du exportieren möchtest.',
  'importExport.selectFields.deselectAll': 'Alle Felder abwählen',
  'importExport.selectFields.enterField':
    'Feld eingeben, das in den Export aufgenommen werden soll',
  'importExport.selectFields.excludeField':
    '{field} aus der exportierten Collection ausschließen',
  'importExport.selectFields.fieldName': 'Feldname',
  'importExport.selectFields.includeField':
    '{field} in die exportierte Collection aufnehmen',
  'importExport.selectFields.loadError':
    'Die zu exportierenden Felder konnten nicht geladen werden: {error}',
  'importExport.selectFields.pressEnter':
    'Drücke die Eingabetaste, um das Feld hinzuzufügen',
  'importExport.selectFields.retry': 'Erneut versuchen',
  'importExport.selectFields.selectAll': 'Alle Felder auswählen',
  'importExport.selectFields.showMore': '{count} weitere Felder anzeigen',
  'importExport.selectFields.title': 'Felder auswählen',
  'importExport.toast.docsWritten.one': '{count} Dokument geschrieben.',
  'importExport.toast.docsWritten.other': '{count} Dokumente geschrieben.',
  'importExport.toast.starting': 'Wird gestartet…',
  'importExport.toast.stop': 'stoppen',

  'importExport.csv.notNumberFound':
    '„{value}“ ist keine Zahl (gefunden: „{type}“) [Spalte {index}]',
  'importExport.csv.column': '[Spalte {index}]',
  'importExport.csv.row': '[Zeile {index}]',
  'importExport.csv.notNumber': '„{value}“ ist keine Zahl',
  'importExport.csv.notDate': '„{value}“ ist kein Datum',
  'importExport.csv.notNull': '„{value}“ ist nicht null',
  'importExport.csv.notRegex': '„{value}“ ist kein regulärer Ausdruck',
  'importExport.csv.notMinKey': '„{value}“ ist nicht $MinKey',
  'importExport.csv.notMaxKey': '„{value}“ ist nicht $MaxKey',
  'importExport.csv.notObjectId': '„{value}“ ist keine ObjectId',
  'importExport.json.notObject': 'Der Wert ist kein Objekt',
  'importExport.json.index': '[Index {index}]',
  'importExport.import.writeFailed':
    'Beim Schreiben von Daten in eine Collection ist ein Fehler aufgetreten',
  'importExport.import.fileNotFound': 'Datei {fileName} nicht gefunden',
  'importExport.import.unknownFileType':
    'Der Dateityp konnte nicht bestimmt werden',
};

export const fr: Catalog = {
  'importExport.codeView.aggregation':
    "Exporter les résultats de l'agrégation ci-dessous",
  'importExport.codeView.query':
    'Exporter les résultats de la requête ci-dessous',
  'importExport.export.errorCreatingFile':
    'Erreur lors de la création du fichier de sortie.',
  'importExport.exportInProgress.subtitle':
    "L'exportation est désactivée car une exportation est déjà en cours.",
  'importExport.exportInProgress.title':
    "Désolé, une seule opération d'exportation est possible à la fois pour le moment",
  'importExport.exportModal.advancedCsv': 'Format CSV avancé',
  'importExport.exportModal.aggregationOn': 'Agrégation sur {ns}',
  'importExport.exportModal.allFiles': 'Tous les fichiers',
  'importExport.exportModal.back': 'Retour',
  'importExport.exportModal.cancel': 'Annuler',
  'importExport.exportModal.collection': 'Collection {ns}',
  'importExport.exportModal.csvWarning':
    "L'exportation au format CSV peut entraîner une perte d'informations de type et ne convient pas à la sauvegarde de vos données.",
  'importExport.exportModal.escapeFormulae':
    'Échapper les formules dans les données',
  'importExport.exportModal.escapeFormulaeDescription':
    'Recommandé pour les jeux de données contenant des données fournies par les utilisateurs',
  'importExport.exportModal.export': 'Exporter…',
  'importExport.exportModal.fileError':
    'Erreur lors de la création du fichier de sortie : {error}',
  'importExport.exportModal.fileType': "Type de fichier d'exportation",
  'importExport.exportModal.learnMore': 'En savoir plus',
  'importExport.exportModal.next': 'Suivant',
  'importExport.exportModal.projectedOnly.prefix':
    'Seuls les champs projetés seront exportés. Pour exporter tous les champs, revenez en arrière et laissez le champ ',
  'importExport.exportModal.projectedOnly.project': 'Project',
  'importExport.exportModal.projectedOnly.suffix': ' vide.',
  'importExport.exportModal.select': 'Sélectionner',
  'importExport.exportModal.targetFile': 'Fichier de sortie cible',
  'importExport.exportModal.title': 'Exporter',
  'importExport.exportToast.aborted': 'Exportation interrompue.',
  'importExport.exportToast.completed': 'Exportation terminée.',
  'importExport.exportToast.exporting': 'Exportation de « {namespace} »…',
  'importExport.exportToast.exportingTo':
    'Exportation de « {namespace} » vers {fileName}…',
  'importExport.exportToast.failed':
    "Échec de l'exportation avec l'erreur suivante :",
  'importExport.exportToast.processing.one':
    "Traitement des documents avant l'exportation, {count} document traité.",
  'importExport.exportToast.processing.other':
    "Traitement des documents avant l'exportation, {count} documents traités.",
  'importExport.exportToast.showFile': 'afficher le fichier',
  'importExport.fieldOptions.allFields': 'Tous les champs',
  'importExport.fieldOptions.fieldsToExport': 'Champs à exporter',
  'importExport.fieldOptions.projectHint.prefix':
    'Vous pouvez également utiliser le champ ',
  'importExport.fieldOptions.projectHint.project': 'Project',
  'importExport.fieldOptions.projectHint.suffix':
    ' de la barre de requête pour spécifier les champs à renvoyer ou à exporter.',
  'importExport.fieldOptions.selectFieldsInTable':
    'Sélectionner les champs dans le tableau',
  'importExport.import.errorLogCreateFailed':
    "impossible de créer le fichier journal des erreurs d'importation : {message}",
  'importExport.import.unableToLoadFile':
    'Impossible de charger le fichier. Assurez-vous que le fichier est un CSV ou un JSON valide. Erreur : {message}',
  'importExport.importFileInput.label': 'Fichier à importer :',
  'importExport.importFileInput.select': 'Sélectionner',
  'importExport.importFileInput.title':
    'Sélectionner un fichier JSON ou CSV à importer',
  'importExport.importInProgress.subtitle':
    "L'importation est désactivée car une importation est déjà en cours.",
  'importExport.importInProgress.title':
    "Désolé, une seule opération d'importation est possible à la fois pour le moment",
  'importExport.importModal.cancel': 'Annuler',
  'importExport.importModal.close': 'Fermer',
  'importExport.importModal.import': 'Importer',
  'importExport.importModal.importing': 'Importation en cours…',
  'importExport.importModal.learnMoreTypes':
    'En savoir plus sur les types de données',
  'importExport.importModal.specifyFields': 'Spécifier les champs et les types',
  'importExport.importModal.title': 'Importer',
  'importExport.importModal.toCollection': 'Vers la collection {ns}',
  'importExport.importToast.aborted': 'Importation interrompue.',
  'importExport.importToast.abortedWithErrors':
    'Importation interrompue avec les erreurs suivantes :',
  'importExport.importToast.bloated.description':
    'Les documents importés pourraient dépasser une taille raisonnable pour les performances.',
  'importExport.importToast.bloated.title':
    'Documents potentiellement surdimensionnés',
  'importExport.importToast.completed': 'Importation terminée.',
  'importExport.importToast.completedWithErrors':
    'Importation terminée {docsWritten}/{docsProcessed} avec des erreurs :',
  'importExport.importToast.errors.one': '{count} erreur.',
  'importExport.importToast.errors.other': '{count} erreurs.',
  'importExport.importToast.failed':
    "Échec de l'importation avec l'erreur suivante :",
  'importExport.importToast.imported.one': '{count} document importé.',
  'importExport.importToast.imported.other': '{count} documents importés.',
  'importExport.importToast.importing': 'Importation de {fileName}…',
  'importExport.importToast.largeArray.description':
    "Certains des documents importés contenaient des tableaux non bornés pouvant nuire à l'efficacité",
  'importExport.importToast.largeArray.title': 'Grand tableau détecté',
  'importExport.importToast.moreErrors':
    "D'autres erreurs se sont produites, ouvrez le journal des erreurs pour les consulter.",
  'importExport.importToast.reviewDocuments': 'Examiner les documents',
  'importExport.importToast.viewErrorDetails':
    "Afficher les détails de l'erreur",
  'importExport.importToast.viewLog': 'afficher le journal',
  'importExport.inProgress.cancel': 'Annuler',
  'importExport.jsonFormat.advanced': 'Format JSON avancé',
  'importExport.jsonFormat.canonical': 'Extended JSON canonique',
  'importExport.jsonFormat.default': 'Extended JSON par défaut',
  'importExport.jsonFormat.example': 'Exemple :',
  'importExport.jsonFormat.learnMore': 'En savoir plus sur le format JSON',
  'importExport.jsonFormat.relaxed': 'Extended JSON relaxed',
  'importExport.jsonFormat.relaxedNote':
    'Les grands nombres (>= 2^^53) seront modifiés avec ce format.',
  'importExport.jsonFormat.relaxedWarning':
    "Les grands nombres (>= 2^^53) perdront en précision avec le format EJSON relaxed. Ce format n'est pas recommandé pour l'intégrité des données.",
  'importExport.options.comma': 'Virgule',
  'importExport.options.delimiter': 'Délimiteur',
  'importExport.options.heading': 'Options',
  'importExport.options.ignoreEmptyStrings': 'Ignorer les chaînes vides',
  'importExport.options.selectDelimiter': 'Sélectionner le délimiteur',
  'importExport.options.semicolon': 'Point-virgule',
  'importExport.options.space': 'Espace',
  'importExport.options.stopOnErrors': "Arrêter en cas d'erreur",
  'importExport.options.tab': 'Tabulation',
  'importExport.preview.arrayOf': 'Tableau de',
  'importExport.preview.blank': 'Vide',
  'importExport.preview.detectedTypes':
    'Ce champ contient les types détectés suivants :',
  'importExport.preview.emptyString': 'chaîne vide',
  'importExport.preview.errorForType':
    '. Cela provoquera une erreur pour le type {type}.',
  'importExport.preview.fieldType': 'Type de champ',
  'importExport.preview.mixedData':
    'Ce champ contient des types de données mixtes :',
  'importExport.preview.mixedNumeric':
    'Ce champ contient des types numériques mixtes :',
  'importExport.preview.rowContainsValue': 'La ligne {row} contient la valeur ',
  'importExport.preview.standardize':
    'Pour uniformiser vos données, sélectionnez un autre type.',
  'importExport.preview.typesDocs': 'Documentation sur les types',
  'importExport.preview.valuesIgnored': 'Les valeurs de {path} seront ignorées',
  'importExport.preview.valuesImported':
    'Les valeurs de {path} seront importées',
  'importExport.previewLoader.description':
    'Nous analysons votre fichier CSV ligne par ligne pour détecter les types de champs. Vous pouvez ignorer cette étape et attribuer manuellement les types de champs à tout moment pendant le processus.',
  'importExport.previewLoader.skip': 'Ignorer',
  'importExport.previewLoader.title': 'Détection des types de champs',
  'importExport.selectFields.addField': 'Ajouter un champ',
  'importExport.selectFields.addNewField': 'Ajouter un nouveau champ',
  'importExport.selectFields.description.prefix':
    "Les champs du tableau ci-dessous proviennent d'un ",
  'importExport.selectFields.description.sample': 'échantillon',
  'importExport.selectFields.description.suffix':
    ' de documents de la collection. Ajoutez les champs manquants que vous souhaitez exporter.',
  'importExport.selectFields.deselectAll': 'Désélectionner tous les champs',
  'importExport.selectFields.enterField':
    "Saisir un champ à inclure dans l'exportation",
  'importExport.selectFields.excludeField':
    'Exclure {field} de la collection exportée',
  'importExport.selectFields.fieldName': 'Nom du champ',
  'importExport.selectFields.includeField':
    'Inclure {field} dans la collection exportée',
  'importExport.selectFields.loadError':
    'Impossible de charger les champs à exporter : {error}',
  'importExport.selectFields.pressEnter':
    'Appuyez sur « Entrée » pour ajouter le champ',
  'importExport.selectFields.retry': 'Réessayer',
  'importExport.selectFields.selectAll': 'Sélectionner tous les champs',
  'importExport.selectFields.showMore':
    'Afficher {count} champs supplémentaires',
  'importExport.selectFields.title': 'Sélectionner les champs',
  'importExport.toast.docsWritten.one': '{count} document écrit.',
  'importExport.toast.docsWritten.other': '{count} documents écrits.',
  'importExport.toast.starting': 'Démarrage…',
  'importExport.toast.stop': 'arrêter',

  'importExport.csv.notNumberFound':
    '« {value} » n’est pas un nombre (« {type} » trouvé) [Col {index}]',
  'importExport.csv.column': '[Col {index}]',
  'importExport.csv.row': '[Ligne {index}]',
  'importExport.csv.notNumber': '« {value} » n’est pas un nombre',
  'importExport.csv.notDate': '« {value} » n’est pas une date',
  'importExport.csv.notNull': '« {value} » n’est pas null',
  'importExport.csv.notRegex': '« {value} » n’est pas une expression régulière',
  'importExport.csv.notMinKey': '« {value} » n’est pas $MinKey',
  'importExport.csv.notMaxKey': '« {value} » n’est pas $MaxKey',
  'importExport.csv.notObjectId': '« {value} » n’est pas un ObjectId',
  'importExport.json.notObject': 'La valeur n’est pas un objet',
  'importExport.json.index': '[Index {index}]',
  'importExport.import.writeFailed':
    'Une erreur s’est produite lors de l’écriture des données dans une collection',
  'importExport.import.fileNotFound': 'Fichier {fileName} introuvable',
  'importExport.import.unknownFileType':
    'Impossible de déterminer le type de fichier',
};

export const es: Catalog = {
  'importExport.codeView.aggregation':
    'Exportar los resultados de la siguiente agregación',
  'importExport.codeView.query':
    'Exportar los resultados de la siguiente consulta',
  'importExport.export.errorCreatingFile':
    'Error al crear el archivo de salida.',
  'importExport.exportInProgress.subtitle':
    'La exportación está desactivada porque ya hay una exportación en curso.',
  'importExport.exportInProgress.title':
    'Lo sentimos, actualmente solo es posible una operación de exportación a la vez',
  'importExport.exportModal.advancedCsv': 'Formato CSV avanzado',
  'importExport.exportModal.aggregationOn': 'Agregación en {ns}',
  'importExport.exportModal.allFiles': 'Todos los archivos',
  'importExport.exportModal.back': 'Atrás',
  'importExport.exportModal.cancel': 'Cancelar',
  'importExport.exportModal.collection': 'Colección {ns}',
  'importExport.exportModal.csvWarning':
    'Al exportar a CSV se puede perder información de tipos, por lo que no es adecuado para hacer copias de seguridad de tus datos.',
  'importExport.exportModal.escapeFormulae': 'Escapar fórmulas en los datos',
  'importExport.exportModal.escapeFormulaeDescription':
    'Recomendado para conjuntos de datos con datos proporcionados por usuarios',
  'importExport.exportModal.export': 'Exportar…',
  'importExport.exportModal.fileError':
    'Error al crear el archivo de salida: {error}',
  'importExport.exportModal.fileType': 'Tipo de archivo de exportación',
  'importExport.exportModal.learnMore': 'Más información',
  'importExport.exportModal.next': 'Siguiente',
  'importExport.exportModal.projectedOnly.prefix':
    'Solo se exportarán los campos proyectados. Para exportar todos los campos, vuelve atrás y deja vacío el campo ',
  'importExport.exportModal.projectedOnly.project': 'Project',
  'importExport.exportModal.projectedOnly.suffix': '.',
  'importExport.exportModal.select': 'Seleccionar',
  'importExport.exportModal.targetFile': 'Archivo de salida de destino',
  'importExport.exportModal.title': 'Exportar',
  'importExport.exportToast.aborted': 'Exportación cancelada.',
  'importExport.exportToast.completed': 'Exportación completada.',
  'importExport.exportToast.exporting': 'Exportando "{namespace}"…',
  'importExport.exportToast.exportingTo':
    'Exportando "{namespace}" a {fileName}…',
  'importExport.exportToast.failed':
    'Error al exportar con el siguiente error:',
  'importExport.exportToast.processing.one':
    'Procesando documentos antes de exportar, {count} documento procesado.',
  'importExport.exportToast.processing.other':
    'Procesando documentos antes de exportar, {count} documentos procesados.',
  'importExport.exportToast.showFile': 'mostrar archivo',
  'importExport.fieldOptions.allFields': 'Todos los campos',
  'importExport.fieldOptions.fieldsToExport': 'Campos que exportar',
  'importExport.fieldOptions.projectHint.prefix':
    'También puedes usar el campo ',
  'importExport.fieldOptions.projectHint.project': 'Project',
  'importExport.fieldOptions.projectHint.suffix':
    ' de la barra de consultas para especificar qué campos devolver o exportar.',
  'importExport.fieldOptions.selectFieldsInTable':
    'Seleccionar campos en la tabla',
  'importExport.import.errorLogCreateFailed':
    'no se pudo crear el archivo de registro de errores de importación: {message}',
  'importExport.import.unableToLoadFile':
    'No se pudo cargar el archivo. Asegúrate de que el archivo sea un CSV o JSON válido. Error: {message}',
  'importExport.importFileInput.label': 'Archivo de importación:',
  'importExport.importFileInput.select': 'Seleccionar',
  'importExport.importFileInput.title':
    'Selecciona un archivo JSON o CSV para importar',
  'importExport.importInProgress.subtitle':
    'La importación está desactivada porque ya hay una importación en curso.',
  'importExport.importInProgress.title':
    'Lo sentimos, actualmente solo es posible una operación de importación a la vez',
  'importExport.importModal.cancel': 'Cancelar',
  'importExport.importModal.close': 'Cerrar',
  'importExport.importModal.import': 'Importar',
  'importExport.importModal.importing': 'Importando…',
  'importExport.importModal.learnMoreTypes':
    'Más información sobre los tipos de datos',
  'importExport.importModal.specifyFields': 'Especificar campos y tipos',
  'importExport.importModal.title': 'Importar',
  'importExport.importModal.toCollection': 'A la colección {ns}',
  'importExport.importToast.aborted': 'Importación cancelada.',
  'importExport.importToast.abortedWithErrors':
    'Importación cancelada con los siguientes errores:',
  'importExport.importToast.bloated.description':
    'Los documentos importados podrían superar un tamaño razonable para el rendimiento.',
  'importExport.importToast.bloated.title':
    'Posibles documentos sobredimensionados',
  'importExport.importToast.completed': 'Importación completada.',
  'importExport.importToast.completedWithErrors':
    'Importación completada {docsWritten}/{docsProcessed} con errores:',
  'importExport.importToast.errors.one': '{count} error.',
  'importExport.importToast.errors.other': '{count} errores.',
  'importExport.importToast.failed':
    'Error al importar con el siguiente error:',
  'importExport.importToast.imported.one': '{count} documento importado.',
  'importExport.importToast.imported.other': '{count} documentos importados.',
  'importExport.importToast.importing': 'Importando {fileName}…',
  'importExport.importToast.largeArray.description':
    'Algunos de los documentos importados contenían arrays sin límite que pueden reducir la eficiencia',
  'importExport.importToast.largeArray.title': 'Array grande detectado',
  'importExport.importToast.moreErrors':
    'Se produjeron más errores; abre el registro de errores para verlos.',
  'importExport.importToast.reviewDocuments': 'Revisar documentos',
  'importExport.importToast.viewErrorDetails': 'Ver detalles del error',
  'importExport.importToast.viewLog': 'ver registro',
  'importExport.inProgress.cancel': 'Cancelar',
  'importExport.jsonFormat.advanced': 'Formato JSON avanzado',
  'importExport.jsonFormat.canonical': 'Extended JSON canónico',
  'importExport.jsonFormat.default': 'Extended JSON predeterminado',
  'importExport.jsonFormat.example': 'Ejemplo:',
  'importExport.jsonFormat.learnMore': 'Más información sobre el formato JSON',
  'importExport.jsonFormat.relaxed': 'Extended JSON relajado',
  'importExport.jsonFormat.relaxedNote':
    'Los números grandes (>= 2^^53) cambiarán con este formato.',
  'importExport.jsonFormat.relaxedWarning':
    'Los números grandes (>= 2^^53) perderán precisión con el formato EJSON relajado. No se recomienda este formato para garantizar la integridad de los datos.',
  'importExport.options.comma': 'Coma',
  'importExport.options.delimiter': 'Delimitador',
  'importExport.options.heading': 'Opciones',
  'importExport.options.ignoreEmptyStrings': 'Ignorar cadenas vacías',
  'importExport.options.selectDelimiter': 'Seleccionar delimitador',
  'importExport.options.semicolon': 'Punto y coma',
  'importExport.options.space': 'Espacio',
  'importExport.options.stopOnErrors': 'Detener en caso de errores',
  'importExport.options.tab': 'Tabulación',
  'importExport.preview.arrayOf': 'Array de',
  'importExport.preview.blank': 'Vacío',
  'importExport.preview.detectedTypes':
    'Este campo tiene los siguientes tipos detectados:',
  'importExport.preview.emptyString': 'cadena vacía',
  'importExport.preview.errorForType':
    '. Esto provocará un error para el tipo {type}.',
  'importExport.preview.fieldType': 'Tipo de campo',
  'importExport.preview.mixedData': 'Este campo tiene tipos de datos mixtos:',
  'importExport.preview.mixedNumeric':
    'Este campo tiene tipos numéricos mixtos:',
  'importExport.preview.rowContainsValue': 'La fila {row} contiene el valor ',
  'importExport.preview.standardize':
    'Para estandarizar tus datos, selecciona un tipo diferente.',
  'importExport.preview.typesDocs': 'Documentación de tipos',
  'importExport.preview.valuesIgnored': 'Los valores de {path} se ignorarán',
  'importExport.preview.valuesImported': 'Los valores de {path} se importarán',
  'importExport.previewLoader.description':
    'Estamos analizando tu archivo CSV fila por fila para detectar los tipos de campo. Puedes omitir este paso y asignar los tipos de campo manualmente en cualquier momento durante el proceso.',
  'importExport.previewLoader.skip': 'Omitir',
  'importExport.previewLoader.title': 'Detectando tipos de campo',
  'importExport.selectFields.addField': 'Añadir campo',
  'importExport.selectFields.addNewField': 'Añadir nuevo campo',
  'importExport.selectFields.description.prefix':
    'Los campos de la tabla siguiente proceden de una ',
  'importExport.selectFields.description.sample': 'muestra',
  'importExport.selectFields.description.suffix':
    ' de documentos de la colección. Añade los campos que faltan y quieras exportar.',
  'importExport.selectFields.deselectAll': 'Deseleccionar todos los campos',
  'importExport.selectFields.enterField':
    'Introduce un campo para incluirlo en la exportación',
  'importExport.selectFields.excludeField':
    'Excluir {field} de la colección exportada',
  'importExport.selectFields.fieldName': 'Nombre del campo',
  'importExport.selectFields.includeField':
    'Incluir {field} en la colección exportada',
  'importExport.selectFields.loadError':
    'No se pudieron cargar los campos que exportar: {error}',
  'importExport.selectFields.pressEnter': 'Pulsa "Intro" para añadir el campo',
  'importExport.selectFields.retry': 'Reintentar',
  'importExport.selectFields.selectAll': 'Seleccionar todos los campos',
  'importExport.selectFields.showMore': 'Mostrar {count} campos más',
  'importExport.selectFields.title': 'Seleccionar campos',
  'importExport.toast.docsWritten.one': '{count} documento escrito.',
  'importExport.toast.docsWritten.other': '{count} documentos escritos.',
  'importExport.toast.starting': 'Iniciando…',
  'importExport.toast.stop': 'detener',

  'importExport.csv.notNumberFound':
    '“{value}” no es un número (se encontró “{type}”) [Col. {index}]',
  'importExport.csv.column': '[Col. {index}]',
  'importExport.csv.row': '[Fila {index}]',
  'importExport.csv.notNumber': '“{value}” no es un número',
  'importExport.csv.notDate': '“{value}” no es una fecha',
  'importExport.csv.notNull': '“{value}” no es null',
  'importExport.csv.notRegex': '“{value}” no es una expresión regular',
  'importExport.csv.notMinKey': '“{value}” no es $MinKey',
  'importExport.csv.notMaxKey': '“{value}” no es $MaxKey',
  'importExport.csv.notObjectId': '“{value}” no es un ObjectId',
  'importExport.json.notObject': 'El valor no es un objeto',
  'importExport.json.index': '[Índice {index}]',
  'importExport.import.writeFailed':
    'Se produjo un error al escribir datos en una colección',
  'importExport.import.fileNotFound': 'No se encontró el archivo {fileName}',
  'importExport.import.unknownFileType':
    'No se puede determinar el tipo de archivo',
};
