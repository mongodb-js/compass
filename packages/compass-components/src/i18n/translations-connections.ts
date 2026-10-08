import type { Catalog } from './translations';

// Texts of the connection form, connection notifications and dialogs,
// connection import/export and the embedded shell. See ./translations.ts for
// the key conventions.

export const de: Catalog = {
  'connections.form.advancedOptions': 'Erweiterte Verbindungsoptionen',
  'connections.form.disabledOverlay':
    'Das Verbindungsformular ist deaktiviert, solange der Verbindungs-String nicht geparst werden kann.',
  'connections.form.tabs.general': 'Allgemein',
  'connections.form.tabs.authentication': 'Authentifizierung',
  'connections.form.tabs.tls': 'TLS/SSL',
  'connections.form.tabs.proxy': 'Proxy/SSH',
  'connections.form.tabs.csfle': 'In-Use-Verschlüsselung',
  'connections.form.tabs.advanced': 'Erweitert',
  'connections.form.tabs.ariaLabel': 'Tabs der erweiterten Optionen',
  'connections.form.tabs.errorCount.other': '{count} Fehler',
  'connections.form.tabs.errorCount.one': '{count} Fehler',
  'connections.form.advanced.replicaSetName': 'Name des Replica Sets',
  'connections.form.advanced.defaultDatabase':
    'Standard-Authentifizierungsdatenbank',
  'connections.form.advanced.defaultDatabaseDescription':
    'Authentifizierungsdatenbank, die verwendet wird, wenn authSource nicht angegeben ist.',
  'connections.form.advanced.learnMore': 'Mehr erfahren',
  'connections.form.advanced.selectKey': 'Schlüssel auswählen',
  'connections.form.advanced.value': 'Wert',
  'connections.form.advanced.namedValue': 'Wert von {name}',
  'connections.form.advanced.urlOptionValue': 'Wert der URL-Option',
  'connections.form.advanced.uriOptions': 'URI-Optionen',
  'connections.form.advanced.uriOptionsDescription':
    'Füge zusätzliche MongoDB-URI-Optionen hinzu, um deine Verbindung anzupassen.',
  'connections.form.readPreference.title': 'Leseeinstellung (Read Preference)',
  'connections.form.readPreference.description':
    'Lege fest, an welche Mitglieder deine Lesevorgänge gehen.',
  'connections.form.readPreference.default': 'Standard',
  'connections.form.readPreference.tags': 'Tags der Leseeinstellung',
  'connections.form.readPreference.tagsDescription':
    'Werden der Reihe nach ausprobiert. Lass einen Satz leer, um auf ein beliebiges Mitglied zurückzufallen.',
  'connections.form.readPreference.tagsEmpty': 'Leer: beliebiges Mitglied',
  'connections.form.readPreference.maxStaleness':
    'Maximale Veraltung in Sekunden',
  'connections.form.readPreference.maxStalenessDescription':
    'Mindestens 90 Sekunden.',
  'connections.form.auth.method': 'Authentifizierungsmethode',
  'connections.form.auth.usernamePassword': 'Benutzername/Passwort',
  'connections.form.auth.username': 'Benutzername',
  'connections.form.auth.password': 'Passwort',
  'connections.form.auth.database': 'Authentifizierungsdatenbank',
  'connections.form.auth.databaseDocs':
    'Dokumentation zur Authentifizierungsdatenbank',
  'connections.form.auth.mechanism': 'Authentifizierungsmechanismus',
  'connections.form.auth.mechanismDefault': 'Standard',
  'connections.form.auth.principal': 'Principal',
  'connections.form.auth.serviceName': 'Dienstname',
  'connections.form.auth.canonicalizeHostName': 'Hostnamen kanonisieren',
  'connections.form.auth.canonicalize.none': 'Keine',
  'connections.form.auth.canonicalize.forward': 'Vorwärts',
  'connections.form.auth.canonicalize.forwardAndReverse':
    'Vorwärts und rückwärts',
  'connections.form.auth.serviceRealm': 'Dienst-Realm',
  'connections.form.auth.providePassword': 'Passwort direkt angeben',
  'connections.form.auth.awsAccessKeyId': 'AWS-Zugriffsschlüssel-ID',
  'connections.form.auth.awsSecretAccessKey': 'Geheimer AWS-Zugriffsschlüssel',
  'connections.form.auth.awsSessionToken': 'AWS-Sitzungstoken',
  'connections.form.auth.x509Prefix': 'Für die X.509-Authentifizierung ist ein',
  'connections.form.auth.x509ClientCertificate': 'Client-Zertifikat',
  'connections.form.auth.x509Middle':
    'erforderlich. Stelle sicher, dass TLS aktiviert ist, und füge eines im Tab',
  'connections.form.auth.x509Suffix': ' hinzu.',
  'connections.form.auth.oidc.options': 'OIDC-Optionen',
  'connections.form.auth.oidc.redirectUri': 'Redirect-URI des Auth-Code-Flows',
  'connections.form.auth.oidc.redirectUriDescription':
    'Dieser Wert muss mit der Konfiguration des vom Server verwendeten Identity Providers übereinstimmen.',
  'connections.form.auth.oidc.trustedEndpoint':
    'Ziel-Endpunkt als vertrauenswürdig behandeln',
  'connections.form.auth.oidc.trustedEndpointDescription':
    'Erlaubt die Verbindung, wenn der Ziel-Endpunkt nicht in der Liste der standardmäßig als vertrauenswürdig geltenden Endpunkte steht. Verwende diese Option nur, wenn du dich mit Servern verbindest, denen du vertraust.',
  'connections.form.auth.oidc.idToken': 'ID-Token statt Access-Token verwenden',
  'connections.form.auth.oidc.idTokenDescription':
    'Verwendet ID-Tokens statt Access-Tokens, um falsch konfigurierte oder fehlerhafte Identity Provider zu umgehen. Das funktioniert nur, wenn der Server entsprechend konfiguriert ist.',
  'connections.form.auth.oidc.nonce': 'Nonce in der Auth-Code-Anfrage senden',
  'connections.form.auth.oidc.nonceDescription':
    'Fügt der Auth-Code-Anfrage eine zufällige Nonce hinzu, um Replay-Angriffe zu verhindern. Dies sollte nur deaktiviert werden, wenn der OIDC-Provider sie nicht unterstützt, da die Nonce eine wichtige Sicherheitskomponente ist.',
  'connections.form.auth.oidc.appProxy':
    'Proxy-Einstellungen der Anwendung verwenden',
  'connections.form.auth.oidc.appProxyPrefix': 'Verwende die',
  'connections.form.auth.oidc.appProxyLink':
    'Proxy-Einstellungen der Anwendung',
  'connections.form.auth.oidc.appProxySuffix':
    'für die Kommunikation mit dem Identity Provider. Wenn nicht ausgewählt, wird derselbe Proxy (falls vorhanden) sowohl für die Verbindung zum Cluster als auch zum Identity Provider verwendet.',
  'connections.form.auth.oidc.deviceAuth':
    'Device-Authentifizierungsflow aktivieren',
  'connections.form.auth.oidc.deviceAuthDescription':
    'Weniger sicherer Authentifizierungsablauf, der als Ausweichlösung genutzt werden kann, wenn die browserbasierte Authentifizierung nicht verfügbar ist.',
  'connections.form.csfle.enterpriseOnly':
    'In-Use-Verschlüsselung ist eine Funktion von MongoDB, die nur in Enterprise/Atlas verfügbar ist.',
  'connections.form.csfle.keyVaultNamespace': 'Key-Vault-Namespace',
  'connections.form.csfle.keyVaultNamespaceDescription':
    'Gib eine Collection an, in der Datenverschlüsselungsschlüssel gespeichert werden, im Format <db>.<collection>.',
  'connections.form.csfle.kmsProviders': 'KMS-Provider',
  'connections.form.csfle.kmsProvidersDescription':
    'Gib ein oder mehrere zu verwendende Key-Management-Systeme an.',
  'connections.form.csfle.storeSecrets':
    'Geheimnisse der KMS-Provider speichern',
  'connections.form.csfle.storeSecretsDescription':
    'Legt fest, ob KMS-Geheimnisse auf dem Datenträger gespeichert (durch den Schlüsselbund des Betriebssystems geschützt) oder nach dem Trennen der Verbindung verworfen werden.',
  'connections.form.csfle.localKms': 'Lokales KMS',
  'connections.form.csfle.encryptedFieldsMapDescription':
    'Füge optional eine clientseitige EncryptedFieldsMap für mehr Sicherheit hinzu.',
  'connections.form.csfle.generateKey': 'Zufälligen Schlüssel generieren',
  'connections.form.csfle.generatedKeyInfo':
    'Dieser Schlüssel wird zum Verschlüsseln der in der Datenbank gespeicherten Daten verwendet. Ohne ihn kann nicht auf verschlüsselte Daten zugegriffen werden.',
  'connections.form.csfle.generatedKeyWarning':
    'Compass speichert KMS-Zugangsdaten standardmäßig nicht. Kopiere den Schlüssel und speichere ihn an einem externen Ort.',
  'connections.form.csfle.kmsName': 'KMS-Name',
  'connections.form.csfle.editKmsName': 'Namen des KMS-Providers bearbeiten',
  'connections.form.csfle.nameEmpty': 'Der Name darf nicht leer sein',
  'connections.form.csfle.nameExists': 'Der Name existiert bereits',
  'connections.form.csfle.nameInvalid':
    'Der Name muss alphanumerisch sein und darf Unterstriche enthalten',
  'connections.form.csfle.removeKms': 'KMS-Provider entfernen',
  'connections.form.csfle.addItem': 'Element hinzufügen',
  'connections.form.csfle.statusError': 'Fehler',
  'connections.form.csfle.statusIncomplete': 'Unvollständige Konfiguration',
  'connections.form.csfle.statusConfigured': 'Vollständig konfiguriert',
  'connections.form.csfle.field.gcp.email.label':
    'E-Mail-Adresse des Dienstkontos',
  'connections.form.csfle.field.gcp.email.description':
    'Die E-Mail-Adresse des Dienstkontos für die Authentifizierung.',
  'connections.form.csfle.field.gcp.privateKey.label': 'Privater Schlüssel',
  'connections.form.csfle.field.gcp.privateKey.description':
    'Ein Base64-kodierter privater PKCS#8-Schlüssel.',
  'connections.form.csfle.field.gcp.endpoint.label': 'Endpunkt',
  'connections.form.csfle.field.gcp.endpoint.description':
    'Ein Host mit optionalem Port.',
  'connections.form.csfle.field.aws.accessKeyId.label': 'Zugriffsschlüssel-ID',
  'connections.form.csfle.field.aws.accessKeyId.description':
    'Der Zugriffsschlüssel für den AWS-KMS-Provider.',
  'connections.form.csfle.field.aws.secretAccessKey.label':
    'Geheimer Zugriffsschlüssel',
  'connections.form.csfle.field.aws.secretAccessKey.description':
    'Der geheime Zugriffsschlüssel für den AWS-KMS-Provider.',
  'connections.form.csfle.field.aws.sessionToken.label': 'Sitzungstoken',
  'connections.form.csfle.field.aws.sessionToken.description':
    'Ein optionales AWS-Sitzungstoken, das als X-Amz-Security-Token-Header für AWS-Anfragen verwendet wird.',
  'connections.form.csfle.field.azure.tenantId.label': 'Mandanten-ID',
  'connections.form.csfle.field.azure.tenantId.description':
    'Die Mandanten-ID identifiziert die Organisation des Kontos.',
  'connections.form.csfle.field.azure.clientId.label': 'Client-ID',
  'connections.form.csfle.field.azure.clientId.description':
    'Die Client-ID zur Authentifizierung einer registrierten Anwendung.',
  'connections.form.csfle.field.azure.clientSecret.label': 'Client-Secret',
  'connections.form.csfle.field.azure.clientSecret.description':
    'Das Client-Secret zur Authentifizierung einer registrierten Anwendung.',
  'connections.form.csfle.field.azure.identityPlatformEndpoint.label':
    'Endpunkt der Identitätsplattform',
  'connections.form.csfle.field.azure.identityPlatformEndpoint.description':
    'Ein Host mit optionalem Port.',
  'connections.form.csfle.field.kmip.endpoint.label': 'Endpunkt',
  'connections.form.csfle.field.kmip.endpoint.description':
    'Der Endpunkt besteht aus einem Hostnamen und einem Port, getrennt durch einen Doppelpunkt.',
  'connections.form.csfle.field.local.key.label': 'Schlüssel',
  'connections.form.csfle.field.local.key.description':
    'Ein 96 Byte langer Base64-kodierter String. Lokal verwaltete Schlüssel erfordern keine zusätzliche Einrichtung, werden für Produktivanwendungen aber nicht empfohlen.',
  'connections.form.general.directConnection': 'Direktverbindung',
  'connections.form.general.directConnectionDescription':
    'Legt fest, ob alle Operationen erzwungen an den angegebenen Host gesendet werden sollen.',
  'connections.form.general.hostname': 'Hostname',
  'connections.form.general.host': 'Host',
  'connections.form.general.scheme': 'Schema des Verbindungs-Strings',
  'connections.form.general.srvSchemeDescription':
    'Verbindungsformat mit DNS-Seed-Liste. Das +srv signalisiert dem Client, dass der folgende Hostname einem DNS-SRV-Eintrag entspricht.',
  'connections.form.general.regularSchemeDescription':
    'Standardformat des Verbindungs-Strings. Das Standardformat des MongoDB-Verbindungs-URI wird verwendet, um sich mit einem MongoDB-Deployment zu verbinden: Standalone, Replica Set oder Sharded Cluster.',
  'connections.form.proxy.appProxyPrefix': 'Verwende die',
  'connections.form.proxy.appProxyLink': 'Proxy-Einstellungen der Anwendung',
  'connections.form.proxy.appProxySuffix':
    'für die Kommunikation mit dem Cluster.',
  'connections.form.proxy.none': 'Keine',
  'connections.form.proxy.sshPassword': 'SSH mit Passwort',
  'connections.form.proxy.sshIdentity': 'SSH mit Identitätsdatei',
  'connections.form.proxy.socks': 'Socks5',
  'connections.form.proxy.applicationLevel': 'Proxy auf Anwendungsebene',
  'connections.form.proxy.method': 'SSH-Tunnel-/Proxy-Methode',
  'connections.form.proxy.hostname': 'Proxy-Hostname',
  'connections.form.proxy.port': 'Proxy-Tunnel-Port',
  'connections.form.proxy.username': 'Proxy-Benutzername',
  'connections.form.proxy.password': 'Proxy-Passwort',
  'connections.form.ssh.hostname': 'SSH-Hostname',
  'connections.form.ssh.port': 'SSH-Port',
  'connections.form.ssh.username': 'SSH-Benutzername',
  'connections.form.ssh.identityFile': 'SSH-Identitätsdatei',
  'connections.form.ssh.passphrase': 'SSH-Passphrase',
  'connections.form.ssh.password': 'SSH-Passwort',
  'connections.form.tls.learnMore': 'Mehr erfahren',
  'connections.form.tls.certificateAuthority': 'Zertifizierungsstelle (.pem)',
  'connections.form.tls.clientCertificate':
    'Client-Zertifikat und Schlüssel (.pem)',
  'connections.form.tls.clientCertificateOptional':
    'Optional (erforderlich bei X.509-Authentifizierung)',
  'connections.form.tls.clientKeyPassword': 'Passwort des Client-Schlüssels',
  'connections.form.tls.insecureDescription':
    'Dies umfasst tlsAllowInvalidHostnames und tlsAllowInvalidCertificates.',
  'connections.form.tls.invalidHostnamesDescription':
    'Deaktiviert die Prüfung der Hostnamen im Zertifikat, das die mongod-/mongos-Instanz präsentiert.',
  'connections.form.tls.invalidCertificatesDescription':
    'Deaktiviert die Prüfung der Serverzertifikate.',
  'connections.form.tls.connection': 'SSL/TLS-Verbindung',
  'connections.form.tls.docsAriaLabel': 'Dokumentation zu den TLS/SSL-Optionen',
  'connections.form.tls.type.DEFAULT': 'Standard',
  'connections.form.tls.type.ON': 'An',
  'connections.form.tls.type.OFF': 'Aus',
  'connections.form.actions.cancel': 'Abbrechen',
  'connections.form.actions.save': 'Speichern',
  'connections.form.actions.connect': 'Verbinden',
  'connections.form.actions.saveAndConnect': 'Speichern und verbinden',
  'connections.form.personalization.name': 'Name',
  'connections.form.personalization.color': 'Farbe',
  'connections.form.personalization.noColor': 'Keine Farbe',
  'connections.form.personalization.favorite':
    'Diese Verbindung als Favorit markieren',
  'connections.form.personalization.favoriteDescription':
    'Eine als Favorit markierte Verbindung wird oben in deiner Verbindungsliste angeheftet.',
  'connections.form.color.color1': 'Grün',
  'connections.form.color.color2': 'Türkis',
  'connections.form.color.color3': 'Blau',
  'connections.form.color.color4': 'Indigo',
  'connections.form.color.color5': 'Violett',
  'connections.form.color.color6': 'Rot',
  'connections.form.color.color7': 'Rosa',
  'connections.form.color.color8': 'Orange',
  'connections.form.color.color9': 'Gelb',
  'connections.form.color.color10': 'Grau',
  'connections.form.overriddenOptions':
    'Einige Verbindungsoptionen wurden durch die Einstellungen überschrieben: {keys}',
  'connections.form.unableToSave':
    'Die Verbindung konnte nicht gespeichert werden: {message}',
  'connections.form.newConnection': 'Neue Verbindung',
  'connections.form.editConnection': 'Verbindung bearbeiten',
  'connections.form.manageSettings': 'Verbindungseinstellungen verwalten',
  'connections.form.connectedWarning':
    'Solange die Verbindung besteht, kannst du nur Name, Farbe oder Favoritenstatus der Verbindung anpassen. Um sie vollständig zu konfigurieren, musst du sie zuerst trennen. Beachte, dass beim Trennen laufende Arbeit verloren gehen kann.',
  'connections.form.disconnect': 'Trennen',
  'connections.form.protectedWarning':
    'Die erweiterten Verbindungsoptionen sind ausgeblendet, solange die Einstellung „Geheimnisse in Verbindungs-Strings schützen“ aktiviert ist. Deaktiviere die Einstellung, um die erweiterten Verbindungsoptionen zu konfigurieren oder deinen Verbindungs-String zu bearbeiten.',
  'connections.form.connectionString.editConfirmTitle':
    'Möchtest du deinen Verbindungs-String wirklich bearbeiten?',
  'connections.form.connectionString.editConfirmDescription':
    'Beim Bearbeiten dieses Verbindungs-Strings werden deine Zugangsdaten sichtbar.',
  'connections.form.connectionString.docsAriaLabel':
    'Dokumentation zum Verbindungs-String',
  'connections.form.connectionString.edit': 'Verbindungs-String bearbeiten',
  'connections.form.connectionString.placeholder':
    'z. B. mongodb+srv://username:password@cluster0-jtpxd.mongodb.net/admin',
  'connections.form.help.findTitle':
    'Wie finde ich meinen Verbindungs-String in Atlas?',
  'connections.form.help.findBody':
    'Wenn du einen Atlas-Cluster hast, öffne die Cluster-Ansicht. Klicke bei dem Cluster, mit dem du dich verbinden möchtest, auf die Schaltfläche „Connect“.',
  'connections.form.help.seeExample': 'Beispiel ansehen',
  'connections.form.help.formatTitle':
    'Wie formatiere ich meinen Verbindungs-String?',
  'connections.form.validation.readPreferenceOptionsMode':
    'Tags der Leseeinstellung und maximale Veraltung können nur mit einer anderen Leseeinstellung als primary verwendet werden.',
  'connections.form.validation.tagSetFormat':
    'Tag-Sets müssen das Format key0:value0,key1:value1 haben.',
  'connections.form.validation.maxStaleness':
    'Die maximale Veraltung muss mindestens 90 Sekunden betragen.',
  'connections.form.validation.usernameMissing': 'Der Benutzername fehlt.',
  'connections.form.validation.passwordMissing': 'Das Passwort fehlt.',
  'connections.form.validation.x509Tls':
    'TLS muss aktiviert sein, um die x509-Authentifizierung zu verwenden.',
  'connections.form.validation.x509Certificate':
    'Für die x509-Authentifizierung ist ein Client-Zertifikat erforderlich.',
  'connections.form.validation.kerberosPrincipal':
    'Für Kerberos ist ein Principal-Name erforderlich.',
  'connections.form.validation.sshHostname':
    'Für die Verbindung über einen SSH-Tunnel ist ein Hostname erforderlich.',
  'connections.form.validation.sshCredentials':
    'Für die Verbindung über einen SSH-Tunnel ist entweder ein Passwort oder eine Identitätsdatei erforderlich.',
  'connections.form.validation.sshPassphraseFile':
    'Zusammen mit der Passphrase ist eine Datei erforderlich.',
  'connections.form.validation.proxyHostname':
    'Der Proxy-Hostname ist erforderlich.',
  'connections.form.validation.keyVaultFormat':
    'Der Key-Vault-Namespace muss das Format <db>.<collection> haben',
  'connections.form.validation.keyVaultRequired':
    'Für Verbindungen mit aktivierter In-Use-Verschlüsselung muss ein Key-Vault-Namespace angegeben werden',
  'connections.form.validation.localKey':
    'Der lokale Schlüssel muss ein Base64-kodierter String mit 96 Byte sein',
  'connections.form.validation.kmipEndpoint':
    'Der KMIP-Endpunkt muss das Format <host>:<port> haben',
  'connections.form.validation.csfleStoredToDisk':
    'Die Zugangsdaten der KMS-Provider für die In-Use-Verschlüsselung werden auf dem Datenträger gespeichert.',
  'connections.form.validation.certificateValidationDisabled':
    'Die Validierung von TLS/SSL-Zertifikaten ist deaktiviert. Aktiviere nach Möglichkeit die Zertifikatsvalidierung, um Sicherheitslücken zu vermeiden.',
  'connections.form.validation.directConnectionSrv':
    'directConnection wird mit SRV-URIs nicht unterstützt.',
  'connections.form.validation.directConnectionReplicaSet':
    'directConnection wird zusammen mit replicaSet nicht unterstützt.',
  'connections.form.validation.directConnectionMultipleHosts':
    'directConnection wird mit mehreren Hosts nicht unterstützt.',
  'connections.form.validation.tlsDisabled':
    'TLS/SSL ist deaktiviert. Aktiviere nach Möglichkeit TLS/SSL, um Sicherheitslücken zu vermeiden.',
  'connections.form.validation.socksPlaintext':
    'Das Passwort des Socks5-Proxys wird im Klartext übertragen.',
  'connections.form.validation.remoteProxyLocalHost':
    'Ein Remote-Proxy wird mit einem lokalen MongoDB-Dienst-Host verwendet.',
  'connections.form.validation.encryptedFieldConfig':
    'EncryptedFieldConfig ist ungültig: {error}',
  'connections.form.validation.unknownReadPreference':
    'Unbekannte Leseeinstellung {readPreference}',
  'connections.form.validation.invalidHostCharacter':
    "Ungültiges Zeichen im Host: '{character}'",
  'connections.form.validation.schemaUpdate':
    'Fehler beim Aktualisieren des Verbindungsschemas: {message}',
  'connections.notifications.connecting':
    'Verbindung zu {title} wird hergestellt',
  'connections.notifications.completeAuthInBrowser':
    'Schließe die Authentifizierung im Browser ab',
  'connections.notifications.connectionFailed': 'Verbindung fehlgeschlagen',
  'connections.notifications.debug': 'Debuggen',
  'connections.notifications.review': 'Prüfen',
  'connections.notifications.cancel': 'ABBRECHEN',
  'connections.notifications.connected': 'Verbunden mit {title}',
  'connections.notifications.maxConnections.one':
    'Es kann nur {count} Verbindung gleichzeitig bestehen. Trenne zuerst eine andere Verbindung.',
  'connections.notifications.maxConnections.other':
    'Es können nur {count} Verbindungen gleichzeitig bestehen. Trenne zuerst eine andere Verbindung.',
  'connections.notifications.maxConnectionsTitle':
    'Maximale Anzahl gleichzeitiger Verbindungen erreicht',
  'connections.notifications.deviceAuthTitle':
    'Authentifizierung im Browser abschließen',
  'connections.notifications.deviceAuthVisit':
    'Rufe die folgende URL auf, um die Authentifizierung abzuschließen für',
  'connections.notifications.deviceAuthEnterCode':
    'Gib auf dieser Seite den folgenden Code ein:',
  'connections.endOfLife.title': 'MongoDB am Ende des Lebenszyklus erkannt',
  'connections.endOfLife.namedWarning':
    'Der Server oder Dienst „{title}“ scheint eine MongoDB-Version auszuführen, die nicht mehr unterstützt wird.',
  'connections.endOfLife.genericWarning':
    'Dieser Server oder Dienst scheint eine MongoDB-Version auszuführen, die nicht mehr unterstützt wird.',
  'connections.endOfLife.versionedBody':
    'Die Serverversion ({version}) hat das Ende ihres Lebenszyklus erreicht. Erwäge ein Upgrade, um die neuesten Funktionen und Leistungsverbesserungen zu erhalten.',
  'connections.endOfLife.body':
    'Die Serverversion hat das Ende ihres Lebenszyklus erreicht. Erwäge ein Upgrade, um die neuesten Funktionen und Leistungsverbesserungen zu erhalten.',
  'connections.endOfLife.learnMore':
    'Mehr dazu in den MongoDB-Lebenszyklusplänen.',
  'connections.nonGenuine.title': 'Nicht originales MongoDB erkannt',
  'connections.nonGenuine.namedWarning':
    'Der Server oder Dienst „{title}“ scheint eine Emulation von MongoDB und kein offizielles MongoDB-Produkt zu sein.',
  'connections.nonGenuine.genericWarning':
    'Dieser Server oder Dienst scheint eine Emulation von MongoDB und kein offizielles MongoDB-Produkt zu sein.',
  'connections.nonGenuine.body':
    'Einige dokumentierte MongoDB-Funktionen können sich anders verhalten, vollständig fehlen, unvollständig sein oder ein unerwartetes Leistungsverhalten aufweisen.',
  'connections.nonGenuine.learnMore': 'Mehr erfahren',
  'connections.store.loadFailed': 'Verbindungen konnten nicht geladen werden',
  'connections.store.authExpired':
    'Die Authentifizierung für {title} ist abgelaufen',
  'connections.store.reauthenticate':
    'Du musst dich erneut bei der Datenbank authentifizieren, um fortzufahren.',
  'connections.store.unableToConnect': 'Verbindung zu {title} nicht möglich',
  'connections.store.nonRetryableReason':
    'Grund: {reason}. Um diese Verbindung weiter zu verwenden, trenne sie und verbinde dich erneut oder lade die Seite neu.',
  'connections.store.authFailed':
    'Authentifizierung für {title} fehlgeschlagen',
  'connections.store.saveFailed':
    'Beim Speichern der Verbindung ist ein Fehler aufgetreten',
  'connections.importExport.connectionName': 'Verbindungsname',
  'connections.importExport.error': 'Fehler: {error}',
  'connections.importExport.selectFile': 'Verbindungsdatei auswählen',
  'connections.importExport.select': 'Auswählen',
  'connections.importExport.passphraseRequired': 'Passphrase erforderlich',
  'connections.export.successTitle': 'Export erfolgreich',
  'connections.export.successDescription':
    'Die Verbindungen wurden erfolgreich exportiert',
  'connections.export.title': 'Gespeicherte Verbindungen exportieren',
  'connections.export.submit': 'Exportieren',
  'connections.export.targetFile': 'Zieldatei',
  'connections.export.removeSecrets': 'Geheimnisse entfernen',
  'connections.export.removeSecretsDescription':
    'Geheimnisse wie Passwörter und Zugriffstoken auslassen',
  'connections.export.encryptionPassword': 'Verschlüsselungspasswort',
  'connections.export.encryptionPasswordDescription':
    'Optionale Passphrase zum Verschlüsseln von Geheimnissen wie Passwörtern und Zugriffstoken',
  'connections.import.successTitle': 'Import erfolgreich',
  'connections.import.successDescription':
    'Neue Verbindungen wurden hinzugefügt',
  'connections.import.existingConnection': 'Vorhandene Verbindung',
  'connections.import.title': 'Gespeicherte Verbindungen importieren',
  'connections.import.submit': 'Importieren',
  'connections.import.sourceFile': 'Quelldatei',
  'connections.import.untrustedWarning':
    'Importiere Verbindungsdateien nur aus vertrauenswürdigen Quellen. Importierte Dateien können sensible Verbindungsdetails und Netzwerkkonfigurationen enthalten.',
  'connections.import.decryptionPassword': 'Entschlüsselungspasswort',
  'connections.import.decryptionPasswordDescription':
    'Passphrase zum Entschlüsseln der Geheimnisse, falls beim Export eine angegeben wurde',
  'connections.import.overwriteWarning':
    'Einige der ausgewählten Verbindungen existieren bereits und werden beim Import überschrieben.',
  'connections.shell.disabledPrefix':
    'Die MongoDB Shell ist in deinen Einstellungen deaktiviert. Falls das nicht beabsichtigt war, empfehlen wir dir, deine',
  'connections.shell.disabledSettingsLink': 'Einstellungen',
  'connections.shell.disabledSuffix':
    'zu überprüfen und die Shell zu aktivieren.',
  'connections.shell.closeShell': 'Shell schließen',
  'connections.shell.openShell': 'Shell öffnen',
  'connections.shell.commandInProgress': 'Befehl wird ausgeführt…',
  'connections.shell.info': 'Shell-Informationen',
  'connections.shell.keyColumn': 'Taste',
  'connections.shell.descriptionColumn': 'Beschreibung',
  'connections.shell.moreInfoPrefix': 'Weitere Informationen findest du in der',
  'connections.shell.documentationLink': 'MongoDB-Shell-Dokumentation',
  'connections.shell.keyboardShortcuts': 'Tastenkürzel',
  'connections.shell.hotkey.moveToLineStart':
    'Bewegt den Cursor an den Anfang der Zeile.',
  'connections.shell.hotkey.moveBack': 'Bewegt den Cursor ein Zeichen zurück.',
  'connections.shell.hotkey.stop': 'Beendet den aktuell laufenden Befehl.',
  'connections.shell.hotkey.deleteNext': 'Löscht das nächste Zeichen.',
  'connections.shell.hotkey.moveToLineEnd':
    'Bewegt den Cursor an das Ende der Zeile.',
  'connections.shell.hotkey.moveForward': 'Bewegt den Cursor ein Zeichen vor.',
  'connections.shell.hotkey.erase':
    'Löscht ein Zeichen, ähnlich wie die Rücktaste.',
  'connections.shell.hotkey.clear':
    'Leert den Bildschirm, ähnlich wie der Befehl clear.',
  'connections.shell.hotkey.swap':
    'Vertauscht die letzten beiden Zeichen vor dem Cursor.',
  'connections.shell.hotkey.uppercase':
    'Wandelt die Zeile in Großbuchstaben um.',
  'connections.shell.hotkey.historyBack':
    'Blättert rückwärts durch den Befehlsverlauf.',
  'connections.shell.hotkey.historyForward':
    'Blättert vorwärts durch den Befehlsverlauf.',
  'connections.form.advanced.urlOptionGroup.connectionTimeout':
    'Optionen für Verbindungs-Timeout',
  'connections.form.advanced.urlOptionGroup.compression':
    'Komprimierungsoptionen',
  'connections.form.advanced.urlOptionGroup.connectionPool':
    'Optionen für den Verbindungspool',
  'connections.form.advanced.urlOptionGroup.writeConcern':
    'Write-Concern-Optionen',
  'connections.form.advanced.urlOptionGroup.readConcern':
    'Read-Concern-Optionen',
  'connections.form.advanced.urlOptionGroup.server': 'Server-Optionen',
  'connections.form.advanced.urlOptionGroup.miscellaneous':
    'Sonstige Konfiguration',
  'connections.form.validation.invalidFieldInput':
    'Das Feld enthielt eine ungültige Eingabe',
  'connections.store.nonRetryable.unauthorized': 'Nicht autorisiert',
  'connections.store.nonRetryable.forbidden': 'Verboten',
  'connections.store.nonRetryable.notFound': 'Nicht gefunden',
  'connections.store.nonRetryable.violatedPolicy': 'Richtlinie verletzt',
  'connections.store.nonRetryable.unknown': 'Unbekannt',
  'connections.store.atlasStreamsUnsupported':
    'Atlas Stream Processing wird in MongoDB Compass noch nicht unterstützt. Um mit deiner Stream-Processing-Instanz zu arbeiten, verbinde dich mit mongosh oder MongoDB for VS Code.',
  'connections.store.reauthDeclined':
    'Erneute Authentifizierung vom Benutzer abgelehnt',
  'connections.clusterLoadError.title':
    'Beim Abfragen deiner MongoDB-Bereitstellung ist ein Fehler aufgetreten',
  'connections.clusterLoadError.tryAgain':
    'Bitte versuche es in einigen Minuten erneut.',
  'connections.clusterLoadError.backToClusters': 'Zurück zu den Clustern',
  'connections.importExport.noConnectionsInFile':
    'Die Datei enthält keine Verbindungen',
};

