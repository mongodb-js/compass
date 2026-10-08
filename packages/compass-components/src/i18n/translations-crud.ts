import type { Catalog } from './translations';

// Texts of the Documents tab (compass-crud) and the Performance tab
// (compass-serverstats). See ./translations.ts for the key conventions.

export const de: Catalog = {
  'serverStats.top.title': 'Aktivste Collections',
  'serverStats.dataUnavailable': 'DATEN NICHT VERFÜGBAR',
  'serverStats.top.empty': 'Keine aktiven Collections',
  'serverStats.currentOp.title': 'Langsamste Operationen',
  'serverStats.currentOp.empty': 'Keine langsamen Operationen',
  'serverStats.detail.title': 'Operationsdetails',
  'serverStats.detail.close': 'Schließen',
  'serverStats.detail.client': 'Client s',
  'serverStats.detail.active': 'aktiv',
  'serverStats.detail.waitLock': 'wartet auf Sperre',
  'serverStats.detail.killOp': 'Operation beenden',
  'serverStats.toolbar.play': 'Fortsetzen',
  'serverStats.toolbar.pause': 'Pausieren',
  'serverStats.msgs.topUnavailableMongos':
    'Der Befehl „top“ ist für mongos nicht verfügbar, einige Diagramme zeigen möglicherweise keine Daten an.',
  'serverStats.msgs.topIncomplete':
    'Der Befehl „top“ kann Informationen zu bestimmten Collections nicht abrufen, daher werden in den Diagrammen unvollständige Daten angezeigt.',
  'serverStats.dbError.commandFailed':
    'Der Befehl „{command}“ hat den Fehler „{error}“ zurückgegeben',
  'serverStats.tab.title': 'Performance',
  'serverStats.chart.readWrite': 'Lesen & Schreiben',
  'serverStats.chart.memory': 'Speicher',
  'serverStats.chart.network': 'Netzwerk',
  'serverStats.chart.operations': 'Operationen',
  'serverStats.chart.loading': 'Wird geladen…',
  'crud.viewSwitcher.view': 'Ansicht',
  'crud.viewSwitcher.list': 'Dokumentliste',
  'crud.viewSwitcher.json': 'E-JSON-Ansicht',
  'crud.viewSwitcher.table': 'Tabellenansicht',
  'crud.readonlyFilter.filter': 'Filter',
  'crud.readonlyFilter.returnToDocuments':
    'Kehre zum Tab „Dokumente“ zurück, um diese Abfrage zu bearbeiten.',
  'crud.readonlyFilter.none': 'Keine',
  'crud.ejsonBanner.containsKeys': 'Dieses Dokument enthält Schlüssel wie',
  'crud.ejsonBanner.indicate':
    'die darauf hindeuten, dass dieses Dokument im Format',
  'crud.ejsonBanner.extendedJson': 'Extended JSON',
  'crud.ejsonBanner.format':
    'vorliegen soll, das sich von dem in dieser Ansicht akzeptierten Format unterscheidet.',
  'crud.ejsonBanner.convertQuestion':
    'Möchtest du diesen Text in die Shell-Syntax umwandeln (z. B.',
  'crud.ejsonBanner.instead': 'statt',
  'crud.ejsonBanner.convert': 'Umwandeln',
  'crud.ejsonBanner.conversionFailed':
    'Das Dokument konnte nicht umgewandelt werden:',
  'crud.csfleBanner.fieldsEncrypted':
    'Die folgenden Felder werden gemäß dem Schema der Collection verschlüsselt:',
  'crud.csfleBanner.noKnownSchema':
    'Bei diesem Einfügevorgang werden keine Dokumentfelder verschlüsselt, da der Collection kein Schema und keine In-Use-Encryption-Konfiguration zugeordnet ist.',
  'crud.csfleBanner.incompleteSchema':
    'Bei diesem Einfügevorgang werden nicht alle Felder verschlüsselt, die im ursprünglichen Dokument verschlüsselt waren, da das Schema für diese Collection fehlt oder unvollständig ist.',
  'crud.csfleBanner.knownSchema':
    'Bei diesem Einfügevorgang werden alle Felder verschlüsselt, die im Schema oder in der In-Use-Encryption-Konfiguration der Collection angegeben sind.',
  'crud.csfleBanner.disabled':
    'Bei diesem Einfügevorgang werden keine Dokumentfelder verschlüsselt, da die In-Use-Encryption-Unterstützung ausdrücklich deaktiviert wurde.',
  'crud.bulkActions.update': 'Dokumente per Massenaktualisierung ändern',
  'crud.bulkActions.delete': 'Dokumente per Massenlöschung entfernen',
  'crud.bulkActions.bulk': 'Masse',
  'crud.addData.insertDocument': 'Dokument einfügen',
  'crud.addData.importFile': 'JSON- oder CSV-Datei importieren',
  'crud.addData.generateMockData': 'Skript für Testdaten generieren',
  'crud.addData.button': 'Daten hinzufügen',
  'crud.insertBanner.convertToLong': 'In Long umwandeln',
  'crud.insertBanner.convertAllToLong': 'Alle in Long umwandeln',
  'crud.insertBanner.inserting': 'Dokument wird eingefügt',
  'crud.insertBanner.viewErrorDetails': 'FEHLERDETAILS ANZEIGEN',
  'crud.contextMenu.collapseAll': 'Alle Felder einklappen',
  'crud.contextMenu.expandAll': 'Alle Felder ausklappen',
  'crud.contextMenu.cancelEditing': 'Bearbeitung abbrechen',
  'crud.contextMenu.editDocument': 'Dokument bearbeiten',
  'crud.contextMenu.copyShell': 'Dokument als Shell-Syntax kopieren',
  'crud.contextMenu.copyEjson': 'Dokument als EJSON kopieren',
  'crud.contextMenu.clone': 'Dokument klonen ...',
  'crud.contextMenu.delete': 'Dokument löschen',
  'crud.toolbar.exportQueryResults': 'Abfrageergebnisse exportieren',
  'crud.toolbar.exportFullCollection': 'Gesamte Collection exportieren',
  'crud.toolbar.expandAllDocuments': 'Alle Dokumente ausklappen',
  'crud.toolbar.collapseAllDocuments': 'Alle Dokumente einklappen',
  'crud.toolbar.insertDocumentEllipsis': 'Dokument einfügen ...',
  'crud.toolbar.exportQueryResultsEllipsis':
    'Abfrageergebnisse exportieren ...',
  'crud.toolbar.exportFullCollectionEllipsis':
    'Gesamte Collection exportieren ...',
  'crud.toolbar.bulkUpdate': 'Massenaktualisierung',
  'crud.toolbar.bulkDelete': 'Massenlöschung',
  'crud.toolbar.refresh': 'Aktualisieren',
  'crud.toolbar.find': 'Suchen',
  'crud.toolbar.removeLimitAndSkip':
    'Entferne Limit und Skip aus deiner Abfrage, um eine Massenoperation auszuführen',
  'crud.toolbar.exportData': 'Daten exportieren',
  'crud.toolbar.exportToLanguage': 'Abfrage in Programmiersprache exportieren',
  'crud.toolbar.exportCode': 'Code exportieren',
  'crud.toolbar.docsPerPage': 'Anzahl der Dokumente pro Seite ändern',
  'crud.toolbar.of': 'von',
  'crud.toolbar.notAvailable': 'k. A.',
  'crud.toolbar.countUnavailable':
    'Die Anzahl ist für diese Abfrage nicht verfügbar. Das kann passieren, wenn die Zählung fehlschlägt oder das maxTimeMS von {maxTimeMS} überschreitet.',
  'crud.toolbar.fetchingCount': 'Dokumentanzahl wird abgerufen …',
  'crud.toolbar.refreshDocuments': 'Dokumente aktualisieren',
  'crud.toolbar.previousPage': 'Vorherige Seite',
  'crud.toolbar.nextPage': 'Nächste Seite',
  'crud.toolbar.outputOptions': 'Ausgabeoptionen',
  'crud.toolbar.increaseMaxTimeMS':
    'Die Operation hat das Zeitlimit überschritten. Erhöhe das maxTimeMS der Abfrage in den erweiterten Filteroptionen.',
  'crud.toolbar.outdated':
    'Der Inhalt ist veraltet und stimmt nicht mehr mit der aktuellen Abfrage überein. Klicke erneut auf „Suchen“, um die Ergebnisse der aktuellen Abfrage zu sehen.',
  'crud.bulkToast.deleteFinished':
    'Der Löschvorgang wurde erfolgreich abgeschlossen.',
  'crud.bulkToast.deletedOne': '{count} Dokument wurde gelöscht.',
  'crud.bulkToast.deletedMany': '{count} Dokumente wurden gelöscht.',
  'crud.bulkToast.refresh': 'aktualisieren',
  'crud.bulkToast.deleteInProgress': 'Der Löschvorgang läuft.',
  'crud.bulkToast.deletingOne': '{count} Dokument wird gelöscht.',
  'crud.bulkToast.deletingMany': '{count} Dokumente werden gelöscht.',
  'crud.bulkToast.deleteNetworkError':
    'Löschvorgang – Netzwerkfehler aufgetreten.',
  'crud.bulkToast.updateNetworkError':
    'Aktualisierungsvorgang – Netzwerkfehler aufgetreten.',
  'crud.bulkToast.deleteFailed': 'Der Löschvorgang ist fehlgeschlagen.',
  'crud.bulkToast.updateFailed':
    'Der Aktualisierungsvorgang ist fehlgeschlagen.',
  'crud.bulkToast.notDeletedOne':
    '{count} Dokument konnte nicht gelöscht werden.',
  'crud.bulkToast.notDeletedMany':
    '{count} Dokumente konnten nicht gelöscht werden.',
  'crud.bulkToast.viewDetails': 'Details anzeigen',
  'crud.bulkToast.updateFinished':
    'Der Aktualisierungsvorgang wurde erfolgreich abgeschlossen.',
  'crud.bulkToast.updatedOne': '{count} Dokument wurde aktualisiert.',
  'crud.bulkToast.updatedMany': '{count} Dokumente wurden aktualisiert.',
  'crud.bulkToast.updateInProgress': 'Der Aktualisierungsvorgang läuft.',
  'crud.bulkToast.updatingOne': '{count} Dokument wird aktualisiert.',
  'crud.bulkToast.updatingMany': '{count} Dokumente werden aktualisiert.',
  'crud.bulkDelete.titleOne': '{count} Dokument löschen',
  'crud.bulkDelete.titleMany': '{count} Dokumente löschen',
  'crud.bulkDelete.export': 'Exportieren',
  'crud.bulkDelete.previewOne': 'Vorschau (Stichprobe von {count} Dokument)',
  'crud.bulkDelete.previewMany': 'Vorschau (Stichprobe von {count} Dokumenten)',
  'crud.bulkDelete.cancel': 'Abbrechen',
  'crud.bulkDelete.deleteOne': '{count} Dokument löschen',
  'crud.bulkDelete.deleteMany': '{count} Dokumente löschen',
  'crud.bulkUpdate.save': 'Speichern',
  'crud.bulkUpdate.savedQueryName': 'Name der gespeicherten Abfrage',
  'crud.bulkUpdate.cancel': 'Abbrechen',
  'crud.bulkUpdate.sampleOne': '(Stichprobe von {count} Dokument)',
  'crud.bulkUpdate.sampleMany': '(Stichprobe von {count} Dokumenten)',
  'crud.bulkUpdate.preview': 'Vorschau',
  'crud.bulkUpdate.noResults': 'Keine Ergebnisse',
  'crud.bulkUpdate.tryModifying':
    'Ändere deine Abfrage, um Ergebnisse zu erhalten.',
  'crud.bulkUpdate.updateDocuments': 'Dokumente aktualisieren',
  'crud.bulkUpdate.updateOne': '1 Dokument aktualisieren',
  'crud.bulkUpdate.updateMany': '{count} Dokumente aktualisieren',
  'crud.bulkUpdate.update': 'Aktualisierung',
  'crud.bulkUpdate.learnMore': 'Mehr über die Update-Syntax erfahren',
  'crud.bulkUpdate.viewDetails': 'Details anzeigen',
  'crud.safeInteger.exceedsOne':
    'Die Zahl überschreitet den sicheren Ganzzahlbereich.',
  'crud.safeInteger.exceedsMany':
    'Die Zahlen überschreiten den sicheren Ganzzahlbereich.',
  'crud.jsonEditor.edit': 'Bearbeiten',
  'crud.jsonEditor.copy': 'Kopieren',
  'crud.jsonEditor.clone': 'Klonen',
  'crud.jsonEditor.delete': 'Löschen',
  'crud.insertDialog.shellSyntax': 'Shell-Syntax',
  'crud.insertDialog.visualEditor': 'Visueller Editor',
  'crud.insertDialog.ejson': 'EJSON',
  'crud.insertDialog.listNotSupported':
    'Diese Ansicht wird für mehrere Dokumente nicht unterstützt. Um Datentypen festzulegen und weitere Funktionen dieser Ansicht zu nutzen, füge die Dokumente einzeln ein.',
  'crud.insertDialog.invalidMessage':
    'Einfügen ist nicht möglich, solange das Dokument Fehler enthält.',
  'crud.insertDialog.title': 'Dokument einfügen',
  'crud.insertDialog.subtitle': 'In Collection {ns}',
  'crud.insertDialog.insert': 'Einfügen',
  'crud.insertDialog.pasteHint':
    'Füge ein Dokument oder ein Array ein, um mehrere Dokumente einzufügen. Wenn keine ObjectId angegeben ist, wird automatisch eine vergeben.',
  'crud.insertDialog.view': 'Ansicht',
  'crud.insertDialog.visualEditorUnavailable':
    'Der visuelle Editor ist für mehrere Dokumente nicht verfügbar',
  'crud.insertDialog.fixNumbers':
    'Korrigiere die Zahlen außerhalb des sicheren Ganzzahlbereichs, um die Ansicht zu wechseln',
  'crud.changeView.collapseItems': 'Feldelemente einklappen',
  'crud.changeView.expandItems': 'Feldelemente ausklappen',
  'crud.documentList.fetching': 'Dokumente werden abgerufen',
  'crud.documentList.stop': 'Stopp',
  'crud.documentList.emptyTitle': 'Diese Collection enthält keine Daten',
  'crud.documentList.emptySubtitle':
    'Der Import von Daten aus einer JSON- oder CSV-Datei dauert nur wenige Sekunden.',
  'crud.documentList.importData': 'Daten importieren',
  'crud.documentList.noResults': 'Keine Ergebnisse',
  'crud.documentList.tryModifying':
    'Ändere deine Abfrage, um Ergebnisse zu erhalten.',
  'crud.ejsonConversion.notSerializable':
    'Das umgewandelte Dokument konnte nicht serialisiert werden.',
  'crud.tabTitle.documents': 'Dokumente',
  'crud.tabTitle.documentsStat': 'Dokumente: {value}',
  'crud.tabTitle.storageSize': 'Speichergröße: {value}',
  'crud.tabTitle.avgSize': 'Durchschn. Größe: {value}',
  'crud.tableView.newField': 'Neues Feld',
  'crud.tableView.editDocument': 'Dokument bearbeiten',
  'crud.tableView.copyDocument': 'Dokument kopieren',
  'crud.tableView.cloneDocument': 'Dokument klonen',
  'crud.tableView.deleteDocument': 'Dokument löschen',
  'crud.tableView.fieldType': 'Feldtyp',
  'crud.parse.invalidDefinition': 'Die angegebene Definition ist ungültig.',
  'crud.parse.notValidDocument':
    'Die angegebene Definition ist kein gültiges Dokument.',
  'crud.tableView.encryptedField': 'Verschlüsseltes Feld',
  'crud.tableView.undoChange': 'Änderung rückgängig machen',
  'crud.tableView.expandField': 'Feld ausklappen',
  'crud.tableView.noField': 'Kein Feld',
  'crud.tableView.deletedField': 'Gelöschtes Feld',
  'crud.tableView.fieldName': 'Feldname',
  'crud.tableView.value': 'Wert',
  'crud.tableView.removeField': 'Feld entfernen',
  'crud.tableView.addField': 'Feld hinzufügen',
  'crud.tableView.addFieldAfter': 'Feld hinzufügen nach',
  'crud.tableView.addFieldTo': 'Feld hinzufügen zu',
  'crud.tableView.addArrayElementTo': 'Array-Element hinzufügen zu',
  'crud.tableView.addArrayElementAfter': 'Array-Element hinzufügen nach',
  'crud.store.deleteWithoutId':
    'Dokumente ohne _id-Feld können nicht gelöscht werden.',
  'crud.store.noChanges':
    'Aktualisierung nicht möglich, es wurden keine Änderungen vorgenommen.',
  'crud.store.updateBlocked':
    'Aktualisierung blockiert, da aufgrund eines fehlenden oder unvollständigen Schemas versehentlich unverschlüsselte Daten geschrieben werden könnten.',
  'crud.store.updateFailed':
    'Beim Aktualisieren des Dokuments ist ein Fehler aufgetreten: {message}',
  'crud.store.confirmTitle': 'Bist du absolut sicher?',
  'crud.store.confirmDescriptionOne':
    'Diese Aktion kann nicht rückgängig gemacht werden. Dadurch wird {count} Dokument dauerhaft gelöscht.',
  'crud.store.confirmDescriptionMany':
    'Diese Aktion kann nicht rückgängig gemacht werden. Dadurch werden {count} Dokumente dauerhaft gelöscht.',
  'crud.store.unknownNumber': 'eine unbekannte Anzahl von',
  'crud.store.confirmWarning':
    'Die Dokumentliste und die Anzahl spiegeln möglicherweise nicht immer die neuesten Änderungen in Echtzeit wider. Diese Aktion gilt für alle relevanten Dokumente, auch für aktuell nicht sichtbare. Stelle daher sicher, dass sie sicher behandelt werden.',
  'crud.store.savedToMyQueries':
    '{name} wurde zu „Meine Abfragen“ hinzugefügt.',
};

