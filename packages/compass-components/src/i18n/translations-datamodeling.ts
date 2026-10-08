import type { Catalog } from './translations';

// Texts of the data modeling plugin. See ./translations.ts for the key
// conventions.

export const de: Catalog = {
  'dataModeling.analysis.sampling': 'Collections werden abgetastet…',
  'dataModeling.analysis.analyzing': 'Collection-Schemas werden analysiert…',
  'dataModeling.analysis.inferring':
    'Beziehungen zwischen Collections werden abgeleitet…',
  'dataModeling.analysis.preparing': 'Diagramm wird vorbereitet…',
  'dataModeling.analysis.cancel': 'Abbrechen',
  'dataModeling.analysis.description': 'Das kann einige Minuten dauern.',
  'dataModeling.deleted.message': 'Dieses Datenmodell wurde gelöscht.',
  'dataModeling.deleted.back': 'Zurück zur Datenmodellierung',
  'dataModeling.diagramCard.rename': 'Umbenennen',
  'dataModeling.diagramCard.delete': 'Löschen',
  'dataModeling.diagramCard.lastModified': 'Zuletzt\u00a0geändert:',
  'dataModeling.list.openExisting': 'Ein vorhandenes Diagramm öffnen:',
  'dataModeling.list.generateNew': 'Neues Diagramm erstellen',
  'dataModeling.list.searchDiagrams': 'Diagramme durchsuchen',
  'dataModeling.import.button': 'Diagramm importieren',
  'dataModeling.import.tooltip':
    'Es können nur MDM-Dateien importiert werden, die aus Compass oder dem Atlas Data Explorer exportiert wurden.',
  'dataModeling.features.visualization.title': 'Schnelle Visualisierung',
  'dataModeling.features.visualization.subtitle':
    'Visualisiere deine Datenmodelle sofort',
  'dataModeling.features.collaboration.title':
    'Zusammenarbeit und Teilen mit deinem Team',
  'dataModeling.features.collaboration.subtitle':
    'Arbeite teamübergreifend an Schemas zusammen und teile sie',
  'dataModeling.features.interactive.title': 'Interaktive Diagrammanalyse',
  'dataModeling.features.interactive.subtitle':
    'Erkunde und kommentiere interaktive Diagramme',
  'dataModeling.empty.title': 'Visualisiere dein Datenmodell',
  'dataModeling.empty.description':
    'Dein Datenmodell ist die Grundlage für die Leistung deiner Anwendung. Wenn sich Anwendungen weiterentwickeln, muss sich auch dein Schema weiterentwickeln – intelligent und strategisch. Reduziere die Komplexität, vermeide Leistungsengpässe und halte deine Entwicklung agil.',
  'dataModeling.empty.docs': 'Dokumentation zur Datenmodellierung',
  'dataModeling.empty.generate': 'Diagramm erstellen',
  'dataModeling.list.sortName': 'Name',
  'dataModeling.list.sortLastModified': 'Zuletzt geändert',
  'dataModeling.list.noResults': 'Keine Ergebnisse gefunden.',
  'dataModeling.list.noResultsDescription':
    'Es wurde kein Diagramm gefunden, das zu deiner Suche passt.',
  'dataModeling.settings.inferRelationships':
    'Beziehungen automatisch ableiten',
  'dataModeling.settings.inferDescription':
    'Der Analyseprozess versucht, Beziehungen in den ausgewählten Collections automatisch zu erkennen. Dabei werden mehrere Find-Anfragen auf indizierte Felder der Collections ausgeführt und',
  'dataModeling.settings.inferDescriptionEmphasis':
    'benötigt zusätzliche Zeit pro analysierter Collection.',
  'dataModeling.settings.documentSampling': 'Dokument-Stichprobe',
  'dataModeling.settings.samplingDescription':
    'Standardmäßig werden Diagramme aus einer kleinen Stichprobe pro Collection erstellt. Größere Stichproben verbessern die Genauigkeit, erhöhen aber Analysezeit und Speicherverbrauch, während kleinere Stichproben schneller sind, aber seltene Felder oder Beziehungen übersehen können.',
  'dataModeling.settings.sampleSize': 'Stichprobengröße',
  'dataModeling.settings.documentsPerCollection': 'Dokumente pro Collection.',
  'dataModeling.settings.allDocuments': 'Alle Dokumente',
  'dataModeling.settings.invalidInput': 'Ungültige Eingabe',
  'dataModeling.settings.warning': 'Warnung:',
  'dataModeling.settings.warningDescription':
    'Berücksichtige die Größe deines Datensatzes und die verfügbaren Ressourcen deines Geräts oder Browsers.',
  'dataModeling.export.title': 'Datenmodell exportieren',
  'dataModeling.export.selectFormat': 'Dateiformat auswählen:',
  'dataModeling.export.mdmFile': 'MDM-Datei',
  'dataModeling.export.mdmDescription':
    'Kann in Compass und den Data Explorer importiert werden, damit Teammitglieder zusammenarbeiten können.',
  'dataModeling.export.pngDescription':
    'Teilbares Bild für Dokumentationen oder Präsentationen.',
  'dataModeling.export.jsonDescription':
    'Rohdaten des Schemas für die programmgesteuerte Nutzung.',
  'dataModeling.export.cancel': 'Abbrechen',
  'dataModeling.export.export': 'Exportieren',
  'dataModeling.newDiagram.collectionsSelected.one':
    'Collection insgesamt ausgewählt.',
  'dataModeling.newDiagram.collectionsSelected.other':
    'Collections insgesamt ausgewählt.',
  'dataModeling.newDiagram.setupTitle': 'Neues Diagramm einrichten',
  'dataModeling.newDiagram.next': 'Weiter',
  'dataModeling.newDiagram.cancel': 'Abbrechen',
  'dataModeling.newDiagram.back': 'Zurück',
  'dataModeling.newDiagram.generate': 'Erstellen',
  'dataModeling.newDiagram.selectCollectionsTitle':
    'Collections für {database} auswählen',
  'dataModeling.newDiagram.selectCollectionsDescription':
    'Diese Collections werden in dein erstelltes Diagramm aufgenommen.',
  'dataModeling.newDiagram.settingsTitle': 'Diagrammeinstellungen',
  'dataModeling.setup.noConnections':
    'Du hast keine Verbindungen. Erstelle zuerst eine neue Verbindung.',
  'dataModeling.setup.noDatabases':
    'Für die ausgewählte Verbindung wurden keine Datenbanken gefunden.',
  'dataModeling.setup.connection': 'Verbindung',
  'dataModeling.setup.selectConnection': 'Verbindung auswählen',
  'dataModeling.setup.database': 'Datenbank',
  'dataModeling.setup.selectDatabase': 'Datenbank auswählen',
  'dataModeling.setup.diagramName': 'Diagrammname',
  'dataModeling.setup.banner':
    'Das Diagramm wird aus einer Stichprobe von Dokumenten der ausgewählten Datenbank erstellt. Änderungen am Diagramm wirken sich nicht auf deine Daten aus.',
  'dataModeling.collections.fetching': 'Collections werden abgerufen …',
  'dataModeling.collections.search': 'Collections durchsuchen',
  'dataModeling.collections.noCollections':
    'Diese Datenbank enthält keine Collections.',
  'dataModeling.collections.noMatch':
    'Keine Collections entsprechen deiner Suche.',
  'dataModeling.collections.name': 'Collection-Name',
  'dataModeling.reselect.selectConnectionTitle': 'Verbindung auswählen',
  'dataModeling.reselect.selectConnectionDescription':
    'Um die Collections dieser Datenbank abzurufen, wähle zuerst die mit diesem Datenmodell verknüpfte Datenbank aus und verbinde dich mit ihr.',
  'dataModeling.reselect.connect': 'Verbinden',
  'dataModeling.toolbar.diagrams': 'Diagramme',
  'dataModeling.toolbar.untitled': 'Unbenannt',
  'dataModeling.toolbar.undo': 'Rückgängig',
  'dataModeling.toolbar.redo': 'Wiederholen',
  'dataModeling.toolbar.addCollection': 'Collection hinzufügen',
  'dataModeling.toolbar.addOrSelectCollections':
    'Collections aus der Datenbank hinzufügen oder auswählen',
  'dataModeling.toolbar.addNewCollection': 'Neue Collection hinzufügen',
  'dataModeling.toolbar.selectFromDatabase': 'Aus Datenbank auswählen',
  'dataModeling.toolbar.addRelationship': 'Beziehung hinzufügen',
  'dataModeling.toolbar.exitRelationshipMode': 'Beziehungszeichenmodus beenden',
  'dataModeling.toolbar.addRelationshipHint':
    'Füge eine Beziehung hinzu, indem du von einer Collection zu einer anderen ziehst',
  'dataModeling.toolbar.export': 'Exportieren',
  'dataModeling.editor.retry': 'Erneut versuchen',
  'dataModeling.editor.schemaPreview': 'Schemavorschau',
  'dataModeling.editor.analysisCanceled': 'Analyse abgebrochen',
  'dataModeling.editor.analysisFailed': 'Analyse fehlgeschlagen',
  'dataModeling.validation.diagramNameEmpty':
    'Der Diagrammname darf nicht leer sein.',
  'dataModeling.validation.collectionNameEmpty':
    'Der Collection-Name darf nicht leer sein.',
  'dataModeling.validation.diagramNameUnique':
    'Der Diagrammname muss eindeutig sein.',
  'dataModeling.validation.collectionNameUnique':
    'Der Collection-Name muss eindeutig sein.',
  'dataModeling.drawer.collectionConfiguration': 'Collection-Konfiguration',
  'dataModeling.drawer.deleteCollection': 'Collection löschen',
  'dataModeling.drawer.relationshipConfiguration': 'Beziehungskonfiguration',
  'dataModeling.drawer.delete': 'Löschen',
  'dataModeling.drawer.fieldConfiguration': 'Feldkonfiguration',
  'dataModeling.drawer.deleteField': 'Feld löschen',
  'dataModeling.drawer.overview': 'Datenmodellübersicht',
  'dataModeling.overview.model': 'Modell',
  'dataModeling.overview.generated': 'Erstellt',
  'dataModeling.overview.from': 'Von',
  'dataModeling.overview.at': 'Am',
  'dataModeling.overview.lastUpdated': 'Zuletzt aktualisiert',
  'dataModeling.overview.sampleInfo':
    'Dieses Diagramm wurde anhand einer Stichprobe von Dokumenten erstellt. Änderungen am Diagramm wirken sich nicht auf deine Daten aus.',
  'dataModeling.collectionDrawer.properties': 'Collection-Eigenschaften',
  'dataModeling.collectionDrawer.name': 'Name',
  'dataModeling.collectionDrawer.noRelationships':
    'Diese Collection hat noch keine Beziehungen.',
  'dataModeling.collectionDrawer.notes': 'Notizen',
  'dataModeling.relationships.title': 'Beziehungen',
  'dataModeling.relationships.add': 'Beziehung hinzufügen',
  'dataModeling.relationships.cannotResolve':
    'Die Beziehung kann nicht aufgelöst werden – bitte überprüfe die verknüpften Felder und den Namespace.',
  'dataModeling.relationships.edit': 'Beziehung bearbeiten',
  'dataModeling.relationships.delete': 'Beziehung löschen',
  'dataModeling.field.nameEmpty': 'Der Feldname darf nicht leer sein.',
  'dataModeling.field.alreadyExists': 'Das Feld existiert bereits.',
  'dataModeling.field.typeRequired': 'Das Feld muss einen Typ haben.',
  'dataModeling.field.properties': 'Feldeigenschaften',
  'dataModeling.field.name': 'Feldname',
  'dataModeling.field.datatype': 'Datentyp',
  'dataModeling.field.noRelationships':
    'Dieses Feld hat noch keine Beziehungen.',
  'dataModeling.relationship.cardinalityOne': 'Eins',
  'dataModeling.relationship.cardinalityMany': 'Viele',
  'dataModeling.relationship.properties': 'Beziehungseigenschaften',
  'dataModeling.relationship.localCollection': 'Lokale Collection',
  'dataModeling.relationship.localField': 'Lokales Feld',
  'dataModeling.relationship.localCardinality': 'Lokale Kardinalität',
  'dataModeling.relationship.foreignCollection': 'Fremd-Collection',
  'dataModeling.relationship.foreignField': 'Fremdfeld',
  'dataModeling.relationship.foreignCardinality': 'Fremdkardinalität',
  'dataModeling.relationship.cardinalityInfo':
    'Die Kardinalität der Beziehung kann Hinweise darauf geben, ob du einbettest oder referenzierst.',
  'dataModeling.relationship.learnMore': 'Mehr erfahren',
  'dataModeling.nodes.unresolvedRelationships':
    'Eine oder mehrere Beziehungen können nicht aufgelöst werden.',
  'dataModeling.errors.couldNotApplyChanges':
    'Änderungen konnten nicht angewendet werden',
  'dataModeling.errors.applyChangesFailed':
    'Beim Anwenden der Änderungen ist ein Fehler aufgetreten.',
  'dataModeling.errors.openDiagram': 'Fehler beim Öffnen des Diagramms',
  'dataModeling.confirm.deleteTitle':
    'Möchtest du dieses Diagramm wirklich löschen?',
  'dataModeling.confirm.deleteDescription':
    'Diese Aktion kann nicht rückgängig gemacht werden.',
  'dataModeling.rename.title': 'Diagramm umbenennen',
  'dataModeling.rename.label': 'Name',
  'dataModeling.export.failedTitle': 'Export fehlgeschlagen',
  'dataModeling.export.failedDescription':
    'Beim Exportieren des Diagramms ist ein Fehler aufgetreten: {message}',
  'dataModeling.errors.diagramNameExists':
    'Ein Diagramm mit diesem Namen existiert bereits.',
  'dataModeling.errors.connectionFailed': 'Verbindung fehlgeschlagen.',
  'dataModeling.errors.databaseNotFound':
    'Die ausgewählte Datenbank existiert bei dieser Verbindung nicht.',
  'dataModeling.errors.invalidFileContents': 'Ungültiger Dateiinhalt',
  'dataModeling.errors.unsupportedFileFormat':
    'Nicht unterstütztes Diagrammdateiformat',
  'dataModeling.errors.missingRequiredFields':
    'In der Diagrammdatei fehlen erforderliche Felder',
  'dataModeling.errors.parseFailedInvalidData':
    'Diagrammdatei konnte nicht gelesen werden: Ungültige Diagrammdaten.',
  'dataModeling.errors.parseFailed':
    'Diagrammdatei konnte nicht gelesen werden: {message}',
  'dataModeling.errors.fileReadError': 'Fehler beim Lesen der Datei',
  'dataModeling.errors.fieldRequired': '„{path}“ ist erforderlich',
  'dataModeling.errors.invalidField': 'Ungültiges Feld „{path}“: {message}',
  'dataModeling.errors.diagramElementNotFound':
    'Diagrammelement nicht gefunden',
  'dataModeling.errors.connectionNotFound':
    'Die ausgewählte Verbindung wurde nicht gefunden.',
};

