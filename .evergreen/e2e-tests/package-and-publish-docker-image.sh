#!/usr/bin/env bash

post_evergreen_status() {
  status="$1"
  type="$2"
  desc="$3"
  should_continue="$4"
  curl --silent --show-error --header "Content-Type: application/json" --data \
    '{"status": "'"$status"'", "type": "'"$type"'", "desc": "'"$desc"'", "should_continue": '"$should_continue"'}' \
    "http://localhost:2285/task_status" || true
}

# NOTE: do not -x here there are "env" vars in the commands
set -e

MONOREPO_ROOT_DIR="$(cd $(dirname "$0")/../..; pwd)"
cd $MONOREPO_ROOT_DIR

echo "building e2e tests image from ${PWD}"
docker build -t compass-e2e-tests:$github_commit --build-arg "NODE_JS_VERSION=$NODE_JS_VERSION" -f "./.evergreen/package-and-publish-e2e-docker-image/Dockerfile" .
echo "e2e tests image built"

# skip if the image already exists
if aws ecr describe-images --region $ECR_REGION --repository-name=compass/e2e-tests --image-ids=imageTag=$github_commit; then
    echo "Image with tag '${github_commit}' found in the 'compass/e2e-tests' repository. Setting task status to 'success'..."
    post_evergreen_status success test "image tag '${github_commit}' already exists in the 'compass/e2e-tests' repository" false
else
    echo "Image with tag '${github_commit}' not found in the 'compass/e2e-tests' repository. Continuing with remainder of task..."
fi

echo "pushing e2e tests image to ECR"
aws ecr get-login-password --region $ECR_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
docker tag compass-e2e-tests:$github_commit $ECR_REGISTRY/compass/e2e-tests:$github_commit
docker push $ECR_REGISTRY/compass/e2e-tests:$github_commit
echo "image pushed"