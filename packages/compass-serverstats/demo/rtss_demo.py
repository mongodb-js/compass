import random
import string
import sys
import time

from pymongo import MongoClient

port = 27017
if len(sys.argv) == 2:
    port = int(sys.argv[1])
elif len(sys.argv) > 2:
    print("usage: rtss_demo.py <port>")

collections = ['coll1', 'coll2', 'coll3']
dbs = ['db1', 'db2', 'db3']

# Operations Chart + Network In/Out
def many_ops(m):
    coll = m[dbs[random.randint(0, len(dbs) - 1)]][collections[random.randint(0, len(collections) - 1)]]
    [coll.update_one({"x": 1}, {"$inc": {"x": 1}}) for _ in range(
        random.randint(0,100))]
    [coll.find_one({"x": 1}) for _ in range(random.randint(0, 100))]
    [coll.find_one({"x": 1}) for _ in range(random.randint(0, 100))]
    [coll.find_one({"x": 1}) for _ in range(random.randint(0, 100))]
    [coll.insert_one({"x": 1}) for _ in range(random.randint(0, 100))]
    [coll.delete_one({"x": 1}) for _ in range(random.randint(0, 100))]

# Network Connections
def many_connections():
    new_connections = random.randint(0, 5)
    connections = [MongoClient(port=port) for _ in range(new_connections)]
    time.sleep(random.randint(0, 2))
    for m in connections:
        m.close()

# Memory
def move_data(m):
    randdata = ''.join(random.choice(
        string.ascii_uppercase + string.digits) for _ in range(100))
    randkey =''.join(random.choice(
        string.ascii_uppercase + string.digits) for _ in range(100))
    if random.randint(0, 1):
        print('inserting')
        m.test.coll.insert_many(
            [{randkey: randdata, 'even': random.randint(0, 1)} for _ in range(1000)])
    else:
        print('deleting')
        m.test.coll.delete_many({'even': random.randint(0, 1)})

    if random.randint(0, 1000) == 5:
        m.test.drop_collection('coll')

while(True):
    many_ops(client)
    many_connections()
    #move_data(client) keep out for now
    time.sleep(random.randint(0, 3))

