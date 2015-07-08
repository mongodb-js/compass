> Source: [Integrations Flowdock Conversation](https://www.flowdock.com/app/10gen/integrations/threads/FM5IQ0IYllwXeuTSHiXz44hLFft)

@thomasr, this just reminded me of our co-creation of value story (e.g. "Hey Scout, you dummy, I'm using short key aliasing to save disk space.  Let me give you some aliases so when you see a key `u` display as `url`, `c` displays as `username`, and so on." ).  Let's just call this **"key packing"**.

Similarly, "value packing". Some examples of value packing:

- actual bitpacking like ObjectID or snowflake[0] to get globally unique but roughly time sorted values
- concatenating multiple values into a single keyspace to handle secondary indexes on your own [1]
- document structure hacks for things like multi-master[2].

So let's just for the sake of this exercise, we have a **"Schema Editor"** feature that allows the user to inject information which breaks down roughly to:

1. key aliasing
2. supply a JS function to unpack keys or values
3. docs (e.g. "OK. Here's why we don't actually want an index this key...")
4. annotation (e.g. "this was broken but fixed with this commit: <github commit url>")

The closest thing already in the wild that sounds like this is chart.io's schema editor[3], if you just, you know, replace all of the SQL concepts where applicable with MongoDB concepts.

![chart.io schema editor screenshot](http://static1.squarespace.com/static/52b5eb00e4b0ca7bf17667b6/t/54616f03e4b09fab6f882b9e/1415671559024/?format=1500w)

Now, for the big reveal...

**"Schema Editor"** is what Ron really wants for creating views so you can use a JDBC driver (e.g. a simple way to say this embedded array can be treated as the relational table `addresses`).

:fireworks: :fireworks: :fireworks:

Then, say we get some test results that folks want to be able to do things like manage indexes from **"Schema Editor"**.  __Testing__ any potential changes before __applying__ them to your deployment is DBA 101.  But how to do that with mongodb?

http://github.com/christkv/mongodb-schema-simulator

That is a demo I would pay to see.

[0]: https://blog.twitter.com/2010/announcing-snowflake
[1]: https://speakerdeck.com/__lucas/mongodb-plus-ex-dot-fm-at-mongopgh-2012
[2]: https://github.com/henrikingo/mongo-write-availability/
[3]: http://support.chartio.com/docs/data-sources/#schema
