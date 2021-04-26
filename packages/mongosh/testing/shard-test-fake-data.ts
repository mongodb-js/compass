// A fake sharding cluster config database, fresh from real-world data.

export const makeFakeConfigDatabase = ({ UUID, Timestamp, MinKey, MaxKey, ObjectId }) => ({
  'mongos': [
    {
      _id: 'hostname:27017',
      advisoryHostFQDNs: [],
      mongoVersion: '4.4.1',
      ping: new Date('2020-12-09T11:20:40.078Z'),
      up: 85473,
      waiting: true
    }
  ],
  'version': [
    {
      _id: 1,
      minCompatibleVersion: 5,
      currentVersion: 6,
      clusterId: ObjectId("5fce1140579db766a1989ff9")
    }
  ],
  'shards': [
    {
      _id: 'shard01',
      host: 'shard01/localhost:27018,localhost:27019,localhost:27020',
      state: 1
    },
    {
      _id: 'shard02',
      host: 'shard02/localhost:27021,localhost:27022,localhost:27023',
      state: 1
    },
    {
      _id: 'shard03',
      host: 'shard03/localhost:27024,localhost:27025,localhost:27026',
      state: 1
    }
  ],
  'chunks': [
    {
      _id: ObjectId("5fce126c579db766a198a645"),
      lastmod: Timestamp(0, 2),
      lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce"),
      ns: 'config.system.sessions',
      min: { _id: MinKey() },
      max: { _id: { id: UUID("00400000-0000-0000-0000-000000000000") } },
      shard: 'shard03',
      history: [
        { validAfter: Timestamp(2048, 1607340653), shard: 'shard03' },
        { validAfter: Timestamp(5, 1607340652), shard: 'shard01' }
      ]
    },
    {
      _id: ObjectId("5fce126d579db766a198a663"),
      lastmod: Timestamp(0, 3),
      lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce"),
      ns: 'config.system.sessions',
      min: { _id: { id: UUID("00400000-0000-0000-0000-000000000000") } },
      max: { _id: { id: UUID("00800000-0000-0000-0000-000000000000") } },
      shard: 'shard02',
      history: [
        { validAfter: Timestamp(136, 1607340654), shard: 'shard02' },
        { validAfter: Timestamp(5, 1607340652), shard: 'shard01' }
      ]
    },
    {
      _id: ObjectId("5fce126d579db766a198a664"),
      lastmod: Timestamp(0, 4),
      lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce"),
      ns: 'config.system.sessions',
      min: { _id: { id: UUID("00800000-0000-0000-0000-000000000000") } },
      max: { _id: { id: UUID("00c00000-0000-0000-0000-000000000000") } },
      shard: 'shard03',
      history: [
        { validAfter: Timestamp(291, 1607340655), shard: 'shard03' },
        { validAfter: Timestamp(5, 1607340652), shard: 'shard01' }
      ]
    },
    {
      _id: ObjectId("5fce126d579db766a198a665"),
      lastmod: Timestamp(0, 5),
      lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce"),
      ns: 'config.system.sessions',
      min: { _id: { id: UUID("00c00000-0000-0000-0000-000000000000") } },
      max: { _id: { id: UUID("01000000-0000-0000-0000-000000000000") } },
      shard: 'shard02',
      history: [
        { validAfter: Timestamp(3, 1607340657), shard: 'shard02' },
        { validAfter: Timestamp(5, 1607340652), shard: 'shard01' }
      ]
    },
    {
      _id: ObjectId("5fce126d579db766a198a666"),
      lastmod: Timestamp(0, 6),
      lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce"),
      ns: 'config.system.sessions',
      min: { _id: { id: UUID("01000000-0000-0000-0000-000000000000") } },
      max: { _id: { id: UUID("01400000-0000-0000-0000-000000000000") } },
      shard: 'shard02',
      history: [
        { validAfter: Timestamp(10, 1607340658), shard: 'shard02' },
        { validAfter: Timestamp(5, 1607340652), shard: 'shard01' }
      ]
    },
    {
      _id: ObjectId("5fce126d579db766a198a667"),
      lastmod: Timestamp(0, 7),
      lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce"),
      ns: 'config.system.sessions',
      min: { _id: { id: UUID("01400000-0000-0000-0000-000000000000") } },
      max: { _id: { id: UUID("01800000-0000-0000-0000-000000000000") } },
      shard: 'shard03',
      history: [
        { validAfter: Timestamp(18, 1607340659), shard: 'shard03' },
        { validAfter: Timestamp(5, 1607340652), shard: 'shard01' }
      ]
    },
    {
      _id: ObjectId("5fce126d579db766a198a668"),
      lastmod: Timestamp(0, 8),
      lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce"),
      ns: 'config.system.sessions',
      min: { _id: { id: UUID("01800000-0000-0000-0000-000000000000") } },
      max: { _id: { id: UUID("01c00000-0000-0000-0000-000000000000") } },
      shard: 'shard02',
      history: [
        { validAfter: Timestamp(16, 1607340660), shard: 'shard02' },
        { validAfter: Timestamp(5, 1607340652), shard: 'shard01' }
      ]
    },
    {
      _id: ObjectId("5fce126d579db766a198a669"),
      lastmod: Timestamp(0, 9),
      lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce"),
      ns: 'config.system.sessions',
      min: { _id: { id: UUID("01c00000-0000-0000-0000-000000000000") } },
      max: { _id: { id: UUID("02000000-0000-0000-0000-000000000000") } },
      shard: 'shard03',
      history: [
        { validAfter: Timestamp(16, 1607340661), shard: 'shard03' },
        { validAfter: Timestamp(5, 1607340652), shard: 'shard01' }
      ]
    },
    {
      _id: ObjectId("5fce126d579db766a198a66a"),
      lastmod: Timestamp(0, 10),
      lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce"),
      ns: 'config.system.sessions',
      min: { _id: { id: UUID("02000000-0000-0000-0000-000000000000") } },
      max: { _id: { id: UUID("02400000-0000-0000-0000-000000000000") } },
      shard: 'shard03',
      history: [
        { validAfter: Timestamp(10, 1607340662), shard: 'shard03' },
        { validAfter: Timestamp(5, 1607340652), shard: 'shard01' }
      ]
    },
    {
      _id: ObjectId("5fce126d579db766a198a66b"),
      lastmod: Timestamp(0, 11),
      lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce"),
      ns: 'config.system.sessions',
      min: { _id: { id: UUID("02400000-0000-0000-0000-000000000000") } },
      max: { _id: { id: UUID("02800000-0000-0000-0000-000000000000") } },
      shard: 'shard02',
      history: [ { validAfter: Timestamp(19, 1607340663), shard: 'shard02' } ]
    },
    {
      _id: ObjectId("5fce126d579db766a198a66c"),
      lastmod: Timestamp(0, 12),
      lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce"),
      ns: 'config.system.sessions',
      min: { _id: { id: UUID("02800000-0000-0000-0000-000000000000") } },
      max: { _id: { id: UUID("02c00000-0000-0000-0000-000000000000") } },
      shard: 'shard03',
      history: [ { validAfter: Timestamp(19, 1607340664), shard: 'shard03' } ]
    },
    {
      _id: ObjectId("5fce126d579db766a198a66d"),
      lastmod: Timestamp(0, 13),
      lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce"),
      ns: 'config.system.sessions',
      min: { _id: { id: UUID("02c00000-0000-0000-0000-000000000000") } },
      max: { _id: { id: UUID("03000000-0000-0000-0000-000000000000") } },
      shard: 'shard02',
      history: [ { validAfter: Timestamp(16, 1607340665), shard: 'shard02' } ]
    },
    {
      _id: ObjectId("5fce126d579db766a198a66e"),
      lastmod: Timestamp(0, 14),
      lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce"),
      ns: 'config.system.sessions',
      min: { _id: { id: UUID("03000000-0000-0000-0000-000000000000") } },
      max: { _id: { id: UUID("03400000-0000-0000-0000-000000000000") } },
      shard: 'shard03',
      history: [ { validAfter: Timestamp(19, 1607340666), shard: 'shard03' } ]
    },
    {
      _id: ObjectId("5fce126d579db766a198a66f"),
      lastmod: Timestamp(0, 15),
      lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce"),
      ns: 'config.system.sessions',
      min: { _id: { id: UUID("03400000-0000-0000-0000-000000000000") } },
      max: { _id: { id: UUID("03800000-0000-0000-0000-000000000000") } },
      shard: 'shard02',
      history: [ { validAfter: Timestamp(16, 1607340668), shard: 'shard02' } ]
    },
    {
      _id: ObjectId("5fce126d579db766a198a670"),
      lastmod: Timestamp(0, 16),
      lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce"),
      ns: 'config.system.sessions',
      min: { _id: { id: UUID("03800000-0000-0000-0000-000000000000") } },
      max: { _id: { id: UUID("03c00000-0000-0000-0000-000000000000") } },
      shard: 'shard02',
      history: [ { validAfter: Timestamp(10, 1607340669), shard: 'shard02' } ]
    },
    {
      _id: ObjectId("5fce126d579db766a198a671"),
      lastmod: Timestamp(0, 17),
      lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce"),
      ns: 'config.system.sessions',
      min: { _id: { id: UUID("03c00000-0000-0000-0000-000000000000") } },
      max: { _id: { id: UUID("04000000-0000-0000-0000-000000000000") } },
      shard: 'shard03',
      history: [ { validAfter: Timestamp(18, 1607340670), shard: 'shard03' } ]
    },
    {
      _id: ObjectId("5fce126d579db766a198a672"),
      lastmod: Timestamp(0, 18),
      lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce"),
      ns: 'config.system.sessions',
      min: { _id: { id: UUID("04000000-0000-0000-0000-000000000000") } },
      max: { _id: { id: UUID("04400000-0000-0000-0000-000000000000") } },
      shard: 'shard03',
      history: [ { validAfter: Timestamp(10, 1607340671), shard: 'shard03' } ]
    },
    {
      _id: ObjectId("5fce126d579db766a198a673"),
      lastmod: Timestamp(0, 19),
      lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce"),
      ns: 'config.system.sessions',
      min: { _id: { id: UUID("04400000-0000-0000-0000-000000000000") } },
      max: { _id: { id: UUID("04800000-0000-0000-0000-000000000000") } },
      shard: 'shard02',
      history: [ { validAfter: Timestamp(18, 1607340672), shard: 'shard02' } ]
    },
    {
      _id: ObjectId("5fce126d579db766a198a674"),
      lastmod: Timestamp(0, 20),
      lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce"),
      ns: 'config.system.sessions',
      min: { _id: { id: UUID("04800000-0000-0000-0000-000000000000") } },
      max: { _id: { id: UUID("04c00000-0000-0000-0000-000000000000") } },
      shard: 'shard03',
      history: [ { validAfter: Timestamp(17, 1607340673), shard: 'shard03' } ]
    },
    {
      _id: ObjectId("5fce126d579db766a198a675"),
      lastmod: Timestamp(0, 21),
      lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce"),
      ns: 'config.system.sessions',
      min: { _id: { id: UUID("04c00000-0000-0000-0000-000000000000") } },
      max: { _id: { id: UUID("05000000-0000-0000-0000-000000000000") } },
      shard: 'shard02',
      history: [ { validAfter: Timestamp(16, 1607340674), shard: 'shard02' } ]
    }
  ],
  'changelog': [
    {
      _id: 'hostname:27027-2020-12-07T12:26:06.357+01:00-5fce114e579db766a198a070',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '127.0.0.1:43926',
      time: new Date('2020-12-07T11:26:06.357Z'),
      what: 'addShard',
      ns: '',
      details: {
        name: 'shard01',
        host: 'shard01/localhost:27018,localhost:27019,localhost:27020'
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:26:10.422+01:00-5fce1152579db766a198a0a5',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '127.0.0.1:43926',
      time: new Date('2020-12-07T11:26:10.422Z'),
      what: 'addShard',
      ns: '',
      details: {
        name: 'shard02',
        host: 'shard02/localhost:27021,localhost:27022,localhost:27023'
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:26:12.552+01:00-5fce1154579db766a198a0e1',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '127.0.0.1:43926',
      time: new Date('2020-12-07T11:26:12.552Z'),
      what: 'addShard',
      ns: '',
      details: {
        name: 'shard03',
        host: 'shard03/localhost:27024,localhost:27025,localhost:27026'
      }
    },
    {
      _id: 'hostname:27018-2020-12-07T12:30:52.210+01:00-5fce126ca9a51812df9c03cd',
      server: 'hostname:27018',
      shard: 'shard01',
      clientAddr: '127.0.0.1:59076',
      time: new Date('2020-12-07T11:30:52.210Z'),
      what: 'shardCollection.start',
      ns: 'config.system.sessions',
      details: {
        shardKey: { _id: 1 },
        collection: 'config.system.sessions',
        uuid: UUID("2b9f1d80-e310-4481-84ff-fcc0f9f07c9a"),
        empty: true,
        primary: 'shard01:shard01/localhost:27018,localhost:27019,localhost:27020'
      }
    },
    {
      _id: 'hostname:27018-2020-12-07T12:30:52.231+01:00-5fce126ca9a51812df9c03d2',
      server: 'hostname:27018',
      shard: 'shard01',
      clientAddr: '127.0.0.1:59076',
      time: new Date('2020-12-07T11:30:52.231Z'),
      what: 'shardCollection.end',
      ns: 'config.system.sessions',
      details: { version: '1|0||5fce126ca9a51812df9c03ce', numChunks: 1 }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:30:53.132+01:00-5fce126d579db766a198aa64',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '127.0.0.1:44036',
      time: new Date('2020-12-07T11:30:53.132Z'),
      what: 'multi-split',
      ns: 'config.system.sessions',
      details: {
        before: {
          min: { _id: MinKey() },
          max: { _id: MaxKey() },
          lastmod: Timestamp(0, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        },
        number: 1,
        of: 1024,
        chunk: {
          min: { _id: MinKey() },
          max: { _id: { id: UUID("00400000-0000-0000-0000-000000000000") } },
          lastmod: Timestamp(1, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        }
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:30:53.132+01:00-5fce126d579db766a198aa66',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '127.0.0.1:44036',
      time: new Date('2020-12-07T11:30:53.132Z'),
      what: 'multi-split',
      ns: 'config.system.sessions',
      details: {
        before: {
          min: { _id: MinKey() },
          max: { _id: MaxKey() },
          lastmod: Timestamp(0, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        },
        number: 2,
        of: 1024,
        chunk: {
          min: { _id: { id: UUID("00400000-0000-0000-0000-000000000000") } },
          max: { _id: { id: UUID("00800000-0000-0000-0000-000000000000") } },
          lastmod: Timestamp(2, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        }
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:30:53.132+01:00-5fce126d579db766a198aa68',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '127.0.0.1:44036',
      time: new Date('2020-12-07T11:30:53.132Z'),
      what: 'multi-split',
      ns: 'config.system.sessions',
      details: {
        before: {
          min: { _id: MinKey() },
          max: { _id: MaxKey() },
          lastmod: Timestamp(0, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        },
        number: 3,
        of: 1024,
        chunk: {
          min: { _id: { id: UUID("00800000-0000-0000-0000-000000000000") } },
          max: { _id: { id: UUID("00c00000-0000-0000-0000-000000000000") } },
          lastmod: Timestamp(3, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        }
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:30:53.132+01:00-5fce126d579db766a198aa6a',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '127.0.0.1:44036',
      time: new Date('2020-12-07T11:30:53.132Z'),
      what: 'multi-split',
      ns: 'config.system.sessions',
      details: {
        before: {
          min: { _id: MinKey() },
          max: { _id: MaxKey() },
          lastmod: Timestamp(0, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        },
        number: 4,
        of: 1024,
        chunk: {
          min: { _id: { id: UUID("00c00000-0000-0000-0000-000000000000") } },
          max: { _id: { id: UUID("01000000-0000-0000-0000-000000000000") } },
          lastmod: Timestamp(4, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        }
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:30:53.132+01:00-5fce126d579db766a198aa6c',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '127.0.0.1:44036',
      time: new Date('2020-12-07T11:30:53.132Z'),
      what: 'multi-split',
      ns: 'config.system.sessions',
      details: {
        before: {
          min: { _id: MinKey() },
          max: { _id: MaxKey() },
          lastmod: Timestamp(0, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        },
        number: 5,
        of: 1024,
        chunk: {
          min: { _id: { id: UUID("01000000-0000-0000-0000-000000000000") } },
          max: { _id: { id: UUID("01400000-0000-0000-0000-000000000000") } },
          lastmod: Timestamp(5, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        }
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:30:53.133+01:00-5fce126d579db766a198aa6e',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '127.0.0.1:44036',
      time: new Date('2020-12-07T11:30:53.133Z'),
      what: 'multi-split',
      ns: 'config.system.sessions',
      details: {
        before: {
          min: { _id: MinKey() },
          max: { _id: MaxKey() },
          lastmod: Timestamp(0, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        },
        number: 6,
        of: 1024,
        chunk: {
          min: { _id: { id: UUID("01400000-0000-0000-0000-000000000000") } },
          max: { _id: { id: UUID("01800000-0000-0000-0000-000000000000") } },
          lastmod: Timestamp(6, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        }
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:30:53.133+01:00-5fce126d579db766a198aa70',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '127.0.0.1:44036',
      time: new Date('2020-12-07T11:30:53.133Z'),
      what: 'multi-split',
      ns: 'config.system.sessions',
      details: {
        before: {
          min: { _id: MinKey() },
          max: { _id: MaxKey() },
          lastmod: Timestamp(0, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        },
        number: 7,
        of: 1024,
        chunk: {
          min: { _id: { id: UUID("01800000-0000-0000-0000-000000000000") } },
          max: { _id: { id: UUID("01c00000-0000-0000-0000-000000000000") } },
          lastmod: Timestamp(7, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        }
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:30:53.133+01:00-5fce126d579db766a198aa72',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '127.0.0.1:44036',
      time: new Date('2020-12-07T11:30:53.133Z'),
      what: 'multi-split',
      ns: 'config.system.sessions',
      details: {
        before: {
          min: { _id: MinKey() },
          max: { _id: MaxKey() },
          lastmod: Timestamp(0, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        },
        number: 8,
        of: 1024,
        chunk: {
          min: { _id: { id: UUID("01c00000-0000-0000-0000-000000000000") } },
          max: { _id: { id: UUID("02000000-0000-0000-0000-000000000000") } },
          lastmod: Timestamp(8, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        }
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:30:53.133+01:00-5fce126d579db766a198aa74',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '127.0.0.1:44036',
      time: new Date('2020-12-07T11:30:53.133Z'),
      what: 'multi-split',
      ns: 'config.system.sessions',
      details: {
        before: {
          min: { _id: MinKey() },
          max: { _id: MaxKey() },
          lastmod: Timestamp(0, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        },
        number: 9,
        of: 1024,
        chunk: {
          min: { _id: { id: UUID("02000000-0000-0000-0000-000000000000") } },
          max: { _id: { id: UUID("02400000-0000-0000-0000-000000000000") } },
          lastmod: Timestamp(9, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        }
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:30:53.133+01:00-5fce126d579db766a198aa76',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '127.0.0.1:44036',
      time: new Date('2020-12-07T11:30:53.133Z'),
      what: 'multi-split',
      ns: 'config.system.sessions',
      details: {
        before: {
          min: { _id: MinKey() },
          max: { _id: MaxKey() },
          lastmod: Timestamp(0, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        },
        number: 10,
        of: 1024,
        chunk: {
          min: { _id: { id: UUID("02400000-0000-0000-0000-000000000000") } },
          max: { _id: { id: UUID("02800000-0000-0000-0000-000000000000") } },
          lastmod: Timestamp(10, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        }
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:30:53.133+01:00-5fce126d579db766a198aa78',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '127.0.0.1:44036',
      time: new Date('2020-12-07T11:30:53.133Z'),
      what: 'multi-split',
      ns: 'config.system.sessions',
      details: {
        before: {
          min: { _id: MinKey() },
          max: { _id: MaxKey() },
          lastmod: Timestamp(0, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        },
        number: 11,
        of: 1024,
        chunk: {
          min: { _id: { id: UUID("02800000-0000-0000-0000-000000000000") } },
          max: { _id: { id: UUID("02c00000-0000-0000-0000-000000000000") } },
          lastmod: Timestamp(11, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        }
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:30:53.133+01:00-5fce126d579db766a198aa7a',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '127.0.0.1:44036',
      time: new Date('2020-12-07T11:30:53.133Z'),
      what: 'multi-split',
      ns: 'config.system.sessions',
      details: {
        before: {
          min: { _id: MinKey() },
          max: { _id: MaxKey() },
          lastmod: Timestamp(0, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        },
        number: 12,
        of: 1024,
        chunk: {
          min: { _id: { id: UUID("02c00000-0000-0000-0000-000000000000") } },
          max: { _id: { id: UUID("03000000-0000-0000-0000-000000000000") } },
          lastmod: Timestamp(12, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        }
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:30:53.133+01:00-5fce126d579db766a198aa7c',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '127.0.0.1:44036',
      time: new Date('2020-12-07T11:30:53.133Z'),
      what: 'multi-split',
      ns: 'config.system.sessions',
      details: {
        before: {
          min: { _id: MinKey() },
          max: { _id: MaxKey() },
          lastmod: Timestamp(0, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        },
        number: 13,
        of: 1024,
        chunk: {
          min: { _id: { id: UUID("03000000-0000-0000-0000-000000000000") } },
          max: { _id: { id: UUID("03400000-0000-0000-0000-000000000000") } },
          lastmod: Timestamp(13, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        }
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:30:53.133+01:00-5fce126d579db766a198aa7e',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '127.0.0.1:44036',
      time: new Date('2020-12-07T11:30:53.133Z'),
      what: 'multi-split',
      ns: 'config.system.sessions',
      details: {
        before: {
          min: { _id: MinKey() },
          max: { _id: MaxKey() },
          lastmod: Timestamp(0, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        },
        number: 14,
        of: 1024,
        chunk: {
          min: { _id: { id: UUID("03400000-0000-0000-0000-000000000000") } },
          max: { _id: { id: UUID("03800000-0000-0000-0000-000000000000") } },
          lastmod: Timestamp(14, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        }
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:30:53.133+01:00-5fce126d579db766a198aa80',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '127.0.0.1:44036',
      time: new Date('2020-12-07T11:30:53.133Z'),
      what: 'multi-split',
      ns: 'config.system.sessions',
      details: {
        before: {
          min: { _id: MinKey() },
          max: { _id: MaxKey() },
          lastmod: Timestamp(0, 1),
          lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        },
        number: 15,
        of: 1024,
        chunk: {
          min: { _id: { id: UUID("03800000-0000-0000-0000-000000000000") } },
          max: { _id: { id: UUID("03c00000-0000-0000-0000-000000000000") } },
          lastmod: Timestamp(15, 1),
        lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce")
        }
      }
    }
  ],
  'actionlog': [
    {
      _id: 'hostname:27027-2020-12-07T12:30:53.579+01:00-5fce126d579db766a198b28e',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '',
      time: new Date('2020-12-07T11:30:53.579Z'),
      what: 'balancer.round',
      ns: '',
      details: {
        executionTimeMillis: 495,
        errorOccured: false,
        candidateChunks: 1,
        chunksMoved: 1
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:30:54.858+01:00-5fce126e579db766a198b2be',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '',
      time: new Date('2020-12-07T11:30:54.858Z'),
      what: 'balancer.round',
      ns: '',
      details: {
        executionTimeMillis: 277,
        errorOccured: false,
        candidateChunks: 1,
        chunksMoved: 1
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:30:55.954+01:00-5fce126f579db766a198b2e9',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '',
      time: new Date('2020-12-07T11:30:55.954Z'),
      what: 'balancer.round',
      ns: '',
      details: {
        executionTimeMillis: 93,
        errorOccured: false,
        candidateChunks: 1,
        chunksMoved: 1
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:30:57.054+01:00-5fce1271579db766a198b319',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '',
      time: new Date('2020-12-07T11:30:57.054Z'),
      what: 'balancer.round',
      ns: '',
      details: {
        executionTimeMillis: 95,
        errorOccured: false,
        candidateChunks: 1,
        chunksMoved: 1
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:30:58.167+01:00-5fce1272579db766a198b343',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '',
      time: new Date('2020-12-07T11:30:58.167Z'),
      what: 'balancer.round',
      ns: '',
      details: {
        executionTimeMillis: 110,
        errorOccured: false,
        candidateChunks: 1,
        chunksMoved: 1
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:30:59.270+01:00-5fce1273579db766a198b36d',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '',
      time: new Date('2020-12-07T11:30:59.270Z'),
      what: 'balancer.round',
      ns: '',
      details: {
        executionTimeMillis: 100,
        errorOccured: false,
        candidateChunks: 1,
        chunksMoved: 1
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:31:00.379+01:00-5fce1274579db766a198b397',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '',
      time: new Date('2020-12-07T11:31:00.379Z'),
      what: 'balancer.round',
      ns: '',
      details: {
        executionTimeMillis: 107,
        errorOccured: false,
        candidateChunks: 1,
        chunksMoved: 1
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:31:01.491+01:00-5fce1275579db766a198b3c9',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '',
      time: new Date('2020-12-07T11:31:01.491Z'),
      what: 'balancer.round',
      ns: '',
      details: {
        executionTimeMillis: 109,
        errorOccured: false,
        candidateChunks: 1,
        chunksMoved: 1
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:31:02.573+01:00-5fce1276579db766a198b3f3',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '',
      time: new Date('2020-12-07T11:31:02.573Z'),
      what: 'balancer.round',
      ns: '',
      details: {
        executionTimeMillis: 79,
        errorOccured: false,
        candidateChunks: 1,
        chunksMoved: 1
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:31:03.694+01:00-5fce1277579db766a198b425',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '',
      time: new Date('2020-12-07T11:31:03.694Z'),
      what: 'balancer.round',
      ns: '',
      details: {
        executionTimeMillis: 118,
        errorOccured: false,
        candidateChunks: 1,
        chunksMoved: 1
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:31:04.781+01:00-5fce1278579db766a198b45e',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '',
      time: new Date('2020-12-07T11:31:04.781Z'),
      what: 'balancer.round',
      ns: '',
      details: {
        executionTimeMillis: 84,
        errorOccured: false,
        candidateChunks: 1,
        chunksMoved: 1
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:31:05.883+01:00-5fce1279579db766a198b488',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '',
      time: new Date('2020-12-07T11:31:05.883Z'),
      what: 'balancer.round',
      ns: '',
      details: {
        executionTimeMillis: 99,
        errorOccured: false,
        candidateChunks: 1,
        chunksMoved: 1
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:31:06.981+01:00-5fce127a579db766a198b4c1',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '',
      time: new Date('2020-12-07T11:31:06.981Z'),
      what: 'balancer.round',
      ns: '',
      details: {
        executionTimeMillis: 95,
        errorOccured: false,
        candidateChunks: 1,
        chunksMoved: 1
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:31:08.083+01:00-5fce127c579db766a198b4eb',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '',
      time: new Date('2020-12-07T11:31:08.083Z'),
      what: 'balancer.round',
      ns: '',
      details: {
        executionTimeMillis: 99,
        errorOccured: false,
        candidateChunks: 1,
        chunksMoved: 1
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:31:09.183+01:00-5fce127d579db766a198b515',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '',
      time: new Date('2020-12-07T11:31:09.183Z'),
      what: 'balancer.round',
      ns: '',
      details: {
        executionTimeMillis: 97,
        errorOccured: false,
        candidateChunks: 1,
        chunksMoved: 1
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:31:10.291+01:00-5fce127e579db766a198b53f',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '',
      time: new Date('2020-12-07T11:31:10.291Z'),
      what: 'balancer.round',
      ns: '',
      details: {
        executionTimeMillis: 105,
        errorOccured: false,
        candidateChunks: 1,
        chunksMoved: 1
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:31:11.396+01:00-5fce127f579db766a198b57a',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '',
      time: new Date('2020-12-07T11:31:11.396Z'),
      what: 'balancer.round',
      ns: '',
      details: {
        executionTimeMillis: 103,
        errorOccured: false,
        candidateChunks: 1,
        chunksMoved: 1
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:31:12.507+01:00-5fce1280579db766a198b5a4',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '',
      time: new Date('2020-12-07T11:31:12.507Z'),
      what: 'balancer.round',
      ns: '',
      details: {
        executionTimeMillis: 108,
        errorOccured: false,
        candidateChunks: 1,
        chunksMoved: 1
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:31:13.602+01:00-5fce1281579db766a198b5d7',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '',
      time: new Date('2020-12-07T11:31:13.602Z'),
      what: 'balancer.round',
      ns: '',
      details: {
        executionTimeMillis: 92,
        errorOccured: false,
        candidateChunks: 1,
        chunksMoved: 1
      }
    },
    {
      _id: 'hostname:27027-2020-12-07T12:31:14.711+01:00-5fce1282579db766a198b607',
      server: 'hostname:27027',
      shard: 'config',
      clientAddr: '',
      time: new Date('2020-12-07T11:31:14.711Z'),
      what: 'balancer.round',
      ns: '',
      details: {
        executionTimeMillis: 107,
        errorOccured: false,
        candidateChunks: 1,
        chunksMoved: 1
      }
    }
  ],
  'collections': [
    {
      _id: 'config.system.sessions',
      lastmodEpoch: ObjectId("5fce126ca9a51812df9c03ce"),
      // This is always 2**32 ms after the Unix epoch. Who knows why.
      lastmod: new Date('1970-02-19T17:02:47.296Z'),
      dropped: false,
      key: { _id: 1 },
      unique: false,
      uuid: UUID("2b9f1d80-e310-4481-84ff-fcc0f9f07c9a"),
      distributionMode: 'sharded'
    }
  ],
  'locks': [
    {
      _id: 'test',
      state: 0,
      process: 'ConfigServer',
      ts: ObjectId("5fce116c579db766a198a176"),
      when: new Date('2020-12-07T11:26:36.803Z'),
      who: 'ConfigServer:conn9',
      why: 'createDatabase'
    },
    {
      _id: 'config',
      state: 0,
      process: 'ConfigServer',
      ts: ObjectId("5fce126c579db766a198a637"),
      when: new Date('2020-12-07T11:30:52.145Z'),
      who: 'ConfigServer:LogicalSessionCacheRefresh',
      why: 'shardCollection'
    },
    {
      _id: 'config.system.sessions',
      state: 0,
      process: 'ConfigServer',
      ts: ObjectId("5fce1140579db766a1989fe2"),
      when: new Date('2020-12-07T11:43:28.036Z'),
      who: 'ConfigServer:Balancer',
      why: 'Migrating chunk(s) in collection config.system.sessions'
    }
  ]
});
