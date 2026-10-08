import type { Catalog } from './translations';

// Texts of the compass-indexes plugin. See ./translations.ts for the key
// conventions.

export const de: Catalog = {
  'indexes.createIndexActions.cancel': 'Abbrechen',
  'indexes.createIndexActions.create': 'Index erstellen',
  'indexes.createIndexFields.ariaLabel': 'Indexfelder',
  'indexes.createIndexFields.fieldNamePlaceholder':
    'Feldnamen auswählen oder eingeben',
  'indexes.createIndexFields.customField': 'Feld: "{value}"',
  'indexes.createIndexFields.fieldTypePlaceholder': 'Typ auswählen',
  'indexes.createIndexFields.preview': 'Vorschau',
  'indexes.createIndexForm.indexFields': 'Indexfelder',
  'indexes.createIndexForm.options': 'Optionen',
  'indexes.createIndexModal.title': 'Index erstellen',
  'indexes.searchIndexForm.createFor': '{indexLabel} für {namespace} erstellen',
  'indexes.searchIndexForm.searchTagline':
    'Volltextsuche für relevanzbasierte App-Funktionen.',
  'indexes.searchIndexForm.vectorTagline':
    'Für semantische Suche und KI-Anwendungen.',
  'indexes.searchIndexForm.indexName': 'Indexname',
  'indexes.searchIndexForm.nameDescription':
    'Gib deinem {indexLabel} einen Namen, damit du ihn leicht wiederfindest',
  'indexes.createSearchIndex.nameRequired':
    'Bitte gib den Namen des Index ein.',
  'indexes.searchIndexForm.defaultConfiguration':
    'Standardmäßig hat dein {indexLabel} die folgenden Konfigurationen. Wir empfehlen, damit zu beginnen und sie später bei Bedarf anzupassen.',
  'indexes.searchIndexForm.templateTooltip':
    'Wenn du eine neue Vorlage auswählst, wird deine vorhandene Indexdefinition im Code-Editor ersetzt.',
  'indexes.searchIndexForm.cancel': 'Abbrechen',
  'indexes.searchIndexForm.create': '{indexLabel} erstellen',
  'indexes.searchIndexForm.noPermissionCreateCluster':
    'Du hast derzeit keine Berechtigung, {indexLabel} in diesem Cluster zu erstellen.',
  'indexes.searchIndexForm.noPermissionCreateProject':
    'Du hast derzeit keine Berechtigung, {indexLabel} in diesem Projekt zu erstellen. Wende dich an den Projektinhaber, um die Rolle Project Data Access Admin anzufordern.',
  'indexes.searchIndexForm.edit': '{indexLabel} bearbeiten',
  'indexes.searchIndexForm.queryable': 'Abfragbar',
  'indexes.searchIndexForm.nonQueryable': 'Nicht abfragbar',
  'indexes.searchIndexForm.parsesDataBefore':
    'Dieser {indexLabel} analysiert die Daten in',
  'indexes.searchIndexForm.parsesDataAfter':
    'und hat die folgenden Konfigurationen.',
  'indexes.searchIndexForm.saveAndRebuild': 'Speichern und neu erstellen',
  'indexes.searchIndexForm.noPermissionEditCluster':
    'Du hast derzeit keine Berechtigung, {indexLabel} in diesem Cluster zu bearbeiten.',
  'indexes.searchIndexForm.noPermissionEditProject':
    'Du hast derzeit keine Berechtigung, {indexLabel} in diesem Projekt zu bearbeiten. Wende dich an den Projektinhaber, um die Rolle Project Data Access Admin anzufordern.',
  'indexes.listDrawer.refreshingIndexes': 'Indizes werden aktualisiert',
  'indexes.listDrawer.refreshIndexes': 'Indizes aktualisieren',
  'indexes.listDrawer.refresh': 'Aktualisieren',
  'indexes.listDrawer.createNew': 'Neu erstellen',
  'indexes.listDrawer.standardIndex': 'Standardindex',
  'indexes.listDrawer.searchIndex': 'Suchindex',
  'indexes.listDrawer.vectorSearchIndex': 'Vektorsuchindex',
  'indexes.listDrawer.searchAriaLabel': 'Indexsuche',
  'indexes.listDrawer.searchPlaceholder': 'Nach Indexname suchen',
  'indexes.listDrawer.standard': 'Standard',
  'indexes.listDrawer.search': 'Suche',
  'indexes.atlasBanner.lookingForSearch': 'Suchst du nach Suchindizes?',
  'indexes.atlasBanner.viewIndexDetails':
    'Indexgrößen, Abfragbarkeitsstatus und den Build-Fortschritt pro Knoten findest du unter ',
  'indexes.atlasBanner.createdUnder':
    'Diese Indizes lassen sich erstellen und anzeigen unter ',
  'indexes.atlasBanner.searchAndVectorSearch': 'Search und Vector Search',
  'indexes.toolbar.refreshingIndexes': 'Indizes werden aktualisiert',
  'indexes.toolbar.refreshIndexes': 'Indizes aktualisieren',
  'indexes.toolbar.pipelineNotSearchQueryable':
    'Suchindizes können nur für Views erstellt werden, die $match-Stages mit dem Operator $expr, $addFields oder $set enthalten',
  'indexes.toolbar.refresh': 'Aktualisieren',
  'indexes.toolbar.manageSearchIndexes': 'Suchindizes verwalten',
  'indexes.toolbar.viewing': 'Ansicht',
  'indexes.toolbar.indexes': 'Indizes',
  'indexes.toolbar.readonlyViewsNoStandardIndexes':
    'Schreibgeschützte Views dürfen keine Standardindizes enthalten.',
  'indexes.toolbar.searchIndexes': 'Suchindizes',
  'indexes.toolbar.unableToFetchSearchIndexes':
    'Suchindizes konnten nicht abgerufen werden. Das kann passieren, wenn dein Cluster keine Suchindizes unterstützt oder die Anfrage zum Auflisten der Suchindizes fehlgeschlagen ist.',
  'indexes.toolbar.searchManagementRequirements':
    'Die Verwaltung von Atlas-Search-Indizes in Compass ist nur für lokale Atlas-Deployments und Cluster mit MongoDB 6.0.7 oder neuer verfügbar.',
  'indexes.toolbar.searchManagementEarlierVersions':
    'Für Cluster mit einer älteren MongoDB-Version kannst du deine Atlas-Search-Indizes über die Atlas-Weboberfläche, die CLI oder die Administration API verwalten.',
  'indexes.toolbar.createSearchIndex': 'Suchindex erstellen',
  'indexes.toolbar.create': 'Erstellen',
  'indexes.toolbar.createMenuIndex': 'Index',
  'indexes.toolbar.createMenuSearchIndex': 'Suchindex',
  'indexes.toolbar.createIndex': 'Index erstellen',
  'indexes.indexActions.cancelIndex': 'Index {name} abbrechen',
  'indexes.indexActions.cancelIndexTooltip': 'Index abbrechen',
  'indexes.indexActions.unhideIndex': 'Index {name} einblenden',
  'indexes.indexActions.unhideIndexTooltip': 'Index einblenden',
  'indexes.indexActions.hideIndex': 'Index {name} ausblenden',
  'indexes.indexActions.hideIndexTooltip': 'Index ausblenden',
  'indexes.indexActions.dropIndex': 'Index {name} löschen',
  'indexes.indexActions.dropIndexTooltip': 'Index löschen',
  'indexes.indexActions.buildingPercent': 'Wird erstellt… {percent} %',
  'indexes.indexActions.buildingFor': 'Wird seit {duration} erstellt…',
  'indexes.indexActions.building': 'Wird erstellt…',
  'indexes.indexActions.buildInProgress': 'Indexerstellung läuft',
  'indexes.regularDrawer.indexName': 'Indexname: ',
  'indexes.regularDrawer.noIndexes': 'Keine Standardindizes gefunden',
  'indexes.regularDrawer.createIndex': 'Index erstellen',
  'indexes.sizeField.tooltip': '{percent} % im Vergleich zum größten Index',
  'indexes.statusField.ready': 'Bereit',
  'indexes.statusField.buildingTooltip':
    'Dieser Index wird im rollierenden Verfahren erstellt',
  'indexes.statusField.building': 'Wird erstellt',
  'indexes.statusField.inProgress': 'In Bearbeitung',
  'indexes.statusField.creating': 'Wird erstellt',
  'indexes.statusField.failed': 'Fehlgeschlagen',
  'indexes.statusField.unknownTooltip':
    'Build-Status nicht verfügbar (unzureichende Berechtigungen)',
  'indexes.statusField.unknown': 'Unbekannt',
  'indexes.usageField.noStats':
    'Entweder unterstützt der Server den Befehl $indexStats nicht oder der Benutzer ist nicht berechtigt, ihn auszuführen.',
  'indexes.usageField.hits':
    '{usage} Index-Treffer seit der Indexerstellung oder dem letzten Serverneustart',
  'indexes.usageField.unavailable': 'Nutzungsdaten nicht verfügbar',
  'indexes.usageField.since': '(seit {date})',
  'indexes.templateDropdown.template': 'Vorlage',
  'indexes.templateDropdown.autoEmbed': 'Automatisches Embedding',
  'indexes.templateDropdown.bringYourOwn': 'Eigene Embeddings verwenden',
  'indexes.searchModal.createTitle': 'Atlas-Search-Index erstellen',
  'indexes.searchModal.editVectorTitle':
    'Vektorsuchindex „{indexName}“ bearbeiten',
  'indexes.searchModal.editSearchTitle': 'Suchindex „{indexName}“ bearbeiten',
  'indexes.searchModal.nameOfSearchIndex': 'Name des Suchindex',
  'indexes.searchModal.indexType': 'Atlas-Search-Indextyp',
  'indexes.searchModal.indexDefinition': 'Indexdefinition',
  'indexes.searchModal.vectorTutorials':
    'Atlas-Vector-Search-Tutorials ansehen',
  'indexes.searchModal.searchTutorials': 'Atlas-Search-Tutorials ansehen',
  'indexes.searchModal.autoEmbedCostBanner':
    'Automatisches Embedding verwendet Embedding-Modelle, die nutzungsbasierte Kosten verursachen. Die generierten Vektor-Embeddings werden in deinem MongoDB-Cluster gespeichert. Die Modell-Inferenzplattform läuft auf der MongoDB-Infrastruktur in der GCP-Cloud in einer US-Region.',
  'indexes.searchModal.updateNote':
    'Hinweis: Das Aktualisieren der Indexdefinition verbraucht zusätzliche Ressourcen deines Clusters.',
  'indexes.searchModal.autoEmbedRestricted':
    'Während der Public Preview kannst du ein autoEmbed-Feld (Pfad, Modell, Quantisierung usw.) in einem vorhandenen Index nicht bearbeiten. Das gilt auch für das Hinzufügen, Entfernen oder Ändern von Feldern. Erstelle einen neuen Index, um eine andere autoEmbed-Konfiguration zu verwenden.',
  'indexes.searchModal.cancel': 'Abbrechen',
  'indexes.searchModal.createSearchIndex': 'Suchindex erstellen',
  'indexes.searchModal.save': 'Speichern',
  'indexes.searchModal.makeChange':
    'Ändere die Indexdefinition, um das Speichern zu aktivieren.',
  'indexes.searchActions.editIndex': 'Index {name} bearbeiten',
  'indexes.searchActions.editIndexTooltip': 'Index bearbeiten',
  'indexes.searchActions.dropIndex': 'Index {name} löschen',
  'indexes.searchActions.dropIndexTooltip': 'Index löschen',
  'indexes.searchActions.aggregate': 'Aggregieren',
  'indexes.searchDrawer.indexName': 'Indexname: ',
  'indexes.searchDrawer.status': 'Status: ',
  'indexes.searchDrawer.indexFields': 'Indexfelder: ',
  'indexes.searchDrawer.queryable': 'Abfragbar: ',
  'indexes.searchDrawer.noIndexes': 'Keine Suchindizes gefunden',
  'indexes.searchDrawer.defineA': 'Definiere einen',
  'indexes.searchDrawer.search': 'Suchindex',
  'indexes.searchDrawer.or': 'oder einen',
  'indexes.searchDrawer.vectorSearchIndex': 'Vektorsuchindex',
  'indexes.searchDrawer.toStartUsing':
    'zur Verwendung von $search oder $vectorSearch.',
  'indexes.searchDrawer.createSearchIndex': 'Suchindex erstellen',
  'indexes.searchDrawer.menuSearchIndex': 'Suchindex',
  'indexes.searchDrawer.menuVectorSearchIndex': 'Vektorsuchindex',
  'indexes.searchTable.noIndexes': 'Noch keine Suchindizes',
  'indexes.searchTable.zeroStateSubtitle':
    'Atlas Search ist eine in MongoDB Atlas integrierte Volltextsuche, die dir eine nahtlose, skalierbare Grundlage für relevanzbasierte App-Funktionen bietet.',
  'indexes.searchTable.createAtlasSearchIndex': 'Atlas-Search-Index erstellen',
  'indexes.searchTable.viewTooltip':
    'Suchindizes können nur für Views erstellt werden, die $match-Stages mit dem Operator $expr, $addFields oder $set enthalten.',
  'indexes.searchTable.notSureWhereToStart':
    'Du weißt nicht, wo du anfangen sollst?',
  'indexes.searchTable.visitDocs': 'Zur Dokumentation',
  'indexes.searchTable.noFields': 'Keine Felder in der Indexdefinition.',
  'indexes.searchTable.dynamicMappings': 'Dynamische Mappings',
  'indexes.searchTable.noMappings': 'Keine Mappings in der Indexdefinition.',
  'indexes.viewBanner.lookingForSearch': 'Suchst du nach Suchindizes?',
  'indexes.viewBanner.pipelineIncompatible':
    'Diese View ist nicht mit Suchindizes kompatibel. Nur Views mit $match-Stages, die den Operator $expr verwenden, sowie mit $addFields oder $set sind mit Suchindizes kompatibel.',
  'indexes.viewBanner.editView':
    'Bearbeite die View, um die Suchindizes neu zu erstellen.',
  'indexes.viewBanner.learnMore': 'Mehr erfahren.',
  'indexes.viewEmpty.title': 'Keine Standardindizes',
  'indexes.viewEmpty.subtitle':
    'Standard-Views verwenden die Indizes der zugrunde liegenden Collection. Daher kannst du Indizes für eine Standard-View nicht direkt erstellen, löschen oder neu erstellen und auch keine Liste der Indizes der View abrufen.',
  'indexes.viewEmpty.learnMore': 'Mehr über Views erfahren',
  'indexes.viewVersionBanner.upgradeAtlas':
    'Aktualisiere deinen Cluster oder verwalte Suchindizes für Views in der Atlas-Oberfläche.',
  'indexes.viewVersionBanner.upgrade':
    'Aktualisiere deinen Cluster, um Suchindizes für Views zu erstellen.',
  'indexes.viewVersionBanner.messageAtlas':
    'Deine MongoDB-Version ist {serverVersion}. Das Erstellen und Verwalten von Suchindizes für Views wird ab MongoDB-Version 8.1 unterstützt.',
  'indexes.viewVersionBanner.messageCompass':
    'Deine MongoDB-Version ist {serverVersion}. Das Erstellen und Verwalten von Suchindizes für Views in Compass wird ab MongoDB-Version 8.1 unterstützt.',
  'indexes.viewVersionBanner.upgradeCluster': 'Cluster aktualisieren',
  'indexes.createIndex.keysUnique': 'Indexschlüssel müssen eindeutig sein',
  'indexes.createIndex.unique.label': 'Eindeutigen Index erstellen',
  'indexes.createIndex.unique.description':
    'Ein eindeutiger Index stellt sicher, dass die indexierten Felder keine doppelten Werte speichern, d. h. er erzwingt die Eindeutigkeit der indexierten Felder.',
  'indexes.createIndex.name.label': 'Indexname',
  'indexes.createIndex.name.description':
    'Gib den Namen des zu erstellenden Index ein oder lass das Feld leer, damit MongoDB einen Standardnamen für den Index erzeugt.',
  'indexes.createIndex.ttl.label': 'TTL erstellen',
  'indexes.createIndex.ttl.description':
    'TTL-Indizes sind spezielle Einzelfeld-Indizes, mit denen MongoDB Dokumente nach einer bestimmten Zeitspanne oder zu einem bestimmten Zeitpunkt automatisch aus einer Collection entfernen kann.',
  'indexes.createIndex.partial.label': 'Partial-Filter-Ausdruck',
  'indexes.createIndex.partial.description':
    'Partielle Indizes indexieren nur die Dokumente einer Collection, die einen angegebenen Filterausdruck erfüllen.',
  'indexes.createIndex.wildcard.label': 'Wildcard-Projektion',
  'indexes.createIndex.wildcard.description':
    'Wildcard-Indizes unterstützen Abfragen auf unbekannte oder beliebige Felder.',
  'indexes.createIndex.collation.label':
    'Benutzerdefinierte Collation verwenden',
  'indexes.createIndex.collation.description':
    'Mit der Collation können Benutzer sprachspezifische Regeln für Zeichenfolgenvergleiche festlegen, z. B. für Groß- und Kleinschreibung und Akzente.',
  'indexes.createIndex.columnstore.label': 'Columnstore-Projektion',
  'indexes.createIndex.columnstore.preview': 'Vorschau',
  'indexes.createIndex.columnstore.description':
    'Columnstore-Indizes unterstützen Abfragen auf unbekannte oder beliebige Felder.',
  'indexes.createIndex.sparse.label': 'Sparse-Index erstellen',
  'indexes.createIndex.sparse.description':
    'Sparse-Indizes enthalten nur Einträge für Dokumente, die das indexierte Feld besitzen, auch wenn das Indexfeld den Wert null enthält. Dokumente ohne das indexierte Feld werden übersprungen.',
  'indexes.createIndex.rolling.label': 'In rollierendem Verfahren erstellen',
  'indexes.createIndex.rolling.description':
    'Das Erstellen eines Index im rollierenden Verfahren verringert die Ausfallsicherheit deines Clusters und verlängert die Dauer der Indexerstellung. Wir empfehlen rollierende Index-Builds nur, wenn reguläre Index-Builds deinen Anforderungen nicht genügen.',
  'indexes.createIndex.rolling.learnMore': 'Mehr erfahren',
  'indexes.createIndex.invalidCollation':
    'Du musst ein gültiges Collation-Objekt angeben',
  'indexes.createIndex.badTtl': 'Ungültiger TTL-Wert: "{value}"',
  'indexes.createIndex.badWildcardProjection':
    'Ungültige WildcardProjection: {error}',
  'indexes.createIndex.badColumnstoreProjection':
    'Ungültige ColumnstoreProjection: {error}',
  'indexes.createIndex.badPartialFilterExpression':
    'Ungültige PartialFilterExpression: {error}',
  'indexes.drawer.discardTitle': 'Nicht gespeicherte Änderungen gehen verloren',
  'indexes.drawer.discard': 'Verwerfen',
  'indexes.drawer.discardDescription': 'Möchtest du wirklich fortfahren?',
  'indexes.dropIndex.title': 'Index löschen',
  'indexes.dropIndex.description':
    'Möchtest du den Index "{indexName}" wirklich löschen?',
  'indexes.dropIndex.button': 'Löschen',
  'indexes.dropIndex.success': 'Index "{indexName}" gelöscht',
  'indexes.dropIndex.failed':
    'Index "{indexName}" konnte nicht gelöscht werden',
  'indexes.hideIndex.title': '`{indexName}` wird ausgeblendet',
  'indexes.hideIndex.failed': 'Index konnte nicht ausgeblendet werden',
  'indexes.hideIndex.failedDescription':
    'Beim Ausblenden des Index ist ein Fehler aufgetreten. {message}',
  'indexes.unhideIndex.title': '`{indexName}` wird eingeblendet',
  'indexes.unhideIndex.failed': 'Index konnte nicht eingeblendet werden',
  'indexes.unhideIndex.failedDescription':
    'Beim Einblenden des Index ist ein Fehler aufgetreten. {message}',
  'indexes.searchErrors.invalidDefinition': 'Ungültige Indexdefinition.',
  'indexes.searchErrors.indexAlreadyExists':
    'Dieser Indexname wird bereits verwendet. Bitte wähle einen anderen.',
  'indexes.createSearchIndex.inProgress': 'Dein Index {name} wird erstellt.',
  'indexes.updateSearchIndex.inProgress':
    'Dein Index {name} wird aktualisiert.',
  'indexes.dropSearchIndex.autoEmbedDescription':
    'Beim Löschen dieses Index werden alle zugehörigen generierten Vektor-Embeddings dauerhaft entfernt. Alle Abfragen, die diesen Index verwenden, funktionieren nicht mehr. Wenn du später einen neuen Index erstellst, werden die Embeddings erneut generiert und verbrauchen zusätzliche Tokens.',
  'indexes.dropSearchIndex.description':
    'Wenn du diesen Index löschst, funktionieren alle Abfragen, die ihn verwenden, nicht mehr.',
  'indexes.dropSearchIndex.title':
    'Möchtest du "{name}" wirklich aus dem Cluster löschen?',
  'indexes.dropSearchIndex.button': 'Index löschen',
  'indexes.dropSearchIndex.inProgress': 'Dein Index {name} wird gelöscht.',
  'indexes.dropSearchIndex.failed': 'Index konnte nicht gelöscht werden.',
  'indexes.drawer.title': 'Indizes',
  'indexes.drawer.backToAll': 'Zurück zu allen Indizes',
  'indexes.drawer.alreadyOnIndexes':
    'Du befindest dich bereits auf der Index-Seite',
  'indexes.drawer.guideCueTitle':
    'Greife einfach auf alle deine Suchindizes zu',
  'indexes.drawer.guideCueDescription':
    'Klicke, um Suchindizes anzuzeigen und zu verwalten.',
  'indexes.drawer.guideCueButton': 'Verstanden',
  'indexes.tabTitle.count': 'Indizes: {value}',
  'indexes.tabTitle.totalSize': 'Gesamtgröße: {value}',
  'indexes.tabTitle.avgSize': 'Durchschn. Größe: {value}',
  'indexes.tabTitle.title': 'Indizes',
  'indexes.autoEmbed.editCostWarning':
    'Das Ändern von Quantisierung, Modellname oder Dimensionen löst neue Embedding-Aufrufe aus. Dadurch können zusätzliche Embedding-Kosten entstehen.',
  'indexes.hideModal.before': 'Der Index `',
  'indexes.hideModal.after':
    '` ist für den Query Planner nicht mehr sichtbar und kann keine Abfrage mehr unterstützen. Falls sich das negativ auswirkt, kannst du den Index wieder einblenden.',
  'indexes.unhideModal.before': 'Der Index `',
  'indexes.unhideModal.after':
    '` wird für den Query Planner sichtbar und kann zur Unterstützung einer Abfrage verwendet werden. Falls sich das negativ auswirkt, kannst du den Index wieder ausblenden.',
  'indexes.searchIndexLabel.vector': 'Vektorsuchindex',
  'indexes.searchIndexLabel.vectorLowerCase': 'Vektorsuchindex',
  'indexes.searchIndexLabel.vectorPlural': 'Vektorsuchindizes',
  'indexes.searchIndexLabel.search': 'Suchindex',
  'indexes.searchIndexLabel.searchLowerCase': 'Suchindex',
  'indexes.searchIndexLabel.searchPlural': 'Suchindizes',
  'indexes.statusToast.vectorSearchIndex': 'Vektorsuchindex',
  'indexes.statusToast.searchIndex': 'Suchindex',
  'indexes.statusToast.buildInProgress': 'Index wird erstellt',
  'indexes.statusToast.buildingNonQueryable':
    '{indexType} {name} wird erstellt und ist nicht abfragbar.',
  'indexes.statusToast.rebuilding': '{indexType}: Neuerstellung läuft',
  'indexes.statusToast.rebuildingQueryable':
    '{indexType} {name} wird neu erstellt und ist abfragbar.',
  'indexes.statusToast.rebuildingNonQueryable':
    '{indexType} {name} wird neu erstellt und ist nicht abfragbar.',
  'indexes.statusToast.buildFailed': '{indexType}: Erstellung fehlgeschlagen',
  'indexes.statusToast.failedQueryable':
    'Die Erstellung des Index {name} ist fehlgeschlagen; er ist abfragbar.',
  'indexes.statusToast.failedNonQueryable':
    'Die Erstellung des Index {name} ist fehlgeschlagen; er ist nicht abfragbar.',
  'indexes.statusToast.viewStatusDetails': 'Statusdetails pro Knoten anzeigen',
  'indexes.statusToast.buildComplete': '{indexType}: Erstellung abgeschlossen',
  'indexes.statusToast.vectorSearchFinished':
    'Dein Vektorsuchindex {name} wurde fertig erstellt und ist abfragbar.',
  'indexes.statusToast.searchFinished':
    'Dein Suchindex {name} wurde fertig erstellt und ist abfragbar.',
  'indexes.table.header.nameAndDefinition': 'Name und Definition',
  'indexes.table.header.nameAndFields': 'Name und Felder',
  'indexes.table.header.name': 'Name',
  'indexes.table.header.type': 'Typ',
  'indexes.table.header.size': 'Größe',
  'indexes.table.header.usage': 'Nutzung',
  'indexes.table.header.properties': 'Eigenschaften',
  'indexes.table.header.status': 'Status',
  'indexes.createIndex.ttl.units': 'Sekunden',

  'indexes.regularIndexes.unexpectedError':
    'Es tut uns leid, es ist ein unerwarteter Fehler aufgetreten. Bitte versuche es erneut.',
  'indexes.parseShellBson.invalidDefinition':
    'Die angegebene Indexdefinition ist ungültig.',
  'indexes.searchIndexStatus.building': 'WIRD ERSTELLT',
  'indexes.searchIndexStatus.failed': 'FEHLGESCHLAGEN',
  'indexes.searchIndexStatus.pending': 'AUSSTEHEND',
  'indexes.searchIndexStatus.ready': 'BEREIT',
  'indexes.searchIndexStatus.stale': 'VERALTET',
  'indexes.searchIndexStatus.deleting': 'WIRD GELÖSCHT',
  'indexes.searchIndexType.vectorSearch': 'Vektorsuche',
  'indexes.searchIndexType.search': 'Suche',
  'indexes.searchDrawer.typeVector': 'Vektor',
  'indexes.searchDrawer.typeSearch': 'Suche',
  'indexes.propertyField.shardKey': 'SHARD-KEY',
  'indexes.propertyField.hidden': 'AUSGEBLENDET',
  'indexes.propertyField.compound': 'zusammengesetzt',
  'indexes.propertyField.unique': 'eindeutig',
  'indexes.propertyField.sparse': 'dünn besetzt',
  'indexes.propertyField.partial': 'partiell',
  'indexes.propertyField.collation': 'Sortierung',
  'indexes.typeField.regular': 'normal',
  'indexes.typeField.geospatial': 'geospatial',
  'indexes.typeField.hashed': 'Hash',
  'indexes.typeField.clustered': 'geclustert',
  'indexes.typeField.unknown': 'unbekannt',
};

