---
title: Sampling Results
tags:
  - schema
  - sampling
  - results
related:
  - schema-how-sampling-works
  - schema-query-bar
section: Schema
---
<strong>
The message below the Query Bar provides information about the
number of documents that matched the query, and the number of documents
used for the schema report.
</strong>

There are two possible outcomes when you use the
[Query Bar](#schema-query-bar) to refine the results.

1. The query you specified matches _more than_ the sampling limit (currently
  100 documents).

  In this case, Compass samples 100 documents randomly from
  the matching documents, and builds a schema report based on that sample.
  You will see a message that provides both the number of matched documents
  and the size of the sample set. Example:

  ![](./images/help/schema/sampling-results-sample.png)

2. The query you specified matches _less than or equal to_ the sampling limit
  (currently 100 documents).

  In this case, Compass uses all matched documents
  to build a schema report. You will see a message that provides the number
  of matched documents. Example:

  ![](./images/help/schema/sampling-results-full.png)
