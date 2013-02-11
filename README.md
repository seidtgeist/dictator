# dictator

Process management for development.

- Start up processes in order
- Configurable wait time to allow dependencies to start up properly
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
    "color": "red",
  },
  "elasticsearch": {
    "cmd": "elasticsearch",
    "args": ["-f"],
    "color": "green",
    "wait": 3000
  },
  "some-node-server": {
    "cmd": "some-node-server",
    "deps": ["elasticsearch", "redis"],
    "color": "blue"
  },
  "some-rails-app": {
    "cwd": "rails-root",
    "cmd": "rails",
    "args": ["s"]
  }
}
~~~

Then run the dictator:

    dictator [dictator.json]

Will do the following:

1. Start elasticsearch, log its output in green
2. Start redis, log its output in red
