# HA Scene Dashboard Add-on

A native Home Assistant add-on that provides a web dashboard for controlling scenes.

## Features

- View all configured scenes in a card-based grid layout
- Activate scenes with one click
- Dark theme matching HA design language
- Runs natively as an HA add-on with ingress support
- Uses `SUPERVISOR_TOKEN` — no manual token configuration needed

## Installation

### Via Custom Repository

1. In Home Assistant, go to **Settings → Add-ons → Add-on Store**
2. Click the **⋮** menu (top right) → **Repositories**
3. Add: `https://github.com/GaretAnderson/ha-scene-dashboard-addon`
4. Click **Close**, then refresh the page
5. Find **HA Scene Dashboard** in the store and click **Install**
6. After installation, click **Start**
7. Enable **Show in sidebar** for quick access

## Architecture

```
Browser ──[HA ingress proxy]──► Node.js server ──► HA Supervisor API
                                  (in add-on)       http://supervisor/core/api
```

- The add-on runs a lightweight Express server on the ingress port
- All API calls are proxied through the server using `SUPERVISOR_TOKEN`
- No tokens are exposed to the browser — auth is handled by HA ingress
- The dashboard fetches scenes via relative `/api/states` calls

## Development

The add-on folder structure:

```
ha-scene-dashboard/
├── config.yaml       # Add-on manifest
├── Dockerfile        # Alpine + Node.js
├── run.sh            # Entry point
└── app/
    ├── server.js     # Express proxy server
    ├── dashboard.html# Scene dashboard UI
    └── package.json  # Node.js dependencies
```

## License

MIT
