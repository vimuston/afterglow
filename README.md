# AFTERGLOW

A small CRT-ASCII roguelike demo that runs in the browser: thick glowing phosphor letters that glide from tile to tile, weather, fog, torchlight, three elemental spells, and an old man by the fire who would like to ask you a few questions.

**Play:** open `index.html` from any static web server (or the GitHub Pages link for this repo).

## Controls
- **Move:** arrow keys / WASD / vi-keys / numpad, or left-click a tile to walk there
- **Spells:** `1` Lightning (devastating to anything standing in water), `2` Fire (burns over time, sets wood alight), `3` Frost (freezes monsters, water, walls, and lava)
- **Aim:** after choosing a spell, click a target or press a direction. Right-click or `Esc` cancels.
- **Inspect:** right-click anything for a description
- **Wait:** `space` / `.`  ·  **Sound:** `M`  ·  **Restart:** `R`

## Files
`core.js` (layout, utilities), `world.js` (map, tiles, monsters), `lore.js` (right-click descriptions), `audio.js` (Web Audio SID-style synth and lofi music), `crt.js` (WebGL CRT shader), `dialogue.js` (the old man), `game.js` (everything else).

`serve.py` is an optional tiny server that only answers requests from the local network.
