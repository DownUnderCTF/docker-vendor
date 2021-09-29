#!/bin/bash

if [ -f "/sys/fs/cgroup/cgroup.controllers" ]; then
	# we are using cgroupv2
	echo "Running using cgroupv2"
	# create cgroupv2 for nsjail
	mkdir -p /sys/fs/cgroup/nsjail/init
	chown -R ctf:ctf /sys/fs/cgroup/nsjail

	# delegate controllers
	echo '+cpu +memory +pids' > /sys/fs/cgroup/nsjail/cgroup.subtree_control
	echo "$$" > /sys/fs/cgroup/nsjail/init/cgroup.procs	
else
	# we are using cgroupv1
	echo "Running using legacy cgroup"
	mkdir -p /sys/fs/cgroup/{cpu,memory,pids}/NSJAIL
	chown -R ctf:ctf /sys/fs/cgroup/{cpu,memory,pids}/NSJAIL
fi

