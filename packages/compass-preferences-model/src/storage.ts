import { promises as fs } from 'fs';
import { join } from 'path';
import type { UserPreferences } from './preferences';

const ENCODING_UTF8 = 'utf8';

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
    await fs.mkdir(this.getFolderPath(), { recursive: true });

    try {
      await fs.access(this.getFilePath());
    } catch (e) {
      if ((e as any).code !== 'ENOENT') {
        throw e;
      }
      await fs.writeFile(
        this.getFilePath(),
        JSON.stringify(this.defaultPreferences, null, 2)
      );
    }
  }

  getPreferences() {
    return this.preferences;
  }

  async updatePreferences(attributes: Partial<UserPreferences>): Promise<void> {
    const newPreferences = {
      ...this.preferences,
      ...attributes,
    };
    await fs.writeFile(
      this.getFilePath(),
      JSON.stringify(newPreferences, null, 2),
      ENCODING_UTF8
    );

    this.preferences = newPreferences;
  }
}
