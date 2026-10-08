import type { Catalog } from './translations';

// Texts of the sidebar, connections navigation, workspaces, welcome page,
// databases/collections lists, saved queries and find-in-page. See
// ./translations.ts for the key conventions.

export const de: Catalog = {
  'sidebar.nonGenuine.badge': 'Nicht-genuine MongoDB',
  'sidebar.csfleMarker.openConfiguration':
    'Konfiguration der In-Use Encryption der Verbindung öffnen',
  'sidebar.csfleMarker.configuration':
    'Konfiguration der In-Use Encryption der Verbindung',
  'sidebar.csfleMarker.badge': 'In-Use Encryption',
  'sidebar.header.compassSettings': 'Compass-Einstellungen',
  'sidebar.header.dataExplorer': 'Data Explorer',
  'sidebar.filter.search': 'Suchen',
  'sidebar.filter.filterConnections': 'Verbindungen filtern',
  'sidebar.filter.options': 'Filteroptionen',
  'sidebar.filter.onlyActive': 'Nur aktive Verbindungen anzeigen',
  'sidebar.dbStats.dbs': 'Datenbanken',
  'sidebar.dbStats.collections': 'Collections',
  'sidebar.csfleModal.title': 'Verbindungsoptionen für In-Use Encryption',
  'sidebar.csfleModal.configured':
    'Diese Verbindung ist mit aktivierter In-Use Encryption konfiguriert.',
  'sidebar.csfleModal.enable':
    'In-Use Encryption für diese Verbindung aktivieren',
  'sidebar.csfleModal.disableDescription':
    'Das Deaktivieren der In-Use Encryption wirkt sich nur darauf aus, wie Compass auf Daten zugreift. Damit Compass die KMS-Zugangsdaten vergisst, muss die Verbindung vollständig geschlossen werden.',
  'sidebar.csfleModal.enterpriseOnly':
    'In-Use Encryption ist eine Funktion von MongoDB, die nur in Enterprise/Atlas verfügbar ist.',
  'sidebar.csfleModal.learnMore': 'Mehr erfahren',
  'sidebar.connectionInfo.title': 'Verbindungsinformationen',
  'sidebar.connectionInfo.stats': 'Statistiken',
  'sidebar.connectionInfo.dbs.one': '{count} Datenbank',
  'sidebar.connectionInfo.dbs.other': '{count} Datenbanken',
  'sidebar.connectionInfo.collections.one': '{count} Collection',
  'sidebar.connectionInfo.collections.other': '{count} Collections',
  'sidebar.connectionInfo.host': 'Host',
  'sidebar.connectionInfo.hosts': 'Hosts',
  'sidebar.connectionInfo.loadBalancer': '(Load Balancer)',
  'sidebar.connectionInfo.mongos.one': '{count} Mongos',
  'sidebar.connectionInfo.mongos.other': '{count} Mongos',
  'sidebar.connectionInfo.node.one': '{count} Knoten',
  'sidebar.connectionInfo.node.other': '{count} Knoten',
  'sidebar.connectionInfo.sharded': 'Sharded',
  'sidebar.connectionInfo.replicaSet': 'Replica Set {name}',
  'sidebar.connectionInfo.cluster': 'Cluster',
  'sidebar.connectionInfo.edition': 'Edition',
  'sidebar.connectionInfo.sshVia': 'SSH-Verbindung über',
  'sidebar.copyToast.successTitle': 'Erfolg',
  'sidebar.copyToast.success': 'In die Zwischenablage kopiert.',
  'sidebar.copyToast.errorTitle': 'Fehler',
  'sidebar.copyToast.error':
    'Beim Kopieren in die Zwischenablage ist ein Fehler aufgetreten. Bitte versuche es erneut.',
  'sidebar.navigation.myQueries': 'Meine Abfragen',
  'sidebar.navigation.dataModeling': 'Datenmodellierung',
  'sidebar.connections.collapseAll': 'Alle Verbindungen einklappen',
  'sidebar.connections.addNew': 'Neue Verbindung hinzufügen',
  'sidebar.connections.import': 'Verbindungen importieren',
  'sidebar.connections.export': 'Verbindungen exportieren',
  'sidebar.connections.clusters': 'Cluster',
  'sidebar.connections.connections': 'Verbindungen',
  'sidebar.connections.searchClusters': 'Cluster suchen',
  'sidebar.connections.searchConnections': 'Verbindungen suchen',
  'sidebar.connections.noResults': 'Keine Ergebnisse gefunden.',
  'sidebar.connections.noDeployments':
    'Du hast noch keine Verbindung zu einem Deployment hergestellt.',
  'connectionsNavigation.actions.editConnection': 'Verbindung bearbeiten',
  'connectionsNavigation.actions.cannotEditActive':
    'Eine aktive Verbindung kann nicht bearbeitet werden',
  'connectionsNavigation.actions.connectVia': 'Verbinden über …',
  'connectionsNavigation.actions.copyConnectionString':
    'Verbindungs-String kopieren',
  'connectionsNavigation.actions.unfavoriteConnection':
    'Verbindung aus Favoriten entfernen',
  'connectionsNavigation.actions.favoriteConnection':
    'Verbindung zu Favoriten hinzufügen',
  'connectionsNavigation.actions.duplicateConnection': 'Verbindung duplizieren',
  'connectionsNavigation.actions.removeConnection': 'Verbindung entfernen',
  'connectionsNavigation.actions.refreshDatabases': 'Datenbanken aktualisieren',
  'connectionsNavigation.actions.createDatabase': 'Datenbank erstellen',
  'connectionsNavigation.actions.openShell': 'MongoDB Shell öffnen',
  'connectionsNavigation.actions.viewPerformanceMetrics':
    'Leistungsmetriken anzeigen',
  'connectionsNavigation.actions.notSupported': 'Nicht unterstützt',
  'connectionsNavigation.actions.viewClusterOverview':
    'Cluster-Übersicht anzeigen',
  'connectionsNavigation.actions.viewMonitoring': 'Überwachung anzeigen',
  'connectionsNavigation.actions.viewQueryInsights':
    'Abfrage-Insights anzeigen',
  'connectionsNavigation.actions.showConnectionInfo':
    'Verbindungsinformationen anzeigen',
  'connectionsNavigation.actions.disconnect': 'Trennen',
  'connectionsNavigation.actions.connect': 'Verbinden',
  'connectionsNavigation.actions.createCollection': 'Collection erstellen',
  'connectionsNavigation.actions.dropDatabase': 'Datenbank löschen',
  'connectionsNavigation.actions.openInNewTab': 'In neuem Tab öffnen',
  'connectionsNavigation.actions.duplicateView': 'View duplizieren',
  'connectionsNavigation.actions.modifyView': 'View ändern',
  'connectionsNavigation.actions.dropView': 'View löschen',
  'connectionsNavigation.actions.renameCollection': 'Collection umbenennen',
  'connectionsNavigation.actions.dropCollection': 'Collection löschen',
  'connectionsNavigation.tree.databasesAndCollections':
    'Datenbanken und Collections',
  'connectionsNavigation.unpauseCluster':
    'Hebe die Pausierung deines Clusters auf, um dich zu verbinden',
  'connectionsNavigation.connectButton.moreOptions':
    'Weitere Verbindungsoptionen anzeigen',
  'connectionsNavigation.connectButton.connect': 'Verbinden',
  'connectionsNavigation.connectButton.inNewWindow': 'In neuem Fenster',
  'connectionsNavigation.nonGenuine.label': 'Nicht-genuine MongoDB',
  'connectionsNavigation.nonGenuine.tooltip': 'Nicht-genuine MongoDB erkannt',
  'connectionsNavigation.csfle.label': 'In-Use Encryption',
  'connectionsNavigation.csfle.tooltip': 'In-Use Encryption konfigurieren',
  'connectionsNavigation.inferredFromPrivileges':
    'Deine Berechtigungen gewähren dir Zugriff auf diesen Namespace, er existiert aber möglicherweise derzeit nicht',
  'workspaces.closeTab.title': 'Möchtest du den Tab wirklich schließen?',
  'workspaces.closeTab.description':
    'Der Inhalt dieses Tabs wurde geändert. Deine Änderungen gehen verloren, wenn du ihn schließt.',
  'workspaces.closeTab.button': 'Tab schließen',
  'workspaces.reopenTabs.title': 'Geschlossene Tabs wieder öffnen?',
  'workspaces.reopenTabs.description':
    'Deine Verbindung und deine Tabs wurden geschlossen. Mit dieser Aktion wird deine vorherige Sitzung wiederhergestellt.',
  'workspaces.reopenTabs.button': 'Tabs wieder öffnen',
  'workspaces.tabs.ariaLabel': 'Workspace-Tabs',
  'welcome.tab.title': 'Willkommen',
  'welcome.web.title': 'Willkommen! Entdecke deine Daten',
  'welcome.web.createFirstCluster':
    'Erstelle zum Einstieg deinen ersten MongoDB-Cluster.',
  'welcome.web.connectExistingCluster':
    'Verbinde dich zum Einstieg mit einem vorhandenen Cluster.',
  'welcome.web.createCluster': 'Cluster erstellen',
  'welcome.web.needHelp': 'Brauchst du weitere Hilfe?',
  'welcome.web.viewDocumentation': 'Dokumentation ansehen',
  'welcome.modal.start': "Los geht's",
  'welcome.modal.title': 'Willkommen bei Compass',
  'welcome.modal.disclaimer':
    'Zur Verbesserung unserer Produkte werden anonyme Nutzungsdaten erfasst und gemäß der Datenschutzerklärung von MongoDB an MongoDB gesendet.',
  'welcome.modal.manageBefore':
    'Dieses Verhalten kannst du auf der Compass-Seite',
  'welcome.modal.settings': 'Einstellungen',
  'welcome.modal.manageAfter': 'verwalten.',
  'welcome.modal.body':
    'Erstelle Aggregation-Pipelines, optimiere Abfragen, analysiere Schemas und mehr. Alles mit der GUI, die von MongoDB für MongoDB-Nutzer entwickelt wurde.',
  'welcome.connectionList.connected': 'Verbunden mit {name}',
  'welcome.connectionList.failed': 'Verbindung zu {name} fehlgeschlagen',
  'welcome.connectionList.connecting': 'Verbindung zu {name} wird hergestellt',
  'welcome.desktop.newToCompass': 'Neu bei Compass und noch kein Cluster?',
  'welcome.desktop.createFree':
    'Wenn du noch keinen Cluster hast, kannst du kostenlos einen erstellen mit',
  'welcome.desktop.createFreeCluster': 'KOSTENLOSEN CLUSTER ERSTELLEN',
  'welcome.desktop.title': 'Willkommen bei MongoDB Compass',
  'welcome.desktop.getStarted':
    'Verbinde dich zum Einstieg mit einem vorhandenen Server oder',
  'welcome.desktop.addNewConnection': 'Neue Verbindung hinzufügen',
  'databasesCollectionsList.databaseName': 'Datenbankname',
  'databasesCollectionsList.inferredFromPrivileges':
    'Deine Berechtigungen gewähren dir Zugriff auf diesen Namespace, er existiert aber möglicherweise derzeit nicht',
  'databasesCollectionsList.storageSize': 'Speichergröße',
  'databasesCollectionsList.dataSize': 'Datengröße',
  'databasesCollectionsList.collections': 'Collections',
  'databasesCollectionsList.indexes': 'Indizes',
  'databasesCollectionsList.collectionName': 'Collection-Name',
  'databasesCollectionsList.properties': 'Eigenschaften',
  'databasesCollectionsList.derivedFrom': 'Abgeleitet von',
  'databasesCollectionsList.bucketCount': 'Anzahl Buckets:',
  'databasesCollectionsList.avgBucketSize': 'Durchschn. Bucket-Größe:',
  'databasesCollectionsList.storageSizeLabel': 'Speichergröße:',
  'databasesCollectionsList.totalAllocated': '(insgesamt zugewiesen)',
  'databasesCollectionsList.used': 'Belegt:',
  'databasesCollectionsList.free': 'Frei:',
  'databasesCollectionsList.documents': 'Dokumente',
  'databasesCollectionsList.avgDocumentSize': 'Durchschn. Dokumentgröße',
  'databasesCollectionsList.totalIndexSize': 'Gesamtgröße der Indizes',
  'databasesCollectionsList.openShell': 'MongoDB Shell öffnen',
  'databasesCollectionsList.viewMonitoring': 'Überwachung anzeigen',
  'databasesCollectionsList.visualizeData': 'Daten visualisieren',
  'databasesCollectionsList.createCollection': 'Collection erstellen',
  'databasesCollectionsList.createDatabase': 'Datenbank erstellen',
  'databasesCollectionsList.refresh': 'Aktualisieren',
  'databasesCollectionsList.deleteItem': '{name} löschen',
  'databasesCollections.tab.connection': 'Verbindung',
  'databasesCollections.tab.database': 'Datenbank',
  'databasesCollections.sampleData.emptyTitle':
    'Dein Cluster scheint leer zu sein',
  'databasesCollections.sampleData.createOrLoad':
    'Erstelle eine Datenbank oder lade Beispieldaten in deinen Cluster, um schnell mit dem Experimentieren mit Daten in MongoDB zu beginnen.',
  'databasesCollections.sampleData.loadOnly':
    'Du kannst Beispieldaten laden, um schnell mit dem Experimentieren mit Daten in MongoDB zu beginnen.',
  'databasesCollections.sampleData.createDatabase': 'Datenbank erstellen',
  'databasesCollections.sampleData.load': 'Beispieldaten laden',
  'databasesCollections.sampleData.banner':
    'Die Arbeit mit MongoDB ist einfach, aber zuerst brauchst du einige Daten für den Einstieg. Beispieldaten stehen zum Laden bereit.',
  'databasesCollections.collections.loadError':
    'Beim Laden der Collections ist ein Fehler aufgetreten',
  'databasesCollections.databases.loadError':
    'Beim Laden der Datenbanken ist ein Fehler aufgetreten',
  'databasesCollections.databases.nonGenuineTitle':
    'Datenbanken und Collections können nicht angezeigt werden',
  'databasesCollections.databases.nonGenuineSubtitle':
    'Dieser Server bzw. Dienst scheint MongoDB zu emulieren. Einige dokumentierte MongoDB-Funktionen verhalten sich möglicherweise anders, fehlen ganz oder sind unvollständig, oder weisen unerwartet andere Leistungsmerkmale auf als bei der Verbindung mit einem echten MongoDB-Server oder -Dienst.',
  'databasesCollections.databases.tryAtlas': 'MongoDB Atlas ausprobieren',
  'databasesCollections.createNamespace.createCollection':
    'Collection erstellen',
  'databasesCollections.createNamespace.createDatabase': 'Datenbank erstellen',
  'databasesCollections.createNamespace.collectionNameRequired':
    'Bevor MongoDB deine neue Datenbank speichern kann, muss beim Erstellen auch ein Collection-Name angegeben werden.',
  'databasesCollections.createNamespace.moreInformation':
    'Weitere Informationen',
  'databasesCollections.renameCollection.warning':
    'Beim Umbenennen der Collection gehen alle nicht gespeicherten Abfragen, Filter oder Aggregation-Pipelines verloren.',
  'databasesCollections.renameCollection.savedImpacted':
    'Zusätzlich müssen alle gespeicherten Abfragen oder Aggregationen für diese Collection auf den neuen Namespace umgestellt werden.',
  'databasesCollections.renameCollection.nameExists':
    'Dieser Collection-Name existiert in dieser Datenbank bereits.',
  'databasesCollections.renameCollection.confirmTitle':
    'Umbenennen der Collection bestätigen',
  'databasesCollections.renameCollection.title': 'Collection umbenennen',
  'databasesCollections.renameCollection.proceed': 'Weiter zum Umbenennen',
  'databasesCollections.renameCollection.confirmButton':
    'Ja, Collection umbenennen',
  'databasesCollections.renameCollection.newName': 'Neuer Collection-Name',
  'databasesCollections.renameCollection.confirmQuestion':
    'Möchtest du „{from}“ wirklich in „{to}“ umbenennen?',
  'databasesCollections.renameCollection.renaming':
    'Collection wird umbenannt…',
  'databasesCollections.renameCollection.renamed':
    'Collection in {name} umbenannt',
  'databasesCollections.drop.collectionTitle': 'Collection löschen?',
  'databasesCollections.drop.databaseTitle': 'Datenbank löschen?',
  'databasesCollections.drop.collectionDescription':
    'Möchtest du die Collection „{ns}“ wirklich löschen?',
  'databasesCollections.drop.databaseDescription':
    'Möchtest du die Datenbank „{ns}“ wirklich löschen?',
  'databasesCollections.drop.collectionButton': 'Collection löschen',
  'databasesCollections.drop.databaseButton': 'Datenbank löschen',
  'databasesCollections.drop.collectionDropped': 'Collection „{ns}“ gelöscht',
  'databasesCollections.drop.databaseDropped': 'Datenbank „{ns}“ gelöscht',
  'databasesCollections.drop.collectionFailed':
    'Collection „{ns}“ konnte nicht gelöscht werden',
  'databasesCollections.drop.databaseFailed':
    'Datenbank „{ns}“ konnte nicht gelöscht werden',
  'databasesCollections.fields.selectValue': 'Wert auswählen',
  'databasesCollections.fields.selectValueOptional':
    'Wert auswählen [optional]',
  'databasesCollections.fields.useCustomCollation':
    'Benutzerdefinierte Collation verwenden',
  'databasesCollections.fields.collationDescription':
    'Mit der Collation können Benutzer sprachspezifische Regeln für den Zeichenfolgenvergleich festlegen, etwa für Groß-/Kleinschreibung und Akzente.',
  'databasesCollections.fields.collectionName': 'Collection-Name',
  'databasesCollections.fields.databaseName': 'Datenbankname',
  'databasesCollections.fields.clusteredCollection': 'Clustered Collection',
  'databasesCollections.fields.clusteredDescription':
    'Clustered Collections speichern Dokumente sortiert nach einem benutzerdefinierten Cluster-Schlüssel.',
  'databasesCollections.fields.clusteredIndexName':
    'Der Name des Clustered Index ist optional, andernfalls wird er automatisch generiert.',
  'databasesCollections.fields.clusteredExpireAfterSeconds':
    'Das Feld expireAfterSeconds ermöglicht das automatische Löschen von Dokumenten, die älter als die angegebene Anzahl an Sekunden sind. Das Feld _id muss ein Datum oder ein Array mit Datumswerten sein.',
  'databasesCollections.fields.timeSeries': 'Time-Series',
  'databasesCollections.fields.timeSeriesDescription':
    'Time-Series-Collections speichern Messreihen über einen Zeitraum effizient.',
  'databasesCollections.fields.timeFieldDescription':
    'Gib an, welches Feld als timeField für die Time-Series-Collection verwendet werden soll. Dieses Feld muss den BSON-Typ date haben.',
  'databasesCollections.fields.metaFieldDescription':
    'Das metaField ist das vorgesehene Feld für Metadaten.',
  'databasesCollections.fields.granularityDescription':
    'Mit dem Feld granularity kann eine gröbere Granularität angegeben werden, damit Messungen über einen längeren Zeitraum effizienter gespeichert und abgefragt werden können.',
  'databasesCollections.fields.bucketMaxSpanDescription':
    'Die maximale Zeitspanne zwischen Messungen in einem Bucket.',
  'databasesCollections.fields.bucketRoundingDescription':
    'Das Zeitintervall, das den Start-Zeitstempel eines neuen Buckets bestimmt.',
  'databasesCollections.fields.timeSeriesExpireAfterSeconds':
    'Das Feld expireAfterSeconds ermöglicht das automatische Löschen von Dokumenten, die älter als die angegebene Anzahl an Sekunden sind.',
  'databasesCollections.fields.fle2Description':
    'Verschlüssle eine Teilmenge der Felder mit Queryable Encryption.',
  'databasesCollections.fields.encryptedFields': 'Verschlüsselte Felder',
  'databasesCollections.fields.encryptedFieldsDescription':
    'Gib an, welche Felder verschlüsselt werden sollen und ob sie abfragbar sein sollen.',
  'databasesCollections.fields.kmsProvider': 'KMS-Anbieter',
  'databasesCollections.fields.kmsProviderDescription':
    'Optional. Wenn in der Konfiguration der verschlüsselten Felder keine keyId angegeben ist, erstellt Compass mit dem angegebenen KMS neue Datenschlüssel für jedes verschlüsselte Feld.',
  'databasesCollections.fields.keyEncryptionKey': 'Key Encryption Key',
  'databasesCollections.fields.keyEncryptionKeyDescription':
    'Gib an, welcher Key Encryption Key zum Erstellen neuer Datenverschlüsselungsschlüssel verwendet werden soll.',
  'databasesCollections.fields.additionalPreferences':
    'Zusätzliche Einstellungen',
  'databasesCollections.fields.additionalPreferencesHint':
    '(z. B. benutzerdefinierte Collation, Clustered Collections)',
  'savedQueries.tabTitle': 'Meine Abfragen',
  'savedQueries.empty.title': 'Noch keine gespeicherten Abfragen.',
  'savedQueries.empty.subtitle':
    'Speichere deine Aggregationen und Find-Abfragen, dann erscheinen sie hier.',
  'savedQueries.empty.notSure': 'Du weißt nicht, wo du anfangen sollst?',
  'savedQueries.empty.visitDocs': 'Besuche unsere Dokumentation',
  'savedQueries.noResults.title': 'Keine Ergebnisse gefunden.',
  'savedQueries.noResults.subtitle':
    'Wir finden keinen Eintrag, der zu deiner Suche passt.',
  'savedQueries.noConnections.title': 'Mit einem Cluster verbinden',
  'savedQueries.noConnections.message':
    'Du scheinst nicht mit einem Cluster verbunden zu sein. Stelle zuerst eine Verbindung her.',
  'savedQueries.edit.update': 'Aktualisieren',
  'savedQueries.edit.titleQuery': 'Abfrage umbenennen',
  'savedQueries.edit.titleAggregation': 'Aggregation umbenennen',
  'savedQueries.edit.title': '{type} umbenennen',
  'savedQueries.edit.name': 'Name',
  'savedQueries.card.copy': 'Kopieren',
  'savedQueries.card.rename': 'Umbenennen',
  'savedQueries.card.delete': 'Löschen',
  'savedQueries.card.openIn': 'Öffnen in',
  'savedQueries.card.lastModified': 'Zuletzt geändert:',
  'savedQueries.list.sortName': 'Name',
  'savedQueries.list.sortLastModified': 'Zuletzt geändert',
  'savedQueries.filters.search': 'Suchen',
  'savedQueries.filters.allDatabases': 'Alle Datenbanken',
  'savedQueries.filters.allCollections': 'Alle Collections',
  'savedQueries.delete.titleQuery':
    'Möchtest du deine Abfrage wirklich löschen?',
  'savedQueries.delete.titleAggregation':
    'Möchtest du deine Aggregation wirklich löschen?',
  'savedQueries.delete.description':
    'Diese Aktion kann nicht rückgängig gemacht werden.',
  'savedQueries.delete.button': 'Löschen',
  'savedQueries.itemType.query': 'Abfrage',
  'savedQueries.itemType.aggregation': 'Aggregation',
  'savedQueries.selectConnection.title': 'Verbindung auswählen',
  'savedQueries.selectConnection.runQuery': 'Abfrage ausführen',
  'savedQueries.selectConnection.namespace': 'Der Namespace',
  'savedQueries.selectConnection.forSaved': 'der gespeicherten {itemType}',
  'savedQueries.selectConnection.existsInMultiple':
    'existiert in mehreren aktiven Verbindungen. Bitte wähle aus, welche Verbindung verwendet werden soll,',
  'savedQueries.selectConnection.runAgainst':
    'um die {itemType} damit auszuführen.',
  'savedQueries.selectNamespace.connection': 'Verbindung',
  'savedQueries.selectNamespace.database': 'Datenbank',
  'savedQueries.selectNamespace.collection': 'Collection',
  'savedQueries.selectNamespace.namespace': 'Der Namespace',
  'savedQueries.selectNamespace.forSaved': 'der gespeicherten {itemType}',
  'savedQueries.selectNamespace.notFoundAnyConnection':
    'existiert in keiner der aktiven Verbindungen. Bitte wähle ein anderes Ziel, um die gespeicherte {itemType} zu öffnen',
  'savedQueries.selectNamespace.notFoundCurrentConnection':
    'existiert in der aktuellen Verbindung nicht. Bitte wähle einen anderen Namespace, um die gespeicherte {itemType} zu öffnen.',
  'savedQueries.selectNamespace.titleConnectionAndNamespace':
    'Verbindung und Namespace auswählen',
  'savedQueries.selectNamespace.titleNamespace': 'Namespace auswählen',
  'savedQueries.selectNamespace.runQuery': 'Abfrage ausführen',
  'savedQueries.selectNamespace.updateWithNamespace':
    'Diese {itemType} mit dem neu ausgewählten Namespace aktualisieren',
  'findInPage.hint':
    'Mit (Umschalt+) Eingabetaste navigierst du durch die Ergebnisse.',
  'findInPage.inputLabel': 'Auf Seite suchen',
  'findInPage.close': 'Suchfeld schließen',
  'databasesCollections.createNamespace.noDot':
    'Datenbanknamen dürfen keinen "." enthalten',
  'databasesCollections.createNamespace.parseEncryptedFieldsError':
    'Die encryptedFields-Konfiguration konnte nicht geparst werden: {message}',
  'databasesCollections.createNamespace.parseKeyEncryptionKeyError':
    'keyEncryptionKey konnte nicht geparst werden: {message}',
  'connectionsNavigation.clusterState.terminating': 'WIRD BEENDET',
  'connectionsNavigation.clusterState.terminated': 'BEENDET',
  'connectionsNavigation.clusterState.creating': 'WIRD ERSTELLT',
  'connectionsNavigation.clusterState.paused': 'PAUSIERT',
};

