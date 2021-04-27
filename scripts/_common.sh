#!/bin/bash

export VENDOR_DIR=./vendor

function get_all_compose_files {
    # Returns all docker-compose files separated with '-f's, ready for use with docker-compose
    find $VENDOR_DIR -name docker-compose.yml | awk '{print "-f "$0}' | xargs
}

function get_all_dockerfiles {
    # Returns a list of all Dockerfiles
    find $VENDOR_DIR -name Dockerfile.*
}
