# Eth Compiler

Contains a simple image to compile smart contracts easily. Usually used for
building blockchain challenges for deployment.

## Example usage

```dockerfile
FROM ghcr.io/downunderctf/docker-vendor/ethcompiler:foundry as build

COPY contracts/ src/
COPY foundry.toml foundry.toml

RUN /root/.foundry/bin/forge build

```