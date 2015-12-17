# MongoDB Compass 1.0 manual test plan

Author: Matt Kangas  
Last revised: Dec 17, 2015

Revision history:

- 2015-12-17: First markdown version

## 1. Smoke test

- Connect to any local non-authenticated mongod
- Click a collection
- Click into document viewer

## 2. Clear history

Stop Compass.

On OS X:  
`rm -rf ~/Library/Application\ Support/mongodb-compass/IndexedDB`

On Windows: from cygwin  
`rm -rf ~/AppData/Roaming/mongodb-compass/IndexedDb`

Restart

## 3. First run

- Reconnect to any local non-authenticated mongod
- Verify that "tour" launches
- Verify that "opt-in" panel blocks usage of app until user agrees

## 4. mongodb 3.0 standalone + SCRAM-SHA1 + limited roles

| host     | `standalone.compass-test-1.mongodb.parts` |
| -------- | ----------------------------------------- |
| port     | 27000                                     |
| auth     | Username/Password                         |
| username | fanclub                                   |
| password | powerbook@17                              |
| database | mongodb                                   |

- Verify you have access to the "mongodb.fanclub" collection
- Select "fanclub" collection
- Click into document viewer

## 5. mongodb 3.0 standalone + SCRAM-SHA1 + readAnyDatabase

|   host   | `standalone.compass-test-1.mongodb.parts` |
| -------- | ----------------------------------------- |
| port     | 27000                                     |
| auth     | Username/Password                         |
| username | **compass**                               |
| password | powerbook@17                              |
| database |                                           |

- Verify you have access to the "00README.THIS_IS_STANDALONE30" collection
- Verify you have access to the "mongodb.fanclub" collection
- Select "fanclub" collection
- Drag a region on the _id field. "Apply" query.
- Click into document viewer

## 6. mongodb 2.6 standalone + MONGODB-CR + limited roles

|   host   | `standalone.compass-test-1.mongodb.parts` |
| -------- | ----------------------------------------- |
| port     | **26000**                                 |
| auth     | Username/Password                         |
| username | fanclub                                   |
| password | powerbook@17                              |
| database | mongodb                                   |

- Verify you have access to the "mongodb.fanclub" collection
- Select "fanclub" collection
- Click into document viewer

## 7. mongodb 3.0 replicaset + restricted role

|   host   | `replset-0.compass-test-1.mongodb.parts` |
| -------- | ---------------------------------------- |
| port     | 27000                                    |
| auth     | Username/Password                        |
| username | fanclub                                  |
| password | powerbook@17                             |
| database | mongodb                                  |

- Verify you have access to the "mongodb.fanclub" collection
- Select "fanclub" collection
- Click into document viewer


## 8. mongodb 2.6 replicaset + restricted role

|   host   | `replset-0.compass-test-1.mongodb.parts` |
| -------- | ---------------------------------------- |
| port     | 26000                                    |
| auth     | Username/Password                        |
| username | fanclub                                  |
| password | powerbook@17                             |
| database | mongodb                                  |

- Verify you have access to the "mongodb.fanclub" collection
- Select "fanclub" collection
- Click into document viewer

## 9. mongodb 3.0 mongos + restricted role

|   host   | `replset-0.compass-test-1.mongodb.parts` |
| -------- | ---------------------------------------- |
| port     | **28017**                                    |
| auth     | Username/Password                        |
| username | fanclub                                  |
| password | powerbook@17                             |
| database | mongodb                                  |

- Verify you have access to the "mongodb.fanclub" collection
- Select "fanclub" collection
- Click into document viewer


## 10. mongodb 2.6 mongos + restricted role

|      host      | `replset-0.compass-test-1.mongodb.parts` |
| -------------- | ---------------------------------------- |
| Port           | **26017**                              |
| Authentication | Username / Password                      |
| Username       | fanclub                                  |
| Password       | powerbook@17                             |
| Database       | mongodb                                  |

- Verify you have access to the "mongodb.fanclub" collection
- Select "fanclub" collection
- Click into document viewer

## 11. mongodb 3.0 SSL (most stringent options)

|          host         | `standalone.compass-test-2.mongodb.parts` |
| --------------------- | ----------------------------------------- |
| Port                  | 27000                                     |
| Authentication        | Username/Password                         |
| Username              | compass                                   |
| Password              | powerbook@17                              |
| SSL                   | Server and Client Validation              |
| Certificate Authority | compass_testing/Certs/ca.pem              |
| Client Certificate    | compass_testing/Certs/client.pem          |
| Client Private Key    | compass_testing/Certs/client.pem          |

- Verify that you can connect and see at least one collection

## 12. mongodb 2.6 LDAP

First verify you are on the NYC office network or connected to VPN.

|      host      | `ldaptest.10gen.cc` |
| -------------- | ------------------- |
| Port           |                     |
| Authentication | LDAP                |
| Username       | drivers-team        |
| Password       | mongor0x$xgen       |
| SSL            | Off                 |

- Verify that you can connect
- Verify you see "The MongoDB instance you are connected to does not contain any collections"

## 13. mongodb 2.6 Kerberos - OS X CLIENT

First verify you are on the NYC office network or connected to VPN.

On an OS X: type in a Terminal window

`kinit -p drivers@LDAPTEST.10GEN.CC`

Type password "powerbook17"

Now connect:

|      host      |    `ldaptest.10gen.cc`    |
| -------------- | ------------------------- |
| Port           |                      |
| Authentication | Kerberos                  |
| Principal      | drivers@LDAPTEST.10GEN.CC |
| Password       |                           |
| Service Name   |                           |
| SSL            | Off                       |

- Verify that you can connect
- Verify you see "The MongoDB instance you are connected to does not contain any collections"

## 14. mongodb 2.6 Kerberos - WINDOWS CLIENT

**Prerequisites**

- Verify you are on the NYC office network or connected to VPN.
- Verify you have added a registry entry for `HKLM\SYSTEM\ControlSet001\Control\Lsa\Kerberos\Domains\LDAPTEST.10GEN.CC` as described on https://wiki.mongodb.com/display/DE/Testing+Kerberos

Now connect:

|      host      |    `ldaptest.10gen.cc`    |
| -------------- | ------------------------- |
| Port           |                      |
| Authentication | Kerberos                  |
| Principal      | drivers@LDAPTEST.10GEN.CC |
| Password       | powerbook17               |
| Service Name   |                           |
| SSL            | Off                       |

- Verify that you can connect
- Verify you see "The MongoDB instance you are connected to does not contain any collections"


## References

Obtain SSL certificates here:
https://x509gen.mongodb.com/official.zip

HOWTO test Kerberos
https://wiki.mongodb.com/display/DE/Testing+Kerberos

HOWTO test LDAP
https://wiki.mongodb.com/display/DE/Testing+LDAP