export const fr: Catalog = {
  'dataModeling.analysis.sampling': 'Échantillonnage des collections…',
  'dataModeling.analysis.analyzing': 'Analyse des schémas de collections…',
  'dataModeling.analysis.inferring':
    'Déduction des relations entre les collections…',
  'dataModeling.analysis.preparing': 'Préparation du diagramme…',
  'dataModeling.analysis.cancel': 'Annuler',
  'dataModeling.analysis.description': 'Cela peut prendre quelques minutes.',
  'dataModeling.deleted.message': 'Ce modèle de données a été supprimé.',
  'dataModeling.deleted.back': 'Retour à la modélisation des données',
  'dataModeling.diagramCard.rename': 'Renommer',
  'dataModeling.diagramCard.delete': 'Supprimer',
  'dataModeling.diagramCard.lastModified': 'Dernière\u00a0modification\u00a0:',
  'dataModeling.list.openExisting': 'Ouvrir un diagramme existant :',
  'dataModeling.list.generateNew': 'Générer un nouveau diagramme',
  'dataModeling.list.searchDiagrams': 'Rechercher des diagrammes',
  'dataModeling.import.button': 'Importer un diagramme',
  'dataModeling.import.tooltip':
    'Seuls les fichiers MDM exportés depuis Compass ou Atlas Data Explorer peuvent être importés.',
  'dataModeling.features.visualization.title': 'Visualisation rapide',
  'dataModeling.features.visualization.subtitle':
    'Visualisez instantanément vos modèles de données',
  'dataModeling.features.collaboration.title':
    'Collaboration et partage avec votre équipe',
  'dataModeling.features.collaboration.subtitle':
    'Collaborez et partagez des schémas entre les équipes',
  'dataModeling.features.interactive.title':
    'Analyse interactive de diagrammes',
  'dataModeling.features.interactive.subtitle':
    'Explorez et annotez des diagrammes interactifs',
  'dataModeling.empty.title': 'Visualisez votre modèle de données',
  'dataModeling.empty.description':
    'Votre modèle de données est le fondement des performances de l’application. À mesure que les applications évoluent, votre schéma doit évoluer lui aussi, de manière intelligente et stratégique. Réduisez la complexité, évitez les goulots d’étranglement et gardez un développement agile.',
  'dataModeling.empty.docs': 'Documentation sur la modélisation des données',
  'dataModeling.empty.generate': 'Générer un diagramme',
  'dataModeling.list.sortName': 'Nom',
  'dataModeling.list.sortLastModified': 'Dernière modification',
  'dataModeling.list.noResults': 'Aucun résultat trouvé.',
  'dataModeling.list.noResultsDescription':
    'Aucun diagramme ne correspond à votre recherche.',
  'dataModeling.settings.inferRelationships':
    'Déduire automatiquement les relations',
  'dataModeling.settings.inferDescription':
    'Le processus d’analyse tentera de découvrir automatiquement les relations dans les collections sélectionnées. Cette opération exécutera plusieurs requêtes find sur les champs indexés des collections et',
  'dataModeling.settings.inferDescriptionEmphasis':
    'prendra du temps supplémentaire pour chaque collection analysée.',
  'dataModeling.settings.documentSampling': 'Échantillonnage de documents',
  'dataModeling.settings.samplingDescription':
    'Par défaut, les diagrammes sont générés à partir d’un petit échantillon par collection. Des échantillons plus grands améliorent la précision mais augmentent le temps d’analyse et l’utilisation de la mémoire, tandis que des échantillons plus petits sont plus rapides mais peuvent manquer des champs ou des relations peu fréquents.',
  'dataModeling.settings.sampleSize': 'Taille de l’échantillon',
  'dataModeling.settings.documentsPerCollection': 'documents par collection.',
  'dataModeling.settings.allDocuments': 'Tous les documents',
  'dataModeling.settings.invalidInput': 'Saisie non valide',
  'dataModeling.settings.warning': 'Avertissement :',
  'dataModeling.settings.warningDescription':
    'Tenez compte de la taille de votre jeu de données et des ressources disponibles sur votre appareil ou navigateur.',
  'dataModeling.export.title': 'Exporter le modèle de données',
  'dataModeling.export.selectFormat': 'Sélectionner le format de fichier :',
  'dataModeling.export.mdmFile': 'Fichier MDM',
  'dataModeling.export.mdmDescription':
    'Importable dans Compass et Data Explorer pour que vos collègues puissent collaborer.',
  'dataModeling.export.pngDescription':
    'Image partageable pour la documentation ou les présentations.',
  'dataModeling.export.jsonDescription':
    'Données brutes du schéma pour une utilisation programmatique.',
  'dataModeling.export.cancel': 'Annuler',
  'dataModeling.export.export': 'Exporter',
  'dataModeling.newDiagram.collectionsSelected.one':
    'collection au total sélectionnée.',
  'dataModeling.newDiagram.collectionsSelected.other':
    'collections au total sélectionnées.',
  'dataModeling.newDiagram.setupTitle': 'Configuration du nouveau diagramme',
  'dataModeling.newDiagram.next': 'Suivant',
  'dataModeling.newDiagram.cancel': 'Annuler',
  'dataModeling.newDiagram.back': 'Retour',
  'dataModeling.newDiagram.generate': 'Générer',
  'dataModeling.newDiagram.selectCollectionsTitle':
    'Sélectionner les collections pour {database}',
  'dataModeling.newDiagram.selectCollectionsDescription':
    'Ces collections seront incluses dans votre diagramme généré.',
  'dataModeling.newDiagram.settingsTitle': 'Paramètres du diagramme',
  'dataModeling.setup.noConnections':
    'Vous n’avez aucune connexion, créez d’abord une nouvelle connexion.',
  'dataModeling.setup.noDatabases':
    'Aucune base de données trouvée pour la connexion sélectionnée.',
  'dataModeling.setup.connection': 'Connexion',
  'dataModeling.setup.selectConnection': 'Sélectionner une connexion',
  'dataModeling.setup.database': 'Base de données',
  'dataModeling.setup.selectDatabase': 'Sélectionner une base de données',
  'dataModeling.setup.diagramName': 'Nom du diagramme',
  'dataModeling.setup.banner':
    'Le diagramme sera généré à partir d’un échantillon de documents de la base de données sélectionnée. Les modifications apportées au diagramme n’auront aucun impact sur vos données.',
  'dataModeling.collections.fetching': 'Récupération des collections …',
  'dataModeling.collections.search': 'Rechercher des collections',
  'dataModeling.collections.noCollections':
    'Cette base de données ne contient aucune collection.',
  'dataModeling.collections.noMatch':
    'Aucune collection ne correspond à votre recherche.',
  'dataModeling.collections.name': 'Nom de la collection',
  'dataModeling.reselect.selectConnectionTitle': 'Sélectionner une connexion',
  'dataModeling.reselect.selectConnectionDescription':
    'Pour récupérer les collections de cette base de données, sélectionnez d’abord la base de données associée à ce modèle de données et connectez-vous à celle-ci.',
  'dataModeling.reselect.connect': 'Se connecter',
  'dataModeling.toolbar.diagrams': 'diagrammes',
  'dataModeling.toolbar.untitled': 'sans titre',
  'dataModeling.toolbar.undo': 'Annuler',
  'dataModeling.toolbar.redo': 'Rétablir',
  'dataModeling.toolbar.addCollection': 'Ajouter une collection',
  'dataModeling.toolbar.addOrSelectCollections':
    'Ajouter ou sélectionner des collections de la base de données',
  'dataModeling.toolbar.addNewCollection': 'Ajouter une nouvelle collection',
  'dataModeling.toolbar.selectFromDatabase':
    'Sélectionner depuis la base de données',
  'dataModeling.toolbar.addRelationship': 'Ajouter une relation',
  'dataModeling.toolbar.exitRelationshipMode':
    'Quitter le mode de dessin de relation',
  'dataModeling.toolbar.addRelationshipHint':
    'Ajoutez une relation en faisant glisser d’une collection vers une autre',
  'dataModeling.toolbar.export': 'Exporter',
  'dataModeling.editor.retry': 'Réessayer',
  'dataModeling.editor.schemaPreview': 'Aperçu du schéma',
  'dataModeling.editor.analysisCanceled': 'Analyse annulée',
  'dataModeling.editor.analysisFailed': 'Échec de l’analyse',
  'dataModeling.validation.diagramNameEmpty':
    'Le nom du diagramme ne peut pas être vide.',
  'dataModeling.validation.collectionNameEmpty':
    'Le nom de la collection ne peut pas être vide.',
  'dataModeling.validation.diagramNameUnique':
    'Le nom du diagramme doit être unique.',
  'dataModeling.validation.collectionNameUnique':
    'Le nom de la collection doit être unique.',
  'dataModeling.drawer.collectionConfiguration':
    'Configuration de la collection',
  'dataModeling.drawer.deleteCollection': 'Supprimer la collection',
  'dataModeling.drawer.relationshipConfiguration':
    'Configuration de la relation',
  'dataModeling.drawer.delete': 'Supprimer',
  'dataModeling.drawer.fieldConfiguration': 'Configuration du champ',
  'dataModeling.drawer.deleteField': 'Supprimer le champ',
  'dataModeling.drawer.overview': 'Vue d’ensemble du modèle de données',
  'dataModeling.overview.model': 'Modèle',
  'dataModeling.overview.generated': 'Généré',
  'dataModeling.overview.from': 'De',
  'dataModeling.overview.at': 'Le',
  'dataModeling.overview.lastUpdated': 'Dernière mise à jour',
  'dataModeling.overview.sampleInfo':
    'Ce diagramme a été généré à partir d’un échantillon de documents. Les modifications apportées au diagramme n’auront aucun impact sur vos données.',
  'dataModeling.collectionDrawer.properties': 'Propriétés de la collection',
  'dataModeling.collectionDrawer.name': 'Nom',
  'dataModeling.collectionDrawer.noRelationships':
    'Cette collection n’a pas encore de relations.',
  'dataModeling.collectionDrawer.notes': 'Notes',
  'dataModeling.relationships.title': 'Relations',
  'dataModeling.relationships.add': 'Ajouter une relation',
  'dataModeling.relationships.cannotResolve':
    'Impossible de résoudre la relation : vérifiez les champs liés et l’espace de noms.',
  'dataModeling.relationships.edit': 'Modifier la relation',
  'dataModeling.relationships.delete': 'Supprimer la relation',
  'dataModeling.field.nameEmpty': 'Le nom du champ ne peut pas être vide.',
  'dataModeling.field.alreadyExists': 'Le champ existe déjà.',
  'dataModeling.field.typeRequired': 'Le champ doit avoir un type.',
  'dataModeling.field.properties': 'Propriétés du champ',
  'dataModeling.field.name': 'Nom du champ',
  'dataModeling.field.datatype': 'Type de données',
  'dataModeling.field.noRelationships': 'Ce champ n’a pas encore de relations.',
  'dataModeling.relationship.cardinalityOne': 'Un',
  'dataModeling.relationship.cardinalityMany': 'Plusieurs',
  'dataModeling.relationship.properties': 'Propriétés de la relation',
  'dataModeling.relationship.localCollection': 'Collection locale',
  'dataModeling.relationship.localField': 'Champ local',
  'dataModeling.relationship.localCardinality': 'Cardinalité locale',
  'dataModeling.relationship.foreignCollection': 'Collection étrangère',
  'dataModeling.relationship.foreignField': 'Champ étranger',
  'dataModeling.relationship.foreignCardinality': 'Cardinalité étrangère',
  'dataModeling.relationship.cardinalityInfo':
    'La cardinalité de la relation peut indiquer s’il faut imbriquer ou référencer.',
  'dataModeling.relationship.learnMore': 'En savoir plus',
  'dataModeling.nodes.unresolvedRelationships':
    'Une ou plusieurs relations ne peuvent pas être résolues.',
  'dataModeling.errors.couldNotApplyChanges':
    'Impossible d’appliquer les modifications',
  'dataModeling.errors.applyChangesFailed':
    'Un problème est survenu lors de l’application des modifications.',
  'dataModeling.errors.openDiagram': 'Erreur lors de l’ouverture du diagramme',
  'dataModeling.confirm.deleteTitle':
    'Voulez-vous vraiment supprimer ce diagramme ?',
  'dataModeling.confirm.deleteDescription': 'Cette action est irréversible.',
  'dataModeling.rename.title': 'Renommer le diagramme',
  'dataModeling.rename.label': 'Nom',
  'dataModeling.export.failedTitle': 'Échec de l’exportation',
  'dataModeling.export.failedDescription':
    'Une erreur s’est produite lors de l’exportation du diagramme : {message}',
  'dataModeling.errors.diagramNameExists':
    'Un diagramme portant ce nom existe déjà.',
  'dataModeling.errors.connectionFailed': 'Échec de la connexion.',
  'dataModeling.errors.databaseNotFound':
    'La base de données sélectionnée n’existe pas sur cette connexion.',
  'dataModeling.errors.invalidFileContents': 'Contenu de fichier non valide',
  'dataModeling.errors.unsupportedFileFormat':
    'Format de fichier de diagramme non pris en charge',
  'dataModeling.errors.missingRequiredFields':
    'Des champs obligatoires sont manquants dans le fichier de diagramme',
  'dataModeling.errors.parseFailedInvalidData':
    'Échec de l’analyse du fichier de diagramme : données de diagramme non valides.',
  'dataModeling.errors.parseFailed':
    'Échec de l’analyse du fichier de diagramme : {message}',
  'dataModeling.errors.fileReadError': 'Erreur de lecture du fichier',
  'dataModeling.errors.fieldRequired': '« {path} » est obligatoire',
  'dataModeling.errors.invalidField': 'Champ « {path} » non valide : {message}',
  'dataModeling.errors.diagramElementNotFound':
    'Élément du diagramme introuvable',
  'dataModeling.errors.connectionNotFound':
    'Impossible de trouver la connexion sélectionnée.',
};

