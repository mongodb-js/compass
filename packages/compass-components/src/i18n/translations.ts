/**
 * Translation catalogs. English is the source language and lives next to the
 * code that renders it (see `useTranslation`), so only the other languages are
 * listed here. Missing keys fall back to the English text.
 *
 * Key conventions:
 *  - `settings.*`                     settings dialog chrome
 *  - `pref.<name>.short|long`         preference title and description
 *  - `pref.<name>.option.<value>.label|description`  enum preference options
 */
export type Catalog = Record<string, string>;

const de: Catalog = {
  'settings.title': 'Einstellungen',
  'settings.save': 'Speichern',
  'settings.cancel': 'Abbrechen',
  'settings.tab.general': 'Allgemein',
  'settings.tab.theme': 'Design',
  'settings.tab.privacy': 'Datenschutz',
  'settings.tab.proxy': 'Proxy-Konfiguration',
  'settings.tab.oidc': 'OIDC',
  'settings.tab.ai': 'Künstliche Intelligenz',
  'settings.tab.preview': 'Funktionsvorschau',
  'settings.general.intro':
    'Um die Benutzererfahrung zu verbessern, kann Compass bestimmte Funktionen aktivieren oder deaktivieren. Bitte wähle aus den folgenden Einstellungen:',
  'settings.state.set-cli':
    'Diese Einstellung kann nicht geändert werden, da sie beim Start von Compass festgelegt wurde.',
  'settings.state.set-global':
    'Diese Einstellung kann nicht geändert werden, da sie in der globalen Compass-Konfigurationsdatei festgelegt wurde.',
  'settings.state.hardcoded':
    'Diese Einstellung kann nicht geändert werden, da sie für diese Compass-Edition deaktiviert ist.',
  'settings.state.derived':
    'Diese Einstellung kann nicht geändert werden, da ihr Wert durch eine andere Option vorgegeben wird.',
  'settings.theme.intro': 'Ändere das Erscheinungsbild von Compass.',
  'settings.theme.syncWithOS': 'Mit Betriebssystem synchronisieren',
  'settings.theme.syncWithOSDescription':
    'Automatisch zwischen hellem und dunklem Design wechseln, passend zu den Einstellungen deines Betriebssystems',
  'settings.theme.light': 'Helles Design',
  'settings.theme.dark': 'Dunkles Design',

  'pref.language.short': 'Sprache',
  'pref.language.long':
    'Wähle die Sprache der Compass-Benutzeroberfläche. Texte, die noch nicht übersetzt sind, werden auf Englisch angezeigt.',
  'pref.language.option.en.description': 'Englisch (Standard)',
  'pref.language.option.de.description': 'Deutsch',
  'pref.language.option.fr.description': 'Französisch',
  'pref.language.option.es.description': 'Spanisch',
  'pref.readOnly.short': 'Schreibgeschützten Modus aktivieren',
  'pref.readOnly.long':
    'Compass strikt auf Leseoperationen beschränken; alle Schreib- und Löschfunktionen werden entfernt.',
  'pref.enableShell.short': 'MongoDB Shell aktivieren',
  'pref.enableShell.long':
    'Compass erlaubt die Interaktion mit MongoDB-Deployments über die eingebettete Shell.',
  'pref.protectConnectionStrings.short':
    'Geheimnisse in Verbindungs-Strings schützen',
  'pref.protectConnectionStrings.long':
    'Zugangsdaten in Verbindungs-Strings vor Benutzern verbergen.',
  'pref.timezone.short': 'Persönliche Zeitzonen-Anzeige',
  'pref.defaultSortOrder.short': 'Standardsortierung für die Abfrageleiste',
  'pref.defaultSortOrder.long':
    'Alle über die Abfrageleiste ausgeführten Abfragen verwenden diese Sortierung. Nicht verfügbar für Views und Timeseries.',
  'pref.defaultSortOrder.option..label': 'MongoDB-Server-Standard',
  'pref.defaultSortOrder.option..description':
    'Dokumente in natürlicher Reihenfolge zurückgeben',
  'pref.showKerberosPasswordField.short': 'Kerberos-Passwortfeld anzeigen',
  'pref.showKerberosPasswordField.long':
    'Ein Passwortfeld für die Kerberos-Authentifizierung anzeigen. Meist nur nützlich, wenn man sich als anderer Benutzer als der aktuelle Systembenutzer authentifizieren möchte.',
  'pref.maxTimeMS.short':
    'Obergrenze für maxTimeMS bei Compass-Datenbankoperationen',
  'pref.enableDevTools.short': 'DevTools aktivieren',
  'pref.enableDevTools.long':
    'Die Chromium Developer Tools aktivieren, mit denen sich der Electron-Prozess debuggen lässt.',
  'pref.installURLHandlers.short':
    'Compass als URL-Protokoll-Handler installieren',
  'pref.installURLHandlers.long':
    'Compass als Handler für mongodb://- und mongodb+srv://-URLs registrieren',
  'pref.enableShowDialogOnQuit.short':
    'Bestätigungsdialog beim Beenden anzeigen',
  'pref.enableShowDialogOnQuit.long':
    'Festlegen, ob beim Beenden von Compass (Cmd/Strg-Q) ein Bestätigungsdialog angezeigt wird.',
  'pref.enableDbAndCollStats.short':
    'Datenbank- und Collection-Statistiken anzeigen',
  'pref.inferNamespacesFromPrivileges.short':
    'Zusätzliche Namespaces aus Berechtigungen ableiten',
  'pref.inferNamespacesFromPrivileges.long':
    'Datenbanken und Collections anzeigen, die sich aus deinen Rollen und Berechtigungen ergeben, zusätzlich zu den von listDatabases und listCollections zurückgegebenen. Dazu können Namespaces gehören, die noch nicht existieren.',
  'pref.legacyUUIDDisplayEncoding.short':
    'Kodierung für die Anzeige von Legacy-UUID-Werten',
  'pref.legacyUUIDDisplayEncoding.long':
    'Wähle die Kodierung, mit der Legacy-UUIDs des Binary-Subtyps 3 angezeigt werden.',
  'pref.legacyUUIDDisplayEncoding.option..label': 'Rohdaten (keine Kodierung)',
  'pref.legacyUUIDDisplayEncoding.option..description':
    'Legacy-UUIDs als binäre Rohdaten anzeigen',
  'pref.legacyUUIDDisplayEncoding.option.LegacyJavaUUID.description':
    'Legacy-UUIDs mit Java-UUID-Kodierung anzeigen. LegacyJavaUUID("UUID_STRING")',
  'pref.legacyUUIDDisplayEncoding.option.LegacyCSharpUUID.description':
    'Legacy-UUIDs mit C#-UUID-Kodierung anzeigen. LegacyCSharpUUID("UUID_STRING")',
  'pref.legacyUUIDDisplayEncoding.option.LegacyPythonUUID.description':
    'Legacy-UUIDs mit Python-UUID-Kodierung anzeigen. LegacyPythonUUID("UUID_STRING")',
  'pref.legacyUUIDDisplayEncoding.option.ExtendedJSON.description':
    'Legacy-UUIDs als Extended JSON anzeigen. {"$binary": {"base64": "...", "subType": "03"}}',
};

