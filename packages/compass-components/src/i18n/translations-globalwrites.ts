import type { Catalog } from './translations';

export const de: Catalog = {
  'globalWrites.loading': 'Wird geladen …',

  'globalWrites.pluginTitle.title': 'Global Writes',
  'globalWrites.pluginTitle.warning': 'Warnung',
  'globalWrites.pluginTitle.important': 'wichtig',
  'globalWrites.pluginTitle.tooltip':
    "Collections in Atlas Global Clusters mit von Atlas verwaltetem Sharding müssen mit einem zusammengesetzten Shard-Key konfiguriert werden, der aus einem Feld 'location' und einem von dir angegebenen Bezeichnerfeld besteht. Bitte konfiguriere das Sharding hier.",

  'globalWrites.createShardKey.configureTitle':
    'Zusammengesetzten Shard-Key konfigurieren',
  'globalWrites.createShardKey.configureIntro':
    'Um Global Writes korrekt zu konfigurieren, müssen deine Collections mit einem zusammengesetzten Shard-Key geshardet werden, der aus einem Feld ‘location’ und einem zweiten Feld deiner Wahl besteht.',
  'globalWrites.createShardKey.allDocumentsContain':
    'Alle Dokumente in deiner Collection sollten sowohl das Feld ‘location’ als auch das von dir gewählte zweite Feld enthalten.',
  'globalWrites.createShardKey.secondFieldHint':
    'Das zweite Feld sollte einen gut verteilten und unveränderlichen Wert enthalten, damit die Daten gleichmäßig auf die Shards einer Zone verteilt werden.',
  'globalWrites.createShardKey.secondFieldNoArray':
    'Beachte, dass der Wert dieses Felds kein Array sein darf.',
  'globalWrites.createShardKey.moreInfoPrefix':
    'Weitere Informationen findest du in unserer Dokumentation zum Thema',
  'globalWrites.createShardKey.selectingShardKey': 'Auswahl eines Shard-Keys',
  'globalWrites.createShardKey.cannotUnshard':
    'Sobald du deine Collection shardest, kann das Sharding nicht mehr rückgängig gemacht werden.',
  'globalWrites.createShardKey.firstShardKeyField': 'Erstes Shard-Key-Feld',
  'globalWrites.createShardKey.secondShardKeyField': 'Zweites Shard-Key-Feld',
  'globalWrites.createShardKey.noFieldsFound':
    'Keine Felder gefunden. Bitte gib einen gültigen Feldnamen ein.',
  'globalWrites.createShardKey.customField': 'Feld: "{field}"',
  'globalWrites.createShardKey.advancedConfiguration':
    'Erweiterte Shard-Key-Konfiguration',
  'globalWrites.createShardKey.default': 'Standard',
  'globalWrites.createShardKey.useUniqueIndex':
    'Unique-Index als Shard-Key verwenden',
  'globalWrites.createShardKey.uniqueIndexDescription':
    'Erzwingt eine Eindeutigkeitsbedingung für den Shard-Key dieser Global Collection.',
  'globalWrites.createShardKey.useHashedIndex':
    'Gehashten Index als Shard-Key verwenden',
  'globalWrites.createShardKey.hashedIndexDescription':
    'Verbessert die gleichmäßige Verteilung der geshardeten Daten, indem das zweite Feld des Shard-Keys gehasht wird.',
  'globalWrites.createShardKey.learnMore': 'Mehr erfahren',
  'globalWrites.createShardKey.presplitData':
    'Daten für eine gleichmäßige Verteilung vorab aufteilen.',
  'globalWrites.createShardKey.chunksPerShardLabel': 'Chunks pro Shard',
  'globalWrites.createShardKey.chunksPlaceholder': 'Chunks',
  'globalWrites.createShardKey.chunksPerShard': 'Chunks pro Shard.',
  'globalWrites.createShardKey.shardCollection': 'Collection sharden',

  'globalWrites.exampleCommands.title': 'Beispielbefehle',
  'globalWrites.exampleCommands.startQueryingPrefix':
    'Beginne mit der Abfrage deiner Datenbank mit einigen der gängigsten',
  'globalWrites.exampleCommands.commonCommands': 'Befehle',
  'globalWrites.exampleCommands.startQueryingSuffix': 'für Global Writes.',
  'globalWrites.exampleCommands.replaceText':
    'Ersetze den Text, um Operationen auf anderen Dokumenten auszuführen. US-NY ist ein ISO-3166-Standortcode für New York, Vereinigte Staaten. Weitere ISO-3166-Standortcodes kannst du unten nachschlagen.',
  'globalWrites.exampleCommands.findingDocuments': 'Dokumente suchen',
  'globalWrites.exampleCommands.insertingDocuments': 'Dokumente einfügen',

  'globalWrites.shardKeyMarkup.configuredWith':
    'ist mit dem folgenden Shard-Key konfiguriert:',
  'globalWrites.shardKeyMarkup.requested':
    'Du hast die Verwendung des folgenden Shard-Keys angefordert:',

  'globalWrites.shardZones.locationCodes': 'Standortcodes',
  'globalWrites.shardZones.firstFieldCode':
    'Das erste Feld jedes Dokuments sollte einen ISO-3166-1-Alpha-2-Code für den Standort enthalten, zu dem es gehört.',
  'globalWrites.shardZones.subdivisionCodes':
    'Wir unterstützen außerdem ISO-3166-2-Codes für Unterteilungen in Ländern mit einem Rechenzentrum eines Cloud-Anbieters (für diese Länder können sowohl ISO-3166-1- als auch ISO-3166-2-Codes verwendet werden). Alle gültigen Ländercodes und die Zonen, denen sie zugeordnet sind, werden in der Tabelle unten aufgeführt. Zusätzlich kannst du eine Liste aller Standortcodes',
  'globalWrites.shardZones.here': 'hier',
  'globalWrites.shardZones.mappingChangePrefix':
    'Die Zonenzuordnung der Standorte kann geändert werden, indem du zur Seite',
  'globalWrites.shardZones.editConfiguration': 'Konfiguration bearbeiten',
  'globalWrites.shardZones.mappingChangeSuffix':
    'dieses Clusters navigierst und oberhalb der Karte auf den Link ‘Standortzuordnungen konfigurieren’ klickst.',
  'globalWrites.shardZones.locationName': 'Standortname',
  'globalWrites.shardZones.zone': 'Zone',
  'globalWrites.shardZones.searchLocation': 'Nach einem Standort suchen',
  'globalWrites.shardZones.zoneMapping': 'Zonenzuordnung',

  'globalWrites.incompleteSetup.warning':
    'Du hast anscheinend einen Global-Writes-Shard-Key für diese Collection gewählt, aber deine Konfiguration ist unvollständig.',
  'globalWrites.incompleteSetup.enablePrompt':
    'Bitte aktiviere Global Writes für diese Collection, damit Dokumente der passenden Zone zugeordnet werden.',
  'globalWrites.incompleteSetup.readMore': 'Mehr über Global Writes erfahren',
  'globalWrites.incompleteSetup.enableButton': 'Global Writes aktivieren',

  'globalWrites.shardKeyCorrect.documentsShouldContain':
    'Alle Dokumente in deiner Collection sollten beim Einfügen sowohl das Feld ‘location’ (mit einem ISO-Länder- oder Unterteilungscode) als auch dein Feld {field} enthalten.',
  'globalWrites.shardKeyCorrect.tableIncluded':
    'Unten haben wir eine Tabelle als Referenz eingefügt.',
  'globalWrites.shardKeyCorrect.unmanageTitle':
    'Verwaltung dieser Collection aufheben',
  'globalWrites.shardKeyCorrect.unmanageDescription':
    'Dokumente dieser Collection werden nicht mehr auf die Shards deiner globalen Cluster verteilt.',
  'globalWrites.shardKeyCorrect.unmanageButton':
    'Verwaltung der Collection aufheben',

  'globalWrites.shardKeyInvalid.requirement':
    'Um Global Writes zu konfigurieren, muss der erste Shard-Key dieser Collection "location" mit bereichsbasiertem Sharding sein, und du musst außerdem einen zweiten Shard-Key angeben.',
  'globalWrites.shardKeyInvalid.migrate':
    'Bitte migriere die Daten dieser Collection in eine neue Collection und shard sie mit einem gültigen zusammengesetzten Shard-Key neu.',
  'globalWrites.shardKeyInvalid.distribution':
    'Dokumente in dieser Collection werden auf deine Shards verteilt, ohne bestimmten Zonen zugeordnet zu werden.',

  'globalWrites.shardKeyMismatch.cannotConfigure':
    'Dein angeforderter Shard-Key kann nicht konfiguriert werden, da die Collection bereits mit einem anderen Key geshardet wurde.',
  'globalWrites.shardKeyMismatch.unmanagePrompt':
    'Bitte klicke auf die Schaltfläche unten, um die Verwaltung dieser Collection aufzuheben. Wenn der vorhandene Shard-Key gültig ist, kannst du Global Writes auf dem nächsten Bildschirm für diese Collection aktivieren.',
  'globalWrites.shardKeyMismatch.unmanageButton':
    'Verwaltung der Collection aufheben',

  'globalWrites.shardingError.message':
    'Beim Sharden deiner Collection ist ein Fehler aufgetreten. Bitte brich die Anfrage ab, nimm die erforderlichen Änderungen an deiner Collection vor und versuche es erneut.',
  'globalWrites.shardingError.cancelRequest': 'Anfrage abbrechen',

  'globalWrites.sharding.inProgress': 'Deine Collection wird geshardet …',
  'globalWrites.sharding.shouldNotTakeLong': 'das sollte nicht lange dauern.',
  'globalWrites.sharding.cancelRequest': 'Anfrage abbrechen',
  'globalWrites.sharding.onceSharded':
    'Sobald deine Collection geshardet ist, zeigt dieser Tab Anweisungen zur Formatierung des Dokumentfelds ‘location’ sowie einige gängige Beispielbefehle an.',
  'globalWrites.sharding.readMore':
    'Weitere Informationen zu Global Writes findest du in unserer Dokumentation.',

  'globalWrites.unsharded.requirement':
    'Um Global Writes zu verwenden, muss diese Collection mit einem zusammengesetzten Shard-Key konfiguriert werden, der aus einem Feld ‘location’ und einem von dir anzugebenden Bezeichnerfeld besteht.',
  'globalWrites.unsharded.seeInstructions':
    'Details findest du in den Anweisungen unten.',

  'globalWrites.store.fetchShardingInfoFailed':
    'Shard-Informationen konnten nicht abgerufen werden',
  'globalWrites.store.fetchShardKeyFailed':
    'Shard-Key oder Bereitstellungsstatus konnte nicht abgerufen werden',
  'globalWrites.store.createShardKeyFailed':
    'Shard-Key konnte nicht erstellt werden: {message}',
  'globalWrites.store.confirmationTitle': 'Bestätigung',
  'globalWrites.store.cancelShardingConfirm':
    'Möchtest du die Sharding-Anfrage wirklich abbrechen?',
  'globalWrites.store.cancelShardingFailed':
    'Der Sharding-Vorgang konnte nicht abgebrochen werden: {message}',
  'globalWrites.store.fetchShardingZonesFailed':
    'Sharding-Zonen konnten nicht abgerufen werden: {message}',
  'globalWrites.store.unmanageNamespaceFailed':
    'Die Verwaltung des Namespace konnte nicht beendet werden: {message}',
  'globalWrites.createShardKey.docsAriaLabel':
    'Dokumentation zum Connection-String',
};

