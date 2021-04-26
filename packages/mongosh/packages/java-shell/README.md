# MongoDB Shell for JVM

MongoDB Shell for JVM runs shell commands e.g. `db.students.find({name: "Peter"})`
and returns results in a type safe manner.

## Usage

```java
import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClients;
import com.mongodb.mongosh.MongoShell;
import com.mongodb.mongosh.result.Cursor;
import com.mongodb.mongosh.result.CursorResult;
import org.bson.Document;

/* ... */

MongoClientSettings settings = MongoClientSettings.builder()
    .applyConnectionString(new ConnectionString("mongodb://localhost:27017"))
    .build();

try (MongoShell shell = new MongoShell(MongoClients.create(settings))) {
  shell.eval("use admin");
  CursorResult<?> result = (CursorResult<?>) shell.eval("db.companies.find()");
  Cursor cursor = result.getValue();
  while (cursor.hasNext()) {
    Document doc = cursor.next();
    System.out.println(doc);
  }
}
```

## Compilation

1. Compile mongosh JS package using instructions in [mongosh/README.md](../../README.md)
2. ```./gradlew compileJava```

To compile a jar file with the library:
```bash
./gradlew jar
```
This will produce a jar file in `build/libs` directory.

## Running Tests

Start MongoDB instance and set `URI` variable in [URI.txt](src/test/resources/URI.txt) to
MongoDB URI string e.g. `mongodb://localhost:27017`

```shell
./gradlew test
```