export const fr: Catalog = {
  'indexes.createIndexActions.cancel': 'Annuler',
  'indexes.createIndexActions.create': "Créer l'index",
  'indexes.createIndexFields.ariaLabel': "Champs de l'index",
  'indexes.createIndexFields.fieldNamePlaceholder':
    'Sélectionnez ou saisissez un nom de champ',
  'indexes.createIndexFields.customField': 'Champ : « {value} »',
  'indexes.createIndexFields.fieldTypePlaceholder': 'Sélectionnez un type',
  'indexes.createIndexFields.preview': 'Aperçu',
  'indexes.createIndexForm.indexFields': "Champs de l'index",
  'indexes.createIndexForm.options': 'Options',
  'indexes.createIndexModal.title': 'Créer un index',
  'indexes.searchIndexForm.createFor': 'Créer un {indexLabel} pour {namespace}',
  'indexes.searchIndexForm.searchTagline':
    "Recherche en texte intégral pour des fonctionnalités d'application basées sur la pertinence.",
  'indexes.searchIndexForm.vectorTagline':
    "Pour la recherche sémantique et les applications d'IA.",
  'indexes.searchIndexForm.indexName': "Nom de l'index",
  'indexes.searchIndexForm.nameDescription':
    'Donnez un nom à votre {indexLabel} pour le retrouver facilement',
  'indexes.createSearchIndex.nameRequired':
    "Veuillez saisir le nom de l'index.",
  'indexes.searchIndexForm.defaultConfiguration':
    'Par défaut, votre {indexLabel} aura les configurations suivantes. Nous vous recommandons de commencer avec celles-ci et de les affiner plus tard si nécessaire.',
  'indexes.searchIndexForm.templateTooltip':
    "La sélection d'un nouveau modèle remplacera la définition d'index existante dans l'éditeur de code.",
  'indexes.searchIndexForm.cancel': 'Annuler',
  'indexes.searchIndexForm.create': 'Créer un {indexLabel}',
  'indexes.searchIndexForm.noPermissionCreateCluster':
    "Vous n'avez actuellement pas l'autorisation de créer des {indexLabel} dans ce cluster.",
  'indexes.searchIndexForm.noPermissionCreateProject':
    "Vous n'avez actuellement pas l'autorisation de créer des {indexLabel} dans ce projet. Veuillez contacter le propriétaire du projet pour demander le rôle Project Data Access Admin.",
  'indexes.searchIndexForm.edit': "Modifier l'{indexLabel}",
  'indexes.searchIndexForm.queryable': 'Interrogeable',
  'indexes.searchIndexForm.nonQueryable': 'Non interrogeable',
  'indexes.searchIndexForm.parsesDataBefore':
    'Cet {indexLabel} analyse les données de',
  'indexes.searchIndexForm.parsesDataAfter':
    'et présente les configurations suivantes.',
  'indexes.searchIndexForm.saveAndRebuild': 'Enregistrer et reconstruire',
  'indexes.searchIndexForm.noPermissionEditCluster':
    "Vous n'avez actuellement pas l'autorisation de modifier des {indexLabel} dans ce cluster.",
  'indexes.searchIndexForm.noPermissionEditProject':
    "Vous n'avez actuellement pas l'autorisation de modifier des {indexLabel} dans ce projet. Veuillez contacter le propriétaire du projet pour demander le rôle Project Data Access Admin.",
  'indexes.listDrawer.refreshingIndexes': 'Actualisation des index',
  'indexes.listDrawer.refreshIndexes': 'Actualiser les index',
  'indexes.listDrawer.refresh': 'Actualiser',
  'indexes.listDrawer.createNew': 'Créer',
  'indexes.listDrawer.standardIndex': 'Index standard',
  'indexes.listDrawer.searchIndex': 'Index de recherche',
  'indexes.listDrawer.vectorSearchIndex': 'Index de recherche vectorielle',
  'indexes.listDrawer.searchAriaLabel': "Recherche d'index",
  'indexes.listDrawer.searchPlaceholder': "Rechercher par nom d'index",
  'indexes.listDrawer.standard': 'Standard',
  'indexes.listDrawer.search': 'Recherche',
  'indexes.atlasBanner.lookingForSearch':
    'Vous cherchez des index de recherche ?',
  'indexes.atlasBanner.viewIndexDetails':
    "Consultez la taille des index, leur état d'interrogeabilité et la progression de leur création par nœud dans ",
  'indexes.atlasBanner.createdUnder':
    'Ces index peuvent être créés et consultés sous ',
  'indexes.atlasBanner.searchAndVectorSearch': 'Search et Vector Search',
  'indexes.toolbar.refreshingIndexes': 'Actualisation des index',
  'indexes.toolbar.refreshIndexes': 'Actualiser les index',
  'indexes.toolbar.pipelineNotSearchQueryable':
    "Les index de recherche ne peuvent être créés que sur des vues contenant des étapes $match avec l'opérateur $expr, $addFields ou $set",
  'indexes.toolbar.refresh': 'Actualiser',
  'indexes.toolbar.manageSearchIndexes': 'Gérer vos index de recherche',
  'indexes.toolbar.viewing': 'Affichage',
  'indexes.toolbar.indexes': 'Index',
  'indexes.toolbar.readonlyViewsNoStandardIndexes':
    "Les vues en lecture seule ne peuvent pas contenir d'index standard.",
  'indexes.toolbar.searchIndexes': 'Index de recherche',
  'indexes.toolbar.unableToFetchSearchIndexes':
    'Impossible de récupérer les index de recherche. Cela peut se produire lorsque votre cluster ne prend pas en charge les index de recherche ou que la requête de liste des index de recherche a échoué.',
  'indexes.toolbar.searchManagementRequirements':
    "La gestion des index Atlas Search dans Compass n'est disponible que pour les déploiements Atlas locaux et les clusters exécutant MongoDB 6.0.7 ou une version ultérieure.",
  'indexes.toolbar.searchManagementEarlierVersions':
    "Pour les clusters exécutant une version antérieure de MongoDB, vous pouvez gérer vos index Atlas Search depuis l'interface web d'Atlas, avec la CLI ou avec l'API Administration.",
  'indexes.toolbar.createSearchIndex': 'Créer un index de recherche',
  'indexes.toolbar.create': 'Créer',
  'indexes.toolbar.createMenuIndex': 'Index',
  'indexes.toolbar.createMenuSearchIndex': 'Index de recherche',
  'indexes.toolbar.createIndex': "Créer l'index",
  'indexes.indexActions.cancelIndex': "Annuler l'index {name}",
  'indexes.indexActions.cancelIndexTooltip': "Annuler l'index",
  'indexes.indexActions.unhideIndex': "Réafficher l'index {name}",
  'indexes.indexActions.unhideIndexTooltip': "Réafficher l'index",
  'indexes.indexActions.hideIndex': "Masquer l'index {name}",
  'indexes.indexActions.hideIndexTooltip': "Masquer l'index",
  'indexes.indexActions.dropIndex': "Supprimer l'index {name}",
  'indexes.indexActions.dropIndexTooltip': "Supprimer l'index",
  'indexes.indexActions.buildingPercent': 'Création en cours… {percent} %',
  'indexes.indexActions.buildingFor': 'Création en cours depuis {duration}…',
  'indexes.indexActions.building': 'Création en cours…',
  'indexes.indexActions.buildInProgress': "Création de l'index en cours",
  'indexes.regularDrawer.indexName': "Nom de l'index : ",
  'indexes.regularDrawer.noIndexes': 'Aucun index standard trouvé',
  'indexes.regularDrawer.createIndex': 'Créer un index',
  'indexes.sizeField.tooltip': '{percent} % par rapport au plus grand index',
  'indexes.statusField.ready': 'Prêt',
  'indexes.statusField.buildingTooltip':
    'Cet index est créé de façon progressive',
  'indexes.statusField.building': 'En cours de création',
  'indexes.statusField.inProgress': 'En cours',
  'indexes.statusField.creating': 'Création',
  'indexes.statusField.failed': 'Échec',
  'indexes.statusField.unknownTooltip':
    'État de création indisponible (autorisations insuffisantes)',
  'indexes.statusField.unknown': 'Inconnu',
  'indexes.usageField.noStats':
    "Soit le serveur ne prend pas en charge la commande $indexStats, soit l'utilisateur n'est pas autorisé à l'exécuter.",
  'indexes.usageField.hits':
    "{usage} utilisations de l'index depuis sa création ou le dernier redémarrage du serveur",
  'indexes.usageField.unavailable': "Données d'utilisation indisponibles",
  'indexes.usageField.since': '(depuis le {date})',
  'indexes.templateDropdown.template': 'Modèle',
  'indexes.templateDropdown.autoEmbed': 'Embedding automatisé',
  'indexes.templateDropdown.bringYourOwn': 'Utiliser vos propres embeddings',
  'indexes.searchModal.createTitle': 'Créer un index Atlas Search',
  'indexes.searchModal.editVectorTitle':
    "Modifier l'index de recherche vectorielle « {indexName} »",
  'indexes.searchModal.editSearchTitle':
    "Modifier l'index de recherche « {indexName} »",
  'indexes.searchModal.nameOfSearchIndex': "Nom de l'index de recherche",
  'indexes.searchModal.indexType': "Type d'index Atlas Search",
  'indexes.searchModal.indexDefinition': "Définition de l'index",
  'indexes.searchModal.vectorTutorials':
    'Voir les tutoriels Atlas Vector Search',
  'indexes.searchModal.searchTutorials': 'Voir les tutoriels Atlas Search',
  'indexes.searchModal.autoEmbedCostBanner':
    "L'embedding automatisé utilise des modèles d'embedding, qui entraînent des coûts basés sur l'utilisation. Les embeddings vectoriels générés sont stockés dans votre cluster MongoDB. La plateforme d'inférence des modèles s'exécute sur l'infrastructure de MongoDB dans le cloud GCP, dans une région des États-Unis.",
  'indexes.searchModal.updateNote':
    "Remarque : la mise à jour de la définition de l'index consommera des ressources supplémentaires sur votre cluster.",
  'indexes.searchModal.autoEmbedRestricted':
    "Vous ne pouvez pas modifier un champ autoEmbed (chemin, modèle, quantification, etc.) dans un index existant pendant la Public Preview. Cela inclut l'ajout, la suppression ou la modification de champs. Pour utiliser une autre configuration autoEmbed, créez un nouvel index.",
  'indexes.searchModal.cancel': 'Annuler',
  'indexes.searchModal.createSearchIndex': 'Créer un index de recherche',
  'indexes.searchModal.save': 'Enregistrer',
  'indexes.searchModal.makeChange':
    "Modifiez la définition de l'index pour activer l'enregistrement.",
  'indexes.searchActions.editIndex': "Modifier l'index {name}",
  'indexes.searchActions.editIndexTooltip': "Modifier l'index",
  'indexes.searchActions.dropIndex': "Supprimer l'index {name}",
  'indexes.searchActions.dropIndexTooltip': "Supprimer l'index",
  'indexes.searchActions.aggregate': 'Agréger',
  'indexes.searchDrawer.indexName': "Nom de l'index : ",
  'indexes.searchDrawer.status': 'État : ',
  'indexes.searchDrawer.indexFields': "Champs de l'index : ",
  'indexes.searchDrawer.queryable': 'Interrogeable : ',
  'indexes.searchDrawer.noIndexes': 'Aucun index de recherche trouvé',
  'indexes.searchDrawer.defineA': 'Définissez un',
  'indexes.searchDrawer.search': 'index de recherche',
  'indexes.searchDrawer.or': 'ou un',
  'indexes.searchDrawer.vectorSearchIndex': 'index de recherche vectorielle',
  'indexes.searchDrawer.toStartUsing':
    'pour commencer à utiliser $search ou $vectorSearch.',
  'indexes.searchDrawer.createSearchIndex': 'Créer un index de recherche',
  'indexes.searchDrawer.menuSearchIndex': 'Index de recherche',
  'indexes.searchDrawer.menuVectorSearchIndex':
    'Index de recherche vectorielle',
  'indexes.searchTable.noIndexes': "Aucun index de recherche pour l'instant",
  'indexes.searchTable.zeroStateSubtitle':
    "Atlas Search est une recherche en texte intégral intégrée à MongoDB Atlas qui vous offre une expérience fluide et évolutive pour créer des fonctionnalités d'application basées sur la pertinence.",
  'indexes.searchTable.createAtlasSearchIndex': 'Créer un index Atlas Search',
  'indexes.searchTable.viewTooltip':
    "Les index de recherche ne peuvent être créés que sur des vues contenant des étapes $match avec l'opérateur $expr, $addFields ou $set.",
  'indexes.searchTable.notSureWhereToStart':
    'Vous ne savez pas par où commencer ?',
  'indexes.searchTable.visitDocs': 'Consulter la documentation',
  'indexes.searchTable.noFields': "Aucun champ dans la définition de l'index.",
  'indexes.searchTable.dynamicMappings': 'Mappings dynamiques',
  'indexes.searchTable.noMappings':
    "Aucun mapping dans la définition de l'index.",
  'indexes.viewBanner.lookingForSearch':
    'Vous cherchez des index de recherche ?',
  'indexes.viewBanner.pipelineIncompatible':
    "Cette vue n'est pas compatible avec les index de recherche. Seules les vues contenant des étapes $match avec l'opérateur $expr, $addFields ou $set sont compatibles avec les index de recherche.",
  'indexes.viewBanner.editView':
    'Modifiez la vue pour reconstruire les index de recherche.',
  'indexes.viewBanner.learnMore': 'En savoir plus.',
  'indexes.viewEmpty.title': 'Aucun index standard',
  'indexes.viewEmpty.subtitle':
    "Les vues standard utilisent les index de la collection sous-jacente. Par conséquent, vous ne pouvez ni créer, ni supprimer, ni reconstruire d'index directement sur une vue standard, ni obtenir la liste des index de la vue.",
  'indexes.viewEmpty.learnMore': 'En savoir plus sur les vues',
  'indexes.viewVersionBanner.upgradeAtlas':
    "Mettez à niveau votre cluster ou gérez les index de recherche sur les vues dans l'interface d'Atlas.",
  'indexes.viewVersionBanner.upgrade':
    'Mettez à niveau votre cluster pour créer des index de recherche sur les vues.',
  'indexes.viewVersionBanner.messageAtlas':
    "Votre version de MongoDB est {serverVersion}. La création et la gestion d'index de recherche sur les vues sont prises en charge à partir de la version 8.1 de MongoDB.",
  'indexes.viewVersionBanner.messageCompass':
    "Votre version de MongoDB est {serverVersion}. La création et la gestion d'index de recherche sur les vues dans Compass sont prises en charge à partir de la version 8.1 de MongoDB.",
  'indexes.viewVersionBanner.upgradeCluster': 'Mettre à niveau le cluster',
  'indexes.createIndex.keysUnique': "Les clés d'index doivent être uniques",
  'indexes.createIndex.unique.label': 'Créer un index unique',
  'indexes.createIndex.unique.description':
    "Un index unique garantit que les champs indexés ne stockent pas de valeurs en double, c'est-à-dire qu'il impose l'unicité des champs indexés.",
  'indexes.createIndex.name.label': "Nom de l'index",
  'indexes.createIndex.name.description':
    "Saisissez le nom de l'index à créer, ou laissez le champ vide pour que MongoDB génère un nom par défaut.",
  'indexes.createIndex.ttl.label': 'Créer un TTL',
  'indexes.createIndex.ttl.description':
    "Les index TTL sont des index spéciaux sur un seul champ que MongoDB peut utiliser pour supprimer automatiquement des documents d'une collection après une certaine durée ou à une heure donnée.",
  'indexes.createIndex.partial.label': 'Expression de filtre partiel',
  'indexes.createIndex.partial.description':
    "Les index partiels n'indexent que les documents d'une collection qui répondent à une expression de filtre spécifiée.",
  'indexes.createIndex.wildcard.label': 'Projection générique',
  'indexes.createIndex.wildcard.description':
    'Les index génériques prennent en charge les requêtes sur des champs inconnus ou arbitraires.',
  'indexes.createIndex.collation.label': 'Utiliser une collation personnalisée',
  'indexes.createIndex.collation.description':
    'La collation permet aux utilisateurs de spécifier des règles propres à une langue pour la comparaison de chaînes, par exemple pour la casse et les accents.',
  'indexes.createIndex.columnstore.label': 'Projection columnstore',
  'indexes.createIndex.columnstore.preview': 'Aperçu',
  'indexes.createIndex.columnstore.description':
    'Les index columnstore prennent en charge les requêtes sur des champs inconnus ou arbitraires.',
  'indexes.createIndex.sparse.label': 'Créer un index creux',
  'indexes.createIndex.sparse.description':
    "Les index creux ne contiennent des entrées que pour les documents qui possèdent le champ indexé, même si ce champ contient une valeur null. L'index ignore tout document dépourvu du champ indexé.",
  'indexes.createIndex.rolling.label': 'Créer de façon progressive',
  'indexes.createIndex.rolling.description':
    "La création d'un index de façon progressive réduit la résilience de votre cluster et augmente la durée de création des index. Nous ne recommandons les créations d'index progressives que lorsque les créations d'index classiques ne répondent pas à vos besoins.",
  'indexes.createIndex.rolling.learnMore': 'En savoir plus',
  'indexes.createIndex.invalidCollation':
    'Vous devez fournir un objet de collation valide',
  'indexes.createIndex.badTtl': 'TTL non valide : « {value} »',
  'indexes.createIndex.badWildcardProjection':
    'WildcardProjection non valide : {error}',
  'indexes.createIndex.badColumnstoreProjection':
    'ColumnstoreProjection non valide : {error}',
  'indexes.createIndex.badPartialFilterExpression':
    'PartialFilterExpression non valide : {error}',
  'indexes.drawer.discardTitle':
    'Toute progression non enregistrée sera perdue',
  'indexes.drawer.discard': 'Abandonner',
  'indexes.drawer.discardDescription': 'Voulez-vous vraiment continuer ?',
  'indexes.dropIndex.title': "Supprimer l'index",
  'indexes.dropIndex.description':
    "Voulez-vous vraiment supprimer l'index « {indexName} » ?",
  'indexes.dropIndex.button': 'Supprimer',
  'indexes.dropIndex.success': 'Index « {indexName} » supprimé',
  'indexes.dropIndex.failed':
    "Échec de la suppression de l'index « {indexName} »",
  'indexes.hideIndex.title': 'Masquage de `{indexName}`',
  'indexes.hideIndex.failed': "Échec du masquage de l'index",
  'indexes.hideIndex.failedDescription':
    "Une erreur s'est produite lors du masquage de l'index. {message}",
  'indexes.unhideIndex.title': 'Réaffichage de `{indexName}`',
  'indexes.unhideIndex.failed': "Échec du réaffichage de l'index",
  'indexes.unhideIndex.failedDescription':
    "Une erreur s'est produite lors du réaffichage de l'index. {message}",
  'indexes.searchErrors.invalidDefinition': "Définition d'index non valide.",
  'indexes.searchErrors.indexAlreadyExists':
    "Ce nom d'index est déjà utilisé. Veuillez en choisir un autre.",
  'indexes.createSearchIndex.inProgress':
    'Votre index {name} est en cours de création.',
  'indexes.updateSearchIndex.inProgress':
    'Votre index {name} est en cours de mise à jour.',
  'indexes.dropSearchIndex.autoEmbedDescription':
    'La suppression de cet index supprimera définitivement tous les embeddings vectoriels générés qui lui sont associés. Toutes les requêtes qui utilisent cet index cesseront de fonctionner. Si vous créez un nouvel index ultérieurement, les embeddings seront de nouveau générés et utiliseront des jetons supplémentaires.',
  'indexes.dropSearchIndex.description':
    "Si vous supprimez cet index, toutes les requêtes qui l'utilisent ne fonctionneront plus.",
  'indexes.dropSearchIndex.title':
    'Voulez-vous vraiment supprimer « {name} » du cluster ?',
  'indexes.dropSearchIndex.button': "Supprimer l'index",
  'indexes.dropSearchIndex.inProgress':
    'Votre index {name} est en cours de suppression.',
  'indexes.dropSearchIndex.failed': "Échec de la suppression de l'index.",
  'indexes.drawer.title': 'Index',
  'indexes.drawer.backToAll': 'Retour à tous les index',
  'indexes.drawer.alreadyOnIndexes': 'Vous êtes déjà sur la page des index',
  'indexes.drawer.guideCueTitle':
    'Accédez facilement à tous vos index de recherche',
  'indexes.drawer.guideCueDescription':
    'Cliquez pour afficher et gérer les index de recherche.',
  'indexes.drawer.guideCueButton': 'Compris',
  'indexes.tabTitle.count': 'Index : {value}',
  'indexes.tabTitle.totalSize': 'Taille totale : {value}',
  'indexes.tabTitle.avgSize': 'Taille moy. : {value}',
  'indexes.tabTitle.title': 'Index',
  'indexes.autoEmbed.editCostWarning':
    "La modification de la quantification, du nom du modèle ou des dimensions déclenchera de nouveaux appels d'embedding. Cela peut entraîner des coûts d'embedding supplémentaires.",
  'indexes.hideModal.before': "L'index `",
  'indexes.hideModal.after':
    "` ne sera plus visible pour le planificateur de requêtes et ne pourra plus être utilisé pour prendre en charge une requête. Si l'impact est négatif, vous pouvez réafficher cet index.",
  'indexes.unhideModal.before': "L'index `",
  'indexes.unhideModal.after':
    "` deviendra visible pour le planificateur de requêtes et pourra être utilisé pour prendre en charge une requête. Si l'impact est négatif, vous pouvez masquer à nouveau cet index.",
  'indexes.searchIndexLabel.vector': 'index de recherche vectorielle',
  'indexes.searchIndexLabel.vectorLowerCase': 'index de recherche vectorielle',
  'indexes.searchIndexLabel.vectorPlural': 'index de recherche vectorielle',
  'indexes.searchIndexLabel.search': 'index de recherche',
  'indexes.searchIndexLabel.searchLowerCase': 'index de recherche',
  'indexes.searchIndexLabel.searchPlural': 'index de recherche',
  'indexes.statusToast.vectorSearchIndex': 'Index de recherche vectorielle',
  'indexes.statusToast.searchIndex': 'Index de recherche',
  'indexes.statusToast.buildInProgress': "Création de l'index en cours",
  'indexes.statusToast.buildingNonQueryable':
    "{indexType} {name} est en cours de création et n'est pas interrogeable.",
  'indexes.statusToast.rebuilding': '{indexType} : reconstruction en cours',
  'indexes.statusToast.rebuildingQueryable':
    '{indexType} {name} est en cours de reconstruction et est interrogeable.',
  'indexes.statusToast.rebuildingNonQueryable':
    "{indexType} {name} est en cours de reconstruction et n'est pas interrogeable.",
  'indexes.statusToast.buildFailed': '{indexType} : échec de la création',
  'indexes.statusToast.failedQueryable':
    "La création de l'index {name} a échoué et il est interrogeable.",
  'indexes.statusToast.failedNonQueryable':
    "La création de l'index {name} a échoué et il n'est pas interrogeable.",
  'indexes.statusToast.viewStatusDetails':
    "Afficher les détails de l'état par nœud",
  'indexes.statusToast.buildComplete': '{indexType} : création terminée',
  'indexes.statusToast.vectorSearchFinished':
    "Votre index de recherche vectorielle {name} a fini d'être créé et est interrogeable.",
  'indexes.statusToast.searchFinished':
    "Votre index de recherche {name} a fini d'être créé et est interrogeable.",
  'indexes.table.header.nameAndDefinition': 'Nom et définition',
  'indexes.table.header.nameAndFields': 'Nom et champs',
  'indexes.table.header.name': 'Nom',
  'indexes.table.header.type': 'Type',
  'indexes.table.header.size': 'Taille',
  'indexes.table.header.usage': 'Utilisation',
  'indexes.table.header.properties': 'Propriétés',
  'indexes.table.header.status': 'État',
  'indexes.createIndex.ttl.units': 'secondes',

  'indexes.regularIndexes.unexpectedError':
    'Nous sommes désolés, une erreur inattendue s’est produite. Veuillez réessayer.',
  'indexes.parseShellBson.invalidDefinition':
    'La définition d’index fournie n’est pas valide.',
  'indexes.searchIndexStatus.building': 'EN COURS DE CRÉATION',
  'indexes.searchIndexStatus.failed': 'ÉCHEC',
  'indexes.searchIndexStatus.pending': 'EN ATTENTE',
  'indexes.searchIndexStatus.ready': 'PRÊT',
  'indexes.searchIndexStatus.stale': 'OBSOLÈTE',
  'indexes.searchIndexStatus.deleting': 'SUPPRESSION EN COURS',
  'indexes.searchIndexType.vectorSearch': 'Recherche vectorielle',
  'indexes.searchIndexType.search': 'Recherche',
  'indexes.searchDrawer.typeVector': 'Vectoriel',
  'indexes.searchDrawer.typeSearch': 'Recherche',
  'indexes.propertyField.shardKey': 'CLÉ DE SHARD',
  'indexes.propertyField.hidden': 'MASQUÉ',
  'indexes.propertyField.compound': 'composé',
  'indexes.propertyField.unique': 'unique',
  'indexes.propertyField.sparse': 'clairsemé',
  'indexes.propertyField.partial': 'partiel',
  'indexes.propertyField.collation': 'classement',
  'indexes.typeField.regular': 'standard',
  'indexes.typeField.geospatial': 'géospatial',
  'indexes.typeField.hashed': 'haché',
  'indexes.typeField.clustered': 'en cluster',
  'indexes.typeField.unknown': 'inconnu',
};

