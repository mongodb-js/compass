import * as path from 'path';
import * as fs from 'fs-extra';

export const root = 'C:/Users/tester/Code/app';
export const numberOfFiles = 14;

const staticDir = path.join(__dirname, '../../static').replace(/\\/, '/');
const staticContent = {};
staticContent[staticDir] = {};

fs.readdirSync(staticDir)
  .forEach((file) => {
    staticContent[staticDir][file] = fs.readFileSync(path.join(staticDir, file), 'utf-8');
  });

export function getMockFileSystem() {
  const mockFiles = {
    locales: {
      'am.pak': '',
      'en-GB.pak': '',
      'de.pak': ''
    },
    resources: {
      'app.asar.unpacked': {
        'node_modules': {
          '@nodert-win10': {
            'windows.foundation': {
              'build': {
                'Release': {
                  'binding.node': 'hi'
                }
              }
            },
            'windows.data.xml.dom': {
              'build': {
                'Release': {
                  'binding.node': 'hi'
                }
              }
            }
          }
        },
        'src': {
          'static': {
            'ssb-interop.js': 'hi'
          }
        }
      },
      'app.asar': 'hi',
      'electron.asar': 'hi'
    },
    'api-ms-win-core-console-l1-1-0.dll': 'hi',
    'ffmpeg.dll': 'hi',
    'content_shell.pck': 'hi',
    'slack.exe': 'hi',
    'LICENSE': 'hi',
    'node.dll': 'hi'
  }

  const system = {};
  system[root] = mockFiles;

  // Add files needed by this module:
  return { ...system, ...staticContent };
}

