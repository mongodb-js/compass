import type { Catalog } from './translations';

// Texts of the compass-collection and compass-schema-validation packages. See
// ./translations.ts for the key conventions.

export const de: Catalog = {
  'collection.badges.readOnly': 'SCHREIBGESCHÜTZT',
  'collection.badges.timeSeriesCollection': 'Time-Series-Collection',
  'collection.badges.timeSeries': 'TIME-SERIES',
  'collection.badges.viewTitle': 'View',
  'collection.badges.view': 'VIEW',
  'collection.badges.clustered': 'CLUSTERED',
  'collection.headerActions.openShell': 'MongoDB-Shell öffnen',
  'collection.headerActions.viewMonitoring': 'Überwachung anzeigen',
  'collection.headerActions.visualize': 'Daten visualisieren',
  'collection.headerActions.editPipeline': 'Pipeline bearbeiten',
  'collection.headerActions.returnToView': 'Zurück zur View',
  'collection.pluginTitle.connection': 'Verbindung',
  'collection.pluginTitle.database': 'Datenbank',
  'collection.pluginTitle.view': 'View',
  'collection.pluginTitle.derivedFrom': 'Abgeleitet von',
  'collection.pluginTitle.collection': 'Collection',
  'collection.tab.tabsAriaLabel': 'Collection-Tabs',
  'collection.tab.menu.collection': '&Collection',
  'collection.tab.menu.shareSchema': '&Schema als JSON teilen (veraltet)',
  'collection.tab.menu.importData': 'Daten &importieren',
  'collection.tab.menu.exportCollection': 'Collection &exportieren',
  'collection.mockData.modalTitle': 'Mock-Daten-Skript mit KI generieren',
  'collection.mockData.back': 'Zurück',
  'collection.mockData.cancel': 'Abbrechen',
  'collection.mockData.confirm': 'Bestätigen',
  'collection.mockData.generateScript': 'Skript generieren',
  'collection.mockData.done': 'Fertig',
  'collection.mockData.generatingMappings':
    'Mock-Daten-Zuordnungen werden generiert...',
  'collection.mockData.analysisFailed': 'Schemaanalyse fehlgeschlagen',
  'collection.mockData.noDocuments':
    'In der Collection wurden keine Dokumente zur Analyse gefunden.',
  'collection.mockData.insertDocuments':
    'Füge Dokumente in diese Collection ein oder importiere welche und versuche es dann erneut.',
  'collection.mockData.retry': 'Erneut versuchen',
  'collection.mockData.analyzingCollection': 'Collection wird analysiert...',
  'collection.mockData.confirmIntro':
    'Wir verwenden das erkannte Schema und KI, um ein Mock-Daten-Skript für deine Collection zu generieren. Du kannst das Skript und seine',
  'collection.mockData.fakerFunctions': 'Faker-Funktionen',
  'collection.mockData.confirmOutro':
    'anpassen, bevor du es ausführst, und/oder es für deine anderen Cluster und Collections wiederverwenden.',
  'collection.mockData.enableSampleValues':
    'Senden von Beispielfeldwerten aktivieren',
  'collection.mockData.enableSampleValuesAtlas':
    'Um die Qualität der Mock-Daten zu verbessern, können Projektbesitzer das Senden von Beispielfeldwerten an das KI-Modell aktivieren. Lade den Data Explorer neu, damit die Änderungen wirksam werden.',
  'collection.mockData.enableSampleValuesDesktop':
    'Um die Qualität der Mock-Daten zu verbessern, aktiviere das Senden von Beispielfeldwerten unter Einstellungen → Künstliche Intelligenz.',
  'collection.mockData.projectSettings': 'Projekteinstellungen',
  'collection.mockData.openSettings': 'Einstellungen öffnen',
  'collection.mockData.llmFailed':
    'Die LLM-Anfrage ist fehlgeschlagen. Bitte bestätige erneut.',
  'collection.mockData.countRequired': 'Die Dokumentanzahl ist erforderlich',
  'collection.mockData.countInvalid': 'Bitte gib eine gültige Zahl ein',
  'collection.mockData.countWhole': 'Bitte gib eine ganze Zahl ein',
  'collection.mockData.countRange':
    'Die Dokumentanzahl muss zwischen 1 und {max} liegen',
  'collection.mockData.notAvailable': 'Nicht verfügbar',
  'collection.mockData.specifyCount':
    'Anzahl der zu generierenden Dokumente festlegen',
  'collection.mockData.indicateCount':
    'Gib unten an, wie viele Dokumente generiert werden sollen.',
  'collection.mockData.documentsToGenerate':
    'Zu generierende Dokumente in der aktuellen Collection',
  'collection.mockData.estimatedDiskSize': 'Geschätzte Festplattengröße',
  'collection.mockData.previewTitle': 'Mock-Daten-Vorschau',
  'collection.mockData.previewIntro':
    'Unten siehst du Beispiele für Dokumente, die beim Ausführen deines Skripts generiert werden. Wenn du Änderungen am Skript vornehmen möchtest (z. B. welche',
  'collection.mockData.fakerFunctionsLower': 'Faker-Funktionen',
  'collection.mockData.previewOutro':
    'zur Generierung der Dokumente verwendet werden), kannst du das im nächsten Schritt tun.',
  'collection.mockData.noFakerSchema':
    'Es ist kein Faker-Schema verfügbar. Gehe zurück und bestätige dein Schema.',
  'collection.mockData.fakerSchemaUnavailable': 'Faker-Schema nicht verfügbar',
  'collection.mockData.scriptIntro':
    'Wir haben das folgende Skript für dich erstellt. Du kannst es bearbeiten, um Mock-Daten für eine beliebige Collection zu generieren.',
  'collection.mockData.scriptFailed': 'Skriptgenerierung fehlgeschlagen:',
  'collection.mockData.scriptFailedHint':
    'Gehe zurück zum Startbildschirm und übermittle das Collection-Schema erneut.',
  'collection.mockData.prerequisites': 'Voraussetzungen',
  'collection.mockData.prerequisitesIntro':
    'Um das generierte Skript auszuführen, musst du:',
  'collection.mockData.install': 'Installiere',
  'collection.mockData.mongoshVersion': '(Version 2.5 oder höher)',
  'collection.mockData.step1Title':
    '1. Erstelle eine .js-Datei mit folgendem Skript',
  'collection.mockData.step1Before':
    'Erstelle im Verzeichnis, das du angelegt hast, eine Datei namens',
  'collection.mockData.step1After':
    '(oder einen beliebigen anderen Namen). Ändere DB_NAME und COLL_NAME im folgenden Skript auf die Datenbank oder Collection, der du Mock-Daten hinzufügen möchtest.',
  'collection.mockData.scriptFailedComment':
    '// Skriptgenerierung fehlgeschlagen.',
  'collection.mockData.step2Title': '2. Führe das Skript aus mit',
  'collection.mockData.step2Instruction':
    'Führe im selben Arbeitsverzeichnis den folgenden Befehl aus.',
  'collection.mockData.replaceUsername':
    'Ersetze <your-username> durch deinen Datenbank-Benutzernamen.',
  'collection.mockData.promptsPassword':
    'mongosh fragt dich nach deinem Passwort.',
  'collection.mockData.irreversible':
    'Beachte, dass dadurch Daten zu deinem Cluster hinzugefügt werden und dies nicht rückgängig gemacht werden kann.',
  'collection.mockData.troubleConnecting':
    'Falls Probleme bei der Verbindung auftreten, lies die',
  'collection.mockData.connectionGuide': 'mongosh-Verbindungsanleitung',
  'collection.mockData.resources': 'Ressourcen',
  'collection.mockData.syntheticData':
    'Synthetische Daten mit MongoDB generieren',
  'collection.mockData.learnShell': 'Mehr über die MongoDB-Shell erfahren',
  'collection.mockData.databaseUsers': 'Auf deine Datenbankbenutzer zugreifen',
  'schemaValidation.pluginTitle.validation': 'Validierung',
  'schemaValidation.documentPreview.noPreview': 'Keine Vorschaudokumente',
  'schemaValidation.sampleDocuments.previewTitle':
    'Vorschau von Beispieldokumenten',
  'schemaValidation.sampleDocuments.previewDescription':
    'Dieser Bereich zeigt ein Dokument, das die Validierung bestanden hat, und eines, das sie nicht bestanden hat.',
  'schemaValidation.sampleDocuments.previewButton': 'Dokumente anzeigen',
  'schemaValidation.sampleDocuments.passed': 'Validierung bestanden',
  'schemaValidation.sampleDocuments.failed': 'Validierung nicht bestanden',
  'schemaValidation.selectors.action': 'Aktion',
  'schemaValidation.selectors.actionInfo':
    'Weitere Informationen zu Validierungsaktionen',
  'schemaValidation.selectors.warning': 'Warnung',
  'schemaValidation.selectors.error': 'Fehler',
  'schemaValidation.selectors.errorAndLog': 'Fehler und Protokoll',
  'schemaValidation.selectors.level': 'Stufe',
  'schemaValidation.selectors.levelInfo':
    'Weitere Informationen zu Validierungsstufen',
  'schemaValidation.selectors.off': 'Aus',
  'schemaValidation.selectors.moderate': 'Moderat',
  'schemaValidation.selectors.strict': 'Streng',
  'schemaValidation.selectors.constraint': 'Constraint',
  'schemaValidation.editor.applyConfirmTitle':
    'Möchtest du diese Validierungsregeln wirklich anwenden?',
  'schemaValidation.editor.applyConfirmDescription':
    'Diese Regeln werden bei Updates und Inserts deiner Dokumente erzwungen. Bitte prüfe die Regeln, bevor du sie anwendest.',
  'schemaValidation.editor.generateRules': 'Regeln generieren',
  'schemaValidation.editor.clearBeforeGenerating':
    'Bestehende Regeln löschen, bevor neue generiert werden',
  'schemaValidation.editor.modified':
    'Die Regeln wurden geändert, aber nicht angewendet. Bitte prüfe sie vor dem Anwenden.',
  'schemaValidation.editor.generated':
    'Regeln generiert. Bitte prüfe sie vor dem Anwenden.',
  'schemaValidation.editor.cancel': 'Abbrechen',
  'schemaValidation.editor.updating': 'Validierung wird aktualisiert…',
  'schemaValidation.editor.apply': 'Anwenden',
  'schemaValidation.editor.editRules': 'Regeln bearbeiten',
  'schemaValidation.states.timeSeries':
    'Schemavalidierung für Time-Series-Collections wird nicht unterstützt.',
  'schemaValidation.states.readOnlyView':
    'Schemavalidierung für schreibgeschützte Views wird nicht unterstützt.',
  'schemaValidation.states.secondaryNode':
    'Diese Aktion ist auf einem sekundären Knoten nicht verfügbar.',
  'schemaValidation.states.constraintActive':
    'Diese Collection verwendet die Validierungsstufe „constraint“, die garantiert, dass jedes Dokument dem Validator entspricht. Die Regeln können nicht geändert werden, solange sie aktiv ist.',
  'schemaValidation.states.constraintPrepared':
    'Diese Collection ist für ein Upgrade auf die Validierungsstufe „constraint“ vorbereitet. Die Regeln können nicht geändert werden, bis das Upgrade abgeschlossen ist oder der vorbereitete Zustand durch Ausführen von collMod mit prepareConstraintValidationLevel: false aufgehoben wird.',
  'schemaValidation.states.oldServer':
    'Compass unterstützt den visuellen Regel-Builder für Serverversionen unter 3.2 nicht mehr. Um den visuellen Regel-Builder zu nutzen, führe bitte ein',
  'schemaValidation.states.upgrade': 'Upgrade auf MongoDB 3.2 durch.',
  'schemaValidation.states.generating': 'Regeln werden generiert',
  'schemaValidation.states.stop': 'Stopp',
  'schemaValidation.states.timeout':
    'Der Vorgang hat das Zeitlimit überschritten. Erhöhe versuchsweise maxTimeMS in den Compass-Einstellungen.',
  'schemaValidation.states.generationError':
    'Bei der Regelgenerierung ist ein Fehler aufgetreten',
  'schemaValidation.states.loading': 'Validierung wird geladen',
  'schemaValidation.states.createTitle': 'Validierungsregeln erstellen',
  'schemaValidation.states.createSubtitle':
    'Generiere Regeln per Schemaanalyse aus vorhandenen Beispieldaten oder füge sie manuell hinzu, um die Dokumentstruktur bei Updates und Inserts zu erzwingen',
  'schemaValidation.states.generate': 'Regeln generieren',
  'schemaValidation.states.addRule': 'Regel hinzufügen',
  'schemaValidation.states.learnMore': 'Mehr über Validierungen erfahren',
  'schemaValidation.toast.applied': 'Neue Validierungsregeln angewendet',
  'schemaValidation.validatorMustBeObject':
    'Der Validator muss ein Objekt sein.',
  'collection.mockData.unsupportedFieldNameSeparator':
    "Die Funktion wird für Feldnamen, die ein '{separator}' enthalten, nicht unterstützt; Feldname: '{fieldName}'",
  'collection.mockData.unsupportedFieldNameArraySuffix':
    "Die Funktion wird für Feldnamen, die auf '[]' enden, nicht unterstützt; Feldname: '{fieldName}'",
  'collection.mockData.nestingDepthExceeded':
    'Die Verschachtelungstiefe des Schemas ({depth}) überschreitet die maximal unterstützte Tiefe von {maxDepth}.',
};

