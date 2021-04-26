import { boolean, number, withKnobs } from '@storybook/addon-knobs';
import React, { useEffect } from 'react';
import { IframeRuntime } from './iframe-runtime';
import { Shell } from './index';


export default {
  title: 'Shell',
  component: Shell,
  decorators: [withKnobs]
};


const delay = (msecs: number): Promise<void> => new Promise((resolve) => {
  setTimeout(resolve, msecs);
});

class DemoServiceProvider {
  async buildInfo(): Promise<object> {
    return { version: '4.0.0', modules: ['other', 'enterprise'] };
  }

  async getConnectionInfo(): Promise<object> {
    return {
      buildInfo: await this.buildInfo(),
      extraInfo: {
        uri: 'mongodb://localhost/'
      }
    };
  }

  getTopology(): object {
    return {
      description: {
        type: 'ReplicaSetWithPrimary',
        setName: 'replset'
      }
    };
  }

  async listDatabases(): Promise<any> {
    await delay(2000);

    return {
      databases: [
        { name: 'db1', sizeOnDisk: 10000, empty: false },
        { name: 'db2', sizeOnDisk: 20000, empty: false },
        { name: 'db-with-long-name', sizeOnDisk: 30000, empty: false },
        { name: '500mb', sizeOnDisk: 500000000, empty: false },
      ],
      totalSize: 50000,
      ok: 1
    };
  }

  async stats(): Promise<any> {
    return { size: 1000 };
  }
}

const runtime = new IframeRuntime(new DemoServiceProvider() as any);

export const IframeRuntimeExample: React.FunctionComponent = () => {
  useEffect(() => {
    runtime.initialize();

    return (): void => {
      runtime.destroy();
    };
  }, []);

  return (<div style={{ height: '240px' }}><Shell runtime={runtime}
    redactInfo={boolean('redactInfo', false)}
    maxHistoryLength={number('maxHistoryLength', 1000)}
    maxOutputLength={number('maxOutputLength', 1000)}
    initialHistory={[
      'show dbs',
      'db.coll.stats()',
      '{x: 1, y: {z: 2}, k: [1, 2, 3]}'
    ]}
  /></div>);
};
