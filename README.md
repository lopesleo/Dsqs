A Discord client and [DeckyLoader](https://github.com/SteamDeckHomebrew/PluginLoader) plugin that integrates Discord into Steam Deck's quick access menu.

<img src="screenshot1.png" width="50%">
<img src="screenshot2.png" width="50%">

## Features

- Connect to Discord servers.
- See connected clients and join their channels.
- Browse and join available channels on the server.
- See client avatars and their current status.
- Mute/Unmute microphone and speakers.
- Control audio volumes of running applications.
- Push-to-Talk via shoulder buttons (L/R 4-5).
- Disconnect from current server.

## Building

### Backend

The following dependencies are required to build the Discord client plugin:
1. [mongoose](https://github.com/cesanta/mongoose): for HTTP server/client and web sockets
1. [discord-rpc](https://github.com/discord/discord-rpc): the Discord RPC SDK
1. libpulse: to control audio volumes of applications
1. libsqlite3: to inject bookmarks into Discord settings.db

To download dependencies 1-2 run `make vendor` (this requires `curl`). All other dependencies need to be installed manually. Then run `make` to build the plugin.

Change the working directory to `backend/` before issuing any `make` commands.

### Frontend

The following tools are required to build the DeckyLoader plugin:
1. [Node.js](https://nodejs.org): JavaScript runtime required for building
1. [pnpm](https://pnpm.io): package manager for JavaScript/Node.js

After all required tools are installed run the following commands to build the frontend:

```sh
$ pnpm install
$ pnpm run /^build/
```

This should create a `plugin.zip` file containing both the front- and backend part of the plugin.

## Installing

Follow these steps in order to install and setup the plugin on your Steam Deck:
1. Install DeckyLoader on your Steam Deck as described [here](https://github.com/SteamDeckHomebrew/PluginLoader).
1. Switch to desktop mode, download Discord from the Discover store and launch it.
1. Add all Discord servers you want to connect to as bookmarks (if applicable).
1. If you want to use Push-to-Talk allow Discord to access your Steam Deck inputs:  
   `flatpak override --user com.discordapp.Discord --device=all`
1. Switch back to gaming mode and install Discord QuickAccess from the DeckyLoader store.

To install the plugin manually follow steps 1-4 from above and then:
1. Download a [pre build version](https://github.com/ILadis/ts3-qs4sd/releases) of the DeckyLoader plugin and copy it to your Steam Deck.
1. Go to DeckyLoader settings and enable developer mode.
1. Open the DeckyLoader developer menu and select "Install Plugin from ZIP File".