export const fr: Catalog = {
  'collection.badges.readOnly': 'LECTURE SEULE',
  'collection.badges.timeSeriesCollection': 'Collection de séries temporelles',
  'collection.badges.timeSeries': 'SÉRIES TEMPORELLES',
  'collection.badges.viewTitle': 'Vue',
  'collection.badges.view': 'VUE',
  'collection.badges.clustered': 'CLUSTERISÉE',
  'collection.headerActions.openShell': 'Ouvrir le shell MongoDB',
  'collection.headerActions.viewMonitoring': 'Afficher la surveillance',
  'collection.headerActions.visualize': 'Visualiser vos données',
  'collection.headerActions.editPipeline': 'Modifier le pipeline',
  'collection.headerActions.returnToView': 'Retour à la vue',
  'collection.pluginTitle.connection': 'Connexion',
  'collection.pluginTitle.database': 'Base de données',
  'collection.pluginTitle.view': 'Vue',
  'collection.pluginTitle.derivedFrom': 'Dérivée de',
  'collection.pluginTitle.collection': 'Collection',
  'collection.tab.tabsAriaLabel': 'Onglets de la collection',
  'collection.tab.menu.collection': '&Collection',
  'collection.tab.menu.shareSchema':
    '&Partager le schéma au format JSON (ancien)',
  'collection.tab.menu.importData': '&Importer des données',
  'collection.tab.menu.exportCollection': '&Exporter la collection',
  'collection.mockData.modalTitle':
    'Générer un script de données fictives avec l’IA',
  'collection.mockData.back': 'Retour',
  'collection.mockData.cancel': 'Annuler',
  'collection.mockData.confirm': 'Confirmer',
  'collection.mockData.generateScript': 'Générer le script',
  'collection.mockData.done': 'Terminé',
  'collection.mockData.generatingMappings':
    'Génération des correspondances de données fictives...',
  'collection.mockData.analysisFailed': 'Échec de l’analyse du schéma',
  'collection.mockData.noDocuments':
    'Aucun document à analyser n’a été trouvé dans la collection.',
  'collection.mockData.insertDocuments':
    'Insérez ou importez des documents dans cette collection, puis réessayez.',
  'collection.mockData.retry': 'Réessayer',
  'collection.mockData.analyzingCollection': 'Analyse de la collection...',
  'collection.mockData.confirmIntro':
    'Nous utiliserons le schéma identifié et l’IA pour générer un script de données fictives pour votre collection. Vous pouvez personnaliser le script et ses',
  'collection.mockData.fakerFunctions': 'fonctions Faker',
  'collection.mockData.confirmOutro':
    'avant de l’exécuter et/ou le réutiliser pour vos autres clusters et collections.',
  'collection.mockData.enableSampleValues':
    'Activer l’envoi de valeurs de champs d’exemple',
  'collection.mockData.enableSampleValuesAtlas':
    'Pour améliorer la qualité des données fictives, les propriétaires du projet peuvent activer l’envoi de valeurs de champs d’exemple au modèle d’IA. Actualisez Data Explorer pour que les modifications prennent effet.',
  'collection.mockData.enableSampleValuesDesktop':
    'Pour améliorer la qualité des données fictives, activez l’envoi de valeurs de champs d’exemple dans Paramètres → Intelligence artificielle.',
  'collection.mockData.projectSettings': 'Paramètres du projet',
  'collection.mockData.openSettings': 'Ouvrir les paramètres',
  'collection.mockData.llmFailed':
    'La requête au LLM a échoué. Veuillez confirmer à nouveau.',
  'collection.mockData.countRequired': 'Le nombre de documents est obligatoire',
  'collection.mockData.countInvalid': 'Veuillez saisir un nombre valide',
  'collection.mockData.countWhole': 'Veuillez saisir un nombre entier',
  'collection.mockData.countRange':
    'Le nombre de documents doit être compris entre 1 et {max}',
  'collection.mockData.notAvailable': 'Non disponible',
  'collection.mockData.specifyCount':
    'Indiquer le nombre de documents à générer',
  'collection.mockData.indicateCount':
    'Indiquez ci-dessous le nombre de documents que vous souhaitez générer.',
  'collection.mockData.documentsToGenerate':
    'Documents à générer dans la collection actuelle',
  'collection.mockData.estimatedDiskSize': 'Taille estimée sur le disque',
  'collection.mockData.previewTitle': 'Aperçu des données fictives',
  'collection.mockData.previewIntro':
    'Voici des exemples de documents qui seront générés lors de l’exécution de votre script. Si vous souhaitez modifier le script (par ex. pour choisir quelles',
  'collection.mockData.fakerFunctionsLower': 'fonctions Faker',
  'collection.mockData.previewOutro':
    'sont utilisées pour générer les documents), vous pouvez le faire à l’étape suivante.',
  'collection.mockData.noFakerSchema':
    'Aucun schéma Faker disponible. Veuillez revenir en arrière et confirmer votre schéma.',
  'collection.mockData.fakerSchemaUnavailable': 'Schéma Faker non disponible',
  'collection.mockData.scriptIntro':
    'Nous avons créé le script suivant pour vous. Vous pouvez le modifier pour générer des données fictives pour n’importe quelle collection.',
  'collection.mockData.scriptFailed': 'Échec de la génération du script :',
  'collection.mockData.scriptFailedHint':
    'Veuillez revenir à l’écran de démarrage pour soumettre à nouveau le schéma de la collection.',
  'collection.mockData.prerequisites': 'Prérequis',
  'collection.mockData.prerequisitesIntro':
    'Pour exécuter le script généré, vous devez :',
  'collection.mockData.install': 'Installer',
  'collection.mockData.mongoshVersion': '(version 2.5 ou ultérieure)',
  'collection.mockData.step1Title':
    '1. Créez un fichier .js avec le script suivant',
  'collection.mockData.step1Before':
    'Dans le répertoire que vous avez créé, créez un fichier nommé',
  'collection.mockData.step1After':
    '(ou tout autre nom de votre choix). Remplacez DB_NAME et COLL_NAME dans le script ci-dessous par la base de données ou la collection à laquelle vous souhaitez ajouter des données fictives.',
  'collection.mockData.scriptFailedComment':
    '// Échec de la génération du script.',
  'collection.mockData.step2Title': '2. Exécutez le script avec',
  'collection.mockData.step2Instruction':
    'Dans le même répertoire de travail, exécutez la commande ci-dessous.',
  'collection.mockData.replaceUsername':
    'Veuillez remplacer <your-username> par votre nom d’utilisateur de base de données.',
  'collection.mockData.promptsPassword':
    'mongosh vous demandera votre mot de passe.',
  'collection.mockData.irreversible':
    'Notez que cela ajoutera des données à votre cluster et que cette action n’est pas réversible.',
  'collection.mockData.troubleConnecting':
    'Si vous rencontrez des difficultés de connexion, consultez le',
  'collection.mockData.connectionGuide': 'guide de connexion mongosh',
  'collection.mockData.resources': 'Ressources',
  'collection.mockData.syntheticData':
    'Générer des données synthétiques avec MongoDB',
  'collection.mockData.learnShell': 'En savoir plus sur le shell MongoDB',
  'collection.mockData.databaseUsers':
    'Accéder à vos utilisateurs de base de données',
  'schemaValidation.pluginTitle.validation': 'Validation',
  'schemaValidation.documentPreview.noPreview': 'Aucun document d’aperçu',
  'schemaValidation.sampleDocuments.previewTitle':
    'Aperçu de documents d’exemple',
  'schemaValidation.sampleDocuments.previewDescription':
    'Cette section affiche un document ayant réussi la validation et un document l’ayant échouée.',
  'schemaValidation.sampleDocuments.previewButton': 'Afficher les documents',
  'schemaValidation.sampleDocuments.passed': 'Validation réussie',
  'schemaValidation.sampleDocuments.failed': 'Validation échouée',
  'schemaValidation.selectors.action': 'Action',
  'schemaValidation.selectors.actionInfo':
    'Plus d’informations sur les actions de validation',
  'schemaValidation.selectors.warning': 'Avertissement',
  'schemaValidation.selectors.error': 'Erreur',
  'schemaValidation.selectors.errorAndLog': 'Erreur et journal',
  'schemaValidation.selectors.level': 'Niveau',
  'schemaValidation.selectors.levelInfo':
    'Plus d’informations sur les niveaux de validation',
  'schemaValidation.selectors.off': 'Désactivé',
  'schemaValidation.selectors.moderate': 'Modéré',
  'schemaValidation.selectors.strict': 'Strict',
  'schemaValidation.selectors.constraint': 'Contrainte',
  'schemaValidation.editor.applyConfirmTitle':
    'Voulez-vous vraiment appliquer ces règles de validation ?',
  'schemaValidation.editor.applyConfirmDescription':
    'Ces règles seront appliquées lors des mises à jour et des insertions de vos documents. Veuillez les vérifier avant de les appliquer.',
  'schemaValidation.editor.generateRules': 'Générer les règles',
  'schemaValidation.editor.clearBeforeGenerating':
    'Supprimez les règles existantes avant d’en générer de nouvelles',
  'schemaValidation.editor.modified':
    'Les règles ont été modifiées mais ne sont pas appliquées. Veuillez les vérifier avant de les appliquer.',
  'schemaValidation.editor.generated':
    'Règles générées. Veuillez les vérifier avant de les appliquer.',
  'schemaValidation.editor.cancel': 'Annuler',
  'schemaValidation.editor.updating': 'Mise à jour de la validation…',
  'schemaValidation.editor.apply': 'Appliquer',
  'schemaValidation.editor.editRules': 'Modifier les règles',
  'schemaValidation.states.timeSeries':
    'La validation de schéma n’est pas prise en charge pour les collections de séries temporelles.',
  'schemaValidation.states.readOnlyView':
    'La validation de schéma n’est pas prise en charge pour les vues en lecture seule.',
  'schemaValidation.states.secondaryNode':
    'Cette action n’est pas disponible sur un nœud secondaire.',
  'schemaValidation.states.constraintActive':
    'Cette collection utilise le niveau de validation « constraint », qui garantit que chaque document correspond au validateur. Les règles ne peuvent pas être modifiées tant qu’il est actif.',
  'schemaValidation.states.constraintPrepared':
    'Cette collection est préparée pour une mise à niveau vers le niveau de validation « constraint ». Les règles ne peuvent pas être modifiées tant que la mise à niveau n’est pas terminée ou que l’état préparé n’est pas supprimé en exécutant collMod avec prepareConstraintValidationLevel: false.',
  'schemaValidation.states.oldServer':
    'Compass ne prend plus en charge le constructeur de règles visuel pour les versions de serveur antérieures à 3.2. Pour utiliser le constructeur de règles visuel, veuillez',
  'schemaValidation.states.upgrade': 'passer à MongoDB 3.2.',
  'schemaValidation.states.generating': 'Génération des règles',
  'schemaValidation.states.stop': 'Arrêter',
  'schemaValidation.states.timeout':
    'L’opération a dépassé le délai imparti. Essayez d’augmenter maxTimeMS dans les paramètres de Compass.',
  'schemaValidation.states.generationError':
    'Une erreur s’est produite lors de la génération des règles',
  'schemaValidation.states.loading': 'Chargement de la validation',
  'schemaValidation.states.createTitle': 'Créer des règles de validation',
  'schemaValidation.states.createSubtitle':
    'Générez des règles par analyse de schéma à partir de données d’exemple existantes ou ajoutez-les manuellement pour imposer la structure des documents lors des mises à jour et des insertions',
  'schemaValidation.states.generate': 'Générer les règles',
  'schemaValidation.states.addRule': 'Ajouter une règle',
  'schemaValidation.states.learnMore': 'En savoir plus sur les validations',
  'schemaValidation.toast.applied': 'Nouvelles règles de validation appliquées',
  'schemaValidation.validatorMustBeObject': 'Le validateur doit être un objet.',
  'collection.mockData.unsupportedFieldNameSeparator':
    "La fonctionnalité n'est pas prise en charge pour les noms de champ contenant un « {separator} » ; nom du champ : « {fieldName} »",
  'collection.mockData.unsupportedFieldNameArraySuffix':
    "La fonctionnalité n'est pas prise en charge pour les noms de champ se terminant par « [] » ; nom du champ : « {fieldName} »",
  'collection.mockData.nestingDepthExceeded':
    "La profondeur d'imbrication du schéma ({depth}) dépasse la profondeur maximale prise en charge de {maxDepth}.",
};

