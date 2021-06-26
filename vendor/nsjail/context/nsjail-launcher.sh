#!/bin/sh

# this needs to run after /docker-init/docker-entrypoint.sh

# create cgroupv2 for nsjail
mkdir -p /sys/fs/cgroup/nsjail/init
chown -R ctf:ctf /sys/fs/cgroup/nsjail

# delegate controllers
echo '+cpu +memory +pids' > /sys/fs/cgroup/nsjail/cgroup.subtree_control
echo "$$" > /sys/fs/cgroup/nsjail/init/cgroup.procs

exec runuser -u ctf -- /usr/bin/nsjail --config /home/ctf/nsjail.cfg
