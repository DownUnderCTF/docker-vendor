#!/bin/bash

# idempotency ftw
CONFIG_FILE="/home/ctf/nsjail.cfg"
CONFIG=`cat "$CONFIG_FILE"`

# check and set default env vars
export MODE=${MODE:-LISTEN}
export MOUNT_PROC=${MOUNT_PROC:-false}
export PORT=${PORT:-1337}
export EXEC_BIN=${EXEC_BIN:-/chal/pwn}
export EXEC_ARG=${EXEC_ARG:-}
export JAIL_CWD=${JAIL_CWD:-/}
export MAX_CONNS_PER_IP=${MAX_CONNS_PER_IP:-16}
export MAX_MEMORY=${MAX_MEMORY:-67108864} # 64MB
export MAX_PIDS=${MAX_PIDS:-16}
export TIME_LIMIT=${TIME_LIMIT:-60}
export CPU_SHARES_MS=${CPU_SHARES_MS:-50} # 50 ms per second of cpu per competitor

TMP_ENABLED=${TMP_ENABLED:-0}
TMP_SIZE=${TMP_SIZE:-5000000}

if [ $TMP_ENABLED -eq 1 ]; then
	export TMP_PARAMS=$(cat <<-END
, {
    dst: "/tmp",
    fstype: "tmpfs",
    options: "size=$TMP_SIZE",
    is_bind: false,
    rw: true
  }
END
)
fi

if [ -f "/sys/fs/cgroup/cgroup.controllers" ]; then
	# we are using cgroupv2
	# sneaky write in cgroupv2 config (if it doesn't exist)
	if ! egrep -q '^use_cgroupv2' "$CONFIG_FILE"; then
		CONFIG=`echo "$CONFIG"$'\nuse_cgroupv2: true\ncgroupv2_mount: "/sys/fs/cgroup/nsjail"'`
	fi
fi

nsjail --config <(echo "$CONFIG" | envsubst) --env FLAG

