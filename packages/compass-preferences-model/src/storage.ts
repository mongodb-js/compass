import { UUID } from 'bson';
import type { UserPreferences } from './preferences';
import { UserData } from '@mongodb-js/compass-user-data';

export abstract class BasePreferencesStorage {
  abstract setup(): Promise<void>;
  abstract getPreferences(): UserPreferences;
  abstract updatePreferences(
    attributes: Partial<UserPreferences>
  ): Promise<void>;
}

export class SandboxPreferences extends BasePreferencesStorage {
  constructor(private preferences: UserPreferences) {
    super();
  }

  getPreferences() {
    return this.preferences;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async updatePreferences(attributes: Partial<UserPreferences>) {
    this.preferences = {
      ...this.preferences,
      ...attributes,
    };
  }

  async setup() {
    // noop
  }
}

export class StoragePreferences extends BasePreferencesStorage {
  private readonly file = 'General.json';
  private readonly defaultPreferences: UserPreferences;
  private readonly userData: UserData<UserPreferences>;

  constructor(private preferences: UserPreferences, private basePath?: string) {
    super();
    this.defaultPreferences = preferences;
    this.userData = new UserData({
      subdir: 'AppPreferences',
      basePath,
    });
  }

  async setup() {
    try {
      this.preferences = await this.readPreferences();
    } catch (e) {
      if ((e as any).code !== 'ENOENT') {
        throw e;
      }
      // Create the file for the first time
      await this.userData.write(this.file, this.defaultPreferences);
    }
  }

  private async readPreferences() {
    return await this.userData.readOne(this.file, {
      ignoreErrors: false,
    });
  }

  getPreferences() {
    return {
      ...this.defaultPreferences,
      ...this.preferences,
    };
  }

  async updatePreferences(attributes: Partial<UserPreferences>) {
    const newPreferences = {
      ...(await this.readPreferences()),
      ...attributes,
    };
    await this.userData.write(this.file, newPreferences);

    this.preferences = newPreferences;
  }
}

export type User = {
  id: string;
  createdAt: Date;
  lastUsed: Date;
};

export class UserStorage {
  private readonly userData: UserData<User>;
  constructor(basePath?: string) {
    this.userData = new UserData({
      subdir: 'Users',
      basePath,
    });
  }

  async getOrCreate(id: string): Promise<User> {
    if (!id) {
      return this.createUser();
    }

    try {
      return await this.getUser(id);
    } catch (e) {
      if ((e as any).code !== 'ENOENT') {
        throw e;
      }
      return await this.createUser();
    }
  }

  async getUser(id: string): Promise<User> {
    const user = await this.userData.readOne(this.getFileName(id), {
      ignoreErrors: false,
    });
    return {
      id: user.id,
      createdAt: new Date(user.createdAt),
      lastUsed: new Date(user.lastUsed),
    };
  }

  private async createUser(): Promise<User> {
    const id = new UUID().toString();
    const user = {
      id,
      createdAt: new Date(),
      lastUsed: new Date(),
    };
    return this.writeUser(user);
  }

  async updateUser(id: string, attributes: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    const newData = {
      ...user,
      ...attributes,
    };
    return this.writeUser(newData);
  }

  private async writeUser(user: User): Promise<User> {
    await this.userData.write(this.getFileName(user.id), user);
    return this.getUser(user.id);
  }

  private getFileName(id: string) {
    return `${id}.json`;
  }
}