export const fr: Catalog = {
  'sidebar.nonGenuine.badge': 'MongoDB non authentique',
  'sidebar.csfleMarker.openConfiguration':
    "Ouvrir la configuration du chiffrement en cours d'utilisation de la connexion",
  'sidebar.csfleMarker.configuration':
    "Configuration du chiffrement en cours d'utilisation de la connexion",
  'sidebar.csfleMarker.badge': "Chiffrement en cours d'utilisation",
  'sidebar.header.compassSettings': 'Paramètres de Compass',
  'sidebar.header.dataExplorer': 'Explorateur de données',
  'sidebar.filter.search': 'Rechercher',
  'sidebar.filter.filterConnections': 'Filtrer les connexions',
  'sidebar.filter.options': 'Options de filtre',
  'sidebar.filter.onlyActive': 'Afficher uniquement les connexions actives',
  'sidebar.dbStats.dbs': 'BD',
  'sidebar.dbStats.collections': 'Collections',
  'sidebar.csfleModal.title':
    "Options de connexion du chiffrement en cours d'utilisation",
  'sidebar.csfleModal.configured':
    "Cette connexion est configurée avec le chiffrement en cours d'utilisation activé.",
  'sidebar.csfleModal.enable':
    "Activer le chiffrement en cours d'utilisation pour cette connexion",
  'sidebar.csfleModal.disableDescription':
    "La désactivation du chiffrement en cours d'utilisation n'affecte que la manière dont Compass accède aux données. Pour que Compass oublie les identifiants KMS, la connexion doit être entièrement fermée.",
  'sidebar.csfleModal.enterpriseOnly':
    "Le chiffrement en cours d'utilisation est une fonctionnalité de MongoDB réservée à Enterprise/Atlas.",
  'sidebar.csfleModal.learnMore': 'En savoir plus',
  'sidebar.connectionInfo.title': 'Informations de connexion',
  'sidebar.connectionInfo.stats': 'Statistiques',
  'sidebar.connectionInfo.dbs.one': '{count} BD',
  'sidebar.connectionInfo.dbs.other': '{count} BD',
  'sidebar.connectionInfo.collections.one': '{count} collection',
  'sidebar.connectionInfo.collections.other': '{count} collections',
  'sidebar.connectionInfo.host': 'Hôte',
  'sidebar.connectionInfo.hosts': 'Hôtes',
  'sidebar.connectionInfo.loadBalancer': '(équilibreur de charge)',
  'sidebar.connectionInfo.mongos.one': '{count} Mongos',
  'sidebar.connectionInfo.mongos.other': '{count} Mongos',
  'sidebar.connectionInfo.node.one': '{count} nœud',
  'sidebar.connectionInfo.node.other': '{count} nœuds',
  'sidebar.connectionInfo.sharded': 'Shardé',
  'sidebar.connectionInfo.replicaSet': 'Replica Set {name}',
  'sidebar.connectionInfo.cluster': 'Cluster',
  'sidebar.connectionInfo.edition': 'Édition',
  'sidebar.connectionInfo.sshVia': 'Connexion SSH via',
  'sidebar.copyToast.successTitle': 'Succès',
  'sidebar.copyToast.success': 'Copié dans le presse-papiers.',
  'sidebar.copyToast.errorTitle': 'Erreur',
  'sidebar.copyToast.error':
    "Une erreur s'est produite lors de la copie dans le presse-papiers. Veuillez réessayer.",
  'sidebar.navigation.myQueries': 'Mes requêtes',
  'sidebar.navigation.dataModeling': 'Modélisation des données',
  'sidebar.connections.collapseAll': 'Réduire toutes les connexions',
  'sidebar.connections.addNew': 'Ajouter une nouvelle connexion',
  'sidebar.connections.import': 'Importer des connexions',
  'sidebar.connections.export': 'Exporter des connexions',
  'sidebar.connections.clusters': 'Clusters',
  'sidebar.connections.connections': 'Connexions',
  'sidebar.connections.searchClusters': 'Rechercher des clusters',
  'sidebar.connections.searchConnections': 'Rechercher des connexions',
  'sidebar.connections.noResults': 'Aucun résultat trouvé.',
  'sidebar.connections.noDeployments':
    'Vous ne vous êtes connecté à aucun déploiement.',
  'connectionsNavigation.actions.editConnection': 'Modifier la connexion',
  'connectionsNavigation.actions.cannotEditActive':
    'Impossible de modifier une connexion active',
  'connectionsNavigation.actions.connectVia': 'Se connecter via …',
  'connectionsNavigation.actions.copyConnectionString':
    'Copier la chaîne de connexion',
  'connectionsNavigation.actions.unfavoriteConnection':
    'Retirer la connexion des favoris',
  'connectionsNavigation.actions.favoriteConnection':
    'Ajouter la connexion aux favoris',
  'connectionsNavigation.actions.duplicateConnection': 'Dupliquer la connexion',
  'connectionsNavigation.actions.removeConnection': 'Supprimer la connexion',
  'connectionsNavigation.actions.refreshDatabases':
    'Actualiser les bases de données',
  'connectionsNavigation.actions.createDatabase': 'Créer une base de données',
  'connectionsNavigation.actions.openShell': 'Ouvrir le shell MongoDB',
  'connectionsNavigation.actions.viewPerformanceMetrics':
    'Afficher les métriques de performance',
  'connectionsNavigation.actions.notSupported': 'Non pris en charge',
  'connectionsNavigation.actions.viewClusterOverview':
    "Afficher la vue d'ensemble du cluster",
  'connectionsNavigation.actions.viewMonitoring': 'Afficher la surveillance',
  'connectionsNavigation.actions.viewQueryInsights':
    'Afficher les informations sur les requêtes',
  'connectionsNavigation.actions.showConnectionInfo':
    'Afficher les informations de connexion',
  'connectionsNavigation.actions.disconnect': 'Se déconnecter',
  'connectionsNavigation.actions.connect': 'Se connecter',
  'connectionsNavigation.actions.createCollection': 'Créer une collection',
  'connectionsNavigation.actions.dropDatabase': 'Supprimer la base de données',
  'connectionsNavigation.actions.openInNewTab': 'Ouvrir dans un nouvel onglet',
  'connectionsNavigation.actions.duplicateView': 'Dupliquer la vue',
  'connectionsNavigation.actions.modifyView': 'Modifier la vue',
  'connectionsNavigation.actions.dropView': 'Supprimer la vue',
  'connectionsNavigation.actions.renameCollection': 'Renommer la collection',
  'connectionsNavigation.actions.dropCollection': 'Supprimer la collection',
  'connectionsNavigation.tree.databasesAndCollections':
    'Bases de données et collections',
  'connectionsNavigation.unpauseCluster':
    'Réactivez votre cluster pour vous y connecter',
  'connectionsNavigation.connectButton.moreOptions':
    "voir plus d'options de connexion",
  'connectionsNavigation.connectButton.connect': 'Se connecter',
  'connectionsNavigation.connectButton.inNewWindow':
    'Dans une nouvelle fenêtre',
  'connectionsNavigation.nonGenuine.label': 'MongoDB non authentique',
  'connectionsNavigation.nonGenuine.tooltip': 'MongoDB non authentique détecté',
  'connectionsNavigation.csfle.label': "Chiffrement en cours d'utilisation",
  'connectionsNavigation.csfle.tooltip':
    "Configurer le chiffrement en cours d'utilisation",
  'connectionsNavigation.inferredFromPrivileges':
    "Vos privilèges vous donnent accès à cet espace de noms, mais il n'existe peut-être pas actuellement",
  'workspaces.closeTab.title': "Voulez-vous vraiment fermer l'onglet ?",
  'workspaces.closeTab.description':
    'Le contenu de cet onglet a été modifié. Vous perdrez vos modifications si vous le fermez.',
  'workspaces.closeTab.button': "Fermer l'onglet",
  'workspaces.reopenTabs.title': 'Rouvrir les onglets fermés ?',
  'workspaces.reopenTabs.description':
    'Votre connexion et vos onglets ont été fermés. Cette action rouvrira votre session précédente.',
  'workspaces.reopenTabs.button': 'Rouvrir les onglets',
  'workspaces.tabs.ariaLabel': "Onglets de l'espace de travail",
  'welcome.tab.title': 'Bienvenue',
  'welcome.web.title': 'Bienvenue ! Explorez vos données',
  'welcome.web.createFirstCluster':
    'Pour commencer, créez votre premier cluster MongoDB.',
  'welcome.web.connectExistingCluster':
    'Pour commencer, connectez-vous à un cluster existant.',
  'welcome.web.createCluster': 'Créer un cluster',
  'welcome.web.needHelp': "Besoin d'aide supplémentaire ?",
  'welcome.web.viewDocumentation': 'Consulter la documentation',
  'welcome.modal.start': 'Commencer',
  'welcome.modal.title': 'Bienvenue dans Compass',
  'welcome.modal.disclaimer':
    "Pour nous aider à améliorer nos produits, des données d'utilisation anonymes sont collectées et envoyées à MongoDB conformément à sa politique de confidentialité.",
  'welcome.modal.manageBefore': 'Gérez ce comportement dans la page',
  'welcome.modal.settings': 'Paramètres',
  'welcome.modal.manageAfter': 'de Compass.',
  'welcome.modal.body':
    "Créez des pipelines d'agrégation, optimisez vos requêtes, analysez vos schémas et bien plus. Le tout avec l'interface graphique conçue par - et pour - MongoDB.",
  'welcome.connectionList.connected': 'Connecté à {name}',
  'welcome.connectionList.failed': 'Échec de la connexion à {name}',
  'welcome.connectionList.connecting': 'Connexion à {name} en cours',
  'welcome.desktop.newToCompass':
    "Nouveau sur Compass et vous n'avez pas de cluster ?",
  'welcome.desktop.createFree':
    "Si vous n'avez pas encore de cluster, vous pouvez en créer un gratuitement avec",
  'welcome.desktop.createFreeCluster': 'CRÉER UN CLUSTER GRATUIT',
  'welcome.desktop.title': 'Bienvenue dans MongoDB Compass',
  'welcome.desktop.getStarted':
    'Pour commencer, connectez-vous à un serveur existant ou',
  'welcome.desktop.addNewConnection': 'Ajouter une nouvelle connexion',
  'databasesCollectionsList.databaseName': 'Nom de la base de données',
  'databasesCollectionsList.inferredFromPrivileges':
    "Vos privilèges vous donnent accès à cet espace de noms, mais il n'existe peut-être pas actuellement",
  'databasesCollectionsList.storageSize': 'Taille de stockage',
  'databasesCollectionsList.dataSize': 'Taille des données',
  'databasesCollectionsList.collections': 'Collections',
  'databasesCollectionsList.indexes': 'Index',
  'databasesCollectionsList.collectionName': 'Nom de la collection',
  'databasesCollectionsList.properties': 'Propriétés',
  'databasesCollectionsList.derivedFrom': 'Dérivée de',
  'databasesCollectionsList.bucketCount': 'Nombre de buckets :',
  'databasesCollectionsList.avgBucketSize': 'Taille moy. des buckets :',
  'databasesCollectionsList.storageSizeLabel': 'Taille de stockage :',
  'databasesCollectionsList.totalAllocated': '(total alloué)',
  'databasesCollectionsList.used': 'Utilisé :',
  'databasesCollectionsList.free': 'Libre :',
  'databasesCollectionsList.documents': 'Documents',
  'databasesCollectionsList.avgDocumentSize': 'Taille moy. des documents',
  'databasesCollectionsList.totalIndexSize': 'Taille totale des index',
  'databasesCollectionsList.openShell': 'Ouvrir le shell MongoDB',
  'databasesCollectionsList.viewMonitoring': 'Afficher la surveillance',
  'databasesCollectionsList.visualizeData': 'Visualiser vos données',
  'databasesCollectionsList.createCollection': 'Créer une collection',
  'databasesCollectionsList.createDatabase': 'Créer une base de données',
  'databasesCollectionsList.refresh': 'Actualiser',
  'databasesCollectionsList.deleteItem': 'Supprimer {name}',
  'databasesCollections.tab.connection': 'Connexion',
  'databasesCollections.tab.database': 'Base de données',
  'databasesCollections.sampleData.emptyTitle': 'Votre cluster semble vide',
  'databasesCollections.sampleData.createOrLoad':
    'Créez une base de données ou chargez des exemples de données dans votre cluster pour commencer rapidement à expérimenter avec les données dans MongoDB.',
  'databasesCollections.sampleData.loadOnly':
    'Vous pouvez charger des exemples de données pour commencer rapidement à expérimenter avec les données dans MongoDB.',
  'databasesCollections.sampleData.createDatabase': 'Créer une base de données',
  'databasesCollections.sampleData.load': 'Charger des exemples de données',
  'databasesCollections.sampleData.banner':
    'Travailler avec MongoDB est facile, mais vous aurez d’abord besoin de données pour commencer. Des exemples de données sont disponibles au chargement.',
  'databasesCollections.collections.loadError':
    'Une erreur s’est produite lors du chargement des collections',
  'databasesCollections.databases.loadError':
    'Une erreur s’est produite lors du chargement des bases de données',
  'databasesCollections.databases.nonGenuineTitle':
    'Impossible d’afficher les bases de données et les collections',
  'databasesCollections.databases.nonGenuineSubtitle':
    'Ce serveur ou service semble émuler MongoDB. Certaines fonctionnalités documentées de MongoDB peuvent fonctionner différemment, être totalement absentes ou incomplètes, ou présenter des performances inattendues par rapport à une connexion à un véritable serveur ou service MongoDB.',
  'databasesCollections.databases.tryAtlas': 'Essayer MongoDB Atlas',
  'databasesCollections.createNamespace.createCollection':
    'Créer une collection',
  'databasesCollections.createNamespace.createDatabase':
    'Créer une base de données',
  'databasesCollections.createNamespace.collectionNameRequired':
    'Avant que MongoDB puisse enregistrer votre nouvelle base de données, un nom de collection doit également être indiqué lors de la création.',
  'databasesCollections.createNamespace.moreInformation': 'Plus d’informations',
  'databasesCollections.renameCollection.warning':
    'Le renommage de la collection entraînera la perte des requêtes, filtres ou pipelines d’agrégation non enregistrés.',
  'databasesCollections.renameCollection.savedImpacted':
    'De plus, toutes les requêtes ou agrégations enregistrées ciblant cette collection devront être réassociées au nouvel espace de noms.',
  'databasesCollections.renameCollection.nameExists':
    'Ce nom de collection existe déjà dans cette base de données.',
  'databasesCollections.renameCollection.confirmTitle':
    'Confirmer le renommage de la collection',
  'databasesCollections.renameCollection.title': 'Renommer la collection',
  'databasesCollections.renameCollection.proceed': 'Passer au renommage',
  'databasesCollections.renameCollection.confirmButton':
    'Oui, renommer la collection',
  'databasesCollections.renameCollection.newName':
    'Nouveau nom de la collection',
  'databasesCollections.renameCollection.confirmQuestion':
    'Voulez-vous vraiment renommer « {from} » en « {to} » ?',
  'databasesCollections.renameCollection.renaming':
    'Renommage de la collection…',
  'databasesCollections.renameCollection.renamed':
    'Collection renommée en {name}',
  'databasesCollections.drop.collectionTitle': 'Supprimer la collection ?',
  'databasesCollections.drop.databaseTitle': 'Supprimer la base de données ?',
  'databasesCollections.drop.collectionDescription':
    'Voulez-vous vraiment supprimer la collection « {ns} » ?',
  'databasesCollections.drop.databaseDescription':
    'Voulez-vous vraiment supprimer la base de données « {ns} » ?',
  'databasesCollections.drop.collectionButton': 'Supprimer la collection',
  'databasesCollections.drop.databaseButton': 'Supprimer la base de données',
  'databasesCollections.drop.collectionDropped':
    'Collection « {ns} » supprimée',
  'databasesCollections.drop.databaseDropped':
    'Base de données « {ns} » supprimée',
  'databasesCollections.drop.collectionFailed':
    'Échec de la suppression de la collection « {ns} »',
  'databasesCollections.drop.databaseFailed':
    'Échec de la suppression de la base de données « {ns} »',
  'databasesCollections.fields.selectValue': 'Sélectionner une valeur',
  'databasesCollections.fields.selectValueOptional':
    'Sélectionner une valeur [facultatif]',
  'databasesCollections.fields.useCustomCollation':
    'Utiliser un classement personnalisé (collation)',
  'databasesCollections.fields.collationDescription':
    'Le classement (collation) permet aux utilisateurs de spécifier des règles propres à une langue pour la comparaison de chaînes, par exemple pour la casse et les accents.',
  'databasesCollections.fields.collectionName': 'Nom de la collection',
  'databasesCollections.fields.databaseName': 'Nom de la base de données',
  'databasesCollections.fields.clusteredCollection': 'Collection clusterisée',
  'databasesCollections.fields.clusteredDescription':
    'Les collections clusterisées stockent les documents ordonnés selon une clé de cluster définie par l’utilisateur.',
  'databasesCollections.fields.clusteredIndexName':
    'Le nom de l’index clusterisé est facultatif ; sinon, il est généré automatiquement.',
  'databasesCollections.fields.clusteredExpireAfterSeconds':
    'Le champ expireAfterSeconds permet la suppression automatique des documents plus anciens que le nombre de secondes indiqué. Le champ _id doit être une date ou un tableau contenant des valeurs de date.',
  'databasesCollections.fields.timeSeries': 'Séries temporelles',
  'databasesCollections.fields.timeSeriesDescription':
    'Les collections de séries temporelles stockent efficacement des séquences de mesures sur une période donnée.',
  'databasesCollections.fields.timeFieldDescription':
    'Indiquez quel champ doit être utilisé comme timeField pour la collection de séries temporelles. Ce champ doit avoir le type BSON date.',
  'databasesCollections.fields.metaFieldDescription':
    'Le metaField est le champ désigné pour les métadonnées.',
  'databasesCollections.fields.granularityDescription':
    'Le champ granularity permet de spécifier une granularité plus grossière afin que les mesures sur une période plus longue soient stockées et interrogées plus efficacement.',
  'databasesCollections.fields.bucketMaxSpanDescription':
    'L’intervalle de temps maximal entre les mesures d’un bucket.',
  'databasesCollections.fields.bucketRoundingDescription':
    'L’intervalle de temps qui détermine l’horodatage de début d’un nouveau bucket.',
  'databasesCollections.fields.timeSeriesExpireAfterSeconds':
    'Le champ expireAfterSeconds permet la suppression automatique des documents plus anciens que le nombre de secondes indiqué.',
  'databasesCollections.fields.fle2Description':
    'Chiffrez un sous-ensemble des champs avec Queryable Encryption.',
  'databasesCollections.fields.encryptedFields': 'Champs chiffrés',
  'databasesCollections.fields.encryptedFieldsDescription':
    'Indiquez quels champs doivent être chiffrés et s’ils doivent pouvoir être interrogés.',
  'databasesCollections.fields.kmsProvider': 'Fournisseur KMS',
  'databasesCollections.fields.kmsProviderDescription':
    'Facultatif. Si aucun keyId n’est spécifié dans la configuration des champs chiffrés, Compass créera de nouvelles clés de données pour chaque champ chiffré à l’aide du KMS indiqué.',
  'databasesCollections.fields.keyEncryptionKey':
    'Clé de chiffrement de clés (Key Encryption Key)',
  'databasesCollections.fields.keyEncryptionKeyDescription':
    'Indiquez quelle clé de chiffrement de clés utiliser pour créer de nouvelles clés de chiffrement de données.',
  'databasesCollections.fields.additionalPreferences':
    'Préférences supplémentaires',
  'databasesCollections.fields.additionalPreferencesHint':
    '(p. ex. classement personnalisé, collections clusterisées)',
  'savedQueries.tabTitle': 'Mes requêtes',
  'savedQueries.empty.title': 'Aucune requête enregistrée pour le moment.',
  'savedQueries.empty.subtitle':
    'Enregistrez vos agrégations et requêtes find, elles apparaîtront ici.',
  'savedQueries.empty.notSure': 'Vous ne savez pas par où commencer ?',
  'savedQueries.empty.visitDocs': 'Consultez notre documentation',
  'savedQueries.noResults.title': 'Aucun résultat trouvé.',
  'savedQueries.noResults.subtitle':
    'Nous ne trouvons aucun élément correspondant à votre recherche.',
  'savedQueries.noConnections.title': 'Se connecter à un cluster',
  'savedQueries.noConnections.message':
    'Vous ne semblez pas connecté à un cluster. Établissez d’abord une connexion.',
  'savedQueries.edit.update': 'Mettre à jour',
  'savedQueries.edit.titleQuery': 'Renommer la requête',
  'savedQueries.edit.titleAggregation': 'Renommer l’agrégation',
  'savedQueries.edit.title': 'Renommer {type}',
  'savedQueries.edit.name': 'Nom',
  'savedQueries.card.copy': 'Copier',
  'savedQueries.card.rename': 'Renommer',
  'savedQueries.card.delete': 'Supprimer',
  'savedQueries.card.openIn': 'Ouvrir dans',
  'savedQueries.card.lastModified': 'Dernière modification :',
  'savedQueries.list.sortName': 'Nom',
  'savedQueries.list.sortLastModified': 'Dernière modification',
  'savedQueries.filters.search': 'Rechercher',
  'savedQueries.filters.allDatabases': 'Toutes les bases de données',
  'savedQueries.filters.allCollections': 'Toutes les collections',
  'savedQueries.delete.titleQuery':
    'Voulez-vous vraiment supprimer votre requête ?',
  'savedQueries.delete.titleAggregation':
    'Voulez-vous vraiment supprimer votre agrégation ?',
  'savedQueries.delete.description': 'Cette action est irréversible.',
  'savedQueries.delete.button': 'Supprimer',
  'savedQueries.itemType.query': 'requête',
  'savedQueries.itemType.aggregation': 'agrégation',
  'savedQueries.selectConnection.title': 'Sélectionner une connexion',
  'savedQueries.selectConnection.runQuery': 'Exécuter la requête',
  'savedQueries.selectConnection.namespace': 'L’espace de noms',
  'savedQueries.selectConnection.forSaved':
    'de l’élément enregistré de type {itemType}',
  'savedQueries.selectConnection.existsInMultiple':
    'existe dans plusieurs connexions actives. Veuillez sélectionner la connexion à utiliser',
  'savedQueries.selectConnection.runAgainst':
    'pour exécuter l’élément de type {itemType}.',
  'savedQueries.selectNamespace.connection': 'Connexion',
  'savedQueries.selectNamespace.database': 'Base de données',
  'savedQueries.selectNamespace.collection': 'Collection',
  'savedQueries.selectNamespace.namespace': 'L’espace de noms',
  'savedQueries.selectNamespace.forSaved':
    'de l’élément enregistré de type {itemType}',
  'savedQueries.selectNamespace.notFoundAnyConnection':
    'n’existe dans aucune des connexions actives. Veuillez sélectionner une autre cible pour ouvrir l’élément enregistré de type {itemType}',
  'savedQueries.selectNamespace.notFoundCurrentConnection':
    'n’existe pas dans la connexion actuelle. Veuillez sélectionner un autre espace de noms pour ouvrir l’élément enregistré de type {itemType}.',
  'savedQueries.selectNamespace.titleConnectionAndNamespace':
    'Sélectionner une connexion et un espace de noms',
  'savedQueries.selectNamespace.titleNamespace':
    'Sélectionner un espace de noms',
  'savedQueries.selectNamespace.runQuery': 'Exécuter la requête',
  'savedQueries.selectNamespace.updateWithNamespace':
    'Mettre à jour cet élément de type {itemType} avec l’espace de noms nouvellement sélectionné',
  'findInPage.hint': 'Utilisez (Maj+) Entrée pour parcourir les résultats.',
  'findInPage.inputLabel': 'Rechercher dans la page',
  'findInPage.close': 'Fermer la zone de recherche',
  'databasesCollections.createNamespace.noDot':
    'Les noms de base de données ne peuvent pas contenir de "."',
  'databasesCollections.createNamespace.parseEncryptedFieldsError':
    "Impossible d'analyser la configuration encryptedFields : {message}",
  'databasesCollections.createNamespace.parseKeyEncryptionKeyError':
    "Impossible d'analyser keyEncryptionKey : {message}",
  'connectionsNavigation.clusterState.terminating': 'EN COURS DE SUPPRESSION',
  'connectionsNavigation.clusterState.terminated': 'SUPPRIMÉ',
  'connectionsNavigation.clusterState.creating': 'EN COURS DE CRÉATION',
  'connectionsNavigation.clusterState.paused': 'EN PAUSE',
};

