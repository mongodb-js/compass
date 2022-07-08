import type AppRegistry from 'hadron-app-registry';
import type MongoDBInstance from 'mongodb-instance-model';
type HadronApp = {
  appRegistry?: AppRegistry;
  instance?: MongoDBInstance;
};
declare const hadronApp: HadronApp;
export default hadronApp;
