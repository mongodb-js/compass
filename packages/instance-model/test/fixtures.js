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


var USER_INFO = {
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
				"anyResource" : true
			},
			"actions" : [
				"listCollections"
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

module.exports = {
  HOST_INFO: HOST_INFO,
	USER_INFO: USER_INFO
};
