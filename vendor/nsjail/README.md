# nsjail

A base image for making pwn challenges.

To build a challenge, copy your binary and other associated files to `/home/ctf/chal`. This will be mounted inside nsjail.
The default nsjail-pwn.sh script can be configured via docker `ENV`, or an
alternative script can be provided using ENV.

At the end of your Dockerfile, expose the appropriate port using `EXPOSE port_number/TCP`.

## Configuration
There is default configuration inside context/nsjail.cfg. Just replace the file using `COPY` when
building your image if you need to change any of the values.