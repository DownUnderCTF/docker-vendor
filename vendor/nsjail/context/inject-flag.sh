#!/bin/bash

export MODE=ONCE
read FLAG

if [ "$FLAG" == "" ]; then
  FLAG=" "
fi

export TMP_PARAMS="$TMP_PARAMS"$(cat <<-END
, {
    dst: "/flag",
    src_content: $(echo "${FLAG@Q}")
  }
END
)
nsjail --config <(echo "$CONFIG" | envsubst)
