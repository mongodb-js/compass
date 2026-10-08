import type { Catalog } from './translations';

// Texts of the compass-schema package. See ./translations.ts for the key
// conventions.

export const de: Catalog = {
  'schema.compassSchema.exploreTitle': 'Erkunde dein Schema',
  'schema.compassSchema.exploreSubtitle':
    'Visualisiere dein Schema schnell, um die Häufigkeit, Typen und Wertebereiche der Felder in deinem Datenbestand zu verstehen.',
  'schema.compassSchema.analyzeSchema': 'Schema analysieren',
  'schema.compassSchema.learnMore': 'Mehr über die Schemaanalyse erfahren',
  'schema.compassSchema.analyzingDocuments': 'Dokumente werden analysiert',
  'schema.compassSchema.stop': 'Stopp',
  'schema.compassSchema.noResults': 'Keine Ergebnisse',
  'schema.compassSchema.noResultsSubtitle':
    'Passe deine Abfrage an, um Ergebnisse zu erhalten.',
  'schema.compassSchema.performanceAdvisor': 'Atlas’ Performance Advisor.',
  'schema.compassSchema.bannerTitle': 'Suchst du nach Schema-Antimustern?',
  'schema.compassSchema.bannerText':
    'Stattdessen kannst du die Performance-Einblicke des Data Explorers nutzen',
  'schema.compassSchema.insight': 'Einblick',
  'schema.compassSchema.or': 'oder',
  'schema.toolbar.documentOne': 'Dokument',
  'schema.toolbar.documentOther': 'Dokumenten',
  'schema.toolbar.analyze': 'Analysieren',
  'schema.toolbar.exportSchema': 'Schema exportieren',
  'schema.toolbar.exportTooltip':
    'Exportiere das Schema nächstes Mal direkt über den Tab „Schema“ in Compass.',
  'schema.toolbar.sampleBefore':
    'Dieser Bericht basiert auf einer Stichprobe von',
  'schema.toolbar.samplingDocsAriaLabel': 'Dokumentation zur Schema-Stichprobe',
  'schema.toolbar.learnMore': 'Mehr erfahren',
  'schema.toolbar.analysisError':
    'Bei der Schemaanalyse ist ein Fehler aufgetreten',
  'schema.toolbar.timeoutHint':
    'Der Vorgang hat das Zeitlimit überschritten. Erhöhe versuchsweise maxTimeMS für die Abfrage in den Filteroptionen.',
  'schema.toolbar.outdated':
    'Der Schemainhalt ist veraltet und nicht mehr mit der Dokumentenansicht synchron. Klicke erneut auf „Analysieren“, um das Schema für die aktuelle Abfrage zu sehen.',
  'schema.exportModal.standard': 'Standard',
  'schema.exportModal.standardDescription':
    'Für breite Kompatibilität mit Tools und Systemen, auf Basis des Standards',
  'schema.exportModal.mongodbDescription':
    'Für MongoDB-spezifische Datenvalidierung auf Datenbankebene (enthält BSON-Datentypen)',
  'schema.exportModal.expanded': 'Erweitert',
  'schema.exportModal.expandedDescription':
    'Für die Schemaanalyse, um deine Daten besser zu verstehen und zu dokumentieren',
  'schema.exportModal.title': 'JSON-Schema exportieren',
  'schema.exportModal.selectFormat': 'Format auswählen:',
  'schema.exportModal.formatting': 'Schema wird formatiert',
  'schema.exportModal.stop': 'Stopp',
  'schema.exportModal.error': 'Beim Schemaexport ist ein Fehler aufgetreten',
  'schema.exportModal.cancel': 'Abbrechen',
  'schema.exportModal.export': 'Exportieren..',
  'schema.legacyModal.title': 'Neue und verbesserte Schema-Export-Funktion',
  'schema.legacyModal.subtitle':
    'Probiere die neue Schema-Export-Funktion aus, um das Schema deiner Collection in mehreren Formaten zu erzeugen. Die bisherige Funktion „Schema teilen“ wird künftig keine Updates mehr erhalten.',
  'schema.legacyModal.legacy': 'Alt',
  'schema.legacyModal.new': 'Neu',
  'schema.legacyModal.shareJsonSchema': 'JSON-Schema teilen',
  'schema.legacyModal.exportJsonSchema': 'JSON-Schema exportieren',
  'schema.legacyModal.legacyDescription':
    'Nicht standardisiertes Schemaformat ohne Anpassungsmöglichkeiten.',
  'schema.legacyModal.newDescription':
    '3 standardisierte Schemaformate für Schemavalidierung und Analyse.',
  'schema.legacyModal.continueLegacy': 'Mit altem Teilen fortfahren',
  'schema.legacyModal.tryNew': 'Neuen Export testen',
  'schema.legacyModal.doNotShowAgain': 'Diese Meldung nicht mehr anzeigen',
  'schema.valueBubble.removeFromQuery': '{value} aus der Abfrage entfernen',
  'schema.valueBubble.addToQuery': '{value} zur Abfrage hinzufügen',
  'schema.arrayMinichart.nestedFieldOne':
    'Array von Dokumenten mit {count} verschachteltem Feld.',
  'schema.arrayMinichart.nestedFieldOther':
    'Array von Dokumenten mit {count} verschachtelten Feldern.',
  'schema.arrayMinichart.arrayLengths': 'Array-Längen',
  'schema.arrayMinichart.min': 'min',
  'schema.arrayMinichart.average': 'Durchschnitt',
  'schema.arrayMinichart.max': 'max',
  'schema.documentMinichart.nestedFieldOne':
    'Dokument mit {count} verschachteltem Feld.',
  'schema.documentMinichart.nestedFieldOther':
    'Dokument mit {count} verschachtelten Feldern.',
  'schema.pluginTitle.schema': 'Schema',
  'schema.field.collapseDocumentSchema': 'Dokumentschema zuklappen',
  'schema.field.expandDocumentSchema': 'Dokumentschema aufklappen',
  'schema.toast.copied': 'Schema kopiert',
  'schema.toast.copiedDescription':
    'Die Schemadefinition von {namespace} wurde im JSON-Format in die Zwischenablage kopiert.',
  'schema.toast.analyzeFirst': 'Zuerst Schema analysieren',
  'schema.toast.analyzeFirstDescription':
    'Bitte analysiere das Schema im Tab „Schema“, bevor du es teilst.',
  'schema.exportModal.noSchemaAnalysis':
    'Keine Schema-Analyse verfügbar. Bitte analysiere das Schema der Collection, bevor du es exportierst.',
};

