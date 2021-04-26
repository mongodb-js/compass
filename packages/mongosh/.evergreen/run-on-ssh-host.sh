#!/usr/bin/env bash
set -e
# Check SSH availability -- this is adapted from
# https://github.com/evergreen-ci/evergreen/wiki/Project-Commands#host-create
identity_file=~/.ssh/mcipacker.pem
user=${ADMIN_USER_NAME}
hostname=$(tr -d '"[]{}' < ../buildhosts.yml | cut -d , -f 1 | awk -F : '{print $2}')
attempts=0
connection_attempts=25
# Check for remote connectivity
while ! ssh \
  -i "$identity_file" \
  -o ConnectTimeout=20 \
  -o ForwardAgent=yes \
  -o IdentitiesOnly=yes \
  -o StrictHostKeyChecking=no \
  "$(printf "%s@%s" "$user" "$hostname")" \
  exit
do
  [ "$attempts" -ge "$connection_attempts" ] && exit 1
  printf "SSH connection attempt %d/%d failed. Retrying...\n" "$((attempts++))" "$connection_attempts"
  # sleep for Permission denied (publickey) errors
  sleep 20
done
cat <<ONHOST_SCRIPT_HEADER > ~/onhost.sh
set -e
set -x
{
echo "Starting script on SSH host"
ONHOST_SCRIPT_HEADER
cat "$PRELOAD_SCRIPT_PATH" "$ONHOST_SCRIPT_PATH" >> ~/onhost.sh
cat <<ONHOST_SCRIPT_FOOTER >> ~/onhost.sh
echo "Finished script on SSH host"
}
ONHOST_SCRIPT_FOOTER

ssh \
  -i "$identity_file" \
  -o ForwardAgent=yes \
  -o IdentitiesOnly=yes \
  -o StrictHostKeyChecking=yes \
  "$(printf "%s@%s" "$user" "$hostname")" bash < ~/onhost.sh
