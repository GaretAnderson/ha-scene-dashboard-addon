# HA Scene Dashboard Add-on — Findings

## Date
2026-04-16

## Backup

### Attempt
- **Method**: Called `hassio.backup_full` service via HA REST API
  (`POST /api/services/hassio/backup_full` with body `{"name": "pre-addon-deploy-2026-04-16"}`)
- **Result**: HTTP 200 returned, but backup manager state remained `idle` — the service call
  was accepted but did not trigger a new backup (likely because the long-lived access token
  lacks Supervisor-level permissions required for backup operations)
- **Existing backup**: An automatic daily backup completed on **2026-04-15 at 04:56:16**
  (confirmed via `sensor.backup_last_successful_automatic_backup` state)
- **Supervisor API** (`/api/hassio/backups`): Returns **401 Unauthorized** with long-lived
  access tokens — these endpoints require Supervisor-scoped tokens only available inside add-ons

### Backup Verification
The HAOS device has automatic daily backups enabled. The most recent successful backup
was less than 24 hours old at the time of this deployment attempt.

---

## Add-on Repository

### GitHub URL
https://github.com/GaretAnderson/ha-scene-dashboard-addon

### Branch
`attempt/2026-04-16-initial`

### Structure
```
ha-scene-dashboard-addon/
├── .gitignore
├── README.md
├── repository.yaml              ← HA custom repository declaration
└── ha-scene-dashboard/          ← Add-on folder
    ├── config.yaml              ← Add-on manifest (ingress, arch, slug)
    ├── Dockerfile               ← Alpine + Node.js + Express
    ├── run.sh                   ← Entry point (bashio + node)
    └── app/
        ├── server.js            ← Express proxy using SUPERVISOR_TOKEN
        ├── dashboard.html       ← Scene grid UI (dark theme)
        └── package.json         ← Dependencies (express)
```

### Key Design Decisions
- **SUPERVISOR_TOKEN only**: No file-based tokens; the add-on uses the injected
  `SUPERVISOR_TOKEN` environment variable provided by HA Supervisor
- **Ingress**: `ingress: true` with `ingress_port: 3000` — HA proxies browser
  requests to the add-on, handling authentication automatically
- **No CORS issues**: Since the browser talks to HA's own domain, and HA proxies
  to the add-on, there are no cross-origin issues
- **Node.js 18+**: Uses built-in `fetch()` — no need for `node-fetch` dependency

---

## Deployment Result

### Outcome: **API Deployment Failed (401 Unauthorized)**

All Supervisor API endpoints (`/api/hassio/*`) return **401 Unauthorized** when
accessed with a long-lived access token. This is by design — the Supervisor API
requires a Supervisor-scoped token (available only inside running add-ons or via
the HA CLI on the device itself).

### Attempted Endpoints
| Endpoint | Method | Status |
|---|---|---|
| `/api/hassio/store/repositories` | POST | 401 |
| `/api/hassio/addons/ha_scene_dashboard/install` | POST | 401 |
| `/api/hassio/backups/new/full` | POST | 401 |
| `/api/hassio/backups` | GET | 401 |

### Root Cause
Long-lived access tokens (created in HA UI → Profile → Security) authenticate
against the HA Core REST API (`/api/*`) but **not** against the Supervisor API
(`/api/hassio/*`). The Supervisor API requires either:
1. A **Supervisor token** (injected into add-ons via `SUPERVISOR_TOKEN`)
2. The **HA CLI** (`ha` command) on the HAOS device itself

---

## Manual Deployment Instructions

Since automated API deployment is not possible with a long-lived access token,
follow these steps to install the add-on manually:

### Step 1: Add Custom Repository
1. Open Home Assistant at **http://192.168.1.110:8123**
2. Go to **Settings → Add-ons → Add-on Store**
3. Click the **⋮** menu (three dots, top right)
4. Click **Repositories**
5. Paste this URL:
   ```
   https://github.com/GaretAnderson/ha-scene-dashboard-addon
   ```
6. Click **Add** → **Close**

### Step 2: Install the Add-on
1. Refresh the Add-on Store page (pull down or click refresh)
2. Scroll down or search for **"HA Scene Dashboard"**
3. Click on it → Click **Install**
4. Wait for the Docker image to build (may take 1-3 minutes)

### Step 3: Start and Access
1. After installation, click **Start**
2. Check the **Log** tab — you should see:
   ```
   HA Scene Dashboard add-on running on port 3000
   ```
3. Enable **Show in sidebar** toggle for quick access
4. Click **Open Web UI** or find "Scene Dashboard" in the sidebar

### Step 4: Verify
- The dashboard should show all configured scenes as cards
- Each card has an **Activate** button to trigger the scene
- The status indicator should show **Connected** (green dot)

---

## Ingress URL

Once deployed, the ingress URL pattern is:
```
http://192.168.1.110:8123/api/hassio_ingress/<ingress_token>/
```
The exact URL is visible in the add-on info page or via the sidebar link.

---

## What Would Be Improved With More Time

1. **Supervisor CLI deployment**: SSH into the HAOS device and use `ha addons install`
   for automated deployment without needing Supervisor API access
2. **CHANGELOG.yaml**: Add proper add-on changelog for the HA store listing
3. **Icon and logo**: Add `icon.png` and `logo.png` to the add-on for a polished
   store appearance
4. **Scene grouping**: Group scenes by area/room in the dashboard
5. **WebSocket support**: Use HA WebSocket API for real-time state updates instead
   of polling
6. **Translations**: Add `translations/en.yaml` for add-on configuration UI
7. **Health check**: Add Docker HEALTHCHECK to the Dockerfile
8. **Tests**: Port existing tests from the standalone dashboard project
9. **Multi-arch build validation**: Test on ARM devices (Raspberry Pi)
10. **Backup automation**: Create a pre-deploy backup from within an existing add-on
    that has Supervisor access
