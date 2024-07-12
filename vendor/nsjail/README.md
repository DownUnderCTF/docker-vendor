# nsjail

A base image for making pwn challenges.

To build a challenge, copy your binary and other associated files to `/home/ctf/chal`. This will be mounted inside nsjail.
The default nsjail-pwn.sh script can be configured via docker `ENV`, or an
alternative script can be provided using ENV.

At the end of your Dockerfile, expose the appropriate port using `EXPOSE port_number/TCP`.

## Configuration
Default options are listed below.

```sh
JAIL_CWD=/		# default working directory of jail
MOUNT_PROC=false        # Whether to mount proc in the child container
PORT=1337               # Listening port
EXEC_BIN=/chal/pwn      # Program to execute 
EXEC_ARG=               # Arguments to supply to program
MAX_CONNS_PER_IP=16     # Maximum number of connections per IP address. 0 is unlimited.
MAX_MEMORY=67108864     # Maximum memory that processes can use.
MAX_PIDS=16             # Maximum number of processes.
TIME_LIMIT=60           # Timeout before connection is closed.
CPU_SHARES_MS=50        # Maximum amount of CPU time permitted in milliseconds per second.
TMP_ENABLED=0           # set to a 1 to enable tmp
TMP_SIZE=5000000        # maximum size of tmp in bytes
```

There is default configuration inside context/nsjail.cfg. Just replace the file using `COPY` when
building your image if you need to change more than what is provided through the environment
variables.

The only environment variable that is passed into the nsjail environment is the `FLAG` ENV variable. If it is not set then it is ignored.
