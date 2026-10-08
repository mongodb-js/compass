import type { Catalog } from './translations';

// Texts of the aggregation builder, explain plan, query bar, editor and
// export-to-language packages. See ./translations.ts for the key conventions.

export const de: Catalog = {
  'aggregations.modifySourceBanner': 'Pipeline hinter „{name}“ wird bearbeitet',
  'aggregations.sidePanel.suggestUseCase': 'Neuen Anwendungsfall vorschlagen',
  'aggregations.writeConfirmation.altering':
    'Diese Pipeline führt eine {stage}-Operation aus und ändert „{ns}“. Möchtest du fortfahren?',
  'aggregations.writeConfirmation.creating':
    'Diese Pipeline führt eine {stage}-Operation aus und erstellt „{ns}“. Möchtest du fortfahren?',
  'aggregations.writeConfirmation.overwriting':
    'Diese Pipeline führt eine {stage}-Operation aus und überschreibt „{ns}“. Möchtest du fortfahren?',
  'aggregations.writeConfirmation.unknownNamespace':
    'Diese Pipeline führt eine {stage}-Operation aus, die eine Collection ändern oder überschreiben kann. Möchtest du fortfahren?',
  'aggregations.outputOptions.collapseAll': 'Alle Felder zuklappen',
  'aggregations.outputOptions.expandAll': 'Alle Felder aufklappen',
  'aggregations.outputOptions.title': 'Ausgabeoptionen',
  'aggregations.stage.collapse': 'Zuklappen',
  'aggregations.stage.expand': 'Aufklappen',
  'aggregations.stage.exclude': 'Stage aus der Pipeline ausschließen',
  'aggregations.stage.include': 'Stage in die Pipeline einschließen',
  'aggregations.search.noPreviewDocuments': 'Keine Vorschaudokumente',
  'aggregations.search.noPreviewDocumentsHint':
    'Das kann daran liegen, dass deine Suche keine Ergebnisse liefert oder dein Suchindex nicht existiert.',
  'aggregations.pipelineName.untitled': 'Unbenannt',
  'aggregations.pipelineName.modified': 'geändert',
  'aggregations.search.investigateNoResults': 'Fehlende Ergebnisse untersuchen',
  'aggregations.results.documentList': 'Dokumentliste',
  'aggregations.results.jsonList': 'JSON-Liste',
  'aggregations.addStage': 'Stage hinzufügen',
  'aggregations.addStageLearnMore':
    'Mehr über Stages der Aggregation Pipeline erfahren',
  'aggregations.atlasStagePreview':
    'Die Stage {stageOperator} ist nur mit MongoDB Atlas verfügbar. Erstelle einen kostenlosen Cluster oder verbinde dich mit einem Atlas-Cluster, um Suchindizes zu erstellen und die Aggregations-Stage {stageOperator} für schnelle, relevante Suchabfragen zu nutzen.',
  'aggregations.createFreeCluster': 'Kostenlosen Cluster erstellen',
  'aggregations.results.noResults': 'Keine Ergebnisse',
  'aggregations.results.noResultsHint':
    'Passe deine Pipeline an, um Ergebnisse zu erhalten',
  'aggregations.rerank.upgradeCluster':
    'Aktualisiere deinen Cluster auf MongoDB {version}+, um $rerank zu verwenden.',
  'aggregations.rerank.upgradeClusterButton': 'Cluster aktualisieren',
  'aggregations.searchIndex.staleResults':
    'Die angezeigten Ergebnisse basieren auf der zuletzt erstellten Indexversion.',
  'aggregations.searchIndex.viewDefinition': 'Indexdefinition anzeigen',
  'aggregations.searchIndex.doesNotExist.vector':
    'Der Vector-Search-Index existiert nicht.',
  'aggregations.searchIndex.doesNotExist.vectorNamed':
    'Der Vector-Search-Index „{name}“ existiert nicht.',
  'aggregations.searchIndex.doesNotExist.search':
    'Der Search-Index existiert nicht.',
  'aggregations.searchIndex.doesNotExist.searchNamed':
    'Der Search-Index „{name}“ existiert nicht.',
  'aggregations.searchIndex.viewSearchIndexes': 'Search-Indizes anzeigen',
  'aggregations.searchIndex.or': 'oder',
  'aggregations.searchIndex.createNew': 'Neuen Index erstellen',
  'aggregations.savedPipelines.open': 'Öffnen',
  'aggregations.savedPipelines.delete': 'Löschen',
  'aggregations.savePipeline.titleSaveAs': 'Pipeline speichern unter...',
  'aggregations.savePipeline.title': 'Pipeline speichern',
  'aggregations.savePipeline.save': 'Speichern',
  'aggregations.savePipeline.name': 'Name',
  'aggregations.focusMode.openDocs': 'Dokumentation öffnen',
  'aggregations.search.analyzeAndRefine':
    'Ergebnisse analysieren und verfeinern',
  'aggregations.stageMenu.options': 'Optionen',
  'aggregations.stageMenu.addAfter': 'Stage danach hinzufügen',
  'aggregations.stageMenu.addBefore': 'Stage davor hinzufügen',
  'aggregations.stageMenu.delete': 'Stage löschen',
  'aggregations.stageMenu.expandDocuments': 'Dokumente aufklappen',
  'aggregations.stageMenu.collapseDocuments': 'Dokumente zuklappen',
  'aggregations.stageEditor.operatorRequired':
    'Der Stage-Operator ist erforderlich',
  'aggregations.stageEditor.valueEmpty': 'Der Stage-Wert darf nicht leer sein',
  'aggregations.parser.elementNotObject':
    'Jedes Element des Pipeline-Arrays muss ein Objekt sein',
  'aggregations.parser.exactlyOneField':
    'Ein Pipeline-Stage-Spezifikationsobjekt muss genau ein Feld enthalten.',
  'aggregations.parser.stageValueInvalid': 'Der Stage-Wert ist ungültig',
  'aggregations.parser.mustBeArray':
    'Die Pipeline muss ein Array von Aggregations-Stages sein',
  'aggregations.parser.invalidPipeline': 'Ungültige Pipeline',
  'aggregations.parser.invalidSource': 'Der Quellausdruck ist ungültig',
  'aggregations.parser.emptyWizard':
    'Ein leerer Assistent kann nicht in eine Stage umgewandelt werden',
  'aggregations.parser.unrecognizedStage': 'Unbekannter Pipeline-Stage-Name',
  'aggregations.parser.unrecognizedStageNamed':
    "Unbekannter Pipeline-Stage-Name: '{name}'",
  'aggregations.stageEditor.errorOnStage':
    'Bei {stage} ist ein Fehler aufgetreten.',
  'aggregations.stageEditor.stageNumber': 'Stage {number}',
  'aggregations.export.resultsTitle': 'Pipeline-Ergebnisse exportieren',
  'aggregations.export.data': 'Daten exportieren',
  'aggregations.export.queryToLanguage': 'Abfrage in eine Sprache exportieren',
  'aggregations.export.code': 'Code exportieren',
  'aggregations.pipelineSettings.createNew': 'Neu erstellen',
  'aggregations.pipelineSettings.alreadyEmpty':
    'Diese Pipeline ist bereits leer.',
  'aggregations.results.allResults': 'Alle Ergebnisse',
  'aggregations.createView.duplicate': 'View duplizieren',
  'aggregations.createView.create': 'View erstellen',
  'aggregations.createView.submit': 'Erstellen',
  'aggregations.createView.name': 'Name',
  'aggregations.createView.creating': 'View wird erstellt…',
  'aggregations.saveMenu.save': 'Speichern',
  'aggregations.saveMenu.saveAs': 'Speichern unter',
  'aggregations.saveMenu.createView': 'View erstellen',
  'aggregations.preview.documentsSavedTo':
    'Dokumente werden in {destination} gespeichert.',
  'aggregations.preview.outputAfterStage':
    'Ausgabevorschau nach der Stage {operator}',
  'aggregations.preview.sampleOther': '(Stichprobe von {count} Dokumenten)',
  'aggregations.preview.sampleOne': '(Stichprobe von {count} Dokument)',
  'aggregations.wizard.project.selectType': 'Projektionstyp auswählen',
  'aggregations.wizard.project.include': 'Einschließen',
  'aggregations.wizard.project.exclude': 'Ausschließen',
  'aggregations.pagination.showing': 'Anzeige: {from} – {to}',
  'aggregations.pagination.previous': 'Vorherige Seite',
  'aggregations.pagination.next': 'Nächste Seite',
  'aggregations.pagination.counting': 'Dokumente werden gezählt',
  'aggregations.pagination.ofCount': 'von {count}',
  'aggregations.pagination.refreshing': 'Dokumentanzahl wird aktualisiert',
  'aggregations.pagination.refresh': 'Dokumentanzahl aktualisieren',
  'aggregations.pagination.countResults': 'Ergebnisse zählen',
  'aggregations.pagination.countDefinition':
    'Um die endgültige Anzahl der Dokumente zu ermitteln, muss die Aggregation erneut ausgeführt werden. Das entspricht dem Hinzufügen von $count als letzte Stage der Pipeline.',
  'aggregations.savedPipelines.savedIn': 'Gespeicherte Pipelines in',
  'aggregations.savedPipelines.empty':
    'Keine gespeicherten Pipelines gefunden.',
  'aggregations.savedPipelines.openAria': 'Gespeicherte Pipelines öffnen',
  'aggregations.savedPipelines.title': 'Gespeicherte Pipelines',
  'aggregations.rateLimit.queryLimitsExceeded':
    'Ratenlimits für Abfragen überschritten',
  'aggregations.rateLimit.billing':
    'Du befindest dich derzeit in Tier 0 mit reduzierten Ratenlimits von {limits}. {paymentLink}, um für deine Organisation die höhere Stufe freizuschalten.',
  'aggregations.rateLimit.addPaymentMethod': 'Zahlungsmethode hinzufügen',
  'aggregations.rateLimit.queryLimitExceeded':
    'Ratenlimit für Abfragen überschritten',
  'aggregations.rateLimit.exceeded': 'Ratenlimit überschritten',
  'aggregations.rateLimit.rpmWithExtension':
    'Ratenlimit von {limit} Anfragen pro Minute für {extension} überschritten',
  'aggregations.rateLimit.rpm':
    'Ratenlimit von {limit} Anfragen pro Minute überschritten',
  'aggregations.rateLimit.tpmWithExtension':
    'Ratenlimit von {limit} Tokens pro Minute für {extension} überschritten',
  'aggregations.rateLimit.tpm':
    'Ratenlimit von {limit} Tokens pro Minute überschritten',
  'aggregations.rateLimit.view': 'Ratenlimit anzeigen',
  'aggregations.rateLimit.autoEmbedding': 'automatische Einbettung',
  'aggregations.pipelineStages.empty': 'Deine Pipeline ist derzeit leer.',
  'aggregations.pipelineStages.needHelp': 'Brauchst du Hilfe beim Einstieg?',
  'aggregations.pipelineStages.toGetStarted': 'Füge zum Einstieg die',
  'aggregations.pipelineStages.firstStage': 'erste Stage hinzu.',
  'aggregations.pipelineStages.edit': 'Bearbeiten',
  'aggregations.outputStage.persistedBy':
    'Dokumente wurden in der von {stageOperator} angegebenen Collection gespeichert.',
  'aggregations.outputStage.goToCollection': 'Zur Collection',
  'aggregations.outputStage.loading': 'Wird geladen',
  'aggregations.outputStage.outPreview':
    'Der Operator $out bewirkt, dass die Pipeline die Ergebnisse am angegebenen Ziel (Collection, S3 oder Atlas) speichert. Existiert die Collection bereits, wird sie ersetzt.',
  'aggregations.outputStage.mergePreview':
    'Der Operator $merge bewirkt, dass die Pipeline die Ergebnisse am angegebenen Ziel speichert.',
  'aggregations.outputStage.saveDocuments': 'Dokumente speichern',
  'aggregations.outputStage.saveDocumentsTitle': 'Dokumente speichern',
  'aggregations.outputStage.mergeDocuments': 'Dokumente zusammenführen',
  'aggregations.outputStage.persistingTo':
    'Dokumente werden in {destination} gespeichert',
  'aggregations.outputStage.persisting': 'Dokumente werden gespeichert ...',
  'aggregations.outputStage.persistedToCollection':
    'Dokumente wurden in der Collection {destination} gespeichert',
  'aggregations.outputStage.persistedToSpecified':
    'Dokumente wurden in der angegebenen Collection gespeichert',
  'aggregations.outputStage.goToCollectionPeriod': 'Zur Collection.',
  'aggregations.ai.feedbackSubmitted': 'Dein Feedback wurde gesendet.',
  'aggregations.ai.placeholder':
    'Beschreibe, welche Aggregation erstellt werden soll (z. B. Filme pro Jahr zählen), oder füge eine Aggregation in einer anderen Sprache ein (SQL, Java usw.)',
  'aggregations.extraSettings.toggleAutoPreview':
    'Automatische Vorschau umschalten',
  'aggregations.extraSettings.preview': 'Vorschau',
  'aggregations.extraSettings.stages': 'Stages',
  'aggregations.extraSettings.text': 'Text',
  'aggregations.extraSettings.toggleWizard': 'Stage-Assistent umschalten',
  'aggregations.extraSettings.wizard': 'Assistent',
  'aggregations.extraSettings.moreSettings': 'Weitere Einstellungen',
  'aggregations.inputDocuments.collapse': 'Zuklappen',
  'aggregations.inputDocuments.expand': 'Aufklappen',
  'aggregations.inputDocuments.countOne': '{count} Dokument',
  'aggregations.inputDocuments.countOther': '{count} Dokumente',
  'aggregations.inputDocuments.inCollection': 'in der Collection',
  'aggregations.inputDocuments.refresh': 'Aktualisieren',
  'aggregations.inputDocuments.preview': 'Vorschau der Dokumente',
  'aggregations.inputDocuments.sampling': 'Dokumente werden abgetastet...',
  'aggregations.sidePanel.title': 'Stage-Assistent',
  'aggregations.sidePanel.hide': 'Stage-Assistent ausblenden',
  'aggregations.sidePanel.search': 'Nach einer Stage suchen',
  'aggregations.wizard.useCase.match':
    'Alle Dokumente finden, die eine oder mehrere Bedingungen erfüllen',
  'aggregations.wizard.useCase.basic-group':
    'Meine Dokumente nach Feldwerten gruppieren',
  'aggregations.wizard.useCase.group-with-statistics':
    'Werte innerhalb der von mir erstellten Gruppen berechnen',
  'aggregations.wizard.useCase.group-with-subset':
    'Eine Teilmenge von Werten anhand ihrer Reihenfolge oder ihres Rangs zurückgeben',
  'aggregations.wizard.useCase.project':
    'Eine Teilmenge der Felder meiner Dokumente ein- oder ausschließen',
  'aggregations.wizard.useCase.sort':
    'Dokumente nach einem oder mehreren Feldern sortieren',
  'aggregations.wizard.useCase.lookup':
    'Dokumente aus verschiedenen Collections verknüpfen, um ihre Feldwerte zu vergleichen',
  'aggregations.wizard.useCase.text-search':
    'Ein Textfeld in allen Dokumenten einer Collection durchsuchen',
  'aggregations.rerank.listLastSeparator': ', oder ',
  'aggregations.rerank.insightDescription':
    'Du versuchst, eine Abfrage mit $rerank als erster Stage auszuführen. Das ist aufwendig und erhöht die Last. Wir empfehlen, $rerank als zweite Stage nach {searchStages} zu verwenden.',
  'aggregations.rerank.addSearchStage': '$search-Stage hinzufügen',
  'aggregations.rerank.learnAboutSearch': 'Mehr über Search erfahren',
  'aggregations.rerank.worksBetter':
    '$rerank funktioniert besser nach einer Search-Stage',
  'aggregations.rerank.optimize':
    'Optimiere Leistung und Kosten, indem du $rerank nach dem Abrufen vorläufiger Ergebnisse aus einer Stage wie {searchStages} verwendest.',
  'aggregations.rerank.learnMore': 'Mehr erfahren',
  'aggregations.serverError.rerankNotEnabled': '$rerank nicht aktiviert',
  'aggregations.serverError.enableReranking':
    'Aktiviere natives Reranking in den Projekteinstellungen.',
  'aggregations.serverError.projectSettings': 'Projekteinstellungen',
  'aggregations.serverError.editSearchIndex': 'Search-Index bearbeiten',
  'aggregations.serverError.debug': 'Debuggen',
  'aggregations.options.collation': 'Collation',
  'aggregations.options.maxTimeMS': 'Max. Zeit (ms)',
  'aggregations.options.maxTimeMSWebLimit':
    'Vorgänge, die länger als 5 Minuten dauern, werden in der Webumgebung nicht unterstützt',
  'aggregations.settings.title': 'Einstellungen',
  'aggregations.settings.cancel': 'Abbrechen',
  'aggregations.settings.apply': 'Anwenden',
  'aggregations.settings.commentMode': 'Kommentarmodus',
  'aggregations.settings.commentModeDescription':
    'Wenn aktiviert, werden jeder Stage Hilfskommentare hinzugefügt. Gilt nur für neue Stages.',
  'aggregations.settings.previewDocuments': 'Anzahl der Vorschaudokumente',
  'aggregations.settings.previewDocumentsDescription':
    'Lege fest, wie viele Dokumente in der Vorschau angezeigt werden.',
  'aggregations.settings.limit': 'Limit',
  'aggregations.settings.limitDescription':
    'Begrenzt die Eingabedokumente vor den Stages $group, $bucket und $bucketAuto. Setze ein Limit, damit die Vorschau schneller läuft.',
  'aggregations.settings.limitNote':
    'Hinweis: Diese Einstellung gilt nur für die Dokumentvorschau, nicht für die Ausführung der Pipeline.',
  'aggregations.stageSelect.preview': 'Vorschau',
  'aggregations.stageSelect.startFree': 'Kostenlos starten',
  'aggregations.stageSelect.atlasOnly': 'Nur Atlas.',
  'aggregations.stageSelect.viewSearch80':
    'Nur Atlas. Erfordert MongoDB {version}+, um auf einer View ausgeführt zu werden. Um einen Suchindex auf einer View unter MongoDB 8.0 zu verwenden, frage die Quell-Collection {sourceName} der View ab.',
  'aggregations.stageSelect.viewSearchRequires':
    'Nur Atlas. Erfordert MongoDB {version}+, um auf einer View ausgeführt zu werden.',
  'aggregations.stageSelect.viewSearchCompatible':
    'Nur Atlas. Nur Views mit $match-Stages mit dem Operator $expr, $addFields oder $set sind mit Suchindizes kompatibel.',
  'aggregations.stageSelect.selectOperator': 'Stage-Operator auswählen',
  'aggregations.wizard.atlasOnly': 'Nur Atlas',
  'aggregations.wizard.cancel': 'Abbrechen',
  'aggregations.wizard.apply': 'Anwenden',
  'aggregations.stageToolbar.stageNumber': 'Stage {number}',
  'aggregations.stageToolbar.viewRerankUsage':
    'Nutzung und Ratenlimits von $rerank anzeigen',
  'aggregations.stageToolbar.viewIndexes': 'Indizes anzeigen',
  'aggregations.stageToolbar.disabled':
    'Stage deaktiviert. Ergebnisse werden nicht in der Pipeline weitergegeben.',
  'aggregations.stageToolbar.collapsed':
    'Unten wird eine Stichprobe der aggregierten Ergebnisse dieser Stage angezeigt.',
  'aggregations.stageToolbar.openFocusMode': 'Stage im Fokusmodus öffnen',
  'aggregations.pipelinePreview.previewResults':
    'Zeige eine Vorschau der Ergebnisse an, um eine Stichprobe der aggregierten Ergebnisse dieser Pipeline zu sehen.',
  'aggregations.pipelinePreview.noDocuments': 'Keine Vorschaudokumente',
  'aggregations.pipelinePreview.outdated':
    'Die Ausgabe ist veraltet und nicht mehr synchron.',
  'aggregations.pipelinePreview.title': 'Vorschau der Pipeline-Ausgabe',
  'aggregations.pipelinePreview.sampleOne': 'Stichprobe von {count} Dokument',
  'aggregations.pipelinePreview.sampleOther':
    'Stichprobe von {count} Dokumenten',
  'aggregations.actions.interpret': 'Interpretieren',
  'aggregations.actions.loadingInterpret': 'Interpretation wird geladen',
  'aggregations.actions.interpretInProgress': 'Interpretation läuft',
  'aggregations.actions.notSupported': 'Für diese Abfrage nicht unterstützt',
  'aggregations.actions.assistantUnavailable':
    'Der Assistent ist nicht verfügbar',
  'aggregations.actions.visualTree': 'Visueller Baum',
  'aggregations.actions.rawOutput': 'Rohausgabe',
  'aggregations.actions.updateView': 'View aktualisieren',
  'aggregations.actions.explainAggregation': 'Aggregation erklären',
  'aggregations.actions.explain': 'Erklären',
  'aggregations.actions.runAggregation': 'Aggregation ausführen',
  'aggregations.actions.run': 'Ausführen',
  'aggregations.results.persistedIn':
    'Ergebnisse wurden im Namespace {namespace} gespeichert',
  'aggregations.results.persisted': 'Ergebnisse wurden gespeichert',
  'aggregations.results.goToCollection': 'Zur Collection',
  'aggregations.results.retry': 'ERNEUT VERSUCHEN',
  'aggregations.results.viewErrorDetails': 'FEHLERDETAILS ANZEIGEN',
  'aggregations.results.persistingTo':
    'Dokumente werden im Namespace {namespace} gespeichert',
  'aggregations.results.persisting': 'Dokumente werden gespeichert',
  'aggregations.results.running': 'Aggregation wird ausgeführt',
  'aggregations.results.stop': 'Stopp',
  'aggregations.stagePreview.noDocuments': 'Keine Vorschaudokumente',
  'aggregations.stagePreview.loading': 'Vorschaudokumente werden geladen...',
  'aggregations.stagePreview.unavailable':
    'Vorschau nicht verfügbar – Fehler bei {stage}.',
  'aggregations.stagePreview.score': 'Score: {score}',
  'aggregations.focusMode.loading': 'Wird geladen',
  'aggregations.focusMode.options': 'Optionen',
  'aggregations.focusMode.stageInput': 'Stage-Eingabe',
  'aggregations.focusMode.stageOutput': 'Stage-Ausgabe',
  'aggregations.focusMode.stageLabel': 'Stage {number}: {operator}',
  'aggregations.focusMode.select': 'auswählen',
  'aggregations.focusMode.editPrevious': 'Vorherige Stage bearbeiten',
  'aggregations.focusMode.goPrevious': 'Zur vorherigen Stage',
  'aggregations.focusMode.selectStage': 'Zu bearbeitende Stage auswählen',
  'aggregations.focusMode.editNext': 'Nächste Stage bearbeiten',
  'aggregations.focusMode.goNext': 'Zur nächsten Stage',
  'aggregations.focusMode.enabled': 'Aktiviert',
  'aggregations.focusMode.disabled': 'Deaktiviert',
  'aggregations.focusMode.disableStage': 'Stage deaktivieren',
  'aggregations.focusMode.enableStage': 'Stage aktivieren',
  'aggregations.wizard.field.selectFields': 'Felder auswählen',
  'aggregations.wizard.field.selectField': 'Ein Feld auswählen',
  'aggregations.wizard.field.custom': 'Feld: „{name}“',
  'aggregations.wizard.field.unknown': 'Unbekannt',
  'aggregations.wizard.group.fieldsEmpty':
    'Die Gruppierungsfelder dürfen nicht leer sein',
  'aggregations.wizard.group.basedOn': 'Dokumente gruppieren nach',
  'aggregations.wizard.noFieldSelected': 'Kein Feld ausgewählt',
  'aggregations.wizard.sort.sortBy': 'Dokumente sortieren nach',
  'aggregations.wizard.and': 'und',
  'aggregations.wizard.in': 'in',
  'aggregations.wizard.of': 'von',
  'aggregations.wizard.selectDirection': 'Richtung auswählen',
  'aggregations.wizard.direction.Asc': 'Aufsteigend',
  'aggregations.wizard.direction.Desc': 'Absteigend',
  'aggregations.wizard.lookup.enterAllFields': 'Fülle alle Felder aus',
  'aggregations.wizard.lookup.joinFrom': 'Dokumente verknüpfen aus',
  'aggregations.wizard.lookup.selectCollection': 'Collection auswählen',
  'aggregations.wizard.lookup.where': 'wo',
  'aggregations.wizard.lookup.selectForeignField': 'Fremdfeld auswählen',
  'aggregations.wizard.lookup.fetchingFields': 'Felder werden abgerufen ...',
  'aggregations.wizard.lookup.fetchFieldsFailed':
    'Die Felder konnten nicht abgerufen werden. Gib den Feldnamen manuell ein.',
  'aggregations.wizard.lookup.selectCollectionFirst':
    'Wähle zuerst eine Collection aus.',
  'aggregations.wizard.lookup.matches': 'übereinstimmt mit',
  'aggregations.wizard.lookup.selectLocalField': 'Lokales Feld auswählen',
  'aggregations.wizard.lookup.arrayName': 'Name des Arrays',
  'aggregations.wizard.lookup.as': 'als',
  'aggregations.wizard.match.selectOperator': 'Operator auswählen',
  'aggregations.wizard.match.expectedValue': 'Erwarteter Wert',
  'aggregations.wizard.match.selectType': 'Typ auswählen',
  'aggregations.wizard.match.and': 'UND',
  'aggregations.wizard.match.or': 'ODER',
  'aggregations.wizard.match.addNestedGroup':
    'Verschachtelte Gruppe hinzufügen',
  'aggregations.wizard.match.nestedGroup': 'Verschachtelte Gruppe',
  'aggregations.wizard.match.nestingLimit':
    'Compass unterstützt nicht mehr als drei verschachtelte Match-Bedingungen.',
  'aggregations.wizard.match.removeGroup': 'Gruppe entfernen',
  'aggregations.wizard.statistics.calculate': 'Berechne',
  'aggregations.wizard.selectAccumulator': 'Akkumulator auswählen',
  'aggregations.wizard.accumulator.$avg': 'Durchschnitt',
  'aggregations.wizard.accumulator.$min': 'Minimum',
  'aggregations.wizard.accumulator.$stdDevPop': 'Standardabweichung',
  'aggregations.wizard.accumulator.$count': 'Anzahl',
  'aggregations.wizard.accumulator.$max': 'Maximum',
  'aggregations.wizard.accumulator.$sum': 'Summe',
  'aggregations.wizard.statistics.selectOne':
    'Wähle einen Gruppen-Akkumulator aus',
  'aggregations.wizard.statistics.groupedBy': 'gruppiert nach',
  'aggregations.wizard.subset.accumulatorRequired':
    'Ein Akkumulator ist erforderlich.',
  'aggregations.wizard.subset.recordsInvalid':
    'Die Anzahl der Datensätze ist ungültig.',
  'aggregations.wizard.subset.fieldsRequired':
    'Akkumulator-Felder sind erforderlich.',
  'aggregations.wizard.subset.sortFieldsRequired':
    'Sortierfelder sind erforderlich.',
  'aggregations.wizard.subset.returnThe': 'Gib zurück:',
  'aggregations.wizard.subset.accumulator.$first': 'Erste',
  'aggregations.wizard.subset.accumulator.$last': 'Letzte',
  'aggregations.wizard.subset.accumulator.$top': 'Oberste',
  'aggregations.wizard.subset.accumulator.$bottom': 'Unterste',
  'aggregations.wizard.subset.numberOfRecords': 'Anzahl der Datensätze',
  'aggregations.wizard.subset.selectProjectFields':
    'Projektionsfelder auswählen',
  'aggregations.wizard.subset.fromGroupOf': 'aus einer Gruppe von',
  'aggregations.wizard.subset.selectGroupFields':
    'Gruppierungsfelder auswählen',
  'aggregations.wizard.subset.sortedBy':
    'Dokumenten aus einer Liste, sortiert nach',
  'aggregations.wizard.subset.selectSortFields': 'Sortierfelder auswählen',
  'aggregations.wizard.subset.order': 'Reihenfolge',
  'aggregations.wizard.search.noMaxEdits':
    'Es wurde kein Wert für maxEdits angegeben.',
  'aggregations.wizard.search.maxEditsRange': 'maxEdits muss 1 oder 2 sein.',
  'aggregations.wizard.search.noFields': 'Es wurden keine Felder angegeben.',
  'aggregations.wizard.search.noText': 'Es wurde kein Suchtext angegeben',
  'aggregations.wizard.search.performA': 'Führe eine',
  'aggregations.wizard.search.selectType': 'Suchtyp auswählen',
  'aggregations.wizard.search.textSearch': 'Textsuche',
  'aggregations.wizard.search.fuzzySearch': 'unscharfe Suche',
  'aggregations.wizard.search.with': 'mit',
  'aggregations.wizard.search.example': 'z. B. 2',
  'aggregations.wizard.search.forAllDocuments':
    'für alle Dokumente aus, bei denen',
  'aggregations.wizard.search.selectPath': 'Suchpfad auswählen',
  'aggregations.wizard.search.fieldNames': 'Feldnamen',
  'aggregations.wizard.search.anyFields': 'beliebige Felder',
  'aggregations.wizard.search.contains': 'enthalten',
  'aggregations.wizard.search.text': 'Text',
  'aggregations.wizard.search.using': 'mit',
  'aggregations.wizard.search.selectIndex':
    'Search-Index auswählen oder eingeben',
  'aggregations.wizard.search.fetchingIndexes':
    'Search-Indizes werden abgerufen ...',
  'aggregations.wizard.search.fetchIndexesFailed':
    'Die Search-Indizes konnten nicht abgerufen werden. Gib den Indexnamen manuell ein.',
  'aggregations.wizard.search.customIndex': 'Index: „{name}“',
  'aggregations.writeConfirmation.title':
    'Es wird ein Schreibvorgang ausgeführt',
  'aggregations.writeConfirmation.confirm': 'Ja, Pipeline ausführen',
  'aggregations.newPipelineConfirm.title':
    'Möchtest du wirklich eine neue Pipeline erstellen?',
  'aggregations.newPipelineConfirm.description':
    'Beim Erstellen dieser Pipeline gehen nicht gespeicherte Änderungen an der aktuellen Pipeline verloren.',
  'aggregations.savedPipeline.parseError':
    'Pipeline-Quelle kann nicht in Stages umgewandelt werden',
  'aggregations.savedPipeline.syntaxErrors':
    'Die geladene Pipeline „{name}“ enthält Syntaxfehler',
  'aggregations.savedPipeline.openConfirmTitle':
    'Möchtest du diese Pipeline wirklich öffnen?',
  'aggregations.savedPipeline.openConfirmDescription':
    'Beim Öffnen gehen nicht gespeicherte Änderungen an der Pipeline verloren, die du gerade erstellst.',
  'aggregations.savedPipeline.openConfirmButton': 'Pipeline öffnen',
  'aggregations.savedPipeline.deleteConfirmTitle':
    'Möchtest du diese Pipeline wirklich löschen?',
  'aggregations.savedPipeline.deleteConfirmDescription':
    'Beim Löschen wird diese Pipeline aus deinen gespeicherten Pipelines entfernt.',
  'aggregations.savedPipeline.deleteConfirmButton': 'Pipeline löschen',
  'aggregations.updateView.confirmTitle':
    'Möchtest du die View wirklich aktualisieren?',
  'aggregations.updateView.confirmSearchIndexes':
    'Für diese View sind Suchindizes vorhanden. Beim Aktualisieren der View werden die Indizes neu aufgebaut, was zusätzliche Ressourcen deines Clusters beansprucht.',
  'aggregations.updateView.confirmIncompatible':
    'Durch diese Aktualisierung ist die View nicht mehr mit Suchindizes kompatibel, und alle Suchindizes schlagen fehl. Nur Views mit den Stages $addFields, $set oder $match mit dem Operator $expr sind mit Suchindizes kompatibel.',
  'aggregations.updateView.confirmButton': 'Aktualisieren',
  'aggregations.ai.networkError': 'Netzwerkfehler',
  'aggregations.ai.unauthorized': 'Nicht autorisiert',
  'aggregations.ai.noPipeline':
    'Es wurde keine Pipeline zurückgegeben. Bitte versuche es mit einer anderen Eingabe erneut.',
  'aggregations.tabTitle': 'Aggregationen',
  'editor.collapseAll': 'Alle zuklappen',
  'editor.expandAll': 'Alle aufklappen',
  'editor.copy': 'Kopieren',
  'editor.format': 'Formatieren',
  'editor.safeInteger.exceedsRange':
    'Überschreitet den sicheren Ganzzahlbereich.',
  'editor.safeInteger.convertToLong': 'In Long umwandeln',
  'editor.foldCodeBlock': 'Codeblock einklappen',
  'editor.unfoldCodeBlock': 'Codeblock ausklappen',
  'explainPlan.modal.running': 'Explain wird ausgeführt',
  'explainPlan.modal.title': 'Ausführungsplan (Explain)',
  'explainPlan.modal.subtitle':
    'Explain liefert wichtige Ausführungskennzahlen, mit denen sich langsame Abfragen diagnostizieren und die Index-Nutzung optimieren lassen.',
  'explainPlan.modal.learnMore': 'Mehr erfahren',
  'explainPlan.modal.interpret': 'Interpretieren',
  'explainPlan.modal.interpretTooltip':
    'Die Explain-Ausgabe in natürlicher Sprache verstehen und Vorschläge zur Leistungsverbesserung erhalten',
  'explainPlan.modal.cancel': 'Abbrechen',
  'explainPlan.modal.close': 'Schließen',
  'explainPlan.view.visualTree': 'Visueller Baum',
  'explainPlan.view.rawOutput': 'Rohausgabe',
  'explainPlan.summary.noIndex': 'Für diese Abfrage ist kein Index verfügbar.',
  'explainPlan.summary.coveredByIndex': 'Abfrage durch Index abgedeckt:',
  'explainPlan.summary.multipleIndexes':
    'Die Abfrage hat folgende Indizes verwendet (Shard-Ergebnisse unterscheiden sich):',
  'explainPlan.summary.usedIndex': 'Die Abfrage hat folgenden Index verwendet:',
  'explainPlan.summary.indexDefinition.start':
    'Die Indizes, die zur Beantwortung der Abfrage verwendet wurden. Ein Wert von',
  'explainPlan.summary.indexDefinition.ascending':
    'kennzeichnet einen aufsteigenden Index und ein Wert von',
  'explainPlan.summary.indexDefinition.descending':
    'kennzeichnet einen absteigenden Index.',
  'explainPlan.summary.title': 'Zusammenfassung der Abfrageleistung',
  'explainPlan.summary.docsReturned': 'Dokumente zurückgegeben',
  'explainPlan.summary.docsReturnedDefinition':
    'Anzahl der von der Abfrage zurückgegebenen Dokumente.',
  'explainPlan.summary.docsExamined': 'Dokumente untersucht',
  'explainPlan.summary.docsExaminedDefinition':
    'Anzahl der während der Abfrageausführung untersuchten Dokumente. Wenn ein Index die Abfrage abdeckt, ist dieser Wert 0.',
  'explainPlan.summary.executionTime': 'Ausführungszeit',
  'explainPlan.summary.executionTimeDefinition':
    'Gesamtzeit in Millisekunden für die Auswahl des Abfrageplans und die Ausführung der Abfrage.',
  'explainPlan.summary.isSorted': 'Wird',
  'explainPlan.summary.isNotSorted': 'Wird nicht',
  'explainPlan.summary.sortedInMemory': 'im Arbeitsspeicher sortiert',
  'explainPlan.summary.sortedInMemoryDefinition':
    'Gibt an, ob die Sortierung im Systemspeicher erfolgt ist. Sortierungen im Arbeitsspeicher sind leistungsfähiger als Sortierungen auf dem Datenträger.',
  'explainPlan.summary.indexKeysExamined': 'Indexschlüssel untersucht',
  'explainPlan.summary.indexKeysExaminedDefinition':
    'Anzahl der Indizes, die zur Beantwortung der Abfrage untersucht wurden.',
  'explainPlan.zoom.in': 'Vergrößern',
  'explainPlan.zoom.out': 'Verkleinern',
  'explainPlan.cannotVisualize':
    'Der visuelle Ausführungsplan wird für diese Abfrage in dieser Collection in dieser Compass-Version nicht unterstützt. Details zur Operation findest du in der JSON-Rohausgabe von Explain.',
  'explainPlan.stage.highlight.Index Name': 'Indexname',
  'explainPlan.stage.highlight.Multi Key Index': 'Multikey-Index',
  'explainPlan.stage.highlight.Transform by': 'Transformiert durch',
  'explainPlan.stage.highlight.Documents Examined': 'Untersuchte Dokumente',
  'explainPlan.stage.yes': 'ja',
  'explainPlan.stage.no': 'nein',
  'explainPlan.stage.returned': 'Zurückgegeben',
  'explainPlan.stage.executionTime': 'Ausführungszeit',
  'explainPlan.stage.clockTooltip':
    'Die Uhr stellt die Gesamtzeit dar, die die Abfrage bis zum Abschluss benötigt hat. Das blaue Segment der Uhr ist die Zeit der hervorgehobenen Stage ({ms} ms). Das graue Segment ist die Zeit der vorangegangenen Stages.',
  'explainPlan.interpretError.title':
    'Ausführungsplan konnte nicht interpretiert werden',
  'explainPlan.interpretError.description':
    'Der Ausführungsplan konnte nicht abgerufen werden. Bitte versuche es erneut.',
  'exportToLanguage.title.query': 'Abfrage in eine Sprache exportieren',
  'exportToLanguage.title.deleteQuery':
    'Löschabfrage in eine Sprache exportieren',
  'exportToLanguage.title.updateQuery':
    'Update-Abfrage in eine Sprache exportieren',
  'exportToLanguage.title.pipeline': 'Pipeline in eine Sprache exportieren',
  'exportToLanguage.input.query': 'Meine Abfrage',
  'exportToLanguage.input.deleteQuery': 'Meine Löschabfrage',
  'exportToLanguage.input.updateQuery': 'Meine Update-Abfrage',
  'exportToLanguage.input.pipeline': 'Meine Pipeline',
  'exportToLanguage.output.query': 'Exportierte Abfrage',
  'exportToLanguage.output.deleteQuery': 'Exportierte Löschabfrage',
  'exportToLanguage.output.updateQuery': 'Exportierte Update-Abfrage',
  'exportToLanguage.output.pipeline': 'Exportierte Pipeline',
  'exportToLanguage.includeImports': 'Import-Anweisungen einschließen',
  'exportToLanguage.includeDrivers': 'Treiber-Syntax einschließen',
  'exportToLanguage.useBuilders': 'Builder verwenden',
  'queryBar.explain.interpret': 'Interpretieren',
  'queryBar.explain.loadingInterpret': 'Interpretation wird geladen',
  'queryBar.explain.interpretInProgress': 'Interpretation läuft',
  'queryBar.explain.assistantUnavailable': 'Der Assistent ist nicht verfügbar',
  'queryBar.explain.visualTree': 'Visueller Baum',
  'queryBar.explain.rawOutput': 'Rohausgabe',
  'queryBar.explainQuery': 'Abfrage erklären',
  'queryBar.explainTooltip': 'Ausführungsplan der aktuellen Abfrage anzeigen',
  'queryBar.explain': 'Erklären',
  'queryBar.resetQuery': 'Abfrage zurücksetzen',
  'queryBar.reset': 'Zurücksetzen',
  'queryBar.apply': 'Anwenden',
  'queryBar.placeholder.filter': "Abfrage eingeben: { field: 'value' }",
  'queryBar.placeholder.sort': "{ field: -1 } oder [['field', -1]]",
  'queryBar.placeholder.hint': '{ field: -1 } oder "indexName"',
  'queryBar.option.project': 'Projektion',
  'queryBar.option.sort': 'Sortierung',
  'queryBar.option.hint': 'Index-Hinweis',
  'queryBar.option.collation': 'Collation',
  'queryBar.option.skip': 'Überspringen',
  'queryBar.option.limit': 'Limit',
  'queryBar.option.maxTimeMS': 'Max. Zeit (ms)',
  'queryBar.maxTimeMSWebLimit':
    'Vorgänge, die länger als 5 Minuten dauern, werden in der Webumgebung nicht unterstützt',
  'queryBar.ai.feedbackSubmitted': 'Dein Feedback wurde gesendet.',
  'queryBar.ai.networkError': 'Netzwerkfehler',
  'queryBar.ai.unauthorized': 'Nicht autorisiert',
  'queryBar.ai.noQuery':
    'Die KI hat keine Abfrage zurückgegeben. Versuche, deine Eingabe umzuformulieren.',
  'queryBar.history.open': 'Abfrageverlauf öffnen',
  'queryBar.history.title': 'Abfrageverlauf',
  'queryBar.history.favoriteName': 'Name des Favoriten',
  'queryBar.history.save': 'Speichern',
  'queryBar.history.cancel': 'Abbrechen',
  'queryBar.history.queriesIn': 'Abfragen in',
  'queryBar.history.recents': 'Zuletzt verwendet',
  'queryBar.history.favorites': 'Favoriten',
  'queryBar.history.noFavorites':
    'Deine favorisierten Abfragen werden hier angezeigt.',
  'queryBar.history.noRecents': 'Deine letzten Abfragen werden hier angezeigt.',
  'queryBar.history.favoriteQuery': 'Abfrage favorisieren',
  'queryBar.history.copyQuery': 'Abfrage in die Zwischenablage kopieren',
  'queryBar.history.deleteQuery': 'Abfrage aus der Liste löschen',
  'queryBar.history.openInModal': 'In Dialog öffnen',
};

