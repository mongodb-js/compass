# Tool Call Eval Dataset v2 — Proposed Cases

## Dataset Profile

| Dimension          | Current (v1) | Proposed (v2) |
| ------------------ | ------------ | ------------- |
| Total cases        | 46           | ~80           |
| Complexity: Easy   | 46           | 46 (existing) |
| Complexity: Medium | 0            | ~15           |
| Complexity: Hard   | 0            | ~16           |
| Multi-turn         | 0            | ~8            |
| Edge cases         | 0            | ~6            |

---

## Medium Complexity Cases

Cases where the model needs to reason about context, pick between similar tools, or infer information not explicitly stated.

### M1: Infer tool from indirect request

- **Prompt**: "Why is this query slow?"
- **Context**: currentQuery: `{ filter: { year: { $gte: 1990 } } }`
- **Expected**: `get-current-query` then `explain` (model must fetch the query first since it's not in the prompt — only available via the tool)
- **Tags**: `explain`, `get-current-query`, `medium`, `inference`, `multi-tool`
- **Why medium**: User doesn't say "explain" — model must infer performance analysis intent and retrieve the query before explaining it

### M2: Pick right tool between schema and indexes

- **Prompt**: "What's the structure of this sales collection — fields and indexes?"
- **Context**: sample_supplies.sales
- **Expected**: `collection-schema` + `collection-indexes` (both)
- **Tags**: `collection-schema`, `collection-indexes`, `medium`, `multi-tool`
- **Why medium**: Single question requires two tools

### M3: Context-aware database selection

- **Prompt**: "Show me collections in the airbnb database."
- **Context**: clusterUid points to sample_mflix (user is on a different db than what they're asking about)
- **Expected**: `list-collections` with database arg `sample_airbnb`
- **Tags**: `list-collections`, `medium`, `context-mismatch`
- **Why medium**: Model must use the database from the prompt, not the current context

### M4: Pipeline optimization request

- **Prompt**: "Can you make this pipeline faster?"
- **Context**: currentPipeline: `[{ $group: { _id: "$year", count: { $sum: 1 } } }, { $sort: { count: -1 } }]`
- **Expected**: `get-current-pipeline`
- **Tags**: `get-current-pipeline`, `medium`, `inference`
- **Why medium**: "faster" implies optimization, model must first retrieve the pipeline

### M5: Count with implicit filter

- **Prompt**: "How many horror movies do we have?"
- **Context**: sample_mflix.movies
- **Expected**: `count` with filter referencing genres
- **Tags**: `count`, `medium`, `implicit-filter`
- **Why medium**: Model must construct a filter from natural language

### M6: Explain a specific query

- **Prompt**: "Will a query filtering on year and sorting by rating use an index?"
- **Context**: sample_mflix.movies
- **Expected**: `explain` with appropriate query args
- **Tags**: `explain`, `medium`, `constructed-query`
- **Why medium**: Model must construct the query to explain from the user's description

### M7: Storage comparison

- **Prompt**: "Which takes more space — the movies collection or the database overall?"
- **Context**: sample_mflix.movies
- **Expected**: `collection-storage-size` + `db-stats` (both)
- **Tags**: `collection-storage-size`, `db-stats`, `medium`, `multi-tool`
- **Why medium**: Requires two different tools to answer a comparison question

### M8: Get current query and improve it

- **Prompt**: "Look at what I have in the query bar and tell me if there's a better way to write it."
- **Context**: currentQuery: `{ filter: { $and: [{ year: { $gte: 2000 } }, { year: { $lte: 2010 } }] } }`
- **Expected**: `get-current-query`
- **Tags**: `get-current-query`, `medium`, `optimization`
- **Why medium**: Model must retrieve the query before analyzing it

### M9: Aggregate with natural language

- **Prompt**: "What's the average IMDB rating per genre?"
- **Context**: sample_mflix.movies
- **Expected**: `aggregate` with pipeline using $unwind, $group, $avg
- **Tags**: `aggregate`, `medium`, `natural-language-query`
- **Why medium**: Model must translate analytical question into aggregation pipeline

### M10: Find with multiple conditions

- **Prompt**: "Show me R-rated movies from the 90s with ratings above 8"
- **Context**: sample_mflix.movies
- **Expected**: `find` with filter combining rated, year range, and imdb.rating
- **Tags**: `find`, `medium`, `compound-filter`
- **Why medium**: Multiple filter conditions must be combined correctly

### M11: Database exploration sequence

- **Prompt**: "I just connected — walk me through what data is available."
- **Context**: eval-test-cluster
- **Expected**: `list-databases` (at minimum, possibly followed by `list-collections`)
- **Tags**: `list-databases`, `medium`, `exploration`
- **Why medium**: Open-ended request, model must choose appropriate exploration tools

### M12: Logs for troubleshooting

- **Prompt**: "The database seems slow today. Can you check if anything unusual is happening?"
- **Context**: sample_mflix.movies
- **Expected**: `mongodb-logs`
- **Tags**: `mongodb-logs`, `medium`, `inference`
- **Why medium**: "slow" and "unusual" must be mapped to checking logs

### M13: Schema before query

- **Prompt**: "I want to query this restaurants collection but I don't know what fields are available. Then find the first 3 Brooklyn restaurants."
- **Context**: sample_restaurants.restaurants
- **Expected**: `collection-schema` then `find` (with borough filter + limit)
- **Tags**: `collection-schema`, `find`, `medium`, `multi-tool`, `sequential`
- **Why medium**: Explicit two-step request with dependency between steps

### M14: Index coverage check

- **Prompt**: "Am I missing any indexes for queries filtering by borough and cuisine?"
- **Context**: sample_restaurants.restaurants
- **Expected**: `collection-indexes`
- **Tags**: `collection-indexes`, `medium`, `inference`
- **Why medium**: "missing indexes" maps to checking existing indexes, not creating them

### M15: Current pipeline stage count

- **Prompt**: "How many stages does my current aggregation have?"
- **Context**: currentPipeline with 4 stages
- **Expected**: `get-current-pipeline`
- **Tags**: `get-current-pipeline`, `medium`, `inference`
- **Why medium**: Model must retrieve pipeline to answer a question about it

---

## Hard Complexity Cases

Cases with ambiguous intent, multiple valid interpretations, or tricky reasoning requirements.

### H1: Ambiguous "tell me about"

- **Prompt**: "Tell me everything about the weather observations collection."
- **Context**: sample_weatherdata.data
- **Expected**: Multiple tools — `collection-schema`, `collection-indexes`, `collection-storage-size`, `count` (order flexible)
- **Tags**: `hard`, `multi-tool`, `ambiguous`
- **Why hard**: "Everything" is vague — model must decide which tools give a complete picture

### H2: Write request refusal

- **Prompt**: "Delete all movies from before 1950."
- **Context**: sample_mflix.movies
- **Expected**: No tool calls (assistant should explain tools are read-only)
- **Tags**: `hard`, `refusal`, `no-tool`
- **Why hard**: Model must recognize this requires a write operation and refuse

### H3: Insert request refusal

- **Prompt**: "Add a new movie called 'Test Movie' with year 2024."
- **Context**: sample_mflix.movies
- **Expected**: No tool calls
- **Tags**: `hard`, `refusal`, `no-tool`
- **Why hard**: Model must refuse write operations

### H4: Ambiguous size question

- **Prompt**: "How big is this?"
- **Context**: sample_mflix.movies (user is on a collection tab)
- **Expected**: `collection-storage-size` (since user is on a collection, not database level)
- **Tags**: `hard`, `ambiguous`, `collection-storage-size`
- **Why hard**: "This" and "big" are both ambiguous — model must use tab context

### H5: Red herring — docs question, no tool needed

- **Prompt**: "What's the difference between $match and $filter in aggregation pipelines?"
- **Context**: sample_mflix.movies
- **Expected**: No tool calls (pure documentation question)
- **Tags**: `hard`, `no-tool`, `docs-question`
- **Why hard**: Model must recognize this is a knowledge question, not a data question

### H6: Contradictory context

- **Prompt**: "Run a find query on the users collection."
- **Context**: sample_mflix.movies (user is on movies, not users)
- **Expected**: `find` with collection arg `users` (or model asks for clarification)
- **Tags**: `hard`, `context-mismatch`, `find`
- **Why hard**: Prompt names a different collection than context — model must decide which to use

### H7: Complex multi-tool diagnostic

- **Prompt**: "My aggregation pipeline is returning unexpected results. Help me debug it."
- **Context**: currentPipeline: `[{ $match: { year: 2004 } }, { $group: { _id: "$genres", count: { $sum: 1 } } }]`
- **Expected**: `get-current-pipeline`, then potentially `aggregate` or `collection-schema`
- **Tags**: `hard`, `multi-tool`, `debugging`
- **Why hard**: Debugging requires retrieving the pipeline, understanding it, and potentially running diagnostic queries

### H8: Non-English prompt

- **Prompt**: "Quais bancos de dados estao disponiveis neste cluster?"
- **Context**: eval-test-cluster
- **Expected**: `list-databases`
- **Tags**: `hard`, `non-english`, `list-databases`
- **Why hard**: Portuguese prompt — model must understand intent across languages

### H9: find vs aggregate — sorting belongs to find

- **Prompt**: "Show me the 5 most recent movies."
- **Context**: sample_mflix.movies
- **Expected**: `find` with sort `{ year: -1 }` and limit `5` (NOT `aggregate`)
- **Tags**: `hard`, `find`, `find-vs-aggregate`
- **Why hard**: Tempts the model toward `aggregate` with `$sort`/`$limit`, but this is a simple `find` with sort and limit args — model must pick the simpler tool

### H10: find on a deeply nested field

- **Prompt**: "Find airbnb listings where the cleanliness review score is above 9."
- **Context**: sample_airbnb.listingsAndReviews
- **Expected**: `find` with filter `{ "review_scores.review_scores_cleanliness": { $gt: 9 } }`
- **Tags**: `hard`, `find`, `nested-field`
- **Why hard**: Model must know or infer the deeply nested path `review_scores.review_scores_cleanliness` — it's not obvious from the prompt

### H11: find with $all on an array field

- **Prompt**: "Find movies that are both Action and Comedy."
- **Context**: sample_mflix.movies
- **Expected**: `find` with filter `{ genres: { $all: ["Action", "Comedy"] } }`
- **Tags**: `hard`, `find`, `array-operator`
- **Why hard**: "Both X and Y" on an array field requires `$all`, not a simple equality match — model must choose the right operator

### H12: find with projection

- **Prompt**: "Show me just the title and year of the 10 newest movies, nothing else."
- **Context**: sample_mflix.movies
- **Expected**: `find` with projection `{ title: 1, year: 1, _id: 0 }`, sort `{ year: -1 }`, limit `10`
- **Tags**: `hard`, `find`, `projection`
- **Why hard**: "Nothing else" requires a restrictive projection including `_id: 0` — tests that model uses the projection argument correctly alongside sort and limit

### H13: aggregate $lookup across collections

- **Prompt**: "Which movies have the most user comments? Show me the top 5."
- **Context**: sample_mflix.movies
- **Expected**: `aggregate` with a pipeline including `$lookup` joining to the `comments` collection, then `$project`/`$addFields` to count, `$sort`, `$limit: 5`
- **Tags**: `hard`, `aggregate`, `lookup`, `cross-collection`
- **Why hard**: Requires knowing there is a `comments` collection and constructing a `$lookup` join — cross-collection reasoning not hinted at in the prompt

### H14: aggregate $unwind on array field

- **Prompt**: "What are the 10 most common item tags across all sales?"
- **Context**: sample_supplies.sales
- **Expected**: `aggregate` with `$unwind: "$items"`, `$unwind: "$items.tags"`, `$group: { _id: "$items.tags", count: { $sum: 1 } }`, `$sort: { count: -1 }`, `$limit: 10`
- **Tags**: `hard`, `aggregate`, `unwind`, `array-field`
- **Why hard**: Requires multiple `$unwind` stages to flatten nested arrays before grouping — a common but non-obvious aggregation pattern

### H15: complex find — multi-condition with sort, not aggregate

- **Prompt**: "Show me R-rated movies featuring Tom Hanks released after 2000, sorted by IMDB rating descending."
- **Context**: sample_mflix.movies
- **Expected**: `find` with filter `{ rated: "R", cast: "Tom Hanks", year: { $gt: 2000 } }`, sort `{ "imdb.rating": -1 }` (NOT `aggregate`)
- **Tags**: `hard`, `find`, `compound-filter`, `find-vs-aggregate`
- **Why hard**: Multiple compound conditions across different fields plus a sort; model must still reach for `find`, not `aggregate`, and correctly filter an array field (`cast`) with direct equality

### H16: aggregate $bucket

- **Prompt**: "Group the airbnb listings into price brackets: under $50, $50–$150, $150–$300, and over $300."
- **Context**: sample_airbnb.listingsAndReviews
- **Expected**: `aggregate` with a `$bucket` stage: `{ $bucket: { groupBy: "$price", boundaries: [0, 50, 150, 300], default: "300+" } }`
- **Tags**: `hard`, `aggregate`, `bucket`
- **Why hard**: Explicit bucketing semantics require `$bucket` — model must construct the right stage with correct boundaries and a `default` bucket for the overflow case

---

## Multi-Turn Conversation Cases

Cases with multiple user/assistant exchanges in the input messages, simulating real conversation flow.

### MT1: Schema then query follow-up

- **Messages**:
  1. User: "What does the movies collection look like?"
  2. Assistant: "The movies collection has fields: title (string), year (number), genres (array)..."
  3. User: "Great, now find me all the sci-fi movies."
- **Expected**: `find` (not `collection-schema` again)
- **Tags**: `multi-turn`, `find`, `follow-up`

### MT2: Correction flow

- **Messages**:
  1. User: "Show me the schema for the movies collection."
  2. Assistant: [calls collection-schema, shows result]
  3. User: "Sorry, I meant the listingsAndReviews collection instead."
- **Expected**: `collection-schema` with database `sample_airbnb`, collection `listingsAndReviews`
- **Tags**: `multi-turn`, `collection-schema`, `correction`

### MT3: Drill-down exploration

- **Messages**:
  1. User: "What databases are available?"
  2. Assistant: "I found: sample_mflix, sample_airbnb, sample_restaurants, sample_supplies, sample_weatherdata..."
  3. User: "What's in sample_mflix?"
  4. Assistant: "Collections: movies, comments, users..."
  5. User: "How many movies are there?"
- **Expected**: `count` with database `sample_mflix`, collection `movies`
- **Tags**: `multi-turn`, `count`, `exploration`

### MT4: Query refinement

- **Messages**:
  1. User: "Find movies from 2004."
  2. Assistant: [calls find, returns results]
  3. User: "Now narrow that down to just documentaries."
- **Expected**: `find` with filter combining year and genre
- **Tags**: `multi-turn`, `find`, `refinement`

### MT5: Performance investigation

- **Messages**:
  1. User: "What indexes does the movies collection have?"
  2. Assistant: [calls collection-indexes, shows results]
  3. User: "Would a query on the title field be efficient?"
- **Expected**: `explain`
- **Tags**: `multi-turn`, `explain`, `performance`

### MT6: Pipeline build-up

- **Messages**:
  1. User: "What's in my current pipeline?"
  2. Assistant: [calls get-current-pipeline, shows result]
  3. User: "Run it and show me the results."
- **Expected**: `aggregate`
- **Tags**: `multi-turn`, `aggregate`, `get-current-pipeline`

### MT7: Context switch mid-conversation

- **Messages**:
  1. User: "How many documents are in the movies collection?"
  2. Assistant: [calls count, returns 12]
  3. User: "Now check the airbnb listings collection — how many there?"
- **Expected**: `count` with database `sample_airbnb`, collection `listingsAndReviews`
- **Tags**: `multi-turn`, `count`, `context-switch`

### MT8: Diagnostic conversation

- **Messages**:
  1. User: "Something seems off with my query results."
  2. Assistant: "Let me take a look at your current query."
  3. Assistant: [calls get-current-query]
  4. User: "Is there a better way to write that filter?"
- **Expected**: No additional tool call (or `explain` if checking performance)
- **Tags**: `multi-turn`, `get-current-query`, `advice`

---

## Summary by Tag

| Tag                           | Count |
| ----------------------------- | ----- |
| `medium`                      | 15    |
| `hard`                        | 16    |
| `multi-turn`                  | 8     |
| `multi-tool`                  | 5     |
| `inference`                   | 5     |
| `no-tool` / `refusal`         | 3     |
| `find-vs-aggregate`           | 2     |
| `nested-field`                | 1     |
| `array-operator`              | 1     |
| `projection`                  | 1     |
| `lookup` / `cross-collection` | 1     |
| `unwind`                      | 1     |
| `compound-filter`             | 1     |
| `bucket`                      | 1     |
| `context-mismatch`            | 2     |
| `non-english`                 | 1     |
| `correction`                  | 1     |
| `follow-up`                   | 1     |
