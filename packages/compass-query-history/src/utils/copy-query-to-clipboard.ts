import type { QueryModelType } from '../models/query';
import formatQuery from './format-query';

export function copyQueryToClipboard(query: QueryModelType) {
  const attributes = query.getAttributes({ props: true });

  Object.keys(attributes)
    .filter((key) => key.charAt(0) === '_')
    .forEach((key) => delete attributes[key as keyof typeof attributes]);

  navigator.clipboard.writeText(formatQuery(attributes));
}
