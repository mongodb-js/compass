import { promises as fs } from 'fs';
import { join } from 'path';
import type { UserPreferences } from './preferences';

export abstract class BasePreferencesStorage {
  read() {
    return this.getPreferences();
  }

  async update(attributes: Partial<UserPreferences>) {
    await this.updatePreferences(attributes);
  }

  abstract setup(): Promise<void>;
  protected abstract getPreferences(): UserPreferences;
  protected abstract updatePreferences(
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
      this.preferences = JSON.parse(
        (await fs.readFile(this.getFilePath())).toString()
      );
    } catch (e) {
      if ((e as any).code !== 'ENOENT') {
        throw e;
      }
      // Create the file for the first time
      await fs.writeFile(
        this.getFilePath(),
        JSON.stringify(this.defaultPreferences, null, 2)
      );
    }
  }

  getPreferences() {
    return this.preferences;
  }

  async updatePreferences(attributes: Partial<UserPreferences>) {
    const newPreferences = {
      ...this.preferences,
      ...attributes,
    };
    await fs.writeFile(
      this.getFilePath(),
      JSON.stringify(newPreferences, null, 2)
    );

    this.preferences = newPreferences;
  }
}
