#!/bin/bash


source ./scripts/_common.sh

# Call build on the docker composes at once, this allows us to handle dependencies and extensions
docker-compose $(get_all_compose_files) build --parallel
