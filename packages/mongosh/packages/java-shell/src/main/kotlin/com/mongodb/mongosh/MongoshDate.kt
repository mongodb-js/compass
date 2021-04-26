package com.mongodb.mongosh

import org.graalvm.polyglot.HostAccess
import java.util.*

/**
 * @author Liudmila Kornilova
 **/
class MongoshDate(date: Long) : Date(date) {
    @HostAccess.Export
    override fun getTime(): Long {
        return super.getTime()
    }
}
