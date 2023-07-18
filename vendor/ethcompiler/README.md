# Eth Compiler

Contains a simple image to compile smart contracts easily. Usually used for
building blockchain challenges for deployment.

## Example usage

```dockerfile
FROM ghcr.io/downunderctf/docker-vendor/ethcompiler:foundry as build

COPY contracts/ src/
COPY foundry.toml foundry.toml

RUN /root/.foundry/bin/forge build

FROM ghcr.io/downunderctf/eth-challenge-base-priv/eth-base:latest as dist

WORKDIR /app

COPY challenge.yaml challenge.yaml
COPY contracts/ contracts/
# Contract builds output to be in a flat dir
COPY --from=build out/**/* output/

ENV CONTRACT_ABI_DIR=/app/output

```