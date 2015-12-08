/* eslint indent: 0, quotes: 0, key-spacing: 0 */

var HOST_INFO = {
  "system" : {
    "currentTime" : new Date("2015-12-03T00:51:06.763Z"),
    "hostname" : "Groot.local",
    "cpuAddrSize" : 64,
    "memSizeMB" : 16384,
    "numCores" : 4,
    "cpuArch" : "x86_64",
    "numaEnabled" : false
  },
  "os" : {
    "type" : "Darwin",
    "name" : "Mac OS X",
    "version" : "15.0.0"
  },
  "extra" : {
    "versionString" : "Darwin Kernel Version 15.0.0: Sat Sep 19 15:53:46 PDT 2015; root:xnu-3247.10.11~1/RELEASE_X86_64",
    "alwaysFullSync" : 0,
    "nfsAsync" : 0,
    "model" : "MacBookPro12,1",
    "physicalCores" : 2,
    "cpuFrequencyMHz" : 3100,
    "cpuString" : "Intel(R) Core(TM) i7-5557U CPU @ 3.10GHz",
    "cpuFeatures" : "FPU VME DE PSE TSC MSR PAE MCE CX8 APIC SEP MTRR PGE MCA CMOV PAT PSE36 CLFSH DS ACPI MMX FXSR SSE SSE2 SS HTT TM PBE SSE3 PCLMULQDQ DTES64 MON DSCPL VMX EST TM2 SSSE3 FMA CX16 TPR PDCM SSE4.1 SSE4.2 x2APIC MOVBE POPCNT AES PCID XSAVE OSXSAVE SEGLIM64 TSCTMR AVX1.0 RDRAND F16C SYSCALL XD 1GBPAGE EM64T LAHF LZCNT PREFETCHW RDTSCP TSCI",
    "pageSize" : 4096,
    "scheduler" : "multiq"
  },
  "ok" : 1
};


