#!/bin/bash

export CONTAINER_PREFIX="ghcr.io/"`echo "$GITHUB_REPOSITORY" | tr 'A-Z' 'a-z'`

source ./scripts/_common.sh

if [ -z "$1" ]; then
    projects=`get_changed_compose_projects`
else
    projects="$@"
fi

for project in $projects; do
(
    cd "vendor/$project"
    echo "Building and pushing $project"
    docker buildx bake --push \
        --set '*.cache-from=type=gha' \
        --set '*.cache-to=type=gha,mode=max' \
        -f docker-compose.yml
)
done