const fr: Catalog = {
  'settings.title': 'Paramètres',
  'settings.save': 'Enregistrer',
  'settings.cancel': 'Annuler',
  'settings.tab.general': 'Général',
  'settings.tab.theme': 'Thème',
  'settings.tab.privacy': 'Confidentialité',
  'settings.tab.proxy': 'Configuration du proxy',
  'settings.tab.oidc': 'OIDC',
  'settings.tab.ai': 'Intelligence artificielle',
  'settings.tab.preview': 'Aperçu des fonctionnalités',
  'settings.general.intro':
    "Pour améliorer l'expérience utilisateur, Compass peut activer ou désactiver certaines fonctionnalités. Veuillez choisir parmi les paramètres ci-dessous :",
  'settings.state.set-cli':
    'Ce paramètre ne peut pas être modifié car il a été défini au démarrage de Compass.',
  'settings.state.set-global':
    'Ce paramètre ne peut pas être modifié car il a été défini dans le fichier de configuration global de Compass.',
  'settings.state.hardcoded':
    'Ce paramètre ne peut pas être modifié car il est désactivé pour cette édition de Compass.',
  'settings.state.derived':
    'Ce paramètre ne peut pas être modifié car sa valeur est imposée par une autre option.',
  'settings.theme.intro': "Modifiez l'apparence de Compass.",
  'settings.theme.syncWithOS': 'Synchroniser avec le système',
  'settings.theme.syncWithOSDescription':
    'Basculer automatiquement entre les thèmes clair et sombre selon les paramètres de votre système',
  'settings.theme.light': 'Thème clair',
  'settings.theme.dark': 'Thème sombre',

  'pref.language.short': 'Langue',
  'pref.language.long':
    "Sélectionnez la langue de l'interface de Compass. Les textes non encore traduits sont affichés en anglais.",
  'pref.language.option.en.description': 'Anglais (par défaut)',
  'pref.language.option.de.description': 'Allemand',
  'pref.language.option.fr.description': 'Français',
  'pref.language.option.es.description': 'Espagnol',
  'pref.readOnly.short': 'Activer le mode lecture seule',
  'pref.readOnly.long':
    "Limiter strictement Compass aux opérations de lecture, toutes les fonctions d'écriture et de suppression étant retirées.",
  'pref.enableShell.short': 'Activer le MongoDB Shell',
  'pref.enableShell.long':
    'Autoriser Compass à interagir avec les déploiements MongoDB via le shell intégré.',
  'pref.protectConnectionStrings.short':
    'Protéger les secrets des chaînes de connexion',
  'pref.protectConnectionStrings.long':
    'Masquer les identifiants des chaînes de connexion aux utilisateurs.',
  'pref.timezone.short': "Préférence d'affichage du fuseau horaire personnel",
  'pref.defaultSortOrder.short': 'Tri par défaut de la barre de requête',
  'pref.defaultSortOrder.long':
    'Toutes les requêtes exécutées depuis la barre de requête appliqueront ce tri. Non disponible pour les vues et les séries temporelles.',
  'pref.defaultSortOrder.option..label': 'Valeur par défaut du serveur MongoDB',
  'pref.defaultSortOrder.option..description':
    "Renvoyer les documents dans l'ordre naturel",
  'pref.showKerberosPasswordField.short':
    'Afficher le champ de mot de passe Kerberos',
  'pref.showKerberosPasswordField.long':
    "Afficher un champ de mot de passe pour l'authentification Kerberos. Généralement utile uniquement pour s'authentifier avec un autre utilisateur que l'utilisateur système actuel.",
  'pref.maxTimeMS.short':
    'Limite supérieure de maxTimeMS pour les opérations de base de données de Compass',
  'pref.enableDevTools.short': 'Activer les DevTools',
  'pref.enableDevTools.long':
    "Activer les outils de développement Chromium, utiles pour déboguer le processus d'Electron.",
  'pref.installURLHandlers.short':
    'Installer Compass comme gestionnaire de protocole URL',
  'pref.installURLHandlers.long':
    'Enregistrer Compass comme gestionnaire des URL mongodb:// et mongodb+srv://',
  'pref.enableShowDialogOnQuit.short':
    'Afficher la confirmation avant de quitter',
  'pref.enableShowDialogOnQuit.long':
    "Définir si une boîte de dialogue de confirmation s'affiche à la fermeture de Compass (cmd/ctrl-Q).",
  'pref.enableDbAndCollStats.short':
    'Afficher les statistiques des bases de données et des collections',
  'pref.inferNamespacesFromPrivileges.short':
    'Déduire des espaces de noms supplémentaires à partir des privilèges',
  'pref.inferNamespacesFromPrivileges.long':
    "Afficher les bases de données et collections impliquées par vos rôles et privilèges, en plus de celles renvoyées par listDatabases et listCollections. Cela peut inclure des espaces de noms qui n'existent pas encore.",
  'pref.legacyUUIDDisplayEncoding.short':
    "Encodage d'affichage des valeurs UUID héritées",
  'pref.legacyUUIDDisplayEncoding.long':
    "Sélectionnez l'encodage utilisé pour afficher les UUID hérités du sous-type binaire 3.",
  'pref.legacyUUIDDisplayEncoding.option..label':
    'Données brutes (sans encodage)',
  'pref.legacyUUIDDisplayEncoding.option..description':
    'Afficher les UUID hérités sous forme de données binaires brutes',
  'pref.legacyUUIDDisplayEncoding.option.LegacyJavaUUID.description':
    'Afficher les UUID hérités avec l\'encodage UUID Java. LegacyJavaUUID("UUID_STRING")',
  'pref.legacyUUIDDisplayEncoding.option.LegacyCSharpUUID.description':
    'Afficher les UUID hérités avec l\'encodage UUID C#. LegacyCSharpUUID("UUID_STRING")',
  'pref.legacyUUIDDisplayEncoding.option.LegacyPythonUUID.description':
    'Afficher les UUID hérités avec l\'encodage UUID Python. LegacyPythonUUID("UUID_STRING")',
  'pref.legacyUUIDDisplayEncoding.option.ExtendedJSON.description':
    'Afficher les UUID hérités en Extended JSON. {"$binary": {"base64": "...", "subType": "03"}}',
};

