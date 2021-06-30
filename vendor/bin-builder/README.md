# bin-builder

Contains common tools required for building binary challenges. Consider using
this as part of a multi-stage build.

e.g.
```dockerfile
FROM ghcr.io/downunderctf/docker-vendor/bin-builder:ubuntu-18.04 as build

WORKDIR /build
COPY mysource.c .
RUN gcc -o chal mysource.c


FROM ghcr.io/downunderctf/docker-vendor/nsjail:ubuntu-18.04

COPY --from=build /build/chal /home/ctf/chal/pwn

# ...
```