export const fr: Catalog = {
  'schema.compassSchema.exploreTitle': 'Explorez votre schéma',
  'schema.compassSchema.exploreSubtitle':
    'Visualisez rapidement votre schéma pour comprendre la fréquence, les types et les plages de valeurs des champs de votre jeu de données.',
  'schema.compassSchema.analyzeSchema': 'Analyser le schéma',
  'schema.compassSchema.learnMore': 'En savoir plus sur l’analyse de schéma',
  'schema.compassSchema.analyzingDocuments': 'Analyse des documents',
  'schema.compassSchema.stop': 'Arrêter',
  'schema.compassSchema.noResults': 'Aucun résultat',
  'schema.compassSchema.noResultsSubtitle':
    'Essayez de modifier votre requête pour obtenir des résultats.',
  'schema.compassSchema.performanceAdvisor': 'Performance Advisor d’Atlas.',
  'schema.compassSchema.bannerTitle':
    'Vous cherchez des anti-modèles de schéma ?',
  'schema.compassSchema.bannerText':
    'À la place, vous pouvez consulter les analyses de performance de Data Explorer',
  'schema.compassSchema.insight': 'Analyse',
  'schema.compassSchema.or': 'ou',
  'schema.toolbar.documentOne': 'document',
  'schema.toolbar.documentOther': 'documents',
  'schema.toolbar.analyze': 'Analyser',
  'schema.toolbar.exportSchema': 'Exporter le schéma',
  'schema.toolbar.exportTooltip':
    'La prochaine fois, exportez le schéma directement depuis l’onglet Schéma de Compass.',
  'schema.toolbar.sampleBefore': 'Ce rapport est basé sur un échantillon de',
  'schema.toolbar.samplingDocsAriaLabel':
    'Documentation sur l’échantillonnage du schéma',
  'schema.toolbar.learnMore': 'En savoir plus',
  'schema.toolbar.analysisError':
    'Une erreur s’est produite lors de l’analyse du schéma',
  'schema.toolbar.timeoutHint':
    'L’opération a dépassé le délai imparti. Essayez d’augmenter maxTimeMS pour la requête dans les options de filtre.',
  'schema.toolbar.outdated':
    'Le contenu du schéma est obsolète et n’est plus synchronisé avec la vue des documents. Cliquez à nouveau sur « Analyser » pour voir le schéma de la requête actuelle.',
  'schema.exportModal.standard': 'Standard',
  'schema.exportModal.standardDescription':
    'Pour une large compatibilité avec les outils et systèmes reposant sur le standard',
  'schema.exportModal.mongodbDescription':
    'Pour la validation des données spécifique à MongoDB au niveau de la base de données (inclut les types de données BSON)',
  'schema.exportModal.expanded': 'Étendu',
  'schema.exportModal.expandedDescription':
    'Pour l’analyse de schéma, afin de mieux comprendre et documenter vos données',
  'schema.exportModal.title': 'Exporter le schéma JSON',
  'schema.exportModal.selectFormat': 'Sélectionnez le format :',
  'schema.exportModal.formatting': 'Mise en forme du schéma',
  'schema.exportModal.stop': 'Arrêter',
  'schema.exportModal.error':
    'Une erreur s’est produite lors de l’export du schéma',
  'schema.exportModal.cancel': 'Annuler',
  'schema.exportModal.export': 'Exporter..',
  'schema.legacyModal.title':
    'Nouvelle expérience d’export de schéma améliorée',
  'schema.legacyModal.subtitle':
    'Essayez le nouvel export de schéma pour générer le schéma de votre collection dans plusieurs formats. L’ancienne fonction « Partager le schéma » ne recevra plus de mises à jour.',
  'schema.legacyModal.legacy': 'Ancien',
  'schema.legacyModal.new': 'Nouveau',
  'schema.legacyModal.shareJsonSchema': 'Partager le schéma JSON',
  'schema.legacyModal.exportJsonSchema': 'Exporter le schéma JSON',
  'schema.legacyModal.legacyDescription':
    'Format de schéma non standard sans possibilité de personnalisation.',
  'schema.legacyModal.newDescription':
    '3 formats de schéma standardisés conçus pour la validation et l’analyse de schémas.',
  'schema.legacyModal.continueLegacy': 'Continuer avec l’ancien partage',
  'schema.legacyModal.tryNew': 'Essayer le nouvel export',
  'schema.legacyModal.doNotShowAgain': 'Ne plus afficher ce message',
  'schema.valueBubble.removeFromQuery': 'Retirer {value} de la requête',
  'schema.valueBubble.addToQuery': 'Ajouter {value} à la requête',
  'schema.arrayMinichart.nestedFieldOne':
    'Tableau de documents avec {count} champ imbriqué.',
  'schema.arrayMinichart.nestedFieldOther':
    'Tableau de documents avec {count} champs imbriqués.',
  'schema.arrayMinichart.arrayLengths': 'Longueurs des tableaux',
  'schema.arrayMinichart.min': 'min',
  'schema.arrayMinichart.average': 'moyenne',
  'schema.arrayMinichart.max': 'max',
  'schema.documentMinichart.nestedFieldOne':
    'Document avec {count} champ imbriqué.',
  'schema.documentMinichart.nestedFieldOther':
    'Document avec {count} champs imbriqués.',
  'schema.pluginTitle.schema': 'Schéma',
  'schema.field.collapseDocumentSchema': 'Réduire le schéma du document',
  'schema.field.expandDocumentSchema': 'Développer le schéma du document',
  'schema.toast.copied': 'Schéma copié',
  'schema.toast.copiedDescription':
    'La définition du schéma de {namespace} a été copiée dans le presse-papiers au format JSON.',
  'schema.toast.analyzeFirst': 'Analysez d’abord le schéma',
  'schema.toast.analyzeFirstDescription':
    'Veuillez analyser le schéma dans l’onglet Schéma avant de le partager.',
  'schema.exportModal.noSchemaAnalysis':
    "Aucune analyse de schéma disponible. Veuillez analyser le schéma de la collection avant de l'exporter.",
};

