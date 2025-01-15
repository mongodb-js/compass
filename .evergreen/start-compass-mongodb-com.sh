set -e

HAS_DOCKER=false

DOCKER_BUILD=""

echo "Checking if docker is available ..."

if docker version &>/dev/null; then
  echo "  docker is available, checking docker build"
  if docker compose version &>/dev/null; then
    echo "  docker build is available"
    HAS_DOCKER=true
    DOCKER_BUILD="docker build"
  else
    echo " docker compose could not be found, trying standalone docker-compose as a fallback"
    if docker-build version &>/dev/null; then
      HAS_DOCKER=true
      DOCKER_BUILD="docker-build"
    else
      echo "  docker build not found"
    fi
  fi
fi

if [ "$HAS_DOCKER" = true ]; then
  $DOCKER_BUILD -t compass/web ./
  docker run -p 8080:8080 -t -e PORT=8080 -e UPDATE_CHECKER_ALLOW_DOWNGRADES=true -d compass/web
else
  echo "  docker not found"
fi