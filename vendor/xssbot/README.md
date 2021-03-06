# XSSBot - Marvin

_A "performant enough" xss bot for use in CTF challenges._

## Usage

Marvin is desgined to run as a side-car to your challenge, so each author will need to use it in their individual challenges.

Include the following in your `docker-compose.yml`. By default Marvin listens on port 80, it may be worth forwarding a port here for development so you can make calls directly to marvin.

```yaml
services:
  xssbot:
    image: ghcr.io/downunderctf/docker-vendor/xssbot:chrome
    privileged: true
    # Useful for development
    environment:
     NODE_ENVIRONMENT: development
    ports:
     - 8000:80
```

You can then request Marvin visit pages by sending a POST request to `http://xssbot/visit` from within your dockerized challenge (or `http://localhost:8000/visit` if you are testing locally). The request needs to contain
```
Headers:
  Content-Type: application/json
  X-SSRF-Protection: 1
Body:
  {"url": "https://example.com"}
```

This can be easily done in python with
```python
requests.post('http://xssbot/visit', json={
  'url': 'https://example.com'
}, headers={
  'X-SSRF-Protection': '1'
})
```

### Configuration

Marvin takes it's configuration through environmental variables. There are more variables than those documented below, please check out `config.ts` if you _really_ need to change something else.

#### OUTBOUND_AUTH_METHOD
_Default_: `none`

The auth method to use. Must be one of `none`, `cookiejar`, `http-get`.

##### CookieJar Auth
If the auth method is `cookiejar`, a cookie jar file is expected to be on the file system. This should contain a json-array of cookies. By default this file should be at `/var/marvin/auth/cookiejar`. This can be changed with `OUTBOUND_AUTH_COOKIEJAR`.

Types for each cookie can be found here: https://chromedevtools.github.io/devtools-protocol/tot/Network/#type-Cookie
```json
[
  {
    "domain": "domainforcookie.com",
    "name": "minimalcookie",
    "value": "val",
  },
  {
    "domain": "domainforcookie.com",
    "name": "xss-cookie",
    "value": "you can get me from js",
    "httponly": false
  }
]
```

You then mount this file into the container from the file system
```yaml
services:
  xssbot:
    image: ghcr.io/downunderctf/docker-vendor/xssbot:chrome
    volumes:
      - ./cookiejar:/var/marvin/auth/cookiejar
```

##### Http-Get Auth
If the auth method is `http-get`, Marvin will make one get request to a path set by `OUTBOUND_AUTH_HTTP_GET_URL` before visiting the request page, it is expected this page will provide some sort of cookie or state configuration. _Note that if you issue a session cookie using this method you should route the auth request to the challenge's external address, this will make sure the cookie's domain is set appropriately.

A setup may look like.
```yaml
services:
  mychal:
    image: ...
  xssbot:
    image: ghcr.io/downunderctf/docker-vendor/xssbot:chrome
    environment:
      - OUTBOUND_AUTH_METHOD: http-get
      - OUTBOUND_AUTH_HTTP_GET_URL: http://external.chal.address/admin?token=abcd
  ```

  ```python
  # app.py
  @app.route('/admin')
  def admin_login():
    if request.args.get('token') == 'abcd':
      res = make_response('1')
      res.set_cookie('mycookie', 'myvalue', httponly=True)
      return res
    else:
      # Note the admin will keep going even if it gets a 401 here.
      return '0', 401
  ```


#### OUTBOUND_AUTH_COOKIEJAR
_Default_: `/var/marvin/auth/cookiejar`

Path on the file system to the cookiejar containing cookies Marvin should use.

#### OUTBOUND_AUTH_HTTP_GET_URL
_Default_: None
_Example_: `http://mychallenge/adminAuth?token=sometoken`

Path Marvin should request in order to perform challenge specific auth, must be set if `OUTBOUND_AUTH_METHOD == http-get`.
The auth request will happen before all visit requests.

### PER_REQ_LIMITS
_Default_: `0`

Enabled specifying `TIMEOUT_TOTAL` and `TIMEOUT_NETWORK_IDLE` for each request from the challenge.

Requests should look like
```python
requests.post(..., json={
  'url': 'https://example.com',
  'resourceLimits': {
    'timeouts': {
      'total': TIMEOUT_TOTAL,
      'networkIdle': TIMEOUT_NETWORK_IDLE
    }
  }
}, headers=...)
```

#### TIMEOUT_TOTAL
_Default_: `10000`

Total time in ms for a entire visit, including all resource loading and redirects.

#### TIMEOUT_NETWORK_IDLE
_Default_: `5000`

Time in milliseconds to wait for a page to load.

#### INBOUND_SSRF_PROT
_Default_: `1`

Requires the `X-SSRF-Protection` header for requests inbound to Marvin. Set to `1` to enable.

#### INBOUND_BEARER
_Default_: `null`

A bearer that must be specified to auth requests _inbound_ to Marvin. No bearer is required if omitted.

A request from the challenge would then look like.
```python
requests.post('...', json=..., headers={
  'Authorization': f'Bearer {INBOUND_BEARER}',
  ...
})
```

#### ALLOW_INTERNAL_ADDRESSES
_Default_: `false`

Allows request to be made to loopback and link-local addresses, typically this is not allowed. Private addresses are not effected by this.
Set to `unsafe-allow-all-internal-addresses` to enable.

#### ALLOW_ALL_PROTOCOLS
_Default_: `false`

Allows requests using any protocol, typically Marvin only allows `http` and `https`. Enabling this feature allows any protocol, this notably includes `file://` which allows for LFI. Set to `unsafe-allow-all-protocols` in order to enable.

#### SERVICE_NAME
_Default_: `ductf/marvin`

This will be the value of the `X-Powered-By` header sent with every request. Authors may use this header to make _aesthetic_ changes to their challenges if the request comes from Marvin. **This header is not secure and should not be trusted**.

## Gotchas

 - Don't name your service `app` if you are going to visit it through the internal network. Chrome incorrectly attempts to send https traffic to the service.

## Credits

- XSSBot inspired by [google/kctf](https://github.com/google/kctf/tree/v1/dist/challenge-templates/xss-bot)
- XSSBot inspired by [adamyi/CTFProxy](https://github.com/adamyi/CTFProxy/tree/master/infra/xssbot)
