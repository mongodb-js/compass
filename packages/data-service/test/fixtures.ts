import { UUID } from 'bson';

export const HOST_INFO = {
  system: {
    currentTime: new Date('2015-12-03T00:51:06.763Z'),
    hostname: 'Groot.local',
    cpuAddrSize: 64,
    memSizeMB: 16384,
    numCores: 4,
    cpuArch: 'x86_64',
    numaEnabled: false,
  },
  os: {
    type: 'Darwin',
    name: 'Mac OS X',
    version: '15.0.0',
  },
  extra: {
    versionString:
      'Darwin Kernel Version 15.0.0: Sat Sep 19 15:53:46 PDT 2015; root:xnu-3247.10.11~1/RELEASE_X86_64',
    alwaysFullSync: 0,
    nfsAsync: 0,
    model: 'MacBookPro12,1',
    physicalCores: 2,
    cpuFrequencyMHz: 3100,
    cpuString: 'Intel(R) Core(TM) i7-5557U CPU @ 3.10GHz',
    cpuFeatures:
      'FPU VME DE PSE TSC MSR PAE MCE CX8 APIC SEP MTRR PGE MCA CMOV PAT PSE36 CLFSH DS ACPI MMX FXSR SSE SSE2 SS HTT TM PBE SSE3 PCLMULQDQ DTES64 MON DSCPL VMX EST TM2 SSSE3 FMA CX16 TPR PDCM SSE4.1 SSE4.2 x2APIC MOVBE POPCNT AES PCID XSAVE OSXSAVE SEGLIM64 TSCTMR AVX1.0 RDRAND F16C SYSCALL XD 1GBPAGE EM64T LAHF LZCNT PREFETCHW RDTSCP TSCI',
    pageSize: 4096,
    scheduler: 'multiq',
  },
  ok: 1,
};

export const LIST_DATABASES_NAME_ONLY = {
  databases: [
    { name: 'sample_airbnb' },
    { name: 'sample_geospatial' },
    { name: 'sample_mflix' },
  ],
};

export const DB_STATS = {
  sample_airbnb: {
    db: 'sample_airbnb',
    collections: 2,
    views: 0,
    objects: 5556,
    avgObjSize: 16983,
    dataSize: 94362224,
    storageSize: 54075392,
    numExtents: 0,
    indexes: 5,
    indexSize: 532480,
    scaleFactor: 1,
    fsUsedSize: 24489779200,
    fsTotalSize: 36496736256,
  },
  sample_geospatial: {
    db: 'sample_geospatial',
    collections: 1,
    views: 0,
    objects: 11095,
    avgObjSize: 328,
    dataSize: 3649283,
    storageSize: 753664,
    numExtents: 0,
    indexes: 2,
    indexSize: 311296,
    scaleFactor: 1,
    fsUsedSize: 24489680896,
    fsTotalSize: 36496736256,
  },
  sample_mflix: {
    db: 'sample_mflix',
    collections: 6,
    views: 2,
    objects: 75593,
    avgObjSize: 692,
    dataSize: 52319033,
    storageSize: 29491200,
    numExtents: 0,
    indexes: 10,
    indexSize: 15536128,
    scaleFactor: 1,
    fsUsedSize: 24489762816,
    fsTotalSize: 36496736256,
  },
};

