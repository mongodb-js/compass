import type { Catalog } from './translations';

// Texts of the MongoDB Assistant (compass-assistant) and of the generative AI
// features (compass-generative-ai). Prompts sent to the model are not
// translated. `{tool}` and `{link}` are replaced with rendered elements by the
// components. See ./translations.ts for the key conventions.

export const de: Catalog = {
  'assistant.atlasStatus.confirmTitle':
    'Möchtest du die Verbindung zu Atlas wirklich trennen?',
  'assistant.atlasStatus.confirmDescription':
    'Sobald Atlas getrennt ist, hast du keinen Kontext aus Atlas mehr.',
  'assistant.atlasStatus.disconnect': 'Trennen',
  'assistant.atlasStatus.disconnectAtlas': 'Atlas trennen',
  'assistant.atlasStatus.signedIn': 'Bei Atlas angemeldet',
  'assistant.atlasTool.checkResult': 'Atlas-Prüfergebnis:',
  'assistant.atlasTool.connect': 'Mit Atlas verbinden und {tool} ausführen?',
  'assistant.atlasTool.connectButton': 'Mit Atlas verbinden',
  'assistant.atlasTool.connecting':
    'Verbindung mit Atlas wird hergestellt, um {tool} auszuführen...',
  'assistant.atlasTool.readOnly':
    'Dies ist schreibgeschützt und ändert deinen Cluster nicht.',
  'assistant.atlasTool.skip': 'Überspringen',
  'assistant.chat.askQuestion': 'Stelle eine Frage',
  'assistant.chat.error':
    'Ein Fehler ist aufgetreten. Lösche den Chat, falls der Fehler weiterhin besteht.',
  'assistant.chat.title': 'MongoDB Assistant',
  'assistant.chat.welcome': 'Willkommen beim MongoDB Assistant!',
  'assistant.chat.welcomeHint':
    'Stelle eine beliebige Frage zu MongoDB und erhalte fachkundige Hilfe und Dokumentation.',
  'assistant.chatMessage.confirmRequest': 'Bitte bestätige deine Anfrage',
  'assistant.confirmation.cancel': 'Abbrechen',
  'assistant.confirmation.cancelled': 'Anfrage abgebrochen',
  'assistant.confirmation.confirm': 'Bestätigen',
  'assistant.confirmation.confirmed': 'Anfrage bestätigt',
  'assistant.drawer.clearChat': 'Chat löschen',
  'assistant.drawer.clearDescription':
    'Der aktuelle Chat wird gelöscht und der Chatverlauf kann nicht wiederhergestellt werden.',
  'assistant.drawer.clearTitle': 'Diesen Chat löschen?',
  'assistant.drawer.cueButton': 'Verstanden',
  'assistant.drawer.cueDescription':
    'KI-gestützter Assistent, der dich intelligent durch deine Datenbankaufgaben führt. Erhalte fachkundige MongoDB-Hilfe und optimiere deinen Arbeitsablauf direkt in {appName}.',
  'assistant.drawer.cueTitle': 'Wir stellen vor: MongoDB Assistant',
  'assistant.drawer.title': 'MongoDB Assistant',
  'assistant.followUp.suggestedPrompts': 'Vorgeschlagene Prompts',
  'assistant.suggested.label': 'Vorgeschlagene Aktionen',
  'assistant.suggested.modifyDelete':
    'Wie kann ich mehrere Dokumente auf einmal ändern oder löschen?',
  'assistant.suggested.queryPerformance':
    'Wie kann ich die Leistung meiner Abfrage in Compass verbessern?',
  'assistant.suggested.queryNoResults':
    'Warum liefert meine Abfrage keine Ergebnisse?',
  'assistant.suggested.exportQuery':
    'Wie kann ich den Code meiner Abfrage exportieren?',
  'assistant.suggested.whatIsPipeline': 'Was ist eine Aggregation-Pipeline?',
  'assistant.suggested.aggregationPerformance':
    'Wie kann ich die Leistung meiner Aggregation in Compass verbessern?',
  'assistant.suggested.aggNoResults':
    'Warum liefert meine Aggregation-Pipeline keine Ergebnisse?',
  'assistant.suggested.exportPipeline':
    'Wie kann ich den Code meiner Aggregation-Pipeline exportieren?',
  'assistant.suggested.dataModelingBestPractices':
    'Was sind bewährte Vorgehensweisen und Anti-Patterns bei der Datenmodellierung in MongoDB?',
  'assistant.suggested.visualizeRelationships':
    'Wie kann ich die Beziehungen zwischen Feldern in Compass visualisieren?',
  'assistant.suggested.exportSchema':
    'Wie kann ich das Schema meiner Collection exportieren?',
  'assistant.suggested.whatAreValidationRules': 'Was sind Validierungsregeln?',
  'assistant.suggested.whenValidation':
    'Wann ist es sinnvoll, Validierungsregeln festzulegen?',
  'assistant.suggested.jsonSchemaExamples':
    'Kannst du Beispiele für JSON Schema zur Validierung zeigen?',
  'assistant.suggested.planChanges':
    'Kann ich Änderungen an meinem Datenmodell planen, ohne die tatsächlichen Daten zu beeinflussen?',
  'assistant.suggested.shareModel':
    'Wie teile ich mein Compass-Datenmodell mit anderen?',
  'assistant.suggested.whatCanIDo':
    'Was kann ich mit MongoDB Compass machen und welche Tipps zur Nutzung gibt es?',
  'assistant.suggested.optimizePerf':
    'Wie kann ich die Leistung in MongoDB Compass optimieren?',
  'assistant.suggested.connect':
    'Wie verbinde ich mich mit meiner MongoDB-Bereitstellung?',
  'assistant.toolCall.arguments': 'Argumente',
  'assistant.toolCall.cancel': 'Abbrechen',
  'assistant.toolCall.cancelled': '{tool} abgebrochen',
  'assistant.toolCall.error': 'Fehler',
  'assistant.toolCall.ran': '{tool} ausgeführt',
  'assistant.toolCall.response': 'Antwort',
  'assistant.toolCall.run': '{tool} ausführen?',
  'assistant.toolCall.runButton': 'Ausführen',
  'assistant.toolCall.running': '{tool} wird ausgeführt',
  'assistant.toolToggle.availableTools': 'Verfügbare Tools',
  'assistant.toolToggle.configure': 'Tool-Aufrufe konfigurieren',
  'assistant.toolToggle.disabledDescription':
    'Diese sind derzeit deaktiviert. Aktiviere sie, um Daten mit natürlicher Sprache zu erkunden und Abfragen zu erzeugen.',
  'assistant.toolToggle.disabledForProject':
    'Diese sind für Projektbenutzer mit Datenzugriff deaktiviert. Projektinhaber können diese Funktion aktivieren in den',
  'assistant.toolToggle.enabledDescription':
    'Diese sind derzeit aktiviert und erfordern deine Genehmigung. Du kannst Daten mit natürlicher Sprache erkunden und Abfragen erzeugen.',
  'assistant.toolToggle.learnMore': 'Mehr erfahren',
  'assistant.toolToggle.projectSettings': 'Projekteinstellungen.',
  'assistant.toolToggle.readOnlyTools': 'Schreibgeschützte Tools',
  'assistant.toolToggle.tools': 'Tools',
  'assistant.toolsIntro.description':
    'Erkunde deine Daten mühelos mit natürlicher Sprache. Diese schreibgeschützten Tools nehmen nie Änderungen vor und laufen nur mit deiner Genehmigung.',
  'assistant.toolsIntro.dismiss': 'Schließen',
  'assistant.toolsIntro.learnMore': 'Mehr erfahren',
  'assistant.toolsIntro.new': 'Neu',
  'assistant.toolsIntro.settings':
    'Schalte sie für diesen Chat um oder verwalte sie in den Einstellungen.',
  'assistant.toolsIntro.settingsProject':
    'Schalte sie für diesen Chat um oder Projektinhaber können sie projektweit in den Projekteinstellungen verwalten.',
  'assistant.toolsIntro.title': 'Tools, um mit deinen Daten zu sprechen',
  'assistant.toolsIntro.viewSettings': 'Einstellungen anzeigen',
  'assistant.toolDescription.find':
    'Ruft bestimmte Dokumente ab, die deinen Suchkriterien entsprechen.',
  'assistant.toolDescription.aggregate':
    'Führt komplexe Datenverarbeitung, Gruppierungen und Berechnungen durch.',
  'assistant.toolDescription.count':
    'Gibt schnell die Gesamtzahl der Dokumente zurück, die zu einer Abfrage passen.',
  'assistant.toolDescription.list-databases':
    'Zeigt alle verfügbaren Datenbanken im verbundenen Cluster an.',
  'assistant.toolDescription.list-collections':
    'Zeigt alle Collections einer angegebenen Datenbank an.',
  'assistant.toolDescription.collection-schema':
    'Beschreibt die Schemastruktur einer Collection.',
  'assistant.toolDescription.collection-indexes':
    'Listet alle für eine Collection definierten Indizes auf.',
  'assistant.toolDescription.collection-storage-size':
    'Gibt Informationen zur Speichergröße einer Collection zurück.',
  'assistant.toolDescription.db-stats':
    'Liefert Datenbankstatistiken einschließlich Größe und Nutzung.',
  'assistant.toolDescription.explain':
    'Liefert Ausführungsstatistiken und Informationen zum Abfrageplan.',
  'assistant.toolDescription.mongodb-logs':
    'Gibt die zuletzt protokollierten mongod-Ereignisse zurück.',
  'assistant.toolDescription.get-current-query':
    'Ruft die aktuelle Abfrage aus der Abfrageleiste ab.',
  'assistant.toolDescription.get-current-pipeline':
    'Ruft die aktuelle Pipeline aus dem Aggregation-Builder ab.',
  'assistant.toolDescription.atlas-connection-error-debugger':
    'Dient zur Fehlersuche bei einem fehlgeschlagenen Verbindungsaufbau von Compass zu einem Atlas-Cluster. Liefert Diagnosen auf Atlas-Seite (Cluster-Status, IP-Zugriffsliste).',
  'assistant.toolResult.cluster': 'Cluster',
  'assistant.toolResult.state': 'Status',
  'assistant.toolResult.ipAccess': 'IP-Zugriff',
  'assistant.toolResult.ipAllowed': 'Client-IP erlaubt',
  'assistant.toolResult.ipNotAllowed': 'Client-IP nicht erlaubt',
  'assistant.toolResult.couldNotConfirm': 'Konnte nicht bestätigt werden',

  'genai.entry.generateQuery': 'Abfrage generieren',
  'genai.entry.generateAggregation': 'Aggregation generieren',
  'genai.error.generic':
    'Leider konnte die Abfrage nicht generiert werden. Bitte versuche es erneut. Wenn der Fehler weiterhin besteht, ändere deinen Prompt.',
  'genai.error.inputTooLong':
    'Deine Eingabe überschreitet offenbar die zulässige Länge. Bitte kürze sie und sende deinen Prompt erneut.',
  'genai.error.notSupported':
    'Diese Version von Compass ist leider nicht mehr zum Generieren von Abfragen geeignet. Bitte aktualisiere auf die neueste Version, um alle Funktionen zu nutzen.',
  'genai.error.promptTooLong':
    'Deine Anfrage ist leider zu groß. Verwende einen kürzeren Prompt oder nutze diese Funktion für eine Collection mit kleineren Dokumenten.',
  'genai.error.timeout':
    'Das Generieren deiner Abfrage hat zu lange gedauert. Bitte prüfe deine Verbindung und versuche es erneut. Wenn das Problem weiterhin besteht, wende dich an unser Support-Team.',
  'genai.error.tooManyRequests':
    'Wir erhalten leider zu viele Anfragen in kurzer Zeit. Bitte warte einige Minuten und versuche es erneut.',
  'genai.feedback.negative': 'Negatives Feedback senden',
  'genai.feedback.placeholderNegative':
    'Was könnte an der generierten Abfrage besser sein?',
  'genai.feedback.placeholderPositive':
    'Was gefällt dir an der generierten Abfrage?',
  'genai.feedback.positive': 'Positives Feedback senden',
  'genai.feedback.provide': 'Feedback geben',
  'genai.feedback.success': 'Erfolg!',
  'genai.guideCue.gotIt': 'Verstanden',
  'genai.input.aggregationGeneratedDescription':
    'Deine Abfrage erfordert Stages aus dem Aggregation Framework von MongoDB. Arbeite im Aggregation Pipeline Builder daran weiter',
  'genai.input.aggregationGeneratedTitle': 'Aggregation generiert',
  'genai.input.ariaLabel':
    'Gib eine Abfrage in einfachem Text ein, die die KI in die MongoDB-Abfragesprache übersetzt.',
  'genai.input.cancel': 'Abbrechen',
  'genai.input.clearPrompt': 'Prompt löschen',
  'genai.input.close': 'KI-Hilfe schließen',
  'genai.input.generate': 'Generieren',
  'genai.input.noContentDescription':
    'Die generierte Abfrage liefert alle Dokumente deiner Collection. Passe deinen Prompt an und sende ihn erneut, um die Ergebnisse einzugrenzen.',
  'genai.input.noContentTitle': 'Kein Inhalt generiert',
  'genai.input.placeholder':
    'Beschreibe, was gefunden werden soll (z. B. Filme aus dem Jahr 2000), oder füge eine Abfrage in einer anderen Sprache ein (SQL, Java usw.)',
  'genai.optin.cloudDisabled':
    'KI-Funktionen sind für Projektbenutzer mit Datenzugriff deaktiviert. Projektinhaber können die KI-Funktionen von Data Explorer aktivieren in den {link}.',
  'genai.optin.cloudEnabled':
    'KI-Funktionen sind für Projektbenutzer mit Datenzugriff aktiviert. Projektinhaber können die KI-Funktionen von Data Explorer deaktivieren in den {link}.',
  'genai.optin.cloudSamplesDisabled':
    'KI-Funktionen sind für Projektbenutzer mit Datenzugriff aktiviert. Projektinhaber können diese Funktionen deaktivieren oder das Senden von Beispielfeldwerten in den KI-Funktionen von Data Explorer aktivieren, um deren Genauigkeit zu verbessern, in den {link}.',
  'genai.optin.description':
    'KI-gestützte Funktionen in {product} bieten dir intelligente Werkzeuge, um mit MongoDB schneller und smarter zu arbeiten.',
  'genai.optin.disclaimerAfter':
    'für weitere Informationen. Fahre fort, um alle KI-gestützten Funktionen in {product} zu aktivieren.',
  'genai.optin.disclaimerBefore':
    'Mit generativer KI arbeitende Funktionen in {product} können ungenaue Antworten liefern. Bitte lies unsere',
  'genai.optin.faq': 'FAQ',
  'genai.optin.notNow': 'Jetzt nicht',
  'genai.optin.projectSettings': 'Projekteinstellungen',
  'genai.optin.title': 'KI-Funktionen in {product} verwenden',
  'genai.optin.useAiFeatures': 'KI-Funktionen verwenden',
  'genai.service.notEnabled':
    'Die KI-Funktionen von Compass sind derzeit nicht aktiviert. Bitte versuche es später erneut.',
  'genai.service.schemaTooLarge':
    'Das angegebene Schema ist zu groß für die Verarbeitung. Bitte verkleinere das Schema und versuche es erneut.',
  'assistant.prompts.explainPlan.displayText':
    'Interpretiere diese Ausgabe des Ausführungsplans für mich.',
  'assistant.prompts.explainPlan.confirmation':
    'Metadaten des Ausführungsplans, einschließlich der ursprünglichen Abfrage, können zur Bearbeitung deiner Anfrage verwendet werden.',
  'assistant.prompts.insights.aggregationWithoutIndex':
    'Hilf mir zu verstehen, wie sich das Ausführen von Aggregationen ohne Index auf die Leistung auswirkt.',
  'assistant.prompts.insights.queryWithoutIndex':
    'Hilf mir zu verstehen, wie sich das Ausführen von Abfragen ohne Index auf die Leistung auswirkt.',
  'assistant.prompts.insights.rerankFirstStage':
    'Was sind die Best Practices für die Verwendung von $rerank?',
  'assistant.prompts.debugSearchError.displayText':
    'Diagnostiziere, warum meine Aggregations-Pipeline fehlschlägt, und hilf mir bei der Fehlersuche.',
  'assistant.prompts.analyzeOutput.top3':
    'Analysiere die Top-3-Ergebnisse nach der $search-Stage.',
  'assistant.prompts.analyzeOutput.two':
    'Analysiere diese 2 Ergebnisse nach der $search-Stage.',
  'assistant.prompts.analyzeOutput.one':
    'Analysiere dieses Ergebnis nach der $search-Stage.',
  'assistant.prompts.analyzeOutput.confirmation':
    'Dokumente aus den Suchergebnissen, einschließlich Dokumentfeldern und Bewertungsdetails, können zur Bearbeitung deiner Anfrage verwendet werden.',
  'assistant.prompts.connectionError.displayText':
    'Diagnostiziere, warum meine {product}-Verbindung fehlschlägt, und hilf mir bei der Fehlersuche.',
  'assistant.prompts.diagnoseSearchStage.displayText':
    'Diagnostiziere, warum meine Aggregations-Pipeline keine Ergebnisse liefert.',
  'assistant.preset.nonGenuineWarning':
    'Du bist mit **einem nicht originalen MongoDB-Server** verbunden. Der MongoDB Assistant liefert für nicht originale Hosts keine zuverlässigen Hinweise. Wir empfehlen, echte MongoDB-Deployments zu verwenden, um unsere Entwicklertools voll auszuschöpfen.',
};

