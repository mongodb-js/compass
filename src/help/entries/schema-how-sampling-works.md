---
title: How Sampling Works
tags:
  - schema
  - sampling
---
<strong>Sampling in MongoDB Compass is the practice of selecting a subset of data from the desired collection and analyzing the documents within the sample set.</strong>

Sampling is commonly used in statistical analysis because analyzing a subset of data gives similar results to analyzing all of the data. In addition, sampling allows results to be generated quickly rather than performing a potentially long and computationally expensive collection scan.

MongoDB Compass employs two distinct sampling mechanisms.

Collections in MongoDB 3.2 are sampled via the `$sample` operator in the aggregation framework of the core server. This provides efficient random sampling without replacement over the entire collection, or over the subset of documents specified by a query.

Collections in MongoDB 3.0 and 2.6 are sampled via a backwards compatible algorithm executed entirely within Compass. It comprises three phases:

1. Query for a stream of `_id` values, limit 10000 descending by `_id`
1. Read the stream of `_ids` and save `sampleSize` randomly chosen values. We employ reservoir sampling to perform this efficiently.
1. Then query the selected random documents by `_id`

The choice of sampling method is transparent in usage to the end-user.

`sampleSize` is currently set to 100 documents.