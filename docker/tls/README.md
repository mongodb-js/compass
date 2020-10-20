Usage:

```
docker-compose up
```

Use these parameters to connect with unvalidated:

```
mongodb://localhost:27029
```

Use these parameters to connect with server validation:

```
mongodb://localhost:27029
tlsCAFile=tls/ca.pem
```

Use these parameters to connect with both client and server validation:

```
mongodb://localhost:27030
tlsCertificateKeyFile=tls/client.pem
tlsCAFile=tls/ca.pem
```

Use these parameters to connect with x509:

```
mongodb://localhost:27030
tlsCertificateKeyFile=tls/client.pem
tlsCAFile=tls/ca.pem
```

Shell:

```
mongo --host localhost --port 27030 \
  --ssl --sslCAFile tls/ca.pem --sslPEMKeyFile tls/client.pem \
  --sslAllowInvalidCertificates
```

Run `./recreate-pem.sh` to re-generate the certificates if needed.