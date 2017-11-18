import { SpawnOptions } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';

export class mockSpawn extends EventEmitter {
  public stdout = new EventEmitter();
  public stderr = new EventEmitter();

  constructor(name: string, args: Array<string> = [], options: any = {}, fs: any) {
    super();

    if (name === 'candle.exe' && args && options) {
      this.beCandle(args, fs);
    }

    if (name === 'light.exe' && args && options) {
      this.beLight(args, fs);
    }

    setImmediate(() => {
      this.stderr.emit('data', 'A bit of error');
      this.stdout.emit('data', 'A bit of data');

      setImmediate(() => {
        const code = args.find((e) => e && e.includes && e.includes('fail'))
          ? 1
          : 0;
        this.emit('close', code);
      });
    });
  }

  private beCandle([ filepath ]: Array<string>, fs: any) {
    const target = path.join(path.dirname(filepath), `${path.basename(filepath, '.wxs')}.wixobj`);
    fs.writeFileSync(target, 'hi', 'utf-8');
  }

  private beLight(args: Array<string>, fs: any) {
    const filepath = args[args.length - 1];
    const target = path.join(path.dirname(filepath), `${path.basename(filepath, '.wixobj')}.msi`);
    fs.writeFileSync(target, 'hi', 'utf-8');
  }
}