export const fr: Catalog = {
  'globalWrites.loading': 'Chargement …',

  'globalWrites.pluginTitle.title': 'Global Writes',
  'globalWrites.pluginTitle.warning': 'avertissement',
  'globalWrites.pluginTitle.important': 'important',
  'globalWrites.pluginTitle.tooltip':
    "Les collections des clusters globaux Atlas avec sharding géré par Atlas doivent être configurées avec une clé de sharding composée d'un champ 'location' et d'un champ d'identifiant que vous fournissez. Veuillez configurer le sharding ici.",

  'globalWrites.createShardKey.configureTitle':
    'Configurer la clé de sharding composée',
  'globalWrites.createShardKey.configureIntro':
    'Pour configurer correctement Global Writes, vos collections doivent être shardées à l’aide d’une clé de sharding composée d’un champ ‘location’ et d’un second champ de votre choix.',
  'globalWrites.createShardKey.allDocumentsContain':
    'Tous les documents de votre collection doivent contenir à la fois le champ ‘location’ et le second champ que vous avez choisi.',
  'globalWrites.createShardKey.secondFieldHint':
    'Le second champ doit contenir une valeur bien répartie et immuable afin que les données soient réparties uniformément entre les shards d’une zone donnée.',
  'globalWrites.createShardKey.secondFieldNoArray':
    'Notez que la valeur de ce champ ne peut pas être un tableau.',
  'globalWrites.createShardKey.moreInfoPrefix':
    'Pour plus d’informations, consultez notre documentation sur',
  'globalWrites.createShardKey.selectingShardKey':
    'le choix d’une clé de sharding',
  'globalWrites.createShardKey.cannotUnshard':
    'Une fois votre collection shardée, le sharding ne peut plus être annulé.',
  'globalWrites.createShardKey.firstShardKeyField':
    'Premier champ de la clé de sharding',
  'globalWrites.createShardKey.secondShardKeyField':
    'Second champ de la clé de sharding',
  'globalWrites.createShardKey.noFieldsFound':
    'Aucun champ trouvé. Veuillez saisir un nom de champ valide.',
  'globalWrites.createShardKey.customField': 'Champ : "{field}"',
  'globalWrites.createShardKey.advancedConfiguration':
    'Configuration avancée de la clé de sharding',
  'globalWrites.createShardKey.default': 'Par défaut',
  'globalWrites.createShardKey.useUniqueIndex':
    'Utiliser un index unique comme clé de sharding',
  'globalWrites.createShardKey.uniqueIndexDescription':
    'Applique une contrainte d’unicité sur la clé de sharding de cette collection globale.',
  'globalWrites.createShardKey.useHashedIndex':
    'Utiliser un index haché comme clé de sharding',
  'globalWrites.createShardKey.hashedIndexDescription':
    'Améliore la répartition uniforme des données shardées en hachant le second champ de la clé de sharding.',
  'globalWrites.createShardKey.learnMore': 'En savoir plus',
  'globalWrites.createShardKey.presplitData':
    'Prédiviser les données pour une répartition uniforme.',
  'globalWrites.createShardKey.chunksPerShardLabel': 'Chunks par shard',
  'globalWrites.createShardKey.chunksPlaceholder': 'Chunks',
  'globalWrites.createShardKey.chunksPerShard': 'chunks par shard.',
  'globalWrites.createShardKey.shardCollection': 'Sharder la collection',

  'globalWrites.exampleCommands.title': 'Exemples de commandes',
  'globalWrites.exampleCommands.startQueryingPrefix':
    'Commencez à interroger votre base de données avec certaines des',
  'globalWrites.exampleCommands.commonCommands': 'commandes courantes',
  'globalWrites.exampleCommands.startQueryingSuffix': 'pour Global Writes.',
  'globalWrites.exampleCommands.replaceText':
    'Remplacez le texte pour effectuer des opérations sur d’autres documents. US-NY est un code de localisation ISO 3166 désignant New York, États-Unis. Vous pouvez rechercher d’autres codes de localisation ISO 3166 ci-dessous.',
  'globalWrites.exampleCommands.findingDocuments': 'Recherche de documents',
  'globalWrites.exampleCommands.insertingDocuments': 'Insertion de documents',

  'globalWrites.shardKeyMarkup.configuredWith':
    'est configurée avec la clé de sharding suivante :',
  'globalWrites.shardKeyMarkup.requested':
    'Vous avez demandé à utiliser la clé de sharding :',

  'globalWrites.shardZones.locationCodes': 'Codes de localisation',
  'globalWrites.shardZones.firstFieldCode':
    'Le premier champ de chaque document doit contenir un code ISO 3166-1 alpha-2 correspondant à la localisation à laquelle il appartient.',
  'globalWrites.shardZones.subdivisionCodes':
    'Nous prenons également en charge les codes de subdivision ISO 3166-2 pour les pays comportant un centre de données d’un fournisseur cloud (les codes ISO 3166-1 et ISO 3166-2 peuvent tous deux être utilisés pour ces pays). Tous les codes de pays valides et les zones auxquelles ils correspondent sont listés dans le tableau ci-dessous. Vous pouvez en outre consulter la liste de tous les codes de localisation',
  'globalWrites.shardZones.here': 'ici',
  'globalWrites.shardZones.mappingChangePrefix':
    'La correspondance entre localisations et zones peut être modifiée en accédant à la page',
  'globalWrites.shardZones.editConfiguration': 'Modifier la configuration',
  'globalWrites.shardZones.mappingChangeSuffix':
    'de ce cluster, puis en cliquant sur le lien ‘Configurer les correspondances de localisation’ au-dessus de la carte.',
  'globalWrites.shardZones.locationName': 'Nom de la localisation',
  'globalWrites.shardZones.zone': 'Zone',
  'globalWrites.shardZones.searchLocation': 'Rechercher une localisation',
  'globalWrites.shardZones.zoneMapping': 'Correspondance des zones',

  'globalWrites.incompleteSetup.warning':
    'Il semble que vous ayez choisi une clé de sharding Global Writes pour cette collection, mais votre configuration est incomplète.',
  'globalWrites.incompleteSetup.enablePrompt':
    'Veuillez activer Global Writes pour cette collection afin que les documents soient associés à la zone appropriée.',
  'globalWrites.incompleteSetup.readMore': 'En savoir plus sur Global Writes',
  'globalWrites.incompleteSetup.enableButton': 'Activer Global Writes',

  'globalWrites.shardKeyCorrect.documentsShouldContain':
    'Tous les documents de votre collection doivent contenir, lors de l’insertion, à la fois le champ ‘location’ (avec un code de pays ou de subdivision ISO) et votre champ {field}.',
  'globalWrites.shardKeyCorrect.tableIncluded':
    'Nous avons inclus un tableau de référence ci-dessous.',
  'globalWrites.shardKeyCorrect.unmanageTitle':
    'Ne plus gérer cette collection',
  'globalWrites.shardKeyCorrect.unmanageDescription':
    'Les documents appartenant à cette collection ne seront plus répartis entre les shards de vos clusters globaux.',
  'globalWrites.shardKeyCorrect.unmanageButton': 'Ne plus gérer la collection',

  'globalWrites.shardKeyInvalid.requirement':
    'Pour configurer Global Writes, la première clé de sharding de cette collection doit être "location" avec un sharding par plage, et vous devez également spécifier une seconde clé de sharding.',
  'globalWrites.shardKeyInvalid.migrate':
    'Veuillez migrer les données de cette collection vers une nouvelle collection et la sharder à nouveau à l’aide d’une clé de sharding composée valide.',
  'globalWrites.shardKeyInvalid.distribution':
    'Les documents de cette collection seront répartis entre vos shards sans être associés à des zones spécifiques.',

  'globalWrites.shardKeyMismatch.cannotConfigure':
    'Votre clé de sharding demandée ne peut pas être configurée, car la collection a déjà été shardée avec une clé différente.',
  'globalWrites.shardKeyMismatch.unmanagePrompt':
    'Veuillez cliquer sur le bouton ci-dessous pour ne plus gérer cette collection. Si la clé de sharding existante est valide, vous pourrez activer Global Writes pour cette collection à l’écran suivant.',
  'globalWrites.shardKeyMismatch.unmanageButton': 'Ne plus gérer la collection',

  'globalWrites.shardingError.message':
    'Une erreur s’est produite lors du sharding de votre collection. Veuillez annuler la demande, apporter les modifications nécessaires à votre collection, puis réessayer.',
  'globalWrites.shardingError.cancelRequest': 'Annuler la demande',

  'globalWrites.sharding.inProgress': 'Sharding de votre collection …',
  'globalWrites.sharding.shouldNotTakeLong':
    'cela ne devrait pas prendre trop de temps.',
  'globalWrites.sharding.cancelRequest': 'Annuler la demande',
  'globalWrites.sharding.onceSharded':
    'Une fois votre collection shardée, cet onglet affichera des instructions sur le format du champ ‘location’ des documents et fournira quelques exemples de commandes courantes.',
  'globalWrites.sharding.readMore':
    'Vous pouvez en savoir plus sur Global Writes dans notre documentation.',

  'globalWrites.unsharded.requirement':
    'Pour utiliser Global Writes, cette collection doit être configurée avec une clé de sharding composée d’un champ ‘location’ et d’un champ d’identifiant que vous devez fournir.',
  'globalWrites.unsharded.seeInstructions':
    'Consultez les instructions ci-dessous pour plus de détails.',

  'globalWrites.store.fetchShardingInfoFailed':
    'Échec de la récupération des informations de sharding',
  'globalWrites.store.fetchShardKeyFailed':
    'Échec de la récupération de la clé de shard ou de l’état du déploiement',
  'globalWrites.store.createShardKeyFailed':
    'Échec de la création de la clé de shard : {message}',
  'globalWrites.store.confirmationTitle': 'Confirmation',
  'globalWrites.store.cancelShardingConfirm':
    'Voulez-vous vraiment annuler la demande de sharding ?',
  'globalWrites.store.cancelShardingFailed':
    'Échec de l’annulation du processus de sharding : {message}',
  'globalWrites.store.fetchShardingZonesFailed':
    'Échec de la récupération des zones de sharding : {message}',
  'globalWrites.store.unmanageNamespaceFailed':
    'Échec de l’arrêt de la gestion de l’espace de noms : {message}',
  'globalWrites.createShardKey.docsAriaLabel':
    'Documentation sur la chaîne de connexion',
};

