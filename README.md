# Docker Vendor

This repository manages docker images intended to simply challenge author experience.

## Images

_More information about each image can be found in the associated directory under `vendor`_

| Service               | Versions       | Entrypoint      | Description                                       |
|-----------------------|----------------|-----------------|---------------------------------------------------|
| `downunderctf/nsjail` | `latest (ubuntu-18.04)` `ubuntu-18.04` | `nsjail-run.sh` | Nsjail, use for remote code execution challenges. |
| `downunderctf/bin-builder` | `latest (ubuntu-18.04)` `ubuntu-18.04` `ubuntu-20.04` `debian-10` `debian-10-slim` `alpine` | `/bin/sh` | Image containing common build dependencies for binary challenges, consider using this as part of a multi-part build. |
