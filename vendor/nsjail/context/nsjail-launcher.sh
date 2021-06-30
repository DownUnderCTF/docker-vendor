#!/bin/bash

# this needs to run after /docker-init/docker-entrypoint.sh

CONFIG_FILE="/home/ctf/nsjail.cfg"

if [ -f "/sys/fs/cgroup/cgroup.controllers" ]; then
	# we are using cgroupv2
	echo "Running using cgroupv2"
	# create cgroupv2 for nsjail
	mkdir -p /sys/fs/cgroup/nsjail/init
	chown -R ctf:ctf /sys/fs/cgroup/nsjail

	# delegate controllers
	echo '+cpu +memory +pids' > /sys/fs/cgroup/nsjail/cgroup.subtree_control
	echo "$$" > /sys/fs/cgroup/nsjail/init/cgroup.procs
	
	# sneaky write in cgroupv2 config
	echo '' >> $CONFIG_FILE # in case line doesn't end with newline
	echo 'use_cgroupv2: true' >> $CONFIG_FILE
	echo 'cgroupv2_mount: "/sys/fs/cgroup/nsjail"' >> $CONFIG_FILE
else
	# we are using cgroupv1
	echo "Running using legacy cgroup"
	mkdir -p /sys/fs/cgroup/{cpu,memory,pids}/NSJAIL
	chown -R ctf:ctf /sys/fs/cgroup/{cpu,memory,pids}/NSJAIL
fi


exec runuser -u ctf -- /usr/bin/nsjail --config $CONFIG_FILE
