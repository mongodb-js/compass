import { SpawnOptions } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';

export class mockSpawn extends EventEmitter {
  public stdout = new EventEmitter();
  public stderr = new EventEmitter();

  constructor(name: string, private readonly args: Array<string> = [], options: any = {}, public readonly fs: any) {
    super();

    if (name === 'candle.exe' && args && options && !this.contains('fail-candle')) {
      this.beCandle();
    }

    if (name === 'light.exe' && args && options && !this.contains('fail-light')) {
      this.beLight();
    }

    setImmediate(() => {
      this.stderr.emit('data', 'A bit of error');
      this.stdout.emit('data', 'A bit of data');

      setImmediate(() => {
        const code = this.contains('fail-code') ? 1 : 0;
        this.emit('close', code);
      });
    });
  }

  private beCandle() {
    const filepath = this.args[this.args.length - 1];
    const target = path.join(path.dirname(filepath), `${path.basename(filepath, '.wxs')}.wixobj`);
    this.fs.writeFileSync(target, 'hi', 'utf-8');
  }

  private beLight() {
    const filepath = this.args[this.args.length - 1];
    const target = path.join(path.dirname(filepath), `${path.basename(filepath, '.wixobj')}.msi`);
    this.fs.writeFileSync(target, 'hi', 'utf-8');
  }

  private contains(name: string): boolean {
    return !!this.args.find((e) => e && e.includes && e.includes(name));
  }
}
