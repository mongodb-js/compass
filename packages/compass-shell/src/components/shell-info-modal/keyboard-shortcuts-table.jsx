import React from 'react';
import {
  Body,
  Description,
  Table,
  TableHeader,
  Row,
  Cell,
  KeyboardShortcut,
} from '@mongodb-js/compass-components';

const hotkeys = [
  {
    key: 'Ctrl+`',
    description: 'Toggle shell.',
  },
  {
    key: 'Ctrl+A',
    description: 'Moves the cursor to the beginning of the line.',
  },
  {
    key: 'Ctrl+B',
    description: 'Moves the cursor Backward one character.',
  },
  {
    key: 'Ctrl+C',
    description: 'Stop currently running command.',
  },
  {
    key: 'Ctrl+D',
    description: 'Deletes the next character.',
  },
  {
    key: 'Ctrl+E',
    description: 'Moves the cursor to the end of the line.',
  },
  {
    key: 'Ctrl+F',
    description: 'Moves the cursor Forward one character.',
  },
  {
    key: 'Ctrl+H',
    description: 'Erases one character, similar to hitting backspace.',
  },
  {
    key: 'mod+L',
    description: 'Clears the screen, similar to the clear command.',
  },
  {
    key: 'Ctrl+T',
    description: 'Swap the last two characters before the cursor.',
  },
  {
    key: 'Ctrl+U',
    description: 'Changes the line to Uppercase.',
  },
  {
    key: 'ArrowUp',
    description: 'Cycle backwards through command history.',
  },
  {
    key: 'ArrowDown',
    description: 'Cycle forwards through command history.',
  },
];

function KeyboardShortcutsTable() {
  return (
    <Table
      data={hotkeys}
      columns={[
        <TableHeader key={'name'} label="Key" />,
        <TableHeader key={'value'} label="Description" />,
      ]}
    >
      {({ datum }) => (
        <Row key={datum.key}>
          <Cell>
            <Body weight="medium">
              <KeyboardShortcut hotkey={datum.key} />
            </Body>
          </Cell>
          <Cell>
            <Description>{datum.description}</Description>
          </Cell>
        </Row>
      )}
    </Table>
  );
}

export { KeyboardShortcutsTable };
