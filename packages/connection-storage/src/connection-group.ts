import { z } from '@mongodb-js/compass-user-data';

export interface ConnectionGroup {
  id: string;
  name: string;
  /** ColorCode ('color1'..'color10'), same palette as favorite.color on connections. */
  color?: string;
}

export const ConnectionGroupSchema: z.Schema<ConnectionGroup> = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    color: z.string().optional(),
  })
  .passthrough();