export const es: Catalog = {
  'schema.compassSchema.exploreTitle': 'Explora tu esquema',
  'schema.compassSchema.exploreSubtitle':
    'Visualiza rápidamente tu esquema para entender la frecuencia, los tipos y los rangos de los campos de tu conjunto de datos.',
  'schema.compassSchema.analyzeSchema': 'Analizar esquema',
  'schema.compassSchema.learnMore':
    'Más información sobre el análisis de esquemas',
  'schema.compassSchema.analyzingDocuments': 'Analizando documentos',
  'schema.compassSchema.stop': 'Detener',
  'schema.compassSchema.noResults': 'Sin resultados',
  'schema.compassSchema.noResultsSubtitle':
    'Intenta modificar tu consulta para obtener resultados.',
  'schema.compassSchema.performanceAdvisor': 'Performance Advisor de Atlas.',
  'schema.compassSchema.bannerTitle': '¿Buscas antipatrones de esquema?',
  'schema.compassSchema.bannerText':
    'En su lugar, puedes consultar los análisis de rendimiento de Data Explorer',
  'schema.compassSchema.insight': 'Análisis',
  'schema.compassSchema.or': 'o',
  'schema.toolbar.documentOne': 'documento',
  'schema.toolbar.documentOther': 'documentos',
  'schema.toolbar.analyze': 'Analizar',
  'schema.toolbar.exportSchema': 'Exportar esquema',
  'schema.toolbar.exportTooltip':
    'La próxima vez, exporta el esquema directamente desde la pestaña Esquema de Compass.',
  'schema.toolbar.sampleBefore': 'Este informe se basa en una muestra de',
  'schema.toolbar.samplingDocsAriaLabel':
    'Documentación sobre el muestreo de esquemas',
  'schema.toolbar.learnMore': 'Más información',
  'schema.toolbar.analysisError':
    'Se produjo un error durante el análisis del esquema',
  'schema.toolbar.timeoutHint':
    'La operación superó el límite de tiempo. Intenta aumentar maxTimeMS para la consulta en las opciones de filtro.',
  'schema.toolbar.outdated':
    'El contenido del esquema está desactualizado y ya no está sincronizado con la vista de documentos. Pulsa «Analizar» de nuevo para ver el esquema de la consulta actual.',
  'schema.exportModal.standard': 'Estándar',
  'schema.exportModal.standardDescription':
    'Para una amplia compatibilidad con herramientas y sistemas que se basan en el estándar',
  'schema.exportModal.mongodbDescription':
    'Para la validación de datos específica de MongoDB a nivel de base de datos (incluye tipos de datos BSON)',
  'schema.exportModal.expanded': 'Ampliado',
  'schema.exportModal.expandedDescription':
    'Para el análisis de esquemas, a fin de entender y documentar mejor tus datos',
  'schema.exportModal.title': 'Exportar esquema JSON',
  'schema.exportModal.selectFormat': 'Selecciona el formato:',
  'schema.exportModal.formatting': 'Dando formato al esquema',
  'schema.exportModal.stop': 'Detener',
  'schema.exportModal.error':
    'Se produjo un error durante la exportación del esquema',
  'schema.exportModal.cancel': 'Cancelar',
  'schema.exportModal.export': 'Exportar..',
  'schema.legacyModal.title':
    'Nueva y mejorada experiencia de exportación de esquemas',
  'schema.legacyModal.subtitle':
    'Prueba la nueva exportación de esquemas para generar el esquema de tu colección en varios formatos. La función anterior «Compartir esquema» no recibirá más actualizaciones.',
  'schema.legacyModal.legacy': 'Anterior',
  'schema.legacyModal.new': 'Nuevo',
  'schema.legacyModal.shareJsonSchema': 'Compartir esquema JSON',
  'schema.legacyModal.exportJsonSchema': 'Exportar esquema JSON',
  'schema.legacyModal.legacyDescription':
    'Formato de esquema no estándar sin opciones de personalización.',
  'schema.legacyModal.newDescription':
    '3 formatos de esquema estandarizados diseñados para la validación y el análisis de esquemas.',
  'schema.legacyModal.continueLegacy':
    'Continuar con el uso compartido anterior',
  'schema.legacyModal.tryNew': 'Probar la nueva exportación',
  'schema.legacyModal.doNotShowAgain': 'No volver a mostrar este mensaje',
  'schema.valueBubble.removeFromQuery': 'Quitar {value} de la consulta',
  'schema.valueBubble.addToQuery': 'Añadir {value} a la consulta',
  'schema.arrayMinichart.nestedFieldOne':
    'Array de documentos con {count} campo anidado.',
  'schema.arrayMinichart.nestedFieldOther':
    'Array de documentos con {count} campos anidados.',
  'schema.arrayMinichart.arrayLengths': 'Longitudes de los arrays',
  'schema.arrayMinichart.min': 'mín',
  'schema.arrayMinichart.average': 'promedio',
  'schema.arrayMinichart.max': 'máx',
  'schema.documentMinichart.nestedFieldOne':
    'Documento con {count} campo anidado.',
  'schema.documentMinichart.nestedFieldOther':
    'Documento con {count} campos anidados.',
  'schema.pluginTitle.schema': 'Esquema',
  'schema.field.collapseDocumentSchema': 'Contraer esquema del documento',
  'schema.field.expandDocumentSchema': 'Expandir esquema del documento',
  'schema.toast.copied': 'Esquema copiado',
  'schema.toast.copiedDescription':
    'La definición del esquema de {namespace} se ha copiado al portapapeles en formato JSON.',
  'schema.toast.analyzeFirst': 'Analiza primero el esquema',
  'schema.toast.analyzeFirstDescription':
    'Analiza el esquema en la pestaña Esquema antes de compartirlo.',
  'schema.exportModal.noSchemaAnalysis':
    'No hay ningún análisis de esquema disponible. Analiza el esquema de la colección antes de exportarlo.',
};