var USER_INFO_JOHN = {
  "_id" : "admin.john",
  "user" : "john",
  "db" : "admin",
  "roles" : [
    {
      "role" : "mongodb-user",
      "db" : "tenants"
    },
    {
      "role" : "read",
      "db" : "reporting"
    },
    {
      "role" : "read",
      "db" : "products"
    },
    {
      "role" : "read",
      "db" : "sales"
    },
    {
      "role" : "readWrite",
      "db" : "accounts"
    }
  ],
  "inheritedRoles" : [
    {
      "role" : "readWrite",
      "db" : "accounts"
    },
    {
      "role" : "read",
      "db" : "sales"
    },
    {
      "role" : "read",
      "db" : "products"
    },
    {
      "role" : "read",
      "db" : "reporting"
    },
    {
      "role" : "mongodb-user",
      "db" : "tenants"
    }
  ],
  "inheritedPrivileges" : [
    {
      "resource" : {
        "db" : "tenants",
        "collection" : "mongodb"
      },
      "actions" : [
        "collStats",
        "find"
      ]
    },
    {
      "resource" : {
        "db" : "reporting",
        "collection" : ""
      },
      "actions" : [
        "collStats",
        "dbHash",
        "dbStats",
        "find",
        "killCursors",
        "listCollections",
        "listIndexes",
        "planCacheRead"
      ]
    },
    {
      "resource" : {
        "db" : "reporting",
        "collection" : "system.indexes"
      },
      "actions" : [
        "collStats",
        "dbHash",
        "dbStats",
        "find",
        "killCursors",
        "listCollections",
        "listIndexes",
        "planCacheRead"
      ]
    },
    {
      "resource" : {
        "db" : "reporting",
        "collection" : "system.js"
      },
      "actions" : [
        "collStats",
        "dbHash",
        "dbStats",
        "find",
        "killCursors",
        "listCollections",
        "listIndexes",
        "planCacheRead"
      ]
    },
    {
      "resource" : {
        "db" : "reporting",
        "collection" : "system.namespaces"
      },
      "actions" : [
        "collStats",
        "dbHash",
        "dbStats",
        "find",
        "killCursors",
        "listCollections",
        "listIndexes",
        "planCacheRead"
      ]
    },
    {
      "resource" : {
        "db" : "products",
        "collection" : ""
      },
      "actions" : [
        "collStats",
        "dbHash",
        "dbStats",
        "find",
        "killCursors",
        "listCollections",
        "listIndexes",
        "planCacheRead"
      ]
    },
    {
      "resource" : {
        "db" : "products",
        "collection" : "system.indexes"
      },
      "actions" : [
        "collStats",
        "dbHash",
        "dbStats",
        "find",
        "killCursors",
        "listCollections",
        "listIndexes",
        "planCacheRead"
      ]
    },
    {
      "resource" : {
        "db" : "products",
        "collection" : "system.js"
      },
      "actions" : [
        "collStats",
        "dbHash",
        "dbStats",
        "find",
        "killCursors",
        "listCollections",
        "listIndexes",
        "planCacheRead"
      ]
    },
    {
      "resource" : {
        "db" : "products",
        "collection" : "system.namespaces"
      },
      "actions" : [
        "collStats",
        "dbHash",
        "dbStats",
        "find",
        "killCursors",
        "listCollections",
        "listIndexes",
        "planCacheRead"
      ]
    },
    {
      "resource" : {
        "db" : "sales",
        "collection" : ""
      },
      "actions" : [
        "collStats",
        "dbHash",
        "dbStats",
        "find",
        "killCursors",
        "listCollections",
        "listIndexes",
        "planCacheRead"
      ]
    },
    {
      "resource" : {
        "db" : "sales",
        "collection" : "system.indexes"
      },
      "actions" : [
        "collStats",
        "dbHash",
        "dbStats",
        "find",
        "killCursors",
        "listCollections",
        "listIndexes",
        "planCacheRead"
      ]
    },
    {
      "resource" : {
        "db" : "sales",
        "collection" : "system.js"
      },
      "actions" : [
        "collStats",
        "dbHash",
        "dbStats",
        "find",
        "killCursors",
        "listCollections",
        "listIndexes",
        "planCacheRead"
      ]
    },
    {
      "resource" : {
        "db" : "sales",
        "collection" : "system.namespaces"
      },
      "actions" : [
        "collStats",
        "dbHash",
        "dbStats",
        "find",
        "killCursors",
        "listCollections",
        "listIndexes",
        "planCacheRead"
      ]
    },
    {
      "resource" : {
        "db" : "accounts",
        "collection" : ""
      },
      "actions" : [
        "collStats",
        "convertToCapped",
        "createCollection",
        "createIndex",
        "dbHash",
        "dbStats",
        "dropCollection",
        "dropIndex",
        "emptycapped",
        "find",
        "insert",
        "killCursors",
        "listCollections",
        "listIndexes",
        "planCacheRead",
        "remove",
        "renameCollectionSameDB",
        "update"
      ]
    },
    {
      "resource" : {
        "db" : "accounts",
        "collection" : "system.indexes"
      },
      "actions" : [
        "collStats",
        "dbHash",
        "dbStats",
        "find",
        "killCursors",
        "listCollections",
        "listIndexes",
        "planCacheRead"
      ]
    },
    {
      "resource" : {
        "db" : "accounts",
        "collection" : "system.js"
      },
      "actions" : [
        "collStats",
        "convertToCapped",
        "createCollection",
        "createIndex",
        "dbHash",
        "dbStats",
        "dropCollection",
        "dropIndex",
        "emptycapped",
        "find",
        "insert",
        "killCursors",
        "listCollections",
        "listIndexes",
        "planCacheRead",
        "remove",
        "renameCollectionSameDB",
        "update"
      ]
    },
    {
      "resource" : {
        "db" : "accounts",
        "collection" : "system.namespaces"
      },
      "actions" : [
        "collStats",
        "dbHash",
        "dbStats",
        "find",
        "killCursors",
        "listCollections",
        "listIndexes",
        "planCacheRead"
      ]
    }
  ]
};

