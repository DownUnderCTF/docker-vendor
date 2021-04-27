#!/bin/bash

source ./scripts/_common.sh

docker-compose $(get_all_compose_files) push --ignore-push-failures
