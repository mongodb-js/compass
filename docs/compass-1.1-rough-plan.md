# Compass 1.1 Rough Plan

Author: Matt Kangas  
Last Updated: 2015-12-18

AKA "Scope Document", but we already have another thing called "Scope"...

**Major goals for 1.1 (due Jan 31)**

- Sample size is 1000 documents
- Automatic updates with three release "channels" (stable,testing,canary)

Below is a sketch of subtasks required to complete these.

## 1000 documents sample size

- Perfjankie to measure performance
    - Port to use MongoDB, not CouchDB
    - Stand up a server for collecting perf test results
- client/server tuning (Durran)
- mongodb-sample module:
    - test $sample with 1000 docs on both mmapv1 and wiredtiger
    - pre-3.2 sampling: batch finds into multiple $in queries. (currently issues one .find() per document, parallelized)
- mongodb-schema module: process sample in approximately constant memory
    - Don't retain copies of full documents. DO retain all _id values.
    - For the following, either: retain all values OR aggregate & pre-bin
        - ObjectId
        - numeric values (for bar charts)
        - Geo values
    - May need to parallelize the parsing of documents for performance (e.g. service workers)
- Compass: Fix charts to to work when full docs not present
    - ObjectId "bar chart"
    - Numeric bar chart (binning)
    - Geo
    - UI tests for minicharts
- Compass: Document viewer improvements
    - Build "doc viewer" DOM only after the panel is opened, not during processing
    - "Infiniscroll": lazily build DOM
    - Read documents from a query cursor, not directly from schema
    - Rewrite doc viewer with React/Redux?
    - UI tests for document viewer
- Incremental sampling with UI updates
    - UX studies on how to best update UI while the user is interacting with it
    - Implement redraw() functionality on all UI elements in the main view
    - Rewrite main view (FieldList, TypeList, Minicharts) with React/Redux?

Bulk of above copied from Thomas' [Requirements for sampling 1000+ docs][1000-docs-requirements-gdoc] Google Drive doc.

## Automatic updates

- Automate the builds entirely
    - Move to downloads.mongodb.com
    - Sign OS X builds on EVG (INT-250)
    - ... add anything else needed to automate
- Deploy Squirrel server
    - Implement channels
    - Find it a permanent home
    - 1 box or scalable?
    - HTTPS certificate
    - Security review
- Get updates on channel
    - User preferences for enabling updates, selecting channel
    - Reenable Squirrel client
- Ensure build integrity
    - "Real" OS X signing
    - Preemptive virus scans
    - Reproducible (cryptographically auditable) builds. (OUT OF SCOPE)
- Release notes visible in app
- TEST IT
    - On Windows
    - On OS X

---

[1000-docs-requirements-gdoc]: https://docs.google.com/a/10gen.com/document/d/1SrXIVUryuANeNxF4I7uoLZoe1JjdnKscjOdALFv-I5M/edit?usp=sharing
