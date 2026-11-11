# Cadillacs & Dinosaurs 3D: Xenozoic Rampage (2513 AD)

A real-time **3D WebGL (Three.js)** arcade beat-'em-up tribute to the 1993 Capcom CPS-1 classic **Cadillacs and Dinosaurs**, complete with articulated 3D fighters, 3D dinosaurs, a 3D 1953 Cadillac Eldorado V8 with dynamic headlights, real-time soft shadows, and a procedural CPS-1 / QSound-inspired WebAudio synthesizer.

## 3D Graphics & Features
- **Real-Time 3D WebGL Engine (`js/renderer3d.js`)**:
  - Switchable camera perspectives (`VIEW: 3D ARCADE`, `VIEW: 3D ACTION CAM`, and `VIEW: 2D CLASSIC`).
  - Real-time `PCFSoftShadowMap` shadows, ACES Filmic tone mapping, atmospheric fog, and dynamic spotlights.
  - 3D Stage Environments: Sunken Manhattan skyscrapers & prehistoric jungle trees (Stage 1), Canyon mesas & dino ribcage arches (Stage 2), and glowing translucent green bio-cloning vats (Stage 3).
- **4 Playable 3D Heroes**:
  - **Jack Tenrec** (*Spiral Volcano Upper* — Balanced Xenozoic mechanic)
  - **Hannah Dundee** (*Flash Cyclone Kick* — High-speed tracker & +25% weapon damage)
  - **Mustapha Cairo** (*Tornado Flip Kick* — Aerial engineer with signature horizontal flying dropkick)
  - **Mess O'Bradovich** (*Seismic Lariat Crash* — Heavyweight powerhouse brawler)
- **Driveable 3D 1953 Cadillac Eldorado V8**: Plow through poacher gangs, honk the dual-tone horn, illuminate the road with real 3D spotlights, and fire twin hood-mounted guns on Stage 2 or summon an air-drop anytime with `U` / `V`.
- **3D Dinosaurs (Calm vs. Enraged)**: Encounter **3D Velociraptors ("Zeke")**, **3D Triceratops ("Mack")**, and **3D Pteranodons ("Shivat")**. Provoking a calm dinosaur turns it crimson and causes it to attack both Poachers and Players!
- **3D Arcade Arsenal & Pickups**: `.44 Revolver`, `Riot Shotgun`, `M16 Assault Rifle`, `Rocket Launcher`, `Dynamite Bundle`, `Spiked Club`, `Hunter Bowie`, and `Cadillac Radio Transmitter`—plus throw empty firearms at enemies when ammo runs out.

## Controls
| Action | Keys |
| :--- | :--- |
| **Move (8-Way 3D Arena)** | `W` `A` `S` `D` or `Arrow Keys` (or Gamepad) |
| **Sprint / Dash** | Double-tap `Left` or `Right` |
| **Attack / Shoot / Pick Up** | `J` or `Z` |
| **Jump / Jump Kick** | `K`, `X`, or `Space` |
| **Special Crash Attack** | `L`, `C`, or `J + K` |
| **Summon 3D 1953 Cadillac V8** | `U` or `V` |
| **Insert Coin / Extra Life** | `5` or `Enter` |

## Run Locally
Double-click `start-game.bat` or open `index.html` in any modern web browser.
