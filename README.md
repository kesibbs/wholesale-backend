# wholesale-backend

Basic wholesale backend (Node.js 18 + Express) used for EX288 S2I build drills.
Dependencies are intentionally fetched from an internal npm registry passed at
build time via the `npm_config_registry` environment variable.

## Endpoints

- `GET /health` – liveness/readiness probe target
- `GET /api/products` – wholesale catalog with bulk pricing
- `GET /api/products/:id`
- `POST /api/orders` – `{"customer":"...","items":[{"productId":1,"qty":50}]}`
  (bulk price applies automatically when qty >= bulkQty)
- `GET /api/orders`

## Deploy on OpenShift (the drill)

```bash
oc new-app nodejs:18-ubi9~<this-repo-url> \
  --name wholesale-backend \
  --build-env npm_config_registry=http://192.168.70.156:8081/npm
oc logs -f bc/wholesale-backend        # watch npm pull from the internal registry
oc expose svc/wholesale-backend
```

## Run locally

```bash
npm install
npm start                              # listens on :8080 (or $PORT)
```
