package com.mongodb.mongosh

import org.junit.Test

class LiteralsTest : ShellTestCase() {

    @Test fun testArray()         = test()
    @Test fun testBinData()       = test()
    @Test fun testBool()          = test()
    @Test fun testBsonsize()      = test()
    @Test fun testBSONSymbol()    = test()
    @Test fun testCode()          = test()
    @Test fun testDate()          = test()
    @Test fun testDateNow()       = test()
    @Test fun testDBRef()         = test()
    @Test fun testDouble()        = test()
    @Test fun testEmptyArray()    = test()
    @Test fun testEmptyObject()   = test()
    @Test fun testFloat()         = test()
    @Test fun testHexData()       = test()
    @Test fun testInt()           = test()
    @Test fun testISODate()       = test()
    @Test fun testLong()          = test()
    @Test fun testMaxKey()        = test()
    @Test fun testMD5()           = test()
    @Test fun testMinKey()        = test()
    @Test fun testNull()          = test()
    @Test fun testNumberDecimal() = test()
    @Test fun testNumberInt()     = test()
    @Test fun testNumberLong()    = test()
    @Test fun testObject()        = test()
    @Test fun testObjectId()      = test()
    @Test fun testString()        = test()
    @Test fun testSymbol()        = test()
    @Test fun testTimestamp()     = test()
    @Test fun testUndefined()     = test()
    @Test fun testUnknownSymbol() = test()
    @Test fun testUUID()          = test()
    
    private fun test() {
        val name = (Throwable()).stackTrace[1].methodName.removePrefix("test")

        withShell { shell ->
            doTest(name, shell, TEST_DATA_PATH)
        }
    }

    companion object {
        private const val TEST_DATA_PATH = "src/test/resources/literal"
    }
}
