import { UUID } from 'bson';
import { promises as fs } from 'fs';
import { pick } from 'lodash';
import { join } from 'path';
import type { UserPreferences } from './preferences';
import { allPreferencesProps } from './preferences';

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
  private readonly folder = 'AppPreferences';
  private readonly file = 'General.json';
  private readonly defaultPreferences: UserPreferences;

  constructor(private preferences: UserPreferences, private basepath?: string) {
    super();
    this.defaultPreferences = preferences;
  }

  private getFolderPath() {
    return join(this.basepath ?? '', this.folder);
  }

  private getFilePath() {
    return join(this.getFolderPath(), this.file);
  }

  async setup() {
    // Ensure folder exists
    await fs.mkdir(this.getFolderPath(), { recursive: true });

    try {
      this.preferences = await this.readPreferences();
    } catch (e) {
      if ((e as any).code !== 'ENOENT') {
        throw e;
      }
      // Create the file for the first time
      await fs.writeFile(
        this.getFilePath(),
        JSON.stringify(this.defaultPreferences, null, 2),
        'utf-8'
      );
    }
  }

  private async readPreferences(): Promise<UserPreferences> {
    const preferences = JSON.parse(
      await fs.readFile(this.getFilePath(), 'utf8')
    );

    // Exclude old and renamed preferences so we don't try and save those back.
    // (This is still technically a lie because we could only have a subset of
    // UserPreferences. ie. imagine a JSON file that has an empty object. Or
    // that was saved with the previous version of compass where we had fewer
    // settings.)
    return pick(
      preferences,
      Object.keys(allPreferencesProps)
    ) as UserPreferences;
  }

  getPreferences() {
    return this.preferences;
  }

  async updatePreferences(attributes: Partial<UserPreferences>) {
    const newPreferences = {
      ...(await this.readPreferences()),
      ...attributes,
    };
    await fs.writeFile(
      this.getFilePath(),
      JSON.stringify(newPreferences, null, 2),
      'utf-8'
    );

    this.preferences = newPreferences;
  }
}

export type User = {
  id: string;
  createdAt: Date;
  lastUsed: Date;
};

export class UserStorage {
  private readonly folder = 'Users';
  constructor(private readonly basepath: string = '') {}

  private getFolderPath() {
    return join(this.basepath, this.folder);
  }

  private getFilePath(id: string) {
    return join(this.getFolderPath(), `${id}.json`);
  }

  async getOrCreate(id: string): Promise<User> {
    // Ensure folder exists
    await fs.mkdir(this.getFolderPath(), { recursive: true });

    if (!id) {
      return this.createUser();
    }

    try {
      return await this.getUser(id);
    } catch (e) {
      if ((e as any).code !== 'ENOENT') {
        throw e;
      }
      return this.createUser();
    }
  }

  async getUser(id: string): Promise<User> {
    const user = JSON.parse(await fs.readFile(this.getFilePath(id), 'utf-8'));
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
    await fs.writeFile(
      this.getFilePath(user.id),
      JSON.stringify(user, null, 2),
      'utf-8'
    );
    return this.getUser(user.id);
  }
}
