import ansi from 'ansi-escape-sequences';

export type StyleDefinition = Parameters<typeof ansi.format>[1];

export default function colorize(text: string, style: StyleDefinition, options: { colors: boolean }): string {
  if (options.colors) {
    return ansi.format(text, style);
  }
  return text;
}

export function colorizeForStdout(text: string, style: StyleDefinition): string {
  return colorize(text, style, {
    colors: process.stdout.isTTY && process.stdout.getColorDepth() > 1 });
}

export function colorizeForStderr(text: string, style: StyleDefinition): string {
  return colorize(text, style, {
    colors: process.stderr.isTTY && process.stderr.getColorDepth() > 1 });
}