export const LIST_COLLECTIONS = {
  sample_airbnb: [
    {
      name: 'a',
      type: 'collection',
      options: {},
      info: {
        readOnly: false,
        uuid: new UUID('0908fcbe-ad5f-4aac-bcb7-1584288467ac'),
      },
      idIndex: { v: 2, name: '_id_', ns: 'sample_airbnb.a' },
    },
    {
      name: 'listingsAndReviews',
      type: 'collection',
      options: {},
      info: {
        readOnly: false,
        uuid: new UUID('325b74cf-4610-41a3-af80-c4a24bd25834'),
      },
      idIndex: {
        v: 2,
        name: '_id_',
        ns: 'sample_airbnb.listingsAndReviews',
      },
    },
  ],
  sample_geospatial: [
    {
      name: 'shipwrecks',
      type: 'collection',
      options: {},
      info: {
        readOnly: false,
        uuid: new UUID('8225bda6-b5a6-4546-b96b-8992ea372b46'),
      },
      idIndex: {
        v: 2,
        name: '_id_',
        ns: 'sample_geospatial.shipwrecks',
      },
    },
  ],
  sample_mflix: [
    {
      name: 'movies',
      type: 'collection',
      options: {},
      info: {
        readOnly: false,
        uuid: new UUID('418e60d3-521e-4472-b690-87aaa3c1a87e'),
      },
      idIndex: { v: 2, name: '_id_', ns: 'sample_mflix.movies' },
    },
    {
      name: 'theaters',
      type: 'collection',
      options: {},
      info: {
        readOnly: false,
        uuid: new UUID('4555f315-a2f2-4754-954b-bfb9252571e0'),
      },
      idIndex: {
        v: 2,

        name: '_id_',
        ns: 'sample_mflix.theaters',
      },
    },
    {
      name: 'comments',
      type: 'collection',
      options: {},
      info: {
        readOnly: false,
        uuid: new UUID('56676d96-6ef0-4af7-9036-37d947f07b90'),
      },
      idIndex: {
        v: 2,

        name: '_id_',
        ns: 'sample_mflix.comments',
      },
    },
    {
      name: 'system.views',
      type: 'collection',
      options: {},
      info: {
        readOnly: false,
        uuid: new UUID('a76d1f0a-01ec-463f-84af-861a7f46de63'),
      },
      idIndex: {
        v: 2,

        name: '_id_',
        ns: 'sample_mflix.system.views',
      },
    },
    {
      name: 'users',
      type: 'collection',
      options: {},
      info: {
        readOnly: false,
        uuid: new UUID('c7f33b00-8b6c-4bf6-a9fe-2701437366fb'),
      },
      idIndex: { v: 2, name: '_id_', ns: 'sample_mflix.users' },
    },
    {
      name: 'sessions',
      type: 'collection',
      options: {},
      info: {
        readOnly: false,
        uuid: new UUID('f61fac6e-e2ca-484f-a96e-a2d2e1cadfa8'),
      },
      idIndex: {
        v: 2,
        name: '_id_',
        ns: 'sample_mflix.sessions',
      },
    },
    {
      name: 'thrillers_by_year',
      type: 'view',
      options: { viewOn: 'movies', pipeline: [] },
      info: { readOnly: true },
    },
    {
      name: 'movies_to_export',
      type: 'view',
      options: { viewOn: 'movies', pipeline: [] },
      info: { readOnly: true },
    },
  ],
};

