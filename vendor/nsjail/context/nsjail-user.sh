#!/bin/bash

# idempotency ftw
CONFIG_FILE="/home/ctf/nsjail.cfg"
CONFIG=`cat "$CONFIG_FILE"`

if [ -f "/sys/fs/cgroup/cgroup.controllers" ]; then
	# we are using cgroupv2
	# sneaky write in cgroupv2 config (if it doesn't exist)
	if ! egrep -q '^use_cgroupv2' "$CONFIG_FILE"; then
		CONFIG=`echo "$CONFIG"$'\nuse_cgroupv2: true\ncgroupv2_mount: "/sys/fs/cgroup/nsjail"'`
	fi
fi

nsjail --config <(echo "$CONFIG")