export const es: Catalog = {
  'collection.badges.readOnly': 'SOLO LECTURA',
  'collection.badges.timeSeriesCollection': 'Colección de series temporales',
  'collection.badges.timeSeries': 'SERIES TEMPORALES',
  'collection.badges.viewTitle': 'Vista',
  'collection.badges.view': 'VISTA',
  'collection.badges.clustered': 'CON CLÚSTER',
  'collection.headerActions.openShell': 'Abrir shell de MongoDB',
  'collection.headerActions.viewMonitoring': 'Ver monitorización',
  'collection.headerActions.visualize': 'Visualizar tus datos',
  'collection.headerActions.editPipeline': 'Editar pipeline',
  'collection.headerActions.returnToView': 'Volver a la vista',
  'collection.pluginTitle.connection': 'Conexión',
  'collection.pluginTitle.database': 'Base de datos',
  'collection.pluginTitle.view': 'Vista',
  'collection.pluginTitle.derivedFrom': 'Derivada de',
  'collection.pluginTitle.collection': 'Colección',
  'collection.tab.tabsAriaLabel': 'Pestañas de la colección',
  'collection.tab.menu.collection': '&Colección',
  'collection.tab.menu.shareSchema': '&Compartir esquema como JSON (heredado)',
  'collection.tab.menu.importData': '&Importar datos',
  'collection.tab.menu.exportCollection': '&Exportar colección',
  'collection.mockData.modalTitle': 'Generar script de datos de prueba con IA',
  'collection.mockData.back': 'Atrás',
  'collection.mockData.cancel': 'Cancelar',
  'collection.mockData.confirm': 'Confirmar',
  'collection.mockData.generateScript': 'Generar script',
  'collection.mockData.done': 'Hecho',
  'collection.mockData.generatingMappings':
    'Generando asignaciones de datos de prueba...',
  'collection.mockData.analysisFailed': 'Error en el análisis del esquema',
  'collection.mockData.noDocuments':
    'No se encontraron documentos para analizar en la colección.',
  'collection.mockData.insertDocuments':
    'Inserta o importa algunos documentos en esta colección y vuelve a intentarlo.',
  'collection.mockData.retry': 'Reintentar',
  'collection.mockData.analyzingCollection': 'Analizando colección...',
  'collection.mockData.confirmIntro':
    'Usaremos el esquema identificado y la IA para generar un script de datos de prueba para tu colección. Puedes personalizar el script y sus',
  'collection.mockData.fakerFunctions': 'funciones de Faker',
  'collection.mockData.confirmOutro':
    'antes de ejecutarlo y/o reutilizarlo en tus otros clústeres y colecciones.',
  'collection.mockData.enableSampleValues':
    'Habilitar el envío de valores de campo de ejemplo',
  'collection.mockData.enableSampleValuesAtlas':
    'Para mejorar la calidad de los datos de prueba, los propietarios del proyecto pueden habilitar el envío de valores de campo de ejemplo al modelo de IA. Actualiza Data Explorer para que los cambios surtan efecto.',
  'collection.mockData.enableSampleValuesDesktop':
    'Para mejorar la calidad de los datos de prueba, habilita el envío de valores de campo de ejemplo en Ajustes → Inteligencia artificial.',
  'collection.mockData.projectSettings': 'Ajustes del proyecto',
  'collection.mockData.openSettings': 'Abrir ajustes',
  'collection.mockData.llmFailed':
    'Falló la solicitud al LLM. Confirma de nuevo.',
  'collection.mockData.countRequired': 'El número de documentos es obligatorio',
  'collection.mockData.countInvalid': 'Introduce un número válido',
  'collection.mockData.countWhole': 'Introduce un número entero',
  'collection.mockData.countRange':
    'El número de documentos debe estar entre 1 y {max}',
  'collection.mockData.notAvailable': 'No disponible',
  'collection.mockData.specifyCount':
    'Especifica el número de documentos que generar',
  'collection.mockData.indicateCount':
    'Indica a continuación la cantidad de documentos que quieres generar.',
  'collection.mockData.documentsToGenerate':
    'Documentos que generar en la colección actual',
  'collection.mockData.estimatedDiskSize': 'Tamaño estimado en disco',
  'collection.mockData.previewTitle': 'Vista previa de los datos de prueba',
  'collection.mockData.previewIntro':
    'A continuación se muestran ejemplos de los documentos que se generarán al ejecutar tu script. Si quieres hacer cambios en el script (por ejemplo, qué',
  'collection.mockData.fakerFunctionsLower': 'funciones de Faker',
  'collection.mockData.previewOutro':
    'se usan para generar los documentos), puedes hacerlo en el siguiente paso.',
  'collection.mockData.noFakerSchema':
    'No hay ningún esquema de Faker disponible. Vuelve atrás y confirma tu esquema.',
  'collection.mockData.fakerSchemaUnavailable':
    'Esquema de Faker no disponible',
  'collection.mockData.scriptIntro':
    'Hemos creado el siguiente script para ti. Puedes editarlo para generar datos de prueba para cualquier colección que especifiques.',
  'collection.mockData.scriptFailed': 'Error al generar el script:',
  'collection.mockData.scriptFailedHint':
    'Vuelve a la pantalla de inicio para enviar de nuevo el esquema de la colección.',
  'collection.mockData.prerequisites': 'Requisitos previos',
  'collection.mockData.prerequisitesIntro':
    'Para ejecutar el script generado, debes:',
  'collection.mockData.install': 'Instalar',
  'collection.mockData.mongoshVersion': '(versión 2.5 o posterior)',
  'collection.mockData.step1Title':
    '1. Crea un archivo .js con el siguiente script',
  'collection.mockData.step1Before':
    'En el directorio que creaste, crea un archivo llamado',
  'collection.mockData.step1After':
    '(o con el nombre que prefieras). Cambia DB_NAME y COLL_NAME en el siguiente script por la base de datos o colección a la que quieras añadir datos de prueba.',
  'collection.mockData.scriptFailedComment': '// Error al generar el script.',
  'collection.mockData.step2Title': '2. Ejecuta el script con',
  'collection.mockData.step2Instruction':
    'En el mismo directorio de trabajo, ejecuta el siguiente comando.',
  'collection.mockData.replaceUsername':
    'Sustituye <your-username> por tu nombre de usuario de la base de datos.',
  'collection.mockData.promptsPassword': 'mongosh te pedirá tu contraseña.',
  'collection.mockData.irreversible':
    'Ten en cuenta que esto añadirá datos a tu clúster y no se podrá revertir.',
  'collection.mockData.troubleConnecting':
    'Si tienes problemas para conectarte, consulta la',
  'collection.mockData.connectionGuide': 'guía de conexión de mongosh',
  'collection.mockData.resources': 'Recursos',
  'collection.mockData.syntheticData': 'Generar datos sintéticos con MongoDB',
  'collection.mockData.learnShell': 'Más información sobre el shell de MongoDB',
  'collection.mockData.databaseUsers':
    'Acceder a tus usuarios de base de datos',
  'schemaValidation.pluginTitle.validation': 'Validación',
  'schemaValidation.documentPreview.noPreview':
    'No hay documentos de vista previa',
  'schemaValidation.sampleDocuments.previewTitle':
    'Vista previa de documentos de ejemplo',
  'schemaValidation.sampleDocuments.previewDescription':
    'Esta sección muestra un documento que superó la validación y otro que no la superó.',
  'schemaValidation.sampleDocuments.previewButton': 'Previsualizar documentos',
  'schemaValidation.sampleDocuments.passed': 'Validación superada',
  'schemaValidation.sampleDocuments.failed': 'Validación no superada',
  'schemaValidation.selectors.action': 'Acción',
  'schemaValidation.selectors.actionInfo':
    'Más información sobre las acciones de validación',
  'schemaValidation.selectors.warning': 'Advertencia',
  'schemaValidation.selectors.error': 'Error',
  'schemaValidation.selectors.errorAndLog': 'Error y registro',
  'schemaValidation.selectors.level': 'Nivel',
  'schemaValidation.selectors.levelInfo':
    'Más información sobre los niveles de validación',
  'schemaValidation.selectors.off': 'Desactivado',
  'schemaValidation.selectors.moderate': 'Moderado',
  'schemaValidation.selectors.strict': 'Estricto',
  'schemaValidation.selectors.constraint': 'Restricción',
  'schemaValidation.editor.applyConfirmTitle':
    '¿Seguro que quieres aplicar estas reglas de validación?',
  'schemaValidation.editor.applyConfirmDescription':
    'Estas reglas se aplicarán en las actualizaciones e inserciones de tus documentos. Asegúrate de haberlas revisado antes de aplicarlas.',
  'schemaValidation.editor.generateRules': 'Generar reglas',
  'schemaValidation.editor.clearBeforeGenerating':
    'Borra las reglas existentes antes de generar otras nuevas',
  'schemaValidation.editor.modified':
    'Las reglas se han modificado pero no se han aplicado. Revísalas antes de aplicarlas.',
  'schemaValidation.editor.generated':
    'Reglas generadas. Revísalas antes de aplicarlas.',
  'schemaValidation.editor.cancel': 'Cancelar',
  'schemaValidation.editor.updating': 'Actualizando validación…',
  'schemaValidation.editor.apply': 'Aplicar',
  'schemaValidation.editor.editRules': 'Editar reglas',
  'schemaValidation.states.timeSeries':
    'La validación de esquemas no es compatible con las colecciones de series temporales.',
  'schemaValidation.states.readOnlyView':
    'La validación de esquemas no es compatible con las vistas de solo lectura.',
  'schemaValidation.states.secondaryNode':
    'Esta acción no está disponible en un nodo secundario.',
  'schemaValidation.states.constraintActive':
    'Esta colección usa el nivel de validación «constraint», que garantiza que todos los documentos cumplen el validador. Las reglas no se pueden cambiar mientras esté activo.',
  'schemaValidation.states.constraintPrepared':
    'Esta colección está preparada para actualizarse al nivel de validación «constraint». Las reglas no se pueden cambiar hasta que termine la actualización o hasta que se borre el estado preparado ejecutando collMod con prepareConstraintValidationLevel: false.',
  'schemaValidation.states.oldServer':
    'Compass ya no es compatible con el generador visual de reglas para versiones del servidor anteriores a la 3.2. Para usar el generador visual de reglas, por favor',
  'schemaValidation.states.upgrade': 'actualiza a MongoDB 3.2.',
  'schemaValidation.states.generating': 'Generando reglas',
  'schemaValidation.states.stop': 'Detener',
  'schemaValidation.states.timeout':
    'La operación superó el límite de tiempo. Intenta aumentar maxTimeMS en los ajustes de Compass.',
  'schemaValidation.states.generationError':
    'Se produjo un error durante la generación de reglas',
  'schemaValidation.states.loading': 'Cargando validación',
  'schemaValidation.states.createTitle': 'Crear reglas de validación',
  'schemaValidation.states.createSubtitle':
    'Genera reglas mediante análisis de esquemas a partir de datos de ejemplo existentes o añádelas manualmente para aplicar la estructura de los documentos en las actualizaciones e inserciones',
  'schemaValidation.states.generate': 'Generar reglas',
  'schemaValidation.states.addRule': 'Añadir regla',
  'schemaValidation.states.learnMore': 'Más información sobre las validaciones',
  'schemaValidation.toast.applied': 'Nuevas reglas de validación aplicadas',
  'schemaValidation.validatorMustBeObject': 'El validador debe ser un objeto.',
  'collection.mockData.unsupportedFieldNameSeparator':
    "La función no es compatible con nombres de campo que contengan un '{separator}'; nombre del campo: '{fieldName}'",
  'collection.mockData.unsupportedFieldNameArraySuffix':
    "La función no es compatible con nombres de campo que terminan en '[]'; nombre del campo: '{fieldName}'",
  'collection.mockData.nestingDepthExceeded':
    'La profundidad de anidamiento del esquema ({depth}) supera la profundidad máxima admitida de {maxDepth}.',
};
