Usage:

```
docker-compose up --build --force-recreate
```

Use these parameters to connect:

```
mongodb://localhost:27029
tls=true
tlsCertificateKeyFile=tls/client.pem
tlsCAFile=tls/ca.pem
```

```
mongo --host localhost --port 27029 --ssl --sslCAFile tls/ca.pem --sslPEMKeyFile tls/client.pem --sslAllowInvalidCertificates
```

Run `./recreate-pem.sh` to re-generate the certificates if needed.