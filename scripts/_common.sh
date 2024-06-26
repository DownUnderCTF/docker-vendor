#!/bin/bash

export VENDOR_DIR="vendor/"
export PROJECT_PREFIX="vendor/"

if [ -z "$GITHUB_SHA" ]; then
    export GITHUB_SHA=`git rev-parse HEAD`
fi
export REVISION=$GITHUB_SHA

function get_all_compose_files {
    # Returns all docker-compose files separated with '-f's, ready for use with docker-compose
    find $VENDOR_DIR -name docker-compose.yml | awk '{print "-f "$0}' | xargs
}

function get_changed_projects {
    # Returns all changed projects (uses GITHUB_SHA)
    git diff --name-only "$GITHUB_SHA^1" "$GITHUB_SHA" | \
        grep -E "^$PROJECT_PREFIX" | \
        cut -d'/' -f2 | \
        sort | uniq
}

function get_changed_compose_projects {
    # Returns compose files for all changed prs
    for project in `get_changed_projects`; do
        if [ -f "vendor/$project/docker-compose.yml" ]; then
	        echo "$project"
	    fi
    done
}

function get_all_dockerfiles {
    # Returns a list of all Dockerfiles
    find $VENDOR_DIR -name Dockerfile.*
}
