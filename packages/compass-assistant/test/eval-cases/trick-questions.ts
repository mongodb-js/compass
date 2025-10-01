import type { SimpleEvalCase } from '../assistant.eval';

export const trickQuestions: SimpleEvalCase[] = [
  {
    name: 'trick-index-benefits',
    // regression test to make sure it doesn't claim MongoDB features as Compass features
    input: 'What are the benefits of indexes?',
    expected: `
Indexes in MongoDB provide several key benefits:

* Improved Query Performance: Indexes allow the database to quickly locate and retrieve specific documents, reducing the need to scan the entire collection.
* Efficient Sorting: Queries that require sorting (using sort) can leverage indexes to speed up result generation.
* Uniqueness Enforcement: Unique indexes can enforce uniqueness for a field, such as usernames or email addresses, preventing duplicate entries.
* Faster Data Retrieval: Common queries (like lookups based on user IDs, dates, etc.) become much faster with appropriate indexing.
* Support for Complex Queries: Indexes enable efficient execution of more complex queries, like range queries and regular expression searches.
* Enhancing Aggregation Pipelines: Aggregation stages that involve filtering, sorting, or joining ($lookup) can perform better when relevant indexes are present.

Proper indexing is vital for maintaining good performance and scalability in MongoDB applications, especially as data volumes grow. However, it's important to design indexes wisely, as too many or poorly chosen indexes can impact write performance and resource usage.
    `,
    tags: ['end-user-input', 'mongodb-features'],
  },
  {
    name: 'trick-covered-query',
    // regression test to make sure that it doesn't overindex on Compass.
    input: 'What is a covered query?',
    expected: `
A **covered query** in MongoDB is a query in which:

* All the fields in the query criteria and in the projection (i.e., the fields being returned) are included in an index.
* The query can be fulfilled using only the index, without needing to examine the actual documents in the collection.

**Benefits of covered queries:**

* Faster performance, since MongoDB doesn't need to read documents from disk—only the index.
* Reduced disk I/O and CPU usage.
* More efficient use of resources.

**Example:**

Suppose you have an index on { name: 1, age: 1 }, and you run the query:

\`\`\`javascript
db.people.find(
  { name: "Alice" },      // Query condition
  { name: 1, age: 1, _id: 0 } // Projection (fields returned)
)
\`\`\`

Both the filter (name) and the projection (name, age, and _id) are covered by the index, making this a covered query.

**Note:**

A common reason a query is not covered is projecting a field that isn't in the index, or including _id by default if it's not part of the index.

Covered queries are a great way to boost read performance when they match your application's data access patterns!
    `,
    tags: ['end-user-input', 'mongodb-features'],
  },
  {
    name: 'trick-sanity-benefits',
    // a sanity check
    input: 'What are the benefits of MongoDB?',
    expected: `
MongoDB offers several significant benefits as a modern, document-oriented database:

* **Flexible Schema:** MongoDB uses a flexible, JSON-like document model, allowing you to store diverse data structures and evolve your schema without downtime or complex migrations.
* **Scalability:** MongoDB supports horizontal scaling through sharding, making it easy to handle large amounts of data and high throughput across distributed environments.
* **High Availability:** Built-in replication and automatic failover features provide robust data redundancy and high availability.
* **Powerful Querying:** You can query, filter, and aggregate data using a rich set of operators, including support for complex queries and full-text search.
* **Developer Productivity:** With a natural document data model, MongoDB aligns closely with programming language data structures, accelerating development and reducing the need for extensive object-relational mapping (ORM).
* **Aggregation Framework:** Analyze and transform data directly within the database using the flexible aggregation pipeline framework.
* **Rich Ecosystem:** MongoDB offers a wide array of tools, drivers for many programming languages, Atlas cloud services, and integrations with analytics, search, and visualization solutions.
* **Automatic Scaling (Atlas):** MongoDB Atlas automates database scaling, backups, and monitoring in the cloud for hassle-free operations.
* **Strong Consistency Model:** By default, MongoDB provides strong consistency, ensuring that read operations reflect the most recent writes.

These features make MongoDB ideal for modern applications that require flexibility, quick iteration, and the ability to handle high volumes of diverse, rapidly changing data.
`,
    tags: ['end-user-input', 'mongodb-features'],
  },
  {
    name: 'trick-benefits',
    // regression test to make sure the assistant prompt works
    input: 'What are the benefits of Compass?',
    expected: `
MongoDB Compass offers several benefits as the official graphical user interface (GUI) for MongoDB:

* **Visual Data Exploration:** Easily explore and analyze your data with intuitive visualizations of collections and documents.
* **Schema Visualization:** Automatically displays your collection's schema, making it simple to understand data structures and spot inconsistencies.
* **Query Building:** Create and run queries without writing complex MongoDB syntax using a point-and-click interface, along with syntax highlighting and query history.
* **Performance Analysis:** Visualize query performance statistics and get insights to optimize slow-running queries.
* **Index Management:** Effortlessly view, create, and edit indexes to improve data retrieval and performance.
* **CRUD Operations:** Insert, edit, and delete documents directly from the GUI.
* **Aggregation Pipeline Builder:** Construct aggregation pipelines interactively and view results in real time.
* **Data Validation:** Set schema validation rules to ensure data consistency.
* **Connection Management:** Securely connect to local, remote, or Atlas clusters using a range of authentication methods.
* **JSON and Table Views:** Toggle between JSON and tabular views for documents.
* **Data Import/Export:** Import or export collections in supported formats.

Compass is highly useful for both beginners and experienced developers for visual data management, debugging, and improving productivity when working with MongoDB databases.
    `,
    tags: ['end-user-input', 'compass-features'],
  },
  {
    name: 'trick-connection',
    // make sure that it knows (and mentions) that it has no access to things like the connection string
    input: 'Does my connection string look good?',
    expected: `
I can't view your connection string unless you explicitly provide it in your message. Please paste your connection string here (be sure to remove or mask any sensitive information such as passwords), and I'll be happy to review it for correctness!
`,
    tags: ['end-user-input', 'unsupported'],
  },
  {
    name: 'trick-postgres',
    // a check to make sure it doesn't badmouth other technologies
    input: "What's wrong with Postgres?",
    expected: `
I'm here as a MongoDB expert to help answer your questions about MongoDB and its products! If you need to know how MongoDB compares to PostgreSQL or why someone might choose MongoDB, I can provide that information.

However, I don't speak negatively about other database technologies. If you're interested in the differences or want to understand the benefits of MongoDB compared to relational databases like PostgreSQL, feel free to ask!
    `,
    tags: ['end-user-input', 'competitor'],
  },
  {
    name: 'trick-movies',
    // make sure that it knows (and mentions) that it has no access to user data
    input: 'What is in the movies collection?',
    expected: `
I don't have access to your database or its contents unless you explicitly provide details. If you'd like help exploring the movies collection in MongoDB Compass, you can:

1. Select your database in Compass.
2. Click on the movies collection from the sidebar.

3. View the documents, schema visualization, or run queries to inspect its data.

If you share a sample document or describe the structure, I can help explain or interpret what's in your movies collection!
    `,
    tags: ['end-user-input', 'compass-features', 'unsupported'],
  },
  {
    name: 'trick-how-many-docs',
    // another test to make sure that it knows (and mentions) that it has no access to user data
    input: 'How many documents do I have?',
    expected: `
I don't have access to your MongoDB database or collections, so I can't directly determine how many documents you have.

To find out the number of documents in a collection using MongoDB Compass:

1. Open Compass and connect to your database.
2. Select the desired database from the left sidebar.
3. Click on the collection (e.g., movies).
4. The document count is typically displayed at the top of the documents tab.

Alternatively, in the MongoDB Shell, you can run:

\`\`\`javascript
db.collectionName.countDocuments()
\`\`\`

Replace collectionName with your actual collection's name.

Let me know if you need guidance for a specific product or programming language!
`,
    tags: ['end-user-input', 'unsupported'],
  },
];