const es: Catalog = {
  'settings.title': 'Configuración',
  'settings.save': 'Guardar',
  'settings.cancel': 'Cancelar',
  'settings.tab.general': 'General',
  'settings.tab.theme': 'Tema',
  'settings.tab.privacy': 'Privacidad',
  'settings.tab.proxy': 'Configuración del proxy',
  'settings.tab.oidc': 'OIDC',
  'settings.tab.ai': 'Inteligencia artificial',
  'settings.tab.preview': 'Vista previa de funciones',
  'settings.general.intro':
    'Para mejorar la experiencia de usuario, Compass puede activar o desactivar determinadas funciones. Elige entre las siguientes opciones:',
  'settings.state.set-cli':
    'Esta opción no se puede modificar porque se definió al iniciar Compass.',
  'settings.state.set-global':
    'Esta opción no se puede modificar porque se definió en el archivo de configuración global de Compass.',
  'settings.state.hardcoded':
    'Esta opción no se puede modificar porque está desactivada en esta edición de Compass.',
  'settings.state.derived':
    'Esta opción no se puede modificar porque su valor viene determinado por otra opción.',
  'settings.theme.intro': 'Cambia la apariencia de Compass.',
  'settings.theme.syncWithOS': 'Sincronizar con el sistema operativo',
  'settings.theme.syncWithOSDescription':
    'Alternar automáticamente entre los temas claro y oscuro según la configuración de tu sistema operativo',
  'settings.theme.light': 'Tema claro',
  'settings.theme.dark': 'Tema oscuro',

  'pref.language.short': 'Idioma',
  'pref.language.long':
    'Selecciona el idioma de la interfaz de Compass. Los textos que aún no están traducidos se muestran en inglés.',
  'pref.language.option.en.description': 'Inglés (predeterminado)',
  'pref.language.option.de.description': 'Alemán',
  'pref.language.option.fr.description': 'Francés',
  'pref.language.option.es.description': 'Español',
  'pref.readOnly.short': 'Activar el modo de solo lectura',
  'pref.readOnly.long':
    'Limitar Compass estrictamente a operaciones de lectura, eliminando todas las funciones de escritura y borrado.',
  'pref.enableShell.short': 'Activar MongoDB Shell',
  'pref.enableShell.long':
    'Permitir que Compass interactúe con los despliegues de MongoDB mediante la shell integrada.',
  'pref.protectConnectionStrings.short':
    'Proteger los secretos de las cadenas de conexión',
  'pref.protectConnectionStrings.long':
    'Ocultar a los usuarios las credenciales de las cadenas de conexión.',
  'pref.timezone.short':
    'Preferencia personal de visualización de zona horaria',
  'pref.defaultSortOrder.short':
    'Orden predeterminado de la barra de consultas',
  'pref.defaultSortOrder.long':
    'Todas las consultas ejecutadas desde la barra de consultas aplicarán este orden. No disponible para vistas ni series temporales.',
  'pref.defaultSortOrder.option..label':
    'Valor predeterminado del servidor MongoDB',
  'pref.defaultSortOrder.option..description':
    'Devolver los documentos en su orden natural',
  'pref.showKerberosPasswordField.short':
    'Mostrar el campo de contraseña de Kerberos',
  'pref.showKerberosPasswordField.long':
    'Mostrar un campo de contraseña para la autenticación Kerberos. Normalmente solo es útil al autenticarse como un usuario distinto del usuario actual del sistema.',
  'pref.maxTimeMS.short':
    'Límite superior de maxTimeMS para las operaciones de base de datos de Compass',
  'pref.enableDevTools.short': 'Activar DevTools',
  'pref.enableDevTools.long':
    'Activar las herramientas para desarrolladores de Chromium, que sirven para depurar el proceso de Electron.',
  'pref.installURLHandlers.short':
    'Instalar Compass como controlador del protocolo URL',
  'pref.installURLHandlers.long':
    'Registrar Compass como controlador de las URL mongodb:// y mongodb+srv://',
  'pref.enableShowDialogOnQuit.short': 'Mostrar confirmación al salir',
  'pref.enableShowDialogOnQuit.long':
    'Define si se muestra un cuadro de confirmación al salir de Compass (cmd/ctrl-Q).',
  'pref.enableDbAndCollStats.short':
    'Mostrar estadísticas de bases de datos y colecciones',
  'pref.inferNamespacesFromPrivileges.short':
    'Inferir espacios de nombres adicionales a partir de los privilegios',
  'pref.inferNamespacesFromPrivileges.long':
    'Mostrar las bases de datos y colecciones implícitas en tus roles y privilegios, además de las devueltas por listDatabases y listCollections. Puede incluir espacios de nombres que aún no existen.',
  'pref.legacyUUIDDisplayEncoding.short':
    'Codificación para mostrar valores UUID heredados',
  'pref.legacyUUIDDisplayEncoding.long':
    'Selecciona la codificación utilizada para mostrar los UUID heredados del subtipo binario 3.',
  'pref.legacyUUIDDisplayEncoding.option..label':
    'Datos sin procesar (sin codificación)',
  'pref.legacyUUIDDisplayEncoding.option..description':
    'Mostrar los UUID heredados como datos binarios sin procesar',
  'pref.legacyUUIDDisplayEncoding.option.LegacyJavaUUID.description':
    'Mostrar los UUID heredados con la codificación UUID de Java. LegacyJavaUUID("UUID_STRING")',
  'pref.legacyUUIDDisplayEncoding.option.LegacyCSharpUUID.description':
    'Mostrar los UUID heredados con la codificación UUID de C#. LegacyCSharpUUID("UUID_STRING")',
  'pref.legacyUUIDDisplayEncoding.option.LegacyPythonUUID.description':
    'Mostrar los UUID heredados con la codificación UUID de Python. LegacyPythonUUID("UUID_STRING")',
  'pref.legacyUUIDDisplayEncoding.option.ExtendedJSON.description':
    'Mostrar los UUID heredados como Extended JSON. {"$binary": {"base64": "...", "subType": "03"}}',
};