export const fr: Catalog = {
  'connections.form.advancedOptions': 'Options de connexion avancées',
  'connections.form.disabledOverlay':
    'Le formulaire de connexion est désactivé tant que la chaîne de connexion ne peut pas être analysée.',
  'connections.form.tabs.general': 'Général',
  'connections.form.tabs.authentication': 'Authentification',
  'connections.form.tabs.tls': 'TLS/SSL',
  'connections.form.tabs.proxy': 'Proxy/SSH',
  'connections.form.tabs.csfle': 'Chiffrement en cours d’utilisation',
  'connections.form.tabs.advanced': 'Avancé',
  'connections.form.tabs.ariaLabel': 'Onglets des options avancées',
  'connections.form.tabs.errorCount.other': '{count} erreurs',
  'connections.form.tabs.errorCount.one': '{count} erreur',
  'connections.form.advanced.replicaSetName': 'Nom du replica set',
  'connections.form.advanced.defaultDatabase':
    'Base de données d’authentification par défaut',
  'connections.form.advanced.defaultDatabaseDescription':
    'Base de données d’authentification utilisée lorsque authSource n’est pas spécifié.',
  'connections.form.advanced.learnMore': 'En savoir plus',
  'connections.form.advanced.selectKey': 'Sélectionner une clé',
  'connections.form.advanced.value': 'Valeur',
  'connections.form.advanced.namedValue': 'Valeur de {name}',
  'connections.form.advanced.urlOptionValue': 'Valeur de l’option d’URL',
  'connections.form.advanced.uriOptions': 'Options d’URI',
  'connections.form.advanced.uriOptionsDescription':
    'Ajoutez des options d’URI MongoDB supplémentaires pour personnaliser votre connexion.',
  'connections.form.readPreference.title':
    'Préférence de lecture (Read Preference)',
  'connections.form.readPreference.description':
    'Choisissez les membres vers lesquels vos lectures sont dirigées.',
  'connections.form.readPreference.default': 'Par défaut',
  'connections.form.readPreference.tags': 'Balises de la préférence de lecture',
  'connections.form.readPreference.tagsDescription':
    'Essayées dans l’ordre. Laissez un ensemble vide pour se rabattre sur n’importe quel membre.',
  'connections.form.readPreference.tagsEmpty': 'Vide : n’importe quel membre',
  'connections.form.readPreference.maxStaleness':
    'Obsolescence maximale en secondes',
  'connections.form.readPreference.maxStalenessDescription':
    'Minimum 90 secondes.',
  'connections.form.auth.method': 'Méthode d’authentification',
  'connections.form.auth.usernamePassword': 'Nom d’utilisateur/mot de passe',
  'connections.form.auth.username': 'Nom d’utilisateur',
  'connections.form.auth.password': 'Mot de passe',
  'connections.form.auth.database': 'Base de données d’authentification',
  'connections.form.auth.databaseDocs':
    'Documentation sur la base de données d’authentification',
  'connections.form.auth.mechanism': 'Mécanisme d’authentification',
  'connections.form.auth.mechanismDefault': 'Par défaut',
  'connections.form.auth.principal': 'Principal',
  'connections.form.auth.serviceName': 'Nom du service',
  'connections.form.auth.canonicalizeHostName': 'Canonicaliser le nom d’hôte',
  'connections.form.auth.canonicalize.none': 'Aucune',
  'connections.form.auth.canonicalize.forward': 'Directe',
  'connections.form.auth.canonicalize.forwardAndReverse': 'Directe et inverse',
  'connections.form.auth.serviceRealm': 'Realm du service',
  'connections.form.auth.providePassword':
    'Fournir le mot de passe directement',
  'connections.form.auth.awsAccessKeyId': 'ID de clé d’accès AWS',
  'connections.form.auth.awsSecretAccessKey': 'Clé d’accès secrète AWS',
  'connections.form.auth.awsSessionToken': 'Jeton de session AWS',
  'connections.form.auth.x509Prefix': 'L’authentification X.509 nécessite un',
  'connections.form.auth.x509ClientCertificate': 'certificat client',
  'connections.form.auth.x509Middle':
    'pour fonctionner. Assurez-vous d’activer TLS et d’en ajouter un dans l’onglet',
  'connections.form.auth.x509Suffix': '.',
  'connections.form.auth.oidc.options': 'Options OIDC',
  'connections.form.auth.oidc.redirectUri':
    'URI de redirection du flux de code d’autorisation',
  'connections.form.auth.oidc.redirectUriDescription':
    'Cette valeur doit correspondre à la configuration du fournisseur d’identité utilisé par le serveur.',
  'connections.form.auth.oidc.trustedEndpoint':
    'Considérer le point de terminaison cible comme approuvé',
  'connections.form.auth.oidc.trustedEndpointDescription':
    'Autorise la connexion lorsque le point de terminaison cible ne figure pas dans la liste des points de terminaison considérés comme approuvés par défaut. N’utilisez cette option que pour vous connecter à des serveurs de confiance.',
  'connections.form.auth.oidc.idToken':
    'Utiliser le jeton d’ID au lieu du jeton d’accès',
  'connections.form.auth.oidc.idTokenDescription':
    'Utilise des jetons d’ID au lieu de jetons d’accès pour contourner les fournisseurs d’identité mal configurés ou défectueux. Cela ne fonctionne que si le serveur est configuré en conséquence.',
  'connections.form.auth.oidc.nonce':
    'Envoyer un nonce dans la requête de code d’autorisation',
  'connections.form.auth.oidc.nonceDescription':
    'Inclut un nonce aléatoire dans la requête de code d’autorisation afin d’empêcher les attaques par rejeu. Ne désactivez cette option que si le fournisseur OIDC ne la prend pas en charge, car le nonce est un élément de sécurité important.',
  'connections.form.auth.oidc.appProxy':
    'Utiliser les paramètres de proxy de l’application',
  'connections.form.auth.oidc.appProxyPrefix': 'Utilisez les',
  'connections.form.auth.oidc.appProxyLink':
    'paramètres de proxy de l’application',
  'connections.form.auth.oidc.appProxySuffix':
    'pour communiquer avec le fournisseur d’identité. Si cette option n’est pas cochée, le même proxy (le cas échéant) est utilisé pour se connecter au cluster et au fournisseur d’identité.',
  'connections.form.auth.oidc.deviceAuth':
    'Activer le flux d’authentification par appareil',
  'connections.form.auth.oidc.deviceAuthDescription':
    'Flux d’authentification moins sécurisé pouvant servir de solution de repli lorsque l’authentification par navigateur n’est pas disponible.',
  'connections.form.csfle.enterpriseOnly':
    'Le chiffrement en cours d’utilisation est une fonctionnalité de MongoDB réservée à Enterprise/Atlas.',
  'connections.form.csfle.keyVaultNamespace': 'Espace de noms du Key Vault',
  'connections.form.csfle.keyVaultNamespaceDescription':
    'Indiquez une collection dans laquelle les clés de chiffrement des données sont stockées, au format <db>.<collection>.',
  'connections.form.csfle.kmsProviders': 'Fournisseurs KMS',
  'connections.form.csfle.kmsProvidersDescription':
    'Indiquez un ou plusieurs systèmes de gestion de clés à utiliser.',
  'connections.form.csfle.storeSecrets':
    'Stocker les secrets des fournisseurs KMS',
  'connections.form.csfle.storeSecretsDescription':
    'Détermine si les secrets KMS sont stockés sur le disque (protégés par le trousseau du système d’exploitation) ou supprimés après la déconnexion.',
  'connections.form.csfle.localKms': 'KMS local',
  'connections.form.csfle.encryptedFieldsMapDescription':
    'Ajoutez éventuellement une EncryptedFieldsMap côté client pour renforcer la sécurité.',
  'connections.form.csfle.generateKey': 'Générer une clé aléatoire',
  'connections.form.csfle.generatedKeyInfo':
    'Cette clé servira à chiffrer les données stockées dans la base de données. Sans elle, les données chiffrées sont inaccessibles.',
  'connections.form.csfle.generatedKeyWarning':
    'Compass n’enregistre pas les identifiants KMS par défaut. Copiez la clé et conservez-la dans un emplacement externe.',
  'connections.form.csfle.kmsName': 'Nom du KMS',
  'connections.form.csfle.editKmsName': 'Modifier le nom du fournisseur KMS',
  'connections.form.csfle.nameEmpty': 'Le nom ne peut pas être vide',
  'connections.form.csfle.nameExists': 'Ce nom existe déjà',
  'connections.form.csfle.nameInvalid':
    'Le nom doit être alphanumérique et peut contenir des traits de soulignement',
  'connections.form.csfle.removeKms': 'Supprimer le fournisseur KMS',
  'connections.form.csfle.addItem': 'Ajouter un élément',
  'connections.form.csfle.statusError': 'Erreur',
  'connections.form.csfle.statusIncomplete': 'Configuration incomplète',
  'connections.form.csfle.statusConfigured': 'Entièrement configuré',
  'connections.form.csfle.field.gcp.email.label': 'E-mail du compte de service',
  'connections.form.csfle.field.gcp.email.description':
    'L’e-mail du compte de service à authentifier.',
  'connections.form.csfle.field.gcp.privateKey.label': 'Clé privée',
  'connections.form.csfle.field.gcp.privateKey.description':
    'Une clé privée PKCS#8 encodée en base64.',
  'connections.form.csfle.field.gcp.endpoint.label': 'Point de terminaison',
  'connections.form.csfle.field.gcp.endpoint.description':
    'Un hôte avec un port facultatif.',
  'connections.form.csfle.field.aws.accessKeyId.label': 'ID de clé d’accès',
  'connections.form.csfle.field.aws.accessKeyId.description':
    'La clé d’accès utilisée pour le fournisseur AWS KMS.',
  'connections.form.csfle.field.aws.secretAccessKey.label':
    'Clé d’accès secrète',
  'connections.form.csfle.field.aws.secretAccessKey.description':
    'La clé d’accès secrète utilisée pour le fournisseur AWS KMS.',
  'connections.form.csfle.field.aws.sessionToken.label': 'Jeton de session',
  'connections.form.csfle.field.aws.sessionToken.description':
    'Un jeton de session AWS facultatif, utilisé comme en-tête X-Amz-Security-Token pour les requêtes AWS.',
  'connections.form.csfle.field.azure.tenantId.label': 'ID de locataire',
  'connections.form.csfle.field.azure.tenantId.description':
    'L’ID de locataire identifie l’organisation du compte.',
  'connections.form.csfle.field.azure.clientId.label': 'ID client',
  'connections.form.csfle.field.azure.clientId.description':
    'L’ID client permettant d’authentifier une application enregistrée.',
  'connections.form.csfle.field.azure.clientSecret.label': 'Secret client',
  'connections.form.csfle.field.azure.clientSecret.description':
    'Le secret client permettant d’authentifier une application enregistrée.',
  'connections.form.csfle.field.azure.identityPlatformEndpoint.label':
    'Point de terminaison de la plateforme d’identité',
  'connections.form.csfle.field.azure.identityPlatformEndpoint.description':
    'Un hôte avec un port facultatif.',
  'connections.form.csfle.field.kmip.endpoint.label': 'Point de terminaison',
  'connections.form.csfle.field.kmip.endpoint.description':
    'Le point de terminaison se compose d’un nom d’hôte et d’un port séparés par deux-points.',
  'connections.form.csfle.field.local.key.label': 'Clé',
  'connections.form.csfle.field.local.key.description':
    'Une chaîne encodée en base64 de 96 octets. Les clés gérées localement ne nécessitent aucune configuration supplémentaire, mais ne sont pas recommandées pour les applications de production.',
  'connections.form.general.directConnection': 'Connexion directe',
  'connections.form.general.directConnectionDescription':
    'Indique s’il faut forcer l’envoi de toutes les opérations à l’hôte spécifié.',
  'connections.form.general.hostname': 'Nom d’hôte',
  'connections.form.general.host': 'Hôte',
  'connections.form.general.scheme': 'Schéma de la chaîne de connexion',
  'connections.form.general.srvSchemeDescription':
    'Format de connexion par liste de seeds DNS. Le +srv indique au client que le nom d’hôte qui suit correspond à un enregistrement DNS SRV.',
  'connections.form.general.regularSchemeDescription':
    'Format standard de chaîne de connexion. Le format standard de l’URI de connexion MongoDB sert à se connecter à un déploiement MongoDB : serveur autonome, replica set ou cluster shardé.',
  'connections.form.proxy.appProxyPrefix': 'Utilisez les',
  'connections.form.proxy.appProxyLink': 'paramètres de proxy de l’application',
  'connections.form.proxy.appProxySuffix': 'pour communiquer avec le cluster.',
  'connections.form.proxy.none': 'Aucun',
  'connections.form.proxy.sshPassword': 'SSH avec mot de passe',
  'connections.form.proxy.sshIdentity': 'SSH avec fichier d’identité',
  'connections.form.proxy.socks': 'Socks5',
  'connections.form.proxy.applicationLevel': 'Proxy au niveau de l’application',
  'connections.form.proxy.method': 'Méthode de tunnel SSH/proxy',
  'connections.form.proxy.hostname': 'Nom d’hôte du proxy',
  'connections.form.proxy.port': 'Port du tunnel proxy',
  'connections.form.proxy.username': 'Nom d’utilisateur du proxy',
  'connections.form.proxy.password': 'Mot de passe du proxy',
  'connections.form.ssh.hostname': 'Nom d’hôte SSH',
  'connections.form.ssh.port': 'Port SSH',
  'connections.form.ssh.username': 'Nom d’utilisateur SSH',
  'connections.form.ssh.identityFile': 'Fichier d’identité SSH',
  'connections.form.ssh.passphrase': 'Phrase secrète SSH',
  'connections.form.ssh.password': 'Mot de passe SSH',
  'connections.form.tls.learnMore': 'En savoir plus',
  'connections.form.tls.certificateAuthority':
    'Autorité de certification (.pem)',
  'connections.form.tls.clientCertificate': 'Certificat client et clé (.pem)',
  'connections.form.tls.clientCertificateOptional':
    'Facultatif (obligatoire avec l’authentification X.509)',
  'connections.form.tls.clientKeyPassword': 'Mot de passe de la clé client',
  'connections.form.tls.insecureDescription':
    'Cela inclut tlsAllowInvalidHostnames et tlsAllowInvalidCertificates.',
  'connections.form.tls.invalidHostnamesDescription':
    'Désactive la validation des noms d’hôte dans le certificat présenté par l’instance mongod/mongos.',
  'connections.form.tls.invalidCertificatesDescription':
    'Désactive la validation des certificats du serveur.',
  'connections.form.tls.connection': 'Connexion SSL/TLS',
  'connections.form.tls.docsAriaLabel': 'Documentation sur les options TLS/SSL',
  'connections.form.tls.type.DEFAULT': 'Par défaut',
  'connections.form.tls.type.ON': 'Activé',
  'connections.form.tls.type.OFF': 'Désactivé',
  'connections.form.actions.cancel': 'Annuler',
  'connections.form.actions.save': 'Enregistrer',
  'connections.form.actions.connect': 'Se connecter',
  'connections.form.actions.saveAndConnect': 'Enregistrer et se connecter',
  'connections.form.personalization.name': 'Nom',
  'connections.form.personalization.color': 'Couleur',
  'connections.form.personalization.noColor': 'Aucune couleur',
  'connections.form.personalization.favorite':
    'Ajouter cette connexion aux favoris',
  'connections.form.personalization.favoriteDescription':
    'Une connexion favorite est épinglée en haut de votre liste de connexions.',
  'connections.form.color.color1': 'Vert',
  'connections.form.color.color2': 'Turquoise',
  'connections.form.color.color3': 'Bleu',
  'connections.form.color.color4': 'Indigo',
  'connections.form.color.color5': 'Violet',
  'connections.form.color.color6': 'Rouge',
  'connections.form.color.color7': 'Rose',
  'connections.form.color.color8': 'Orange',
  'connections.form.color.color9': 'Jaune',
  'connections.form.color.color10': 'Gris',
  'connections.form.overriddenOptions':
    'Certaines options de connexion ont été remplacées par les paramètres : {keys}',
  'connections.form.unableToSave':
    'Impossible d’enregistrer la connexion : {message}',
  'connections.form.newConnection': 'Nouvelle connexion',
  'connections.form.editConnection': 'Modifier la connexion',
  'connections.form.manageSettings': 'Gérez les paramètres de votre connexion',
  'connections.form.connectedWarning':
    'Tant que vous êtes connecté, vous ne pouvez personnaliser que le nom, la couleur ou le statut de favori de votre connexion. Pour la configurer entièrement, vous devez d’abord vous déconnecter. Attention : la déconnexion peut entraîner la perte du travail en cours.',
  'connections.form.disconnect': 'Se déconnecter',
  'connections.form.protectedWarning':
    'Les options de connexion avancées sont masquées tant que le paramètre « Protéger les secrets des chaînes de connexion » est activé. Désactivez ce paramètre pour configurer les options de connexion avancées ou modifier votre chaîne de connexion.',
  'connections.form.connectionString.editConfirmTitle':
    'Voulez-vous vraiment modifier votre chaîne de connexion ?',
  'connections.form.connectionString.editConfirmDescription':
    'La modification de cette chaîne de connexion révélera vos identifiants.',
  'connections.form.connectionString.docsAriaLabel':
    'Documentation sur la chaîne de connexion',
  'connections.form.connectionString.edit': 'Modifier la chaîne de connexion',
  'connections.form.connectionString.placeholder':
    'p. ex. mongodb+srv://username:password@cluster0-jtpxd.mongodb.net/admin',
  'connections.form.help.findTitle':
    'Comment trouver ma chaîne de connexion dans Atlas ?',
  'connections.form.help.findBody':
    'Si vous avez un cluster Atlas, accédez à la vue Cluster. Cliquez sur le bouton « Connect » du cluster auquel vous souhaitez vous connecter.',
  'connections.form.help.seeExample': 'Voir un exemple',
  'connections.form.help.formatTitle':
    'Comment formater ma chaîne de connexion ?',
  'connections.form.validation.readPreferenceOptionsMode':
    'Les balises de préférence de lecture et l’obsolescence maximale ne peuvent être utilisées qu’avec une préférence de lecture autre que primary.',
  'connections.form.validation.tagSetFormat':
    'Les ensembles de balises doivent respecter le format key0:value0,key1:value1.',
  'connections.form.validation.maxStaleness':
    'L’obsolescence maximale doit être d’au moins 90 secondes.',
  'connections.form.validation.usernameMissing':
    'Le nom d’utilisateur est manquant.',
  'connections.form.validation.passwordMissing':
    'Le mot de passe est manquant.',
  'connections.form.validation.x509Tls':
    'TLS doit être activé pour utiliser l’authentification x509.',
  'connections.form.validation.x509Certificate':
    'Un certificat client est requis pour l’authentification x509.',
  'connections.form.validation.kerberosPrincipal':
    'Un nom de principal est requis avec Kerberos.',
  'connections.form.validation.sshHostname':
    'Un nom d’hôte est requis pour se connecter via un tunnel SSH.',
  'connections.form.validation.sshCredentials':
    'Lors d’une connexion via un tunnel SSH, un mot de passe ou un fichier d’identité est requis.',
  'connections.form.validation.sshPassphraseFile':
    'Un fichier est requis avec la phrase secrète.',
  'connections.form.validation.proxyHostname':
    'Le nom d’hôte du proxy est requis.',
  'connections.form.validation.keyVaultFormat':
    'L’espace de noms du Key Vault doit respecter le format <db>.<collection>',
  'connections.form.validation.keyVaultRequired':
    'Un espace de noms du Key Vault doit être spécifié pour les connexions avec chiffrement en cours d’utilisation',
  'connections.form.validation.localKey':
    'La clé locale doit être une chaîne de 96 octets encodée en Base64',
  'connections.form.validation.kmipEndpoint':
    'Le point de terminaison KMIP doit respecter le format <host>:<port>',
  'connections.form.validation.csfleStoredToDisk':
    'Les identifiants des fournisseurs KMS du chiffrement en cours d’utilisation seront stockés sur le disque.',
  'connections.form.validation.certificateValidationDisabled':
    'La validation des certificats TLS/SSL est désactivée. Si possible, activez-la afin d’éviter les failles de sécurité.',
  'connections.form.validation.directConnectionSrv':
    'directConnection n’est pas pris en charge avec un URI SRV.',
  'connections.form.validation.directConnectionReplicaSet':
    'directConnection n’est pas pris en charge avec replicaSet.',
  'connections.form.validation.directConnectionMultipleHosts':
    'directConnection n’est pas pris en charge avec plusieurs hôtes.',
  'connections.form.validation.tlsDisabled':
    'TLS/SSL est désactivé. Si possible, activez TLS/SSL afin d’éviter les failles de sécurité.',
  'connections.form.validation.socksPlaintext':
    'Le mot de passe du proxy Socks5 sera transmis en clair.',
  'connections.form.validation.remoteProxyLocalHost':
    'Utilisation d’un proxy distant avec un hôte de service MongoDB local.',
  'connections.form.validation.encryptedFieldConfig':
    'EncryptedFieldConfig n’est pas valide : {error}',
  'connections.form.validation.unknownReadPreference':
    'Préférence de lecture inconnue {readPreference}',
  'connections.form.validation.invalidHostCharacter':
    "Caractère non valide dans l’hôte : '{character}'",
  'connections.form.validation.schemaUpdate':
    'Erreur lors de la mise à jour du schéma de connexion : {message}',
  'connections.notifications.connecting': 'Connexion à {title}',
  'connections.notifications.completeAuthInBrowser':
    'Terminez l’authentification dans le navigateur',
  'connections.notifications.connectionFailed': 'Échec de la connexion',
  'connections.notifications.debug': 'Déboguer',
  'connections.notifications.review': 'Vérifier',
  'connections.notifications.cancel': 'ANNULER',
  'connections.notifications.connected': 'Connecté à {title}',
  'connections.notifications.maxConnections.one':
    'Une seule connexion ({count}) peut être active en même temps. Déconnectez-vous d’abord d’une autre connexion.',
  'connections.notifications.maxConnections.other':
    'Seules {count} connexions peuvent être actives en même temps. Déconnectez-vous d’abord d’une autre connexion.',
  'connections.notifications.maxConnectionsTitle':
    'Limite de connexions simultanées atteinte',
  'connections.notifications.deviceAuthTitle':
    'Terminer l’authentification dans le navigateur',
  'connections.notifications.deviceAuthVisit':
    'Accédez à l’URL suivante pour terminer l’authentification de',
  'connections.notifications.deviceAuthEnterCode':
    'Saisissez le code suivant sur cette page :',
  'connections.endOfLife.title': 'MongoDB en fin de vie détecté',
  'connections.endOfLife.namedWarning':
    'Le serveur ou service « {title} » semble exécuter une version de MongoDB qui n’est plus prise en charge.',
  'connections.endOfLife.genericWarning':
    'Ce serveur ou service semble exécuter une version de MongoDB qui n’est plus prise en charge.',
  'connections.endOfLife.versionedBody':
    'La version du serveur ({version}) est en fin de vie. Envisagez une mise à niveau pour bénéficier des dernières fonctionnalités et améliorations de performances.',
  'connections.endOfLife.body':
    'La version du serveur est en fin de vie. Envisagez une mise à niveau pour bénéficier des dernières fonctionnalités et améliorations de performances.',
  'connections.endOfLife.learnMore':
    'En savoir plus dans les calendriers de cycle de vie de MongoDB.',
  'connections.nonGenuine.title': 'MongoDB non authentique détecté',
  'connections.nonGenuine.namedWarning':
    'Le serveur ou service « {title} » semble être une émulation de MongoDB plutôt qu’un produit MongoDB officiel.',
  'connections.nonGenuine.genericWarning':
    'Ce serveur ou service semble être une émulation de MongoDB plutôt qu’un produit MongoDB officiel.',
  'connections.nonGenuine.body':
    'Certaines fonctionnalités documentées de MongoDB peuvent fonctionner différemment, être totalement absentes ou incomplètes, ou présenter des performances inattendues.',
  'connections.nonGenuine.learnMore': 'En savoir plus',
  'connections.store.loadFailed': 'Échec du chargement des connexions',
  'connections.store.authExpired': 'L’authentification pour {title} a expiré',
  'connections.store.reauthenticate':
    'Vous devez vous authentifier à nouveau auprès de la base de données pour continuer.',
  'connections.store.unableToConnect': 'Impossible de se connecter à {title}',
  'connections.store.nonRetryableReason':
    'Raison : {reason}. Pour continuer à utiliser cette connexion, déconnectez-vous puis reconnectez-vous, ou actualisez la page.',
  'connections.store.authFailed': 'Échec de l’authentification pour {title}',
  'connections.store.saveFailed':
    'Une erreur s’est produite lors de l’enregistrement de la connexion',
  'connections.importExport.connectionName': 'Nom de la connexion',
  'connections.importExport.error': 'Erreur : {error}',
  'connections.importExport.selectFile':
    'Sélectionner le fichier de connexions',
  'connections.importExport.select': 'Sélectionner',
  'connections.importExport.passphraseRequired': 'Phrase secrète requise',
  'connections.export.successTitle': 'Exportation réussie',
  'connections.export.successDescription':
    'Les connexions ont été exportées avec succès',
  'connections.export.title': 'Exporter les connexions enregistrées',
  'connections.export.submit': 'Exporter',
  'connections.export.targetFile': 'Fichier cible',
  'connections.export.removeSecrets': 'Supprimer les secrets',
  'connections.export.removeSecretsDescription':
    'Omettre les secrets tels que les mots de passe et les jetons d’accès',
  'connections.export.encryptionPassword': 'Mot de passe de chiffrement',
  'connections.export.encryptionPasswordDescription':
    'Phrase secrète facultative pour chiffrer les secrets tels que les mots de passe et les jetons d’accès',
  'connections.import.successTitle': 'Importation réussie',
  'connections.import.successDescription':
    'De nouvelles connexions ont été ajoutées',
  'connections.import.existingConnection': 'Connexion existante',
  'connections.import.title': 'Importer les connexions enregistrées',
  'connections.import.submit': 'Importer',
  'connections.import.sourceFile': 'Fichier source',
  'connections.import.untrustedWarning':
    'N’importez des fichiers de connexion que depuis des sources de confiance. Les fichiers importés peuvent contenir des informations de connexion sensibles et des configurations réseau.',
  'connections.import.decryptionPassword': 'Mot de passe de déchiffrement',
  'connections.import.decryptionPasswordDescription':
    'Phrase secrète pour déchiffrer les secrets si l’une d’elles a été définie lors de l’exportation',
  'connections.import.overwriteWarning':
    'Certaines des connexions sélectionnées existent déjà et seront écrasées lors de l’importation.',
  'connections.shell.disabledPrefix':
    'Le shell MongoDB est désactivé dans vos paramètres. Si ce n’est pas voulu, nous vous recommandons de vérifier vos',
  'connections.shell.disabledSettingsLink': 'paramètres',
  'connections.shell.disabledSuffix': 'et d’activer le shell.',
  'connections.shell.closeShell': 'Fermer le shell',
  'connections.shell.openShell': 'Ouvrir le shell',
  'connections.shell.commandInProgress': 'Commande en cours…',
  'connections.shell.info': 'Informations sur le shell',
  'connections.shell.keyColumn': 'Touche',
  'connections.shell.descriptionColumn': 'Description',
  'connections.shell.moreInfoPrefix': 'Pour plus d’informations, consultez la',
  'connections.shell.documentationLink': 'documentation du shell MongoDB',
  'connections.shell.keyboardShortcuts': 'Raccourcis clavier',
  'connections.shell.hotkey.moveToLineStart':
    'Déplace le curseur au début de la ligne.',
  'connections.shell.hotkey.moveBack':
    'Déplace le curseur d’un caractère vers l’arrière.',
  'connections.shell.hotkey.stop': 'Arrête la commande en cours d’exécution.',
  'connections.shell.hotkey.deleteNext': 'Supprime le caractère suivant.',
  'connections.shell.hotkey.moveToLineEnd':
    'Déplace le curseur à la fin de la ligne.',
  'connections.shell.hotkey.moveForward':
    'Déplace le curseur d’un caractère vers l’avant.',
  'connections.shell.hotkey.erase':
    'Efface un caractère, comme la touche Retour arrière.',
  'connections.shell.hotkey.clear': 'Efface l’écran, comme la commande clear.',
  'connections.shell.hotkey.swap':
    'Échange les deux derniers caractères avant le curseur.',
  'connections.shell.hotkey.uppercase': 'Convertit la ligne en majuscules.',
  'connections.shell.hotkey.historyBack':
    'Parcourt l’historique des commandes vers l’arrière.',
  'connections.shell.hotkey.historyForward':
    'Parcourt l’historique des commandes vers l’avant.',
  'connections.form.advanced.urlOptionGroup.connectionTimeout':
    'Options de délai de connexion',
  'connections.form.advanced.urlOptionGroup.compression':
    'Options de compression',
  'connections.form.advanced.urlOptionGroup.connectionPool':
    'Options du pool de connexions',
  'connections.form.advanced.urlOptionGroup.writeConcern':
    'Options de write concern',
  'connections.form.advanced.urlOptionGroup.readConcern':
    'Options de read concern',
  'connections.form.advanced.urlOptionGroup.server': 'Options du serveur',
  'connections.form.advanced.urlOptionGroup.miscellaneous':
    'Configuration diverse',
  'connections.form.validation.invalidFieldInput':
    'Le champ contenait une saisie non valide',
  'connections.store.nonRetryable.unauthorized': 'Non autorisé',
  'connections.store.nonRetryable.forbidden': 'Interdit',
  'connections.store.nonRetryable.notFound': 'Introuvable',
  'connections.store.nonRetryable.violatedPolicy': 'Politique enfreinte',
  'connections.store.nonRetryable.unknown': 'Inconnu',
  'connections.store.atlasStreamsUnsupported':
    "Atlas Stream Processing n'est pas encore pris en charge dans MongoDB Compass. Pour travailler avec votre instance Stream Processing, connectez-vous avec mongosh ou MongoDB for VS Code.",
  'connections.store.reauthDeclined':
    "Réauthentification refusée par l'utilisateur",
  'connections.clusterLoadError.title':
    "Une erreur s'est produite lors de l'interrogation de votre déploiement MongoDB",
  'connections.clusterLoadError.tryAgain':
    'Veuillez réessayer dans quelques minutes.',
  'connections.clusterLoadError.backToClusters': 'Retour aux clusters',
  'connections.importExport.noConnectionsInFile':
    'Le fichier ne contient aucune connexion',
};