export const fr: Catalog = {
  'assistant.atlasStatus.confirmTitle':
    'Voulez-vous vraiment déconnecter Atlas ?',
  'assistant.atlasStatus.confirmDescription':
    "Une fois Atlas déconnecté, vous n'aurez plus le contexte d'Atlas.",
  'assistant.atlasStatus.disconnect': 'Déconnecter',
  'assistant.atlasStatus.disconnectAtlas': 'Déconnecter Atlas',
  'assistant.atlasStatus.signedIn': 'Connecté à Atlas',
  'assistant.atlasTool.checkResult': "Résultat de la vérification d'Atlas :",
  'assistant.atlasTool.connect': 'Se connecter à Atlas et exécuter {tool} ?',
  'assistant.atlasTool.connectButton': 'Se connecter à Atlas',
  'assistant.atlasTool.connecting': 'Connexion à Atlas pour exécuter {tool}...',
  'assistant.atlasTool.readOnly':
    'Cette action est en lecture seule et ne modifiera pas votre cluster.',
  'assistant.atlasTool.skip': 'Ignorer',
  'assistant.chat.askQuestion': 'Posez une question',
  'assistant.chat.error':
    "Une erreur s'est produite. Essayez d'effacer le chat si l'erreur persiste.",
  'assistant.chat.title': 'MongoDB Assistant',
  'assistant.chat.welcome': "Bienvenue dans l'assistant MongoDB !",
  'assistant.chat.welcomeHint':
    "Posez n'importe quelle question sur MongoDB pour obtenir des conseils d'expert et de la documentation.",
  'assistant.chatMessage.confirmRequest': 'Veuillez confirmer votre demande',
  'assistant.confirmation.cancel': 'Annuler',
  'assistant.confirmation.cancelled': 'Demande annulée',
  'assistant.confirmation.confirm': 'Confirmer',
  'assistant.confirmation.confirmed': 'Demande confirmée',
  'assistant.drawer.clearChat': 'Effacer le chat',
  'assistant.drawer.clearDescription':
    "Le chat actuel sera effacé et l'historique du chat ne pourra pas être récupéré.",
  'assistant.drawer.clearTitle': 'Effacer ce chat ?',
  'assistant.drawer.cueButton': "J'ai compris",
  'assistant.drawer.cueDescription':
    "Un assistant basé sur l'IA pour vous guider intelligemment dans vos tâches de base de données. Obtenez l'aide d'experts MongoDB et simplifiez votre flux de travail directement dans {appName}.",
  'assistant.drawer.cueTitle': 'Découvrez MongoDB Assistant',
  'assistant.drawer.title': 'MongoDB Assistant',
  'assistant.followUp.suggestedPrompts': 'Prompts suggérés',
  'assistant.suggested.label': 'Actions suggérées',
  'assistant.suggested.modifyDelete':
    'Comment puis-je modifier ou supprimer plusieurs documents à la fois ?',
  'assistant.suggested.queryPerformance':
    'Comment puis-je améliorer les performances de ma requête dans Compass ?',
  'assistant.suggested.queryNoResults':
    'Pourquoi ma requête ne renvoie-t-elle aucun résultat ?',
  'assistant.suggested.exportQuery':
    'Comment puis-je exporter le code de ma requête ?',
  'assistant.suggested.whatIsPipeline':
    "Qu'est-ce qu'un pipeline d'agrégation ?",
  'assistant.suggested.aggregationPerformance':
    'Comment puis-je améliorer les performances de mon agrégation dans Compass ?',
  'assistant.suggested.aggNoResults':
    "Pourquoi mon pipeline d'agrégation ne renvoie-t-il aucun résultat ?",
  'assistant.suggested.exportPipeline':
    "Comment puis-je exporter le code de mon pipeline d'agrégation ?",
  'assistant.suggested.dataModelingBestPractices':
    'Quelles sont les bonnes pratiques et les anti-modèles de modélisation des données dans MongoDB ?',
  'assistant.suggested.visualizeRelationships':
    'Comment puis-je visualiser les relations entre les champs dans Compass ?',
  'assistant.suggested.exportSchema':
    'Comment puis-je exporter le schéma de ma collection ?',
  'assistant.suggested.whatAreValidationRules':
    'Que sont les règles de validation ?',
  'assistant.suggested.whenValidation':
    'Quand est-il utile de définir des règles de validation ?',
  'assistant.suggested.jsonSchemaExamples':
    'Pouvez-vous montrer des exemples de JSON Schema pour la validation ?',
  'assistant.suggested.planChanges':
    'Puis-je planifier des modifications de mon modèle de données sans affecter les données réelles ?',
  'assistant.suggested.shareModel':
    'Comment partager mon modèle de données Compass avec d’autres personnes ?',
  'assistant.suggested.whatCanIDo':
    "Que puis-je faire avec MongoDB Compass et quels sont quelques conseils d'utilisation ?",
  'assistant.suggested.optimizePerf':
    'Comment puis-je optimiser les performances dans MongoDB Compass ?',
  'assistant.suggested.connect':
    'Comment me connecter à mon déploiement MongoDB ?',
  'assistant.toolCall.arguments': 'Arguments',
  'assistant.toolCall.cancel': 'Annuler',
  'assistant.toolCall.cancelled': '{tool} annulé',
  'assistant.toolCall.error': 'Erreur',
  'assistant.toolCall.ran': '{tool} exécuté',
  'assistant.toolCall.response': 'Réponse',
  'assistant.toolCall.run': 'Exécuter {tool} ?',
  'assistant.toolCall.runButton': 'Exécuter',
  'assistant.toolCall.running': 'Exécution de {tool}',
  'assistant.toolToggle.availableTools': 'Outils disponibles',
  'assistant.toolToggle.configure': "Configurer l'appel d'outils",
  'assistant.toolToggle.disabledDescription':
    'Ils sont actuellement désactivés. Activez-les pour explorer les données et générer des requêtes en langage naturel.',
  'assistant.toolToggle.disabledForProject':
    'Ils sont désactivés pour les utilisateurs du projet ayant accès aux données. Les propriétaires du projet peuvent activer cette fonctionnalité dans les',
  'assistant.toolToggle.enabledDescription':
    'Ils sont actuellement activés et nécessitent votre approbation. Vous pouvez utiliser le langage naturel pour explorer les données et générer des requêtes.',
  'assistant.toolToggle.learnMore': 'En savoir plus',
  'assistant.toolToggle.projectSettings': 'paramètres du projet.',
  'assistant.toolToggle.readOnlyTools': 'Outils en lecture seule',
  'assistant.toolToggle.tools': 'Outils',
  'assistant.toolsIntro.description':
    "Explorez vos données sans effort en langage naturel. Ces outils en lecture seule n'apportent jamais de modifications et ne s'exécutent qu'avec votre approbation.",
  'assistant.toolsIntro.dismiss': 'Fermer',
  'assistant.toolsIntro.learnMore': 'En savoir plus',
  'assistant.toolsIntro.new': 'Nouveau',
  'assistant.toolsIntro.settings':
    'Activez-les pour ce chat ou gérez-les dans les paramètres.',
  'assistant.toolsIntro.settingsProject':
    "Activez-les pour ce chat ou, en tant que propriétaire du projet, gérez-les pour l'ensemble du projet dans les paramètres du projet.",
  'assistant.toolsIntro.title': 'Des outils pour dialoguer avec vos données',
  'assistant.toolsIntro.viewSettings': 'Afficher les paramètres',
  'assistant.toolDescription.find':
    'Récupère des documents spécifiques correspondant à vos critères de recherche.',
  'assistant.toolDescription.aggregate':
    'Effectue des traitements de données complexes, des regroupements et des calculs.',
  'assistant.toolDescription.count':
    'Renvoie rapidement le nombre total de documents correspondant à une requête.',
  'assistant.toolDescription.list-databases':
    'Affiche toutes les bases de données disponibles dans le cluster connecté.',
  'assistant.toolDescription.list-collections':
    "Affiche toutes les collections d'une base de données donnée.",
  'assistant.toolDescription.collection-schema':
    "Décrit la structure du schéma d'une collection.",
  'assistant.toolDescription.collection-indexes':
    'Liste tous les index définis sur une collection.',
  'assistant.toolDescription.collection-storage-size':
    "Renvoie les informations sur la taille de stockage d'une collection.",
  'assistant.toolDescription.db-stats':
    "Fournit des statistiques de base de données, dont la taille et l'utilisation.",
  'assistant.toolDescription.explain':
    "Fournit des statistiques d'exécution et des informations sur le plan de requête.",
  'assistant.toolDescription.mongodb-logs':
    'Renvoie les événements mongod les plus récemment journalisés.',
  'assistant.toolDescription.get-current-query':
    'Récupère la requête actuelle depuis la barre de requête.',
  'assistant.toolDescription.get-current-pipeline':
    "Récupère le pipeline actuel depuis le générateur d'agrégation.",
  'assistant.toolDescription.atlas-connection-error-debugger':
    "À utiliser pour diagnostiquer un échec de connexion de Compass à un cluster Atlas. Renvoie des diagnostics côté Atlas (état du cluster, liste d'accès IP).",
  'assistant.toolResult.cluster': 'Cluster',
  'assistant.toolResult.state': 'État',
  'assistant.toolResult.ipAccess': 'Accès IP',
  'assistant.toolResult.ipAllowed': 'IP du client autorisée',
  'assistant.toolResult.ipNotAllowed': 'IP du client non autorisée',
  'assistant.toolResult.couldNotConfirm': 'Impossible de confirmer',

  'genai.entry.generateQuery': 'Générer une requête',
  'genai.entry.generateAggregation': 'Générer une agrégation',
  'genai.error.generic':
    "Désolé, nous n'avons pas pu générer la requête. Veuillez réessayer. Si l'erreur persiste, essayez de modifier votre prompt.",
  'genai.error.inputTooLong':
    'Votre saisie dépasse la longueur autorisée. Veuillez la raccourcir et envoyer à nouveau votre prompt.',
  'genai.error.notSupported':
    'Désolé, cette version de Compass ne permet plus de générer des requêtes. Veuillez passer à la dernière version pour accéder à toutes les fonctionnalités.',
  'genai.error.promptTooLong':
    'Désolé, votre demande est trop volumineuse. Veuillez utiliser un prompt plus court ou essayer cette fonctionnalité sur une collection contenant des documents plus petits.',
  'genai.error.timeout':
    "La génération de votre requête a pris trop de temps. Veuillez vérifier votre connexion et réessayer. Si le problème persiste, contactez notre équipe d'assistance.",
  'genai.error.tooManyRequests':
    'Désolé, nous recevons trop de demandes en peu de temps. Veuillez patienter quelques minutes et réessayer.',
  'genai.feedback.negative': 'Envoyer un avis négatif',
  'genai.feedback.placeholderNegative':
    'Que pourrait-on améliorer dans la requête générée ?',
  'genai.feedback.placeholderPositive':
    "Qu'appréciez-vous dans la requête générée ?",
  'genai.feedback.positive': 'Envoyer un avis positif',
  'genai.feedback.provide': 'Donner votre avis',
  'genai.feedback.success': 'Succès !',
  'genai.guideCue.gotIt': "J'ai compris",
  'genai.input.aggregationGeneratedDescription':
    "Votre requête nécessite des étapes du framework d'agrégation de MongoDB. Continuez à travailler dessus dans notre Aggregation Pipeline Builder",
  'genai.input.aggregationGeneratedTitle': 'Agrégation générée',
  'genai.input.ariaLabel':
    "Saisissez une requête en texte brut que l'IA traduira dans le langage de requête MongoDB.",
  'genai.input.cancel': 'Annuler',
  'genai.input.clearPrompt': 'Effacer le prompt',
  'genai.input.close': "Fermer l'aide IA",
  'genai.input.generate': 'Générer',
  'genai.input.noContentDescription':
    'La requête générée renvoie tous les documents de votre collection. Pensez à ajuster votre prompt et à le renvoyer pour affiner les résultats.',
  'genai.input.noContentTitle': 'Aucun contenu généré',
  'genai.input.placeholder':
    "Dites-nous ce qu'il faut trouver (par ex. des films de 2000) ou collez une requête dans un autre langage (SQL, Java, etc.)",
  'genai.optin.cloudDisabled':
    "Les fonctionnalités d'IA sont désactivées pour les utilisateurs du projet ayant accès aux données. Les propriétaires du projet peuvent activer les fonctionnalités d'IA de Data Explorer dans les {link}.",
  'genai.optin.cloudEnabled':
    "Les fonctionnalités d'IA sont activées pour les utilisateurs du projet ayant accès aux données. Les propriétaires du projet peuvent désactiver les fonctionnalités d'IA de Data Explorer dans les {link}.",
  'genai.optin.cloudSamplesDisabled':
    "Les fonctionnalités d'IA sont activées pour les utilisateurs du projet ayant accès aux données. Les propriétaires du projet peuvent désactiver ces fonctionnalités ou activer l'envoi de valeurs de champs d'exemple dans les fonctionnalités d'IA de Data Explorer afin d'en améliorer la précision, dans les {link}.",
  'genai.optin.description':
    "Les fonctionnalités basées sur l'IA de {product} offrent aux utilisateurs un ensemble d'outils intelligents pour développer plus vite et mieux avec MongoDB.",
  'genai.optin.disclaimerAfter':
    "pour plus d'informations. Continuez pour activer toutes les fonctionnalités basées sur l'IA dans {product}.",
  'genai.optin.disclaimerBefore':
    "Les fonctionnalités de {product} reposant sur l'IA générative peuvent produire des réponses inexactes. Veuillez consulter notre",
  'genai.optin.faq': 'FAQ',
  'genai.optin.notNow': 'Pas maintenant',
  'genai.optin.projectSettings': 'paramètres du projet',
  'genai.optin.title': "Utiliser les fonctionnalités d'IA dans {product}",
  'genai.optin.useAiFeatures': "Utiliser les fonctionnalités d'IA",
  'genai.service.notEnabled':
    "Les fonctionnalités d'IA de Compass ne sont pas activées pour le moment. Veuillez réessayer plus tard.",
  'genai.service.schemaTooLarge':
    'Le schéma fourni est trop volumineux pour être traité. Veuillez réduire sa taille et réessayer.',
  'assistant.prompts.explainPlan.displayText':
    'Interprète cette sortie du plan d’exécution pour moi.',
  'assistant.prompts.explainPlan.confirmation':
    'Les métadonnées du plan d’exécution, y compris la requête d’origine, peuvent être utilisées pour traiter votre demande.',
  'assistant.prompts.insights.aggregationWithoutIndex':
    'Aide-moi à comprendre l’impact sur les performances de l’exécution d’agrégations sans index.',
  'assistant.prompts.insights.queryWithoutIndex':
    'Aide-moi à comprendre l’impact sur les performances de l’exécution de requêtes sans index.',
  'assistant.prompts.insights.rerankFirstStage':
    'Quelles sont les bonnes pratiques pour utiliser $rerank ?',
  'assistant.prompts.debugSearchError.displayText':
    'Diagnostique pourquoi mon pipeline d’agrégation échoue et aide-moi à le déboguer.',
  'assistant.prompts.analyzeOutput.top3':
    'Analyse les 3 premiers résultats après l’étape $search.',
  'assistant.prompts.analyzeOutput.two':
    'Analyse ces 2 résultats après l’étape $search.',
  'assistant.prompts.analyzeOutput.one':
    'Analyse ce résultat après l’étape $search.',
  'assistant.prompts.analyzeOutput.confirmation':
    'Les documents des résultats de recherche, y compris les champs des documents et les détails du score, peuvent être utilisés pour traiter votre demande.',
  'assistant.prompts.connectionError.displayText':
    'Diagnostique pourquoi ma connexion {product} échoue et aide-moi à la déboguer.',
  'assistant.prompts.diagnoseSearchStage.displayText':
    'Diagnostique pourquoi mon pipeline d’agrégation ne renvoie aucun résultat.',
  'assistant.preset.nonGenuineWarning':
    'Vous êtes connecté à **un serveur MongoDB non authentique**. MongoDB Assistant ne fournit pas de conseils fiables pour les hôtes non authentiques, et nous encourageons les utilisateurs à utiliser de véritables déploiements MongoDB afin de tirer pleinement parti de nos outils pour développeurs.',
};