export const es: Catalog = {
  'dataModeling.analysis.sampling': 'Muestreando colecciones…',
  'dataModeling.analysis.analyzing': 'Analizando esquemas de colecciones…',
  'dataModeling.analysis.inferring': 'Infiriendo relaciones entre colecciones…',
  'dataModeling.analysis.preparing': 'Preparando diagrama…',
  'dataModeling.analysis.cancel': 'Cancelar',
  'dataModeling.analysis.description': 'Esto puede tardar unos minutos.',
  'dataModeling.deleted.message': 'Este modelo de datos se ha eliminado.',
  'dataModeling.deleted.back': 'Volver a Modelado de datos',
  'dataModeling.diagramCard.rename': 'Renombrar',
  'dataModeling.diagramCard.delete': 'Eliminar',
  'dataModeling.diagramCard.lastModified': 'Última\u00a0modificación:',
  'dataModeling.list.openExisting': 'Abrir un diagrama existente:',
  'dataModeling.list.generateNew': 'Generar nuevo diagrama',
  'dataModeling.list.searchDiagrams': 'Buscar diagramas',
  'dataModeling.import.button': 'Importar diagrama',
  'dataModeling.import.tooltip':
    'Solo se pueden importar archivos MDM exportados desde Compass o Atlas Data Explorer.',
  'dataModeling.features.visualization.title': 'Visualización rápida',
  'dataModeling.features.visualization.subtitle':
    'Visualiza tus modelos de datos al instante',
  'dataModeling.features.collaboration.title':
    'Colaboración y uso compartido con tu equipo',
  'dataModeling.features.collaboration.subtitle':
    'Colabora y comparte esquemas entre equipos',
  'dataModeling.features.interactive.title':
    'Análisis interactivo de diagramas',
  'dataModeling.features.interactive.subtitle':
    'Explora y anota diagramas interactivos',
  'dataModeling.empty.title': 'Visualiza tu modelo de datos',
  'dataModeling.empty.description':
    'Tu modelo de datos es la base del rendimiento de la aplicación. A medida que las aplicaciones evolucionan, tu esquema también debe hacerlo, de forma inteligente y estratégica. Minimiza la complejidad, evita los cuellos de botella de rendimiento y mantén ágil tu desarrollo.',
  'dataModeling.empty.docs': 'Documentación de modelado de datos',
  'dataModeling.empty.generate': 'Generar diagrama',
  'dataModeling.list.sortName': 'Nombre',
  'dataModeling.list.sortLastModified': 'Última modificación',
  'dataModeling.list.noResults': 'No se encontraron resultados.',
  'dataModeling.list.noResultsDescription':
    'No encontramos ningún diagrama que coincida con tu búsqueda.',
  'dataModeling.settings.inferRelationships':
    'Inferir relaciones automáticamente',
  'dataModeling.settings.inferDescription':
    'El proceso de análisis intentará descubrir automáticamente las relaciones en las colecciones seleccionadas. Esta operación ejecutará varias solicitudes find sobre los campos indexados de las colecciones y',
  'dataModeling.settings.inferDescriptionEmphasis':
    'tardará más tiempo por cada colección analizada.',
  'dataModeling.settings.documentSampling': 'Muestreo de documentos',
  'dataModeling.settings.samplingDescription':
    'De forma predeterminada, los diagramas se generan a partir de una muestra pequeña por colección. Las muestras más grandes mejoran la precisión, pero aumentan el tiempo de análisis y el uso de memoria, mientras que las muestras más pequeñas son más rápidas pero pueden omitir campos o relaciones poco frecuentes.',
  'dataModeling.settings.sampleSize': 'Tamaño de la muestra',
  'dataModeling.settings.documentsPerCollection': 'documentos por colección.',
  'dataModeling.settings.allDocuments': 'Todos los documentos',
  'dataModeling.settings.invalidInput': 'Entrada no válida',
  'dataModeling.settings.warning': 'Advertencia:',
  'dataModeling.settings.warningDescription':
    'Ten en cuenta el tamaño de tu conjunto de datos y los recursos disponibles en tu dispositivo o navegador.',
  'dataModeling.export.title': 'Exportar modelo de datos',
  'dataModeling.export.selectFormat': 'Selecciona el formato de archivo:',
  'dataModeling.export.mdmFile': 'Archivo MDM',
  'dataModeling.export.mdmDescription':
    'Se puede importar en Compass y Data Explorer para que tus compañeros puedan colaborar.',
  'dataModeling.export.pngDescription':
    'Imagen para compartir en documentación o presentaciones.',
  'dataModeling.export.jsonDescription':
    'Datos sin procesar del esquema para uso programático.',
  'dataModeling.export.cancel': 'Cancelar',
  'dataModeling.export.export': 'Exportar',
  'dataModeling.newDiagram.collectionsSelected.one':
    'colección en total seleccionada.',
  'dataModeling.newDiagram.collectionsSelected.other':
    'colecciones en total seleccionadas.',
  'dataModeling.newDiagram.setupTitle': 'Configuración del nuevo diagrama',
  'dataModeling.newDiagram.next': 'Siguiente',
  'dataModeling.newDiagram.cancel': 'Cancelar',
  'dataModeling.newDiagram.back': 'Atrás',
  'dataModeling.newDiagram.generate': 'Generar',
  'dataModeling.newDiagram.selectCollectionsTitle':
    'Selecciona las colecciones de {database}',
  'dataModeling.newDiagram.selectCollectionsDescription':
    'Estas colecciones se incluirán en el diagrama generado.',
  'dataModeling.newDiagram.settingsTitle': 'Configuración del diagrama',
  'dataModeling.setup.noConnections':
    'No tienes ninguna conexión; crea primero una nueva conexión.',
  'dataModeling.setup.noDatabases':
    'No se encontraron bases de datos para la conexión seleccionada.',
  'dataModeling.setup.connection': 'Conexión',
  'dataModeling.setup.selectConnection': 'Selecciona una conexión',
  'dataModeling.setup.database': 'Base de datos',
  'dataModeling.setup.selectDatabase': 'Selecciona una base de datos',
  'dataModeling.setup.diagramName': 'Nombre del diagrama',
  'dataModeling.setup.banner':
    'El diagrama se generará a partir de una muestra de documentos de la base de datos seleccionada. Los cambios realizados en el diagrama no afectarán a tus datos.',
  'dataModeling.collections.fetching': 'Obteniendo colecciones …',
  'dataModeling.collections.search': 'Buscar colecciones',
  'dataModeling.collections.noCollections':
    'Esta base de datos no tiene colecciones.',
  'dataModeling.collections.noMatch':
    'Ninguna colección coincide con tu búsqueda.',
  'dataModeling.collections.name': 'Nombre de la colección',
  'dataModeling.reselect.selectConnectionTitle': 'Selecciona una conexión',
  'dataModeling.reselect.selectConnectionDescription':
    'Para obtener las colecciones de esta base de datos, primero selecciona la base de datos asociada a este modelo de datos y conéctate a ella.',
  'dataModeling.reselect.connect': 'Conectar',
  'dataModeling.toolbar.diagrams': 'diagramas',
  'dataModeling.toolbar.untitled': 'sin título',
  'dataModeling.toolbar.undo': 'Deshacer',
  'dataModeling.toolbar.redo': 'Rehacer',
  'dataModeling.toolbar.addCollection': 'Añadir colección',
  'dataModeling.toolbar.addOrSelectCollections':
    'Añadir o seleccionar colecciones de la base de datos',
  'dataModeling.toolbar.addNewCollection': 'Añadir una nueva colección',
  'dataModeling.toolbar.selectFromDatabase': 'Seleccionar de la base de datos',
  'dataModeling.toolbar.addRelationship': 'Añadir relación',
  'dataModeling.toolbar.exitRelationshipMode':
    'Salir del modo de dibujo de relaciones',
  'dataModeling.toolbar.addRelationshipHint':
    'Añade una relación arrastrando de una colección a otra',
  'dataModeling.toolbar.export': 'Exportar',
  'dataModeling.editor.retry': 'Reintentar',
  'dataModeling.editor.schemaPreview': 'Vista previa del esquema',
  'dataModeling.editor.analysisCanceled': 'Análisis cancelado',
  'dataModeling.editor.analysisFailed': 'Error en el análisis',
  'dataModeling.validation.diagramNameEmpty':
    'El nombre del diagrama no puede estar vacío.',
  'dataModeling.validation.collectionNameEmpty':
    'El nombre de la colección no puede estar vacío.',
  'dataModeling.validation.diagramNameUnique':
    'El nombre del diagrama debe ser único.',
  'dataModeling.validation.collectionNameUnique':
    'El nombre de la colección debe ser único.',
  'dataModeling.drawer.collectionConfiguration':
    'Configuración de la colección',
  'dataModeling.drawer.deleteCollection': 'Eliminar colección',
  'dataModeling.drawer.relationshipConfiguration':
    'Configuración de la relación',
  'dataModeling.drawer.delete': 'Eliminar',
  'dataModeling.drawer.fieldConfiguration': 'Configuración del campo',
  'dataModeling.drawer.deleteField': 'Eliminar campo',
  'dataModeling.drawer.overview': 'Resumen del modelo de datos',
  'dataModeling.overview.model': 'Modelo',
  'dataModeling.overview.generated': 'Generado',
  'dataModeling.overview.from': 'Desde',
  'dataModeling.overview.at': 'El',
  'dataModeling.overview.lastUpdated': 'Última actualización',
  'dataModeling.overview.sampleInfo':
    'Este diagrama se generó a partir de una muestra de documentos. Los cambios realizados en el diagrama no afectarán a tus datos.',
  'dataModeling.collectionDrawer.properties': 'Propiedades de la colección',
  'dataModeling.collectionDrawer.name': 'Nombre',
  'dataModeling.collectionDrawer.noRelationships':
    'Esta colección aún no tiene relaciones.',
  'dataModeling.collectionDrawer.notes': 'Notas',
  'dataModeling.relationships.title': 'Relaciones',
  'dataModeling.relationships.add': 'Añadir relación',
  'dataModeling.relationships.cannotResolve':
    'No se puede resolver la relación: verifica los campos vinculados y el espacio de nombres.',
  'dataModeling.relationships.edit': 'Editar relación',
  'dataModeling.relationships.delete': 'Eliminar relación',
  'dataModeling.field.nameEmpty': 'El nombre del campo no puede estar vacío.',
  'dataModeling.field.alreadyExists': 'El campo ya existe.',
  'dataModeling.field.typeRequired': 'El campo debe tener un tipo.',
  'dataModeling.field.properties': 'Propiedades del campo',
  'dataModeling.field.name': 'Nombre del campo',
  'dataModeling.field.datatype': 'Tipo de datos',
  'dataModeling.field.noRelationships': 'Este campo aún no tiene relaciones.',
  'dataModeling.relationship.cardinalityOne': 'Uno',
  'dataModeling.relationship.cardinalityMany': 'Muchos',
  'dataModeling.relationship.properties': 'Propiedades de la relación',
  'dataModeling.relationship.localCollection': 'Colección local',
  'dataModeling.relationship.localField': 'Campo local',
  'dataModeling.relationship.localCardinality': 'Cardinalidad local',
  'dataModeling.relationship.foreignCollection': 'Colección externa',
  'dataModeling.relationship.foreignField': 'Campo externo',
  'dataModeling.relationship.foreignCardinality': 'Cardinalidad externa',
  'dataModeling.relationship.cardinalityInfo':
    'La cardinalidad de la relación puede indicar si conviene incrustar o referenciar.',
  'dataModeling.relationship.learnMore': 'Más información',
  'dataModeling.nodes.unresolvedRelationships':
    'No se pueden resolver una o más relaciones.',
  'dataModeling.errors.couldNotApplyChanges':
    'No se pudieron aplicar los cambios',
  'dataModeling.errors.applyChangesFailed':
    'Algo salió mal al aplicar los cambios.',
  'dataModeling.errors.openDiagram': 'Error al abrir el diagrama',
  'dataModeling.confirm.deleteTitle':
    '¿Seguro que quieres eliminar este diagrama?',
  'dataModeling.confirm.deleteDescription': 'Esta acción no se puede deshacer.',
  'dataModeling.rename.title': 'Renombrar diagrama',
  'dataModeling.rename.label': 'Nombre',
  'dataModeling.export.failedTitle': 'Error al exportar',
  'dataModeling.export.failedDescription':
    'Se produjo un error al exportar el diagrama: {message}',
  'dataModeling.errors.diagramNameExists':
    'Ya existe un diagrama con este nombre.',
  'dataModeling.errors.connectionFailed': 'Error de conexión.',
  'dataModeling.errors.databaseNotFound':
    'La base de datos seleccionada no existe en esta conexión.',
  'dataModeling.errors.invalidFileContents': 'Contenido de archivo no válido',
  'dataModeling.errors.unsupportedFileFormat':
    'Formato de archivo de diagrama no compatible',
  'dataModeling.errors.missingRequiredFields':
    'Faltan campos obligatorios en el archivo del diagrama',
  'dataModeling.errors.parseFailedInvalidData':
    'No se pudo analizar el archivo del diagrama: datos de diagrama no válidos.',
  'dataModeling.errors.parseFailed':
    'No se pudo analizar el archivo del diagrama: {message}',
  'dataModeling.errors.fileReadError': 'Error al leer el archivo',
  'dataModeling.errors.fieldRequired': '«{path}» es obligatorio',
  'dataModeling.errors.invalidField': 'Campo «{path}» no válido: {message}',
  'dataModeling.errors.diagramElementNotFound':
    'Elemento del diagrama no encontrado',
  'dataModeling.errors.connectionNotFound':
    'No se encuentra la conexión seleccionada.',
};
