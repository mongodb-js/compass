# Taxonomy

The [docs style guide][docs-style] has a beautifully detailed and thorough
taxonomy which covers most of the tech taxonomy and it is strongly recommended
you spend some time reviewing it.

## mongoscope

```
i.fa.fa-fw.fa-scope
```

Consider synonymous with web admin, webmin, web ui, 28017,
"dbwebserver.cpp", etc.  This is the product you're most likely working on
if your name begins with an "L" and sounds like "mucus".

## deployment

```
i.fa.fa-fw.fa-leaf
```

1 or more instances that make up a descrete unit of infrastructure.
There are 3 types of deployments:

### standalone

```
i.fa.fa-fw.fa-store
```

Only instance is a store instance.

### replicaset

```
i.fa.fa-fw.fa-replicaset
```

3 or more store instances and 0 or more arbiter instances.

### cluster

```
i.fa.fa-fw.fa-cluster
```

A deployment with sharding enabled.  Made up of 1 or more router instances, and general 2 or more replica sets.

## instance

A MongoDB process.

### router

```
i.fa.fa-fw.fa-router
```

A mongos process.

### config

```
i.fa.fa-fw.fa-config
```

A mongod process running as a config server for routers.

### store

```
i.fa.fa-fw.fa-store
```

A vanilla mongod process running as part of a standlone or replica set.

## dataset

### database

### collection

### index

### document

## [System](http://en.wikipedia.org/wiki/System) (wip.  whats it called in the kernel?)

### Replication

The active distributed-system providing fault-tolerance.

#### oplog

The element of replication that stores all operations and powers the oplog synchronization subsystem.

#### oplog synchronization

The subsystem by which members communicate.

#### election

#### member

##### primary

##### secondary

##### arbiter

### Sharding

#### routing

#### shard

#### balancing

#### chunk

#### chunk migration

[docs-style]: http://docs.mongodb.org/manual/meta/style-guide/#jargon-and-common-terms
