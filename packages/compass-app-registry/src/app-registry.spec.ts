import { expect } from 'chai';
import { AppRegistry } from './';

describe('AppRegistry', function () {
  describe('#emit', function () {
    let registry: AppRegistry;

    beforeEach(function () {
      registry = new AppRegistry();
    });

    it('emits the event', function (done) {
      registry.once('test-event', (value) => {
        expect(value).to.equal('test');
        done();
      });
      registry.emit('test-event', 'test');
    });
  });

  describe('#on', function () {
    let registry: AppRegistry;

    beforeEach(function () {
      registry = new AppRegistry();
    });

    it('subscribes to the event', function (done) {
      registry.on('test-event', (value) => {
        expect(value).to.equal('test');
        done();
      });
      registry.emit('test-event', 'test');
    });
  });

  describe('#once', function () {
    let registry: AppRegistry;

    beforeEach(function () {
      registry = new AppRegistry();
    });

    it('subscribes to the event once', function (done) {
      registry.once('test-event', (value) => {
        expect(value).to.equal('test');
        done();
      });
      registry.emit('test-event', 'test');
    });
  });

  describe('#addListener', function () {
    let registry: AppRegistry;

    beforeEach(function () {
      registry = new AppRegistry();
    });

    it('adds the listener to the event', function (done) {
      registry.addListener('test-event', (value) => {
        expect(value).to.equal('test');
        done();
      });
      registry.emit('test-event', 'test');
    });
  });

  describe('#removeListener', function () {
    let registry: AppRegistry;
    const listener = () => {
      return true;
    };

    beforeEach(function () {
      registry = new AppRegistry();
      registry.addListener('test-event', listener);
    });

    it('removes the listener', function () {
      registry.removeListener('test-event', listener);
      expect(registry.listenerCount('test-event')).to.equal(0);
    });
  });

  describe('#removeAllListeners', function () {
    let registry: AppRegistry;
    const listenerOne = () => {
      return true;
    };
    const listenerTwo = () => {
      return true;
    };

    beforeEach(function () {
      registry = new AppRegistry();
      registry.addListener('test-event', listenerOne);
      registry.addListener('test-event', listenerTwo);
    });

    it('removes all the listeners', function () {
      registry.removeAllListeners('test-event');
      expect(registry.listenerCount('test-event')).to.equal(0);
    });
  });

  describe('#eventNames', function () {
    let registry: AppRegistry;

    beforeEach(function () {
      registry = new AppRegistry();
      registry.on('test-event', () => {
        return true;
      });
    });

    it('returns the names of all events', function () {
      expect(registry.eventNames()).to.deep.equal(['test-event']);
    });
  });

  describe('#listeners', function () {
    let registry: AppRegistry;
    const listenerOne = () => {
      return true;
    };
    const listenerTwo = () => {
      return true;
    };

    beforeEach(function () {
      registry = new AppRegistry();
      registry.addListener('test-event', listenerOne);
      registry.addListener('test-event', listenerTwo);
    });

    it('returns the listeners for the event', function () {
      expect(registry.listeners('test-event')).to.deep.equal([
        listenerOne,
        listenerTwo,
      ]);
    });
  });

  context('when freezing the app registry', function () {
    let registry: AppRegistry;

    beforeEach(function () {
      registry = Object.freeze(new AppRegistry());
    });

    context('when adding a listener', function () {
      const addListener = () => {
        registry.on('test', () => {
          return true;
        });
      };

      it('allows the edition', function () {
        expect(addListener).to.not.throw();
      });
    });
  });
});
