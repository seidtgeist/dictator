# dictator

Process management for development.

- Start up processes in order
- Colorized output (stdout & stderr)
- If child exits, terminate everything
- If dictator exits, terminate everything
- Looks for dictator.json in current dir (or specify filename in first arg)

## install

    npm install -g dictator

## usage

Create a dictator.json in the root of your project

~~~ json
{
  "redis": {
    "cmd": "redis-server",
    "args": ["--port", 1337],
    "deps": ["elasticsearch"],
    "color": "red"
  },
  "elasticsearch": {
    "cmd": "elasticsearch",
    "args": ["-f"],
    "color": "green"
  }
}
~~~

Then run the dictator:

    dictator [dictator.json]

Will do the following:

1. Start elasticsearch, log its output in green
2. Start redis, log its output in red
