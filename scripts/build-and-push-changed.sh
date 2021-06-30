#!/bin/bash

export CONTAINER_PREFIX="ghcr.io/"`echo "$GITHUB_REPOSITORY" | tr 'A-Z' 'a-z'`

source ./scripts/_common.sh
for project in `get_changed_compose_projects`; do
(
    cd "$project"
    docker buildx bake --push \
        --set '*.cache-from=type=local,src=/tmp/.buildx-cache' \
        --set '*.cache-to=type=local,mode=max,dest=/tmp/.buildx-cache-new' \
        -f docker-compose.yml
)
done
