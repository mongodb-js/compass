import { bson, ServiceProvider, Topology } from '@mongosh/service-provider-core';
import { expect } from 'chai';
import { EventEmitter } from 'events';
import { StubbedInstance, stubInterface } from 'ts-sinon';
import { Context, createContext, runInContext } from 'vm';
import ShellInternalState, { EvaluationListener } from './shell-internal-state';

describe('ShellInternalState', () => {
  let internalState: ShellInternalState;
  let serviceProvider: StubbedInstance<ServiceProvider>;
  let evaluationListener: StubbedInstance<EvaluationListener>;
  let context: Context;
  let run: (source: string) => any;

  beforeEach(() => {
    serviceProvider = stubInterface<ServiceProvider>();
    serviceProvider.initialDb = 'test';
    serviceProvider.bsonLibrary = bson;
    serviceProvider.getConnectionInfo.resolves({ extraInfo: { uri: 'mongodb://localhost/' } });
    evaluationListener = stubInterface<EvaluationListener>();
    internalState = new ShellInternalState(serviceProvider);
    context = createContext();
    internalState.setEvaluationListener(evaluationListener);
    internalState.setCtx(context);
    run = (source: string) => runInContext(source, context);
  });

  describe('context object', () => {
    it('provides printing ability for primitives', async() => {
      await run('print(42)');
      expect(evaluationListener.onPrint).to.have.been.calledWith(
        [{ printable: 42, rawValue: 42, type: null }]);
    });

    it('provides printing ability for shell API objects', async() => {
      await run('print(db)');
      expect(evaluationListener.onPrint.lastCall.args[0][0].type).to.equal('Database');
    });

    it('provides printing ability via console methods', async() => {
      await run('console.log(42)');
      expect(evaluationListener.onPrint).to.have.been.calledWith(
        [{ printable: 42, rawValue: 42, type: null }]);
    });

    it('throws when setting db to a non-db thing', async() => {
      expect(() => run('db = 42')).to.throw("[COMMON-10002] Cannot reassign 'db' to non-Database type");
    });

    it('allows setting db to a db and causes prefetching', async() => {
      serviceProvider.listCollections
        .resolves([ { name: 'coll1' }, { name: 'coll2' } ]);
      expect(run('db = db.getSiblingDB("moo"); db.getName()')).to.equal('moo');
      expect(serviceProvider.listCollections.calledWith('moo', {}, {
        readPreference: 'primaryPreferred',
        nameOnly: true
      })).to.equal(true);
    });
  });

  describe('default prompt', () => {
    const setupServiceProviderWithTopology = (topology: Topology) => {
      serviceProvider.getConnectionInfo.resolves({ extraInfo: { uri: 'mongodb://localhost/' } });
      serviceProvider.getTopology.returns(topology);
    };

    it('returns the default if nodb', async() => {
      serviceProvider = stubInterface<ServiceProvider>();
      serviceProvider.initialDb = 'test';
      serviceProvider.bsonLibrary = bson;
      serviceProvider.getConnectionInfo.resolves({ extraInfo: { uri: 'mongodb://localhost/' } });
      internalState = new ShellInternalState(serviceProvider, new EventEmitter(), { nodb: true });
      internalState.setEvaluationListener(evaluationListener);
      internalState.setCtx(context);
      run = (source: string) => runInContext(source, context);

      const prompt = await internalState.getDefaultPrompt();
      expect(prompt).to.equal('> ');
    });

    describe('Atlas Data Lake prefix', () => {
      it('inferred from extraInfo', async() => {
        serviceProvider.getConnectionInfo.resolves({
          extraInfo: {
            uri: 'mongodb://localhost/',
            is_data_lake: true
          }
        });

        await internalState.fetchConnectionInfo();
        const prompt = await internalState.getDefaultPrompt();
        expect(prompt).to.equal('Atlas Data Lake > ');
      });

      it('wins against enterprise', async() => {
        serviceProvider.getConnectionInfo.resolves({
          extraInfo: {
            uri: 'mongodb://localhost/',
            is_enterprise: true,
            is_data_lake: true
          }
        });

        await internalState.fetchConnectionInfo();
        const prompt = await internalState.getDefaultPrompt();
        expect(prompt).to.equal('Atlas Data Lake > ');
      });
    });

    describe('MongoDB Enterprise prefix', () => {
      it('inferred from extraInfo', async() => {
        serviceProvider.getConnectionInfo.resolves({ extraInfo: { uri: 'mongodb://localhost/', is_enterprise: true } });

        await internalState.fetchConnectionInfo();
        const prompt = await internalState.getDefaultPrompt();
        expect(prompt).to.equal('Enterprise > ');
      });

      it('inferred from buildInfo modules', async() => {
        serviceProvider.getConnectionInfo.resolves({
          extraInfo: { uri: 'mongodb://localhost/' },
          buildInfo: { modules: ['other', 'enterprise'] }
        });

        await internalState.fetchConnectionInfo();
        const prompt = await internalState.getDefaultPrompt();
        expect(prompt).to.equal('Enterprise > ');
      });
    });

    describe('direct connection = Single Topology', () => {
      // TODO: replace with proper ServerType.xxx - NODE-2973
      [
        { t: 'Mongos', p: 'mongos' },
        { t: 'RSArbiter', p: 'arbiter' },
        { t: 'RSOther', p: 'other' },
        { t: 'RSPrimary', p: 'primary' },
      ].forEach(({ t, p }) => {
        it(`takes the info from the single server [Server Type: ${t}]`, async() => {
          const servers = new Map();
          servers.set('localhost:30001', {
            address: 'localhost:30001',
            type: t,
            me: 'localhost:30001',
            hosts: [ 'localhost:30001' ],
            setName: 'configset'
          });
          const topology = {
            description: {
              // TODO: replace with TopologyType.Single - NODE-2973
              type: 'Single',
              setName: null, // This was observed behavior - the set was not updated even the single server had the set
              servers: servers
            }
          } as Topology;
          setupServiceProviderWithTopology(topology);

          const prompt = await internalState.getDefaultPrompt();
          expect(prompt).to.equal(`configset [direct: ${p}]> `);
        });
      });

      // TODO: replace with proper ServerType.xxx - NODE-2973
      [
        'RSGhost',
        'Standalone',
        'Unknown',
        'PossiblePrimary'
      ].forEach(t => {
        it(`defaults for server type [Server Type: ${t}]`, async() => {
          const servers = new Map();
          servers.set('localhost:30001', {
            address: 'localhost:30001',
            type: t,
            me: 'localhost:30001',
            hosts: [ 'localhost:30001' ]
          });
          const topology = {
            description: {
              // TODO: replace with TopologyType.Single - NODE-2973
              type: 'Single',
              setName: null,
              servers: servers
            }
          } as Topology;
          setupServiceProviderWithTopology(topology);

          const prompt = await internalState.getDefaultPrompt();
          expect(prompt).to.equal('> ');
        });
      });
    });

    describe('topology ReplicaSet...', () => {
      it('shows the setName and lacking primary hint for ReplicaSetNoPrimary', async() => {
        const topology = {
          description: {
            // TODO: replace with TopologyType.ReplicaSetNoPrimary - NODE-2973
            type: 'ReplicaSetNoPrimary',
            setName: 'leSet'
          }
        } as Topology;
        setupServiceProviderWithTopology(topology);

        const prompt = await internalState.getDefaultPrompt();
        expect(prompt).to.equal('leSet [secondary]> ');
      });

      it('shows the setName and primary hint for ReplicaSetWithPrimary', async() => {
        const topology = {
          description: {
            // TODO: replace with TopologyType.ReplicaSetWithPrimary - NODE-2973
            type: 'ReplicaSetWithPrimary',
            setName: 'leSet'
          }
        } as Topology;
        setupServiceProviderWithTopology(topology);

        const prompt = await internalState.getDefaultPrompt();
        expect(prompt).to.equal('leSet [primary]> ');
      });
    });

    describe('topology Sharded', () => {
      it('shows mongos without setName', async() => {
        const topology = {
          description: {
            // TODO: replace with TopologyType.Sharded - NODE-2973
            type: 'Sharded'
          }
        } as Topology;
        setupServiceProviderWithTopology(topology);

        const prompt = await internalState.getDefaultPrompt();
        expect(prompt).to.equal('[mongos]> ');
      });
      it('shows mongos and a setName', async() => {
        const topology = {
          description: {
            // TODO: replace with TopologyType.Sharded - NODE-2973
            type: 'Sharded',
            setName: 'leSet'
          }
        } as Topology;
        setupServiceProviderWithTopology(topology);

        const prompt = await internalState.getDefaultPrompt();
        expect(prompt).to.equal('leSet [mongos]> ');
      });
    });

    describe('topology Sharded but it’s Atlas', () => {
      it('shows atlas proxy identifier', async() => {
        serviceProvider.getTopology.returns({
          description: {
            type: 'Sharded'
          }
        });
        serviceProvider.getConnectionInfo.resolves({
          extraInfo: {
            uri: 'mongodb://localhost/',
            is_atlas: true,
            atlas_version: '20210330.0.0.1617063608'
          }
        });

        await internalState.fetchConnectionInfo();
        const prompt = await internalState.getDefaultPrompt();
        expect(prompt).to.equal('> ');
      });
    });

    describe('topology Unknown', () => {
      it('just shows the default prompt', async() => {
        const servers = new Map();
        servers.set('localhost:30001', {
          address: 'localhost:30001',
          // TODO: replace with ServerType.Unknown - NODE-2973
          type: 'Unknown',
          me: 'localhost:30001',
          hosts: [ 'localhost:30001' ]
        });
        const topology = {
          description: {
            // TODO: replace with TopologyType.Unknown - NODE-2973
            type: 'Unknown',
            setName: 'unknown',
            servers: servers
          }
        } as Topology;
        setupServiceProviderWithTopology(topology);

        const prompt = await internalState.getDefaultPrompt();
        expect(prompt).to.equal('> ');
      });
    });
  });
});
