# AFTERGLOW

A small CRT-ASCII roguelike that runs in the browser: thick glowing phosphor letters that glide from tile to tile, weather, fog, torchlight, three elemental spells, and an old man by a campfire who would like to ask you a few questions.

Somewhere at the bottom of five floors lies the **immortality stone**. Eli, the old man, wanders down now and then. You'll find him at the top of every floor with a kettle, a few things to sell, and a favour to ask.

**Play:** open `index.html` from any static web server (or the GitHub Pages link for this repo).

## The way down
1. **The Old Cellars**: rooms and corridors, blades only. At the far end waits Gutmother Grukka, who keeps the book of **Fire**.
2. **Greywind Pass**: snow, pines and dry brambles that hide things when burned. Light four cold torches to open the Broodmother's den. She poisons and spits webs, hates fire, and keeps **Lightning**.
3. **The Whispering Mire**: bog, reeds and swamp gas, where lightning in the water hits everything standing in it. The Mire Hydra grows two heads for every one you cut, unless it's burning when you cut it. It keeps **Frost**.
4. **The Ember Deeps**: a river of lava and a river of black water, and you need frost to cross both. Cinder the dragon breathes fire on everything it can see, so hide behind the pillars, then hit it while it pants. Its hoard holds **Holy**.
5. **The Sunken Tomb**: four seals that each need a different trick, undead that each shrug off something, and King Aurex, who shows you every spell a turn or two before it lands. Holy light burns all of them.

## Rules of thumb
- **Armour class, no dodging:** every attack rolls d20 + skill against the target's AC. A natural 20 (or your weapon's crit range) is a **critical hit**. Frozen things are easy to hit and take double damage from blades.
- **Eli's shop** sells a dagger, a sword and an axe (better ones on every floor), plus healing and mana potions. Do his **favour** on each floor and he gives you a piece of armour.
- If you fall, `R` puts you back at the top of the same floor, as you were when you arrived.

## Controls
- **Move:** arrow keys / WASD / vi-keys / numpad, or left-click a tile to walk there
- **Spells** (once found): `1` Fire, `2` Lightning, `3` Frost, `4` Holy. Aim with a direction key or a click; right-click or `Esc` cancels.
- **Potions:** `5` healing, `6` mana · **Pack:** `I` (gear, potions, favours)
- **Inspect:** right-click anything for a description
- **Wait:** `space` / `.`  ·  **Sound:** `M`  ·  **Restart:** `R`

## Files
`core.js` (layout, utilities), `world.js` (tiles, monsters, the five floor generators), `lore.js` (right-click descriptions), `audio.js` (Web Audio SID-style synth and lofi music), `crt.js` (WebGL CRT shader), `dialogue.js` (Eli: conversations, shop, favours), `game.js` (everything else).

`serve.py` is an optional tiny server that only answers requests from the local network. For testing, `warp(n)` in the browser console jumps to floor `n` with a fitting kit.