export const es: Catalog = {
  'sidebar.nonGenuine.badge': 'MongoDB no genuino',
  'sidebar.csfleMarker.openConfiguration':
    'Abrir la configuración de cifrado en uso de la conexión',
  'sidebar.csfleMarker.configuration':
    'Configuración de cifrado en uso de la conexión',
  'sidebar.csfleMarker.badge': 'Cifrado en uso',
  'sidebar.header.compassSettings': 'Configuración de Compass',
  'sidebar.header.dataExplorer': 'Explorador de datos',
  'sidebar.filter.search': 'Buscar',
  'sidebar.filter.filterConnections': 'Filtrar conexiones',
  'sidebar.filter.options': 'Opciones de filtro',
  'sidebar.filter.onlyActive': 'Mostrar solo conexiones activas',
  'sidebar.dbStats.dbs': 'BD',
  'sidebar.dbStats.collections': 'Colecciones',
  'sidebar.csfleModal.title': 'Opciones de conexión del cifrado en uso',
  'sidebar.csfleModal.configured':
    'Esta conexión está configurada con el cifrado en uso activado.',
  'sidebar.csfleModal.enable': 'Activar el cifrado en uso para esta conexión',
  'sidebar.csfleModal.disableDescription':
    'Desactivar el cifrado en uso solo afecta a cómo Compass accede a los datos. Para que Compass olvide las credenciales de KMS, la conexión debe cerrarse por completo.',
  'sidebar.csfleModal.enterpriseOnly':
    'El cifrado en uso es una función de MongoDB exclusiva de Enterprise/Atlas.',
  'sidebar.csfleModal.learnMore': 'Más información',
  'sidebar.connectionInfo.title': 'Información de la conexión',
  'sidebar.connectionInfo.stats': 'Estadísticas',
  'sidebar.connectionInfo.dbs.one': '{count} BD',
  'sidebar.connectionInfo.dbs.other': '{count} BD',
  'sidebar.connectionInfo.collections.one': '{count} colección',
  'sidebar.connectionInfo.collections.other': '{count} colecciones',
  'sidebar.connectionInfo.host': 'Host',
  'sidebar.connectionInfo.hosts': 'Hosts',
  'sidebar.connectionInfo.loadBalancer': '(balanceador de carga)',
  'sidebar.connectionInfo.mongos.one': '{count} Mongos',
  'sidebar.connectionInfo.mongos.other': '{count} Mongos',
  'sidebar.connectionInfo.node.one': '{count} nodo',
  'sidebar.connectionInfo.node.other': '{count} nodos',
  'sidebar.connectionInfo.sharded': 'Particionado (sharded)',
  'sidebar.connectionInfo.replicaSet': 'Replica Set {name}',
  'sidebar.connectionInfo.cluster': 'Clúster',
  'sidebar.connectionInfo.edition': 'Edición',
  'sidebar.connectionInfo.sshVia': 'Conexión SSH a través de',
  'sidebar.copyToast.successTitle': 'Correcto',
  'sidebar.copyToast.success': 'Copiado al portapapeles.',
  'sidebar.copyToast.errorTitle': 'Error',
  'sidebar.copyToast.error':
    'Se produjo un error al copiar al portapapeles. Inténtalo de nuevo.',
  'sidebar.navigation.myQueries': 'Mis consultas',
  'sidebar.navigation.dataModeling': 'Modelado de datos',
  'sidebar.connections.collapseAll': 'Contraer todas las conexiones',
  'sidebar.connections.addNew': 'Añadir nueva conexión',
  'sidebar.connections.import': 'Importar conexiones',
  'sidebar.connections.export': 'Exportar conexiones',
  'sidebar.connections.clusters': 'Clústeres',
  'sidebar.connections.connections': 'Conexiones',
  'sidebar.connections.searchClusters': 'Buscar clústeres',
  'sidebar.connections.searchConnections': 'Buscar conexiones',
  'sidebar.connections.noResults': 'No se encontraron resultados.',
  'sidebar.connections.noDeployments':
    'No te has conectado a ningún despliegue.',
  'connectionsNavigation.actions.editConnection': 'Editar conexión',
  'connectionsNavigation.actions.cannotEditActive':
    'No se puede editar una conexión activa',
  'connectionsNavigation.actions.connectVia': 'Conectar mediante …',
  'connectionsNavigation.actions.copyConnectionString':
    'Copiar cadena de conexión',
  'connectionsNavigation.actions.unfavoriteConnection':
    'Quitar conexión de favoritos',
  'connectionsNavigation.actions.favoriteConnection':
    'Añadir conexión a favoritos',
  'connectionsNavigation.actions.duplicateConnection': 'Duplicar conexión',
  'connectionsNavigation.actions.removeConnection': 'Eliminar conexión',
  'connectionsNavigation.actions.refreshDatabases': 'Actualizar bases de datos',
  'connectionsNavigation.actions.createDatabase': 'Crear base de datos',
  'connectionsNavigation.actions.openShell': 'Abrir shell de MongoDB',
  'connectionsNavigation.actions.viewPerformanceMetrics':
    'Ver métricas de rendimiento',
  'connectionsNavigation.actions.notSupported': 'No compatible',
  'connectionsNavigation.actions.viewClusterOverview':
    'Ver resumen del clúster',
  'connectionsNavigation.actions.viewMonitoring': 'Ver supervisión',
  'connectionsNavigation.actions.viewQueryInsights':
    'Ver información de consultas',
  'connectionsNavigation.actions.showConnectionInfo':
    'Mostrar información de la conexión',
  'connectionsNavigation.actions.disconnect': 'Desconectar',
  'connectionsNavigation.actions.connect': 'Conectar',
  'connectionsNavigation.actions.createCollection': 'Crear colección',
  'connectionsNavigation.actions.dropDatabase': 'Eliminar base de datos',
  'connectionsNavigation.actions.openInNewTab': 'Abrir en una pestaña nueva',
  'connectionsNavigation.actions.duplicateView': 'Duplicar vista',
  'connectionsNavigation.actions.modifyView': 'Modificar vista',
  'connectionsNavigation.actions.dropView': 'Eliminar vista',
  'connectionsNavigation.actions.renameCollection':
    'Cambiar nombre de la colección',
  'connectionsNavigation.actions.dropCollection': 'Eliminar colección',
  'connectionsNavigation.tree.databasesAndCollections':
    'Bases de datos y colecciones',
  'connectionsNavigation.unpauseCluster':
    'Reanuda tu clúster para conectarte a él',
  'connectionsNavigation.connectButton.moreOptions':
    'ver más opciones de conexión',
  'connectionsNavigation.connectButton.connect': 'Conectar',
  'connectionsNavigation.connectButton.inNewWindow': 'En una ventana nueva',
  'connectionsNavigation.nonGenuine.label': 'MongoDB no genuino',
  'connectionsNavigation.nonGenuine.tooltip': 'Se detectó MongoDB no genuino',
  'connectionsNavigation.csfle.label': 'Cifrado en uso',
  'connectionsNavigation.csfle.tooltip': 'Configurar el cifrado en uso',
  'connectionsNavigation.inferredFromPrivileges':
    'Tus privilegios te dan acceso a este espacio de nombres, pero es posible que no exista actualmente',
  'workspaces.closeTab.title': '¿Seguro que quieres cerrar la pestaña?',
  'workspaces.closeTab.description':
    'El contenido de esta pestaña se ha modificado. Perderás los cambios si la cierras.',
  'workspaces.closeTab.button': 'Cerrar pestaña',
  'workspaces.reopenTabs.title': '¿Reabrir las pestañas cerradas?',
  'workspaces.reopenTabs.description':
    'Se cerraron tu conexión y tus pestañas. Esta acción reabrirá tu sesión anterior.',
  'workspaces.reopenTabs.button': 'Reabrir pestañas',
  'workspaces.tabs.ariaLabel': 'Pestañas del espacio de trabajo',
  'welcome.tab.title': 'Bienvenido',
  'welcome.web.title': '¡Bienvenido! Explora tus datos',
  'welcome.web.createFirstCluster':
    'Para empezar, crea tu primer clúster de MongoDB.',
  'welcome.web.connectExistingCluster':
    'Para empezar, conéctate a un clúster existente.',
  'welcome.web.createCluster': 'Crear un clúster',
  'welcome.web.needHelp': '¿Necesitas más ayuda?',
  'welcome.web.viewDocumentation': 'Ver la documentación',
  'welcome.modal.start': 'Empezar',
  'welcome.modal.title': 'Te damos la bienvenida a Compass',
  'welcome.modal.disclaimer':
    'Para ayudar a mejorar nuestros productos, se recopilan datos de uso anónimos y se envían a MongoDB de acuerdo con su política de privacidad.',
  'welcome.modal.manageBefore': 'Gestiona este comportamiento en la página de',
  'welcome.modal.settings': 'Configuración',
  'welcome.modal.manageAfter': 'de Compass.',
  'welcome.modal.body':
    'Crea pipelines de agregación, optimiza consultas, analiza esquemas y mucho más. Todo con la interfaz gráfica creada por - y para - MongoDB.',
  'welcome.connectionList.connected': 'Conectado a {name}',
  'welcome.connectionList.failed': 'Error al conectar con {name}',
  'welcome.connectionList.connecting': 'Conectando con {name}',
  'welcome.desktop.newToCompass':
    '¿Eres nuevo en Compass y no tienes un clúster?',
  'welcome.desktop.createFree':
    'Si aún no tienes un clúster, puedes crear uno gratis con',
  'welcome.desktop.createFreeCluster': 'CREAR CLÚSTER GRATIS',
  'welcome.desktop.title': 'Te damos la bienvenida a MongoDB Compass',
  'welcome.desktop.getStarted':
    'Para empezar, conéctate a un servidor existente o',
  'welcome.desktop.addNewConnection': 'Añadir nueva conexión',
  'databasesCollectionsList.databaseName': 'Nombre de la base de datos',
  'databasesCollectionsList.inferredFromPrivileges':
    'Tus privilegios te dan acceso a este espacio de nombres, pero es posible que no exista actualmente',
  'databasesCollectionsList.storageSize': 'Tamaño de almacenamiento',
  'databasesCollectionsList.dataSize': 'Tamaño de los datos',
  'databasesCollectionsList.collections': 'Colecciones',
  'databasesCollectionsList.indexes': 'Índices',
  'databasesCollectionsList.collectionName': 'Nombre de la colección',
  'databasesCollectionsList.properties': 'Propiedades',
  'databasesCollectionsList.derivedFrom': 'Derivada de',
  'databasesCollectionsList.bucketCount': 'Número de buckets:',
  'databasesCollectionsList.avgBucketSize': 'Tamaño medio de bucket:',
  'databasesCollectionsList.storageSizeLabel': 'Tamaño de almacenamiento:',
  'databasesCollectionsList.totalAllocated': '(total asignado)',
  'databasesCollectionsList.used': 'Usado:',
  'databasesCollectionsList.free': 'Libre:',
  'databasesCollectionsList.documents': 'Documentos',
  'databasesCollectionsList.avgDocumentSize': 'Tamaño medio de documento',
  'databasesCollectionsList.totalIndexSize': 'Tamaño total de los índices',
  'databasesCollectionsList.openShell': 'Abrir shell de MongoDB',
  'databasesCollectionsList.viewMonitoring': 'Ver supervisión',
  'databasesCollectionsList.visualizeData': 'Visualizar tus datos',
  'databasesCollectionsList.createCollection': 'Crear colección',
  'databasesCollectionsList.createDatabase': 'Crear base de datos',
  'databasesCollectionsList.refresh': 'Actualizar',
  'databasesCollectionsList.deleteItem': 'Eliminar {name}',
  'databasesCollections.tab.connection': 'Conexión',
  'databasesCollections.tab.database': 'Base de datos',
  'databasesCollections.sampleData.emptyTitle':
    'Parece que tu clúster está vacío',
  'databasesCollections.sampleData.createOrLoad':
    'Crea una base de datos o carga datos de muestra en tu clúster para empezar rápidamente a experimentar con datos en MongoDB.',
  'databasesCollections.sampleData.loadOnly':
    'Puedes cargar datos de muestra para empezar rápidamente a experimentar con datos en MongoDB.',
  'databasesCollections.sampleData.createDatabase': 'Crear base de datos',
  'databasesCollections.sampleData.load': 'Cargar datos de muestra',
  'databasesCollections.sampleData.banner':
    'Trabajar con MongoDB es fácil, pero primero necesitarás algunos datos para empezar. Hay datos de muestra disponibles para cargar.',
  'databasesCollections.collections.loadError':
    'Se produjo un error al cargar las colecciones',
  'databasesCollections.databases.loadError':
    'Se produjo un error al cargar las bases de datos',
  'databasesCollections.databases.nonGenuineTitle':
    'No se pueden mostrar las bases de datos y las colecciones',
  'databasesCollections.databases.nonGenuineSubtitle':
    'Este servidor o servicio parece estar emulando MongoDB. Algunas funciones documentadas de MongoDB pueden funcionar de forma diferente, faltar por completo o estar incompletas, o tener características de rendimiento inesperadamente distintas a las de un servidor o servicio MongoDB real.',
  'databasesCollections.databases.tryAtlas': 'Probar MongoDB Atlas',
  'databasesCollections.createNamespace.createCollection': 'Crear colección',
  'databasesCollections.createNamespace.createDatabase': 'Crear base de datos',
  'databasesCollections.createNamespace.collectionNameRequired':
    'Antes de que MongoDB pueda guardar tu nueva base de datos, también debe especificarse un nombre de colección en el momento de la creación.',
  'databasesCollections.createNamespace.moreInformation': 'Más información',
  'databasesCollections.renameCollection.warning':
    'Cambiar el nombre de la colección provocará la pérdida de las consultas, filtros o pipelines de agregación no guardados.',
  'databasesCollections.renameCollection.savedImpacted':
    'Además, las consultas o agregaciones guardadas que apunten a esta colección deberán reasignarse al nuevo espacio de nombres.',
  'databasesCollections.renameCollection.nameExists':
    'Este nombre de colección ya existe en esta base de datos.',
  'databasesCollections.renameCollection.confirmTitle':
    'Confirmar el cambio de nombre de la colección',
  'databasesCollections.renameCollection.title':
    'Cambiar nombre de la colección',
  'databasesCollections.renameCollection.proceed':
    'Continuar con el cambio de nombre',
  'databasesCollections.renameCollection.confirmButton':
    'Sí, cambiar nombre de la colección',
  'databasesCollections.renameCollection.newName':
    'Nuevo nombre de la colección',
  'databasesCollections.renameCollection.confirmQuestion':
    '¿Seguro que quieres cambiar el nombre de «{from}» a «{to}»?',
  'databasesCollections.renameCollection.renaming':
    'Cambiando el nombre de la colección…',
  'databasesCollections.renameCollection.renamed':
    'Colección renombrada a {name}',
  'databasesCollections.drop.collectionTitle': '¿Eliminar colección?',
  'databasesCollections.drop.databaseTitle': '¿Eliminar base de datos?',
  'databasesCollections.drop.collectionDescription':
    '¿Seguro que quieres eliminar la colección «{ns}»?',
  'databasesCollections.drop.databaseDescription':
    '¿Seguro que quieres eliminar la base de datos «{ns}»?',
  'databasesCollections.drop.collectionButton': 'Eliminar colección',
  'databasesCollections.drop.databaseButton': 'Eliminar base de datos',
  'databasesCollections.drop.collectionDropped': 'Colección «{ns}» eliminada',
  'databasesCollections.drop.databaseDropped': 'Base de datos «{ns}» eliminada',
  'databasesCollections.drop.collectionFailed':
    'Error al eliminar la colección «{ns}»',
  'databasesCollections.drop.databaseFailed':
    'Error al eliminar la base de datos «{ns}»',
  'databasesCollections.fields.selectValue': 'Selecciona un valor',
  'databasesCollections.fields.selectValueOptional':
    'Selecciona un valor [opcional]',
  'databasesCollections.fields.useCustomCollation':
    'Usar intercalación (collation) personalizada',
  'databasesCollections.fields.collationDescription':
    'La intercalación (collation) permite especificar reglas específicas de un idioma para la comparación de cadenas, como las de mayúsculas y minúsculas y los acentos.',
  'databasesCollections.fields.collectionName': 'Nombre de la colección',
  'databasesCollections.fields.databaseName': 'Nombre de la base de datos',
  'databasesCollections.fields.clusteredCollection':
    'Colección agrupada en clúster',
  'databasesCollections.fields.clusteredDescription':
    'Las colecciones agrupadas en clúster almacenan los documentos ordenados por una clave de clúster definida por el usuario.',
  'databasesCollections.fields.clusteredIndexName':
    'El nombre del índice agrupado es opcional; de lo contrario, se genera automáticamente.',
  'databasesCollections.fields.clusteredExpireAfterSeconds':
    'El campo expireAfterSeconds permite la eliminación automática de los documentos más antiguos que el número de segundos especificado. El campo _id debe ser una fecha o un array que contenga valores de fecha.',
  'databasesCollections.fields.timeSeries': 'Series temporales',
  'databasesCollections.fields.timeSeriesDescription':
    'Las colecciones de series temporales almacenan de forma eficiente secuencias de mediciones durante un período de tiempo.',
  'databasesCollections.fields.timeFieldDescription':
    'Especifica qué campo se debe usar como timeField para la colección de series temporales. Este campo debe ser del tipo BSON date.',
  'databasesCollections.fields.metaFieldDescription':
    'El metaField es el campo designado para los metadatos.',
  'databasesCollections.fields.granularityDescription':
    'El campo granularity permite especificar una granularidad más gruesa para que las mediciones durante un período más largo se almacenen y consulten de forma más eficiente.',
  'databasesCollections.fields.bucketMaxSpanDescription':
    'El intervalo de tiempo máximo entre mediciones en un bucket.',
  'databasesCollections.fields.bucketRoundingDescription':
    'El intervalo de tiempo que determina la marca de tiempo de inicio de un nuevo bucket.',
  'databasesCollections.fields.timeSeriesExpireAfterSeconds':
    'El campo expireAfterSeconds permite la eliminación automática de los documentos más antiguos que el número de segundos especificado.',
  'databasesCollections.fields.fle2Description':
    'Cifra un subconjunto de los campos con Queryable Encryption.',
  'databasesCollections.fields.encryptedFields': 'Campos cifrados',
  'databasesCollections.fields.encryptedFieldsDescription':
    'Indica qué campos se deben cifrar y si deben poder consultarse.',
  'databasesCollections.fields.kmsProvider': 'Proveedor de KMS',
  'databasesCollections.fields.kmsProviderDescription':
    'Opcional. Si no se especifica ningún keyId en la configuración de los campos cifrados, Compass creará nuevas claves de datos para cada campo cifrado mediante el KMS especificado.',
  'databasesCollections.fields.keyEncryptionKey':
    'Clave de cifrado de claves (Key Encryption Key)',
  'databasesCollections.fields.keyEncryptionKeyDescription':
    'Especifica qué clave de cifrado de claves se debe usar para crear nuevas claves de cifrado de datos.',
  'databasesCollections.fields.additionalPreferences':
    'Preferencias adicionales',
  'databasesCollections.fields.additionalPreferencesHint':
    '(p. ej., intercalación personalizada, colecciones agrupadas en clúster)',
  'savedQueries.tabTitle': 'Mis consultas',
  'savedQueries.empty.title': 'Aún no hay consultas guardadas.',
  'savedQueries.empty.subtitle':
    'Guarda tus agregaciones y consultas find y aparecerán aquí.',
  'savedQueries.empty.notSure': '¿No sabes por dónde empezar?',
  'savedQueries.empty.visitDocs': 'Visita nuestra documentación',
  'savedQueries.noResults.title': 'No se encontraron resultados.',
  'savedQueries.noResults.subtitle':
    'No encontramos ningún elemento que coincida con tu búsqueda.',
  'savedQueries.noConnections.title': 'Conectar a un clúster',
  'savedQueries.noConnections.message':
    'Parece que no estás conectado a ningún clúster. Establece primero una conexión.',
  'savedQueries.edit.update': 'Actualizar',
  'savedQueries.edit.titleQuery': 'Cambiar nombre de la consulta',
  'savedQueries.edit.titleAggregation': 'Cambiar nombre de la agregación',
  'savedQueries.edit.title': 'Cambiar nombre de {type}',
  'savedQueries.edit.name': 'Nombre',
  'savedQueries.card.copy': 'Copiar',
  'savedQueries.card.rename': 'Cambiar nombre',
  'savedQueries.card.delete': 'Eliminar',
  'savedQueries.card.openIn': 'Abrir en',
  'savedQueries.card.lastModified': 'Última modificación:',
  'savedQueries.list.sortName': 'Nombre',
  'savedQueries.list.sortLastModified': 'Última modificación',
  'savedQueries.filters.search': 'Buscar',
  'savedQueries.filters.allDatabases': 'Todas las bases de datos',
  'savedQueries.filters.allCollections': 'Todas las colecciones',
  'savedQueries.delete.titleQuery': '¿Seguro que quieres eliminar tu consulta?',
  'savedQueries.delete.titleAggregation':
    '¿Seguro que quieres eliminar tu agregación?',
  'savedQueries.delete.description': 'Esta acción no se puede deshacer.',
  'savedQueries.delete.button': 'Eliminar',
  'savedQueries.itemType.query': 'consulta',
  'savedQueries.itemType.aggregation': 'agregación',
  'savedQueries.selectConnection.title': 'Selecciona una conexión',
  'savedQueries.selectConnection.runQuery': 'Ejecutar consulta',
  'savedQueries.selectConnection.namespace': 'El espacio de nombres',
  'savedQueries.selectConnection.forSaved': 'de la {itemType} guardada',
  'savedQueries.selectConnection.existsInMultiple':
    'existe en varias conexiones activas. Selecciona la conexión que quieres usar',
  'savedQueries.selectConnection.runAgainst': 'para ejecutar la {itemType}.',
  'savedQueries.selectNamespace.connection': 'Conexión',
  'savedQueries.selectNamespace.database': 'Base de datos',
  'savedQueries.selectNamespace.collection': 'Colección',
  'savedQueries.selectNamespace.namespace': 'El espacio de nombres',
  'savedQueries.selectNamespace.forSaved': 'de la {itemType} guardada',
  'savedQueries.selectNamespace.notFoundAnyConnection':
    'no existe en ninguna de las conexiones activas. Selecciona otro destino para abrir la {itemType} guardada',
  'savedQueries.selectNamespace.notFoundCurrentConnection':
    'no existe en la conexión actual. Selecciona otro espacio de nombres para abrir la {itemType} guardada.',
  'savedQueries.selectNamespace.titleConnectionAndNamespace':
    'Selecciona una conexión y un espacio de nombres',
  'savedQueries.selectNamespace.titleNamespace':
    'Selecciona un espacio de nombres',
  'savedQueries.selectNamespace.runQuery': 'Ejecutar consulta',
  'savedQueries.selectNamespace.updateWithNamespace':
    'Actualizar esta {itemType} con el espacio de nombres recién seleccionado',
  'findInPage.hint': 'Usa (Mayús+) Intro para navegar por los resultados.',
  'findInPage.inputLabel': 'Buscar en la página',
  'findInPage.close': 'Cerrar cuadro de búsqueda',
  'databasesCollections.createNamespace.noDot':
    'Los nombres de base de datos no pueden contener un "."',
  'databasesCollections.createNamespace.parseEncryptedFieldsError':
    'No se pudo analizar la configuración de encryptedFields: {message}',
  'databasesCollections.createNamespace.parseKeyEncryptionKeyError':
    'No se pudo analizar keyEncryptionKey: {message}',
  'connectionsNavigation.clusterState.terminating': 'ELIMINANDO',
  'connectionsNavigation.clusterState.terminated': 'ELIMINADO',
  'connectionsNavigation.clusterState.creating': 'CREANDO',
  'connectionsNavigation.clusterState.paused': 'PAUSADO',
};
