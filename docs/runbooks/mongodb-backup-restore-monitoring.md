# MatchA — Operations Runbook: Monitoring, MongoDB Backup & Disaster Recovery

**Last Updated:** September 21, 2026  
**Applies to:** MatchA Production & Staging Environments (Render & MongoDB Atlas)

---

## 1. Health Monitoring Strategy (Free Tier)

### 1.1 API Health Check Endpoint
The backend exposes a lightweight, safe health monitoring endpoint at `/api/health` (and `/health`).

- **URL:** `https://<your-render-backend>.onrender.com/api/health`
- **Method:** `GET`
- **Authentication:** None (Public status endpoint)
- **Security Guarantee:** Never exposes credentials, connection strings, replica names, or collection schemas.

#### Response Specifications:
- **HTTP 200 OK (Healthy):**
  ```json
  {
    "status": "healthy",
    "state": "online",
    "message": "Backend API and database are operating normally",
    "timestamp": "2026-09-21T09:04:05.018Z",
    "uptime": 3600,
    "checks": {
      "api": "healthy",
      "database": "connected"
    }
  }
  ```
- **HTTP 503 Service Unavailable (Degraded / DB Down):**
  ```json
  {
    "status": "degraded",
    "state": "unhealthy",
    "message": "Service degraded: Database connection unavailable",
    "timestamp": "2026-09-21T09:04:05.036Z",
    "uptime": 3600,
    "checks": {
      "api": "healthy",
      "database": "disconnected"
    }
  }
  ```

---

### 1.2 Recommended Free-Tier Monitoring Services

| Feature | UptimeRobot (Free) | Better Stack / Uptime (Free) |
| :--- | :--- | :--- |
| **Monitors Allowed** | Up to 50 monitors | Up to 10 monitors |
| **Check Interval** | 5 minutes | 3 minutes |
| **Alert Channels** | Email, SMS, Webhook, Discord | Email, Slack, Microsoft Teams |
| **Public Status Page** | Basic included | Modern, customizable included |
| **Idle Spin-Down Prevention** | **Yes** (pings every 5 min prevent Render spin-down) | **Yes** (pings every 3 min prevent Render spin-down) |

> [!NOTE]
> To comply with security best practices, the development team does not register accounts on your behalf. Please follow the Owner Action Plan in Section 5 to configure your free monitoring in less than 5 minutes.

---

## 2. MongoDB Backup Procedure

### 2.1 Automated Local Backup Script
The repository provides `backend/scripts/backup-mongodb.mjs` which exports all active collections with SHA-256 integrity checksums.

#### Usage:
```bash
# Option A: Using existing environment variable
node backend/scripts/backup-mongodb.mjs

# Option B: Passing connection string directly (redacted in output)
node backend/scripts/backup-mongodb.mjs --uri="mongodb+srv://user:pass@cluster.mongodb.net/MatchA"
```

#### What the Script Does:
1. Connects securely and masks credentials in the console log.
2. Iterates over all application collections (`users`, `products`, `orders`, `media_assets`, `notifications`, `deletion_requests`).
3. Dumps JSON documents into `backend/backups/backup_<db>_<timestamp>/`.
4. Computes SHA-256 checksums and writes `manifest.json`.
5. Guarantees safety: `backend/backups/` is automatically ignored in `.gitignore` to prevent committing customer data.

---

## 3. Test Database Restoration Procedure

### 3.1 Restoring to Local / Test Environments
To test recovery or seed a development database:

```bash
node backend/scripts/restore-mongodb-test.mjs \
  --uri="mongodb://localhost:27017/matcha_test" \
  --backup-dir="backend/backups/backup_MatchA_2026-09-21T09-00-00-000Z" \
  --confirm-test-restore
```

### 3.2 Production Safeguards
The restore script includes built-in circuit breakers:
1. **Production Keyword Detection:** If the target URI contains `prod`, `production`, `live`, or known production hostnames, execution is **immediately blocked**.
2. **Mandatory Confirmation Flag:** Requires `--confirm-test-restore` to proceed.
3. **Checksum Verification:** Verifies all file SHA-256 hashes against `manifest.json` before touching the target database.

---

## 4. Disaster Recovery (DR) Runbook

```mermaid
flowchart TD
    A["Alarm Triggered (HTTP 503 or Down Alert)"] --> B["Step 1: Check Render Logs & Atlas Metrics"]
    B --> C{"Is MongoDB Atlas Reachable?"}
    C -->|"No"| D["Check Atlas Status & Network IP Whitelist"]
    C -->|"Yes"| E{"Are API Logs Throwing Errors?"}
    E -->|"Process Crash"| F["Restart Render Web Service"]
    E -->|"Data Corruption"| G["Execute Point-in-Time Restore"]
    G --> H["Verify Record Counts with Manifest"]
    H --> I["Test /api/health Returns 200 OK"]
```

### Incident Response Steps:
1. **Acknowledge Alert:** Check if UptimeRobot / Better Stack reported downtime.
2. **Triage:** Open Render dashboard logs and MongoDB Atlas Monitoring tab.
3. **Verify Health Endpoint:** Run `curl -i https://<backend-url>/api/health`.
4. **Data Verification:** If database restore was performed, verify record counts:
   - Members count matches manifest
   - Orders count matches financial records
   - Product inventory matches catalog count

---

## 5. Owner Action Plan (ขั้นตอนที่เจ้าของต้องทำเอง)

### 5.1 MongoDB Atlas Dashboard (5 mins)
1. **Network Access (IP Whitelist):**
   - Log in to [cloud.mongodb.com](https://cloud.mongodb.com).
   - Go to **Security > Network Access**.
   - Ensure Render's outbound access is permitted (either `0.0.0.0/0` with strong password, or specific static IPs).
2. **Dedicated Backup User:**
   - Go to **Security > Database Access**.
   - Click **Add New Database User**.
   - Create user `matcha_backup_bot` with `readAnyDatabase` privileges for automated backups.

### 5.2 Render Dashboard (3 mins)
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Select your **MatchA Web Service**.
3. Under **Settings > Health Check Path**, enter:
   ```text
   /api/health
   ```
4. Click **Save Changes**. Render will now automatically monitor your service and restart containers if the health check fails repeatedly.

### 5.3 Set Up Free Monitoring (UptimeRobot / Better Stack) (4 mins)
1. Sign up for free at [uptimerobot.com](https://uptimerobot.com) or [betterstack.com](https://betterstack.com).
2. Click **Add New Monitor**:
   - **Monitor Type:** `HTTP(s)`
   - **Friendly Name:** `MatchA API & DB Health`
   - **URL / IP:** `https://<your-render-service>.onrender.com/api/health`
   - **Monitoring Interval:** `5 minutes` (This also keeps Render's free tier instance warm and responsive!).
3. Select your notification email or Discord/Telegram webhook.
4. Save the monitor.
