import type { DataModelStorage } from './data-model-storage';

class DataModelStorageElectron implements DataModelStorage {
  get() {
    return {};
  }
}

const storage = new DataModelStorageElectron();

export default storage;
