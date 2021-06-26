#!/bin/bash


source ./scripts/_common.sh
for project in `get_changed_compose_files`; do
    docker-compose -f "$project" build --parallel
done
