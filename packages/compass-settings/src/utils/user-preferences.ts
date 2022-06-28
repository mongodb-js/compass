import { promisifyAmpersandMethod } from 'mongodb-data-service';
import Preferences from 'compass-preferences-model';
// import type { THEMES } from 'compass-preferences-model';

export type UserPreferences = {
  agreedToLicense: boolean;
  authKerberos: boolean;
  authLdap: boolean;
  authMongodb: boolean;
  authX509: boolean;
  autoUpdates: boolean;
  chartView: boolean;
  currentUserId: string;
  enableFeedbackPanel: boolean;
  enableMaps: boolean;
  id: string;
  indexDDL: boolean;
  lastKnownVersion: string;
  networkTraffic: boolean;
  queryBuilder: boolean;
  serverStats: boolean;
  showAutoUpdateBanner: boolean;
  showExplainPlanTab: boolean;
  showedNetworkOptIn: boolean;
  singleDocumentCrud: boolean;
  sslAll: boolean;
  sslServer: boolean;
  sslUnvalidated: boolean;
  telemetryAnonymousId: string;
  theme: string; // todo use THEMES
  trackErrors: boolean;
  trackUsageStatistics: boolean;
};

export const fetchPreferences = async (): Promise<UserPreferences> => {
  const model = new Preferences();
  const fetch = promisifyAmpersandMethod(
    model.fetch.bind(model)
  );
  const settings = await fetch();
  return (settings as any).getAttributes({ props: true }, true);
}

export const updatePreference = async (key: keyof UserPreferences, value: boolean | string): Promise<void> => {
  const model = new Preferences();
  const fetch = promisifyAmpersandMethod(
    model.fetch.bind(model)
  );
  await fetch();

  model.set({
    [key]: value
  });

  const save = promisifyAmpersandMethod(
    model.save.bind(model)
  );
  await save(model);
}