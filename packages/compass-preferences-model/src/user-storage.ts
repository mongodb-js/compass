import { z, UserData } from '@mongodb-js/compass-user-data';
import { createLocalUserDataFetch } from '@mongodb-js/compass-user-data/local';
import { UUID } from 'bson';

const UserSchema = z.object({
  id: z.uuid(),
  createdAt: z
    .union([z.coerce.date(), z.number()])
    .transform((x) => new Date(x)),
  lastUsed: z
    .union([z.coerce.date(), z.number()])
    .transform((x) => new Date(x)),
});

export type User = z.output<typeof UserSchema>;

export interface UserStorage {
  getOrCreate(id?: string): Promise<User>;
  getUser(id: string): Promise<User>;
  updateUser(
    id: string,
    attributes: Partial<z.input<typeof UserSchema>>
  ): Promise<User>;
}

export class UserStorageImpl implements UserStorage {
  private readonly userData: UserData<typeof UserSchema, 'Users'>;
  constructor(basePath?: string) {
    this.userData = new UserData(UserSchema, 'Users', {
      kind: 'local',
      fetch: createLocalUserDataFetch({ basePath }),
    });
  }

  async getOrCreate(id?: string): Promise<User> {
    if (!id) {
      return this.createUser();
    }

    return (await this.readUser(id)) ?? (await this.createUser());
  }

  private async readUser(id: string): Promise<User | undefined> {
    return await this.userData.readOne(id, {
      ignoreErrors: false,
    });
  }

  async getUser(id: string): Promise<User> {
    const user = await this.readUser(id);
    if (!user) {
      throw new Error(`User ${id} does not exist`);
    }
    return user;
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
}
