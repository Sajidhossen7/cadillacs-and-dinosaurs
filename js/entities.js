// ============================================================================
// ENTITIES: FIGHTERS, DINOSAURS, 1953 CADILLAC, PROJECTILES, PARTICLES
// ============================================================================

class Fighter {
  constructor(config) {
    this.isPlayer1 = !!config.isPlayer1;
    this.isPartner = !!config.isPartner;
    this.isEnemy = !!config.isEnemy;
    this.isBoss = !!config.isBoss;

    this.heroId = config.heroId || null;
    this.enemyType = config.enemyType || null;
    this.bossId = config.bossId || null;

    this.name = config.name || 'FIGHTER';
    this.subtitle = config.subtitle || '';
    this.x = config.x || 200;
    this.y = config.y || 0;
    this.z = config.z || 0;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;

    this.facing = config.facing || 1;
    this.scale = config.scale || 1.0;
    this.palette = config.palette || {};

    this.maxHp = config.hp || 120;
    this.hp = this.maxHp;
    this.displayHp = this.maxHp;

    this.speedX = config.speedX || 4.2;
    this.speedZ = config.speedZ || 2.9;
    this.jumpPower = config.jumpPower || 13.8;
    this.attackDamage = config.attackDamage || [14, 16, 20, 30];
    this.dashDamage = config.dashDamage || 28;
    this.specialName = config.specialName || 'CRASH SPECIAL';
    this.specialDamage = config.specialDamage || 44;
    this.weaponBonus = config.weaponBonus || 1.0;
    this.scoreValue = config.score || 500;

    this.state = 'idle'; // idle, walk, run, jump, attack, dash_attack, special, hurt, knockdown, grabbing
    this.isMoving = false;
    this.isRunning = false;
    this.comboStep = 0;
    this.comboTimer = 0;
    this.attackTimer = 0;
    this.hurtTimer = 0;
    this.downTimer = 0;
    this.invulnTimer = 0;
    this.aiCooldown = 25;

    this.weapon = null;
    this.grabTarget = null;
    this.grabTimer = 0;
  }

  update(game) {
    // Smooth delayed red health bar drain
    if (this.displayHp > this.hp) {
      this.displayHp = Math.max(this.hp, this.displayHp - 0.65);
    } else {
      this.displayHp = this.hp;
    }

    if (this.invulnTimer > 0) this.invulnTimer--;
    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer === 0) this.comboStep = 0;
    }

    // Gravity & Vertical physics
    if (this.y > 0 || this.vy !== 0) {
      this.y += this.vy;
      this.vy -= 0.72;
      if (this.y <= 0) {
        this.y = 0;
        this.vy = 0;
        if (this.state === 'knockdown') {
          this.downTimer = 34;
          window.arcadeAudio.sfxHitLight();
          game.spawnDust(this.x, this.z, 6);
        } else if (this.state === 'jump' || this.state === 'dash_attack') {
          this.state = 'idle';
        }
      }
    }

    // Handle knockdown recovery
    if (this.state === 'knockdown') {
      this.x += this.vx;
      this.vx *= 0.9;
      if (this.y === 0) {
        this.downTimer--;
        if (this.downTimer <= 0) {
          if (this.hp <= 0) {
            this.dead = true;
          } else {
            this.state = 'idle';
            this.invulnTimer = 28;
          }
        }
      }
      this.clampPosition(game);
      return;
    }

    // Hurt stun
    if (this.hurtTimer > 0) {
      this.hurtTimer--;
      this.x += this.vx;
      this.vx *= 0.82;
      if (this.hurtTimer === 0) {
        if (this.hp <= 0) {
          this.knockdown(-this.facing * 5, 9);
        } else {
          this.state = 'idle';
        }
      }
      this.clampPosition(game);
      return;
    }

    // Active attack / special timer
    if (this.attackTimer > 0) {
      this.attackTimer--;
      if (this.state === 'dash_attack') {
        this.x += this.facing * (this.speedX * 1.45);
      }
      if (this.attackTimer === 0 && this.state !== 'knockdown') {
        this.state = 'idle';
      }
    }

    this.clampPosition(game);
  }

  clampPosition(game) {
    this.z = Math.max(-52, Math.min(52, this.z));
    const minX = game.cameraX + 28;
    const maxX = game.cameraLocked ? game.cameraX + game.width - 28 : game.currentStage.length - 30;
    if (this.isPlayer1 || this.isPartner) {
      this.x = Math.max(minX, Math.min(maxX, this.x));
    } else {
      this.x = Math.max(20, Math.min(game.currentStage.length + 200, this.x));
    }
  }

  takeDamage(amount, attackerFacing, knockdownForce = false, game = null) {
    if (this.invulnTimer > 0 || this.dead) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.facing = -attackerFacing;

    if (this.hp <= 0 || knockdownForce) {
      this.knockdown(attackerFacing * 6.2, 9.5);
    } else {
      this.state = 'hurt';
      this.hurtTimer = 14;
      this.vx = attackerFacing * 2.5;
    }
    return true;
  }

  knockdown(vx, vy) {
    this.state = 'knockdown';
    this.vx = vx;
    this.vy = vy;
    this.y = Math.max(2, this.y);
    this.attackTimer = 0;
  }
}

