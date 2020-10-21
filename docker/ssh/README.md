```
docker-compose up
```

1. Connection to ssh tunnel with password:

```
Hostname: mongo
Port: 27017
SSH Tunnel: Use Password
SSH Hostname: localhost
SSH Tunnel Port: 22222
SSH Username: root
SSH Password: password
```

2. Connection to ssh tunnel with key (no passphrase):

```
Hostname: mongo
Port: 27017
SSH Tunnel: Use Password
SSH Hostname: localhost
SSH Tunnel Port: 22222
SSH Username: root
SSH Identity File: "keys/key-without-passphrase"
SSH Passphrase: ""
```

3. Connection to ssh tunnel with key (with passphrase):

```
Hostname: mongo
Port: 27017
SSH Tunnel: Use Password
SSH Hostname: localhost
SSH Tunnel Port: 22222
SSH Username: root
SSH Identity File: "keys/key-with-passphrase"
SSH Passphrase: "passphrase"
```