export const es: Catalog = {
  'connections.form.advancedOptions': 'Opciones de conexión avanzadas',
  'connections.form.disabledOverlay':
    'El formulario de conexión está deshabilitado mientras no se pueda analizar la cadena de conexión.',
  'connections.form.tabs.general': 'General',
  'connections.form.tabs.authentication': 'Autenticación',
  'connections.form.tabs.tls': 'TLS/SSL',
  'connections.form.tabs.proxy': 'Proxy/SSH',
  'connections.form.tabs.csfle': 'Cifrado en uso',
  'connections.form.tabs.advanced': 'Avanzado',
  'connections.form.tabs.ariaLabel': 'Pestañas de opciones avanzadas',
  'connections.form.tabs.errorCount.other': '{count} errores',
  'connections.form.tabs.errorCount.one': '{count} error',
  'connections.form.advanced.replicaSetName': 'Nombre del conjunto de réplicas',
  'connections.form.advanced.defaultDatabase':
    'Base de datos de autenticación predeterminada',
  'connections.form.advanced.defaultDatabaseDescription':
    'Base de datos de autenticación que se usa cuando no se especifica authSource.',
  'connections.form.advanced.learnMore': 'Más información',
  'connections.form.advanced.selectKey': 'Seleccionar clave',
  'connections.form.advanced.value': 'Valor',
  'connections.form.advanced.namedValue': 'Valor de {name}',
  'connections.form.advanced.urlOptionValue': 'Valor de la opción de URL',
  'connections.form.advanced.uriOptions': 'Opciones de URI',
  'connections.form.advanced.uriOptionsDescription':
    'Agrega opciones de URI de MongoDB adicionales para personalizar tu conexión.',
  'connections.form.readPreference.title':
    'Preferencia de lectura (Read Preference)',
  'connections.form.readPreference.description':
    'Elige a qué miembros se dirigen tus lecturas.',
  'connections.form.readPreference.default': 'Predeterminado',
  'connections.form.readPreference.tags':
    'Etiquetas de la preferencia de lectura',
  'connections.form.readPreference.tagsDescription':
    'Se prueban en orden. Deja un conjunto vacío para recurrir a cualquier miembro.',
  'connections.form.readPreference.tagsEmpty': 'Vacío: cualquier miembro',
  'connections.form.readPreference.maxStaleness':
    'Obsolescencia máxima en segundos',
  'connections.form.readPreference.maxStalenessDescription':
    'Mínimo 90 segundos.',
  'connections.form.auth.method': 'Método de autenticación',
  'connections.form.auth.usernamePassword': 'Nombre de usuario/contraseña',
  'connections.form.auth.username': 'Nombre de usuario',
  'connections.form.auth.password': 'Contraseña',
  'connections.form.auth.database': 'Base de datos de autenticación',
  'connections.form.auth.databaseDocs':
    'Documentación sobre la base de datos de autenticación',
  'connections.form.auth.mechanism': 'Mecanismo de autenticación',
  'connections.form.auth.mechanismDefault': 'Predeterminado',
  'connections.form.auth.principal': 'Principal',
  'connections.form.auth.serviceName': 'Nombre del servicio',
  'connections.form.auth.canonicalizeHostName': 'Canonicalizar nombre de host',
  'connections.form.auth.canonicalize.none': 'Ninguna',
  'connections.form.auth.canonicalize.forward': 'Directa',
  'connections.form.auth.canonicalize.forwardAndReverse': 'Directa e inversa',
  'connections.form.auth.serviceRealm': 'Realm del servicio',
  'connections.form.auth.providePassword':
    'Proporcionar la contraseña directamente',
  'connections.form.auth.awsAccessKeyId': 'ID de clave de acceso de AWS',
  'connections.form.auth.awsSecretAccessKey': 'Clave de acceso secreta de AWS',
  'connections.form.auth.awsSessionToken': 'Token de sesión de AWS',
  'connections.form.auth.x509Prefix':
    'El tipo de autenticación X.509 requiere un',
  'connections.form.auth.x509ClientCertificate': 'certificado de cliente',
  'connections.form.auth.x509Middle':
    'para funcionar. Asegúrate de habilitar TLS y de agregar uno en la pestaña',
  'connections.form.auth.x509Suffix': '.',
  'connections.form.auth.oidc.options': 'Opciones de OIDC',
  'connections.form.auth.oidc.redirectUri':
    'URI de redirección del flujo de código de autorización',
  'connections.form.auth.oidc.redirectUriDescription':
    'Este valor debe coincidir con la configuración del proveedor de identidad que usa el servidor.',
  'connections.form.auth.oidc.trustedEndpoint':
    'Considerar de confianza el endpoint de destino',
  'connections.form.auth.oidc.trustedEndpointDescription':
    'Permite conectarse cuando el endpoint de destino no está en la lista de endpoints considerados de confianza de forma predeterminada. Usa esta opción solo al conectarte a servidores de tu confianza.',
  'connections.form.auth.oidc.idToken':
    'Usar el token de ID en lugar del token de acceso',
  'connections.form.auth.oidc.idTokenDescription':
    'Usa tokens de ID en lugar de tokens de acceso para sortear proveedores de identidad mal configurados o con errores. Solo funcionará si el servidor está configurado en consecuencia.',
  'connections.form.auth.oidc.nonce':
    'Enviar un nonce en la solicitud de código de autorización',
  'connections.form.auth.oidc.nonceDescription':
    'Incluye un nonce aleatorio en la solicitud de código de autorización para evitar ataques de repetición. Solo debe deshabilitarse si el proveedor de OIDC no lo admite, ya que el nonce es un componente de seguridad importante.',
  'connections.form.auth.oidc.appProxy':
    'Usar la configuración de proxy de la aplicación',
  'connections.form.auth.oidc.appProxyPrefix': 'Usa la',
  'connections.form.auth.oidc.appProxyLink':
    'configuración de proxy de la aplicación',
  'connections.form.auth.oidc.appProxySuffix':
    'para comunicarte con el proveedor de identidad. Si no se selecciona, se usa el mismo proxy (si lo hay) para conectarse tanto al clúster como al proveedor de identidad.',
  'connections.form.auth.oidc.deviceAuth':
    'Habilitar el flujo de autenticación de dispositivo',
  'connections.form.auth.oidc.deviceAuthDescription':
    'Flujo de autenticación menos seguro que puede usarse como alternativa cuando la autenticación basada en navegador no está disponible.',
  'connections.form.csfle.enterpriseOnly':
    'El cifrado en uso es una función de MongoDB exclusiva de Enterprise/Atlas.',
  'connections.form.csfle.keyVaultNamespace':
    'Espacio de nombres del Key Vault',
  'connections.form.csfle.keyVaultNamespaceDescription':
    'Especifica una colección en la que se almacenan las claves de cifrado de datos, con el formato <db>.<collection>.',
  'connections.form.csfle.kmsProviders': 'Proveedores de KMS',
  'connections.form.csfle.kmsProvidersDescription':
    'Especifica uno o más sistemas de administración de claves que se usarán.',
  'connections.form.csfle.storeSecrets':
    'Almacenar los secretos de los proveedores de KMS',
  'connections.form.csfle.storeSecretsDescription':
    'Controla si los secretos de KMS se almacenan en disco (protegidos por el llavero del sistema operativo) o se descartan al desconectarse.',
  'connections.form.csfle.localKms': 'KMS local',
  'connections.form.csfle.encryptedFieldsMapDescription':
    'Agrega opcionalmente un EncryptedFieldsMap del lado del cliente para mayor seguridad.',
  'connections.form.csfle.generateKey': 'Generar clave aleatoria',
  'connections.form.csfle.generatedKeyInfo':
    'Esta clave se usará para cifrar los datos almacenados en la base de datos. Sin ella, no se podrá acceder a los datos cifrados.',
  'connections.form.csfle.generatedKeyWarning':
    'Compass no guarda las credenciales de KMS de forma predeterminada. Copia la clave y guárdala en una ubicación externa.',
  'connections.form.csfle.kmsName': 'Nombre del KMS',
  'connections.form.csfle.editKmsName': 'Editar el nombre del proveedor de KMS',
  'connections.form.csfle.nameEmpty': 'El nombre no puede estar vacío',
  'connections.form.csfle.nameExists': 'El nombre ya existe',
  'connections.form.csfle.nameInvalid':
    'El nombre debe ser alfanumérico y puede contener guiones bajos',
  'connections.form.csfle.removeKms': 'Quitar proveedor de KMS',
  'connections.form.csfle.addItem': 'Agregar elemento',
  'connections.form.csfle.statusError': 'Error',
  'connections.form.csfle.statusIncomplete': 'Configuración incompleta',
  'connections.form.csfle.statusConfigured': 'Totalmente configurado',
  'connections.form.csfle.field.gcp.email.label':
    'Correo electrónico de la cuenta de servicio',
  'connections.form.csfle.field.gcp.email.description':
    'El correo electrónico de la cuenta de servicio con el que autenticarse.',
  'connections.form.csfle.field.gcp.privateKey.label': 'Clave privada',
  'connections.form.csfle.field.gcp.privateKey.description':
    'Una clave privada PKCS#8 codificada en base64.',
  'connections.form.csfle.field.gcp.endpoint.label': 'Endpoint',
  'connections.form.csfle.field.gcp.endpoint.description':
    'Un host con un puerto opcional.',
  'connections.form.csfle.field.aws.accessKeyId.label': 'ID de clave de acceso',
  'connections.form.csfle.field.aws.accessKeyId.description':
    'La clave de acceso que se usa para el proveedor de AWS KMS.',
  'connections.form.csfle.field.aws.secretAccessKey.label':
    'Clave de acceso secreta',
  'connections.form.csfle.field.aws.secretAccessKey.description':
    'La clave de acceso secreta que se usa para el proveedor de AWS KMS.',
  'connections.form.csfle.field.aws.sessionToken.label': 'Token de sesión',
  'connections.form.csfle.field.aws.sessionToken.description':
    'Un token de sesión de AWS opcional que se usará como encabezado X-Amz-Security-Token en las solicitudes a AWS.',
  'connections.form.csfle.field.azure.tenantId.label': 'ID de inquilino',
  'connections.form.csfle.field.azure.tenantId.description':
    'El ID de inquilino identifica la organización de la cuenta.',
  'connections.form.csfle.field.azure.clientId.label': 'ID de cliente',
  'connections.form.csfle.field.azure.clientId.description':
    'El ID de cliente para autenticar una aplicación registrada.',
  'connections.form.csfle.field.azure.clientSecret.label': 'Secreto de cliente',
  'connections.form.csfle.field.azure.clientSecret.description':
    'El secreto de cliente para autenticar una aplicación registrada.',
  'connections.form.csfle.field.azure.identityPlatformEndpoint.label':
    'Endpoint de la plataforma de identidad',
  'connections.form.csfle.field.azure.identityPlatformEndpoint.description':
    'Un host con un puerto opcional.',
  'connections.form.csfle.field.kmip.endpoint.label': 'Endpoint',
  'connections.form.csfle.field.kmip.endpoint.description':
    'El endpoint consta de un nombre de host y un puerto separados por dos puntos.',
  'connections.form.csfle.field.local.key.label': 'Clave',
  'connections.form.csfle.field.local.key.description':
    'Una cadena codificada en base64 de 96 bytes. Las claves administradas localmente no requieren configuración adicional, pero no se recomiendan para aplicaciones de producción.',
  'connections.form.general.directConnection': 'Conexión directa',
  'connections.form.general.directConnectionDescription':
    'Especifica si se debe forzar el envío de todas las operaciones al host indicado.',
  'connections.form.general.hostname': 'Nombre de host',
  'connections.form.general.host': 'Host',
  'connections.form.general.scheme': 'Esquema de la cadena de conexión',
  'connections.form.general.srvSchemeDescription':
    'Formato de conexión con lista de seeds DNS. El +srv indica al cliente que el nombre de host que sigue corresponde a un registro DNS SRV.',
  'connections.form.general.regularSchemeDescription':
    'Formato estándar de cadena de conexión. El formato estándar del URI de conexión de MongoDB se usa para conectarse a un despliegue de MongoDB: independiente, conjunto de réplicas o clúster particionado.',
  'connections.form.proxy.appProxyPrefix': 'Usa la',
  'connections.form.proxy.appProxyLink':
    'configuración de proxy de la aplicación',
  'connections.form.proxy.appProxySuffix': 'para comunicarte con el clúster.',
  'connections.form.proxy.none': 'Ninguno',
  'connections.form.proxy.sshPassword': 'SSH con contraseña',
  'connections.form.proxy.sshIdentity': 'SSH con archivo de identidad',
  'connections.form.proxy.socks': 'Socks5',
  'connections.form.proxy.applicationLevel': 'Proxy a nivel de aplicación',
  'connections.form.proxy.method': 'Método de túnel SSH/proxy',
  'connections.form.proxy.hostname': 'Nombre de host del proxy',
  'connections.form.proxy.port': 'Puerto del túnel del proxy',
  'connections.form.proxy.username': 'Nombre de usuario del proxy',
  'connections.form.proxy.password': 'Contraseña del proxy',
  'connections.form.ssh.hostname': 'Nombre de host SSH',
  'connections.form.ssh.port': 'Puerto SSH',
  'connections.form.ssh.username': 'Nombre de usuario SSH',
  'connections.form.ssh.identityFile': 'Archivo de identidad SSH',
  'connections.form.ssh.passphrase': 'Frase de contraseña SSH',
  'connections.form.ssh.password': 'Contraseña SSH',
  'connections.form.tls.learnMore': 'Más información',
  'connections.form.tls.certificateAuthority':
    'Autoridad de certificación (.pem)',
  'connections.form.tls.clientCertificate':
    'Certificado de cliente y clave (.pem)',
  'connections.form.tls.clientCertificateOptional':
    'Opcional (obligatorio con autenticación X.509)',
  'connections.form.tls.clientKeyPassword': 'Contraseña de la clave de cliente',
  'connections.form.tls.insecureDescription':
    'Esto incluye tlsAllowInvalidHostnames y tlsAllowInvalidCertificates.',
  'connections.form.tls.invalidHostnamesDescription':
    'Deshabilita la validación de los nombres de host del certificado que presenta la instancia de mongod/mongos.',
  'connections.form.tls.invalidCertificatesDescription':
    'Deshabilita la validación de los certificados del servidor.',
  'connections.form.tls.connection': 'Conexión SSL/TLS',
  'connections.form.tls.docsAriaLabel':
    'Documentación sobre las opciones de TLS/SSL',
  'connections.form.tls.type.DEFAULT': 'Predeterminado',
  'connections.form.tls.type.ON': 'Activado',
  'connections.form.tls.type.OFF': 'Desactivado',
  'connections.form.actions.cancel': 'Cancelar',
  'connections.form.actions.save': 'Guardar',
  'connections.form.actions.connect': 'Conectar',
  'connections.form.actions.saveAndConnect': 'Guardar y conectar',
  'connections.form.personalization.name': 'Nombre',
  'connections.form.personalization.color': 'Color',
  'connections.form.personalization.noColor': 'Sin color',
  'connections.form.personalization.favorite':
    'Marcar esta conexión como favorita',
  'connections.form.personalization.favoriteDescription':
    'Una conexión favorita se fija en la parte superior de tu lista de conexiones.',
  'connections.form.color.color1': 'Verde',
  'connections.form.color.color2': 'Verde azulado',
  'connections.form.color.color3': 'Azul',
  'connections.form.color.color4': 'Índigo',
  'connections.form.color.color5': 'Morado',
  'connections.form.color.color6': 'Rojo',
  'connections.form.color.color7': 'Rosa',
  'connections.form.color.color8': 'Naranja',
  'connections.form.color.color9': 'Amarillo',
  'connections.form.color.color10': 'Gris',
  'connections.form.overriddenOptions':
    'Algunas opciones de conexión se han sobrescrito mediante la configuración: {keys}',
  'connections.form.unableToSave': 'No se pudo guardar la conexión: {message}',
  'connections.form.newConnection': 'Nueva conexión',
  'connections.form.editConnection': 'Editar conexión',
  'connections.form.manageSettings':
    'Administra la configuración de tu conexión',
  'connections.form.connectedWarning':
    'Mientras estés conectado, solo puedes personalizar el nombre, el color o el estado de favorito de tu conexión. Para configurarla por completo, primero debes desconectarte. Ten en cuenta que desconectarte puede provocar la pérdida del trabajo en curso.',
  'connections.form.disconnect': 'Desconectar',
  'connections.form.protectedWarning':
    'Las opciones de conexión avanzadas están ocultas mientras la opción «Proteger secretos de las cadenas de conexión» esté habilitada. Deshabilita esa opción para configurar las opciones de conexión avanzadas o editar tu cadena de conexión.',
  'connections.form.connectionString.editConfirmTitle':
    '¿Seguro que quieres editar tu cadena de conexión?',
  'connections.form.connectionString.editConfirmDescription':
    'Al editar esta cadena de conexión se mostrarán tus credenciales.',
  'connections.form.connectionString.docsAriaLabel':
    'Documentación sobre la cadena de conexión',
  'connections.form.connectionString.edit': 'Editar cadena de conexión',
  'connections.form.connectionString.placeholder':
    'p. ej. mongodb+srv://username:password@cluster0-jtpxd.mongodb.net/admin',
  'connections.form.help.findTitle':
    '¿Cómo encuentro mi cadena de conexión en Atlas?',
  'connections.form.help.findBody':
    'Si tienes un clúster de Atlas, ve a la vista Cluster. Haz clic en el botón «Connect» del clúster al que quieres conectarte.',
  'connections.form.help.seeExample': 'Ver ejemplo',
  'connections.form.help.formatTitle':
    '¿Cómo doy formato a mi cadena de conexión?',
  'connections.form.validation.readPreferenceOptionsMode':
    'Las etiquetas de preferencia de lectura y la obsolescencia máxima solo pueden usarse con una preferencia de lectura distinta de primary.',
  'connections.form.validation.tagSetFormat':
    'Los conjuntos de etiquetas deben tener el formato key0:value0,key1:value1.',
  'connections.form.validation.maxStaleness':
    'La obsolescencia máxima debe ser de al menos 90 segundos.',
  'connections.form.validation.usernameMissing': 'Falta el nombre de usuario.',
  'connections.form.validation.passwordMissing': 'Falta la contraseña.',
  'connections.form.validation.x509Tls':
    'TLS debe estar habilitado para usar la autenticación x509.',
  'connections.form.validation.x509Certificate':
    'Se requiere un certificado de cliente para la autenticación x509.',
  'connections.form.validation.kerberosPrincipal':
    'Se requiere un nombre de principal con Kerberos.',
  'connections.form.validation.sshHostname':
    'Se requiere un nombre de host para conectarse mediante un túnel SSH.',
  'connections.form.validation.sshCredentials':
    'Al conectarse mediante un túnel SSH, se requiere una contraseña o un archivo de identidad.',
  'connections.form.validation.sshPassphraseFile':
    'Se requiere un archivo junto con la frase de contraseña.',
  'connections.form.validation.proxyHostname':
    'Se requiere el nombre de host del proxy.',
  'connections.form.validation.keyVaultFormat':
    'El espacio de nombres del Key Vault debe tener el formato <db>.<collection>',
  'connections.form.validation.keyVaultRequired':
    'Se debe especificar un espacio de nombres del Key Vault para las conexiones con cifrado en uso habilitado',
  'connections.form.validation.localKey':
    'La clave local debe ser una cadena de 96 bytes codificada en Base64',
  'connections.form.validation.kmipEndpoint':
    'El endpoint de KMIP debe tener el formato <host>:<port>',
  'connections.form.validation.csfleStoredToDisk':
    'Las credenciales de los proveedores de KMS del cifrado en uso se almacenarán en disco.',
  'connections.form.validation.certificateValidationDisabled':
    'La validación de certificados TLS/SSL está deshabilitada. Si es posible, habilítala para evitar vulnerabilidades de seguridad.',
  'connections.form.validation.directConnectionSrv':
    'directConnection no es compatible con los URI SRV.',
  'connections.form.validation.directConnectionReplicaSet':
    'directConnection no es compatible con replicaSet.',
  'connections.form.validation.directConnectionMultipleHosts':
    'directConnection no es compatible con varios hosts.',
  'connections.form.validation.tlsDisabled':
    'TLS/SSL está deshabilitado. Si es posible, habilita TLS/SSL para evitar vulnerabilidades de seguridad.',
  'connections.form.validation.socksPlaintext':
    'La contraseña del proxy Socks5 se transmitirá en texto sin cifrar.',
  'connections.form.validation.remoteProxyLocalHost':
    'Se está usando un proxy remoto con un host de servicio de MongoDB local.',
  'connections.form.validation.encryptedFieldConfig':
    'EncryptedFieldConfig no es válido: {error}',
  'connections.form.validation.unknownReadPreference':
    'Preferencia de lectura desconocida {readPreference}',
  'connections.form.validation.invalidHostCharacter':
    "Carácter no válido en el host: '{character}'",
  'connections.form.validation.schemaUpdate':
    'Error al actualizar el esquema de conexión: {message}',
  'connections.notifications.connecting': 'Conectando a {title}',
  'connections.notifications.completeAuthInBrowser':
    'Completa la autenticación en el navegador',
  'connections.notifications.connectionFailed': 'Error de conexión',
  'connections.notifications.debug': 'Depurar',
  'connections.notifications.review': 'Revisar',
  'connections.notifications.cancel': 'CANCELAR',
  'connections.notifications.connected': 'Conectado a {title}',
  'connections.notifications.maxConnections.one':
    'Solo se puede mantener {count} conexión al mismo tiempo. Primero desconéctate de otra conexión.',
  'connections.notifications.maxConnections.other':
    'Solo se pueden mantener {count} conexiones al mismo tiempo. Primero desconéctate de otra conexión.',
  'connections.notifications.maxConnectionsTitle':
    'Se alcanzó el límite máximo de conexiones simultáneas',
  'connections.notifications.deviceAuthTitle':
    'Completar la autenticación en el navegador',
  'connections.notifications.deviceAuthVisit':
    'Visita la siguiente URL para completar la autenticación de',
  'connections.notifications.deviceAuthEnterCode':
    'Introduce el siguiente código en esa página:',
  'connections.endOfLife.title':
    'Se detectó una versión de MongoDB al final de su ciclo de vida',
  'connections.endOfLife.namedWarning':
    'El servidor o servicio «{title}» parece ejecutar una versión de MongoDB que ya no es compatible.',
  'connections.endOfLife.genericWarning':
    'Este servidor o servicio parece ejecutar una versión de MongoDB que ya no es compatible.',
  'connections.endOfLife.versionedBody':
    'La versión del servidor ({version}) ha llegado al final de su ciclo de vida. Considera actualizar para obtener las funciones y mejoras de rendimiento más recientes.',
  'connections.endOfLife.body':
    'La versión del servidor ha llegado al final de su ciclo de vida. Considera actualizar para obtener las funciones y mejoras de rendimiento más recientes.',
  'connections.endOfLife.learnMore':
    'Más información en los calendarios de ciclo de vida de MongoDB.',
  'connections.nonGenuine.title': 'Se detectó un MongoDB no genuino',
  'connections.nonGenuine.namedWarning':
    'El servidor o servicio «{title}» parece ser una emulación de MongoDB y no un producto oficial de MongoDB.',
  'connections.nonGenuine.genericWarning':
    'Este servidor o servicio parece ser una emulación de MongoDB y no un producto oficial de MongoDB.',
  'connections.nonGenuine.body':
    'Algunas funciones documentadas de MongoDB pueden comportarse de forma diferente, faltar por completo o estar incompletas, o tener características de rendimiento inesperadas.',
  'connections.nonGenuine.learnMore': 'Más información',
  'connections.store.loadFailed': 'No se pudieron cargar las conexiones',
  'connections.store.authExpired': 'La autenticación de {title} ha caducado',
  'connections.store.reauthenticate':
    'Debes volver a autenticarte en la base de datos para continuar.',
  'connections.store.unableToConnect': 'No se puede conectar a {title}',
  'connections.store.nonRetryableReason':
    'Motivo: {reason}. Para seguir usando esta conexión, desconéctate y vuelve a conectarte, o actualiza la página.',
  'connections.store.authFailed': 'Error al autenticar {title}',
  'connections.store.saveFailed': 'Se produjo un error al guardar la conexión',
  'connections.importExport.connectionName': 'Nombre de la conexión',
  'connections.importExport.error': 'Error: {error}',
  'connections.importExport.selectFile': 'Seleccionar archivo de conexiones',
  'connections.importExport.select': 'Seleccionar',
  'connections.importExport.passphraseRequired':
    'Se requiere la frase de contraseña',
  'connections.export.successTitle': 'Exportación correcta',
  'connections.export.successDescription':
    'Las conexiones se exportaron correctamente',
  'connections.export.title': 'Exportar conexiones guardadas',
  'connections.export.submit': 'Exportar',
  'connections.export.targetFile': 'Archivo de destino',
  'connections.export.removeSecrets': 'Quitar secretos',
  'connections.export.removeSecretsDescription':
    'Omitir secretos como contraseñas y tokens de acceso',
  'connections.export.encryptionPassword': 'Contraseña de cifrado',
  'connections.export.encryptionPasswordDescription':
    'Frase de contraseña opcional para cifrar secretos como contraseñas y tokens de acceso',
  'connections.import.successTitle': 'Importación correcta',
  'connections.import.successDescription': 'Se agregaron nuevas conexiones',
  'connections.import.existingConnection': 'Conexión existente',
  'connections.import.title': 'Importar conexiones guardadas',
  'connections.import.submit': 'Importar',
  'connections.import.sourceFile': 'Archivo de origen',
  'connections.import.untrustedWarning':
    'Importa archivos de conexión solo de fuentes de confianza. Los archivos importados pueden contener detalles de conexión confidenciales y configuraciones de red.',
  'connections.import.decryptionPassword': 'Contraseña de descifrado',
  'connections.import.decryptionPasswordDescription':
    'Frase de contraseña para descifrar los secretos, si se especificó una al exportar',
  'connections.import.overwriteWarning':
    'Algunas de las conexiones seleccionadas ya existen y se sobrescribirán durante la importación.',
  'connections.shell.disabledPrefix':
    'MongoDB Shell está deshabilitado en tu configuración. Si no era lo que querías, te recomendamos revisar tu',
  'connections.shell.disabledSettingsLink': 'configuración',
  'connections.shell.disabledSuffix': 'y habilitar el shell.',
  'connections.shell.closeShell': 'Cerrar shell',
  'connections.shell.openShell': 'Abrir shell',
  'connections.shell.commandInProgress': 'Comando en curso…',
  'connections.shell.info': 'Información del shell',
  'connections.shell.keyColumn': 'Tecla',
  'connections.shell.descriptionColumn': 'Descripción',
  'connections.shell.moreInfoPrefix': 'Para obtener más información, visita la',
  'connections.shell.documentationLink': 'documentación de MongoDB Shell',
  'connections.shell.keyboardShortcuts': 'Atajos de teclado',
  'connections.shell.hotkey.moveToLineStart':
    'Mueve el cursor al principio de la línea.',
  'connections.shell.hotkey.moveBack':
    'Mueve el cursor un carácter hacia atrás.',
  'connections.shell.hotkey.stop': 'Detiene el comando que se está ejecutando.',
  'connections.shell.hotkey.deleteNext': 'Elimina el carácter siguiente.',
  'connections.shell.hotkey.moveToLineEnd':
    'Mueve el cursor al final de la línea.',
  'connections.shell.hotkey.moveForward':
    'Mueve el cursor un carácter hacia adelante.',
  'connections.shell.hotkey.erase':
    'Borra un carácter, igual que la tecla de retroceso.',
  'connections.shell.hotkey.clear':
    'Limpia la pantalla, igual que el comando clear.',
  'connections.shell.hotkey.swap':
    'Intercambia los dos últimos caracteres antes del cursor.',
  'connections.shell.hotkey.uppercase': 'Convierte la línea a mayúsculas.',
  'connections.shell.hotkey.historyBack':
    'Recorre el historial de comandos hacia atrás.',
  'connections.shell.hotkey.historyForward':
    'Recorre el historial de comandos hacia adelante.',
  'connections.form.advanced.urlOptionGroup.connectionTimeout':
    'Opciones de tiempo de espera de conexión',
  'connections.form.advanced.urlOptionGroup.compression':
    'Opciones de compresión',
  'connections.form.advanced.urlOptionGroup.connectionPool':
    'Opciones del grupo de conexiones',
  'connections.form.advanced.urlOptionGroup.writeConcern':
    'Opciones de write concern',
  'connections.form.advanced.urlOptionGroup.readConcern':
    'Opciones de read concern',
  'connections.form.advanced.urlOptionGroup.server': 'Opciones del servidor',
  'connections.form.advanced.urlOptionGroup.miscellaneous':
    'Configuración varia',
  'connections.form.validation.invalidFieldInput':
    'El campo contenía una entrada no válida',
  'connections.store.nonRetryable.unauthorized': 'No autorizado',
  'connections.store.nonRetryable.forbidden': 'Prohibido',
  'connections.store.nonRetryable.notFound': 'No encontrado',
  'connections.store.nonRetryable.violatedPolicy': 'Política infringida',
  'connections.store.nonRetryable.unknown': 'Desconocido',
  'connections.store.atlasStreamsUnsupported':
    'Atlas Stream Processing aún no es compatible con MongoDB Compass. Para trabajar con tu instancia de Stream Processing, conéctate con mongosh o MongoDB for VS Code.',
  'connections.store.reauthDeclined':
    'Reautenticación rechazada por el usuario',
  'connections.clusterLoadError.title':
    'Se produjo un error al consultar tu implementación de MongoDB',
  'connections.clusterLoadError.tryAgain':
    'Inténtalo de nuevo en unos minutos.',
  'connections.clusterLoadError.backToClusters': 'Volver a los clústeres',
  'connections.importExport.noConnectionsInFile':
    'El archivo no contiene ninguna conexión',
};