// ============================================================================
// DINOSAUR ENTITY (CALM OR ENRAGED, ATTACKS POACHERS & PLAYERS!)
// ============================================================================
class Dinosaur {
  constructor(dinoType, x, z, calm = true) {
    this.dinoType = dinoType; // raptor, triceratops, pteranodon
    this.x = x;
    this.y = dinoType === 'pteranodon' ? 115 : 0;
    this.z = z;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.facing = -1;
    this.calm = calm;
    this.hp = dinoType === 'triceratops' ? 160 : dinoType === 'raptor' ? 105 : 70;
    this.maxHp = this.hp;
    this.hurtTimer = 0;
    this.attackCooldown = 40;
    this.chargeTimer = 0;
    this.dead = false;
  }

  update(game) {
    if (this.hurtTimer > 0) this.hurtTimer--;
    if (this.attackCooldown > 0) this.attackCooldown--;

    // Pteranodon swoops across screen
    if (this.dinoType === 'pteranodon') {
      this.x += this.facing * 4.6;
      this.y = 75 + Math.sin(game.time * 0.008 + this.x * 0.02) * 45;
      if (this.y < 48 && this.attackCooldown === 0) {
        game.dinoAttackHitbox(this, 36, 22, true);
        this.attackCooldown = 35;
      }
      if (this.x < game.cameraX - 220 || this.x > game.cameraX + game.width + 260) {
        this.facing *= -1;
      }
      return;
    }

    // Gravity for leaping raptors
    if (this.y > 0 || this.vy !== 0) {
      this.y += this.vy;
      this.vy -= 0.7;
      if (this.y <= 0) {
        this.y = 0;
        this.vy = 0;
      }
    }

    // Charging Triceratops or Leaping Raptor
    if (this.chargeTimer > 0) {
      this.chargeTimer--;
      this.x += this.facing * (this.dinoType === 'triceratops' ? 7.8 : 6.4);
      if (this.chargeTimer % 5 === 0) {
        game.spawnDust(this.x, this.z, 3);
        game.dinoAttackHitbox(this, 56, this.dinoType === 'triceratops' ? 32 : 22, true);
      }
      return;
    }

    // Find nearest target (Enraged dinos attack both enemies and players!)
    const candidates = [...game.enemies];
    if (!this.calm && game.player && game.player.hp > 0) {
      candidates.push(game.player);
    }
    if (candidates.length === 0) return;

    let nearest = null;
    let bestDist = 9999;
    for (const c of candidates) {
      if (c.dead || c.hp <= 0) continue;
      const d = Math.hypot(c.x - this.x, (c.z - this.z) * 2);
      if (d < bestDist) {
        bestDist = d;
        nearest = c;
      }
    }

    if (!nearest) return;
    const dx = nearest.x - this.x;
    const dz = nearest.z - this.z;
    this.facing = dx >= 0 ? 1 : -1;

    if (this.calm) {
      // Calm dinosaurs patrol slowly unless provoked
      this.x += Math.sin(game.time * 0.002) * 0.8;
    } else {
      // Enraged pursuit
      if (Math.abs(dx) > 65) this.x += Math.sign(dx) * 3.1;
      if (Math.abs(dz) > 10) this.z += Math.sign(dz) * 1.8;

      if (Math.abs(dx) < 120 && Math.abs(dz) < 22 && this.attackCooldown === 0) {
        window.arcadeAudio.sfxDinoRoar(this.dinoType === 'triceratops');
        this.chargeTimer = 26;
        this.attackCooldown = 75;
        if (this.dinoType === 'raptor') {
          this.vy = 9.5;
        }
      }
    }

    this.z = Math.max(-50, Math.min(50, this.z));
  }

