import type { Catalog } from './translations';

// Texts of the Privacy, Proxy, OIDC, AI and Feature Preview settings tabs and
// of the preference descriptions rendered as JSX. See ./translations.ts for
// the key conventions.

export const de: Catalog = {
  'settings.privacy.intro':
    'Um die Benutzererfahrung zu verbessern, kann Compass Dienste von Drittanbietern einbinden, wofür externe Netzwerkanfragen nötig sind. Bitte wähle aus den folgenden Einstellungen:',
  'settings.privacy.footer':
    'Bei keiner dieser Optionen werden persönliche Informationen oder gespeicherte Daten übermittelt.',
  'settings.privacy.learnMore': 'Mehr erfahren:',
  'settings.privacy.policy': 'MongoDB-Datenschutzerklärung',
  'settings.oidc.intro':
    'Ändere das Verhalten des OIDC-Authentifizierungsmechanismus für Serververbindungen und die Atlas-Anmeldung in Compass.',
  'settings.oidc.serverOptions':
    'Optionen für die OIDC-Authentifizierung am MongoDB-Server',
  'settings.ai.intro':
    'Ermöglicht den Zugriff auf fortgeschrittene generative KI-Funktionen.',
  'settings.preview.intro':
    'Diese Einstellungen steuern experimentelles Verhalten von Compass. Die Nutzung erfolgt auf eigene Gefahr!',
  'settings.proxy.none': 'Kein Proxy',
  'settings.proxy.system': 'System-Proxy',
  'settings.proxy.manual': 'Manuelle Konfiguration',
  'settings.proxy.excluded': 'Ausgeschlossene Hosts',
  'settings.proxy.excludedDescription':
    'Kommagetrennte Liste von Hostnamen und IP-Adressen. Verbindungen zu diesen Hosts werden nicht über den Proxy geleitet.',
  'settings.proxy.url': 'Proxy-URL',
  'settings.proxy.urlDescription': 'Gib eine URL mit einem dieser Schemata an:',
  'settings.proxy.username': 'Benutzername',
  'settings.proxy.password': 'Passwort',
  'settings.proxy.authWarning':
    'Einige Ressourcen, etwa Kartendaten für geografische Visualisierungen, können derzeit nicht über Proxys geladen werden, die eine Authentifizierung erfordern.',

  'settings.desc.timezone.utc':
    'Die Daten werden weiterhin immer in UTC gespeichert.',
  'settings.desc.timezone.dstTooltip':
    'Diese Zeitzone beachtet die Sommerzeit.',
  'settings.desc.timezone.dst': 'Beachtet die Sommerzeit',
  'settings.desc.dbStats.before':
    'Wenn aktiviert, ruft Compass gelegentlich die Befehle',
  'settings.desc.dbStats.and': 'und',
  'settings.desc.dbStats.after':
    'auf, um Speicherstatistiken für eine Datenbank oder Collection abzurufen. Das Deaktivieren dieser Einstellung kann den Mehraufwand von Compass für deine MongoDB-Deployments verringern.',
  'settings.desc.defaultSort.main':
    'Alle über die Abfrageleiste ausgeführten Abfragen verwenden diese Sortierung.',
  'settings.desc.defaultSort.note': 'Nicht verfügbar für Views und Timeseries.',
  'settings.desc.toolCalling.main':
    'Dem MongoDB Assistant erlauben, mit deinen Datenbanken zu interagieren. Alle Aktionen erfordern deine Zustimmung, bevor sie ausgeführt werden. Mehr erfahren über',
  'settings.desc.toolCalling.link': 'MongoDB-Datenbanktools',

  'pref.autoUpdates.short': 'Automatische Updates aktivieren',
  'pref.autoUpdates.long':
    'Compass erlauben, regelmäßig nach neuen Updates zu suchen.',
  'pref.enableMaps.short': 'Geografische Visualisierungen aktivieren',
  'pref.enableMaps.long':
    'Compass erlauben, Anfragen an einen Kartendienst eines Drittanbieters zu senden.',
  'pref.trackUsageStatistics.short': 'Nutzungsstatistiken aktivieren',
  'pref.trackUsageStatistics.long':
    'Compass erlauben, anonyme Nutzungsstatistiken zu senden.',
  'pref.enableFeedbackPanel.short': 'Produkt-Feedback geben',
  'pref.enableFeedbackPanel.long':
    'Aktiviert ein Werkzeug, mit dem unser Produktteam gelegentlich Feedback zu Compass einholen kann.',
  'pref.theme.short': 'Design',
  'pref.shellFollowsCompassTheme.short':
    'Compass-Design in der MongoDB Shell verwenden',
  'pref.shellFollowsCompassTheme.long':
    'Die eingebettete Shell folgt dem Compass-Design, statt immer den dunklen Modus zu verwenden.',
  'pref.browserCommandForOIDCAuth.short':
    'Browser-Befehl für die Authentifizierung',
  'pref.browserCommandForOIDCAuth.long':
    'Gib einen Shell-Befehl an, der den Browser für die Authentifizierung beim OIDC-Identitätsanbieter startet, entweder für die Serververbindung oder bei der Anmeldung an deinem Atlas-Cloud-Konto. Leer lassen für den Standardbrowser.',
  'pref.showOIDCDeviceAuthFlow.short': 'Checkbox für Device-Auth-Flow anzeigen',
  'pref.showOIDCDeviceAuthFlow.long':
    'Zeigt im Verbindungsformular eine Checkbox an, um den Device-Auth-Flow für die OIDC-Authentifizierung am MongoDB-Server zu aktivieren. Dieser weniger sichere Ablauf dient als Ausweichlösung, wenn die browserbasierte Authentifizierung nicht verfügbar ist.',
  'pref.persistOIDCTokens.short': 'Mit OIDC angemeldet bleiben',
  'pref.persistOIDCTokens.long':
    'Bei Verwendung des Mechanismus MONGODB-OIDC für Serververbindungen angemeldet bleiben. Zugriffstoken werden vor dem Speichern mit dem System-Schlüsselbund verschlüsselt. Das Deaktivieren dieser Option entfernt aktuell gespeicherte Token.',
  'pref.enableGenAIFeatures.short': 'KI-Funktionen aktivieren',
  'pref.enableGenAIFeatures.long':
    'Die Nutzung von KI-Funktionen in Compass erlauben, die Anfragen an Dienste von Drittanbietern senden.',
  'pref.enableGenAISampleDocumentPassing.short':
    'Das Senden von Beispielfeldwerten bei Anfragen zur Generierung von Abfragen und Aggregationen aktivieren.',
  'pref.enableGenAISampleDocumentPassing.long':
    'Beispielfeldwerte verbessern die Ergebnisse der KI.',
  'pref.enableGenAIToolCalling.short':
    'Schreibgeschützte Tools im MongoDB Assistant aktivieren',
  'pref.enableAutoEmbeddingPublicPreview.short':
    'Fügt eine Oberfläche für automatisch eingebettete Vector-Search-Indizes hinzu',
  'pref.enableAutoEmbeddingPrivatePreview.short':
    'Fügt eine Oberfläche für automatisch eingebettete Vector-Search-Indizes hinzu (Private Preview)',
  'pref.enableAutoEmbeddingGaRelease.short':
    'Die GA-Version der automatisch eingebetteten Vector-Search-Indizes aktivieren',
  'pref.enableSortedSearchIndexes.short':
    'Sortierte Syntax für das Schema von Suchindizes aktivieren',
};

