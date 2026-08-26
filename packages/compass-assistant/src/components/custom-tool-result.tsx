import {
  Card,
  css,
  cx,
  Link,
  palette,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { mapAtlasConnectionDebugResult } from '../tool-result-mapper';
import type { ToolResultField, ToolResultFields } from '../tool-result-mapper';
import { isDebuggerToolCall } from '../utils';
import React from 'react';
import type { AtlasConnectionDebugResult } from '@mongodb-js/compass-generative-ai/provider';

const cardStyles = css({
  borderRadius: spacing[200],
  borderColor: palette.gray.light2,
});

const cardStylesDarkMode = css({
  borderColor: palette.gray.dark2,
});

const gridStyle = css({
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  columnGap: '16px',
  marginTop: '10px',
});

const titleStyle = css({
  fontWeight: 'bold',
});

const rowStyle = css({
  paddingTop: '5px',
});

const leftStyle = css({
  textAlign: 'left',
  fontWeight: 'bold',
});

const rightStyle = css({
  textAlign: 'right',
});

function hasCustomToolResult(toolType: string): boolean {
  return isDebuggerToolCall(toolType);
}

function getToolResultFields(
  toolType: string,
  output: unknown
): ToolResultFields {
  if (isDebuggerToolCall(toolType)) {
    return mapAtlasConnectionDebugResult(output as AtlasConnectionDebugResult);
  }
  return [];
}

function FieldValue({ field }: { field: ToolResultField }) {
  switch (field.type) {
    case 'link':
      return <Link href={field.href}>{field.value}</Link>;
    case 'text':
      return <>{field.value}</>;
  }
}

export const CustomToolResult: React.FC<{
  title: string;
  toolType: string;
  output: unknown;
}> = ({ title, toolType, output }) => {
  const darkMode = useDarkMode();
  const fields = React.useMemo(
    () => getToolResultFields(toolType, output),
    [toolType, output]
  );

  if (!output || !hasCustomToolResult(toolType)) {
    return null;
  }

  return (
    <Card
      className={cx(cardStyles, {
        [cardStylesDarkMode]: darkMode,
      })}
      darkMode={darkMode}
    >
      <div>
        <span className={titleStyle}>{title}</span>
        <div className={gridStyle}>
          {fields.map((field) => (
            <React.Fragment key={field.label}>
              <span className={cx(rowStyle, leftStyle)}>{field.label}</span>
              <span className={cx(rowStyle, rightStyle)}>
                <FieldValue field={field} />
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </Card>
  );
};
