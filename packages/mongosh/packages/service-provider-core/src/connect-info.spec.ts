/* eslint camelcase: 0, camelcase: 0 */
import { expect } from 'chai';
import getConnectInfo from './connect-info';

describe('getConnectInfo', function() {
  const BUILD_INFO = {
    'version': '3.2.0-rc2',
    'gitVersion': '8a3acb42742182c5e314636041c2df368232bbc5',
    'modules': [
      'enterprise'
    ],
    'allocator': 'system',
    'javascriptEngine': 'mozjs',
    'sysInfo': 'deprecated',
    'versionArray': [
      3,
      2,
      0,
      -48
    ],
    'openssl': {
      'running': 'OpenSSL 0.9.8zg 14 July 2015',
      'compiled': 'OpenSSL 0.9.8y 5 Feb 2013'
    },
    'buildEnvironment': {
      'distmod': '',
      'distarch': 'x86_64',
      'cc': 'gcc: Apple LLVM version 5.1 (clang-503.0.40) (based on LLVM 3.4svn)',
      'ccflags': '-fno-omit-frame-pointer -fPIC -fno-strict-aliasing -ggdb -pthread -Wall -Wsign-compare -Wno-unknown-pragmas -Winvalid-pch -Werror -O2 -Wno-unused-function -Wno-unused-private-field -Wno-deprecated-declarations -Wno-tautological-constant-out-of-range-compare -Wno-unused-const-variable -Wno-missing-braces -mmacosx-version-min=10.7 -fno-builtin-memcmp',
      'cxx': 'g++: Apple LLVM version 5.1 (clang-503.0.40) (based on LLVM 3.4svn)',
      'cxxflags': '-Wnon-virtual-dtor -Woverloaded-virtual -stdlib=libc++ -std=c++11',
      'linkflags': '-fPIC -pthread -Wl,-bind_at_load -mmacosx-version-min=10.7 -stdlib=libc++ -fuse-ld=gold',
      'target_arch': 'x86_64',
      'target_os': 'osx'
    },
    'bits': 64,
    'debug': false,
    'maxBsonObjectSize': 16777216,
    'storageEngines': [
      'devnull',
      'ephemeralForTest',
      'inMemory',
      'mmapv1',
      'wiredTiger'
    ],
    'ok': 1
  };

  const CMD_LINE_OPTS = {
    'argv': [
      '/opt/mongodb-osx-x86_64-enterprise-3.6.3/bin/mongod',
      '--dbpath=/Users/user/testdata'
    ],
    'parsed': {
      'storage': {
        'dbPath': '/Users/user/testdata'
      }
    },
    'ok': 1
  };

  const ATLAS_VERSION = {
    'atlasVersion': '20210330.0.0.1617063608',
    'gitVersion': '8f7e5bdde713391e8123a463895bb7fb660a5ffd'
  };

  const TOPOLOGY_WITH_CREDENTIALS = {
    's': {
      'credentials': {
        'mechanism': 'LDAP'
      }
    }
  };

  const TOPOLOGY_NO_CREDENTIALS = {
    's': {}
  };

  const ATLAS_URI = 'mongodb+srv://admin:catscatscats@cat-data-sets.cats.example.net/admin';

  it('reports on an enterprise version >=3.2 of mongodb with credentials', function() {
    const output = {
      is_atlas: true,
      is_localhost: false,
      server_version: '3.2.0-rc2',
      mongosh_version: '0.0.6',
      is_enterprise: true,
      auth_type: 'LDAP',
      is_data_lake: false,
      dl_version: null,
      atlas_version: '20210330.0.0.1617063608',
      is_genuine: true,
      non_genuine_server_name: 'mongodb',
      server_arch: 'x86_64',
      node_version: process.version,
      server_os: 'osx',
      uri: ATLAS_URI
    };
    expect(getConnectInfo(
      ATLAS_URI,
      '0.0.6',
      BUILD_INFO,
      CMD_LINE_OPTS,
      ATLAS_VERSION,
      TOPOLOGY_WITH_CREDENTIALS)).to.deep.equal(output);
  });

  it('reports on an enterprise version >=3.2 of mongodb with no credentials', function() {
    const output = {
      is_atlas: true,
      is_localhost: false,
      server_version: '3.2.0-rc2',
      mongosh_version: '0.0.6',
      is_enterprise: true,
      auth_type: null,
      is_data_lake: false,
      dl_version: null,
      atlas_version: '20210330.0.0.1617063608',
      is_genuine: true,
      non_genuine_server_name: 'mongodb',
      server_arch: 'x86_64',
      node_version: process.version,
      server_os: 'osx',
      uri: ATLAS_URI
    };
    expect(getConnectInfo(
      ATLAS_URI,
      '0.0.6',
      BUILD_INFO,
      CMD_LINE_OPTS,
      ATLAS_VERSION,
      TOPOLOGY_NO_CREDENTIALS)).to.deep.equal(output);
  });

  it('reports correct information when an empty uri is passed', function() {
    const output = {
      is_atlas: false,
      is_localhost: false,
      server_version: '3.2.0-rc2',
      mongosh_version: '0.0.6',
      is_enterprise: true,
      auth_type: 'LDAP',
      is_data_lake: false,
      dl_version: null,
      atlas_version: null,
      is_genuine: true,
      non_genuine_server_name: 'mongodb',
      server_arch: 'x86_64',
      node_version: process.version,
      server_os: 'osx',
      uri: ''
    };
    expect(getConnectInfo(
      '',
      '0.0.6',
      BUILD_INFO,
      CMD_LINE_OPTS,
      null,
      TOPOLOGY_WITH_CREDENTIALS)).to.deep.equal(output);
  });
});
