package com.mongodb.mongosh

import com.mongodb.mongosh.result.Cursor
import com.mongodb.mongosh.result.CursorResult
import com.mongodb.mongosh.result.FindCursorResult
import org.junit.Assert.assertEquals
import org.junit.Test

class CursorTest : ShellTestCase() {

    @Test fun testAggregateExplain()  = test()
    @Test fun testAggregateIsClosed() = test()
    @Test fun testAggregateReadPref() = test()
    @Test fun testBatchSize()         = test()
    @Test fun testCollation()         = test()
    @Test fun testComment()           = test()
    @Test fun testCursorHelp()        = test()
    @Test fun testExplain()           = test()
    @Test fun testForEach()           = test()
    @Test fun testHint()              = test()
    @Test fun testIsClosed()          = test()
    @Test fun testIsClosedTrue()      = test()
    @Test fun testItcount()           = test()
    @Test fun testLimit()             = test()
    @Test fun testMap()               = test()
    @Test fun testMapArrowFunction()  = test()
    @Test fun testMax()               = test()
    @Test fun testMaxTimeMS()         = test()
    @Test fun testMin()               = test()
    @Test fun testNext()              = test()
    @Test fun testNoCursorTimeout()   = test()
    @Test fun testPrint()             = test()
    @Test fun testProjection()        = test()
    @Test fun testReadConcern()       = test()
    @Test fun testReadPref()          = test()
    @Test fun testReturnKey()         = test()
    @Test fun testSkip()              = test()
    @Test fun testSort()              = test()
    @Test fun testTailable()          = test()
    @Test fun testToArray()           = test()

    @Test fun testCursorIsNotFetchedTwice() {
        withShell { shell ->
            shell.eval("db.coll.remove({});\n" +
                    "db.coll.insertMany([{a: 1}, {a: 2}]);")
            try {
                val cursor = (shell.eval("db.coll.find()") as FindCursorResult).value
                cursor.batchSize(10)
                val sb = StringBuilder()
                for (doc in cursor) {
                    sb.append(doc).append("\n")
                }
                assertEquals("Document{{_id=<ObjectID>, a=1}}\nDocument{{_id=<ObjectID>, a=2}}", normalize(sb.toString()))
            } finally {
                shell.eval("db.coll.drop({});")
            }
        }
    }

    @Test fun testAggregateCursorIsNotFetchedTwice() {
        withShell { shell ->
            shell.eval("db.coll.remove({});\n" +
                    "db.coll.insertMany([{a: 1}, {a: 2}]);")
            try {
                val cursor = (shell.eval("db.coll.aggregate()") as CursorResult<Cursor<*>>).value
                val sb = StringBuilder()
                for (doc in cursor) {
                    sb.append(doc).append("\n")
                }
                assertEquals("Document{{_id=<ObjectID>, a=1}}\nDocument{{_id=<ObjectID>, a=2}}", normalize(sb.toString()))
            } finally {
                shell.eval("db.coll.drop({});")
            }
        }
    }


    private fun test() {
        val name = (Throwable()).stackTrace[1].methodName.removePrefix("test")

        withShell { shell ->
            doTest(name, shell, TEST_DATA_PATH, db = DB)
        }
    }

    companion object {
        private const val TEST_DATA_PATH = "src/test/resources/cursor"
    }
}
