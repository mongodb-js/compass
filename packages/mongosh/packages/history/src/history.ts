import redactInfo from 'mongodb-redact';

export const HIDDEN_COMMANDS = String.raw `\b(createUser|auth|updateUser|changeUserPassword|connect|Mongo)\b`;

export function removeCommand(history: string, redact = false): string {
  if (redact) {
    return redactInfo(history);
  }
  return history;
}

/**
 * Modifies the history based on sensitive information.
 * If redact option is passed, also redacts sensitive info.
 *
 * @param {String} history - Command string.
 * @param {boolean} redact - Option to redact sensitive info.
 */
export function changeHistory(history: string[], redact = false): void {
  const hiddenCommands = new RegExp(HIDDEN_COMMANDS, 'g');

  if (hiddenCommands.test(history[0])) {
    history.shift();
  } else {
    history[0] = removeCommand(history[0], redact);
  }
}
