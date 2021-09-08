# Benchmarks

_TODO_

## Idle
The process idles at ~75MB of memory after bootup.

## Sane load
8 concurrent requests to example.com took < 1s and consumed 100MB of memory.

## High load
128 concurrent requests to example.com took < 2s and consumed 120MB of memory.
```shell
$ for i in `seq 1 128`; do curl -X POST http://localhost:8000/visit -H 'x-ssrf-protection: 1' -d '{"url":"http://example.com"}' -H 'Content-Type: application/json' & true; done
```