export const fr: Catalog = {
  'aggregations.modifySourceBanner':
    'Modification du pipeline sous-jacent à « {name} »',
  'aggregations.sidePanel.suggestUseCase': "Suggérer un nouveau cas d'usage",
  'aggregations.writeConfirmation.altering':
    'Ce pipeline exécutera une opération {stage} qui modifiera « {ns} ». Voulez-vous continuer ?',
  'aggregations.writeConfirmation.creating':
    'Ce pipeline exécutera une opération {stage} qui créera « {ns} ». Voulez-vous continuer ?',
  'aggregations.writeConfirmation.overwriting':
    'Ce pipeline exécutera une opération {stage} qui écrasera « {ns} ». Voulez-vous continuer ?',
  'aggregations.writeConfirmation.unknownNamespace':
    'Ce pipeline exécutera une opération {stage} qui peut modifier ou écraser une collection. Voulez-vous continuer ?',
  'aggregations.outputOptions.collapseAll': 'Réduire tous les champs',
  'aggregations.outputOptions.expandAll': 'Développer tous les champs',
  'aggregations.outputOptions.title': 'Options de sortie',
  'aggregations.stage.collapse': 'Réduire',
  'aggregations.stage.expand': 'Développer',
  'aggregations.stage.exclude': "Exclure l'étape du pipeline",
  'aggregations.stage.include': "Inclure l'étape dans le pipeline",
  'aggregations.search.noPreviewDocuments': "Aucun document d'aperçu",
  'aggregations.search.noPreviewDocumentsHint':
    "Cela peut être dû au fait que votre recherche ne renvoie aucun résultat ou que votre index de recherche n'existe pas.",
  'aggregations.pipelineName.untitled': 'Sans titre',
  'aggregations.pipelineName.modified': 'modifié',
  'aggregations.search.investigateNoResults':
    "Rechercher pourquoi il n'y a aucun résultat",
  'aggregations.results.documentList': 'Liste de documents',
  'aggregations.results.jsonList': 'Liste JSON',
  'aggregations.addStage': 'Ajouter une étape',
  'aggregations.addStageLearnMore':
    "En savoir plus sur les étapes du pipeline d'agrégation",
  'aggregations.atlasStagePreview':
    "L'étape {stageOperator} n'est disponible qu'avec MongoDB Atlas. Créez un cluster gratuit ou connectez-vous à un cluster Atlas pour créer des index de recherche et utiliser l'étape d'agrégation {stageOperator} afin d'exécuter des requêtes de recherche rapides et pertinentes.",
  'aggregations.createFreeCluster': 'Créer un cluster gratuit',
  'aggregations.results.noResults': 'Aucun résultat',
  'aggregations.results.noResultsHint':
    'Essayez de modifier votre pipeline pour obtenir des résultats',
  'aggregations.rerank.upgradeCluster':
    'Mettez à niveau votre cluster vers MongoDB {version}+ pour utiliser $rerank.',
  'aggregations.rerank.upgradeClusterButton': 'Mettre à niveau le cluster',
  'aggregations.searchIndex.staleResults':
    "Les résultats affichés reposent sur la version d'index la plus récemment créée.",
  'aggregations.searchIndex.viewDefinition':
    "Afficher la définition de l'index",
  'aggregations.searchIndex.doesNotExist.vector':
    "L'index de recherche vectorielle n'existe pas.",
  'aggregations.searchIndex.doesNotExist.vectorNamed':
    "L'index de recherche vectorielle « {name} » n'existe pas.",
  'aggregations.searchIndex.doesNotExist.search':
    "L'index de recherche n'existe pas.",
  'aggregations.searchIndex.doesNotExist.searchNamed':
    "L'index de recherche « {name} » n'existe pas.",
  'aggregations.searchIndex.viewSearchIndexes':
    'Afficher les index de recherche',
  'aggregations.searchIndex.or': 'ou',
  'aggregations.searchIndex.createNew': 'Créer un nouvel index',
  'aggregations.savedPipelines.open': 'Ouvrir',
  'aggregations.savedPipelines.delete': 'Supprimer',
  'aggregations.savePipeline.titleSaveAs': 'Enregistrer le pipeline sous...',
  'aggregations.savePipeline.title': 'Enregistrer le pipeline',
  'aggregations.savePipeline.save': 'Enregistrer',
  'aggregations.savePipeline.name': 'Nom',
  'aggregations.focusMode.openDocs': 'Ouvrir la documentation',
  'aggregations.search.analyzeAndRefine': 'Analyser et affiner les résultats',
  'aggregations.stageMenu.options': 'Options',
  'aggregations.stageMenu.addAfter': 'Ajouter une étape après',
  'aggregations.stageMenu.addBefore': 'Ajouter une étape avant',
  'aggregations.stageMenu.delete': "Supprimer l'étape",
  'aggregations.stageMenu.expandDocuments': 'Développer les documents',
  'aggregations.stageMenu.collapseDocuments': 'Réduire les documents',
  'aggregations.stageEditor.operatorRequired':
    "L'opérateur d'étape est obligatoire",
  'aggregations.stageEditor.valueEmpty':
    "La valeur de l'étape ne peut pas être vide",
  'aggregations.parser.elementNotObject':
    'Chaque élément du tableau de la pipeline doit être un objet',
  'aggregations.parser.exactlyOneField':
    "Un objet de spécification d'étape de pipeline doit contenir exactement un champ.",
  'aggregations.parser.stageValueInvalid': "La valeur de l'étape est invalide",
  'aggregations.parser.mustBeArray':
    "La pipeline doit être un tableau d'étapes d'agrégation",
  'aggregations.parser.invalidPipeline': 'Pipeline invalide',
  'aggregations.parser.invalidSource': "L'expression source est invalide",
  'aggregations.parser.emptyWizard':
    'Impossible de convertir un assistant vide en étape',
  'aggregations.parser.unrecognizedStage':
    "Nom d'étape de pipeline non reconnu",
  'aggregations.parser.unrecognizedStageNamed':
    "Nom d'étape de pipeline non reconnu : '{name}'",
  'aggregations.stageEditor.errorOnStage':
    "Une erreur s'est produite à l'{stage}.",
  'aggregations.stageEditor.stageNumber': 'étape {number}',
  'aggregations.export.resultsTitle': 'Exporter les résultats du pipeline',
  'aggregations.export.data': 'Exporter les données',
  'aggregations.export.queryToLanguage': 'Exporter la requête vers un langage',
  'aggregations.export.code': 'Exporter le code',
  'aggregations.pipelineSettings.createNew': 'Créer',
  'aggregations.pipelineSettings.alreadyEmpty': 'Ce pipeline est déjà vide.',
  'aggregations.results.allResults': 'Tous les résultats',
  'aggregations.createView.duplicate': 'Dupliquer la vue',
  'aggregations.createView.create': 'Créer une vue',
  'aggregations.createView.submit': 'Créer',
  'aggregations.createView.name': 'Nom',
  'aggregations.createView.creating': 'Création de la vue…',
  'aggregations.saveMenu.save': 'Enregistrer',
  'aggregations.saveMenu.saveAs': 'Enregistrer sous',
  'aggregations.saveMenu.createView': 'Créer une vue',
  'aggregations.preview.documentsSavedTo':
    'Les documents seront enregistrés dans {destination}.',
  'aggregations.preview.outputAfterStage':
    "Aperçu de la sortie après l'étape {operator}",
  'aggregations.preview.sampleOther': '(Échantillon de {count} documents)',
  'aggregations.preview.sampleOne': '(Échantillon de {count} document)',
  'aggregations.wizard.project.selectType':
    'Sélectionner le type de projection',
  'aggregations.wizard.project.include': 'Inclure',
  'aggregations.wizard.project.exclude': 'Exclure',
  'aggregations.pagination.showing': 'Affichage de {from} à {to}',
  'aggregations.pagination.previous': 'Page précédente',
  'aggregations.pagination.next': 'Page suivante',
  'aggregations.pagination.counting': 'Comptage des documents',
  'aggregations.pagination.ofCount': 'sur {count}',
  'aggregations.pagination.refreshing': 'Actualisation du nombre de documents',
  'aggregations.pagination.refresh': 'Actualiser le nombre de documents',
  'aggregations.pagination.countResults': 'compter les résultats',
  'aggregations.pagination.countDefinition':
    "Pour obtenir le nombre final de documents, nous devons exécuter à nouveau l'agrégation. Cela équivaut à ajouter $count comme dernière étape du pipeline.",
  'aggregations.savedPipelines.savedIn': 'Pipelines enregistrés dans',
  'aggregations.savedPipelines.empty': 'Aucun pipeline enregistré trouvé.',
  'aggregations.savedPipelines.openAria': 'Ouvrir les pipelines enregistrés',
  'aggregations.savedPipelines.title': 'Pipelines enregistrés',
  'aggregations.rateLimit.queryLimitsExceeded':
    'Limites de débit des requêtes dépassées',
  'aggregations.rateLimit.billing':
    'Vous êtes actuellement au niveau 0 avec des limites de débit réduites de {limits}. {paymentLink} pour que votre organisation débloque le niveau supérieur.',
  'aggregations.rateLimit.addPaymentMethod': 'Ajoutez un moyen de paiement',
  'aggregations.rateLimit.queryLimitExceeded':
    'Limite de débit des requêtes dépassée',
  'aggregations.rateLimit.exceeded': 'Limite de débit dépassée',
  'aggregations.rateLimit.rpmWithExtension':
    'Limite de débit de {limit} requêtes par minute pour {extension} dépassée',
  'aggregations.rateLimit.rpm':
    'Limite de débit de {limit} requêtes par minute dépassée',
  'aggregations.rateLimit.tpmWithExtension':
    'Limite de débit de {limit} jetons par minute pour {extension} dépassée',
  'aggregations.rateLimit.tpm':
    'Limite de débit de {limit} jetons par minute dépassée',
  'aggregations.rateLimit.view': 'Afficher la limite de débit',
  'aggregations.rateLimit.autoEmbedding': 'incorporation automatique',
  'aggregations.pipelineStages.empty': 'Votre pipeline est actuellement vide.',
  'aggregations.pipelineStages.needHelp': "Besoin d'aide pour démarrer ?",
  'aggregations.pipelineStages.toGetStarted': 'Pour commencer, ajoutez la',
  'aggregations.pipelineStages.firstStage': 'première étape.',
  'aggregations.pipelineStages.edit': 'Modifier',
  'aggregations.outputStage.persistedBy':
    'Les documents ont été conservés dans la collection spécifiée par {stageOperator}.',
  'aggregations.outputStage.goToCollection': 'Aller à la collection',
  'aggregations.outputStage.loading': 'Chargement',
  'aggregations.outputStage.outPreview':
    "L'opérateur $out entraîne la conservation des résultats du pipeline à l'emplacement spécifié (collection, S3 ou Atlas). Si la collection existe, elle sera remplacée.",
  'aggregations.outputStage.mergePreview':
    "L'opérateur $merge entraîne la conservation des résultats du pipeline à l'emplacement spécifié.",
  'aggregations.outputStage.saveDocuments': 'Enregistrer les documents',
  'aggregations.outputStage.saveDocumentsTitle': 'Enregistrer les documents',
  'aggregations.outputStage.mergeDocuments': 'Fusionner les documents',
  'aggregations.outputStage.persistingTo':
    'Conservation des documents dans {destination}',
  'aggregations.outputStage.persisting': 'Conservation des documents ...',
  'aggregations.outputStage.persistedToCollection':
    'Documents conservés dans la collection : {destination}',
  'aggregations.outputStage.persistedToSpecified':
    'Documents conservés dans la collection spécifiée',
  'aggregations.outputStage.goToCollectionPeriod': 'Aller à la collection.',
  'aggregations.ai.feedbackSubmitted': 'Votre commentaire a été envoyé.',
  'aggregations.ai.placeholder':
    "Indiquez l'agrégation à créer (par exemple, compter les films réalisés chaque année) ou collez-en une dans un autre langage (SQL, Java, etc.)",
  'aggregations.extraSettings.toggleAutoPreview':
    "Activer ou désactiver l'aperçu automatique",
  'aggregations.extraSettings.preview': 'Aperçu',
  'aggregations.extraSettings.stages': 'Étapes',
  'aggregations.extraSettings.text': 'Texte',
  'aggregations.extraSettings.toggleWizard':
    "Afficher ou masquer l'assistant d'étapes",
  'aggregations.extraSettings.wizard': 'Assistant',
  'aggregations.extraSettings.moreSettings': 'Autres paramètres',
  'aggregations.inputDocuments.collapse': 'Réduire',
  'aggregations.inputDocuments.expand': 'Développer',
  'aggregations.inputDocuments.countOne': '{count} document',
  'aggregations.inputDocuments.countOther': '{count} documents',
  'aggregations.inputDocuments.inCollection': 'dans la collection',
  'aggregations.inputDocuments.refresh': 'Actualiser',
  'aggregations.inputDocuments.preview': 'Aperçu des documents',
  'aggregations.inputDocuments.sampling': 'Échantillonnage des documents...',
  'aggregations.sidePanel.title': "Assistant d'étapes",
  'aggregations.sidePanel.hide': "Masquer l'assistant d'étapes",
  'aggregations.sidePanel.search': 'Rechercher une étape',
  'aggregations.wizard.useCase.match':
    'Trouver tous les documents correspondant à une ou plusieurs conditions',
  'aggregations.wizard.useCase.basic-group':
    'Regrouper mes documents selon les valeurs de leurs champs',
  'aggregations.wizard.useCase.group-with-statistics':
    'Calculer des valeurs au sein des groupes que je crée',
  'aggregations.wizard.useCase.group-with-subset':
    'Renvoyer un sous-ensemble de valeurs selon leur ordre ou leur rang',
  'aggregations.wizard.useCase.project':
    'Inclure ou exclure un sous-ensemble de champs de mes documents',
  'aggregations.wizard.useCase.sort':
    'Trier les documents selon un ou plusieurs champs',
  'aggregations.wizard.useCase.lookup':
    'Joindre des documents de différentes collections pour comparer les valeurs de leurs champs',
  'aggregations.wizard.useCase.text-search':
    "Rechercher un champ de texte dans tous les documents d'une collection",
  'aggregations.rerank.listLastSeparator': ', ou ',
  'aggregations.rerank.insightDescription':
    "Vous essayez d'exécuter une requête avec $rerank comme première étape. C'est coûteux et augmente la charge. Nous recommandons d'utiliser $rerank comme deuxième étape, après {searchStages}.",
  'aggregations.rerank.addSearchStage': 'Ajouter une étape $search',
  'aggregations.rerank.learnAboutSearch': 'En savoir plus sur la recherche',
  'aggregations.rerank.worksBetter':
    '$rerank fonctionne mieux après une étape de recherche',
  'aggregations.rerank.optimize':
    'Optimisez les performances et les coûts en utilisant $rerank après avoir récupéré des résultats préliminaires depuis une étape comme {searchStages}.',
  'aggregations.rerank.learnMore': 'En savoir plus',
  'aggregations.serverError.rerankNotEnabled': '$rerank non activé',
  'aggregations.serverError.enableReranking':
    'Activez le reranking natif dans les paramètres du projet.',
  'aggregations.serverError.projectSettings': 'Paramètres du projet',
  'aggregations.serverError.editSearchIndex': "Modifier l'index de recherche",
  'aggregations.serverError.debug': 'Déboguer',
  'aggregations.options.collation': 'Collation',
  'aggregations.options.maxTimeMS': 'Durée max. (ms)',
  'aggregations.options.maxTimeMSWebLimit':
    "Les opérations de plus de 5 minutes ne sont pas prises en charge dans l'environnement web",
  'aggregations.settings.title': 'Paramètres',
  'aggregations.settings.cancel': 'Annuler',
  'aggregations.settings.apply': 'Appliquer',
  'aggregations.settings.commentMode': 'Mode commentaire',
  'aggregations.settings.commentModeDescription':
    "Lorsque cette option est activée, des commentaires d'aide sont ajoutés à chaque étape. S'applique uniquement aux nouvelles étapes.",
  'aggregations.settings.previewDocuments': "Nombre de documents d'aperçu",
  'aggregations.settings.previewDocumentsDescription':
    "Indiquez le nombre de documents à afficher dans l'aperçu.",
  'aggregations.settings.limit': 'Limite',
  'aggregations.settings.limitDescription':
    "Limite les documents en entrée avant les étapes $group, $bucket et $bucketAuto. Définissez une limite pour accélérer l'aperçu.",
  'aggregations.settings.limitNote':
    "Remarque : ce paramètre ne s'applique qu'à l'aperçu des documents, pas à l'exécution du pipeline.",
  'aggregations.stageSelect.preview': 'Aperçu',
  'aggregations.stageSelect.startFree': 'Démarrer gratuitement',
  'aggregations.stageSelect.atlasOnly': 'Atlas uniquement.',
  'aggregations.stageSelect.viewSearch80':
    "Atlas uniquement. Nécessite MongoDB {version}+ pour s'exécuter sur une vue. Pour utiliser un index de recherche sur une vue avec MongoDB 8.0, interrogez la collection source de la vue, {sourceName}.",
  'aggregations.stageSelect.viewSearchRequires':
    "Atlas uniquement. Nécessite MongoDB {version}+ pour s'exécuter sur une vue.",
  'aggregations.stageSelect.viewSearchCompatible':
    "Atlas uniquement. Seules les vues contenant des étapes $match avec l'opérateur $expr, $addFields ou $set sont compatibles avec les index de recherche.",
  'aggregations.stageSelect.selectOperator':
    "Sélectionner un opérateur d'étape",
  'aggregations.wizard.atlasOnly': 'Atlas uniquement',
  'aggregations.wizard.cancel': 'Annuler',
  'aggregations.wizard.apply': 'Appliquer',
  'aggregations.stageToolbar.stageNumber': 'Étape {number}',
  'aggregations.stageToolbar.viewRerankUsage':
    "Afficher l'utilisation et les limites de débit de $rerank",
  'aggregations.stageToolbar.viewIndexes': 'Afficher les index',
  'aggregations.stageToolbar.disabled':
    'Étape désactivée. Les résultats ne sont pas transmis dans le pipeline.',
  'aggregations.stageToolbar.collapsed':
    'Un échantillon des résultats agrégés de cette étape sera affiché ci-dessous.',
  'aggregations.stageToolbar.openFocusMode': "Ouvrir l'étape en mode focus",
  'aggregations.pipelinePreview.previewResults':
    'Prévisualisez les résultats pour voir un échantillon des résultats agrégés de ce pipeline.',
  'aggregations.pipelinePreview.noDocuments': "Aucun document d'aperçu",
  'aggregations.pipelinePreview.outdated':
    "La sortie est obsolète et n'est plus synchronisée.",
  'aggregations.pipelinePreview.title': 'Aperçu de la sortie du pipeline',
  'aggregations.pipelinePreview.sampleOne': 'Échantillon de {count} document',
  'aggregations.pipelinePreview.sampleOther':
    'Échantillon de {count} documents',
  'aggregations.actions.interpret': 'Interpréter',
  'aggregations.actions.loadingInterpret': "Chargement de l'interprétation",
  'aggregations.actions.interpretInProgress': 'Interprétation en cours',
  'aggregations.actions.notSupported': 'Non pris en charge pour cette requête',
  'aggregations.actions.assistantUnavailable':
    "L'assistant n'est pas disponible",
  'aggregations.actions.visualTree': 'Arborescence visuelle',
  'aggregations.actions.rawOutput': 'Sortie brute',
  'aggregations.actions.updateView': 'Mettre à jour la vue',
  'aggregations.actions.explainAggregation': "Expliquer l'agrégation",
  'aggregations.actions.explain': 'Expliquer',
  'aggregations.actions.runAggregation': "Exécuter l'agrégation",
  'aggregations.actions.run': 'Exécuter',
  'aggregations.results.persistedIn':
    "Résultats conservés dans l'espace de noms {namespace}",
  'aggregations.results.persisted': 'Résultats conservés',
  'aggregations.results.goToCollection': 'Aller à la collection',
  'aggregations.results.retry': 'RÉESSAYER',
  'aggregations.results.viewErrorDetails': "AFFICHER LES DÉTAILS DE L'ERREUR",
  'aggregations.results.persistingTo':
    "Conservation des documents dans l'espace de noms {namespace}",
  'aggregations.results.persisting': 'Conservation des documents',
  'aggregations.results.running': "Exécution de l'agrégation",
  'aggregations.results.stop': 'Arrêter',
  'aggregations.stagePreview.noDocuments': "Aucun document d'aperçu",
  'aggregations.stagePreview.loading': "Chargement des documents d'aperçu...",
  'aggregations.stagePreview.unavailable':
    "Aperçu indisponible – erreur à l'{stage}.",
  'aggregations.stagePreview.score': 'Score : {score}',
  'aggregations.focusMode.loading': 'Chargement',
  'aggregations.focusMode.options': 'Options',
  'aggregations.focusMode.stageInput': "Entrée de l'étape",
  'aggregations.focusMode.stageOutput': "Sortie de l'étape",
  'aggregations.focusMode.stageLabel': 'Étape {number} : {operator}',
  'aggregations.focusMode.select': 'sélectionner',
  'aggregations.focusMode.editPrevious': "Modifier l'étape précédente",
  'aggregations.focusMode.goPrevious': "Aller à l'étape précédente",
  'aggregations.focusMode.selectStage': "Sélectionner l'étape à modifier",
  'aggregations.focusMode.editNext': "Modifier l'étape suivante",
  'aggregations.focusMode.goNext': "Aller à l'étape suivante",
  'aggregations.focusMode.enabled': 'Activée',
  'aggregations.focusMode.disabled': 'Désactivée',
  'aggregations.focusMode.disableStage': "Désactiver l'étape",
  'aggregations.focusMode.enableStage': "Activer l'étape",
  'aggregations.wizard.field.selectFields': 'Sélectionner des champs',
  'aggregations.wizard.field.selectField': 'Sélectionner un champ',
  'aggregations.wizard.field.custom': 'Champ : « {name} »',
  'aggregations.wizard.field.unknown': 'Inconnu',
  'aggregations.wizard.group.fieldsEmpty':
    'Les champs de regroupement ne peuvent pas être vides',
  'aggregations.wizard.group.basedOn': 'Regrouper les documents selon',
  'aggregations.wizard.noFieldSelected': 'Aucun champ sélectionné',
  'aggregations.wizard.sort.sortBy': 'Trier les documents par',
  'aggregations.wizard.and': 'et',
  'aggregations.wizard.in': 'en',
  'aggregations.wizard.of': 'de',
  'aggregations.wizard.selectDirection': 'Sélectionner la direction',
  'aggregations.wizard.direction.Asc': 'Croissant',
  'aggregations.wizard.direction.Desc': 'Décroissant',
  'aggregations.wizard.lookup.enterAllFields': 'Renseignez tous les champs',
  'aggregations.wizard.lookup.joinFrom': 'Joindre les documents de',
  'aggregations.wizard.lookup.selectCollection': 'Sélectionner une collection',
  'aggregations.wizard.lookup.where': 'où',
  'aggregations.wizard.lookup.selectForeignField':
    'Sélectionner le champ étranger',
  'aggregations.wizard.lookup.fetchingFields': 'Récupération des champs ...',
  'aggregations.wizard.lookup.fetchFieldsFailed':
    'Échec de la récupération des champs. Saisissez le nom du champ manuellement.',
  'aggregations.wizard.lookup.selectCollectionFirst':
    "Sélectionnez d'abord une collection.",
  'aggregations.wizard.lookup.matches': 'correspond à',
  'aggregations.wizard.lookup.selectLocalField': 'Sélectionner le champ local',
  'aggregations.wizard.lookup.arrayName': 'Nom du tableau',
  'aggregations.wizard.lookup.as': 'comme',
  'aggregations.wizard.match.selectOperator': 'Sélectionner un opérateur',
  'aggregations.wizard.match.expectedValue': 'Valeur attendue',
  'aggregations.wizard.match.selectType': 'Sélectionner un type',
  'aggregations.wizard.match.and': 'ET',
  'aggregations.wizard.match.or': 'OU',
  'aggregations.wizard.match.addNestedGroup': 'Ajouter un groupe imbriqué',
  'aggregations.wizard.match.nestedGroup': 'Groupe imbriqué',
  'aggregations.wizard.match.nestingLimit':
    'Compass ne prend pas en charge plus de trois conditions de correspondance imbriquées.',
  'aggregations.wizard.match.removeGroup': 'Supprimer le groupe',
  'aggregations.wizard.statistics.calculate': 'Calculer',
  'aggregations.wizard.selectAccumulator': 'Sélectionner un accumulateur',
  'aggregations.wizard.accumulator.$avg': 'Moyenne',
  'aggregations.wizard.accumulator.$min': 'Minimum',
  'aggregations.wizard.accumulator.$stdDevPop': 'Écart type',
  'aggregations.wizard.accumulator.$count': 'Nombre',
  'aggregations.wizard.accumulator.$max': 'Maximum',
  'aggregations.wizard.accumulator.$sum': 'Somme',
  'aggregations.wizard.statistics.selectOne':
    'Sélectionnez un accumulateur de groupe',
  'aggregations.wizard.statistics.groupedBy': 'regroupé par',
  'aggregations.wizard.subset.accumulatorRequired':
    'Un accumulateur est obligatoire.',
  'aggregations.wizard.subset.recordsInvalid':
    "Le nombre d'enregistrements n'est pas valide.",
  'aggregations.wizard.subset.fieldsRequired':
    "Les champs de l'accumulateur sont obligatoires.",
  'aggregations.wizard.subset.sortFieldsRequired':
    'Les champs de tri sont obligatoires.',
  'aggregations.wizard.subset.returnThe': 'Renvoyer le/la',
  'aggregations.wizard.subset.accumulator.$first': 'Premier',
  'aggregations.wizard.subset.accumulator.$last': 'Dernier',
  'aggregations.wizard.subset.accumulator.$top': 'Haut',
  'aggregations.wizard.subset.accumulator.$bottom': 'Bas',
  'aggregations.wizard.subset.numberOfRecords': "Nombre d'enregistrements",
  'aggregations.wizard.subset.selectProjectFields':
    'Sélectionner les noms de champs à projeter',
  'aggregations.wizard.subset.fromGroupOf': "d'un groupe de",
  'aggregations.wizard.subset.selectGroupFields':
    'Sélectionner les noms de champs de regroupement',
  'aggregations.wizard.subset.sortedBy': "documents d'une liste triée par",
  'aggregations.wizard.subset.selectSortFields':
    'Sélectionner les noms de champs de tri',
  'aggregations.wizard.subset.order': 'ordre',
  'aggregations.wizard.search.noMaxEdits':
    "Aucune valeur de maxEdits n'a été fournie.",
  'aggregations.wizard.search.maxEditsRange': 'maxEdits doit valoir 1 ou 2.',
  'aggregations.wizard.search.noFields': "Aucun champ n'a été fourni.",
  'aggregations.wizard.search.noText':
    "Aucun texte de recherche n'a été fourni",
  'aggregations.wizard.search.performA': 'Effectuer une',
  'aggregations.wizard.search.selectType': 'Sélectionner le type de recherche',
  'aggregations.wizard.search.textSearch': 'recherche de texte',
  'aggregations.wizard.search.fuzzySearch': 'recherche floue',
  'aggregations.wizard.search.with': 'avec',
  'aggregations.wizard.search.example': 'p. ex. 2',
  'aggregations.wizard.search.forAllDocuments': 'pour tous les documents où',
  'aggregations.wizard.search.selectPath':
    'Sélectionner le chemin de recherche',
  'aggregations.wizard.search.fieldNames': 'noms de champs',
  'aggregations.wizard.search.anyFields': "n'importe quels champs",
  'aggregations.wizard.search.contains': 'contiennent',
  'aggregations.wizard.search.text': 'texte',
  'aggregations.wizard.search.using': 'en utilisant',
  'aggregations.wizard.search.selectIndex':
    'Sélectionner ou saisir un index de recherche',
  'aggregations.wizard.search.fetchingIndexes':
    'Récupération des index de recherche ...',
  'aggregations.wizard.search.fetchIndexesFailed':
    "Échec de la récupération des index de recherche. Saisissez le nom de l'index manuellement.",
  'aggregations.wizard.search.customIndex': 'Index : « {name} »',
  'aggregations.writeConfirmation.title':
    "Une opération d'écriture va avoir lieu",
  'aggregations.writeConfirmation.confirm': 'Oui, exécuter le pipeline',
  'aggregations.newPipelineConfirm.title':
    'Voulez-vous vraiment créer un nouveau pipeline ?',
  'aggregations.newPipelineConfirm.description':
    'La création de ce pipeline abandonnera les modifications non enregistrées du pipeline actuel.',
  'aggregations.savedPipeline.parseError':
    "Impossible d'analyser la source du pipeline en étapes",
  'aggregations.savedPipeline.syntaxErrors':
    'Le pipeline chargé « {name} » contient des erreurs de syntaxe',
  'aggregations.savedPipeline.openConfirmTitle':
    'Voulez-vous vraiment ouvrir ce pipeline ?',
  'aggregations.savedPipeline.openConfirmDescription':
    "L'ouverture de ce projet abandonnera les modifications non enregistrées du pipeline que vous êtes en train de créer.",
  'aggregations.savedPipeline.openConfirmButton': 'Ouvrir le pipeline',
  'aggregations.savedPipeline.deleteConfirmTitle':
    'Voulez-vous vraiment supprimer ce pipeline ?',
  'aggregations.savedPipeline.deleteConfirmDescription':
    'La suppression de ce pipeline le retirera de vos pipelines enregistrés.',
  'aggregations.savedPipeline.deleteConfirmButton': 'Supprimer le pipeline',
  'aggregations.updateView.confirmTitle':
    'Voulez-vous vraiment mettre à jour la vue ?',
  'aggregations.updateView.confirmSearchIndexes':
    'Des index de recherche ont été créés sur cette vue. La mise à jour de la vue entraînera une reconstruction des index, ce qui consommera des ressources supplémentaires sur votre cluster.',
  'aggregations.updateView.confirmIncompatible':
    "Cette mise à jour rendra la vue incompatible avec les index de recherche et fera échouer tous les index de recherche. Seules les vues contenant des étapes $addFields, $set ou $match avec l'opérateur $expr sont compatibles avec les index de recherche.",
  'aggregations.updateView.confirmButton': 'Mettre à jour',
  'aggregations.ai.networkError': 'Erreur réseau',
  'aggregations.ai.unauthorized': 'Non autorisé',
  'aggregations.ai.noPipeline':
    "Aucun pipeline n'a été renvoyé. Veuillez réessayer avec une autre demande.",
  'aggregations.tabTitle': 'Agrégations',
  'editor.collapseAll': 'Tout réduire',
  'editor.expandAll': 'Tout développer',
  'editor.copy': 'Copier',
  'editor.format': 'Formater',
  'editor.safeInteger.exceedsRange': "Dépasse la plage d'entiers sûre.",
  'editor.safeInteger.convertToLong': 'Convertir en Long',
  'editor.foldCodeBlock': 'Replier le bloc de code',
  'editor.unfoldCodeBlock': 'Déplier le bloc de code',
  'explainPlan.modal.running': "Exécution d'explain en cours",
  'explainPlan.modal.title': "Plan d'exécution (Explain)",
  'explainPlan.modal.subtitle':
    "Explain fournit des métriques d'exécution clés qui aident à diagnostiquer les requêtes lentes et à optimiser l'utilisation des index.",
  'explainPlan.modal.learnMore': 'En savoir plus',
  'explainPlan.modal.interpret': 'Interpréter',
  'explainPlan.modal.interpretTooltip':
    "Comprenez la sortie d'Explain en langage naturel et obtenez des suggestions pour améliorer les performances",
  'explainPlan.modal.cancel': 'Annuler',
  'explainPlan.modal.close': 'Fermer',
  'explainPlan.view.visualTree': 'Arborescence visuelle',
  'explainPlan.view.rawOutput': 'Sortie brute',
  'explainPlan.summary.noIndex': 'Aucun index disponible pour cette requête.',
  'explainPlan.summary.coveredByIndex': "Requête couverte par l'index :",
  'explainPlan.summary.multipleIndexes':
    'La requête a utilisé les index suivants (les résultats des shards diffèrent) :',
  'explainPlan.summary.usedIndex': "La requête a utilisé l'index suivant :",
  'explainPlan.summary.indexDefinition.start':
    'Les index utilisés pour exécuter la requête. Une valeur de',
  'explainPlan.summary.indexDefinition.ascending':
    'indique un index croissant, et une valeur de',
  'explainPlan.summary.indexDefinition.descending':
    'indique un index décroissant.',
  'explainPlan.summary.title': 'Résumé des performances de la requête',
  'explainPlan.summary.docsReturned': 'documents renvoyés',
  'explainPlan.summary.docsReturnedDefinition':
    'Nombre de documents renvoyés par la requête.',
  'explainPlan.summary.docsExamined': 'documents examinés',
  'explainPlan.summary.docsExaminedDefinition':
    "Nombre de documents examinés pendant l'exécution de la requête. Lorsqu'un index couvre une requête, cette valeur est 0.",
  'explainPlan.summary.executionTime': "temps d'exécution",
  'explainPlan.summary.executionTimeDefinition':
    "Temps total en millisecondes pour la sélection du plan de requête et l'exécution de la requête.",
  'explainPlan.summary.isSorted': 'Est',
  'explainPlan.summary.isNotSorted': "N'est pas",
  'explainPlan.summary.sortedInMemory': 'trié en mémoire',
  'explainPlan.summary.sortedInMemoryDefinition':
    "Indique si l'opération de tri a eu lieu dans la mémoire système. Les tris en mémoire sont plus performants que les tris sur disque.",
  'explainPlan.summary.indexKeysExamined': "clés d'index examinées",
  'explainPlan.summary.indexKeysExaminedDefinition':
    "Nombre d'index examinés pour exécuter la requête.",
  'explainPlan.zoom.in': 'Zoom avant',
  'explainPlan.zoom.out': 'Zoom arrière',
  'explainPlan.cannotVisualize':
    "Le plan d'exécution visuel n'est pas pris en charge pour cette requête sur cette collection dans cette version de Compass. Veuillez consulter la sortie JSON brute d'Explain pour obtenir des informations sur l'opération.",
  'explainPlan.stage.highlight.Index Name': "Nom de l'index",
  'explainPlan.stage.highlight.Multi Key Index': 'Index multiclé',
  'explainPlan.stage.highlight.Transform by': 'Transformé par',
  'explainPlan.stage.highlight.Documents Examined': 'Documents examinés',
  'explainPlan.stage.yes': 'oui',
  'explainPlan.stage.no': 'non',
  'explainPlan.stage.returned': 'Renvoyés',
  'explainPlan.stage.executionTime': "Temps d'exécution",
  'explainPlan.stage.clockTooltip':
    "L'horloge représente le temps total nécessaire à la requête pour se terminer. Le segment bleu de l'horloge correspond au temps pris par l'étape mise en évidence ({ms} ms). Le segment gris correspond au temps pris par les étapes précédentes.",
  'explainPlan.interpretError.title':
    "Impossible d'interpréter le plan d'exécution",
  'explainPlan.interpretError.description':
    "Échec de la récupération du plan d'exécution. Veuillez réessayer.",
  'exportToLanguage.title.query': 'Exporter la requête vers un langage',
  'exportToLanguage.title.deleteQuery':
    'Exporter la requête de suppression vers un langage',
  'exportToLanguage.title.updateQuery':
    'Exporter la requête de mise à jour vers un langage',
  'exportToLanguage.title.pipeline': 'Exporter le pipeline vers un langage',
  'exportToLanguage.input.query': 'Ma requête',
  'exportToLanguage.input.deleteQuery': 'Ma requête de suppression',
  'exportToLanguage.input.updateQuery': 'Ma requête de mise à jour',
  'exportToLanguage.input.pipeline': 'Mon pipeline',
  'exportToLanguage.output.query': 'Requête exportée',
  'exportToLanguage.output.deleteQuery': 'Requête de suppression exportée',
  'exportToLanguage.output.updateQuery': 'Requête de mise à jour exportée',
  'exportToLanguage.output.pipeline': 'Pipeline exporté',
  'exportToLanguage.includeImports': "Inclure les instructions d'importation",
  'exportToLanguage.includeDrivers': 'Inclure la syntaxe du pilote',
  'exportToLanguage.useBuilders': 'Utiliser les builders',
  'queryBar.explain.interpret': 'Interpréter',
  'queryBar.explain.loadingInterpret': "Chargement de l'interprétation",
  'queryBar.explain.interpretInProgress': 'Interprétation en cours',
  'queryBar.explain.assistantUnavailable': "L'assistant n'est pas disponible",
  'queryBar.explain.visualTree': 'Arborescence visuelle',
  'queryBar.explain.rawOutput': 'Sortie brute',
  'queryBar.explainQuery': 'Expliquer la requête',
  'queryBar.explainTooltip':
    "Afficher le plan d'exécution de la requête actuelle",
  'queryBar.explain': 'Expliquer',
  'queryBar.resetQuery': 'Réinitialiser la requête',
  'queryBar.reset': 'Réinitialiser',
  'queryBar.apply': 'Appliquer',
  'queryBar.placeholder.filter': "Saisissez une requête : { field: 'value' }",
  'queryBar.placeholder.sort': "{ field: -1 } ou [['field', -1]]",
  'queryBar.placeholder.hint': '{ field: -1 } ou "indexName"',
  'queryBar.option.project': 'Projection',
  'queryBar.option.sort': 'Tri',
  'queryBar.option.hint': "Indication d'index",
  'queryBar.option.collation': 'Collation',
  'queryBar.option.skip': 'Ignorer',
  'queryBar.option.limit': 'Limite',
  'queryBar.option.maxTimeMS': 'Durée max. (ms)',
  'queryBar.maxTimeMSWebLimit':
    "Les opérations de plus de 5 minutes ne sont pas prises en charge dans l'environnement web",
  'queryBar.ai.feedbackSubmitted': 'Votre commentaire a été envoyé.',
  'queryBar.ai.networkError': 'Erreur réseau',
  'queryBar.ai.unauthorized': 'Non autorisé',
  'queryBar.ai.noQuery':
    "Aucune requête n'a été renvoyée par l'IA. Essayez de reformuler votre demande.",
  'queryBar.history.open': "Ouvrir l'historique des requêtes",
  'queryBar.history.title': 'Historique des requêtes',
  'queryBar.history.favoriteName': 'Nom du favori',
  'queryBar.history.save': 'Enregistrer',
  'queryBar.history.cancel': 'Annuler',
  'queryBar.history.queriesIn': 'Requêtes dans',
  'queryBar.history.recents': 'Récentes',
  'queryBar.history.favorites': 'Favorites',
  'queryBar.history.noFavorites': 'Vos requêtes favorites apparaîtront ici.',
  'queryBar.history.noRecents': 'Vos requêtes récentes apparaîtront ici.',
  'queryBar.history.favoriteQuery': 'Ajouter la requête aux favoris',
  'queryBar.history.copyQuery': 'Copier la requête dans le presse-papiers',
  'queryBar.history.deleteQuery': 'Supprimer la requête de la liste',
  'queryBar.history.openInModal': 'Ouvrir dans une fenêtre modale',
};

