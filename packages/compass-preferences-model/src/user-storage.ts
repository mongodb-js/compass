import { z } from '@mongodb-js/compass-user-data';
import { UUID } from 'bson';
import { FileUserData } from '@mongodb-js/compass-user-data';

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

export interface UserStorage {
  getOrCreate(id?: string): Promise<User>;
  getUser(id: string): Promise<User>;
  updateUser(
    id: string,
    attributes: Partial<z.input<typeof UserSchema>>
  ): Promise<User>;
}

export class UserStorageImpl implements UserStorage {
  private readonly userData: FileUserData<typeof UserSchema>;
  constructor(basePath?: string) {
    this.userData = new FileUserData(UserSchema, {
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