export const fr: Catalog = {
  'settings.privacy.intro':
    "Pour améliorer l'expérience utilisateur, Compass peut s'intégrer à des services tiers, ce qui nécessite des requêtes réseau externes. Veuillez choisir parmi les paramètres ci-dessous :",
  'settings.privacy.footer':
    'Avec aucune de ces options, vos informations personnelles ou vos données stockées ne seront transmises.',
  'settings.privacy.learnMore': 'En savoir plus :',
  'settings.privacy.policy': 'Politique de confidentialité de MongoDB',
  'settings.oidc.intro':
    "Modifiez le comportement du mécanisme d'authentification OIDC pour la connexion au serveur et la connexion à Atlas dans Compass.",
  'settings.oidc.serverOptions':
    "Options d'authentification OIDC du serveur MongoDB",
  'settings.ai.intro':
    "Donne accès à des fonctionnalités avancées d'IA générative.",
  'settings.preview.intro':
    'Ces paramètres contrôlent le comportement expérimental de Compass. Utilisez-les à vos propres risques !',
  'settings.proxy.none': 'Aucun proxy',
  'settings.proxy.system': 'Proxy système',
  'settings.proxy.manual': 'Configuration manuelle',
  'settings.proxy.excluded': 'Hôtes exclus',
  'settings.proxy.excludedDescription':
    "Liste de noms d'hôte et d'adresses IP séparés par des virgules. Les connexions à ces hôtes ne passeront pas par le proxy.",
  'settings.proxy.url': 'URL du proxy',
  'settings.proxy.urlDescription':
    "Indiquez une URL avec l'un de ces schémas :",
  'settings.proxy.username': "Nom d'utilisateur",
  'settings.proxy.password': 'Mot de passe',
  'settings.proxy.authWarning':
    'Certaines ressources, comme les données cartographiques des visualisations géographiques, ne peuvent actuellement pas être chargées via des proxys qui exigent une authentification.',

  'settings.desc.timezone.utc': 'Les données seront toujours stockées en UTC.',
  'settings.desc.timezone.dstTooltip':
    "Ce fuseau horaire observe l'heure d'été.",
  'settings.desc.timezone.dst': "Observe l'heure d'été",
  'settings.desc.dbStats.before':
    'Lorsque cette option est activée, Compass appelle occasionnellement les commandes',
  'settings.desc.dbStats.and': 'et',
  'settings.desc.dbStats.after':
    "pour accéder aux statistiques de stockage d'une base de données ou d'une collection. Désactiver ce paramètre peut réduire la charge de Compass sur vos déploiements MongoDB.",
  'settings.desc.defaultSort.main':
    'Toutes les requêtes exécutées depuis la barre de requête appliqueront ce tri.',
  'settings.desc.defaultSort.note':
    'Non disponible pour les vues et les séries temporelles.',
  'settings.desc.toolCalling.main':
    "Autoriser le MongoDB Assistant à interagir avec vos bases de données. Toutes les actions nécessitent votre approbation avant d'être exécutées. En savoir plus sur les",
  'settings.desc.toolCalling.link': 'outils de base de données MongoDB',

  'pref.autoUpdates.short': 'Activer les mises à jour automatiques',
  'pref.autoUpdates.long':
    'Autoriser Compass à rechercher périodiquement de nouvelles mises à jour.',
  'pref.enableMaps.short': 'Activer les visualisations géographiques',
  'pref.enableMaps.long':
    'Autoriser Compass à envoyer des requêtes à un service de cartographie tiers.',
  'pref.trackUsageStatistics.short': "Activer les statistiques d'utilisation",
  'pref.trackUsageStatistics.long':
    "Autoriser Compass à envoyer des statistiques d'utilisation anonymes.",
  'pref.enableFeedbackPanel.short': 'Donner un avis sur le produit',
  'pref.enableFeedbackPanel.long':
    'Active un outil que notre équipe produit peut utiliser pour recueillir ponctuellement des retours sur Compass.',
  'pref.theme.short': 'Thème',
  'pref.shellFollowsCompassTheme.short':
    'Utiliser le thème de Compass dans le MongoDB Shell',
  'pref.shellFollowsCompassTheme.long':
    'Le shell intégré suit le thème de Compass au lieu de toujours utiliser le mode sombre.',
  'pref.browserCommandForOIDCAuth.short':
    "Commande du navigateur à utiliser pour l'authentification",
  'pref.browserCommandForOIDCAuth.long':
    "Indiquez une commande shell exécutée pour lancer le navigateur afin de s'authentifier auprès du fournisseur d'identité OIDC, pour la connexion au serveur ou lors de la connexion à votre compte Atlas Cloud. Laissez vide pour le navigateur par défaut.",
  'pref.showOIDCDeviceAuthFlow.short':
    "Afficher la case du flux d'authentification par appareil",
  'pref.showOIDCDeviceAuthFlow.long':
    "Affiche dans le formulaire de connexion une case pour activer le flux d'authentification par appareil pour l'authentification OIDC du serveur MongoDB. Ce flux, moins sécurisé, peut servir de solution de repli lorsque l'authentification par navigateur n'est pas disponible.",
  'pref.persistOIDCTokens.short': 'Rester connecté avec OIDC',
  'pref.persistOIDCTokens.long':
    "Rester connecté lors de l'utilisation du mécanisme MONGODB-OIDC pour la connexion au serveur MongoDB. Les jetons d'accès sont chiffrés avec le trousseau du système avant d'être stockés. Désactiver cette option supprimera les jetons actuellement stockés.",
  'pref.enableGenAIFeatures.short': "Activer les fonctionnalités d'IA",
  'pref.enableGenAIFeatures.long':
    "Autoriser l'utilisation des fonctionnalités d'IA de Compass qui envoient des requêtes à des services tiers.",
  'pref.enableGenAISampleDocumentPassing.short':
    "Activer l'envoi d'exemples de valeurs de champs avec les requêtes de génération de requêtes et d'agrégations.",
  'pref.enableGenAISampleDocumentPassing.long':
    "Fournir des exemples de valeurs de champs améliore les résultats de l'IA.",
  'pref.enableGenAIToolCalling.short':
    'Activer les outils en lecture seule dans le MongoDB Assistant',
  'pref.enableAutoEmbeddingPublicPreview.short':
    'Ajoute une interface pour les index de recherche vectorielle à intégration automatique',
  'pref.enableAutoEmbeddingPrivatePreview.short':
    'Ajoute une interface pour les index de recherche vectorielle à intégration automatique (préversion privée)',
  'pref.enableAutoEmbeddingGaRelease.short':
    'Activer la version GA des index de recherche vectorielle à intégration automatique',
  'pref.enableSortedSearchIndexes.short':
    'Activer la syntaxe triée pour le schéma des index de recherche',
};

