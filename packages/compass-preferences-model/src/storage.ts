import { UUID } from 'bson';
import { storedUserPreferencesProps } from './preferences';
import { UserData, z } from '@mongodb-js/compass-user-data';

type PreferencesValidator = ReturnType<typeof getPreferencesValidator>;
export type StoredPreferences = z.output<PreferencesValidator>;

export const getDefaultPreferences = (): StoredPreferences => {
  return Object.fromEntries(
    Object.entries(storedUserPreferencesProps)
      .map(([key, value]) => [key, value.validator.parse(undefined)])
      .filter(([, value]) => value !== undefined)
  );
};

const getPreferencesValidator = () => {
  const preferencesPropsValidator = Object.fromEntries(
    Object.entries(storedUserPreferencesProps).map(([key, { validator }]) => [
      key,
      validator,
    ])
  ) as {
    [K in keyof typeof storedUserPreferencesProps]: typeof storedUserPreferencesProps[K]['validator'];
  };

  return z.object(preferencesPropsValidator);
};
export abstract class BasePreferencesStorage {
  abstract setup(): Promise<void>;
  abstract getPreferences(): StoredPreferences;
  abstract updatePreferences(
    attributes: Partial<StoredPreferences>
  ): Promise<void>;
}

export class SandboxPreferences extends BasePreferencesStorage {
  private preferences = getDefaultPreferences();
  constructor() {
    super();
  }

  getPreferences() {
    return this.preferences;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async updatePreferences(attributes: Partial<StoredPreferences>) {
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
  private readonly file = 'General';
  private readonly defaultPreferences = getDefaultPreferences();
  private readonly userData: UserData<PreferencesValidator>;
  private preferences: StoredPreferences = getDefaultPreferences();

  constructor(basePath?: string) {
    super();
    this.userData = new UserData(getPreferencesValidator(), {
      subdir: 'AppPreferences',
      basePath,
    });
  }

  async setup() {
    try {
      this.preferences = await this.readPreferences();
    } catch (e) {
      if (
        (e as any).code === 'ENOENT' || // First time user
        e instanceof SyntaxError // Invalid json
      ) {
        // Create the file for the first time
        await this.userData.write(this.file, this.defaultPreferences);
        return;
      }
      throw e;
    }
  }

  private async readPreferences(): Promise<StoredPreferences> {
    return await this.userData.readOne(this.file, {
      ignoreErrors: false,
    });
  }

  getPreferences(): StoredPreferences {
    return {
      ...this.defaultPreferences,
      ...this.preferences,
    };
  }

  async updatePreferences(attributes: Partial<z.input<PreferencesValidator>>) {
    await this.userData.write(this.file, {
      ...(await this.readPreferences()),
      ...attributes,
    });

    this.preferences = await this.readPreferences();
  }
}

const UserSchema = z.object({
  id: z.string().uuid(),
  createdAt: z
    .union([z.coerce.date(), z.number()])
    .transform((x) => new Date(x)),
  lastUsed: z
    .union([z.coerce.date(), z.number()])
    .transform((x) => new Date(x)),
});

export type User = z.output<typeof UserSchema>;

export class UserStorage {
  private readonly userData: UserData<typeof UserSchema>;
  constructor(basePath?: string) {
    this.userData = new UserData(UserSchema, {
      subdir: 'Users',
      basePath,
    });
  }

  async getOrCreate(id?: string): Promise<User> {
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
    return await this.userData.readOne(id, {
      ignoreErrors: false,
    });
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

  async updateUser(
    id: string,
    attributes: Partial<z.input<typeof UserSchema>>
  ): Promise<User> {
    const user = await this.getUser(id);
    const newData = {
      ...user,
      ...attributes,
    };
    return this.writeUser(newData);
  }

  private async writeUser(user: z.input<typeof UserSchema>): Promise<User> {
    await this.userData.write(user.id, user);
    return this.getUser(user.id);
  }

  private getFileName(id: string) {
    return `${id}.json`;
  }
}
