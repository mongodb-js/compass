---
title: Long Running Queries
tags:
  - schema
  - sampling
  - maxTimeMS
  - precaution
section: Schema
related:
  - schema-how-sampling-works
---

<strong>As a precaution, Compass aborts long running queries to prevent excessive querying on your database.</strong>

### Slow Sampling

All queries that Compass sends to your MongoDB instance have a [timeout flag][maxtimems-docs] set which automatically aborts a request if it takes longer than the specified timeout. This timeout is currently set to 10 seconds. If [sampling](#schema-how-sampling-works) on the database takes longer, Compass will notify you about the timeout and give you the options of (a) retrying with a longer timeout (60 seconds) or (b) running a different query.

Note that sampling time may be affected by a number of factors, like load on the server, number of documents and existence of a suitable index for your query.

It is recommended that you only increase the sampling timeout if you are not connected to a production instance, as this may negatively affect the performance and response time of your database.

### Slow Schema Analysis

If the database returns documents faster than the specified timeout (10 or 60 seconds), but schema analysis of the documents takes longer than expected (due to complex, large documents), Compass will instead give you the option to abort the analysis step and show the partial results.

[maxtimems-docs]: https://docs.mongodb.org/manual/reference/method/cursor.maxTimeMS/#cursor.maxTimeMS