  takeDamage(amount, attackerFacing, game) {
    this.hp -= amount;
    this.hurtTimer = 10;
    if (this.calm) {
      this.calm = false; // Provoked into Enraged mode!
      window.arcadeAudio.sfxDinoRoar(this.dinoType === 'triceratops');
      game.addFloatingText('ENRAGED DINO!', this.x, this.y + 70, this.z, '#ff1744');
    }
    if (this.hp <= 0) {
      this.dead = true;
      game.score += 1200;
      game.spawnExplosion(this.x, this.y + 30, this.z, false);
    }
  }
}

// ============================================================================
// 1953 CADILLAC ELDORADO VEHICLE
// ============================================================================
class CadillacVehicle {
  constructor(x, z, durationFrames = 780) {
    this.x = x;
    this.y = 0;
    this.z = z;
    this.timer = durationFrames;
    this.gunCooldown = 0;
    this.active = true;
  }

  update(game, input) {
    this.timer--;
    if (this.gunCooldown > 0) this.gunCooldown--;

    // Drive with directional controls
    const speedX = 7.2;
    const speedZ = 4.4;
    if (input.right) this.x += speedX;
    else if (input.left) this.x -= speedX * 0.7;
    else this.x += 2.2; // Steady forward cruise

    if (input.up) this.z -= speedZ;
    if (input.down) this.z += speedZ;

    this.z = Math.max(-46, Math.min(46, this.z));
    this.x = Math.max(game.cameraX + 110, Math.min(game.currentStage.length - 80, this.x));

    // Keep player inside the Cadillac
    if (game.player) {
      game.player.x = this.x;
      game.player.z = this.z;
      game.player.y = 0;
      game.player.invulnTimer = 4;
    }

    // Fire twin hood machine guns on Attack press
    if (input.attack && this.gunCooldown === 0) {
      this.gunCooldown = 8;
      window.arcadeAudio.sfxGunshot('m16');
      game.projectiles.push({
        x: this.x + 135,
        y: 38,
        z: this.z - 6,
        vx: 20,
        vy: 0,
        damage: 26,
        fromPlayer: true,
        color: '#ffeb3b',
        explosive: false
      });
    }

    // Ram enemies & props in path!
    for (const enemy of game.enemies) {
      if (enemy.dead || enemy.invulnTimer > 0) continue;
      if (Math.abs(enemy.x - this.x) < 135 && Math.abs(enemy.z - this.z) < 28) {
        enemy.takeDamage(55, 1, true, game);
        window.arcadeAudio.sfxHitHeavy();
        game.shakeScreen(8);
        game.score += 500;
        game.addFloatingText('ROADKILL +500!', enemy.x, 60, enemy.z, '#ffd700');
      }
    }

    for (const prop of game.props) {
      if (Math.abs(prop.x - this.x) < 125 && Math.abs(prop.z - this.z) < 28) {
        game.destroyProp(prop);
      }
    }

    if (this.timer <= 0) {
      this.active = false;
      game.addFloatingText('CADILLAC OUT OF FUEL!', this.x, 90, this.z, '#00e5ff');
    }
  }
}

window.Fighter = Fighter;
window.Dinosaur = Dinosaur;
window.CadillacVehicle = CadillacVehicle;
