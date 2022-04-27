import { expect } from 'chai';
import Instance from './model';

describe('Instance', function () {
  it('should be in initial state when created', function () {
    const instance = new Instance({ _id: 'abc' });
    expect(instance).to.have.property('status', 'initial');
    expect(instance.build.toJSON()).to.be.an('object').that.is.empty;
    expect(instance.host.toJSON()).to.be.an('object').that.is.empty;
  });
  context('with mocked dataService', function () {
    const dataService = {
      instance() {
        // eslint-disable-next-line mocha/no-setup-in-describe
        return Promise.resolve({
          build: { version: '1.2.3' },
          host: { arch: 'x64' },
          genuineMongoDB: { isGenuine: true },
          dataLake: { isDataLake: false },
        });
      },
    };

    it('should fetch and populate instance info when fetch called', async function () {
      const instance = new Instance({ _id: 'abc' });

      await instance.fetch({ dataService });

      expect(instance).to.have.nested.property('build.version', '1.2.3');
      expect(instance).to.have.nested.property('host.arch', 'x64');
      expect(instance).to.have.nested.property(
        'genuineMongoDB.isGenuine',
        true
      );
      expect(instance).to.have.nested.property('dataLake.isDataLake', false);
    });
  });
});
