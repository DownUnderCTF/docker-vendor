# bin-builder

Contains common tools required for building binary challenges. Consider using
this as part of a multistage build.

e.g.
```dockerfile
FROM downunderctf/bin-builder as build

WORKDIR /build
COPY mysource.c .
RUN gcc -o chal mysource.c


FROM downunderctf/nsjail

COPY --from=build /build/chal .

# ...
```
