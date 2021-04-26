package com.mongodb.mongosh

import com.mongodb.mongosh.result.StringResult
import org.junit.*


abstract class ShellTestCase {

    companion object {
        var mongoShell: MongoShell? = null

        @JvmStatic
        @BeforeClass
        fun setup() {
            mongoShell = createMongoRepl()
        }

        @JvmStatic
        @AfterClass
        fun teardown() {
            mongoShell?.close()
        }
    }

    protected fun withShell(block: (MongoShell) -> Unit) {
        Assert.assertNotNull("MongoRepl was not initialized", mongoShell)
        mongoShell?.let {
            val db = (it.eval("db") as StringResult).value
            block(it)
            it.eval("use $db")
        }
    }
}
