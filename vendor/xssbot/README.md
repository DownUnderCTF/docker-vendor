# XSSBot

## Using

### Examples

To access any internet domain only
```yaml
environment:
  - NO_LOCAL_ACCESS: true
```

To access specific internet domains
```yaml
environment:
  - ALLOWED_TARGETS: google.com,https://example.com/wildcard/path/*
```

To allow access to a local container only
```yaml
enviornment:
  - NO_LOCAL_ACCESS: false
```

For stricter access control
```yaml
volumes:
  - ./access.json:/var/xssbot/accessctl/access.json
```

To load a cookie from a file
```yaml
volumes:
  - ./cookiejar.json:/var/xssbot/cookiejars/cookiejar.json
```

To use a custom login script (see _plugins_)
```yaml
volumes:
  - ./myloginscript.js:/var/xssbot/hooks/login.js
```

## Developing

### Threat Model

## Credits

- XSSBot inspired by [google/kctf](https://github.com/google/kctf/tree/v1/dist/challenge-templates/xss-bot)
- XSSBot inspired by [adamyi/CTFProxy](https://github.com/adamyi/CTFProxy/tree/master/infra/xssbot)