export const fr: Catalog = {
  'serverStats.top.title': 'Collections les plus sollicitées',
  'serverStats.dataUnavailable': 'DONNÉES INDISPONIBLES',
  'serverStats.top.empty': 'Aucune collection sollicitée',
  'serverStats.currentOp.title': 'Opérations les plus lentes',
  'serverStats.currentOp.empty': 'Aucune opération lente',
  'serverStats.detail.title': "détails de l'opération",
  'serverStats.detail.close': 'Fermer',
  'serverStats.detail.client': 'client s',
  'serverStats.detail.active': 'actif',
  'serverStats.detail.waitLock': 'attente de verrou',
  'serverStats.detail.killOp': "Arrêter l'opération",
  'serverStats.toolbar.play': 'Reprendre',
  'serverStats.toolbar.pause': 'Pause',
  'serverStats.msgs.topUnavailableMongos':
    "La commande top n'est pas disponible pour mongos, certains graphiques peuvent n'afficher aucune donnée.",
  'serverStats.msgs.topIncomplete':
    "La commande top ne parvient pas à récupérer les informations de certaines collections, ce qui entraîne l'affichage de données incomplètes dans les graphiques.",
  'serverStats.dbError.commandFailed':
    "La commande « {command} » a renvoyé l'erreur « {error} »",
  'serverStats.tab.title': 'Performances',
  'serverStats.chart.readWrite': 'lecture et écriture',
  'serverStats.chart.memory': 'mémoire',
  'serverStats.chart.network': 'réseau',
  'serverStats.chart.operations': 'opérations',
  'serverStats.chart.loading': 'Chargement…',
  'crud.viewSwitcher.view': 'Vue',
  'crud.viewSwitcher.list': 'Liste de documents',
  'crud.viewSwitcher.json': 'Vue E-JSON',
  'crud.viewSwitcher.table': 'Vue tableau',
  'crud.readonlyFilter.filter': 'Filtre',
  'crud.readonlyFilter.returnToDocuments':
    "Revenez à l'onglet Documents pour modifier cette requête.",
  'crud.readonlyFilter.none': 'Aucun',
  'crud.ejsonBanner.containsKeys': 'Ce document contient des clés telles que',
  'crud.ejsonBanner.indicate':
    'ce qui indique que ce document devrait être au format',
  'crud.ejsonBanner.extendedJson': 'Extended JSON',
  'crud.ejsonBanner.format': 'différent du format accepté par cette vue.',
  'crud.ejsonBanner.convertQuestion':
    'Voulez-vous convertir ce texte en syntaxe Shell (par ex.',
  'crud.ejsonBanner.instead': 'au lieu de',
  'crud.ejsonBanner.convert': 'Convertir',
  'crud.ejsonBanner.conversionFailed': "Le document n'a pas pu être converti :",
  'crud.csfleBanner.fieldsEncrypted':
    'Les champs suivants seront chiffrés conformément au schéma de la collection :',
  'crud.csfleBanner.noKnownSchema':
    "Cette opération d'insertion ne chiffrera aucun champ du document, car aucun schéma ni aucune configuration In-Use Encryption n'est associé à la collection.",
  'crud.csfleBanner.incompleteSchema':
    "Cette opération d'insertion ne chiffrera pas tous les champs qui étaient chiffrés dans le document d'origine, car le schéma de cette collection est manquant ou incomplet.",
  'crud.csfleBanner.knownSchema':
    "Cette opération d'insertion chiffrera tous les champs spécifiés dans le schéma ou la configuration In-Use Encryption associés à la collection.",
  'crud.csfleBanner.disabled':
    "Cette opération d'insertion ne chiffrera aucun champ du document, car la prise en charge d'In-Use Encryption a été explicitement désactivée.",
  'crud.bulkActions.update': 'Mettre à jour des documents en masse',
  'crud.bulkActions.delete': 'Supprimer des documents en masse',
  'crud.bulkActions.bulk': 'En masse',
  'crud.addData.insertDocument': 'Insérer un document',
  'crud.addData.importFile': 'Importer un fichier JSON ou CSV',
  'crud.addData.generateMockData': 'Générer un script de données fictives',
  'crud.addData.button': 'Ajouter des données',
  'crud.insertBanner.convertToLong': 'Convertir en Long',
  'crud.insertBanner.convertAllToLong': 'Tout convertir en Long',
  'crud.insertBanner.inserting': 'Insertion du document',
  'crud.insertBanner.viewErrorDetails': "AFFICHER LES DÉTAILS DE L'ERREUR",
  'crud.contextMenu.collapseAll': 'Réduire tous les champs',
  'crud.contextMenu.expandAll': 'Développer tous les champs',
  'crud.contextMenu.cancelEditing': 'Annuler la modification',
  'crud.contextMenu.editDocument': 'Modifier le document',
  'crud.contextMenu.copyShell': 'Copier le document en syntaxe Shell',
  'crud.contextMenu.copyEjson': 'Copier le document en EJSON',
  'crud.contextMenu.clone': 'Cloner le document...',
  'crud.contextMenu.delete': 'Supprimer le document',
  'crud.toolbar.exportQueryResults': 'Exporter les résultats de la requête',
  'crud.toolbar.exportFullCollection': 'Exporter toute la collection',
  'crud.toolbar.expandAllDocuments': 'Développer tous les documents',
  'crud.toolbar.collapseAllDocuments': 'Réduire tous les documents',
  'crud.toolbar.insertDocumentEllipsis': 'Insérer un document...',
  'crud.toolbar.exportQueryResultsEllipsis':
    'Exporter les résultats de la requête...',
  'crud.toolbar.exportFullCollectionEllipsis':
    'Exporter toute la collection...',
  'crud.toolbar.bulkUpdate': 'Mise à jour en masse',
  'crud.toolbar.bulkDelete': 'Suppression en masse',
  'crud.toolbar.refresh': 'Actualiser',
  'crud.toolbar.find': 'Rechercher',
  'crud.toolbar.removeLimitAndSkip':
    'Supprimez la limite et le saut (skip) de votre requête pour effectuer une opération en masse',
  'crud.toolbar.exportData': 'Exporter les données',
  'crud.toolbar.exportToLanguage': 'Exporter la requête vers un langage',
  'crud.toolbar.exportCode': 'Exporter le code',
  'crud.toolbar.docsPerPage': 'Modifier le nombre de documents par page',
  'crud.toolbar.of': 'sur',
  'crud.toolbar.notAvailable': 'N/D',
  'crud.toolbar.countUnavailable':
    "Le nombre n'est pas disponible pour cette requête. Cela peut se produire lorsque l'opération de comptage échoue ou dépasse le maxTimeMS de {maxTimeMS}.",
  'crud.toolbar.fetchingCount': 'Récupération du nombre de documents…',
  'crud.toolbar.refreshDocuments': 'Actualiser les documents',
  'crud.toolbar.previousPage': 'Page précédente',
  'crud.toolbar.nextPage': 'Page suivante',
  'crud.toolbar.outputOptions': 'Options de sortie',
  'crud.toolbar.increaseMaxTimeMS':
    "L'opération a dépassé la limite de temps. Essayez d'augmenter le maxTimeMS de la requête dans les options de filtre avancées.",
  'crud.toolbar.outdated':
    "Le contenu est obsolète et n'est plus synchronisé avec la requête actuelle. Cliquez à nouveau sur « Rechercher » pour afficher les résultats de la requête actuelle.",
  'crud.bulkToast.deleteFinished':
    "L'opération de suppression s'est terminée avec succès.",
  'crud.bulkToast.deletedOne': '{count} document a été supprimé.',
  'crud.bulkToast.deletedMany': '{count} documents ont été supprimés.',
  'crud.bulkToast.refresh': 'actualiser',
  'crud.bulkToast.deleteInProgress': "L'opération de suppression est en cours.",
  'crud.bulkToast.deletingOne': '{count} document est en cours de suppression.',
  'crud.bulkToast.deletingMany':
    '{count} documents sont en cours de suppression.',
  'crud.bulkToast.deleteNetworkError':
    "Opération de suppression – une erreur réseau s'est produite.",
  'crud.bulkToast.updateNetworkError':
    "Opération de mise à jour – une erreur réseau s'est produite.",
  'crud.bulkToast.deleteFailed': "L'opération de suppression a échoué.",
  'crud.bulkToast.updateFailed': "L'opération de mise à jour a échoué.",
  'crud.bulkToast.notDeletedOne': "{count} document n'a pas pu être supprimé.",
  'crud.bulkToast.notDeletedMany':
    "{count} documents n'ont pas pu être supprimés.",
  'crud.bulkToast.viewDetails': 'Afficher les détails',
  'crud.bulkToast.updateFinished':
    "L'opération de mise à jour s'est terminée avec succès.",
  'crud.bulkToast.updatedOne': '{count} document a été mis à jour.',
  'crud.bulkToast.updatedMany': '{count} documents ont été mis à jour.',
  'crud.bulkToast.updateInProgress': "L'opération de mise à jour est en cours.",
  'crud.bulkToast.updatingOne': '{count} document est en cours de mise à jour.',
  'crud.bulkToast.updatingMany':
    '{count} documents sont en cours de mise à jour.',
  'crud.bulkDelete.titleOne': 'Supprimer {count} document',
  'crud.bulkDelete.titleMany': 'Supprimer {count} documents',
  'crud.bulkDelete.export': 'Exporter',
  'crud.bulkDelete.previewOne': 'Aperçu (échantillon de {count} document)',
  'crud.bulkDelete.previewMany': 'Aperçu (échantillon de {count} documents)',
  'crud.bulkDelete.cancel': 'Annuler',
  'crud.bulkDelete.deleteOne': 'Supprimer {count} document',
  'crud.bulkDelete.deleteMany': 'Supprimer {count} documents',
  'crud.bulkUpdate.save': 'Enregistrer',
  'crud.bulkUpdate.savedQueryName': 'Nom de la requête enregistrée',
  'crud.bulkUpdate.cancel': 'Annuler',
  'crud.bulkUpdate.sampleOne': '(échantillon de {count} document)',
  'crud.bulkUpdate.sampleMany': '(échantillon de {count} documents)',
  'crud.bulkUpdate.preview': 'Aperçu',
  'crud.bulkUpdate.noResults': 'Aucun résultat',
  'crud.bulkUpdate.tryModifying':
    'Essayez de modifier votre requête pour obtenir des résultats.',
  'crud.bulkUpdate.updateDocuments': 'Mettre à jour les documents',
  'crud.bulkUpdate.updateOne': 'Mettre à jour 1 document',
  'crud.bulkUpdate.updateMany': 'Mettre à jour {count} documents',
  'crud.bulkUpdate.update': 'Mise à jour',
  'crud.bulkUpdate.learnMore': 'En savoir plus sur la syntaxe de mise à jour',
  'crud.bulkUpdate.viewDetails': 'Afficher les détails',
  'crud.safeInteger.exceedsOne': "Le nombre dépasse la plage d'entiers sûre.",
  'crud.safeInteger.exceedsMany':
    "Les nombres dépassent la plage d'entiers sûre.",
  'crud.jsonEditor.edit': 'Modifier',
  'crud.jsonEditor.copy': 'Copier',
  'crud.jsonEditor.clone': 'Cloner',
  'crud.jsonEditor.delete': 'Supprimer',
  'crud.insertDialog.shellSyntax': 'Syntaxe Shell',
  'crud.insertDialog.visualEditor': 'Éditeur visuel',
  'crud.insertDialog.ejson': 'EJSON',
  'crud.insertDialog.listNotSupported':
    "Cette vue n'est pas prise en charge pour plusieurs documents. Pour spécifier des types de données et utiliser les autres fonctionnalités de cette vue, veuillez insérer les documents un par un.",
  'crud.insertDialog.invalidMessage':
    "L'insertion n'est pas autorisée tant que le document contient des erreurs.",
  'crud.insertDialog.title': 'Insérer un document',
  'crud.insertDialog.subtitle': 'Dans la collection {ns}',
  'crud.insertDialog.insert': 'Insérer',
  'crud.insertDialog.pasteHint':
    "Collez un document ou un tableau pour en insérer plusieurs. Si aucun ObjectId n'est spécifié, un ObjectId est attribué automatiquement.",
  'crud.insertDialog.view': 'Vue',
  'crud.insertDialog.visualEditorUnavailable':
    "L'éditeur visuel n'est pas disponible pour plusieurs documents",
  'crud.insertDialog.fixNumbers':
    "Corrigez les nombres dépassant la plage d'entiers sûre pour changer de vue",
  'crud.changeView.collapseItems': 'Réduire les éléments du champ',
  'crud.changeView.expandItems': 'Développer les éléments du champ',
  'crud.documentList.fetching': 'Récupération des documents',
  'crud.documentList.stop': 'Arrêter',
  'crud.documentList.emptyTitle': 'Cette collection ne contient aucune donnée',
  'crud.documentList.emptySubtitle':
    "L'importation de données depuis un fichier JSON ou CSV ne prend que quelques secondes.",
  'crud.documentList.importData': 'Importer des données',
  'crud.documentList.noResults': 'Aucun résultat',
  'crud.documentList.tryModifying':
    'Essayez de modifier votre requête pour obtenir des résultats.',
  'crud.ejsonConversion.notSerializable':
    "Le document converti n'a pas pu être sérialisé.",
  'crud.tabTitle.documents': 'Documents',
  'crud.tabTitle.documentsStat': 'Documents : {value}',
  'crud.tabTitle.storageSize': 'Taille de stockage : {value}',
  'crud.tabTitle.avgSize': 'Taille moy. : {value}',
  'crud.tableView.newField': 'Nouveau champ',
  'crud.tableView.editDocument': 'Modifier le document',
  'crud.tableView.copyDocument': 'Copier le document',
  'crud.tableView.cloneDocument': 'Cloner le document',
  'crud.tableView.deleteDocument': 'Supprimer le document',
  'crud.tableView.fieldType': 'Type de champ',
  'crud.parse.invalidDefinition': 'La définition fournie est invalide.',
  'crud.parse.notValidDocument':
    "La définition fournie n'est pas un document valide.",
  'crud.tableView.encryptedField': 'Champ chiffré',
  'crud.tableView.undoChange': 'Annuler la modification',
  'crud.tableView.expandField': 'Développer le champ',
  'crud.tableView.noField': 'Aucun champ',
  'crud.tableView.deletedField': 'Champ supprimé',
  'crud.tableView.fieldName': 'Nom du champ',
  'crud.tableView.value': 'Valeur',
  'crud.tableView.removeField': 'Supprimer le champ',
  'crud.tableView.addField': 'Ajouter un champ',
  'crud.tableView.addFieldAfter': 'Ajouter un champ après',
  'crud.tableView.addFieldTo': 'Ajouter un champ à',
  'crud.tableView.addArrayElementTo': 'Ajouter un élément de tableau à',
  'crud.tableView.addArrayElementAfter': 'Ajouter un élément de tableau après',
  'crud.store.deleteWithoutId':
    'Impossible de supprimer des documents sans champ _id.',
  'crud.store.noChanges':
    "Impossible de mettre à jour : aucune modification n'a été effectuée.",
  'crud.store.updateBlocked':
    "Mise à jour bloquée : elle pourrait écrire involontairement des données non chiffrées en raison d'un schéma manquant ou incomplet.",
  'crud.store.updateFailed':
    "Une erreur s'est produite lors de la mise à jour du document : {message}",
  'crud.store.confirmTitle': 'Êtes-vous absolument sûr(e) ?',
  'crud.store.confirmDescriptionOne':
    'Cette action est irréversible. Elle supprimera définitivement {count} document.',
  'crud.store.confirmDescriptionMany':
    'Cette action est irréversible. Elle supprimera définitivement {count} documents.',
  'crud.store.unknownNumber': 'un nombre inconnu de',
  'crud.store.confirmWarning':
    "La liste de documents et le décompte ne reflètent pas toujours les dernières modifications en temps réel. Cette action s'appliquera à tous les documents concernés, y compris ceux qui ne sont pas actuellement visibles. Veillez donc à ce qu'ils soient traités en toute sécurité.",
  'crud.store.savedToMyQueries': '{name} a été ajouté à « Mes requêtes ».',
};

