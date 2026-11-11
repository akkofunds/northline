# TACOPS — Three.js tactical shooter (Step 1)
Engine · Shipping Yard map · procedural Glock viewmodel · Source-style b-hop movement.
Step 2 (PeerJS lobby + chat) and Step 3 (courtyard map + selector, TDM/FFA) follow.

## Run
    npm install
    npm run dev          # http://localhost:5173

## Deploy
1. `./push-to-github.sh my-repo` (or create a repo and `git push`)
2. vercel.com → Add New Project → import the repo. Vite is auto-detected. Done.

## Architecture
    src/main.js      loop, input, firing/spread, HUD, decals
    src/engine.js    renderer, sky/sun, static-geometry Batcher (merge per material per 24m chunk), UV helpers
    src/textures.js  procedural PBR maps (fbm -> colour / normal / roughness)
    src/movement.js  fixed 128Hz Source-style controller + AABB/ramp collision
    src/glock.js     procedural Glock + animation (sway, bob, blowback, flash, reload)
    src/maps/yard.js Map 1 (map = scene + colliders + spawns)