export const USER_INFO_JOHN = {
  _id: 'admin.john',
  user: 'john',
  db: 'admin',
  roles: [
    {
      role: 'mongodb-user',
      db: 'tenants',
    },
    {
      role: 'read',
      db: 'reporting',
    },
    {
      role: 'read',
      db: 'products',
    },
    {
      role: 'read',
      db: 'sales',
    },
    {
      role: 'readWrite',
      db: 'accounts',
    },
  ],
  inheritedRoles: [
    {
      role: 'readWrite',
      db: 'accounts',
    },
    {
      role: 'read',
      db: 'sales',
    },
    {
      role: 'read',
      db: 'products',
    },
    {
      role: 'read',
      db: 'reporting',
    },
    {
      role: 'mongodb-user',
      db: 'tenants',
    },
  ],
  inheritedPrivileges: [
    {
      resource: {
        db: 'tenants',
        collection: 'mongodb',
      },
      actions: ['collStats', 'find'],
    },
    {
      resource: {
        db: 'reporting',
        collection: '',
      },
      actions: [
        'collStats',
        'dbHash',
        'dbStats',
        'find',
        'killCursors',
        'listCollections',
        'listIndexes',
        'planCacheRead',
      ],
    },
    {
      resource: {
        db: 'reporting',
        collection: 'system.indexes',
      },
      actions: [
        'collStats',
        'dbHash',
        'dbStats',
        'find',
        'killCursors',
        'listCollections',
        'listIndexes',
        'planCacheRead',
      ],
    },
    {
      resource: {
        db: 'reporting',
        collection: 'system.js',
      },
      actions: [
        'collStats',
        'dbHash',
        'dbStats',
        'find',
        'killCursors',
        'listCollections',
        'listIndexes',
        'planCacheRead',
      ],
    },
    {
      resource: {
        db: 'reporting',
        collection: 'system.namespaces',
      },
      actions: [
        'collStats',
        'dbHash',
        'dbStats',
        'find',
        'killCursors',
        'listCollections',
        'listIndexes',
        'planCacheRead',
      ],
    },
    {
      resource: {
        db: 'products',
        collection: '',
      },
      actions: [
        'collStats',
        'dbHash',
        'dbStats',
        'find',
        'killCursors',
        'listCollections',
        'listIndexes',
        'planCacheRead',
      ],
    },
    {
      resource: {
        db: 'products',
        collection: 'system.indexes',
      },
      actions: [
        'collStats',
        'dbHash',
        'dbStats',
        'find',
        'killCursors',
        'listCollections',
        'listIndexes',
        'planCacheRead',
      ],
    },
    {
      resource: {
        db: 'products',
        collection: 'system.js',
      },
      actions: [
        'collStats',
        'dbHash',
        'dbStats',
        'find',
        'killCursors',
        'listCollections',
        'listIndexes',
        'planCacheRead',
      ],
    },
    {
      resource: {
        db: 'products',
        collection: 'system.namespaces',
      },
      actions: [
        'collStats',
        'dbHash',
        'dbStats',
        'find',
        'killCursors',
        'listCollections',
        'listIndexes',
        'planCacheRead',
      ],
    },
    {
      resource: {
        db: 'sales',
        collection: '',
      },
      actions: [
        'collStats',
        'dbHash',
        'dbStats',
        'find',
        'killCursors',
        'listCollections',
        'listIndexes',
        'planCacheRead',
      ],
    },
    {
      resource: {
        db: 'sales',
        collection: 'system.indexes',
      },
      actions: [
        'collStats',
        'dbHash',
        'dbStats',
        'find',
        'killCursors',
        'listCollections',
        'listIndexes',
        'planCacheRead',
      ],
    },
    {
      resource: {
        db: 'sales',
        collection: 'system.js',
      },
      actions: [
        'collStats',
        'dbHash',
        'dbStats',
        'find',
        'killCursors',
        'listCollections',
        'listIndexes',
        'planCacheRead',
      ],
    },
    {
      resource: {
        db: 'sales',
        collection: 'system.namespaces',
      },
      actions: [
        'collStats',
        'dbHash',
        'dbStats',
        'find',
        'killCursors',
        'listCollections',
        'listIndexes',
        'planCacheRead',
      ],
    },
    {
      resource: {
        db: 'accounts',
        collection: '',
      },
      actions: [
        'collStats',
        'convertToCapped',
        'createCollection',
        'createIndex',
        'dbHash',
        'dbStats',
        'dropCollection',
        'dropIndex',
        'emptycapped',
        'find',
        'insert',
        'killCursors',
        'listCollections',
        'listIndexes',
        'planCacheRead',
        'remove',
        'renameCollectionSameDB',
        'update',
      ],
    },
    {
      resource: {
        db: 'accounts',
        collection: 'system.indexes',
      },
      actions: [
        'collStats',
        'dbHash',
        'dbStats',
        'find',
        'killCursors',
        'listCollections',
        'listIndexes',
        'planCacheRead',
      ],
    },
    {
      resource: {
        db: 'accounts',
        collection: 'system.js',
      },
      actions: [
        'collStats',
        'convertToCapped',
        'createCollection',
        'createIndex',
        'dbHash',
        'dbStats',
        'dropCollection',
        'dropIndex',
        'emptycapped',
        'find',
        'insert',
        'killCursors',
        'listCollections',
        'listIndexes',
        'planCacheRead',
        'remove',
        'renameCollectionSameDB',
        'update',
      ],
    },
    {
      resource: {
        db: 'accounts',
        collection: 'system.namespaces',
      },
      actions: [
        'collStats',
        'dbHash',
        'dbStats',
        'find',
        'killCursors',
        'listCollections',
        'listIndexes',
        'planCacheRead',
      ],
    },
  ],
};

export const CONNECTION_STATUS_USER_JOHN = {
  authInfo: {
    authenticatedUserPrivileges: USER_INFO_JOHN.inheritedPrivileges,
  },
};

