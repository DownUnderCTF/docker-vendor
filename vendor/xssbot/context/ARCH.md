# Marvin Architecture

_This was written in 2 days so :shrug:. Refactor next year or sth._

## Application

-   XSSBot is designed to sit in a "sidecar" fashion to challenges.
    -   However it can be used as a central bot for all challenges to reach-out to assuming all those services can share a common xssbot configuration. (Setting `PER_REQ_LIMITS` may be helpful here).
-   XSSBot utilizes a in-process task queue.
    -   XSSBot processes visits asynchronously, This prevents us from holding too many connections.
    -   There is currently no mechanism to check what the status of a visit is. This is intentional, when tasks succeed or fail they are "forgotten" about to decrease memory usage.
    -   We may want to scale this up.
-   XSSBot is _mostly_ stateless
    -   XSSBot uses a in-container redis process in order to manage the task queue.

## Usage

-   We handle outbound auth through a cookiejar. The user should mount a cookiejar file which will be applied for every request.
-   We handle outbound auth through a http get request. The user should specify what address to get.

## Security

-   [Marvin is paranoid](https://hitchhikers.fandom.com/wiki/Marvin)
