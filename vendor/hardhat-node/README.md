# Hardhat Node

This is a simple hardhat node server that can be run as a side-car to your blockchain related challenges. This instance of the hardhat node node runs with all defaults set.

## Usage

To make a hardhat node server available to your challenge you can add it to your `docker-compose.yml` file. By default the node listens on port `8545` so you should create a port binding so that it is available to reached from your challenge.

```yml
services:
  hardhat-node:
    image: ghcr.io/downunderctf/docker-vendor/hardhat-node:
    ports:
     - 8545:8545

  # Your challenge container goes here
```
## Custom Node Behaviour

If you want to customise the hardhat network's behaviour you will need to provide a custom `hardhat.config.js` file and rebuild the image with your custom configuration.

For example if you wanted to turn on block mining delay your `hardhat.config.js` file might look like this.

```js
module.exports = {
    networks: {
        hardhat: {
          mining: {
            auto: false,
            interval: 5000
          }
        }
      }
};
```

Then for your challenge, your Dockerfile should look something like this:

```Dockerfile
FROM ghcr.io/ductf/docker-vendor/hardhat-node:default

WORKDIR /app
COPY hardhat.config.js hardhat.config.js
```

Then you can add this your `docker-compose.yml`

```yml
services:
  hardhat-node-delay:
    # Path to your custom Dockerfile
    build: example-delay/
    ports:
     - 8545:8545

  # Your challenge container goes here
```

I hope this works oof.



