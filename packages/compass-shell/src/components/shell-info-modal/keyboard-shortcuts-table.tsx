import React from 'react';
import {
  Body,
  Description,
  Table,
  TableHead,
  TableBody,
  HeaderCell,
  HeaderRow,
  Row,
  Cell,
  KeyboardShortcut,
  useTranslation,
} from '@mongodb-js/compass-components';

const hotkeys = [
  {
    key: 'Ctrl+A',
    descriptionKey: 'connections.shell.hotkey.moveToLineStart',
    description: 'Moves the cursor to the beginning of the line.',
  },
  {
    key: 'Ctrl+B',
    descriptionKey: 'connections.shell.hotkey.moveBack',
    description: 'Moves the cursor Backward one character.',
  },
  {
    key: 'Ctrl+C',
    descriptionKey: 'connections.shell.hotkey.stop',
    description: 'Stop currently running command.',
  },
  {
    key: 'Ctrl+D',
    descriptionKey: 'connections.shell.hotkey.deleteNext',
    description: 'Deletes the next character.',
  },
  {
    key: 'Ctrl+E',
    descriptionKey: 'connections.shell.hotkey.moveToLineEnd',
    description: 'Moves the cursor to the end of the line.',
  },
  {
    key: 'Ctrl+F',
    descriptionKey: 'connections.shell.hotkey.moveForward',
    description: 'Moves the cursor Forward one character.',
  },
  {
    key: 'Ctrl+H',
    descriptionKey: 'connections.shell.hotkey.erase',
    description: 'Erases one character, similar to hitting backspace.',
  },
  {
    key: 'mod+L',
    descriptionKey: 'connections.shell.hotkey.clear',
    description: 'Clears the screen, similar to the clear command.',
  },
  {
    key: 'Ctrl+T',
    descriptionKey: 'connections.shell.hotkey.swap',
    description: 'Swap the last two characters before the cursor.',
  },
  {
    key: 'Ctrl+U',
    descriptionKey: 'connections.shell.hotkey.uppercase',
    description: 'Changes the line to Uppercase.',
  },
  {
    key: 'ArrowUp',
    descriptionKey: 'connections.shell.hotkey.historyBack',
    description: 'Cycle backwards through command history.',
  },
  {
    key: 'ArrowDown',
    descriptionKey: 'connections.shell.hotkey.historyForward',
    description: 'Cycle forwards through command history.',
  },
];

function KeyboardShortcutsTable() {
  const t = useTranslation();
  return (
    <Table shouldAlternateRowColor>
      <TableHead>
        <HeaderRow>
          <HeaderCell key="name">
            {t('connections.shell.keyColumn', 'Key')}
          </HeaderCell>
          <HeaderCell key="value">
            {t('connections.shell.descriptionColumn', 'Description')}
          </HeaderCell>
        </HeaderRow>
      </TableHead>
      <TableBody>
        {hotkeys.map((hotkey) => (
          <Row key={hotkey.key}>
            <Cell>
              <Body weight="medium">
                <KeyboardShortcut hotkey={hotkey.key} />
              </Body>
            </Cell>
            <Cell>
              <Description>
                {t(hotkey.descriptionKey, hotkey.description)}
              </Description>
            </Cell>
          </Row>
        ))}
      </TableBody>
    </Table>
  );
}

export { KeyboardShortcutsTable };
