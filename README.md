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
    "args": ["s"],
    "color": "yellow"
  },
  "env-var-app": {
    "cmd": "my-app",
    "env": {
      "SOME_VAR": "some-value"
    }
  }
}
~~~

Then run the dictator:

    dictator [/path/to/dictator.json]

Will do the following:

1. Start some-rails-app by changing the cwd to `rails-root` and runinng `rails s`
   and logging its output in yellow
2. Start elasticsearch, log its output in green, wait 3000 to let it initialize
3. Start redis-server, log its output in red
4. Start some-node-server, log its output in blue

If any of the processes quit the others will receive a SIGKILL and dictator will exit.

### exclude some services

    dictator -e nope

### run only some services

    dictator -o yes -o indeed

## pro tips

- Set up a `config` directory next to your `dictator.json` and put all configuration in there
- Set up a `state` directroy next to your `dictator.json` and configure your services
  to put all their state (DBs, logs, etc) in there
- For a nice reset of the environment, simply: `rm -rf state/*` before running the `dictator`.
  Remove the current state and run the dictator. You get it? A coup. Ok, I'm stopping it.