import * as sidebar from './translations-sidebar';
import * as connections from './translations-connections';
import * as aggregations from './translations-aggregations';
import * as crud from './translations-crud';
import * as indexes from './translations-indexes';
import * as importexport from './translations-importexport';
import * as collection from './translations-collection';
import * as schema from './translations-schema';
import * as assistant from './translations-assistant';
import * as datamodeling from './translations-datamodeling';
import * as globalwrites from './translations-globalwrites';
import * as misc from './translations-misc';
import * as tabs from './translations-settings-tabs';

export const CATALOGS: Record<string, Catalog> = {
  de: {
    ...de,
    ...tabs.de,
    ...sidebar.de,
    ...connections.de,
    ...aggregations.de,
    ...crud.de,
    ...indexes.de,
    ...importexport.de,
    ...collection.de,
    ...schema.de,
    ...assistant.de,
    ...datamodeling.de,
    ...globalwrites.de,
    ...misc.de,
  },
  fr: {
    ...fr,
    ...tabs.fr,
    ...sidebar.fr,
    ...connections.fr,
    ...aggregations.fr,
    ...crud.fr,
    ...indexes.fr,
    ...importexport.fr,
    ...collection.fr,
    ...schema.fr,
    ...assistant.fr,
    ...datamodeling.fr,
    ...globalwrites.fr,
    ...misc.fr,
  },
  es: {
    ...es,
    ...tabs.es,
    ...sidebar.es,
    ...connections.es,
    ...aggregations.es,
    ...crud.es,
    ...indexes.es,
    ...importexport.es,
    ...collection.es,
    ...schema.es,
    ...assistant.es,
    ...datamodeling.es,
    ...globalwrites.es,
    ...misc.es,
  },
};