var USER_INFO_LISTDB_ONLY = {
  "_id" : "admin.listy",
  "user" : "listy",
  "db" : "admin",
  "roles" : [
    {
      "role" : "onlyListDBs",
      "db" : "admin"
    }
  ],
  "inheritedRoles" : [
    {
      "role" : "onlyListDBs",
      "db" : "admin"
    }
  ],
  "inheritedPrivileges" : [
    {
      "resource" : {
        "cluster" : true
      },
      "actions" : [
        "listDatabases"
      ]
    }
  ]
};

var BUILD_INFO_OLD = {
  "version" : "2.6.11",
  "gitVersion" : "d00c1735675c457f75a12d530bee85421f0c5548 modules: enterprise",
  "OpenSSLVersion" : "OpenSSL 1.0.1f 6 Jan 2014",
  "sysInfo" : "Linux ip-10-203-203-194 3.13.0-24-generic #46-Ubuntu SMP Thu Apr 10 19:11:08 UTC 2014 x86_64 BOOST_LIB_VERSION=1_49",
  "loaderFlags" : "-fPIC -pthread -Wl,-z,now -rdynamic -Wl,-Bsymbolic-functions -Wl,-z,relro -Wl,-z,now -Wl,-E",
  "compilerFlags" : "-Wnon-virtual-dtor -Woverloaded-virtual -fPIC -fno-strict-aliasing -ggdb -pthread -Wall -Wsign-compare -Wno-unknown-pragmas -Winvalid-pch -pipe -Werror -O3 -Wno-unused-local-typedefs -Wno-unused-function -Wno-deprecated-declarations -fno-builtin-memcmp",
  "allocator" : "tcmalloc",
  "versionArray" : [
    2,
    6,
    11,
    0
  ],
  "javascriptEngine" : "V8",
  "bits" : 64,
  "debug" : false,
  "maxBsonObjectSize" : 16777216,
  "ok" : 1
};

var BUILD_INFO_3_2 = {
  "version" : "3.2.0-rc2",
  "gitVersion" : "8a3acb42742182c5e314636041c2df368232bbc5",
  "modules" : [
    "enterprise"
  ],
  "allocator" : "system",
  "javascriptEngine" : "mozjs",
  "sysInfo" : "deprecated",
  "versionArray" : [
    3,
    2,
    0,
    -48
  ],
  "openssl" : {
    "running" : "OpenSSL 0.9.8zg 14 July 2015",
    "compiled" : "OpenSSL 0.9.8y 5 Feb 2013"
  },
  "buildEnvironment" : {
    "distmod" : "",
    "distarch" : "x86_64",
    "cc" : "gcc: Apple LLVM version 5.1 (clang-503.0.40) (based on LLVM 3.4svn)",
    "ccflags" : "-fno-omit-frame-pointer -fPIC -fno-strict-aliasing -ggdb -pthread -Wall -Wsign-compare -Wno-unknown-pragmas -Winvalid-pch -Werror -O2 -Wno-unused-function -Wno-unused-private-field -Wno-deprecated-declarations -Wno-tautological-constant-out-of-range-compare -Wno-unused-const-variable -Wno-missing-braces -mmacosx-version-min=10.7 -fno-builtin-memcmp",
    "cxx" : "g++: Apple LLVM version 5.1 (clang-503.0.40) (based on LLVM 3.4svn)",
    "cxxflags" : "-Wnon-virtual-dtor -Woverloaded-virtual -stdlib=libc++ -std=c++11",
    "linkflags" : "-fPIC -pthread -Wl,-bind_at_load -mmacosx-version-min=10.7 -stdlib=libc++ -fuse-ld=gold",
    "target_arch" : "x86_64",
    "target_os" : "osx"
  },
  "bits" : 64,
  "debug" : false,
  "maxBsonObjectSize" : 16777216,
  "storageEngines" : [
    "devnull",
    "ephemeralForTest",
    "inMemory",
    "mmapv1",
    "wiredTiger"
  ],
  "ok" : 1
};

module.exports = {
  HOST_INFO: HOST_INFO,
  BUILD_INFO_OLD: BUILD_INFO_OLD,
  BUILD_INFO_3_2: BUILD_INFO_3_2,
  USER_INFO_JOHN: USER_INFO_JOHN,
  USER_INFO_LISTDB_ONLY: USER_INFO_LISTDB_ONLY
};
