#!/bin/bash
config_path="$(cd "$(dirname "$0")"; pwd)/verdaccio.yaml"
docker run -d --rm --name verdaccio \
  -v "$(readlink ${config_path}):/verdaccio/conf/config.yaml:ro" \
  -p 4873:4873 verdaccio/verdaccio
