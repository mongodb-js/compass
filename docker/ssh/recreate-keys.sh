set -e
cd "$(dirname "$0")"

rm -Rf keys
mkdir -p keys

cd keys

ssh-keygen -N '' -t rsa -b 4096 -f key-without-passphrase -C key-without-passphrase
ssh-keygen -N 'passphrase' -t rsa -b 4096 -f key-with-passphrase -C key-with-passphrase