export const USER_INFO_LISTDB_ONLY = {
  _id: 'admin.listy',
  user: 'listy',
  db: 'admin',
  roles: [
    {
      role: 'onlyListDBs',
      db: 'admin',
    },
  ],
  inheritedRoles: [
    {
      role: 'onlyListDBs',
      db: 'admin',
    },
  ],
  inheritedPrivileges: [
    {
      resource: {
        cluster: true,
      },
      actions: ['listDatabases'],
    },
  ],
};

export const CONNECTION_STATUS_LISTDB_ONLY = {
  authInfo: {
    authenticatedUserPrivileges: USER_INFO_LISTDB_ONLY.inheritedPrivileges,
  },
};

export const USER_INFO_COLL_ONLY = {
  _id: 'db3.coll',
  user: 'coll',
  db: 'db3',
  roles: [
    {
      role: 'coll',
      db: 'db3',
    },
  ],
  inheritedRoles: [
    {
      role: 'coll',
      db: 'db3',
    },
  ],
  inheritedPrivileges: [
    {
      resource: {
        db: 'db3',
        collection: 'coll3',
      },
      actions: ['find', 'insert', 'update'],
    },
  ],
  inheritedAuthenticationRestrictions: [],
};

export const CONNECTION_STATUS_COLL_ONLY = {
  authInfo: {
    authenticatedUserPrivileges: USER_INFO_COLL_ONLY.inheritedPrivileges,
  },
};

export const BUILD_INFO_OLD = {
  version: '2.6.11',
  gitVersion: 'd00c1735675c457f75a12d530bee85421f0c5548 modules: enterprise',
  OpenSSLVersion: 'OpenSSL 1.0.1f 6 Jan 2014',
  sysInfo:
    'Linux ip-10-203-203-194 3.13.0-24-generic #46-Ubuntu SMP Thu Apr 10 19:11:08 UTC 2014 x86_64 BOOST_LIB_VERSION=1_49',
  loaderFlags:
    '-fPIC -pthread -Wl,-z,now -rdynamic -Wl,-Bsymbolic-functions -Wl,-z,relro -Wl,-z,now -Wl,-E',
  compilerFlags:
    '-Wnon-virtual-dtor -Woverloaded-virtual -fPIC -fno-strict-aliasing -ggdb -pthread -Wall -Wsign-compare -Wno-unknown-pragmas -Winvalid-pch -pipe -Werror -O3 -Wno-unused-local-typedefs -Wno-unused-function -Wno-deprecated-declarations -fno-builtin-memcmp',
  allocator: 'tcmalloc',
  versionArray: [2, 6, 11, 0],
  javascriptEngine: 'V8',
  bits: 64,
  debug: false,
  maxBsonObjectSize: 16777216,
  ok: 1,
};

export const BUILD_INFO_3_2 = {
  version: '3.2.0-rc2',
  gitVersion: '8a3acb42742182c5e314636041c2df368232bbc5',
  modules: ['enterprise'],
  allocator: 'system',
  javascriptEngine: 'mozjs',
  sysInfo: 'deprecated',
  versionArray: [3, 2, 0, -48],
  openssl: {
    running: 'OpenSSL 0.9.8zg 14 July 2015',
    compiled: 'OpenSSL 0.9.8y 5 Feb 2013',
  },
  buildEnvironment: {
    distmod: '',
    distarch: 'x86_64',
    cc: 'gcc: Apple LLVM version 5.1 (clang-503.0.40) (based on LLVM 3.4svn)',
    ccflags:
      '-fno-omit-frame-pointer -fPIC -fno-strict-aliasing -ggdb -pthread -Wall -Wsign-compare -Wno-unknown-pragmas -Winvalid-pch -Werror -O2 -Wno-unused-function -Wno-unused-private-field -Wno-deprecated-declarations -Wno-tautological-constant-out-of-range-compare -Wno-unused-const-variable -Wno-missing-braces -mmacosx-version-min=10.7 -fno-builtin-memcmp',
    cxx: 'g++: Apple LLVM version 5.1 (clang-503.0.40) (based on LLVM 3.4svn)',
    cxxflags:
      '-Wnon-virtual-dtor -Woverloaded-virtual -stdlib=libc++ -std=c++11',
    linkflags:
      '-fPIC -pthread -Wl,-bind_at_load -mmacosx-version-min=10.7 -stdlib=libc++ -fuse-ld=gold',
    target_arch: 'x86_64',
    target_os: 'osx',
  },
  bits: 64,
  debug: false,
  maxBsonObjectSize: 16777216,
  storageEngines: [
    'devnull',
    'ephemeralForTest',
    'inMemory',
    'mmapv1',
    'wiredTiger',
  ],
  ok: 1,
};

