// // // eslint-disable-next-line @typescript-eslint/no-var-requires
// // const mock = require('mock-require');

// // function mockedTopologyDescription(
// //   topologyType = 'Standalone',
// //   serverType = 'Single'
// // ) {
// //   return {
// //     type: topologyType,
// //     servers: new Map([['127.0.0.1:27017', { type: serverType }]]),
// //   };
// // }

// // /*
// //  * pretends to be a connection-model providing every function call
// //  * required in NativeClient#connect, but returns topology and connection
// //  * params of our choice
// //  */
// // function connectMongoClientMock(
// //   topologyDescription?: any,
// //   connectionOptions?: any
// // ) {
// //   const _topologyDescription =
// //     topologyDescription || mockedTopologyDescription();

// //   const _connectionOptions = connectionOptions || {
// //     url: 'mongodb://127.0.0.1:27018/data-service?readPreference=primary&ssl=false',
// //     options: {
// //       readPreference: 'primary',
// //       useNewUrlParser: true,
// //       useUnifiedTopology: true,
// //     },
// //   };

// //   const mockedTunnel = {
// //     close() {
// //       return Promise.resolve();
// //     },
// //   };

// //   return function (_model: any, setupListeners: any, cb: any) {
// //     const mockedClient = new EventEmitter() as any;
// //     mockedClient.db = () => {
// //       // pass
// //     };
// //     mockedClient.close = (
// //       _force: any,
// //       closeCb: Callback<void>
// //     ): Promise<void> => {
// //       if (closeCb) {
// //         closeCb(null);
// //       }
// //       return Promise.resolve();
// //     };
// //     setupListeners(mockedClient);
// //     mockedClient.emit('topologyDescriptionChanged', {
// //       newDescription: _topologyDescription,
// //     });

// //     return Promise.resolve([mockedClient, mockedTunnel, _connectionOptions]);
// //   };
// // }

// describe('#connect', function () {
//   context('when mocking connection-model', function () {
//     after(function () {
//       mock.stop('mongodb-connection-model');
//     });

//     it('sets .connectionOptions after successful connection', async function () {
//       mock('./connect-mongo-client', connectMongoClientMock());

//       const MockedDataService = mock.reRequire('./data-service');
//       const mockedService: DataService = new MockedDataService(
//         connectionOptions
//       );

//       expect(mockedService.getMongoClientConnectionOptions()).to.be.undefined;

//       await mockedService.connect();
//       expect(mockedService.getMongoClientConnectionOptions()).to.deep.equal({
//         url: 'mongodb://127.0.0.1:27018/data-service?readPreference=primary&ssl=false',
//         options: {
//           readPreference: 'primary',
//           useNewUrlParser: true,
//           useUnifiedTopology: true,
//         },
//       });
//     });

//     it('sets .isMongos to true when topology is sharded', async function () {
//       mock(
//         './connect-mongo-client',
//         connectMongoClientMock(mockedTopologyDescription('Sharded'))
//       );

//       const MockedDataService = mock.reRequire('./data-service');
//       const mockedService: DataService = new MockedDataService(
//         connectionOptions
//       );

//       await mockedService.connect();
//       expect(mockedService.isMongos()).to.be.true;
//     });

//     it('sets .isMongos to false when topology is not sharded', async function () {
//       mock('./connect-mongo-client', connectMongoClientMock());

//       const MockedDataService = mock.reRequire('./data-service');
//       const mockedService: DataService = new MockedDataService(
//         connectionOptions
//       );

//       await mockedService.connect();
//       expect(mockedService.isMongos()).to.be.false;
//     });
//   });
// });

// describe('#disconnect', function () {
//   context('when mocking connection-model', function () {
//     after(function () {
//       mock.stop('mongodb-connection-model');
//     });

//     it('should close tunnel before calling disconnect callback', async function () {
//       mock('./connect-mongo-client', connectMongoClientMock());

//       const MockedDataService = mock.reRequire('./data-service');
//       const mockedService: DataService = new MockedDataService(
//         connectionOptions
//       );

//       await mockedService.connect();
//       const closeSpy = sandbox.spy((mockedService as any)._tunnel, 'close');
//       await mockedService.disconnect();
//       expect(closeSpy).to.have.been.calledOnce;
//     });
//   });
// });
