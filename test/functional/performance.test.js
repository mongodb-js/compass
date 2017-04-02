const { launchCompass, quitCompass} = require('./support/spectron-support');

describe('#rtss', function() {
  this.slow(30000);
  this.timeout(60000);
  let app = null;
  let client = null;

  before(function() {
    return launchCompass()
      .then(function(application) {
        app = application;
        client = application.client;
        return client.connectToCompass({ hostname: 'localhost', port: 27018 });
      });
  });

  after(function() {
    return quitCompass(app);
  });

  context('when viewing the performance view', function() {
    it('clicks the performance tab', function() {
      return client
      .clickPerformanceTab();
    });

    it('renders the operations graph inserts', function() {
      return client
        .getOperationsInserts()
        .should.eventually.equal('0');
    });

    it('renders the operations graph queries', function() {
      return client
        .getOperationsQueries()
        .should.eventually.equal('0');
    });

    it('renders the operations graph updates', function() {
      return client
        .getOperationsUpdates()
        .should.eventually.equal('0');
    });

    it('renders the operations graph deletes', function() {
      return client
        .getOperationsDeletes()
        .should.eventually.equal('0');
    });

    it('renders the operations graph deletes', function() {
      return client
        .getOperationsCommands()
        .should.eventually.not.equal(null);
    });

    it('renders the operations graph getmores', function() {
      return client
        .getOperationsGetMores()
        .should.eventually.equal('0');
    });

    it('renders the read/write active reads', function() {
      return client
        .getReadWriteActiveReads()
        .should.eventually.equal('0');
    });

    it('renders the read/write active writes', function() {
      return client
        .getReadWriteActiveWrites()
        .should.eventually.equal('0');
    });

    it('renders the read/write queued reads', function() {
      return client
        .getReadWriteQueuedReads()
        .should.eventually.equal('0');
    });

    it('renders the read/write queued writes', function() {
      return client
        .getReadWriteQueuedWrites()
        .should.eventually.equal('0');
    });

    it('renders the network bytes in', function() {
      return client
        .getNetworkBytesIn()
        .should.eventually.not.equal(null);
    });

    it('renders the network bytes out', function() {
      return client
        .getNetworkBytesOut()
        .should.eventually.not.equal(null);
    });

    it.skip('renders the network connections', function() {
      return client
        .getNetworkConnections()
        .should.eventually.be.at.least('3');
    });

    it('renders the memory vsize', function() {
      return client
        .getMemoryVSize()
        .should.eventually.not.equal(null);
    });

    it('renders the memory resident size', function() {
      return client
        .getMemoryResident()
        .should.eventually.not.equal(null);
    });

    it('renders the memory mapped size', function() {
      return client
        .getMemoryMapped()
        .should.eventually.not.equal(null);
    });

    it.skip('renders the slow operations #race', function() {
      return client
        .getSlowestOperations()
        .should.eventually.include('No Slow Operations');
    });

    context.skip('when pausing the performance tab #race', function() {
      it('pauses the performance tab', function() {
        return client
          .clickPerformancePauseButton()
          .getSlowestOperations()
          .should.eventually.include('No Slow Operations');
      });
    });
  });
});
