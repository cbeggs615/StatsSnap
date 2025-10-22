---
timestamp: 'Mon Oct 20 2025 13:19:08 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_131908.731088dd.md]]'
content_id: e1c9dd7cced27b1f95eab7ee851d0345439794a940d07d834fad64b812e43fd5
---

# file: deno.json

```json
{
    "imports": {
        "@concepts/": "./src/concepts/",
        "@utils/": "./src/utils/"
    },
    "tasks": {
        "concepts": "deno run --allow-net --allow-read --allow-sys --allow-env src/concept_server.ts --port 8000 --baseUrl /api"
    }
}

```