export const es: Catalog = {
  'assistant.atlasStatus.confirmTitle':
    '¿Seguro que quieres desconectar Atlas?',
  'assistant.atlasStatus.confirmDescription':
    'Una vez desconectado Atlas, ya no tendrás el contexto de Atlas.',
  'assistant.atlasStatus.disconnect': 'Desconectar',
  'assistant.atlasStatus.disconnectAtlas': 'Desconectar Atlas',
  'assistant.atlasStatus.signedIn': 'Sesión iniciada en Atlas',
  'assistant.atlasTool.checkResult': 'Resultado de la comprobación de Atlas:',
  'assistant.atlasTool.connect': '¿Conectar con Atlas y ejecutar {tool}?',
  'assistant.atlasTool.connectButton': 'Conectar con Atlas',
  'assistant.atlasTool.connecting':
    'Conectando con Atlas para ejecutar {tool}...',
  'assistant.atlasTool.readOnly':
    'Esto es de solo lectura y no modificará tu clúster.',
  'assistant.atlasTool.skip': 'Omitir',
  'assistant.chat.askQuestion': 'Haz una pregunta',
  'assistant.chat.error':
    'Se ha producido un error. Prueba a borrar el chat si el error persiste.',
  'assistant.chat.title': 'MongoDB Assistant',
  'assistant.chat.welcome': '¡Te damos la bienvenida a MongoDB Assistant!',
  'assistant.chat.welcomeHint':
    'Haz cualquier pregunta sobre MongoDB para recibir orientación experta y documentación.',
  'assistant.chatMessage.confirmRequest': 'Confirma tu solicitud',
  'assistant.confirmation.cancel': 'Cancelar',
  'assistant.confirmation.cancelled': 'Solicitud cancelada',
  'assistant.confirmation.confirm': 'Confirmar',
  'assistant.confirmation.confirmed': 'Solicitud confirmada',
  'assistant.drawer.clearChat': 'Borrar chat',
  'assistant.drawer.clearDescription':
    'Se borrará el chat actual y el historial no se podrá recuperar.',
  'assistant.drawer.clearTitle': '¿Borrar este chat?',
  'assistant.drawer.cueButton': 'Entendido',
  'assistant.drawer.cueDescription':
    'Asistente con IA que te guía de forma inteligente en tus tareas de base de datos. Obtén ayuda experta de MongoDB y agiliza tu flujo de trabajo directamente en {appName}.',
  'assistant.drawer.cueTitle': 'Presentamos MongoDB Assistant',
  'assistant.drawer.title': 'MongoDB Assistant',
  'assistant.followUp.suggestedPrompts': 'Prompts sugeridos',
  'assistant.suggested.label': 'Acciones sugeridas',
  'assistant.suggested.modifyDelete':
    '¿Cómo puedo modificar o eliminar varios documentos a la vez?',
  'assistant.suggested.queryPerformance':
    '¿Cómo puedo mejorar el rendimiento de mi consulta en Compass?',
  'assistant.suggested.queryNoResults':
    '¿Por qué mi consulta no devuelve resultados?',
  'assistant.suggested.exportQuery':
    '¿Cómo puedo exportar el código de mi consulta?',
  'assistant.suggested.whatIsPipeline': '¿Qué es un pipeline de agregación?',
  'assistant.suggested.aggregationPerformance':
    '¿Cómo puedo mejorar el rendimiento de mi agregación en Compass?',
  'assistant.suggested.aggNoResults':
    '¿Por qué mi pipeline de agregación no devuelve resultados?',
  'assistant.suggested.exportPipeline':
    '¿Cómo puedo exportar el código de mi pipeline de agregación?',
  'assistant.suggested.dataModelingBestPractices':
    '¿Cuáles son algunas de las mejores prácticas y antipatrones del modelado de datos en MongoDB?',
  'assistant.suggested.visualizeRelationships':
    '¿Cómo puedo visualizar las relaciones entre campos en Compass?',
  'assistant.suggested.exportSchema':
    '¿Cómo puedo exportar el esquema de mi colección?',
  'assistant.suggested.whatAreValidationRules':
    '¿Qué son las reglas de validación?',
  'assistant.suggested.whenValidation':
    '¿Cuándo es útil establecer reglas de validación?',
  'assistant.suggested.jsonSchemaExamples':
    '¿Puedes mostrar ejemplos de JSON Schema para la validación?',
  'assistant.suggested.planChanges':
    '¿Puedo planificar cambios en mi modelo de datos sin afectar a los datos reales?',
  'assistant.suggested.shareModel':
    '¿Cómo comparto mi modelo de datos de Compass con otras personas?',
  'assistant.suggested.whatCanIDo':
    '¿Qué puedo hacer con MongoDB Compass y qué consejos de uso hay?',
  'assistant.suggested.optimizePerf':
    '¿Cómo puedo optimizar el rendimiento en MongoDB Compass?',
  'assistant.suggested.connect':
    '¿Cómo me conecto a mi implementación de MongoDB?',
  'assistant.toolCall.arguments': 'Argumentos',
  'assistant.toolCall.cancel': 'Cancelar',
  'assistant.toolCall.cancelled': '{tool} cancelado',
  'assistant.toolCall.error': 'Error',
  'assistant.toolCall.ran': '{tool} ejecutado',
  'assistant.toolCall.response': 'Respuesta',
  'assistant.toolCall.run': '¿Ejecutar {tool}?',
  'assistant.toolCall.runButton': 'Ejecutar',
  'assistant.toolCall.running': 'Ejecutando {tool}',
  'assistant.toolToggle.availableTools': 'Herramientas disponibles',
  'assistant.toolToggle.configure': 'Configurar llamadas a herramientas',
  'assistant.toolToggle.disabledDescription':
    'Actualmente están desactivadas. Actívalas para explorar datos y generar consultas con lenguaje natural.',
  'assistant.toolToggle.disabledForProject':
    'Están desactivadas para los usuarios del proyecto con acceso a los datos. Los propietarios del proyecto pueden activar esta función en la',
  'assistant.toolToggle.enabledDescription':
    'Actualmente están activadas y requieren aprobación. Puedes usar lenguaje natural para explorar datos y generar consultas.',
  'assistant.toolToggle.learnMore': 'Más información',
  'assistant.toolToggle.projectSettings': 'configuración del proyecto.',
  'assistant.toolToggle.readOnlyTools': 'Herramientas de solo lectura',
  'assistant.toolToggle.tools': 'Herramientas',
  'assistant.toolsIntro.description':
    'Explora tus datos sin esfuerzo con lenguaje natural. Estas herramientas de solo lectura nunca realizan cambios y solo se ejecutan con tu aprobación.',
  'assistant.toolsIntro.dismiss': 'Cerrar',
  'assistant.toolsIntro.learnMore': 'Más información',
  'assistant.toolsIntro.new': 'Nuevo',
  'assistant.toolsIntro.settings':
    'Actívalas o desactívalas para este chat o gestiónalas en la configuración.',
  'assistant.toolsIntro.settingsProject':
    'Actívalas o desactívalas para este chat, o los propietarios del proyecto pueden gestionarlas para todo el proyecto en la configuración del proyecto.',
  'assistant.toolsIntro.title': 'Herramientas para hablar con tus datos',
  'assistant.toolsIntro.viewSettings': 'Ver configuración',
  'assistant.toolDescription.find':
    'Recupera documentos concretos que coinciden con tus criterios de búsqueda.',
  'assistant.toolDescription.aggregate':
    'Realiza procesamiento de datos complejo, agrupaciones y cálculos.',
  'assistant.toolDescription.count':
    'Devuelve rápidamente el número total de documentos que coinciden con una consulta.',
  'assistant.toolDescription.list-databases':
    'Muestra todas las bases de datos disponibles en el clúster conectado.',
  'assistant.toolDescription.list-collections':
    'Muestra todas las colecciones de una base de datos concreta.',
  'assistant.toolDescription.collection-schema':
    'Describe la estructura del esquema de una colección.',
  'assistant.toolDescription.collection-indexes':
    'Enumera todos los índices definidos en una colección.',
  'assistant.toolDescription.collection-storage-size':
    'Devuelve la información del tamaño de almacenamiento de una colección.',
  'assistant.toolDescription.db-stats':
    'Proporciona estadísticas de la base de datos, incluidos tamaño y uso.',
  'assistant.toolDescription.explain':
    'Proporciona estadísticas de ejecución e información del plan de consulta.',
  'assistant.toolDescription.mongodb-logs':
    'Devuelve los eventos de mongod registrados más recientemente.',
  'assistant.toolDescription.get-current-query':
    'Obtiene la consulta actual de la barra de consultas.',
  'assistant.toolDescription.get-current-pipeline':
    'Obtiene el pipeline actual del generador de agregaciones.',
  'assistant.toolDescription.atlas-connection-error-debugger':
    'Se usa para depurar un fallo de conexión de Compass a un clúster de Atlas. Devuelve diagnósticos del lado de Atlas (estado del clúster, lista de acceso IP).',
  'assistant.toolResult.cluster': 'Clúster',
  'assistant.toolResult.state': 'Estado',
  'assistant.toolResult.ipAccess': 'Acceso IP',
  'assistant.toolResult.ipAllowed': 'IP del cliente permitida',
  'assistant.toolResult.ipNotAllowed': 'IP del cliente no permitida',
  'assistant.toolResult.couldNotConfirm': 'No se pudo confirmar',

  'genai.entry.generateQuery': 'Generar consulta',
  'genai.entry.generateAggregation': 'Generar agregación',
  'genai.error.generic':
    'Lo sentimos, no hemos podido generar la consulta. Inténtalo de nuevo. Si el error persiste, prueba a cambiar tu prompt.',
  'genai.error.inputTooLong':
    'Parece que tu entrada supera la longitud permitida. Redúcela y envía tu prompt de nuevo.',
  'genai.error.notSupported':
    'Lo sentimos, esta versión de Compass ya no es adecuada para generar consultas. Actualiza a la última versión para acceder a todas las funciones.',
  'genai.error.promptTooLong':
    'Lo sentimos, tu solicitud es demasiado grande. Usa un prompt más pequeño o prueba esta función en una colección con documentos más pequeños.',
  'genai.error.timeout':
    'Generar tu consulta ha tardado demasiado. Comprueba tu conexión e inténtalo de nuevo. Si el problema persiste, ponte en contacto con nuestro equipo de soporte.',
  'genai.error.tooManyRequests':
    'Lo sentimos, estamos recibiendo demasiadas solicitudes en poco tiempo. Espera unos minutos e inténtalo de nuevo.',
  'genai.feedback.negative': 'Enviar comentarios negativos',
  'genai.feedback.placeholderNegative':
    '¿Qué se podría mejorar de la consulta generada?',
  'genai.feedback.placeholderPositive':
    '¿Qué te gusta de la consulta generada?',
  'genai.feedback.positive': 'Enviar comentarios positivos',
  'genai.feedback.provide': 'Enviar comentarios',
  'genai.feedback.success': '¡Listo!',
  'genai.guideCue.gotIt': 'Entendido',
  'genai.input.aggregationGeneratedDescription':
    'Tu consulta requiere etapas del framework de agregación de MongoDB. Sigue trabajando en ella en nuestro Aggregation Pipeline Builder',
  'genai.input.aggregationGeneratedTitle': 'Agregación generada',
  'genai.input.ariaLabel':
    'Escribe una consulta en texto sin formato que la IA traducirá al lenguaje de consultas de MongoDB.',
  'genai.input.cancel': 'Cancelar',
  'genai.input.clearPrompt': 'Borrar prompt',
  'genai.input.close': 'Cerrar la ayuda de IA',
  'genai.input.generate': 'Generar',
  'genai.input.noContentDescription':
    'La consulta generada devuelve todos los documentos de tu colección. Considera ajustar tu prompt y volver a enviarlo para acotar los resultados.',
  'genai.input.noContentTitle': 'No se ha generado contenido',
  'genai.input.placeholder':
    'Dinos qué buscar (p. ej., películas del año 2000) o pega una consulta en otro lenguaje (SQL, Java, etc.)',
  'genai.optin.cloudDisabled':
    'Las funciones de IA están desactivadas para los usuarios del proyecto con acceso a los datos. Los propietarios del proyecto pueden activar las funciones de IA de Data Explorer en la {link}.',
  'genai.optin.cloudEnabled':
    'Las funciones de IA están activadas para los usuarios del proyecto con acceso a los datos. Los propietarios del proyecto pueden desactivar las funciones de IA de Data Explorer en la {link}.',
  'genai.optin.cloudSamplesDisabled':
    'Las funciones de IA están activadas para los usuarios del proyecto con acceso a los datos. Los propietarios del proyecto pueden desactivar estas funciones o activar el envío de valores de campos de muestra en las funciones de IA de Data Explorer para mejorar su precisión en la {link}.',
  'genai.optin.description':
    'Las funciones con IA de {product} ofrecen a los usuarios un conjunto de herramientas inteligentes para crear de forma más rápida y eficaz con MongoDB.',
  'genai.optin.disclaimerAfter':
    'para obtener más información. Continúa para activar todas las funciones con IA en {product}.',
  'genai.optin.disclaimerBefore':
    'Las funciones de {product} basadas en IA generativa pueden producir respuestas inexactas. Consulta nuestras',
  'genai.optin.faq': 'preguntas frecuentes',
  'genai.optin.notNow': 'Ahora no',
  'genai.optin.projectSettings': 'configuración del proyecto',
  'genai.optin.title': 'Usar las funciones de IA en {product}',
  'genai.optin.useAiFeatures': 'Usar las funciones de IA',
  'genai.service.notEnabled':
    'La funcionalidad de IA de Compass no está activada actualmente. Inténtalo de nuevo más tarde.',
  'genai.service.schemaTooLarge':
    'El esquema proporcionado es demasiado grande para procesarse. Reduce su tamaño e inténtalo de nuevo.',
  'assistant.prompts.explainPlan.displayText':
    'Interpreta esta salida del plan de ejecución por mí.',
  'assistant.prompts.explainPlan.confirmation':
    'Los metadatos del plan de ejecución, incluida la consulta original, pueden utilizarse para procesar tu solicitud.',
  'assistant.prompts.insights.aggregationWithoutIndex':
    'Ayúdame a entender el impacto en el rendimiento de ejecutar agregaciones sin un índice.',
  'assistant.prompts.insights.queryWithoutIndex':
    'Ayúdame a entender el impacto en el rendimiento de ejecutar consultas sin un índice.',
  'assistant.prompts.insights.rerankFirstStage':
    '¿Cuáles son las mejores prácticas para usar $rerank?',
  'assistant.prompts.debugSearchError.displayText':
    'Diagnostica por qué falla mi pipeline de agregación y ayúdame a depurarlo.',
  'assistant.prompts.analyzeOutput.top3':
    'Analiza los 3 primeros resultados después de la etapa $search.',
  'assistant.prompts.analyzeOutput.two':
    'Analiza estos 2 resultados después de la etapa $search.',
  'assistant.prompts.analyzeOutput.one':
    'Analiza este resultado después de la etapa $search.',
  'assistant.prompts.analyzeOutput.confirmation':
    'Los documentos de los resultados de búsqueda, incluidos los campos de los documentos y los detalles de la puntuación, pueden utilizarse para procesar tu solicitud.',
  'assistant.prompts.connectionError.displayText':
    'Diagnostica por qué falla mi conexión de {product} y ayúdame a depurarla.',
  'assistant.prompts.diagnoseSearchStage.displayText':
    'Diagnostica por qué mi pipeline de agregación no devuelve resultados.',
  'assistant.preset.nonGenuineWarning':
    'Estás conectado a **un servidor MongoDB no genuino**. MongoDB Assistant no ofrecerá orientación precisa para hosts no genuinos, y animamos a los usuarios a utilizar implementaciones reales de MongoDB para aprovechar al máximo nuestras herramientas para desarrolladores.',
};