export const es: Catalog = {
  'globalWrites.loading': 'Cargando …',

  'globalWrites.pluginTitle.title': 'Global Writes',
  'globalWrites.pluginTitle.warning': 'advertencia',
  'globalWrites.pluginTitle.important': 'importante',
  'globalWrites.pluginTitle.tooltip':
    "Las colecciones de los clústeres globales de Atlas con sharding administrado por Atlas deben configurarse con una clave de shard compuesta por un campo 'location' y un campo identificador que tú proporciones. Configura el sharding aquí.",

  'globalWrites.createShardKey.configureTitle':
    'Configurar la clave de shard compuesta',
  'globalWrites.createShardKey.configureIntro':
    'Para configurar correctamente Global Writes, tus colecciones deben estar fragmentadas con una clave de shard compuesta por un campo ‘location’ y un segundo campo de tu elección.',
  'globalWrites.createShardKey.allDocumentsContain':
    'Todos los documentos de tu colección deben contener tanto el campo ‘location’ como el segundo campo que elijas.',
  'globalWrites.createShardKey.secondFieldHint':
    'El segundo campo debe representar un valor bien distribuido e inmutable para garantizar que los datos se distribuyan de forma equitativa entre los shards de una zona determinada.',
  'globalWrites.createShardKey.secondFieldNoArray':
    'Ten en cuenta que el valor de este campo no puede ser un array.',
  'globalWrites.createShardKey.moreInfoPrefix':
    'Para obtener más información, consulta nuestra documentación sobre',
  'globalWrites.createShardKey.selectingShardKey':
    'cómo elegir una clave de shard',
  'globalWrites.createShardKey.cannotUnshard':
    'Una vez que fragmentes tu colección, no se podrá deshacer el sharding.',
  'globalWrites.createShardKey.firstShardKeyField':
    'Primer campo de la clave de shard',
  'globalWrites.createShardKey.secondShardKeyField':
    'Segundo campo de la clave de shard',
  'globalWrites.createShardKey.noFieldsFound':
    'No se encontraron campos. Introduce un nombre de campo válido.',
  'globalWrites.createShardKey.customField': 'Campo: "{field}"',
  'globalWrites.createShardKey.advancedConfiguration':
    'Configuración avanzada de la clave de shard',
  'globalWrites.createShardKey.default': 'Predeterminado',
  'globalWrites.createShardKey.useUniqueIndex':
    'Usar un índice único como clave de shard',
  'globalWrites.createShardKey.uniqueIndexDescription':
    'Aplica una restricción de unicidad a la clave de shard de esta colección global.',
  'globalWrites.createShardKey.useHashedIndex':
    'Usar un índice hash como clave de shard',
  'globalWrites.createShardKey.hashedIndexDescription':
    'Mejora la distribución uniforme de los datos fragmentados mediante el hash del segundo campo de la clave de shard.',
  'globalWrites.createShardKey.learnMore': 'Más información',
  'globalWrites.createShardKey.presplitData':
    'Dividir previamente los datos para una distribución uniforme.',
  'globalWrites.createShardKey.chunksPerShardLabel': 'Chunks por shard',
  'globalWrites.createShardKey.chunksPlaceholder': 'Chunks',
  'globalWrites.createShardKey.chunksPerShard': 'chunks por shard.',
  'globalWrites.createShardKey.shardCollection': 'Fragmentar colección',

  'globalWrites.exampleCommands.title': 'Comandos de ejemplo',
  'globalWrites.exampleCommands.startQueryingPrefix':
    'Empieza a consultar tu base de datos con algunos de los',
  'globalWrites.exampleCommands.commonCommands': 'comandos más habituales',
  'globalWrites.exampleCommands.startQueryingSuffix': 'para Global Writes.',
  'globalWrites.exampleCommands.replaceText':
    'Reemplaza el texto para realizar operaciones en otros documentos. US-NY es un código de ubicación ISO 3166 que hace referencia a Nueva York, Estados Unidos. Puedes buscar otros códigos de ubicación ISO 3166 a continuación.',
  'globalWrites.exampleCommands.findingDocuments': 'Búsqueda de documentos',
  'globalWrites.exampleCommands.insertingDocuments': 'Inserción de documentos',

  'globalWrites.shardKeyMarkup.configuredWith':
    'está configurada con la siguiente clave de shard:',
  'globalWrites.shardKeyMarkup.requested':
    'Has solicitado usar la clave de shard:',

  'globalWrites.shardZones.locationCodes': 'Códigos de ubicación',
  'globalWrites.shardZones.firstFieldCode':
    'El primer campo de cada documento debe incluir un código ISO 3166-1 alfa-2 de la ubicación a la que pertenece.',
  'globalWrites.shardZones.subdivisionCodes':
    'También admitimos códigos de subdivisión ISO 3166-2 para los países que cuentan con un centro de datos de un proveedor de nube (para estos países se pueden usar tanto códigos ISO 3166-1 como ISO 3166-2). Todos los códigos de país válidos y las zonas con las que se corresponden se muestran en la tabla siguiente. Además, puedes ver una lista de todos los códigos de ubicación',
  'globalWrites.shardZones.here': 'aquí',
  'globalWrites.shardZones.mappingChangePrefix':
    'La asignación de zonas de las ubicaciones se puede cambiar accediendo a la página',
  'globalWrites.shardZones.editConfiguration': 'Editar configuración',
  'globalWrites.shardZones.mappingChangeSuffix':
    'de este clúster y haciendo clic en el enlace ‘Configurar asignaciones de ubicación’ situado sobre el mapa.',
  'globalWrites.shardZones.locationName': 'Nombre de la ubicación',
  'globalWrites.shardZones.zone': 'Zona',
  'globalWrites.shardZones.searchLocation': 'Buscar una ubicación',
  'globalWrites.shardZones.zoneMapping': 'Asignación de zonas',

  'globalWrites.incompleteSetup.warning':
    'Parece que has elegido una clave de shard de Global Writes para esta colección, pero tu configuración está incompleta.',
  'globalWrites.incompleteSetup.enablePrompt':
    'Activa Global Writes para esta colección para asegurarte de que los documentos se asocien a la zona adecuada.',
  'globalWrites.incompleteSetup.readMore':
    'Más información sobre Global Writes',
  'globalWrites.incompleteSetup.enableButton': 'Activar Global Writes',

  'globalWrites.shardKeyCorrect.documentsShouldContain':
    'Todos los documentos de tu colección deben contener, en el momento de la inserción, tanto el campo ‘location’ (con un código ISO de país o subdivisión) como tu campo {field}.',
  'globalWrites.shardKeyCorrect.tableIncluded':
    'Hemos incluido una tabla de referencia a continuación.',
  'globalWrites.shardKeyCorrect.unmanageTitle':
    'Dejar de administrar esta colección',
  'globalWrites.shardKeyCorrect.unmanageDescription':
    'Los documentos de esta colección dejarán de distribuirse entre los shards de tus clústeres globales.',
  'globalWrites.shardKeyCorrect.unmanageButton':
    'Dejar de administrar la colección',

  'globalWrites.shardKeyInvalid.requirement':
    'Para configurar Global Writes, la primera clave de shard de esta colección debe ser "location" con sharding por rangos, y también debes especificar una segunda clave de shard.',
  'globalWrites.shardKeyInvalid.migrate':
    'Migra los datos de esta colección a una colección nueva y vuelve a fragmentarla con una clave de shard compuesta válida.',
  'globalWrites.shardKeyInvalid.distribution':
    'Los documentos de esta colección se distribuirán entre tus shards sin asignarse a zonas específicas.',

  'globalWrites.shardKeyMismatch.cannotConfigure':
    'No se puede configurar la clave de shard solicitada porque la colección ya se ha fragmentado con una clave diferente.',
  'globalWrites.shardKeyMismatch.unmanagePrompt':
    'Haz clic en el botón de abajo para dejar de administrar esta colección. Si la clave de shard existente es válida, podrás activar Global Writes para esta colección en la pantalla siguiente.',
  'globalWrites.shardKeyMismatch.unmanageButton':
    'Dejar de administrar la colección',

  'globalWrites.shardingError.message':
    'Se produjo un error al fragmentar tu colección. Cancela la solicitud, realiza los cambios necesarios en tu colección e inténtalo de nuevo.',
  'globalWrites.shardingError.cancelRequest': 'Cancelar solicitud',

  'globalWrites.sharding.inProgress': 'Fragmentando tu colección …',
  'globalWrites.sharding.shouldNotTakeLong': 'esto no debería tardar mucho.',
  'globalWrites.sharding.cancelRequest': 'Cancelar solicitud',
  'globalWrites.sharding.onceSharded':
    'Una vez que tu colección esté fragmentada, esta pestaña mostrará instrucciones sobre el formato del campo ‘location’ de los documentos y proporcionará algunos ejemplos de comandos habituales.',
  'globalWrites.sharding.readMore':
    'Puedes obtener más información sobre Global Writes en nuestra documentación.',

  'globalWrites.unsharded.requirement':
    'Para usar Global Writes, esta colección debe configurarse con una clave de shard compuesta por un campo ‘location’ y un campo identificador que debes proporcionar.',
  'globalWrites.unsharded.seeInstructions':
    'Consulta las instrucciones a continuación para obtener más detalles.',

  'globalWrites.store.fetchShardingInfoFailed':
    'No se pudo obtener la información de fragmentación',
  'globalWrites.store.fetchShardKeyFailed':
    'No se pudo obtener la clave de shard o el estado de la implementación',
  'globalWrites.store.createShardKeyFailed':
    'No se pudo crear la clave de shard: {message}',
  'globalWrites.store.confirmationTitle': 'Confirmación',
  'globalWrites.store.cancelShardingConfirm':
    '¿Seguro que quieres cancelar la solicitud de fragmentación?',
  'globalWrites.store.cancelShardingFailed':
    'No se pudo cancelar el proceso de fragmentación: {message}',
  'globalWrites.store.fetchShardingZonesFailed':
    'No se pudieron obtener las zonas de fragmentación: {message}',
  'globalWrites.store.unmanageNamespaceFailed':
    'No se pudo dejar de administrar el espacio de nombres: {message}',
  'globalWrites.createShardKey.docsAriaLabel':
    'Documentación de la cadena de conexión',
};