export const es: Catalog = {
  'settings.privacy.intro':
    'Para mejorar la experiencia de usuario, Compass puede integrarse con servicios de terceros, lo que requiere solicitudes de red externas. Elige entre las siguientes opciones:',
  'settings.privacy.footer':
    'Con ninguna de estas opciones se enviará información personal ni datos almacenados.',
  'settings.privacy.learnMore': 'Más información:',
  'settings.privacy.policy': 'Política de privacidad de MongoDB',
  'settings.oidc.intro':
    'Cambia el comportamiento del mecanismo de autenticación OIDC para la conexión con el servidor y el inicio de sesión en Atlas en Compass.',
  'settings.oidc.serverOptions':
    'Opciones de autenticación OIDC del servidor MongoDB',
  'settings.ai.intro':
    'Proporciona acceso a funciones avanzadas de IA generativa.',
  'settings.preview.intro':
    'Estas opciones controlan el comportamiento experimental de Compass. ¡Úsalas bajo tu propio riesgo!',
  'settings.proxy.none': 'Sin proxy',
  'settings.proxy.system': 'Proxy del sistema',
  'settings.proxy.manual': 'Configuración manual',
  'settings.proxy.excluded': 'Hosts excluidos',
  'settings.proxy.excludedDescription':
    'Lista de nombres de host y direcciones IP separados por comas. Las conexiones a estos hosts no se reenviarán a través del proxy.',
  'settings.proxy.url': 'URL del proxy',
  'settings.proxy.urlDescription': 'Indica una URL con uno de estos esquemas:',
  'settings.proxy.username': 'Nombre de usuario',
  'settings.proxy.password': 'Contraseña',
  'settings.proxy.authWarning':
    'Algunos recursos, como los datos de mapas de las visualizaciones geográficas, actualmente no se pueden cargar a través de proxies que requieren autenticación.',

  'settings.desc.timezone.utc':
    'Los datos se seguirán almacenando siempre en UTC.',
  'settings.desc.timezone.dstTooltip':
    'Esta zona horaria aplica el horario de verano.',
  'settings.desc.timezone.dst': 'Aplica el horario de verano',
  'settings.desc.dbStats.before':
    'Si está activado, Compass llama ocasionalmente a los comandos',
  'settings.desc.dbStats.and': 'y',
  'settings.desc.dbStats.after':
    'para acceder a las estadísticas de almacenamiento de una base de datos o colección. Desactivar esta opción puede reducir la carga de Compass en tus despliegues de MongoDB.',
  'settings.desc.defaultSort.main':
    'Todas las consultas ejecutadas desde la barra de consultas aplicarán este orden.',
  'settings.desc.defaultSort.note':
    'No disponible para vistas ni series temporales.',
  'settings.desc.toolCalling.main':
    'Permitir que el MongoDB Assistant interactúe con tus bases de datos. Todas las acciones requieren tu aprobación antes de ejecutarse. Más información sobre las',
  'settings.desc.toolCalling.link': 'herramientas de base de datos de MongoDB',

  'pref.autoUpdates.short': 'Activar las actualizaciones automáticas',
  'pref.autoUpdates.long':
    'Permitir que Compass busque nuevas actualizaciones periódicamente.',
  'pref.enableMaps.short': 'Activar las visualizaciones geográficas',
  'pref.enableMaps.long':
    'Permitir que Compass envíe solicitudes a un servicio de mapas de terceros.',
  'pref.trackUsageStatistics.short': 'Activar las estadísticas de uso',
  'pref.trackUsageStatistics.long':
    'Permitir que Compass envíe estadísticas de uso anónimas.',
  'pref.enableFeedbackPanel.short': 'Enviar comentarios sobre el producto',
  'pref.enableFeedbackPanel.long':
    'Activa una herramienta que nuestro equipo de producto puede usar para solicitar ocasionalmente opiniones sobre Compass.',
  'pref.theme.short': 'Tema',
  'pref.shellFollowsCompassTheme.short':
    'Usar el tema de Compass en MongoDB Shell',
  'pref.shellFollowsCompassTheme.long':
    'Hace que la shell integrada siga el tema de Compass en lugar de usar siempre el modo oscuro.',
  'pref.browserCommandForOIDCAuth.short':
    'Comando del navegador para la autenticación',
  'pref.browserCommandForOIDCAuth.long':
    'Indica un comando de shell que se ejecuta para iniciar el navegador y autenticarse con el proveedor de identidad OIDC, ya sea para la conexión con el servidor o al iniciar sesión en tu cuenta de Atlas Cloud. Déjalo vacío para usar el navegador predeterminado.',
  'pref.showOIDCDeviceAuthFlow.short':
    'Mostrar la casilla del flujo de autenticación de dispositivo',
  'pref.showOIDCDeviceAuthFlow.long':
    'Muestra en el formulario de conexión una casilla para activar el flujo de autenticación de dispositivo en la autenticación OIDC del servidor MongoDB. Es un flujo menos seguro que sirve de alternativa cuando la autenticación mediante navegador no está disponible.',
  'pref.persistOIDCTokens.short': 'Mantener la sesión iniciada con OIDC',
  'pref.persistOIDCTokens.long':
    'Mantener la sesión iniciada al usar el mecanismo MONGODB-OIDC para la conexión con el servidor MongoDB. Los tokens de acceso se cifran con el llavero del sistema antes de almacenarse. Desactivar esta opción eliminará los tokens almacenados actualmente.',
  'pref.enableGenAIFeatures.short': 'Activar las funciones de IA',
  'pref.enableGenAIFeatures.long':
    'Permitir el uso de las funciones de IA de Compass que envían solicitudes a servicios de terceros.',
  'pref.enableGenAISampleDocumentPassing.short':
    'Activar el envío de valores de campo de ejemplo con las solicitudes de generación de consultas y agregaciones.',
  'pref.enableGenAISampleDocumentPassing.long':
    'Proporcionar valores de campo de ejemplo mejora los resultados de la IA.',
  'pref.enableGenAIToolCalling.short':
    'Activar las herramientas de solo lectura en el MongoDB Assistant',
  'pref.enableAutoEmbeddingPublicPreview.short':
    'Añade una interfaz para los índices de búsqueda vectorial con incrustación automática',
  'pref.enableAutoEmbeddingPrivatePreview.short':
    'Añade una interfaz para los índices de búsqueda vectorial con incrustación automática (vista previa privada)',
  'pref.enableAutoEmbeddingGaRelease.short':
    'Activar la versión GA de los índices de búsqueda vectorial con incrustación automática',
  'pref.enableSortedSearchIndexes.short':
    'Activar la sintaxis ordenada para el esquema de los índices de búsqueda',
};
