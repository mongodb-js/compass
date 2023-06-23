# Set of e2e tests for Compass application based on smoke checklist

(check marks tests that are already added to the suite)

## Connect screen

- [x] Verify can connect to cluster using connection string
- [x] Verify can connect to cluster by filling in fields manually
- [ ] Verify can add connection to favorites when connect
- [ ] Verify connect to any of recent connections
- [ ] Verify recent connections are ordered by last connect time desc (most recent at the top)
- [ ] Verify list of favorite connections
- [ ] Verify favorite connections are ordered by name asc
- [ ] Verify connect to any of favorites connections
- [ ] Verify recent item can be added to favorites
- [ ] Verify favorite connection can be updated
- [x] Verify can connect to Atlas free cluster
- [ ] Verify can connect to localhost - Username & Password
- [ ] Verify can connect to Cluster - LDAP
- [ ] Verify can connect to Cluster - SCRAM-SHA-256
- [ ] Verify can connect to Cluster - Kerberos
- [ ] Can connect to Cluster - X.509
- [ ] Verify can connect to localhost - replica set (primary node)
- [ ] Verify connect with SSH tunnel (one of the options below):
  - SSH tunnel with identity key (no passphrase)
  - SSH tunnel with identity key (with passphrase)
  - SSH tunnel with password
- [ ] Verify connect with SSL option (one of the options below):
  - TLS Unvalidated
  - TLS Server validation
  - TLS Server and client validation
- [ ] Verify no endless keychain loop
- [ ] Verify connection errors

## Instance screen: Databases tab

- [ ] Verify list of databases and their stats
- [ ] Verify Create database
- [ ] Verify database is dropped after confirmation

## Instance screen: Collections List

- [ ] Verify click the db name opens a list with its collections
- [ ] Verify Drop collection

## Instance screen: Performance tab

- [ ] Verify data on Performance tab: widgets, HOTTEST COLLECTIONS, SLOWEST OPERATIONS

## Instance screen: Sidebar

- [ ] Verify favorite item can be updated (color, name)
- [ ] Verify dbs/collections tree-view
- [ ] Verify database creation
- [ ] Verify collection creation
- [ ] Verify Drop collection using context menu option
- [ ] Verify Drop database using delete button

## Documents tab

- [ ] Verify collection stats is correct (documents count, size, indexes etc.)
- [ ] Verify import of well formatted CSV with comma separator
- [ ] Verify JSON file import
- [ ] Verify data insert in JSON mode
- [ ] Verify switching documents View between JSON, List and Table modes
- [ ] Verify document update in Table mode
- [ ] Verify buttons work on the contextual toolbar:
  - Edit
  - Delete
- [ ] Verify export collection to CSV:
  - with query specified
  - with default fields selection
- [ ] Verify export collection to JSON with:
  - no query specified
  - part of fields selected
- [ ] Verify progress of exporting:
  - progress bar reflects exporting process
  - total count of records
  - percentge of exported records
- [ ] Verify navigation through the documents using <> buttons on the action bar
- [ ] Verify running query with all available options in the filter bar
- [ ] Verify Reset button clears the filter bar out and loads all documents
- [ ] Verify query bar is shared across Documents, Schema tabs
- [ ] Verify query can be exported to language
- [ ] Verify Query History shows past queries ordered by time desc

## Aggregations tab

- [ ] Verify adding aggregation to the active stage shows correct output
- [ ] Verify saving new pipeline
- [ ] Verify load of saved pipline
- [ ] Verify View can be created
- [ ] Verify pipeline can be exported to language
- [ ] Verify that stages can be:
  - disabled
  - deleted
  - rearranged using drag&drop
  - expanded\collapsed

## Schema tab

- [ ] Verify schema Analyse with a query
- [ ] Verify results corectness of schema analysis:
  - data types
  - tooltips
  - charts
  - map for coordinates
  - percentages
- [ ] Verify Query History list is the same as on the Documents tab
- [ ] Verify items selection on the charts fills the query bar in with corresponding filter values

## Explain plan tab

- [ ] Verify explain plan run for a query covered with index
- [ ] Verify Query Performance Summary results:
  - Visual Tree
  - Raw JSON

## Indexes tab

- [ ] Verify index can be created
- [ ] Indexes can be dropped

## Validation tab

- [ ] Verify adding rules in JSON Schema
- [ ] Verify rule is working according to set options

## Compass Shell

- [ ] The Compas Shell UI: it can be opened, collapsed and resized
- [ ] Verify commands can be run in the shell