export const es: Catalog = {
  'aggregations.modifySourceBanner': 'Modificando el pipeline de «{name}»',
  'aggregations.sidePanel.suggestUseCase': 'Sugerir un nuevo caso de uso',
  'aggregations.writeConfirmation.altering':
    'Este pipeline ejecutará una operación {stage} que modificará «{ns}». ¿Quieres continuar?',
  'aggregations.writeConfirmation.creating':
    'Este pipeline ejecutará una operación {stage} que creará «{ns}». ¿Quieres continuar?',
  'aggregations.writeConfirmation.overwriting':
    'Este pipeline ejecutará una operación {stage} que sobrescribirá «{ns}». ¿Quieres continuar?',
  'aggregations.writeConfirmation.unknownNamespace':
    'Este pipeline ejecutará una operación {stage} que puede modificar o sobrescribir una colección. ¿Quieres continuar?',
  'aggregations.outputOptions.collapseAll': 'Contraer todos los campos',
  'aggregations.outputOptions.expandAll': 'Expandir todos los campos',
  'aggregations.outputOptions.title': 'Opciones de salida',
  'aggregations.stage.collapse': 'Contraer',
  'aggregations.stage.expand': 'Expandir',
  'aggregations.stage.exclude': 'Excluir etapa del pipeline',
  'aggregations.stage.include': 'Incluir etapa en el pipeline',
  'aggregations.search.noPreviewDocuments': 'No hay documentos de vista previa',
  'aggregations.search.noPreviewDocumentsHint':
    'Esto puede deberse a que tu búsqueda no tiene resultados o a que tu índice de búsqueda no existe.',
  'aggregations.pipelineName.untitled': 'Sin título',
  'aggregations.pipelineName.modified': 'modificado',
  'aggregations.search.investigateNoResults':
    'Investigar la falta de resultados',
  'aggregations.results.documentList': 'Lista de documentos',
  'aggregations.results.jsonList': 'Lista JSON',
  'aggregations.addStage': 'Añadir etapa',
  'aggregations.addStageLearnMore':
    'Más información sobre las etapas del pipeline de agregación',
  'aggregations.atlasStagePreview':
    'La etapa {stageOperator} solo está disponible con MongoDB Atlas. Crea un clúster gratuito o conéctate a un clúster de Atlas para crear índices de búsqueda y usar la etapa de agregación {stageOperator} para ejecutar consultas de búsqueda rápidas y relevantes.',
  'aggregations.createFreeCluster': 'Crear clúster gratuito',
  'aggregations.results.noResults': 'Sin resultados',
  'aggregations.results.noResultsHint':
    'Intenta modificar tu pipeline para obtener resultados',
  'aggregations.rerank.upgradeCluster':
    'Actualiza tu clúster a MongoDB {version}+ para usar $rerank.',
  'aggregations.rerank.upgradeClusterButton': 'Actualizar clúster',
  'aggregations.searchIndex.staleResults':
    'Los resultados mostrados se basan en la versión del índice creada más recientemente.',
  'aggregations.searchIndex.viewDefinition': 'Ver definición del índice',
  'aggregations.searchIndex.doesNotExist.vector':
    'El índice de búsqueda vectorial no existe.',
  'aggregations.searchIndex.doesNotExist.vectorNamed':
    'El índice de búsqueda vectorial «{name}» no existe.',
  'aggregations.searchIndex.doesNotExist.search':
    'El índice de búsqueda no existe.',
  'aggregations.searchIndex.doesNotExist.searchNamed':
    'El índice de búsqueda «{name}» no existe.',
  'aggregations.searchIndex.viewSearchIndexes': 'Ver índices de búsqueda',
  'aggregations.searchIndex.or': 'o',
  'aggregations.searchIndex.createNew': 'Crear un índice nuevo',
  'aggregations.savedPipelines.open': 'Abrir',
  'aggregations.savedPipelines.delete': 'Eliminar',
  'aggregations.savePipeline.titleSaveAs': 'Guardar pipeline como...',
  'aggregations.savePipeline.title': 'Guardar pipeline',
  'aggregations.savePipeline.save': 'Guardar',
  'aggregations.savePipeline.name': 'Nombre',
  'aggregations.focusMode.openDocs': 'Abrir documentación',
  'aggregations.search.analyzeAndRefine': 'Analizar y refinar resultados',
  'aggregations.stageMenu.options': 'Opciones',
  'aggregations.stageMenu.addAfter': 'Añadir etapa después',
  'aggregations.stageMenu.addBefore': 'Añadir etapa antes',
  'aggregations.stageMenu.delete': 'Eliminar etapa',
  'aggregations.stageMenu.expandDocuments': 'Expandir documentos',
  'aggregations.stageMenu.collapseDocuments': 'Contraer documentos',
  'aggregations.stageEditor.operatorRequired':
    'Se requiere el operador de la etapa',
  'aggregations.stageEditor.valueEmpty':
    'El valor de la etapa no puede estar vacío',
  'aggregations.parser.elementNotObject':
    'Cada elemento del array de la pipeline debe ser un objeto',
  'aggregations.parser.exactlyOneField':
    'Un objeto de especificación de etapa de pipeline debe contener exactamente un campo.',
  'aggregations.parser.stageValueInvalid': 'El valor de la etapa no es válido',
  'aggregations.parser.mustBeArray':
    'La pipeline debe ser un array de etapas de agregación',
  'aggregations.parser.invalidPipeline': 'Pipeline no válida',
  'aggregations.parser.invalidSource': 'La expresión de origen no es válida',
  'aggregations.parser.emptyWizard':
    'No se puede convertir un asistente vacío en una etapa',
  'aggregations.parser.unrecognizedStage':
    'Nombre de etapa de pipeline no reconocido',
  'aggregations.parser.unrecognizedStageNamed':
    "Nombre de etapa de pipeline no reconocido: '{name}'",
  'aggregations.stageEditor.errorOnStage': 'Se produjo un error en la {stage}.',
  'aggregations.stageEditor.stageNumber': 'etapa {number}',
  'aggregations.export.resultsTitle': 'Exportar resultados del pipeline',
  'aggregations.export.data': 'Exportar datos',
  'aggregations.export.queryToLanguage': 'Exportar consulta a un lenguaje',
  'aggregations.export.code': 'Exportar código',
  'aggregations.pipelineSettings.createNew': 'Crear nuevo',
  'aggregations.pipelineSettings.alreadyEmpty': 'Este pipeline ya está vacío.',
  'aggregations.results.allResults': 'Todos los resultados',
  'aggregations.createView.duplicate': 'Duplicar vista',
  'aggregations.createView.create': 'Crear una vista',
  'aggregations.createView.submit': 'Crear',
  'aggregations.createView.name': 'Nombre',
  'aggregations.createView.creating': 'Creando vista…',
  'aggregations.saveMenu.save': 'Guardar',
  'aggregations.saveMenu.saveAs': 'Guardar como',
  'aggregations.saveMenu.createView': 'Crear vista',
  'aggregations.preview.documentsSavedTo':
    'Los documentos se guardarán en {destination}.',
  'aggregations.preview.outputAfterStage':
    'Vista previa de la salida tras la etapa {operator}',
  'aggregations.preview.sampleOther': '(Muestra de {count} documentos)',
  'aggregations.preview.sampleOne': '(Muestra de {count} documento)',
  'aggregations.wizard.project.selectType': 'Seleccionar tipo de proyección',
  'aggregations.wizard.project.include': 'Incluir',
  'aggregations.wizard.project.exclude': 'Excluir',
  'aggregations.pagination.showing': 'Mostrando {from} – {to}',
  'aggregations.pagination.previous': 'Página anterior',
  'aggregations.pagination.next': 'Página siguiente',
  'aggregations.pagination.counting': 'Contando documentos',
  'aggregations.pagination.ofCount': 'de {count}',
  'aggregations.pagination.refreshing':
    'Actualizando el recuento de documentos',
  'aggregations.pagination.refresh': 'Actualizar recuento de documentos',
  'aggregations.pagination.countResults': 'contar resultados',
  'aggregations.pagination.countDefinition':
    'Para obtener el recuento final de documentos es necesario ejecutar de nuevo la agregación. Esto equivale a añadir $count como última etapa del pipeline.',
  'aggregations.savedPipelines.savedIn': 'Pipelines guardados en',
  'aggregations.savedPipelines.empty': 'No se encontraron pipelines guardados.',
  'aggregations.savedPipelines.openAria': 'Abrir pipelines guardados',
  'aggregations.savedPipelines.title': 'Pipelines guardados',
  'aggregations.rateLimit.queryLimitsExceeded':
    'Se superaron los límites de frecuencia de consultas',
  'aggregations.rateLimit.billing':
    'Actualmente estás en el nivel 0 con límites de frecuencia reducidos de {limits}. {paymentLink} para que tu organización desbloquee el nivel superior.',
  'aggregations.rateLimit.addPaymentMethod': 'Añade un método de pago',
  'aggregations.rateLimit.queryLimitExceeded':
    'Se superó el límite de frecuencia de consultas',
  'aggregations.rateLimit.exceeded': 'Se superó el límite de frecuencia',
  'aggregations.rateLimit.rpmWithExtension':
    'Se superó el límite de frecuencia de {limit} solicitudes por minuto de {extension}',
  'aggregations.rateLimit.rpm':
    'Se superó el límite de frecuencia de {limit} solicitudes por minuto',
  'aggregations.rateLimit.tpmWithExtension':
    'Se superó el límite de frecuencia de {limit} tokens por minuto para {extension}',
  'aggregations.rateLimit.tpm':
    'Se superó el límite de frecuencia de {limit} tokens por minuto',
  'aggregations.rateLimit.view': 'Ver límite de frecuencia',
  'aggregations.rateLimit.autoEmbedding': 'incrustación automática',
  'aggregations.pipelineStages.empty': 'Tu pipeline está vacío actualmente.',
  'aggregations.pipelineStages.needHelp': '¿Necesitas ayuda para empezar?',
  'aggregations.pipelineStages.toGetStarted': 'Para empezar, añade la',
  'aggregations.pipelineStages.firstStage': 'primera etapa.',
  'aggregations.pipelineStages.edit': 'Editar',
  'aggregations.outputStage.persistedBy':
    'Los documentos se guardaron en la colección especificada por {stageOperator}.',
  'aggregations.outputStage.goToCollection': 'Ir a la colección',
  'aggregations.outputStage.loading': 'Cargando',
  'aggregations.outputStage.outPreview':
    'El operador $out hace que el pipeline guarde los resultados en la ubicación especificada (colección, S3 o Atlas). Si la colección existe, se reemplazará.',
  'aggregations.outputStage.mergePreview':
    'El operador $merge hace que el pipeline guarde los resultados en la ubicación especificada.',
  'aggregations.outputStage.saveDocuments': 'Guardar documentos',
  'aggregations.outputStage.saveDocumentsTitle': 'Guardar documentos',
  'aggregations.outputStage.mergeDocuments': 'Combinar documentos',
  'aggregations.outputStage.persistingTo':
    'Guardando documentos en {destination}',
  'aggregations.outputStage.persisting': 'Guardando documentos ...',
  'aggregations.outputStage.persistedToCollection':
    'Documentos guardados en la colección: {destination}',
  'aggregations.outputStage.persistedToSpecified':
    'Documentos guardados en la colección especificada',
  'aggregations.outputStage.goToCollectionPeriod': 'Ir a la colección.',
  'aggregations.ai.feedbackSubmitted': 'Tu opinión se ha enviado.',
  'aggregations.ai.placeholder':
    'Indica qué agregación crear (p. ej., contar las películas realizadas cada año) o pega una en otro lenguaje (SQL, Java, etc.)',
  'aggregations.extraSettings.toggleAutoPreview':
    'Alternar vista previa automática',
  'aggregations.extraSettings.preview': 'Vista previa',
  'aggregations.extraSettings.stages': 'Etapas',
  'aggregations.extraSettings.text': 'Texto',
  'aggregations.extraSettings.toggleWizard': 'Alternar asistente de etapas',
  'aggregations.extraSettings.wizard': 'Asistente',
  'aggregations.extraSettings.moreSettings': 'Más ajustes',
  'aggregations.inputDocuments.collapse': 'Contraer',
  'aggregations.inputDocuments.expand': 'Expandir',
  'aggregations.inputDocuments.countOne': '{count} documento',
  'aggregations.inputDocuments.countOther': '{count} documentos',
  'aggregations.inputDocuments.inCollection': 'en la colección',
  'aggregations.inputDocuments.refresh': 'Actualizar',
  'aggregations.inputDocuments.preview': 'Vista previa de los documentos',
  'aggregations.inputDocuments.sampling': 'Muestreando documentos...',
  'aggregations.sidePanel.title': 'Asistente de etapas',
  'aggregations.sidePanel.hide': 'Ocultar asistente de etapas',
  'aggregations.sidePanel.search': 'Buscar una etapa',
  'aggregations.wizard.useCase.match':
    'Buscar todos los documentos que cumplan una o más condiciones',
  'aggregations.wizard.useCase.basic-group':
    'Agrupar mis documentos según los valores de sus campos',
  'aggregations.wizard.useCase.group-with-statistics':
    'Calcular valores dentro de los grupos que creo',
  'aggregations.wizard.useCase.group-with-subset':
    'Devolver un subconjunto de valores según su orden o rango',
  'aggregations.wizard.useCase.project':
    'Incluir o excluir un subconjunto de campos de mis documentos',
  'aggregations.wizard.useCase.sort':
    'Ordenar documentos según uno o varios campos',
  'aggregations.wizard.useCase.lookup':
    'Unir documentos de distintas colecciones para comparar los valores de sus campos',
  'aggregations.wizard.useCase.text-search':
    'Buscar un campo de texto en todos los documentos de una colección',
  'aggregations.rerank.listLastSeparator': ', o ',
  'aggregations.rerank.insightDescription':
    'Estás intentando ejecutar una consulta con $rerank como primera etapa. Esto es costoso y aumenta la carga. Recomendamos usar $rerank como segunda etapa, después de {searchStages}.',
  'aggregations.rerank.addSearchStage': 'Añadir etapa $search',
  'aggregations.rerank.learnAboutSearch': 'Más información sobre la búsqueda',
  'aggregations.rerank.worksBetter':
    '$rerank funciona mejor después de una etapa de búsqueda',
  'aggregations.rerank.optimize':
    'Optimiza el rendimiento y el coste usando $rerank después de obtener resultados preliminares de una etapa como {searchStages}.',
  'aggregations.rerank.learnMore': 'Más información',
  'aggregations.serverError.rerankNotEnabled': '$rerank no está habilitado',
  'aggregations.serverError.enableReranking':
    'Habilita el reranking nativo en la configuración del proyecto.',
  'aggregations.serverError.projectSettings': 'Configuración del proyecto',
  'aggregations.serverError.editSearchIndex': 'Editar índice de búsqueda',
  'aggregations.serverError.debug': 'Depurar',
  'aggregations.options.collation': 'Intercalación',
  'aggregations.options.maxTimeMS': 'Tiempo máx. (ms)',
  'aggregations.options.maxTimeMSWebLimit':
    'Las operaciones de más de 5 minutos no se admiten en el entorno web',
  'aggregations.settings.title': 'Configuración',
  'aggregations.settings.cancel': 'Cancelar',
  'aggregations.settings.apply': 'Aplicar',
  'aggregations.settings.commentMode': 'Modo de comentarios',
  'aggregations.settings.commentModeDescription':
    'Si se habilita, se añaden comentarios de ayuda a cada etapa. Solo se aplica a las etapas nuevas.',
  'aggregations.settings.previewDocuments':
    'Número de documentos de vista previa',
  'aggregations.settings.previewDocumentsDescription':
    'Especifica el número de documentos que se mostrarán en la vista previa.',
  'aggregations.settings.limit': 'Límite',
  'aggregations.settings.limitDescription':
    'Limita los documentos de entrada antes de las etapas $group, $bucket y $bucketAuto. Establece un límite para que la vista previa se ejecute más rápido.',
  'aggregations.settings.limitNote':
    'Nota: este ajuste solo se aplica a las vistas previas de documentos, no cuando se ejecuta el pipeline.',
  'aggregations.stageSelect.preview': 'Vista previa',
  'aggregations.stageSelect.startFree': 'Empezar gratis',
  'aggregations.stageSelect.atlasOnly': 'Solo Atlas.',
  'aggregations.stageSelect.viewSearch80':
    'Solo Atlas. Requiere MongoDB {version}+ para ejecutarse en una vista. Para usar un índice de búsqueda en una vista en MongoDB 8.0, consulta la colección de origen de la vista, {sourceName}.',
  'aggregations.stageSelect.viewSearchRequires':
    'Solo Atlas. Requiere MongoDB {version}+ para ejecutarse en una vista.',
  'aggregations.stageSelect.viewSearchCompatible':
    'Solo Atlas. Solo las vistas que contienen etapas $match con el operador $expr, $addFields o $set son compatibles con los índices de búsqueda.',
  'aggregations.stageSelect.selectOperator': 'Seleccionar un operador de etapa',
  'aggregations.wizard.atlasOnly': 'Solo Atlas',
  'aggregations.wizard.cancel': 'Cancelar',
  'aggregations.wizard.apply': 'Aplicar',
  'aggregations.stageToolbar.stageNumber': 'Etapa {number}',
  'aggregations.stageToolbar.viewRerankUsage':
    'Ver uso y límites de frecuencia de $rerank',
  'aggregations.stageToolbar.viewIndexes': 'Ver índices',
  'aggregations.stageToolbar.disabled':
    'Etapa deshabilitada. Los resultados no se pasan en el pipeline.',
  'aggregations.stageToolbar.collapsed':
    'A continuación se mostrará una muestra de los resultados agregados de esta etapa.',
  'aggregations.stageToolbar.openFocusMode': 'Abrir etapa en modo de enfoque',
  'aggregations.pipelinePreview.previewResults':
    'Muestra una vista previa de los resultados para ver una muestra de los resultados agregados de este pipeline.',
  'aggregations.pipelinePreview.noDocuments':
    'No hay documentos de vista previa',
  'aggregations.pipelinePreview.outdated':
    'La salida está desactualizada y ya no está sincronizada.',
  'aggregations.pipelinePreview.title':
    'Vista previa de la salida del pipeline',
  'aggregations.pipelinePreview.sampleOne': 'Muestra de {count} documento',
  'aggregations.pipelinePreview.sampleOther': 'Muestra de {count} documentos',
  'aggregations.actions.interpret': 'Interpretar',
  'aggregations.actions.loadingInterpret': 'Cargando interpretación',
  'aggregations.actions.interpretInProgress': 'Interpretación en curso',
  'aggregations.actions.notSupported': 'No se admite para esta consulta',
  'aggregations.actions.assistantUnavailable':
    'El asistente no está disponible',
  'aggregations.actions.visualTree': 'Árbol visual',
  'aggregations.actions.rawOutput': 'Salida sin procesar',
  'aggregations.actions.updateView': 'Actualizar vista',
  'aggregations.actions.explainAggregation': 'Explicar agregación',
  'aggregations.actions.explain': 'Explicar',
  'aggregations.actions.runAggregation': 'Ejecutar agregación',
  'aggregations.actions.run': 'Ejecutar',
  'aggregations.results.persistedIn':
    'Resultados guardados en el espacio de nombres {namespace}',
  'aggregations.results.persisted': 'Resultados guardados',
  'aggregations.results.goToCollection': 'Ir a la colección',
  'aggregations.results.retry': 'REINTENTAR',
  'aggregations.results.viewErrorDetails': 'VER DETALLES DEL ERROR',
  'aggregations.results.persistingTo':
    'Guardando documentos en el espacio de nombres {namespace}',
  'aggregations.results.persisting': 'Guardando documentos',
  'aggregations.results.running': 'Ejecutando agregación',
  'aggregations.results.stop': 'Detener',
  'aggregations.stagePreview.noDocuments': 'No hay documentos de vista previa',
  'aggregations.stagePreview.loading': 'Cargando documentos de vista previa...',
  'aggregations.stagePreview.unavailable':
    'Vista previa no disponible: error en la {stage}.',
  'aggregations.stagePreview.score': 'Puntuación: {score}',
  'aggregations.focusMode.loading': 'Cargando',
  'aggregations.focusMode.options': 'Opciones',
  'aggregations.focusMode.stageInput': 'Entrada de la etapa',
  'aggregations.focusMode.stageOutput': 'Salida de la etapa',
  'aggregations.focusMode.stageLabel': 'Etapa {number}: {operator}',
  'aggregations.focusMode.select': 'seleccionar',
  'aggregations.focusMode.editPrevious': 'Editar etapa anterior',
  'aggregations.focusMode.goPrevious': 'Ir a la etapa anterior',
  'aggregations.focusMode.selectStage': 'Seleccionar etapa para editar',
  'aggregations.focusMode.editNext': 'Editar etapa siguiente',
  'aggregations.focusMode.goNext': 'Ir a la etapa siguiente',
  'aggregations.focusMode.enabled': 'Habilitada',
  'aggregations.focusMode.disabled': 'Deshabilitada',
  'aggregations.focusMode.disableStage': 'Deshabilitar etapa',
  'aggregations.focusMode.enableStage': 'Habilitar etapa',
  'aggregations.wizard.field.selectFields': 'Seleccionar campos',
  'aggregations.wizard.field.selectField': 'Seleccionar un campo',
  'aggregations.wizard.field.custom': 'Campo: «{name}»',
  'aggregations.wizard.field.unknown': 'Desconocido',
  'aggregations.wizard.group.fieldsEmpty':
    'Los campos de agrupación no pueden estar vacíos',
  'aggregations.wizard.group.basedOn': 'Agrupar documentos según',
  'aggregations.wizard.noFieldSelected': 'Ningún campo seleccionado',
  'aggregations.wizard.sort.sortBy': 'Ordenar documentos por',
  'aggregations.wizard.and': 'y',
  'aggregations.wizard.in': 'en',
  'aggregations.wizard.of': 'de',
  'aggregations.wizard.selectDirection': 'Seleccionar dirección',
  'aggregations.wizard.direction.Asc': 'Ascendente',
  'aggregations.wizard.direction.Desc': 'Descendente',
  'aggregations.wizard.lookup.enterAllFields': 'Completa todos los campos',
  'aggregations.wizard.lookup.joinFrom': 'Unir documentos de',
  'aggregations.wizard.lookup.selectCollection': 'Seleccionar colección',
  'aggregations.wizard.lookup.where': 'donde',
  'aggregations.wizard.lookup.selectForeignField': 'Seleccionar campo externo',
  'aggregations.wizard.lookup.fetchingFields': 'Obteniendo campos ...',
  'aggregations.wizard.lookup.fetchFieldsFailed':
    'No se pudieron obtener los campos. Escribe el nombre del campo manualmente.',
  'aggregations.wizard.lookup.selectCollectionFirst':
    'Selecciona primero una colección.',
  'aggregations.wizard.lookup.matches': 'coincide con',
  'aggregations.wizard.lookup.selectLocalField': 'Seleccionar campo local',
  'aggregations.wizard.lookup.arrayName': 'Nombre del array',
  'aggregations.wizard.lookup.as': 'como',
  'aggregations.wizard.match.selectOperator': 'Seleccionar un operador',
  'aggregations.wizard.match.expectedValue': 'Valor esperado',
  'aggregations.wizard.match.selectType': 'Seleccionar un tipo',
  'aggregations.wizard.match.and': 'Y',
  'aggregations.wizard.match.or': 'O',
  'aggregations.wizard.match.addNestedGroup': 'Añadir grupo anidado',
  'aggregations.wizard.match.nestedGroup': 'Grupo anidado',
  'aggregations.wizard.match.nestingLimit':
    'Compass no admite más de tres condiciones de coincidencia anidadas.',
  'aggregations.wizard.match.removeGroup': 'Eliminar grupo',
  'aggregations.wizard.statistics.calculate': 'Calcular',
  'aggregations.wizard.selectAccumulator': 'Seleccionar acumulador',
  'aggregations.wizard.accumulator.$avg': 'Promedio',
  'aggregations.wizard.accumulator.$min': 'Mínimo',
  'aggregations.wizard.accumulator.$stdDevPop': 'Desviación estándar',
  'aggregations.wizard.accumulator.$count': 'Recuento',
  'aggregations.wizard.accumulator.$max': 'Máximo',
  'aggregations.wizard.accumulator.$sum': 'Suma',
  'aggregations.wizard.statistics.selectOne':
    'Selecciona un acumulador de grupo',
  'aggregations.wizard.statistics.groupedBy': 'agrupado por',
  'aggregations.wizard.subset.accumulatorRequired':
    'Se requiere un acumulador.',
  'aggregations.wizard.subset.recordsInvalid':
    'El número de registros no es válido.',
  'aggregations.wizard.subset.fieldsRequired':
    'Se requieren los campos del acumulador.',
  'aggregations.wizard.subset.sortFieldsRequired':
    'Se requieren los campos de ordenación.',
  'aggregations.wizard.subset.returnThe': 'Devolver el/la',
  'aggregations.wizard.subset.accumulator.$first': 'Primero',
  'aggregations.wizard.subset.accumulator.$last': 'Último',
  'aggregations.wizard.subset.accumulator.$top': 'Superior',
  'aggregations.wizard.subset.accumulator.$bottom': 'Inferior',
  'aggregations.wizard.subset.numberOfRecords': 'Número de registros',
  'aggregations.wizard.subset.selectProjectFields':
    'Seleccionar nombres de campos de proyección',
  'aggregations.wizard.subset.fromGroupOf': 'de un grupo de',
  'aggregations.wizard.subset.selectGroupFields':
    'Seleccionar nombres de campos de agrupación',
  'aggregations.wizard.subset.sortedBy': 'documentos de una lista ordenada por',
  'aggregations.wizard.subset.selectSortFields':
    'Seleccionar nombres de campos de ordenación',
  'aggregations.wizard.subset.order': 'orden',
  'aggregations.wizard.search.noMaxEdits':
    'No se proporcionó ningún valor de maxEdits.',
  'aggregations.wizard.search.maxEditsRange': 'maxEdits debe ser 1 o 2.',
  'aggregations.wizard.search.noFields': 'No se proporcionó ningún campo.',
  'aggregations.wizard.search.noText':
    'No se proporcionó ningún texto de búsqueda',
  'aggregations.wizard.search.performA': 'Realizar una',
  'aggregations.wizard.search.selectType': 'Seleccionar tipo de búsqueda',
  'aggregations.wizard.search.textSearch': 'búsqueda de texto',
  'aggregations.wizard.search.fuzzySearch': 'búsqueda difusa',
  'aggregations.wizard.search.with': 'con',
  'aggregations.wizard.search.example': 'p. ej. 2',
  'aggregations.wizard.search.forAllDocuments':
    'para todos los documentos donde',
  'aggregations.wizard.search.selectPath': 'Seleccionar ruta de búsqueda',
  'aggregations.wizard.search.fieldNames': 'nombres de campos',
  'aggregations.wizard.search.anyFields': 'cualquier campo',
  'aggregations.wizard.search.contains': 'contienen',
  'aggregations.wizard.search.text': 'texto',
  'aggregations.wizard.search.using': 'usando',
  'aggregations.wizard.search.selectIndex':
    'Seleccionar o escribir un índice de búsqueda',
  'aggregations.wizard.search.fetchingIndexes':
    'Obteniendo índices de búsqueda ...',
  'aggregations.wizard.search.fetchIndexesFailed':
    'No se pudieron obtener los índices de búsqueda. Escribe el nombre del índice manualmente.',
  'aggregations.wizard.search.customIndex': 'Índice: «{name}»',
  'aggregations.writeConfirmation.title':
    'Se realizará una operación de escritura',
  'aggregations.writeConfirmation.confirm': 'Sí, ejecutar pipeline',
  'aggregations.newPipelineConfirm.title':
    '¿Seguro que quieres crear un pipeline nuevo?',
  'aggregations.newPipelineConfirm.description':
    'Al crear este pipeline se descartarán los cambios sin guardar del pipeline actual.',
  'aggregations.savedPipeline.parseError':
    'No se puede analizar el origen del pipeline en etapas',
  'aggregations.savedPipeline.syntaxErrors':
    'El pipeline cargado «{name}» contiene errores de sintaxis',
  'aggregations.savedPipeline.openConfirmTitle':
    '¿Seguro que quieres abrir este pipeline?',
  'aggregations.savedPipeline.openConfirmDescription':
    'Al abrir este proyecto se descartarán los cambios sin guardar del pipeline que estás creando.',
  'aggregations.savedPipeline.openConfirmButton': 'Abrir pipeline',
  'aggregations.savedPipeline.deleteConfirmTitle':
    '¿Seguro que quieres eliminar este pipeline?',
  'aggregations.savedPipeline.deleteConfirmDescription':
    'Al eliminar este pipeline se quitará de tus pipelines guardados.',
  'aggregations.savedPipeline.deleteConfirmButton': 'Eliminar pipeline',
  'aggregations.updateView.confirmTitle':
    '¿Seguro que quieres actualizar la vista?',
  'aggregations.updateView.confirmSearchIndexes':
    'Hay índices de búsqueda creados en esta vista. Al actualizar la vista se reconstruirán los índices, lo que consumirá recursos adicionales de tu clúster.',
  'aggregations.updateView.confirmIncompatible':
    'Esta actualización hará que la vista sea incompatible con los índices de búsqueda y provocará que todos fallen. Solo las vistas que contienen etapas $addFields, $set o $match con el operador $expr son compatibles con los índices de búsqueda.',
  'aggregations.updateView.confirmButton': 'Actualizar',
  'aggregations.ai.networkError': 'Error de red',
  'aggregations.ai.unauthorized': 'No autorizado',
  'aggregations.ai.noPipeline':
    'No se devolvió ningún pipeline. Inténtalo de nuevo con otra solicitud.',
  'aggregations.tabTitle': 'Agregaciones',
  'editor.collapseAll': 'Contraer todo',
  'editor.expandAll': 'Expandir todo',
  'editor.copy': 'Copiar',
  'editor.format': 'Dar formato',
  'editor.safeInteger.exceedsRange': 'Excede el rango de enteros seguro.',
  'editor.safeInteger.convertToLong': 'Convertir a Long',
  'editor.foldCodeBlock': 'Contraer bloque de código',
  'editor.unfoldCodeBlock': 'Expandir bloque de código',
  'explainPlan.modal.running': 'Ejecutando explain',
  'explainPlan.modal.title': 'Plan de ejecución (Explain)',
  'explainPlan.modal.subtitle':
    'Explain proporciona métricas de ejecución clave que ayudan a diagnosticar consultas lentas y a optimizar el uso de índices.',
  'explainPlan.modal.learnMore': 'Más información',
  'explainPlan.modal.interpret': 'Interpretar',
  'explainPlan.modal.interpretTooltip':
    'Entiende la salida de Explain en lenguaje natural y obtén sugerencias para mejorar el rendimiento',
  'explainPlan.modal.cancel': 'Cancelar',
  'explainPlan.modal.close': 'Cerrar',
  'explainPlan.view.visualTree': 'Árbol visual',
  'explainPlan.view.rawOutput': 'Salida sin procesar',
  'explainPlan.summary.noIndex':
    'No hay ningún índice disponible para esta consulta.',
  'explainPlan.summary.coveredByIndex': 'Consulta cubierta por el índice:',
  'explainPlan.summary.multipleIndexes':
    'La consulta usó los siguientes índices (los resultados de los shards difieren):',
  'explainPlan.summary.usedIndex': 'La consulta usó el siguiente índice:',
  'explainPlan.summary.indexDefinition.start':
    'Los índices usados para cumplir la consulta. Un valor de',
  'explainPlan.summary.indexDefinition.ascending':
    'indica un índice ascendente y un valor de',
  'explainPlan.summary.indexDefinition.descending':
    'indica un índice descendente.',
  'explainPlan.summary.title': 'Resumen del rendimiento de la consulta',
  'explainPlan.summary.docsReturned': 'documentos devueltos',
  'explainPlan.summary.docsReturnedDefinition':
    'Número de documentos devueltos por la consulta.',
  'explainPlan.summary.docsExamined': 'documentos examinados',
  'explainPlan.summary.docsExaminedDefinition':
    'Número de documentos examinados durante la ejecución de la consulta. Cuando un índice cubre una consulta, este valor es 0.',
  'explainPlan.summary.executionTime': 'tiempo de ejecución',
  'explainPlan.summary.executionTimeDefinition':
    'Tiempo total en milisegundos para la selección del plan de consulta y la ejecución de la consulta.',
  'explainPlan.summary.isSorted': 'Está',
  'explainPlan.summary.isNotSorted': 'No está',
  'explainPlan.summary.sortedInMemory': 'ordenado en memoria',
  'explainPlan.summary.sortedInMemoryDefinition':
    'Indica si la operación de ordenación se realizó en la memoria del sistema. Las ordenaciones en memoria rinden mejor que las ordenaciones en disco.',
  'explainPlan.summary.indexKeysExamined': 'claves de índice examinadas',
  'explainPlan.summary.indexKeysExaminedDefinition':
    'Número de índices examinados para cumplir la consulta.',
  'explainPlan.zoom.in': 'Acercar',
  'explainPlan.zoom.out': 'Alejar',
  'explainPlan.cannotVisualize':
    'El plan de ejecución visual no se admite para esta consulta en esta colección en esta versión de Compass. Consulta la salida JSON sin procesar de Explain para obtener información sobre la operación.',
  'explainPlan.stage.highlight.Index Name': 'Nombre del índice',
  'explainPlan.stage.highlight.Multi Key Index': 'Índice multiclave',
  'explainPlan.stage.highlight.Transform by': 'Transformado por',
  'explainPlan.stage.highlight.Documents Examined': 'Documentos examinados',
  'explainPlan.stage.yes': 'sí',
  'explainPlan.stage.no': 'no',
  'explainPlan.stage.returned': 'Devueltos',
  'explainPlan.stage.executionTime': 'Tiempo de ejecución',
  'explainPlan.stage.clockTooltip':
    'El reloj representa el tiempo total que tardó en completarse la consulta. El segmento azul del reloj es el tiempo empleado por la etapa resaltada ({ms} ms). El segmento gris es el tiempo empleado por las etapas anteriores.',
  'explainPlan.interpretError.title':
    'No se pudo interpretar el plan de ejecución',
  'explainPlan.interpretError.description':
    'No se pudo obtener el plan de ejecución. Inténtalo de nuevo.',
  'exportToLanguage.title.query': 'Exportar consulta a un lenguaje',
  'exportToLanguage.title.deleteQuery':
    'Exportar consulta de eliminación a un lenguaje',
  'exportToLanguage.title.updateQuery':
    'Exportar consulta de actualización a un lenguaje',
  'exportToLanguage.title.pipeline': 'Exportar pipeline a un lenguaje',
  'exportToLanguage.input.query': 'Mi consulta',
  'exportToLanguage.input.deleteQuery': 'Mi consulta de eliminación',
  'exportToLanguage.input.updateQuery': 'Mi consulta de actualización',
  'exportToLanguage.input.pipeline': 'Mi pipeline',
  'exportToLanguage.output.query': 'Consulta exportada',
  'exportToLanguage.output.deleteQuery': 'Consulta de eliminación exportada',
  'exportToLanguage.output.updateQuery': 'Consulta de actualización exportada',
  'exportToLanguage.output.pipeline': 'Pipeline exportado',
  'exportToLanguage.includeImports': 'Incluir instrucciones de importación',
  'exportToLanguage.includeDrivers': 'Incluir sintaxis del controlador',
  'exportToLanguage.useBuilders': 'Usar builders',
  'queryBar.explain.interpret': 'Interpretar',
  'queryBar.explain.loadingInterpret': 'Cargando interpretación',
  'queryBar.explain.interpretInProgress': 'Interpretación en curso',
  'queryBar.explain.assistantUnavailable': 'El asistente no está disponible',
  'queryBar.explain.visualTree': 'Árbol visual',
  'queryBar.explain.rawOutput': 'Salida sin procesar',
  'queryBar.explainQuery': 'Explicar consulta',
  'queryBar.explainTooltip': 'Ver el plan de ejecución de la consulta actual',
  'queryBar.explain': 'Explicar',
  'queryBar.resetQuery': 'Restablecer consulta',
  'queryBar.reset': 'Restablecer',
  'queryBar.apply': 'Aplicar',
  'queryBar.placeholder.filter': "Escribe una consulta: { field: 'value' }",
  'queryBar.placeholder.sort': "{ field: -1 } o [['field', -1]]",
  'queryBar.placeholder.hint': '{ field: -1 } o "indexName"',
  'queryBar.option.project': 'Proyección',
  'queryBar.option.sort': 'Orden',
  'queryBar.option.hint': 'Sugerencia de índice',
  'queryBar.option.collation': 'Intercalación',
  'queryBar.option.skip': 'Omitir',
  'queryBar.option.limit': 'Límite',
  'queryBar.option.maxTimeMS': 'Tiempo máx. (ms)',
  'queryBar.maxTimeMSWebLimit':
    'Las operaciones de más de 5 minutos no se admiten en el entorno web',
  'queryBar.ai.feedbackSubmitted': 'Tu opinión se ha enviado.',
  'queryBar.ai.networkError': 'Error de red',
  'queryBar.ai.unauthorized': 'No autorizado',
  'queryBar.ai.noQuery':
    'La IA no devolvió ninguna consulta. Intenta reformular tu solicitud.',
  'queryBar.history.open': 'Abrir historial de consultas',
  'queryBar.history.title': 'Historial de consultas',
  'queryBar.history.favoriteName': 'Nombre del favorito',
  'queryBar.history.save': 'Guardar',
  'queryBar.history.cancel': 'Cancelar',
  'queryBar.history.queriesIn': 'Consultas en',
  'queryBar.history.recents': 'Recientes',
  'queryBar.history.favorites': 'Favoritas',
  'queryBar.history.noFavorites': 'Tus consultas favoritas aparecerán aquí.',
  'queryBar.history.noRecents': 'Tus consultas recientes aparecerán aquí.',
  'queryBar.history.favoriteQuery': 'Marcar consulta como favorita',
  'queryBar.history.copyQuery': 'Copiar consulta al portapapeles',
  'queryBar.history.deleteQuery': 'Eliminar consulta de la lista',
  'queryBar.history.openInModal': 'Abrir en un cuadro de diálogo',
};