export const es: Catalog = {
  'serverStats.top.title': 'Colecciones más activas',
  'serverStats.dataUnavailable': 'DATOS NO DISPONIBLES',
  'serverStats.top.empty': 'Sin colecciones activas',
  'serverStats.currentOp.title': 'Operaciones más lentas',
  'serverStats.currentOp.empty': 'Sin operaciones lentas',
  'serverStats.detail.title': 'detalles de la operación',
  'serverStats.detail.close': 'Cerrar',
  'serverStats.detail.client': 'cliente s',
  'serverStats.detail.active': 'activo',
  'serverStats.detail.waitLock': 'espera de bloqueo',
  'serverStats.detail.killOp': 'Terminar operación',
  'serverStats.toolbar.play': 'Reanudar',
  'serverStats.toolbar.pause': 'Pausar',
  'serverStats.msgs.topUnavailableMongos':
    'El comando top no está disponible para mongos, es posible que algunos gráficos no muestren datos.',
  'serverStats.msgs.topIncomplete':
    'El comando top no puede obtener información de determinadas colecciones, por lo que los gráficos muestran datos incompletos.',
  'serverStats.dbError.commandFailed':
    'El comando "{command}" devolvió el error "{error}"',
  'serverStats.tab.title': 'Rendimiento',
  'serverStats.chart.readWrite': 'lectura y escritura',
  'serverStats.chart.memory': 'memoria',
  'serverStats.chart.network': 'red',
  'serverStats.chart.operations': 'operaciones',
  'serverStats.chart.loading': 'Cargando…',
  'crud.viewSwitcher.view': 'Vista',
  'crud.viewSwitcher.list': 'Lista de documentos',
  'crud.viewSwitcher.json': 'Vista E-JSON',
  'crud.viewSwitcher.table': 'Vista de tabla',
  'crud.readonlyFilter.filter': 'Filtro',
  'crud.readonlyFilter.returnToDocuments':
    'Vuelve a la pestaña Documentos para editar esta consulta.',
  'crud.readonlyFilter.none': 'Ninguno',
  'crud.ejsonBanner.containsKeys': 'Este documento contiene claves como',
  'crud.ejsonBanner.indicate':
    'lo que indica que este documento debería estar en formato',
  'crud.ejsonBanner.extendedJson': 'Extended JSON',
  'crud.ejsonBanner.format': 'distinto del formato que acepta esta vista.',
  'crud.ejsonBanner.convertQuestion':
    '¿Quieres convertir este texto a sintaxis de Shell (p. ej.',
  'crud.ejsonBanner.instead': 'en lugar de',
  'crud.ejsonBanner.convert': 'Convertir',
  'crud.ejsonBanner.conversionFailed': 'No se pudo convertir el documento:',
  'crud.csfleBanner.fieldsEncrypted':
    'Los siguientes campos se cifrarán según el esquema de la colección:',
  'crud.csfleBanner.noKnownSchema':
    'Esta operación de inserción no cifrará ningún campo del documento porque la colección no tiene asociado ningún esquema ni configuración de In-Use Encryption.',
  'crud.csfleBanner.incompleteSchema':
    'Esta operación de inserción no cifrará todos los campos que estaban cifrados en el documento original porque falta el esquema de esta colección o está incompleto.',
  'crud.csfleBanner.knownSchema':
    'Esta operación de inserción cifrará todos los campos especificados en el esquema o en la configuración de In-Use Encryption asociados a la colección.',
  'crud.csfleBanner.disabled':
    'Esta operación de inserción no cifrará ningún campo del documento porque la compatibilidad con In-Use Encryption se desactivó explícitamente.',
  'crud.bulkActions.update': 'Actualizar documentos en masa',
  'crud.bulkActions.delete': 'Eliminar documentos en masa',
  'crud.bulkActions.bulk': 'En masa',
  'crud.addData.insertDocument': 'Insertar documento',
  'crud.addData.importFile': 'Importar archivo JSON o CSV',
  'crud.addData.generateMockData': 'Generar script de datos de prueba',
  'crud.addData.button': 'Añadir datos',
  'crud.insertBanner.convertToLong': 'Convertir a Long',
  'crud.insertBanner.convertAllToLong': 'Convertir todo a Long',
  'crud.insertBanner.inserting': 'Insertando documento',
  'crud.insertBanner.viewErrorDetails': 'VER DETALLES DEL ERROR',
  'crud.contextMenu.collapseAll': 'Contraer todos los campos',
  'crud.contextMenu.expandAll': 'Expandir todos los campos',
  'crud.contextMenu.cancelEditing': 'Cancelar edición',
  'crud.contextMenu.editDocument': 'Editar documento',
  'crud.contextMenu.copyShell': 'Copiar documento como sintaxis de Shell',
  'crud.contextMenu.copyEjson': 'Copiar documento como EJSON',
  'crud.contextMenu.clone': 'Clonar documento...',
  'crud.contextMenu.delete': 'Eliminar documento',
  'crud.toolbar.exportQueryResults': 'Exportar resultados de la consulta',
  'crud.toolbar.exportFullCollection': 'Exportar la colección completa',
  'crud.toolbar.expandAllDocuments': 'Expandir todos los documentos',
  'crud.toolbar.collapseAllDocuments': 'Contraer todos los documentos',
  'crud.toolbar.insertDocumentEllipsis': 'Insertar documento...',
  'crud.toolbar.exportQueryResultsEllipsis':
    'Exportar resultados de la consulta...',
  'crud.toolbar.exportFullCollectionEllipsis': 'Exportar colección completa...',
  'crud.toolbar.bulkUpdate': 'Actualización en masa',
  'crud.toolbar.bulkDelete': 'Eliminación en masa',
  'crud.toolbar.refresh': 'Actualizar',
  'crud.toolbar.find': 'Buscar',
  'crud.toolbar.removeLimitAndSkip':
    'Elimina el límite y el skip de tu consulta para realizar una operación en masa',
  'crud.toolbar.exportData': 'Exportar datos',
  'crud.toolbar.exportToLanguage': 'Exportar consulta a un lenguaje',
  'crud.toolbar.exportCode': 'Exportar código',
  'crud.toolbar.docsPerPage': 'Cambiar el número de documentos por página',
  'crud.toolbar.of': 'de',
  'crud.toolbar.notAvailable': 'N/D',
  'crud.toolbar.countUnavailable':
    'El recuento no está disponible para esta consulta. Esto puede ocurrir cuando la operación de recuento falla o supera el maxTimeMS de {maxTimeMS}.',
  'crud.toolbar.fetchingCount': 'Obteniendo el número de documentos…',
  'crud.toolbar.refreshDocuments': 'Actualizar documentos',
  'crud.toolbar.previousPage': 'Página anterior',
  'crud.toolbar.nextPage': 'Página siguiente',
  'crud.toolbar.outputOptions': 'Opciones de salida',
  'crud.toolbar.increaseMaxTimeMS':
    'La operación superó el límite de tiempo. Prueba a aumentar el maxTimeMS de la consulta en las opciones de filtro ampliadas.',
  'crud.toolbar.outdated':
    'El contenido está desactualizado y ya no está sincronizado con la consulta actual. Pulsa «Buscar» de nuevo para ver los resultados de la consulta actual.',
  'crud.bulkToast.deleteFinished':
    'La operación de eliminación finalizó correctamente.',
  'crud.bulkToast.deletedOne': 'Se ha eliminado {count} documento.',
  'crud.bulkToast.deletedMany': 'Se han eliminado {count} documentos.',
  'crud.bulkToast.refresh': 'actualizar',
  'crud.bulkToast.deleteInProgress':
    'La operación de eliminación está en curso.',
  'crud.bulkToast.deletingOne': 'Se está eliminando {count} documento.',
  'crud.bulkToast.deletingMany': 'Se están eliminando {count} documentos.',
  'crud.bulkToast.deleteNetworkError':
    'Operación de eliminación: se produjo un error de red.',
  'crud.bulkToast.updateNetworkError':
    'Operación de actualización: se produjo un error de red.',
  'crud.bulkToast.deleteFailed': 'La operación de eliminación falló.',
  'crud.bulkToast.updateFailed': 'La operación de actualización falló.',
  'crud.bulkToast.notDeletedOne': 'No se pudo eliminar {count} documento.',
  'crud.bulkToast.notDeletedMany':
    'No se pudieron eliminar {count} documentos.',
  'crud.bulkToast.viewDetails': 'Ver detalles',
  'crud.bulkToast.updateFinished':
    'La operación de actualización finalizó correctamente.',
  'crud.bulkToast.updatedOne': 'Se ha actualizado {count} documento.',
  'crud.bulkToast.updatedMany': 'Se han actualizado {count} documentos.',
  'crud.bulkToast.updateInProgress':
    'La operación de actualización está en curso.',
  'crud.bulkToast.updatingOne': 'Se está actualizando {count} documento.',
  'crud.bulkToast.updatingMany': 'Se están actualizando {count} documentos.',
  'crud.bulkDelete.titleOne': 'Eliminar {count} documento',
  'crud.bulkDelete.titleMany': 'Eliminar {count} documentos',
  'crud.bulkDelete.export': 'Exportar',
  'crud.bulkDelete.previewOne': 'Vista previa (muestra de {count} documento)',
  'crud.bulkDelete.previewMany': 'Vista previa (muestra de {count} documentos)',
  'crud.bulkDelete.cancel': 'Cancelar',
  'crud.bulkDelete.deleteOne': 'Eliminar {count} documento',
  'crud.bulkDelete.deleteMany': 'Eliminar {count} documentos',
  'crud.bulkUpdate.save': 'Guardar',
  'crud.bulkUpdate.savedQueryName': 'Nombre de la consulta guardada',
  'crud.bulkUpdate.cancel': 'Cancelar',
  'crud.bulkUpdate.sampleOne': '(muestra de {count} documento)',
  'crud.bulkUpdate.sampleMany': '(muestra de {count} documentos)',
  'crud.bulkUpdate.preview': 'Vista previa',
  'crud.bulkUpdate.noResults': 'Sin resultados',
  'crud.bulkUpdate.tryModifying':
    'Prueba a modificar tu consulta para obtener resultados.',
  'crud.bulkUpdate.updateDocuments': 'Actualizar documentos',
  'crud.bulkUpdate.updateOne': 'Actualizar 1 documento',
  'crud.bulkUpdate.updateMany': 'Actualizar {count} documentos',
  'crud.bulkUpdate.update': 'Actualización',
  'crud.bulkUpdate.learnMore':
    'Más información sobre la sintaxis de actualización',
  'crud.bulkUpdate.viewDetails': 'Ver detalles',
  'crud.safeInteger.exceedsOne':
    'El número supera el intervalo de enteros seguro.',
  'crud.safeInteger.exceedsMany':
    'Los números superan el intervalo de enteros seguro.',
  'crud.jsonEditor.edit': 'Editar',
  'crud.jsonEditor.copy': 'Copiar',
  'crud.jsonEditor.clone': 'Clonar',
  'crud.jsonEditor.delete': 'Eliminar',
  'crud.insertDialog.shellSyntax': 'Sintaxis de Shell',
  'crud.insertDialog.visualEditor': 'Editor visual',
  'crud.insertDialog.ejson': 'EJSON',
  'crud.insertDialog.listNotSupported':
    'Esta vista no es compatible con varios documentos. Para especificar tipos de datos y usar otras funciones de esta vista, inserta los documentos de uno en uno.',
  'crud.insertDialog.invalidMessage':
    'No se permite insertar mientras el documento contenga errores.',
  'crud.insertDialog.title': 'Insertar documento',
  'crud.insertDialog.subtitle': 'En la colección {ns}',
  'crud.insertDialog.insert': 'Insertar',
  'crud.insertDialog.pasteHint':
    'Pega un documento o un array para insertar varios. Si no se especifica un ObjectId, se asigna uno automáticamente.',
  'crud.insertDialog.view': 'Vista',
  'crud.insertDialog.visualEditorUnavailable':
    'El editor visual no está disponible para varios documentos',
  'crud.insertDialog.fixNumbers':
    'Corrige los números que superan el intervalo de enteros seguro para cambiar de vista',
  'crud.changeView.collapseItems': 'Contraer los elementos del campo',
  'crud.changeView.expandItems': 'Expandir los elementos del campo',
  'crud.documentList.fetching': 'Obteniendo documentos',
  'crud.documentList.stop': 'Detener',
  'crud.documentList.emptyTitle': 'Esta colección no tiene datos',
  'crud.documentList.emptySubtitle':
    'Importar datos desde un archivo JSON o CSV solo lleva unos segundos.',
  'crud.documentList.importData': 'Importar datos',
  'crud.documentList.noResults': 'Sin resultados',
  'crud.documentList.tryModifying':
    'Prueba a modificar tu consulta para obtener resultados.',
  'crud.ejsonConversion.notSerializable':
    'No se pudo serializar el documento convertido.',
  'crud.tabTitle.documents': 'Documentos',
  'crud.tabTitle.documentsStat': 'Documentos: {value}',
  'crud.tabTitle.storageSize': 'Tamaño de almacenamiento: {value}',
  'crud.tabTitle.avgSize': 'Tamaño prom.: {value}',
  'crud.tableView.newField': 'Nuevo campo',
  'crud.tableView.editDocument': 'Editar documento',
  'crud.tableView.copyDocument': 'Copiar documento',
  'crud.tableView.cloneDocument': 'Clonar documento',
  'crud.tableView.deleteDocument': 'Eliminar documento',
  'crud.tableView.fieldType': 'Tipo de campo',
  'crud.parse.invalidDefinition': 'La definición proporcionada no es válida.',
  'crud.parse.notValidDocument':
    'La definición proporcionada no es un documento válido.',
  'crud.tableView.encryptedField': 'Campo cifrado',
  'crud.tableView.undoChange': 'Deshacer cambio',
  'crud.tableView.expandField': 'Expandir campo',
  'crud.tableView.noField': 'Sin campo',
  'crud.tableView.deletedField': 'Campo eliminado',
  'crud.tableView.fieldName': 'Nombre del campo',
  'crud.tableView.value': 'Valor',
  'crud.tableView.removeField': 'Quitar campo',
  'crud.tableView.addField': 'Añadir campo',
  'crud.tableView.addFieldAfter': 'Añadir campo después de',
  'crud.tableView.addFieldTo': 'Añadir campo a',
  'crud.tableView.addArrayElementTo': 'Añadir elemento de array a',
  'crud.tableView.addArrayElementAfter': 'Añadir elemento de array después de',
  'crud.store.deleteWithoutId':
    'No se pueden eliminar documentos que no tienen un campo _id.',
  'crud.store.noChanges':
    'No se puede actualizar: no se han realizado cambios.',
  'crud.store.updateBlocked':
    'Actualización bloqueada porque podría escribir datos sin cifrar de forma involuntaria debido a un esquema ausente o incompleto.',
  'crud.store.updateFailed':
    'Se produjo un error al intentar actualizar el documento: {message}',
  'crud.store.confirmTitle': '¿Estás completamente seguro?',
  'crud.store.confirmDescriptionOne':
    'Esta acción no se puede deshacer. Se eliminará permanentemente {count} documento.',
  'crud.store.confirmDescriptionMany':
    'Esta acción no se puede deshacer. Se eliminarán permanentemente {count} documentos.',
  'crud.store.unknownNumber': 'un número desconocido de',
  'crud.store.confirmWarning':
    'Es posible que la lista de documentos y el recuento no siempre reflejen las últimas actualizaciones en tiempo real. Esta acción se aplicará a todos los documentos relevantes, incluidos los que no están visibles actualmente, así que asegúrate de que se traten de forma segura.',
  'crud.store.savedToMyQueries': '{name} se añadió a «Mis consultas».',
};