export const BUILD_INFO_4_2 = {
  version: '4.2.17',
  gitVersion: 'be089838c55d33b6f6039c4219896ee4a3cd704f',
  modules: ['enterprise'],
  allocator: 'tcmalloc',
  javascriptEngine: 'mozjs',
  sysInfo: 'deprecated',
  versionArray: [4, 2, 17, 0],
  openssl: {
    running: 'OpenSSL 1.0.1e-fips 11 Feb 2013',
    compiled: 'OpenSSL 1.0.1e-fips 11 Feb 2013',
  },
  buildEnvironment: {
    distmod: 'rhel70',
    distarch: 'x86_64',
    cc: '/opt/mongodbtoolchain/v3/bin/gcc: gcc (GCC) 8.5.0',
    ccflags:
      '-fno-omit-frame-pointer -fno-strict-aliasing -ggdb -pthread -Wall ' +
      '-Wsign-compare -Wno-unknown-pragmas -Winvalid-pch -Werror -O2 ' +
      '-Wno-unused-local-typedefs -Wno-unused-function ' +
      '-Wno-deprecated-declarations -Wno-unused-const-variable ' +
      '-Wno-unused-but-set-variable -Wno-missing-braces ' +
      '-fstack-protector-strong -fno-builtin-memcmp',
    cxx: '/opt/mongodbtoolchain/v3/bin/g++: g++ (GCC) 8.5.0',
    cxxflags:
      '-Woverloaded-virtual ' +
      '-Wno-maybe-uninitialized ' +
      '-fsized-deallocation -std=c++17',
    linkflags:
      '-pthread -Wl,-z,now -rdynamic -Wl,--fatal-warnings ' +
      '-fstack-protector-strong -fuse-ld=gold -Wl,--build-id ' +
      '-Wl,--hash-style=gnu -Wl,-z,noexecstack -Wl,--warn-execstack ' +
      '-Wl,-z,relro -Wl,-rpath,/usr/lib64/perl5/CORE',
    target_arch: 'x86_64',
    target_os: 'linux',
  },
  bits: 64,
  debug: false,
  maxBsonObjectSize: 16777216,
  storageEngines: [
    'biggie',
    'devnull',
    'ephemeralForTest',
    'inMemory',
    'queryable_wt',
    'wiredTiger',
  ],
  ok: 1,
};

export const BUILD_INFO_DATA_LAKE = {
  dataLake: {
    version: 'v20200329',
    gitVersion: '0f318ss78bfad79ede3721e91iasj6f61644f',
    date: '2020-03-29T15:41:22Z',
  },
};

export const CMD_LINE_OPTS = {
  argv: [
    '/opt/mongodb-osx-x86_64-enterprise-3.6.3/bin/mongod',
    '--dbpath=/Users/user/testdata',
  ],
  parsed: {
    storage: {
      dbPath: '/Users/user/testdata',
    },
  },
  ok: 1,
};

export const DOCUMENTDB_CMD_LINE_OPTS = {
  ok: 0,
  errmsg: 'Feature not supported: getCmdLineOpts',
  code: 303,
};

export const COSMOSDB_BUILD_INFO = {
  _t: 'BuildInfoResponse',
  ok: 1,
  version: '3.2.0',
  gitVersion: '45d947729a0315accb6d4f15a6b06be6d9c19fe7',
  targetMinOS: 'Windows 7/Windows Server 2008 R2',
  modules: [],
  allocator: 'tcmalloc',
  javascriptEngine: 'Chakra',
  sysInfo: 'deprecated',
  versionArray: [3, 2, 0, 0],
  bits: 64,
  debug: false,
  maxBsonObjectSize: 524288,
  openssl: {
    running: 'OpenSSL 1.0.1p-fips 9 Jul 2015',
    compiled: 'OpenSSL 1.0.1p-fips 9 Jul 2015',
  },
};
