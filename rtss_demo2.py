

from pymongo import MongoClient
from multiprocessing import Process
import random
import time
import sys

def many_ops():
    collections = ['coll1', 'coll2', 'coll3']
    dbs = ['db1', 'db2', 'db3']
    m = MongoClient()
    coll = m[dbs[random.randint(0, len(dbs) - 1)]][collections[random.randint(0, len(collections) - 1)]]
    [coll.find_one({"x": 1,  '$where': 'function() { sleep(' + str(random.randint(0, 2000)) + '); return true; }'}) for _ in range(random.randint(0, 100))]
    sys.exit()

try:
    processes = []
    while True:
        p = Process(target=many_ops)
        p.start()
        processes.append(p)
        time.sleep(random.randint(3, 5))

# except KeyboardInterrupt:
#     for p in processes:
#         if p != None:
#             p.kill()
except:
    sys.exit();
#     for p in processes:
#         if p != None:
#             p.kill()
#         raise
