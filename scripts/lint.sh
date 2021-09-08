#!/bin/bash

source ./scripts/_common.sh

ecode=0
for dockerfile in $(get_all_dockerfiles); do
    echo "=== $dockerfile ==="
    docker run --rm -i -v $PWD/.hadolint.yml:/.hadolint.yml hadolint/hadolint < $dockerfile || ecode=1
    echo -en '\n'
done

exit $ecode