export const es: Catalog = {
  'indexes.createIndexActions.cancel': 'Cancelar',
  'indexes.createIndexActions.create': 'Crear índice',
  'indexes.createIndexFields.ariaLabel': 'Campos del índice',
  'indexes.createIndexFields.fieldNamePlaceholder':
    'Selecciona o escribe un nombre de campo',
  'indexes.createIndexFields.customField': 'Campo: "{value}"',
  'indexes.createIndexFields.fieldTypePlaceholder': 'Selecciona un tipo',
  'indexes.createIndexFields.preview': 'Vista previa',
  'indexes.createIndexForm.indexFields': 'Campos del índice',
  'indexes.createIndexForm.options': 'Opciones',
  'indexes.createIndexModal.title': 'Crear índice',
  'indexes.searchIndexForm.createFor': 'Crear {indexLabel} para {namespace}',
  'indexes.searchIndexForm.searchTagline':
    'Búsqueda de texto completo para funciones de aplicaciones basadas en la relevancia.',
  'indexes.searchIndexForm.vectorTagline':
    'Para la búsqueda semántica y las aplicaciones de IA.',
  'indexes.searchIndexForm.indexName': 'Nombre del índice',
  'indexes.searchIndexForm.nameDescription':
    'Dale un nombre a tu {indexLabel} para identificarlo fácilmente',
  'indexes.createSearchIndex.nameRequired': 'Introduce el nombre del índice.',
  'indexes.searchIndexForm.defaultConfiguration':
    'De forma predeterminada, tu {indexLabel} tendrá las siguientes configuraciones. Te recomendamos empezar con ellas y ajustarlas más adelante si lo necesitas.',
  'indexes.searchIndexForm.templateTooltip':
    'Si seleccionas una plantilla nueva, se reemplazará la definición de índice existente en el editor de código.',
  'indexes.searchIndexForm.cancel': 'Cancelar',
  'indexes.searchIndexForm.create': 'Crear {indexLabel}',
  'indexes.searchIndexForm.noPermissionCreateCluster':
    'Actualmente no tienes permiso para crear {indexLabel} en este clúster.',
  'indexes.searchIndexForm.noPermissionCreateProject':
    'Actualmente no tienes permiso para crear {indexLabel} en este proyecto. Ponte en contacto con el propietario del proyecto para solicitar el rol Project Data Access Admin.',
  'indexes.searchIndexForm.edit': 'Editar {indexLabel}',
  'indexes.searchIndexForm.queryable': 'Consultable',
  'indexes.searchIndexForm.nonQueryable': 'No consultable',
  'indexes.searchIndexForm.parsesDataBefore':
    'Este {indexLabel} analiza los datos de',
  'indexes.searchIndexForm.parsesDataAfter':
    'y tiene las siguientes configuraciones.',
  'indexes.searchIndexForm.saveAndRebuild': 'Guardar y reconstruir',
  'indexes.searchIndexForm.noPermissionEditCluster':
    'Actualmente no tienes permiso para editar {indexLabel} en este clúster.',
  'indexes.searchIndexForm.noPermissionEditProject':
    'Actualmente no tienes permiso para editar {indexLabel} en este proyecto. Ponte en contacto con el propietario del proyecto para solicitar el rol Project Data Access Admin.',
  'indexes.listDrawer.refreshingIndexes': 'Actualizando índices',
  'indexes.listDrawer.refreshIndexes': 'Actualizar índices',
  'indexes.listDrawer.refresh': 'Actualizar',
  'indexes.listDrawer.createNew': 'Crear nuevo',
  'indexes.listDrawer.standardIndex': 'Índice estándar',
  'indexes.listDrawer.searchIndex': 'Índice de búsqueda',
  'indexes.listDrawer.vectorSearchIndex': 'Índice de búsqueda vectorial',
  'indexes.listDrawer.searchAriaLabel': 'Búsqueda de índices',
  'indexes.listDrawer.searchPlaceholder': 'Buscar por nombre de índice',
  'indexes.listDrawer.standard': 'Estándar',
  'indexes.listDrawer.search': 'Búsqueda',
  'indexes.atlasBanner.lookingForSearch': '¿Buscas índices de búsqueda?',
  'indexes.atlasBanner.viewIndexDetails':
    'Consulta el tamaño de los índices, el estado de consultabilidad y el progreso de construcción por nodo en ',
  'indexes.atlasBanner.createdUnder': 'Estos índices se pueden crear y ver en ',
  'indexes.atlasBanner.searchAndVectorSearch': 'Search y Vector Search',
  'indexes.toolbar.refreshingIndexes': 'Actualizando índices',
  'indexes.toolbar.refreshIndexes': 'Actualizar índices',
  'indexes.toolbar.pipelineNotSearchQueryable':
    'Los índices de búsqueda solo se pueden crear en vistas que contengan etapas $match con el operador $expr, $addFields o $set',
  'indexes.toolbar.refresh': 'Actualizar',
  'indexes.toolbar.manageSearchIndexes': 'Administrar tus índices de búsqueda',
  'indexes.toolbar.viewing': 'Vista',
  'indexes.toolbar.indexes': 'Índices',
  'indexes.toolbar.readonlyViewsNoStandardIndexes':
    'Las vistas de solo lectura no pueden contener índices estándar.',
  'indexes.toolbar.searchIndexes': 'Índices de búsqueda',
  'indexes.toolbar.unableToFetchSearchIndexes':
    'No se pudieron obtener los índices de búsqueda. Esto puede ocurrir cuando el clúster no admite índices de búsqueda o cuando falló la solicitud para listarlos.',
  'indexes.toolbar.searchManagementRequirements':
    'La administración de índices de Atlas Search en Compass solo está disponible para implementaciones locales de Atlas y clústeres con MongoDB 6.0.7 o posterior.',
  'indexes.toolbar.searchManagementEarlierVersions':
    'Para los clústeres con una versión anterior de MongoDB, puedes administrar tus índices de Atlas Search desde la interfaz web de Atlas, con la CLI o con la API de administración.',
  'indexes.toolbar.createSearchIndex': 'Crear índice de búsqueda',
  'indexes.toolbar.create': 'Crear',
  'indexes.toolbar.createMenuIndex': 'Índice',
  'indexes.toolbar.createMenuSearchIndex': 'Índice de búsqueda',
  'indexes.toolbar.createIndex': 'Crear índice',
  'indexes.indexActions.cancelIndex': 'Cancelar índice {name}',
  'indexes.indexActions.cancelIndexTooltip': 'Cancelar índice',
  'indexes.indexActions.unhideIndex': 'Mostrar índice {name}',
  'indexes.indexActions.unhideIndexTooltip': 'Mostrar índice',
  'indexes.indexActions.hideIndex': 'Ocultar índice {name}',
  'indexes.indexActions.hideIndexTooltip': 'Ocultar índice',
  'indexes.indexActions.dropIndex': 'Eliminar índice {name}',
  'indexes.indexActions.dropIndexTooltip': 'Eliminar índice',
  'indexes.indexActions.buildingPercent': 'Construyendo… {percent} %',
  'indexes.indexActions.buildingFor': 'Construyendo durante {duration}…',
  'indexes.indexActions.building': 'Construyendo…',
  'indexes.indexActions.buildInProgress': 'Construcción del índice en curso',
  'indexes.regularDrawer.indexName': 'Nombre del índice: ',
  'indexes.regularDrawer.noIndexes': 'No se encontraron índices estándar',
  'indexes.regularDrawer.createIndex': 'Crear índice',
  'indexes.sizeField.tooltip':
    '{percent} % en comparación con el índice más grande',
  'indexes.statusField.ready': 'Listo',
  'indexes.statusField.buildingTooltip':
    'Este índice se está compilando mediante un proceso continuo',
  'indexes.statusField.building': 'Construyendo',
  'indexes.statusField.inProgress': 'En curso',
  'indexes.statusField.creating': 'Creando',
  'indexes.statusField.failed': 'Error',
  'indexes.statusField.unknownTooltip':
    'Estado de construcción no disponible (permisos insuficientes)',
  'indexes.statusField.unknown': 'Desconocido',
  'indexes.usageField.noStats':
    'O bien el servidor no admite el comando $indexStats o bien el usuario no tiene autorización para ejecutarlo.',
  'indexes.usageField.hits':
    '{usage} usos del índice desde su creación o el último reinicio del servidor',
  'indexes.usageField.unavailable': 'Datos de uso no disponibles',
  'indexes.usageField.since': '(desde {date})',
  'indexes.templateDropdown.template': 'Plantilla',
  'indexes.templateDropdown.autoEmbed': 'Embedding automatizado',
  'indexes.templateDropdown.bringYourOwn': 'Usar tus propios embeddings',
  'indexes.searchModal.createTitle': 'Crear índice de Atlas Search',
  'indexes.searchModal.editVectorTitle':
    'Editar índice de búsqueda vectorial "{indexName}"',
  'indexes.searchModal.editSearchTitle':
    'Editar índice de búsqueda "{indexName}"',
  'indexes.searchModal.nameOfSearchIndex': 'Nombre del índice de búsqueda',
  'indexes.searchModal.indexType': 'Tipo de índice de Atlas Search',
  'indexes.searchModal.indexDefinition': 'Definición del índice',
  'indexes.searchModal.vectorTutorials':
    'Ver tutoriales de Atlas Vector Search',
  'indexes.searchModal.searchTutorials': 'Ver tutoriales de Atlas Search',
  'indexes.searchModal.autoEmbedCostBanner':
    'El embedding automatizado usa modelos de embedding, que generan costes basados en el uso. Los embeddings vectoriales generados se almacenan en tu clúster de MongoDB. La plataforma de inferencia de modelos se ejecuta en la infraestructura de MongoDB en la nube de GCP, en una región de EE. UU.',
  'indexes.searchModal.updateNote':
    'Nota: actualizar la definición del índice consumirá recursos adicionales de tu clúster.',
  'indexes.searchModal.autoEmbedRestricted':
    'No puedes editar un campo autoEmbed (ruta, modelo, cuantización, etc.) en un índice existente durante la Public Preview. Esto incluye agregar, quitar o modificar campos. Para usar una configuración autoEmbed distinta, crea un índice nuevo.',
  'indexes.searchModal.cancel': 'Cancelar',
  'indexes.searchModal.createSearchIndex': 'Crear índice de búsqueda',
  'indexes.searchModal.save': 'Guardar',
  'indexes.searchModal.makeChange':
    'Modifica la definición del índice para habilitar el guardado.',
  'indexes.searchActions.editIndex': 'Editar índice {name}',
  'indexes.searchActions.editIndexTooltip': 'Editar índice',
  'indexes.searchActions.dropIndex': 'Eliminar índice {name}',
  'indexes.searchActions.dropIndexTooltip': 'Eliminar índice',
  'indexes.searchActions.aggregate': 'Agregar',
  'indexes.searchDrawer.indexName': 'Nombre del índice: ',
  'indexes.searchDrawer.status': 'Estado: ',
  'indexes.searchDrawer.indexFields': 'Campos del índice: ',
  'indexes.searchDrawer.queryable': 'Consultable: ',
  'indexes.searchDrawer.noIndexes': 'No se encontraron índices de búsqueda',
  'indexes.searchDrawer.defineA': 'Define un',
  'indexes.searchDrawer.search': 'índice de búsqueda',
  'indexes.searchDrawer.or': 'o un',
  'indexes.searchDrawer.vectorSearchIndex': 'índice de búsqueda vectorial',
  'indexes.searchDrawer.toStartUsing':
    'para empezar a usar $search o $vectorSearch.',
  'indexes.searchDrawer.createSearchIndex': 'Crear un índice de búsqueda',
  'indexes.searchDrawer.menuSearchIndex': 'Índice de búsqueda',
  'indexes.searchDrawer.menuVectorSearchIndex': 'Índice de búsqueda vectorial',
  'indexes.searchTable.noIndexes': 'Aún no hay índices de búsqueda',
  'indexes.searchTable.zeroStateSubtitle':
    'Atlas Search es una búsqueda de texto completo integrada en MongoDB Atlas que te ofrece una experiencia fluida y escalable para crear funciones de aplicaciones basadas en la relevancia.',
  'indexes.searchTable.createAtlasSearchIndex': 'Crear índice de Atlas Search',
  'indexes.searchTable.viewTooltip':
    'Los índices de búsqueda solo se pueden crear en vistas que contengan etapas $match con el operador $expr, $addFields o $set.',
  'indexes.searchTable.notSureWhereToStart': '¿No sabes por dónde empezar?',
  'indexes.searchTable.visitDocs': 'Visitar la documentación',
  'indexes.searchTable.noFields': 'No hay campos en la definición del índice.',
  'indexes.searchTable.dynamicMappings': 'Asignaciones dinámicas',
  'indexes.searchTable.noMappings':
    'No hay asignaciones en la definición del índice.',
  'indexes.viewBanner.lookingForSearch': '¿Buscas índices de búsqueda?',
  'indexes.viewBanner.pipelineIncompatible':
    'Esta vista no es compatible con los índices de búsqueda. Solo las vistas que contienen etapas $match con el operador $expr, $addFields o $set son compatibles con los índices de búsqueda.',
  'indexes.viewBanner.editView':
    'Edita la vista para reconstruir los índices de búsqueda.',
  'indexes.viewBanner.learnMore': 'Más información.',
  'indexes.viewEmpty.title': 'Sin índices estándar',
  'indexes.viewEmpty.subtitle':
    'Las vistas estándar usan los índices de la colección subyacente. Por lo tanto, no puedes crear, eliminar ni reconstruir índices directamente en una vista estándar, ni obtener una lista de los índices de la vista.',
  'indexes.viewEmpty.learnMore': 'Más información sobre las vistas',
  'indexes.viewVersionBanner.upgradeAtlas':
    'Actualiza tu clúster o administra los índices de búsqueda en las vistas desde la interfaz de Atlas.',
  'indexes.viewVersionBanner.upgrade':
    'Actualiza tu clúster para crear índices de búsqueda en las vistas.',
  'indexes.viewVersionBanner.messageAtlas':
    'Tu versión de MongoDB es {serverVersion}. La creación y administración de índices de búsqueda en vistas se admite a partir de la versión 8.1 de MongoDB.',
  'indexes.viewVersionBanner.messageCompass':
    'Tu versión de MongoDB es {serverVersion}. La creación y administración de índices de búsqueda en vistas en Compass se admite a partir de la versión 8.1 de MongoDB.',
  'indexes.viewVersionBanner.upgradeCluster': 'Actualizar clúster',
  'indexes.createIndex.keysUnique': 'Las claves del índice deben ser únicas',
  'indexes.createIndex.unique.label': 'Crear índice único',
  'indexes.createIndex.unique.description':
    'Un índice único garantiza que los campos indexados no almacenen valores duplicados, es decir, impone la unicidad de los campos indexados.',
  'indexes.createIndex.name.label': 'Nombre del índice',
  'indexes.createIndex.name.description':
    'Introduce el nombre del índice que se va a crear o déjalo en blanco para que MongoDB genere un nombre predeterminado.',
  'indexes.createIndex.ttl.label': 'Crear TTL',
  'indexes.createIndex.ttl.description':
    'Los índices TTL son índices especiales de un solo campo que MongoDB puede usar para eliminar automáticamente documentos de una colección tras cierto tiempo o en un momento determinado.',
  'indexes.createIndex.partial.label': 'Expresión de filtro parcial',
  'indexes.createIndex.partial.description':
    'Los índices parciales solo indexan los documentos de una colección que cumplen una expresión de filtro especificada.',
  'indexes.createIndex.wildcard.label': 'Proyección comodín',
  'indexes.createIndex.wildcard.description':
    'Los índices comodín admiten consultas sobre campos desconocidos o arbitrarios.',
  'indexes.createIndex.collation.label': 'Usar intercalación personalizada',
  'indexes.createIndex.collation.description':
    'La intercalación permite a los usuarios especificar reglas específicas de un idioma para la comparación de cadenas, como las reglas de mayúsculas y minúsculas y de acentos.',
  'indexes.createIndex.columnstore.label': 'Proyección columnstore',
  'indexes.createIndex.columnstore.preview': 'Vista previa',
  'indexes.createIndex.columnstore.description':
    'Los índices columnstore admiten consultas sobre campos desconocidos o arbitrarios.',
  'indexes.createIndex.sparse.label': 'Crear índice disperso',
  'indexes.createIndex.sparse.description':
    'Los índices dispersos solo contienen entradas para los documentos que tienen el campo indexado, aunque el campo del índice contenga un valor null. El índice omite cualquier documento que no tenga el campo indexado.',
  'indexes.createIndex.rolling.label': 'Construir mediante proceso continuo',
  'indexes.createIndex.rolling.description':
    'Construir un índice de forma continua reduce la resiliencia del clúster y aumenta el tiempo de construcción del índice. Solo recomendamos usar construcciones de índices continuas cuando las construcciones normales no satisfagan tus necesidades.',
  'indexes.createIndex.rolling.learnMore': 'Más información',
  'indexes.createIndex.invalidCollation':
    'Debes proporcionar un objeto de intercalación válido',
  'indexes.createIndex.badTtl': 'TTL no válido: "{value}"',
  'indexes.createIndex.badWildcardProjection':
    'WildcardProjection no válida: {error}',
  'indexes.createIndex.badColumnstoreProjection':
    'ColumnstoreProjection no válida: {error}',
  'indexes.createIndex.badPartialFilterExpression':
    'PartialFilterExpression no válida: {error}',
  'indexes.drawer.discardTitle': 'Se perderá cualquier progreso no guardado',
  'indexes.drawer.discard': 'Descartar',
  'indexes.drawer.discardDescription': '¿Seguro que quieres continuar?',
  'indexes.dropIndex.title': 'Eliminar índice',
  'indexes.dropIndex.description':
    '¿Seguro que quieres eliminar el índice "{indexName}"?',
  'indexes.dropIndex.button': 'Eliminar',
  'indexes.dropIndex.success': 'Índice "{indexName}" eliminado',
  'indexes.dropIndex.failed': 'No se pudo eliminar el índice "{indexName}"',
  'indexes.hideIndex.title': 'Ocultando `{indexName}`',
  'indexes.hideIndex.failed': 'No se pudo ocultar el índice',
  'indexes.hideIndex.failedDescription':
    'Se produjo un error al ocultar el índice. {message}',
  'indexes.unhideIndex.title': 'Mostrando `{indexName}`',
  'indexes.unhideIndex.failed': 'No se pudo mostrar el índice',
  'indexes.unhideIndex.failedDescription':
    'Se produjo un error al mostrar el índice. {message}',
  'indexes.searchErrors.invalidDefinition': 'Definición de índice no válida.',
  'indexes.searchErrors.indexAlreadyExists':
    'Este nombre de índice ya está en uso. Elige otro.',
  'indexes.createSearchIndex.inProgress': 'Tu índice {name} está en curso.',
  'indexes.updateSearchIndex.inProgress':
    'Tu índice {name} se está actualizando.',
  'indexes.dropSearchIndex.autoEmbedDescription':
    'Al eliminar este índice se quitarán de forma permanente todos los embeddings vectoriales generados asociados a él. Todas las consultas que usen este índice dejarán de funcionar. Si creas un índice nuevo más adelante, los embeddings se generarán de nuevo y usarán tokens adicionales.',
  'indexes.dropSearchIndex.description':
    'Si eliminas este índice, todas las consultas que lo usen dejarán de funcionar.',
  'indexes.dropSearchIndex.title':
    '¿Seguro que quieres eliminar "{name}" del clúster?',
  'indexes.dropSearchIndex.button': 'Eliminar índice',
  'indexes.dropSearchIndex.inProgress': 'Tu índice {name} se está eliminando.',
  'indexes.dropSearchIndex.failed': 'No se pudo eliminar el índice.',
  'indexes.drawer.title': 'Índices',
  'indexes.drawer.backToAll': 'Volver a todos los índices',
  'indexes.drawer.alreadyOnIndexes': 'Ya estás en la página de índices',
  'indexes.drawer.guideCueTitle':
    'Accede fácilmente a todos tus índices de búsqueda',
  'indexes.drawer.guideCueDescription':
    'Haz clic para ver y administrar los índices de búsqueda.',
  'indexes.drawer.guideCueButton': 'Entendido',
  'indexes.tabTitle.count': 'Índices: {value}',
  'indexes.tabTitle.totalSize': 'Tamaño total: {value}',
  'indexes.tabTitle.avgSize': 'Tamaño prom.: {value}',
  'indexes.tabTitle.title': 'Índices',
  'indexes.autoEmbed.editCostWarning':
    'Cambiar la cuantización, el nombre del modelo o las dimensiones desencadenará nuevas llamadas de embedding. Esto puede generar costes de embedding adicionales.',
  'indexes.hideModal.before': 'El índice `',
  'indexes.hideModal.after':
    '` ya no será visible para el planificador de consultas y no se podrá usar para respaldar una consulta. Si el impacto es negativo, puedes volver a mostrar este índice.',
  'indexes.unhideModal.before': 'El índice `',
  'indexes.unhideModal.after':
    '` será visible para el planificador de consultas y se podrá usar para respaldar una consulta. Si el impacto es negativo, puedes volver a ocultar este índice.',
  'indexes.searchIndexLabel.vector': 'índice de búsqueda vectorial',
  'indexes.searchIndexLabel.vectorLowerCase': 'índice de búsqueda vectorial',
  'indexes.searchIndexLabel.vectorPlural': 'índices de búsqueda vectorial',
  'indexes.searchIndexLabel.search': 'índice de búsqueda',
  'indexes.searchIndexLabel.searchLowerCase': 'índice de búsqueda',
  'indexes.searchIndexLabel.searchPlural': 'índices de búsqueda',
  'indexes.statusToast.vectorSearchIndex': 'Índice de búsqueda vectorial',
  'indexes.statusToast.searchIndex': 'Índice de búsqueda',
  'indexes.statusToast.buildInProgress': 'Creación del índice en curso',
  'indexes.statusToast.buildingNonQueryable':
    '{indexType} {name} se está creando y no se puede consultar.',
  'indexes.statusToast.rebuilding': '{indexType}: reconstrucción en curso',
  'indexes.statusToast.rebuildingQueryable':
    '{indexType} {name} se está reconstruyendo y se puede consultar.',
  'indexes.statusToast.rebuildingNonQueryable':
    '{indexType} {name} se está reconstruyendo y no se puede consultar.',
  'indexes.statusToast.buildFailed': '{indexType}: error en la creación',
  'indexes.statusToast.failedQueryable':
    'La creación del índice {name} falló y se puede consultar.',
  'indexes.statusToast.failedNonQueryable':
    'La creación del índice {name} falló y no se puede consultar.',
  'indexes.statusToast.viewStatusDetails': 'Ver detalles de estado por nodo',
  'indexes.statusToast.buildComplete': '{indexType}: creación completada',
  'indexes.statusToast.vectorSearchFinished':
    'Tu índice de búsqueda vectorial {name} terminó de crearse y se puede consultar.',
  'indexes.statusToast.searchFinished':
    'Tu índice de búsqueda {name} terminó de crearse y se puede consultar.',
  'indexes.table.header.nameAndDefinition': 'Nombre y definición',
  'indexes.table.header.nameAndFields': 'Nombre y campos',
  'indexes.table.header.name': 'Nombre',
  'indexes.table.header.type': 'Tipo',
  'indexes.table.header.size': 'Tamaño',
  'indexes.table.header.usage': 'Uso',
  'indexes.table.header.properties': 'Propiedades',
  'indexes.table.header.status': 'Estado',
  'indexes.createIndex.ttl.units': 'segundos',

  'indexes.regularIndexes.unexpectedError':
    'Lo sentimos, se ha producido un error inesperado. Inténtalo de nuevo.',
  'indexes.parseShellBson.invalidDefinition':
    'La definición del índice proporcionada no es válida.',
  'indexes.searchIndexStatus.building': 'CREANDO',
  'indexes.searchIndexStatus.failed': 'ERROR',
  'indexes.searchIndexStatus.pending': 'PENDIENTE',
  'indexes.searchIndexStatus.ready': 'LISTO',
  'indexes.searchIndexStatus.stale': 'OBSOLETO',
  'indexes.searchIndexStatus.deleting': 'ELIMINANDO',
  'indexes.searchIndexType.vectorSearch': 'Búsqueda vectorial',
  'indexes.searchIndexType.search': 'Búsqueda',
  'indexes.searchDrawer.typeVector': 'Vectorial',
  'indexes.searchDrawer.typeSearch': 'Búsqueda',
  'indexes.propertyField.shardKey': 'CLAVE DE SHARD',
  'indexes.propertyField.hidden': 'OCULTO',
  'indexes.propertyField.compound': 'compuesto',
  'indexes.propertyField.unique': 'único',
  'indexes.propertyField.sparse': 'disperso',
  'indexes.propertyField.partial': 'parcial',
  'indexes.propertyField.collation': 'intercalación',
  'indexes.typeField.regular': 'normal',
  'indexes.typeField.geospatial': 'geoespacial',
  'indexes.typeField.hashed': 'hash',
  'indexes.typeField.clustered': 'en clúster',
  'indexes.typeField.unknown': 'desconocido',
};
