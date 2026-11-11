// ============================================================================
// CADILLACS & DINOSAURS: XENOZOIC RAMPAGE - MAIN GAME ENGINE
// ============================================================================

class CadillacsGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.webglCanvas = document.getElementById('webgl-canvas');
    this.renderer = new window.ArcadeRenderer(this.canvas);
    this.renderer3d = window.ArcadeRenderer3D && this.webglCanvas
      ? new window.ArcadeRenderer3D(this.webglCanvas)
      : null;
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.mode = 'select'; // select, playing, stage_clear, gameover, victory
    this.heroKeys = ['jack', 'hannah', 'mustapha', 'mess'];
    this.selectedHeroIndex = 0;

    this.stageIndex = 0;
    this.currentStage = window.GAME_DATA.STAGES[0];
    this.cameraX = 0;
    this.cameraLocked = false;
    this.activeWave = null;
    this.showGoArrow = false;

    this.score = 0;
    this.lives = 3;
    this.cadillacCalls = 2;
    this.comboCount = 0;
    this.comboResetTimer = 0;

    this.aiPartnerEnabled = true;
    this.player = null;
    this.partner = null;
    this.cadillac = null;

    this.enemies = [];
    this.dinosaurs = [];
    this.props = [];
    this.pickups = [];
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];

    this.hitStopTimer = 0;
    this.screenShake = 0;
    this.stageBannerTimer = 0;
    this.time = 0;

    // Input state & double-tap dash detector
    this.keys = {};
    this.justPressed = {};
    this.lastTapTime = { left: 0, right: 0 };
    this.dashActive = false;

    this.bindEvents();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
        e.preventDefault();
      }
      if (!this.keys[code]) {
        this.justPressed[code] = true;
        this.handleKeyDown(code);
      }
      this.keys[code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(e.code)) {
        this.dashActive = false;
      }
    });

    // Mouse click support on character select & screens
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * this.width;
      const my = ((e.clientY - rect.top) / rect.height) * this.height;
      this.handleCanvasClick(mx, my);
    });

    // Toolbar UI buttons
    const btnCam = document.getElementById('btn-cam');
    const btnCoop = document.getElementById('btn-coop');
    const btnCrt = document.getElementById('btn-crt');
    const btnSound = document.getElementById('btn-sound');
    const btnControls = document.getElementById('btn-controls');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnFullscreen = document.getElementById('btn-fullscreen');
    const modal = document.getElementById('controls-modal');
    const crtOverlay = document.getElementById('crt-overlay');

    if (btnCam && this.renderer3d) {
      btnCam.addEventListener('click', () => {
        const mode = this.renderer3d.cycleCameraMode();
        const labels = {
          arcade3d: 'VIEW: 3D ARCADE',
          action3d: 'VIEW: 3D ACTION CAM',
          classic2d: 'VIEW: 2D CLASSIC'
        };
        btnCam.textContent = labels[mode] || 'VIEW: 3D ARCADE';
      });
    }

    btnCoop.addEventListener('click', () => {
      this.aiPartnerEnabled = !this.aiPartnerEnabled;
      btnCoop.textContent = `AI PARTNER: ${this.aiPartnerEnabled ? 'ON' : 'OFF'}`;
      btnCoop.classList.toggle('active', this.aiPartnerEnabled);
      if (this.mode === 'playing') {
        if (this.aiPartnerEnabled && (!this.partner || this.partner.dead)) {
          this.spawnPartner();
        } else if (!this.aiPartnerEnabled) {
          this.partner = null;
        }
      }
    });

    btnCrt.addEventListener('click', () => {
      const isOff = crtOverlay.classList.toggle('off');
      btnCrt.textContent = `CRT: ${isOff ? 'OFF' : 'ON'}`;
      btnCrt.classList.toggle('active', !isOff);
    });

    btnSound.addEventListener('click', () => {
      const on = window.arcadeAudio.toggle();
      btnSound.textContent = `SOUND: ${on ? 'ON' : 'OFF'}`;
      btnSound.classList.toggle('active', on);
    });

    btnControls.addEventListener('click', () => modal.classList.add('visible'));
    btnCloseModal.addEventListener('click', () => modal.classList.remove('visible'));

    btnFullscreen.addEventListener('click', () => {
      const wrapper = document.getElementById('arcade-cabinet');
      if (!document.fullscreenElement) {
        wrapper.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
  }

  handleKeyDown(code) {
    const modal = document.getElementById('controls-modal');
    if (code === 'Escape' && modal.classList.contains('visible')) {
      modal.classList.remove('visible');
      return;
    }

    // Double-tap left/right for sprint/dash
    const now = performance.now();
    if (code === 'ArrowLeft' || code === 'KeyA') {
      if (now - this.lastTapTime.left < 260) this.dashActive = true;
      this.lastTapTime.left = now;
    }
    if (code === 'ArrowRight' || code === 'KeyD') {
      if (now - this.lastTapTime.right < 260) this.dashActive = true;
      this.lastTapTime.right = now;
    }

    if (this.mode === 'select') {
      window.arcadeAudio.startMusic('select');
      if (code === 'ArrowLeft' || code === 'KeyA') {
        this.selectedHeroIndex = (this.selectedHeroIndex + 3) % 4;
        window.arcadeAudio.sfxSwing();
      } else if (code === 'ArrowRight' || code === 'KeyD') {
        this.selectedHeroIndex = (this.selectedHeroIndex + 1) % 4;
        window.arcadeAudio.sfxSwing();
      } else if (['Enter', 'Space', 'KeyJ', 'KeyZ'].includes(code)) {
        window.arcadeAudio.sfxCoin();
        this.startNewGame(this.heroKeys[this.selectedHeroIndex]);
      }
    } else if (this.mode === 'gameover') {
      if (['Digit5', 'Enter', 'Space', 'KeyJ', 'KeyZ'].includes(code)) {
        window.arcadeAudio.sfxCoin();
        this.lives = 3;
        this.cadillacCalls = 2;
        this.respawnPlayer();
        this.mode = 'playing';
      }
    } else if (this.mode === 'victory') {
      if (['Enter', 'Space', 'KeyJ', 'KeyZ'].includes(code)) {
        this.mode = 'select';
        window.arcadeAudio.startMusic('select');
      }
    } else if (this.mode === 'playing') {
      // Summon 1953 Cadillac Air-Drop with U or V
      if (code === 'KeyU' || code === 'KeyV') {
        this.summonCadillac();
      }
      // Insert Extra Coin / Life with 5
      if (code === 'Digit5') {
        this.lives++;
        window.arcadeAudio.sfxCoin();
        if (this.player) {
          this.addFloatingText('CREDIT +1 LIFE!', this.player.x, 95, this.player.z, '#ffd700');
        }
      }
    }
  }

  handleCanvasClick(mx, my) {
    if (this.mode === 'select') {
      window.arcadeAudio.startMusic('select');
      // Check if clicked on one of the 4 character cards
      for (let i = 0; i < 4; i++) {
        const cardX = 80 + i * 285;
        const cardY = 155;
        if (mx >= cardX && mx <= cardX + 260 && my >= cardY && my <= cardY + 430) {
          this.selectedHeroIndex = i;
          window.arcadeAudio.sfxCoin();
          this.startNewGame(this.heroKeys[i]);
          return;
        }
      }
    } else if (this.mode === 'gameover') {
      window.arcadeAudio.sfxCoin();
      this.lives = 3;
      this.respawnPlayer();
      this.mode = 'playing';
    } else if (this.mode === 'victory') {
      this.mode = 'select';
    }
  }

  // ==========================================================================
  // GAME & STAGE INITIALIZATION
  // ==========================================================================
  startNewGame(heroId) {
    this.score = 0;
    this.lives = 3;
    this.cadillacCalls = 2;
    this.stageIndex = 0;
    this.heroId = heroId;
    this.loadStage(0, true);
  }

  createHeroFighter(heroId, isPlayer1 = true) {
    const h = window.GAME_DATA.HEROES[heroId];
    return new window.Fighter({
      isPlayer1,
      isPartner: !isPlayer1,
      heroId: h.id,
      name: h.name,
      x: isPlayer1 ? 180 : 130,
      z: isPlayer1 ? 10 : -20,
      hp: h.stats.stamina,
      speedX: h.speedX,
      speedZ: h.speedZ,
      jumpPower: h.jumpPower,
      attackDamage: h.attackDamage,
      dashDamage: h.dashDamage,
      specialName: h.specialName,
      specialDamage: h.specialDamage,
      weaponBonus: h.weaponBonus || 1.0,
      palette: h.palette
    });
  }

  spawnPartner() {
    const partnerChoices = this.heroKeys.filter((k) => k !== this.heroId);
    const partnerHero = partnerChoices[0] || 'hannah';
    this.partner = this.createHeroFighter(partnerHero, false);
    this.partner.x = (this.player ? this.player.x : this.cameraX + 180) - 45;
    this.partner.z = 18;
  }

  loadStage(index, resetPlayer = false) {
    this.stageIndex = index;
    this.currentStage = window.GAME_DATA.STAGES[index];
    this.cameraX = 0;
    this.cameraLocked = false;
    this.activeWave = null;
    this.showGoArrow = false;
    this.stageBannerTimer = 190;

    this.enemies = [];
    this.dinosaurs = [];
    this.pickups = [];
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.cadillac = null;

    // Clone stage waves & breakable props
    this.waves = JSON.parse(JSON.stringify(this.currentStage.waves));
    this.props = this.currentStage.props.map((p) => ({
      ...p,
      hp: 30,
      hitShake: 0
    }));

    if (resetPlayer || !this.player) {
      this.player = this.createHeroFighter(this.heroId, true);
    } else {
      this.player.x = 180;
      this.player.z = 10;
      this.player.y = 0;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 60);
    }

    if (this.aiPartnerEnabled) {
      this.spawnPartner();
    } else {
      this.partner = null;
    }

    if (this.currentStage.startWithCadillac) {
      this.summonCadillac(true);
    }

    this.mode = 'playing';
    window.arcadeAudio.startMusic(this.currentStage.music);
  }

  respawnPlayer() {
    this.player = this.createHeroFighter(this.heroId, true);
    this.player.x = this.cameraX + 180;
    this.player.z = 0;
    this.player.invulnTimer = 120;
  }

  summonCadillac(free = false) {
    if (this.cadillac && this.cadillac.active) return;
    if (!free && this.cadillacCalls <= 0) {
      if (this.player) {
        this.addFloatingText('NO CADILLAC TRANSMITTERS LEFT!', this.player.x, 90, this.player.z, '#ff5252');
      }
      return;
    }
    if (!free) this.cadillacCalls--;
    window.arcadeAudio.sfxCadillacHorn();
    this.shakeScreen(12);
    const spawnX = this.player ? this.player.x : this.cameraX + 220;
    const spawnZ = this.player ? this.player.z : 0;
    this.cadillac = new window.CadillacVehicle(spawnX, spawnZ, free ? 680 : 540);
    this.addFloatingText('1953 CADILLAC V8 AIR-DROP!', spawnX, 110, spawnZ, '#ffd700');
  }

  // ==========================================================================
  // INPUT POLLING (KEYBOARD + GAMEPAD)
  // ==========================================================================
  pollInput() {
    const gp = navigator.getGamepads ? navigator.getGamepads()[0] : null;
    const gpLeft = gp && (gp.axes[0] < -0.35 || gp.buttons[14]?.pressed);
    const gpRight = gp && (gp.axes[0] > 0.35 || gp.buttons[15]?.pressed);
    const gpUp = gp && (gp.axes[1] < -0.35 || gp.buttons[12]?.pressed);
    const gpDown = gp && (gp.axes[1] > 0.35 || gp.buttons[13]?.pressed);
    const gpAttack = gp && (gp.buttons[0]?.pressed || gp.buttons[2]?.pressed);
    const gpJump = gp && gp.buttons[1]?.pressed;
    const gpSpecial = gp && gp.buttons[3]?.pressed;

    return {
      left: !!(this.keys.ArrowLeft || this.keys.KeyA || gpLeft),
      right: !!(this.keys.ArrowRight || this.keys.KeyD || gpRight),
      up: !!(this.keys.ArrowUp || this.keys.KeyW || gpUp),
      down: !!(this.keys.ArrowDown || this.keys.KeyS || gpDown),
      attack: !!(this.keys.KeyJ || this.keys.KeyZ || gpAttack),
      attackPressed: !!(this.justPressed.KeyJ || this.justPressed.KeyZ || gpAttack),
      jumpPressed: !!(this.justPressed.KeyK || this.justPressed.KeyX || this.justPressed.Space || gpJump),
      specialPressed: !!(
        this.justPressed.KeyL ||
        this.justPressed.KeyC ||
        (this.keys.KeyJ && this.keys.KeyK) ||
        gpSpecial
      )
    };
  }

  // ==========================================================================
  // PLAYER CONTROLS & COMBAT ACTIONS
  // ==========================================================================
  updatePlayer(input) {
    const p = this.player;
    if (!p || p.dead) return;

    p.update(this);
    if (p.state === 'knockdown' || p.hurtTimer > 0) return;

    // Desperation Special Move (L / C / J+K)
    if (input.specialPressed && p.state !== 'special') {
      this.performSpecialAttack(p);
      return;
    }

    // Jump (K / X / Space)
    if (input.jumpPressed && p.y === 0 && p.attackTimer === 0) {
      p.vy = p.jumpPower;
      p.y = 1;
      p.state = 'jump';
      window.arcadeAudio.sfxJump();
    }

    // Attack / Pick Up / Shoot / Grapple Throw
    if (input.attackPressed && p.attackTimer === 0) {
      // Check if standing over a pickup first
      const nearbyPickup = this.pickups.find(
        (item) => Math.abs(item.x - p.x) < 48 && Math.abs(item.z - p.z) < 24
      );
      if (nearbyPickup && p.y === 0) {
        this.collectPickup(p, nearbyPickup);
        return;
      }

      // Check close-range Grapple Shoulder Throw if holding Left/Right near an enemy
      if (p.y === 0 && (input.left || input.right)) {
        const grabCandidate = this.enemies.find(
          (e) =>
            !e.dead &&
            e.state !== 'knockdown' &&
            Math.abs(e.x - p.x) < 44 &&
            Math.abs(e.z - p.z) < 18
        );
        if (grabCandidate) {
          this.performShoulderThrow(p, grabCandidate, input.left ? -1 : 1);
          return;
        }
      }

      this.performPlayerAttack(p);
      return;
    }

    // Automatic rapid fire for M16 if holding attack button
    if (input.attack && p.weapon && p.weapon.id === 'm16' && p.attackTimer === 0) {
      this.performPlayerAttack(p);
      return;
    }

    // Movement when not locked in ground attack
    if (p.attackTimer === 0 || p.y > 0) {
      let mx = 0;
      let mz = 0;
      if (input.left) {
        mx = -1;
        p.facing = -1;
      }
      if (input.right) {
        mx = 1;
        p.facing = 1;
      }
      if (input.up) mz = -1;
      if (input.down) mz = 1;

      p.isMoving = mx !== 0 || mz !== 0;
      p.isRunning = this.dashActive && mx !== 0 && p.y === 0;

      const mult = p.isRunning ? 1.55 : 1.0;
      p.x += mx * p.speedX * mult;
      p.z += mz * p.speedZ;

      if (p.isRunning && this.time % 6 === 0) {
        this.spawnDust(p.x - p.facing * 16, p.z, 2);
      }
    }
  }

  performPlayerAttack(fighter) {
    // Running Dash Attack (e.g. Mustapha Flying Dropkick!)
    if (fighter.isRunning && fighter.y === 0) {
      fighter.state = 'dash_attack';
      fighter.attackTimer = 20;
      if (fighter.heroId === 'mustapha') {
        fighter.vy = 7.5;
        fighter.y = 4;
      }
      window.arcadeAudio.sfxSwing();
      this.meleeHitbox(fighter, 74, fighter.dashDamage, true);
      this.dashActive = false;
      return;
    }

    // Firearm / Thrown Weapon handling
    if (fighter.weapon) {
      const w = fighter.weapon;
      if (w.ammo <= 0) {
        // Authentic Cadillacs & Dinosaurs mechanic: Throw the empty gun!
        window.arcadeAudio.sfxSwing();
        this.projectiles.push({
          x: fighter.x + fighter.facing * 24,
          y: 48,
          z: fighter.z,
          vx: fighter.facing * 13,
          vy: 2.5,
          damage: 34,
          fromPlayer: true,
          knockdown: true,
          color: '#cfd8dc',
          isThrownGun: true
        });
        this.addFloatingText('THREW EMPTY GUN!', fighter.x, 85, fighter.z, '#ffd700');
        fighter.weapon = null;
        fighter.attackTimer = 16;
        return;
      }

      if (w.type === 'gun') {
        w.ammo--;
        fighter.attackTimer = w.fireRate;
        window.arcadeAudio.sfxGunshot(w.id);
        const dmg = Math.round(w.damage * fighter.weaponBonus);

        if (w.spread) {
          // Riot Shotgun spread
          [-1.8, 0, 1.8].forEach((vzOff) => {
            this.projectiles.push({
              x: fighter.x + fighter.facing * 34,
              y: 48,
              z: fighter.z + vzOff * 4,
              vx: fighter.facing * w.bulletSpeed,
              vy: vzOff * 0.6,
              damage: dmg,
              fromPlayer: true,
              knockdown: true,
              color: w.color
            });
          });
        } else {
          this.projectiles.push({
            x: fighter.x + fighter.facing * 34,
            y: 48,
            z: fighter.z,
            vx: fighter.facing * w.bulletSpeed,
            vy: 0,
            damage: dmg,
            fromPlayer: true,
            explosive: !!w.explosive,
            knockdown: !!w.explosive,
            color: w.color
          });
        }
        return;
      } else if (w.type === 'thrown') {
        w.ammo--;
        fighter.attackTimer = 18;
        window.arcadeAudio.sfxSwing();
        this.projectiles.push({
          x: fighter.x + fighter.facing * 24,
          y: 52,
          z: fighter.z,
          vx: fighter.facing * 9.5,
          vy: 7.5,
          damage: w.damage,
          fromPlayer: true,
          explosive: true,
          knockdown: true,
          color: '#ff1744'
        });
        if (w.ammo <= 0) fighter.weapon = null;
        return;
      } else if (w.type === 'melee') {
        w.ammo--;
        fighter.attackTimer = 14;
        window.arcadeAudio.sfxSwing();
        this.meleeHitbox(fighter, 72, Math.round(w.damage * fighter.weaponBonus), true);
        if (w.ammo <= 0) fighter.weapon = null;
        return;
      }
    }

    // Standard 4-Hit Unarmed Combo or Jump Kick
    window.arcadeAudio.sfxSwing();
    if (fighter.y > 0) {
      fighter.attackTimer = 16;
      this.meleeHitbox(fighter, 62, fighter.attackDamage[2], true);
    } else {
      fighter.state = 'attack';
      fighter.attackTimer = 12;
      const step = fighter.comboStep;
      const dmg = fighter.attackDamage[step] || 15;
      const isFinisher = step >= 3;
      const hitAnyone = this.meleeHitbox(fighter, 60, dmg, isFinisher);
      if (hitAnyone) {
        fighter.comboStep = (step + 1) % 4;
        fighter.comboTimer = 34;
      }
    }
  }

  performShoulderThrow(player, target, throwDir) {
    player.facing = throwDir;
    player.attackTimer = 22;
    player.invulnTimer = 24;
    window.arcadeAudio.sfxHitHeavy();
    target.takeDamage(28, throwDir, true, this);
    target.vx = throwDir * 10.5;
    target.vy = 11.0;
    this.shakeScreen(7);
    this.score += 300;
    this.addFloatingText('SHOULDER THROW!', player.x, 85, player.z, '#00e5ff');

    // Bowling pin collateral damage to nearby enemies!
    for (const other of this.enemies) {
      if (other !== target && !other.dead && Math.abs(other.x - target.x) < 110 && Math.abs(other.z - target.z) < 24) {
        other.takeDamage(22, throwDir, true, this);
      }
    }
  }

  performSpecialAttack(fighter) {
    fighter.state = 'special';
    fighter.attackTimer = 28;
    fighter.invulnTimer = 32;
    fighter.vy = 7.5;
    fighter.y = 2;
    window.arcadeAudio.sfxSpecial();
    this.shakeScreen(10);
    this.addFloatingText(fighter.specialName + '!', fighter.x, 95, fighter.z, '#ffd700');

    let hitConnected = false;
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      if (Math.abs(enemy.x - fighter.x) < 125 && Math.abs(enemy.z - fighter.z) < 38) {
        const facingDir = enemy.x >= fighter.x ? 1 : -1;
        if (enemy.takeDamage(fighter.specialDamage, facingDir, true, this)) {
          hitConnected = true;
          this.spawnHitSparks(enemy.x, enemy.y + 45, enemy.z, '#00e5ff');
        }
      }
    }
    // Authentic CPS-1 mechanic: Special Crash only costs a sliver of HP if it hits!
    if (hitConnected && fighter.hp > 12) {
      fighter.hp = Math.max(8, fighter.hp - 10);
    }
  }

  meleeHitbox(attacker, rangeX, damage, knockdown = false) {
    let hitAny = false;
    const hitCenterX = attacker.x + attacker.facing * (rangeX * 0.55);

    // Hit Enemies
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      if (Math.abs(enemy.x - hitCenterX) < rangeX * 0.65 && Math.abs(enemy.z - attacker.z) < 24) {
        if (enemy.takeDamage(damage, attacker.facing, knockdown, this)) {
          hitAny = true;
          this.registerPlayerHit(enemy, damage, knockdown);
        }
      }
    }

    // Hit Dinosaurs
    for (const dino of this.dinosaurs) {
      if (dino.dead) continue;
      if (Math.abs(dino.x - hitCenterX) < rangeX * 0.7 && Math.abs(dino.z - attacker.z) < 26) {
        dino.takeDamage(damage, attacker.facing, this);
        hitAny = true;
        window.arcadeAudio.sfxHitLight();
        this.spawnHitSparks(dino.x, dino.y + 40, dino.z, '#ffd700');
      }
    }

    // Smash Breakable Barrels / Crates
    for (const prop of this.props) {
      if (Math.abs(prop.x - hitCenterX) < rangeX * 0.65 && Math.abs(prop.z - attacker.z) < 26) {
        prop.hp -= damage;
        prop.hitShake = 8;
        hitAny = true;
        window.arcadeAudio.sfxHitLight();
        this.spawnHitSparks(prop.x, 35, prop.z, '#ffab00');
        if (prop.hp <= 0) {
          this.destroyProp(prop);
        }
      }
    }

    return hitAny;
  }

  registerPlayerHit(target, damage, heavy) {
    this.comboCount++;
    this.comboResetTimer = 95;
    this.score += heavy ? 200 : 100;
    if (heavy) {
      window.arcadeAudio.sfxHitHeavy();
      this.hitStopTimer = 4; // Classic arcade hit-stop freeze!
      this.shakeScreen(6);
    } else {
      window.arcadeAudio.sfxHitLight();
    }
    this.spawnHitSparks(target.x, target.y + 46, target.z, heavy ? '#ff1744' : '#ffd700');
    this.addFloatingText(`-${damage}`, target.x, target.y + 72, target.z, heavy ? '#ff5252' : '#fff');
  }

  // ==========================================================================
  // AI CO-OP PARTNER & ENEMY AI
  // ==========================================================================
  updatePartner() {
    const ally = this.partner;
    if (!ally || ally.dead) return;
    ally.update(this);
    if (ally.state === 'knockdown' || ally.hurtTimer > 0 || ally.attackTimer > 0) return;

    // Pick up nearby food if hurt
    if (ally.hp < ally.maxHp * 0.6) {
      const food = this.pickups.find((p) => p.category === 'item' && p.heal > 0 && Math.abs(p.x - ally.x) < 40);
      if (food) {
        this.collectPickup(ally, food);
        return;
      }
    }

    // Find closest enemy
    let target = null;
    let bestDist = 9999;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - ally.x, (e.z - ally.z) * 2);
      if (d < bestDist) {
        bestDist = d;
        target = e;
      }
    }

    if (target) {
      const dx = target.x - ally.x;
      const dz = target.z - ally.z;
      ally.facing = dx >= 0 ? 1 : -1;

      if (Math.abs(dx) > 48) {
        ally.x += Math.sign(dx) * ally.speedX * 0.85;
        ally.isMoving = true;
      }
      if (Math.abs(dz) > 12) {
        ally.z += Math.sign(dz) * ally.speedZ * 0.85;
        ally.isMoving = true;
      }

      if (Math.abs(dx) <= 55 && Math.abs(dz) <= 18 && Math.random() < 0.14) {
        this.performPlayerAttack(ally);
      }
    } else if (this.player) {
      // Follow Player 1
      const dx = this.player.x - 65 - ally.x;
      const dz = this.player.z + 16 - ally.z;
      if (Math.abs(dx) > 25) {
        ally.x += Math.sign(dx) * ally.speedX * 0.8;
        ally.facing = dx >= 0 ? 1 : -1;
        ally.isMoving = true;
      } else {
        ally.isMoving = false;
      }
      if (Math.abs(dz) > 10) ally.z += Math.sign(dz) * ally.speedZ * 0.8;
    }
  }

  updateEnemies() {
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.update(this);
      if (e.state === 'knockdown' || e.hurtTimer > 0 || e.attackTimer > 0) continue;

      if (e.aiCooldown > 0) e.aiCooldown--;

      // Target nearest hero
      let target = this.player;
      if (this.partner && !this.partner.dead) {
        const dP1 = this.player ? Math.hypot(this.player.x - e.x, this.player.z - e.z) : 9999;
        const dP2 = Math.hypot(this.partner.x - e.x, this.partner.z - e.z);
        if (dP2 < dP1) target = this.partner;
      }
      if (!target || target.dead) continue;

      const dx = target.x - e.x;
      const dz = target.z - e.z;
      e.facing = dx >= 0 ? 1 : -1;

      if (e.isBiker) {
        // Biker charges across screen!
        e.x += e.facing * e.speedX;
        e.isMoving = true;
        if (Math.abs(dx) < 60 && Math.abs(dz) < 22 && e.aiCooldown === 0) {
          target.takeDamage(e.attackDamage[0], e.facing, true, this);
          window.arcadeAudio.sfxHitHeavy();
          e.aiCooldown = 45;
        }
        continue;
      }

      if (e.ranged && Math.abs(dx) > 140 && Math.abs(dx) < 420 && Math.abs(dz) < 20 && e.aiCooldown === 0) {
        // Poacher Rifleman shoots
        e.attackTimer = 18;
        e.aiCooldown = 85;
        window.arcadeAudio.sfxGunshot('revolver');
        this.projectiles.push({
          x: e.x + e.facing * 28,
          y: 46,
          z: e.z,
          vx: e.facing * 9.5,
          vy: 0,
          damage: e.attackDamage[0],
          fromPlayer: false,
          color: '#ff9100'
        });
        continue;
      }

      // Move toward target
      if (Math.abs(dx) > 48) {
        e.x += Math.sign(dx) * e.speedX;
        e.isMoving = true;
      } else {
        e.isMoving = false;
      }
      if (Math.abs(dz) > 10) {
        e.z += Math.sign(dz) * e.speedZ;
        e.isMoving = true;
      }

      // Melee strike or Boss special rush
      if (Math.abs(dx) <= 56 && Math.abs(dz) <= 20 && e.aiCooldown === 0) {
        e.attackTimer = 16;
        e.aiCooldown = e.isBoss ? 34 : 52;
        window.arcadeAudio.sfxSwing();
        if (target.takeDamage(e.attackDamage[0], e.facing, e.isBoss || e.enemyType === 'fatguy', this)) {
          window.arcadeAudio.sfxHitLight();
          this.spawnHitSparks(target.x, target.y + 45, target.z, '#ff5252');
        }
      } else if (e.isBoss && Math.abs(dx) < 220 && e.aiCooldown === 0 && Math.random() < 0.04) {
        // Boss dash charge!
        e.state = 'dash_attack';
        e.attackTimer = 22;
        e.aiCooldown = 65;
        window.arcadeAudio.sfxDinoRoar(e.bossId === 'fessenden');
      }
    }

    // Remove defeated enemies & drop bonus items
    this.enemies = this.enemies.filter((e) => {
      if (e.dead) {
        this.score += e.scoreValue;
        if (Math.random() < 0.28) {
          this.spawnPickup(e.x, e.z, Math.random() < 0.5 ? 'apple' : 'gold_bars');
        }
        return false;
      }
      return true;
    });
  }

  dinoAttackHitbox(dino, rangeX, damage, knockdown) {
    // Hits both Enemies and Players!
    const targets = [...this.enemies];
    if (!dino.calm && this.player && !this.player.dead) targets.push(this.player);
    for (const t of targets) {
      if (t.dead) continue;
      if (Math.abs(t.x - dino.x) < rangeX && Math.abs(t.z - dino.z) < 24) {
        if (t.takeDamage(damage, dino.facing, knockdown, this)) {
          window.arcadeAudio.sfxHitHeavy();
          this.spawnHitSparks(t.x, t.y + 42, t.z, '#ff9100');
        }
      }
    }
  }

  // ==========================================================================
  // PROPS, PICKUPS, PROJECTILES, AND WAVE PROGRESSION
  // ==========================================================================
  destroyProp(prop) {
    prop.destroyed = true;
    window.arcadeAudio.sfxHitHeavy();
    this.spawnExplosion(prop.x, 30, prop.z, false);
    this.score += 300;
    if (prop.drop) {
      this.spawnPickup(prop.x, prop.z, prop.drop);
    }
    this.props = this.props.filter((p) => !p.destroyed);
  }

  spawnPickup(x, z, id) {
    if (window.GAME_DATA.WEAPONS[id]) {
      const w = window.GAME_DATA.WEAPONS[id];
      this.pickups.push({
        category: 'weapon',
        id: w.id,
        name: w.name,
        x,
        y: 0,
        z
      });
    } else if (window.GAME_DATA.ITEMS[id]) {
      const it = window.GAME_DATA.ITEMS[id];
      this.pickups.push({
        category: 'item',
        id: it.id,
        name: it.name,
        heal: it.heal,
        score: it.score,
        x,
        y: 0,
        z
      });
    }
  }

  collectPickup(fighter, item) {
    this.pickups = this.pickups.filter((p) => p !== item);
    if (item.category === 'weapon') {
      if (item.id === 'radio') {
        this.cadillacCalls++;
        this.summonCadillac(true);
        return;
      }
      const wSpec = window.GAME_DATA.WEAPONS[item.id];
      fighter.weapon = { ...wSpec };
      window.arcadeAudio.sfxPickup(false);
      this.addFloatingText(`EQUIPPED ${wSpec.name}!`, fighter.x, 85, fighter.z, '#00e5ff');
    } else {
      window.arcadeAudio.sfxPickup(true);
      this.score += item.score || 500;
      if (item.heal > 0) {
        fighter.hp = Math.min(fighter.maxHp, fighter.hp + item.heal);
        this.addFloatingText(`${item.name} +${item.heal} HP!`, fighter.x, 85, fighter.z, '#00e676');
      } else {
        this.addFloatingText(`${item.name} +${item.score} PTS!`, fighter.x, 85, fighter.z, '#ffd700');
      }
    }
  }

  updateProjectiles() {
    for (const proj of this.projectiles) {
      proj.x += proj.vx;
      proj.y += proj.vy || 0;
      if (proj.explosive && proj.vy !== 0) {
        proj.vy -= 0.45;
        if (proj.y <= 0) {
          proj.dead = true;
          this.spawnExplosion(proj.x, 20, proj.z, true);
          continue;
        }
      }

      if (proj.x < this.cameraX - 100 || proj.x > this.cameraX + this.width + 100) {
        proj.dead = true;
        continue;
      }

      if (proj.fromPlayer) {
        for (const e of this.enemies) {
          if (e.dead) continue;
          if (Math.abs(e.x - proj.x) < 34 && Math.abs(e.z - proj.z) < 22) {
            proj.dead = true;
            if (proj.explosive) {
              this.spawnExplosion(proj.x, proj.y, proj.z, true);
            } else {
              const dir = proj.vx >= 0 ? 1 : -1;
              if (e.takeDamage(proj.damage, dir, !!proj.knockdown, this)) {
                this.registerPlayerHit(e, proj.damage, !!proj.knockdown);
              }
            }
            break;
          }
        }
      } else if (this.player && !this.player.dead) {
        if (Math.abs(this.player.x - proj.x) < 28 && Math.abs(this.player.z - proj.z) < 18 && this.player.y < 30) {
          proj.dead = true;
          const dir = proj.vx >= 0 ? 1 : -1;
          this.player.takeDamage(proj.damage, dir, false, this);
          window.arcadeAudio.sfxHitLight();
        }
      }
    }
    this.projectiles = this.projectiles.filter((p) => !p.dead);
  }

  spawnExplosion(x, y, z, damageRadius = true) {
    window.arcadeAudio.sfxExplosion();
    this.shakeScreen(12);
    for (let i = 0; i < 24; i++) {
      this.particles.push({
        x,
        y: y + Math.random() * 20,
        z,
        vx: (Math.random() - 0.5) * 11,
        vy: Math.random() * 9 + 2,
        size: 6 + Math.random() * 10,
        color: i % 2 === 0 ? '#ff6d00' : '#ffea00',
        life: 24 + Math.random() * 12
      });
    }
    if (damageRadius) {
      for (const e of this.enemies) {
        if (!e.dead && Math.abs(e.x - x) < 130 && Math.abs(e.z - z) < 38) {
          e.takeDamage(75, e.x >= x ? 1 : -1, true, this);
        }
      }
    }
  }

  spawnHitSparks(x, y, z, color = '#ffd700') {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x,
        y,
        z,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.3) * 7,
        size: 4 + Math.random() * 4,
        color,
        life: 12 + Math.random() * 8
      });
    }
  }

  spawnDust(x, z, count = 4) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: 4,
        z,
        vx: (Math.random() - 0.5) * 2.5,
        vy: Math.random() * 2.2,
        size: 5 + Math.random() * 5,
        color: 'rgba(210, 195, 175, 0.55)',
        life: 16
      });
    }
  }

  addFloatingText(text, x, y, z, color = '#ffd700') {
    this.floatingTexts.push({ text, x, y, z, color, life: 48 });
  }

  shakeScreen(intensity = 6) {
    this.screenShake = Math.max(this.screenShake, intensity);
  }

  // ==========================================================================
  // STAGE WAVE SPAWNING & CAMERA SCROLLING
  // ==========================================================================
  updateStageProgression() {
    if (!this.player) return;

    // Scroll camera forward with player when unlocked
    if (!this.cameraLocked) {
      const targetCam = this.player.x - 360;
      if (targetCam > this.cameraX) {
        this.cameraX = Math.min(this.currentStage.length - this.width, targetCam);
      }
    }

    // Check next wave trigger
    if (!this.activeWave && this.waves.length > 0) {
      const nextWave = this.waves[0];
      if (this.cameraX >= nextWave.triggerX) {
        this.waves.shift();
        this.activeWave = nextWave;
        this.cameraLocked = !!nextWave.lockCamera;
        this.showGoArrow = false;
        this.spawnWaveEntities(nextWave);
        if (nextWave.isBossWave) {
          window.arcadeAudio.startMusic('boss');
          this.addFloatingText('WARNING: BOSS APPROACHING!', this.cameraX + 640, 140, 0, '#ff1744');
        }
      }
    }

    // Check if active wave is cleared
    if (this.activeWave && this.enemies.length === 0) {
      const wasBossWave = this.activeWave.isBossWave;
      this.activeWave = null;
      this.cameraLocked = false;

      if (wasBossWave) {
        // Stage Cleared!
        this.score += 10000;
        if (this.stageIndex + 1 < window.GAME_DATA.STAGES.length) {
          this.loadStage(this.stageIndex + 1, false);
        } else {
          this.mode = 'victory';
        }
      } else {
        this.showGoArrow = true;
        window.arcadeAudio.sfxGoArrow();
      }
    }
  }

  spawnWaveEntities(wave) {
    const centerCam = this.cameraX + this.width * 0.5;
    for (const s of wave.spawns) {
      const spawnX = centerCam + s.xOffset;
      const spawnZ = s.z || 0;

      if (s.type.startsWith('dino_')) {
        const dinoType = s.type.replace('dino_', '');
        this.dinosaurs.push(new window.Dinosaur(dinoType, spawnX, spawnZ, !!s.calm));
      } else if (s.type === 'boss') {
        const bSpec = window.GAME_DATA.BOSSES[s.bossId];
        this.enemies.push(
          new window.Fighter({
            isEnemy: true,
            isBoss: true,
            bossId: bSpec.id,
            name: bSpec.name,
            subtitle: bSpec.subtitle,
            x: spawnX,
            z: spawnZ,
            hp: bSpec.hp,
            speedX: bSpec.speed,
            speedZ: bSpec.speed * 0.72,
            attackDamage: [bSpec.damage],
            score: bSpec.score,
            scale: bSpec.scale,
            palette: bSpec.palette
          })
        );
      } else {
        const eSpec = window.GAME_DATA.ENEMIES[s.type] || window.GAME_DATA.ENEMIES.poacher;
        const enemy = new window.Fighter({
          isEnemy: true,
          enemyType: s.type,
          name: eSpec.name,
          x: spawnX,
          z: spawnZ,
          hp: eSpec.hp,
          speedX: eSpec.speed,
          speedZ: eSpec.speed * 0.7,
          attackDamage: [eSpec.damage],
          score: eSpec.score,
          scale: eSpec.scale,
          palette: eSpec.palette
        });
        enemy.ranged = !!eSpec.ranged;
        enemy.isBiker = !!eSpec.isBiker;
        this.enemies.push(enemy);
      }
    }
  }

  // ==========================================================================
  // MAIN GAME LOOP & RENDERING
  // ==========================================================================
  loop(timestamp) {
    this.time = timestamp || 0;
    this.update();
    this.render();
    this.justPressed = {};
    requestAnimationFrame(this.loop);
  }

  update() {
    if (this.mode !== 'playing') return;

    if (this.hitStopTimer > 0) {
      this.hitStopTimer--;
      return;
    }

    if (this.screenShake > 0) this.screenShake *= 0.82;
    if (this.screenShake < 0.4) this.screenShake = 0;
    if (this.stageBannerTimer > 0) this.stageBannerTimer--;

    if (this.comboResetTimer > 0) {
      this.comboResetTimer--;
      if (this.comboResetTimer === 0) this.comboCount = 0;
    }

    const input = this.pollInput();

    if (this.cadillac && this.cadillac.active) {
      this.cadillac.update(this, input);
    } else {
      this.cadillac = null;
      this.updatePlayer(input);
    }

    if (this.player && this.player.dead) {
      this.lives--;
      if (this.lives > 0) {
        this.respawnPlayer();
      } else {
        this.mode = 'gameover';
      }
    }

    this.updatePartner();
    this.updateEnemies();

    for (const dino of this.dinosaurs) {
      if (!dino.dead) dino.update(this);
    }
    this.dinosaurs = this.dinosaurs.filter((d) => !d.dead);

    for (const prop of this.props) {
      if (prop.hitShake > 0) prop.hitShake--;
    }

    this.updateProjectiles();
    this.updateStageProgression();

    // Update particles & floating texts
    for (const pt of this.particles) {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy -= 0.35;
      pt.life--;
    }
    this.particles = this.particles.filter((pt) => pt.life > 0 && pt.y >= 0);

    for (const ft of this.floatingTexts) {
      ft.y += 1.1;
      ft.life--;
    }
    this.floatingTexts = this.floatingTexts.filter((ft) => ft.life > 0);
  }

  render() {
    const ctx = this.renderer.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const is3D = this.renderer3d && this.renderer3d.cameraMode !== 'classic2d';
    if (is3D) {
      this.renderer3d.renderScene(this, this.time);
    }

    if (this.mode === 'select') {
      this.renderCharacterSelect(ctx, is3D);
      return;
    }

    if (!is3D) {
      ctx.save();
      if (this.screenShake > 0) {
        ctx.translate(
          (Math.random() - 0.5) * this.screenShake * 2,
          (Math.random() - 0.5) * this.screenShake * 2
        );
      }

      // 1. Parallax Stage Background
      this.renderer.drawStageBackground(this.currentStage, this.cameraX, this.time);

      // 2. Depth-Sort all 2.5D entities by Z coordinate (Painter's algorithm)
      const renderList = [];

      for (const prop of this.props) {
        renderList.push({ z: prop.z, draw: () => this.renderer.drawProp(prop, this.cameraX) });
      }
      for (const item of this.pickups) {
        renderList.push({ z: item.z, draw: () => this.renderer.drawPickup(item, this.cameraX, this.time) });
      }
      for (const dino of this.dinosaurs) {
        renderList.push({ z: dino.z, draw: () => this.renderer.drawDinosaur(dino, this.cameraX, this.time) });
      }
      for (const enemy of this.enemies) {
        renderList.push({ z: enemy.z, draw: () => this.renderer.drawFighter(enemy, this.cameraX, this.time) });
      }
      if (this.partner && !this.partner.dead) {
        renderList.push({
          z: this.partner.z,
          draw: () => this.renderer.drawFighter(this.partner, this.cameraX, this.time)
        });
      }
      if (this.cadillac && this.cadillac.active) {
        renderList.push({
          z: this.cadillac.z,
          draw: () => this.renderer.drawCadillac(this.cadillac, this.cameraX, this.time)
        });
      } else if (this.player && !this.player.dead) {
        renderList.push({
          z: this.player.z,
          draw: () => this.renderer.drawFighter(this.player, this.cameraX, this.time)
        });
      }

      renderList.sort((a, b) => a.z - b.z);
      for (const item of renderList) {
        item.draw();
      }

      // 3. Projectiles & Particles (2D fallback)
      for (const proj of this.projectiles) {
        const { sx, sy } = this.renderer.worldToScreen(proj.x, proj.y, proj.z, this.cameraX);
        ctx.fillStyle = proj.color || '#ffeb3b';
        ctx.beginPath();
        ctx.arc(sx, sy, proj.explosive ? 7 : 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const pt of this.particles) {
        const { sx, sy } = this.renderer.worldToScreen(pt.x, pt.y, pt.z, this.cameraX);
        ctx.fillStyle = pt.color;
        ctx.fillRect(sx - pt.size * 0.5, sy - pt.size * 0.5, pt.size, pt.size);
      }
      ctx.restore();
    } else {
      // 3D Mode Screen-Projected Labels & Health Bars
      this.render3DOverlays(ctx);
    }

    // Floating Arcade Damage & Score Popups
    for (const ft of this.floatingTexts) {
      const { sx, sy } = is3D
        ? this.renderer3d.projectToScreen(ft.x, ft.y, ft.z)
        : this.renderer.worldToScreen(ft.x, ft.y, ft.z, this.cameraX);
      ctx.font = '900 18px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(ft.text, sx, sy);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, sx, sy);
    }

    // 4. Arcade HUD & Stage Intro Banner
    this.renderer.drawHUD(this, this.time);

    if (this.stageBannerTimer > 0) {
      this.renderStageBanner(ctx);
    }

    if (this.mode === 'gameover') {
      this.renderOverlayScreen(
        ctx,
        'CONTINUE? 9..8..7',
        'PRESS [ENTER] OR [5] TO INSERT COIN & REVIVE!',
        '#ff1744'
      );
    } else if (this.mode === 'victory') {
      this.renderOverlayScreen(
        ctx,
        'XENOZOIC AGE SAVED!',
        `DR. FESSENDEN DEFEATED! FINAL SCORE: ${this.score} — PRESS [ENTER] TO PLAY AGAIN`,
        '#ffd700'
      );
    }
  }

  render3DOverlays(ctx) {
    ctx.save();
    // Player 1 badge
    if (this.player && !this.player.dead && !(this.cadillac && this.cadillac.active)) {
      const { sx, sy } = this.renderer3d.projectToScreen(this.player.x, this.player.y + 92, this.player.z);
      ctx.fillStyle = '#ffd700';
      ctx.font = '900 12px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('▼ 1P', sx, sy);
    }

    // Cadillac timer banner
    if (this.cadillac && this.cadillac.active) {
      const { sx, sy } = this.renderer3d.projectToScreen(this.cadillac.x, 95, this.cadillac.z);
      ctx.fillStyle = '#ffd700';
      ctx.font = '900 15px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      const msg = `1953 CADILLAC V8 — RAM POACHERS! (${Math.ceil(this.cadillac.timer / 60)}s)`;
      ctx.strokeText(msg, sx, sy);
      ctx.fillText(msg, sx, sy);
    }

    // Enemy & Partner health bars projected above 3D heads
    const bars = [...this.enemies];
    if (this.partner && !this.partner.dead) bars.push(this.partner);
    for (const ent of bars) {
      if (ent.dead || ent.hp <= 0) continue;
      const { sx, sy } = this.renderer3d.projectToScreen(ent.x, ent.y + 92 * (ent.scale || 1), ent.z);
      if (sx < -60 || sx > this.width + 60) continue;
      const barW = ent.isBoss ? 76 : 46;
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(sx - barW / 2 - 1, sy - 1, barW + 2, 7);
      const pct = Math.max(0, ent.hp / ent.maxHp);
      ctx.fillStyle = ent.isPartner ? '#00e5ff' : ent.isBoss ? '#ff1744' : '#ff9100';
      ctx.fillRect(sx - barW / 2, sy, barW * pct, 5);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ent.name, sx, sy - 4);
    }

    // Dinosaur Calm/Enraged badges
    for (const dino of this.dinosaurs) {
      if (dino.dead) continue;
      const { sx, sy } = this.renderer3d.projectToScreen(dino.x, dino.y + 78, dino.z);
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = dino.calm ? '#a7f3d0' : '#ff4d4d';
      ctx.fillText(dino.calm ? 'DINO [CALM]' : 'DINO [ENRAGED!]', sx, sy);
    }

    // Pickup item labels
    for (const item of this.pickups) {
      const { sx, sy } = this.renderer3d.projectToScreen(item.x, 38, item.z);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeText(item.name, sx, sy);
      ctx.fillText(item.name, sx, sy);
    }
    ctx.restore();
  }

  // ==========================================================================
  // TITLE & CHARACTER SELECT SCREEN
  // ==========================================================================
  renderCharacterSelect(ctx, is3D = false) {
    if (!is3D) {
      this.renderer.drawStageBackground(window.GAME_DATA.STAGES[0], this.time * 0.06, this.time);
    }
    ctx.fillStyle = is3D ? 'rgba(6, 9, 18, 0.56)' : 'rgba(6, 9, 18, 0.78)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Title Logo Banner
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff6d00';
    ctx.font = '900 54px Impact, Arial Black, sans-serif';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 8;
    ctx.strokeText('CADILLACS & DINOSAURS', this.width / 2, 72);
    ctx.fillStyle = '#ffd700';
    ctx.fillText('CADILLACS & DINOSAURS', this.width / 2, 72);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 18px Segoe UI, sans-serif';
    ctx.fillText('2513 AD: XENOZOIC RAMPAGE  —  SELECT YOUR HERO', this.width / 2, 108);

    // 4 Playable Hero Cards
    this.heroKeys.forEach((key, i) => {
      const h = window.GAME_DATA.HEROES[key];
      const isSelected = i === this.selectedHeroIndex;
      const cardX = 80 + i * 285;
      const cardY = 140;
      const cardW = 260;
      const cardH = 445;

      ctx.save();
      ctx.fillStyle = isSelected ? 'rgba(24, 38, 72, 0.95)' : 'rgba(14, 18, 32, 0.88)';
      this.renderer.roundRect(ctx, cardX, cardY, cardW, cardH, 12);
      ctx.fill();

      ctx.lineWidth = isSelected ? 4 : 2;
      ctx.strokeStyle = isSelected ? '#ffd700' : '#324266';
      ctx.stroke();

      // Character Name & Role
      ctx.textAlign = 'center';
      ctx.fillStyle = isSelected ? '#ffd700' : '#fff';
      ctx.font = '900 24px Impact, sans-serif';
      ctx.fillText(h.name, cardX + cardW / 2, cardY + 36);

      ctx.fillStyle = h.palette.accent;
      ctx.font = 'bold 12px Segoe UI, sans-serif';
      ctx.fillText(h.title, cardX + cardW / 2, cardY + 56);

      // Draw Live Animated Preview Fighter on Card
      const previewFighter = new window.Fighter({
        heroId: h.id,
        name: '',
        x: cardX + cardW / 2,
        y: 0,
        z: 0,
        scale: 1.55,
        palette: h.palette,
        isPlayer1: isSelected
      });
      previewFighter.isMoving = isSelected;
      if (isSelected && Math.floor(this.time / 600) % 2 === 1) {
        previewFighter.attackTimer = 5;
      }

      ctx.save();
      // Position fighter inside card preview box
      const origWorldToScreen = this.renderer.worldToScreen.bind(this.renderer);
      this.renderer.worldToScreen = () => ({
        sx: cardX + cardW / 2,
        sy: cardY + 225,
        groundY: cardY + 225
      });
      this.renderer.drawFighter(previewFighter, 0, this.time);
      this.renderer.worldToScreen = origWorldToScreen;
      ctx.restore();

      // Stat Bars
      const stats = [
        ['POWER', h.stats.power],
        ['SPEED', h.stats.speed],
        ['TECHNIQUE', h.stats.technique]
      ];
      ctx.textAlign = 'left';
      stats.forEach(([label, val], sIdx) => {
        const sy = cardY + 275 + sIdx * 28;
        ctx.fillStyle = '#b0bec5';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(label, cardX + 20, sy);

        ctx.fillStyle = '#1c263b';
        ctx.fillRect(cardX + 95, sy - 9, 140, 10);
        ctx.fillStyle = isSelected ? '#ffd700' : '#00e5ff';
        ctx.fillRect(cardX + 95, sy - 9, (val / 10) * 140, 10);
      });

      // Special Move Badge
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff9100';
      ctx.font = 'bold 12px Segoe UI, sans-serif';
      ctx.fillText(`SPECIAL: ${h.specialName}`, cardX + cardW / 2, cardY + 378);

      if (isSelected) {
        ctx.fillStyle = '#00e676';
        ctx.font = '900 16px Impact, sans-serif';
        ctx.fillText('CLICK OR PRESS [J / ENTER] TO START', cardX + cardW / 2, cardY + 418);
      }

      ctx.restore();
    });

    // Bottom Arcade Prompt
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px Segoe UI, sans-serif';
    ctx.fillText(
      'USE [A/D] OR [LEFT/RIGHT] TO SELECT HERO   •   [J / Z / ENTER] OR CLICK CARD TO LAUNCH!',
      this.width / 2,
      645
    );
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(
      'TIP: DOUBLE-TAP LEFT/RIGHT TO SPRINT! PRESS [U] IN-GAME TO SUMMON THE 1953 CADILLAC V8!',
      this.width / 2,
      678
    );
  }

  renderStageBanner(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(6, 10, 22, 0.82)';
    ctx.fillRect(0, this.height / 2 - 75, this.width, 130);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, this.height / 2 - 75, this.width, 130);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = '900 42px Impact, sans-serif';
    ctx.fillText(this.currentStage.title, this.width / 2, this.height / 2 - 12);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 18px Segoe UI, sans-serif';
    ctx.fillText(this.currentStage.subtitle, this.width / 2, this.height / 2 + 28);
    ctx.restore();
  }

  renderOverlayScreen(ctx, title, subtitle, color) {
    ctx.save();
    ctx.fillStyle = 'rgba(5, 8, 16, 0.85)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.font = '900 64px Impact, sans-serif';
    ctx.fillText(title, this.width / 2, this.height / 2 - 20);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px Segoe UI, sans-serif';
    ctx.fillText(subtitle, this.width / 2, this.height / 2 + 35);
    ctx.restore();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new CadillacsGame();
});
