import { useTranslation } from '@mongodb-js/compass-components';

export function useItemTypeLabel(itemType: string): string {
  const t = useTranslation();
  switch (itemType) {
    case 'query':
      return t('savedQueries.itemType.query', 'query');
    case 'aggregation':
      return t('savedQueries.itemType.aggregation', 'aggregation');
    default:
      return itemType;
  }
}
