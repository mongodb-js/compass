import { useContextMenuItems } from '../components/context-menu';
import { Element } from 'hadron-document';
import { objectToIdiomaticEJSON } from 'hadron-document';

// Helper function to check if a string is a URL
export const isValidUrl = (str: string): boolean => {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export interface useFieldContextMenuProps {
  element: Element | undefined | null;
  fieldName: string;
}

export function useFieldContextMenu({
  element,
  fieldName,
}: useFieldContextMenuProps) {
  return useContextMenuItems([
    ...(element
      ? [
          {
            label: 'Copy field & value',
            onAction: () => {
              const fieldStr = `${fieldName}: ${objectToIdiomaticEJSON(
                element.currentValue
              )}`;
              void navigator.clipboard.writeText(fieldStr);
            },
          },
          {
            label: 'Copy value',
            onAction: () => {
              const valueStr = objectToIdiomaticEJSON(element.currentValue);
              void navigator.clipboard.writeText(valueStr);
            },
          },
          ...(element.currentType === 'String' &&
          typeof element.currentValue === 'string' &&
          isValidUrl(element.currentValue)
            ? [
                {
                  label: 'Open URL in browser',
                  onAction: () => {
                    window.open(
                      element.currentValue as string,
                      '_blank',
                      'noopener'
                    );
                  },
                },
              ]
            : []),
        ]
      : []),
  ]);
}
