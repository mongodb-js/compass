import fs from 'fs';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';

export function toCommonJsExternal(deps: string[]): Record<string, string> {
  return Object.fromEntries(
    deps.map((depName) => [depName, `commonjs2 ${depName}`])
  );
}

type SimpleEntry = string | string[] | Record<string, string>;

export function entriesToNamedEntries(
  entry: SimpleEntry
): Record<string, string> {
  return typeof entry === 'string'
    ? { [path.basename(entry).replace(/\.(jsx?|tsx?)$/, '')]: entry }
    : Array.isArray(entry)
    ? Object.fromEntries(
        entry.map((entryPath) => [
          path.basename(entryPath).replace(/\.(jsx?|tsx?)$/, ''),
          entryPath,
        ])
      )
    : entry;
}

export function entriesToHtml(
  entries: Record<string, string>
): HtmlWebpackPlugin[] {
  return Array.from(
    Object.entries(entries).map(([name, entryPath]) => {
      let template = 'auto';

      for (const ext of ['.html', '.ejs']) {
        try {
          const maybeTemplatePath = entryPath.replace(/\.(jsx?|tsx?)$/, ext);
          fs.statSync(maybeTemplatePath);
          template = maybeTemplatePath;
          break;
        } catch (e) {
          // ignore and use default template, electron renderer entry will need
          // at least some kind of html page provided one way or the other
        }
      }

      return new HtmlWebpackPlugin({
        filename: `${name}.html`,
        template,
        chunks: [name],
      });
    })
  );
}

export function camelCase(str: string): string {
  return str
    .split(/[\W_]+/)
    .filter(Boolean)
    .map(([first, ...word]: string) => first.toUpperCase() + word.join(''))
    .join('');
}

export function getLibraryNameFromCwd(cwd: string): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { name, productName } = require(path.join(cwd, 'package.json')) as {
    name: string;
    productName: string;
  };
  return camelCase(productName || name);
}
