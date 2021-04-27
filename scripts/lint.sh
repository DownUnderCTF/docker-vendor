#!/bin/bash

source ./scripts/_common.sh

ecode=0
for dockerfile in $(get_all_dockerfiles); do
    echo "=== $dockerfile ==="
    docker run --rm -i hadolint/hadolint < $dockerfile || ecode=1
    echo -en '\n'
done

exit $ecode
