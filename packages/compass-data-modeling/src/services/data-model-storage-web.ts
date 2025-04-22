import type { DataModelStorage } from './data-model-storage';

class DataModelStorageWeb implements DataModelStorage {
  get() {
    return {};
  }
}

const storage = new DataModelStorageWeb();

export default storage;
