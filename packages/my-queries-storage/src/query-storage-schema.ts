import { z } from '@mongodb-js/compass-user-data';

const queryProps = {
  filter: z.any().optional(),
  project: z.any().optional(),
  collation: z.any().optional(),
  sort: z.any().optional(),
  skip: z.number().optional(),
  limit: z.number().optional(),
  update: z.any().optional(),
  hint: z.any().optional(),
};

const commonMetadata = {
  _id: z.string().uuid(),
  _lastExecuted: z
    .union([z.coerce.date(), z.number()])
    .transform((x) => new Date(x)),
  _ns: z.string(),
  _host: z.string().optional(),
};

export const RecentQuerySchema = z.object({
  ...queryProps,
  ...commonMetadata,
});

export const FavoriteQuerySchema = z.object({
  ...queryProps,
  ...commonMetadata,
  _name: z.string().nonempty(),
  _dateModified: z
    .union([z.coerce.date(), z.number()])
    .optional()
    .transform((x) => (x !== undefined ? new Date(x) : x)),
  _dateSaved: z
    .union([z.coerce.date(), z.number()])
    .transform((x) => new Date(x)),
});

export type RecentQuery = z.output<typeof RecentQuerySchema>;

export type FavoriteQuery = z.output<typeof FavoriteQuerySchema>;
