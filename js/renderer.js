// ============================================================================
// HIGH-DETAIL 2.5D ARCADE RENDERER (PARALLAX, CHARACTERS, DINOS, CADILLAC, HUD)
// ============================================================================

class ArcadeRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.groundTopY = 430;
    this.groundBottomY = 675;
  }

  // Convert 2.5D world (x, y, z) to screen coordinates
  // x: horizontal world pos, y: height above ground (>=0), z: depth (-55 to +55)
  worldToScreen(x, y, z, cameraX) {
    const sx = x - cameraX;
    const baseZ = (this.groundTopY + this.groundBottomY) * 0.5;
    const sy = baseZ + z * 2.0 - y;
    return { sx, sy, groundY: baseZ + z * 2.0 };
  }

  // Draw rounded rectangle helper
  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // ==========================================================================
  // PARALLAX STAGE BACKGROUNDS
  // ==========================================================================
  drawStageBackground(stage, cameraX, time) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const theme = stage.theme;

    if (theme === 'jungle_city') {
      // Sky gradient (Xenozoic sunset over flooded Manhattan)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundTopY);
      skyGrad.addColorStop(0, '#0d152e');
      skyGrad.addColorStop(0.45, '#2b224d');
      skyGrad.addColorStop(0.8, '#87364b');
      skyGrad.addColorStop(1, '#d97642');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, this.groundTopY);

      // Giant Retro Sun
      const sunX = 950 - cameraX * 0.04;
      const sunY = 145;
      const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 110);
      sunGrad.addColorStop(0, '#fff7b2');
      sunGrad.addColorStop(0.4, '#ff9d2e');
      sunGrad.addColorStop(1, 'rgba(255, 70, 30, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 110, 0, Math.PI * 2);
      ctx.fill();

      // Far Parallax: Sunken Skyscrapers with waterfalls
      const farOffset = -(cameraX * 0.18) % 320;
      for (let i = -1; i < 6; i++) {
        const bx = farOffset + i * 320;
        const bh = 210 + ((i * 73) % 90);
        const by = this.groundTopY - bh - 50;

        ctx.fillStyle = '#181d33';
        ctx.fillRect(bx + 20, by, 115, bh + 50);
        ctx.fillStyle = '#121628';
        ctx.fillRect(bx + 155, by + 35, 130, bh + 15);

        // Lit skyscraper windows
        ctx.fillStyle = 'rgba(255, 200, 95, 0.35)';
        for (let wy = by + 18; wy < this.groundTopY - 70; wy += 22) {
          for (let wx = bx + 32; wx < bx + 120; wx += 22) {
            if ((wx + wy) % 3 !== 0) ctx.fillRect(wx, wy, 10, 12);
          }
        }

        // Overgrown vines on skyscrapers
        ctx.strokeStyle = '#1b4d32';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(bx + 20, by + 20);
        ctx.bezierCurveTo(bx + 70, by + 80, bx + 40, by + 140, bx + 110, by + 190);
        ctx.stroke();
      }

      // Mid Parallax: Sunken Sea & Prehistoric Jungle Canopy
      ctx.fillStyle = '#14332a';
      const midOffset = -(cameraX * 0.42) % 240;
      for (let i = -1; i < 8; i++) {
        const jx = midOffset + i * 240;
        ctx.beginPath();
        ctx.arc(jx + 120, this.groundTopY - 12, 95, Math.PI, 0);
        ctx.fill();
      }

      // Near Wall / Ruined Overpass & Neon Signs
      const nearOffset = -(cameraX * 0.75) % 480;
      ctx.fillStyle = '#23293a';
      ctx.fillRect(0, this.groundTopY - 46, w, 46);
      ctx.fillStyle = '#39435c';
      ctx.fillRect(0, this.groundTopY - 46, w, 6);

      for (let i = -1; i < 4; i++) {
        const px = nearOffset + i * 480;
        // Concrete Pillar
        ctx.fillStyle = '#2d3548';
        ctx.fillRect(px + 60, this.groundTopY - 140, 48, 140);
        // Hanging Jungle Vines
        ctx.fillStyle = '#256b3e';
        for (let v = 0; v < 5; v++) {
          const sway = Math.sin(time * 0.003 + v + i) * 6;
          ctx.fillRect(px + 130 + v * 55 + sway, this.groundTopY - 44, 8, 26 + (v % 3) * 10);
        }
        // Retro Arcade Billboard
        ctx.fillStyle = '#161b29';
        ctx.fillRect(px + 220, this.groundTopY - 115, 165, 58);
        ctx.strokeStyle = '#ff9800';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 220, this.groundTopY - 115, 165, 58);
        ctx.fillStyle = '#00e5ff';
        ctx.font = '900 13px Impact, sans-serif';
        ctx.fillText("TENREC'S GARAGE", px + 236, this.groundTopY - 90);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('1953 CADILLAC V8 PARTS', px + 232, this.groundTopY - 70);
      }

      // Ground Street (Cracked Asphalt + Moss + Puddles)
      const roadGrad = ctx.createLinearGradient(0, this.groundTopY, 0, this.groundBottomY);
      roadGrad.addColorStop(0, '#2a2f3d');
      roadGrad.addColorStop(0.5, '#1f232e');
      roadGrad.addColorStop(1, '#141720');
      ctx.fillStyle = roadGrad;
      ctx.fillRect(0, this.groundTopY, w, this.groundBottomY - this.groundTopY);
    } else if (theme === 'swamp_highway') {
      // Crimson canyon sunset
      const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundTopY);
      skyGrad.addColorStop(0, '#1e0b18');
      skyGrad.addColorStop(0.5, '#611c2b');
      skyGrad.addColorStop(0.85, '#ba4626');
      skyGrad.addColorStop(1, '#f59c36');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, this.groundTopY);

      // Far Mesas & Volcanoes
      const farOffset = -(cameraX * 0.2) % 420;
      ctx.fillStyle = '#381520';
      for (let i = -1; i < 5; i++) {
        const mx = farOffset + i * 420;
        ctx.beginPath();
        ctx.moveTo(mx, this.groundTopY);
        ctx.lineTo(mx + 90, this.groundTopY - 170);
        ctx.lineTo(mx + 250, this.groundTopY - 170);
        ctx.lineTo(mx + 360, this.groundTopY);
        ctx.closePath();
        ctx.fill();
      }

      // Guardrail & Roadside Cycads
      const nearOffset = -(cameraX * 0.85) % 260;
      ctx.fillStyle = '#5c3c24';
      ctx.fillRect(0, this.groundTopY - 28, w, 28);
      for (let i = -1; i < 7; i++) {
        const rx = nearOffset + i * 260;
        ctx.fillStyle = '#8d99ae';
        ctx.fillRect(rx, this.groundTopY - 22, 240, 10);
        // Giant Dino Skull on roadside
        if (i % 2 === 0) {
          ctx.fillStyle = '#e0d6c3';
          ctx.beginPath();
          ctx.arc(rx + 120, this.groundTopY - 30, 18, Math.PI, 0);
          ctx.fill();
        }
      }

      // Dusty Desert Highway
      const roadGrad = ctx.createLinearGradient(0, this.groundTopY, 0, this.groundBottomY);
      roadGrad.addColorStop(0, '#4f3b2b');
      roadGrad.addColorStop(0.5, '#3b2c20');
      roadGrad.addColorStop(1, '#261c14');
      ctx.fillStyle = roadGrad;
      ctx.fillRect(0, this.groundTopY, w, this.groundBottomY - this.groundTopY);
    } else {
      // STAGE 3: Fessenden's Bio-Lab
      const wallGrad = ctx.createLinearGradient(0, 0, 0, this.groundTopY);
      wallGrad.addColorStop(0, '#09101a');
      wallGrad.addColorStop(0.6, '#142438');
      wallGrad.addColorStop(1, '#1d354d');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, w, this.groundTopY);

      // Glowing Bio-Vats with Dinosaur Silhouettes
      const vatOffset = -(cameraX * 0.5) % 340;
      for (let i = -1; i < 5; i++) {
        const vx = vatOffset + i * 340 + 70;
        const vy = 90;
        const vw = 120;
        const vh = 260;

        const vatGrad = ctx.createLinearGradient(vx, vy, vx + vw, vy);
        vatGrad.addColorStop(0, '#004d40');
        vatGrad.addColorStop(0.5, '#00e676');
        vatGrad.addColorStop(1, '#004d40');
        ctx.fillStyle = vatGrad;
        ctx.fillRect(vx, vy, vw, vh);

        // Floating mutant embryo silhouette
        const bob = Math.sin(time * 0.004 + i) * 12;
        ctx.fillStyle = 'rgba(0, 30, 20, 0.65)';
        ctx.beginPath();
        ctx.ellipse(vx + vw / 2, vy + vh / 2 + bob, 32, 48, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Steel caps
        ctx.fillStyle = '#37474f';
        ctx.fillRect(vx - 10, vy - 16, vw + 20, 22);
        ctx.fillRect(vx - 10, vy + vh - 6, vw + 20, 24);
      }

      // Lab Floor
      const floorGrad = ctx.createLinearGradient(0, this.groundTopY, 0, this.groundBottomY);
      floorGrad.addColorStop(0, '#263238');
      floorGrad.addColorStop(0.5, '#1c262b');
      floorGrad.addColorStop(1, '#11171a');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, this.groundTopY, w, this.groundBottomY - this.groundTopY);
    }

    // Road lane dashes & perspective lines
    const dashOffset = -(cameraX % 160);
    const midY = (this.groundTopY + this.groundBottomY) * 0.5;
    ctx.fillStyle = theme === 'bio_lab' ? 'rgba(0, 229, 255, 0.25)' : 'rgba(255, 204, 0, 0.42)';
    for (let x = dashOffset - 160; x < w + 160; x += 160) {
      ctx.fillRect(x, midY - 4, 85, 7);
    }

    // Curb / Foreground shadow strip
    ctx.fillStyle = '#090b10';
    ctx.fillRect(0, this.groundBottomY, w, h - this.groundBottomY);
    ctx.fillStyle = '#3a445e';
    ctx.fillRect(0, this.groundTopY - 3, w, 4);
    ctx.fillRect(0, this.groundBottomY - 2, w, 4);
  }

  // ==========================================================================
  // DRAW BREAKABLE PROPS (BARRELS, CRATES, TIRES) & PICKUPS
  // ==========================================================================
  drawProp(prop, cameraX) {
    const ctx = this.ctx;
    const { sx, sy } = this.worldToScreen(prop.x, 0, prop.z, cameraX);
    if (sx < -120 || sx > this.width + 120) return;

    ctx.save();
    ctx.translate(sx, sy);
    if (prop.hitShake > 0) {
      ctx.translate((Math.random() - 0.5) * 8, 0);
    }

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 32, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    if (prop.type === 'barrel') {
      // Steel oil drum
      const grad = ctx.createLinearGradient(-24, -68, 24, -68);
      grad.addColorStop(0, '#8c1d1d');
      grad.addColorStop(0.4, '#e53935');
      grad.addColorStop(1, '#5f1111');
      ctx.fillStyle = grad;
      this.roundRect(ctx, -24, -68, 48, 66, 6);
      ctx.fill();
      ctx.fillStyle = '#ffca28';
      ctx.fillRect(-25, -50, 50, 5);
      ctx.fillRect(-25, -24, 50, 5);
      ctx.fillStyle = '#b0bec5';
      ctx.beginPath();
      ctx.ellipse(0, -68, 24, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (prop.type === 'crate') {
      // Wooden supply crate
      ctx.fillStyle = '#8d5524';
      ctx.fillRect(-28, -58, 56, 56);
      ctx.strokeStyle = '#4e2c0f';
      ctx.lineWidth = 3;
      ctx.strokeRect(-28, -58, 56, 56);
      ctx.beginPath();
      ctx.moveTo(-28, -58);
      ctx.lineTo(28, -2);
      ctx.moveTo(28, -58);
      ctx.lineTo(-28, -2);
      ctx.stroke();
      ctx.fillStyle = '#ffd54f';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SUPPLY', 0, -26);
    } else {
      // Stacked Cadillac tires
      for (let i = 0; i < 3; i++) {
        const ty = -14 - i * 17;
        ctx.fillStyle = '#1c1e24';
        this.roundRect(ctx, -28, ty - 14, 56, 16, 7);
        ctx.fill();
        ctx.strokeStyle = '#cfd8dc';
        ctx.lineWidth = 2;
        ctx.strokeRect(-14, ty - 10, 28, 8);
      }
    }
    ctx.restore();
  }

  drawPickup(item, cameraX, time) {
    const ctx = this.ctx;
    const bob = Math.sin(time * 0.008 + item.x) * 4;
    const { sx, sy } = this.worldToScreen(item.x, item.y + bob, item.z, cameraX);
    if (sx < -100 || sx > this.width + 100) return;

    ctx.save();
    ctx.translate(sx, sy);

    // Glow aura
    const glow = ctx.createRadialGradient(0, -14, 4, 0, -14, 28);
    glow.addColorStop(0, 'rgba(255, 230, 100, 0.55)');
    glow.addColorStop(1, 'rgba(255, 230, 100, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -14, 28, 0, Math.PI * 2);
    ctx.fill();

    if (item.category === 'weapon') {
      this.drawWeaponIcon(ctx, item.id, 0, -16, 1.15);
    } else {
      // Food / Treasure
      if (item.id === 'dino_steak' || item.id === 'bbq_ribs') {
        // Giant Roast Dino Meat on bone!
        ctx.fillStyle = '#eee';
        ctx.fillRect(-24, -18, 48, 6);
        ctx.beginPath();
        ctx.arc(-24, -15, 5, 0, Math.PI * 2);
        ctx.arc(24, -15, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#bf360c';
        ctx.beginPath();
        ctx.ellipse(0, -16, 18, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff8a65';
        ctx.beginPath();
        ctx.ellipse(-4, -19, 8, 5, -0.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.id === 'burger') {
        ctx.fillStyle = '#f57f17';
        ctx.beginPath();
        ctx.arc(0, -14, 13, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(-14, -14, 28, 3);
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(-13, -11, 26, 4);
        ctx.fillStyle = '#fbc02d';
        ctx.fillRect(-13, -7, 26, 4);
      } else if (item.id === 'gold_bars') {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-16, -16, 32, 12);
        ctx.strokeStyle = '#fff59d';
        ctx.strokeRect(-16, -16, 32, 12);
      } else if (item.id === 'diamond') {
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.moveTo(0, -28);
        ctx.lineTo(15, -15);
        ctx.lineTo(0, -3);
        ctx.lineTo(-15, -15);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.arc(0, -12, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Label floating above pickup
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillText(item.name, 0, -36);
    ctx.restore();
  }

  drawWeaponIcon(ctx, weaponId, x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    if (weaponId === 'revolver') {
      ctx.fillStyle = '#cfd8dc';
      ctx.fillRect(-8, -6, 20, 5);
      ctx.fillStyle = '#6d4c41';
      ctx.fillRect(-10, -2, 6, 9);
    } else if (weaponId === 'shotgun') {
      ctx.fillStyle = '#546e7a';
      ctx.fillRect(-14, -5, 32, 5);
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(-18, -2, 12, 6);
    } else if (weaponId === 'm16') {
      ctx.fillStyle = '#37474f';
      ctx.fillRect(-16, -6, 36, 6);
      ctx.fillRect(-4, 0, 5, 8);
      ctx.fillRect(-18, -4, 8, 7);
    } else if (weaponId === 'bazooka') {
      ctx.fillStyle = '#388e3c';
      ctx.fillRect(-24, -9, 48, 11);
      ctx.fillStyle = '#ffeb3b';
      ctx.fillRect(-6, -9, 6, 11);
    } else if (weaponId === 'knife') {
      ctx.fillStyle = '#e0f7fa';
      ctx.beginPath();
      ctx.moveTo(-4, -3);
      ctx.lineTo(14, -1);
      ctx.lineTo(-4, 3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(-12, -2, 8, 4);
    } else if (weaponId === 'club') {
      ctx.fillStyle = '#8d5524';
      ctx.beginPath();
      ctx.moveTo(-14, 2);
      ctx.lineTo(16, -6);
      ctx.lineTo(16, 6);
      ctx.closePath();
      ctx.fill();
    } else if (weaponId === 'dynamite') {
      ctx.fillStyle = '#d50000';
      ctx.fillRect(-10, -6, 20, 8);
      ctx.strokeStyle = '#ffea00';
      ctx.beginPath();
      ctx.moveTo(10, -2);
      ctx.lineTo(16, -8);
      ctx.stroke();
    } else if (weaponId === 'radio') {
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(-10, -8, 20, 14);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(4, -8);
      ctx.lineTo(10, -22);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ==========================================================================
  // DRAW THE LEGENDARY 1953 CADILLAC ELDORADO
  // ==========================================================================
  drawCadillac(car, cameraX, time) {
    const ctx = this.ctx;
    const { sx, sy } = this.worldToScreen(car.x, car.y, car.z, cameraX);

    ctx.save();
    ctx.translate(sx, sy);

    const bounce = Math.sin(time * 0.04) * 2.5;
    ctx.translate(0, bounce);

    // Shadow under Cadillac
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 6, 138, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Twin Nitro / V8 Exhaust Flames
    const flameLen = 28 + Math.random() * 24;
    const flameGrad = ctx.createLinearGradient(-130, -20, -130 - flameLen, -20);
    flameGrad.addColorStop(0, '#00e5ff');
    flameGrad.addColorStop(0.4, '#ffab00');
    flameGrad.addColorStop(1, 'rgba(255, 30, 0, 0)');
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(-125, -28);
    ctx.lineTo(-125 - flameLen, -35);
    ctx.lineTo(-125 - flameLen * 0.8, -18);
    ctx.closePath();
    ctx.fill();

    // Headlight Volumetric Beam
    const beamGrad = ctx.createLinearGradient(125, -36, 360, -10);
    beamGrad.addColorStop(0, 'rgba(255, 248, 180, 0.55)');
    beamGrad.addColorStop(1, 'rgba(255, 248, 180, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(125, -42);
    ctx.lineTo(360, -90);
    ctx.lineTo(360, 22);
    ctx.lineTo(125, -24);
    ctx.closePath();
    ctx.fill();

    // Main 1953 Cadillac Body (Cherry Metallic Red with Chrome Trim)
    const bodyGrad = ctx.createLinearGradient(0, -72, 0, -14);
    bodyGrad.addColorStop(0, '#ff2a3c');
    bodyGrad.addColorStop(0.55, '#c40e1d');
    bodyGrad.addColorStop(1, '#5e050d');
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    ctx.moveTo(-132, -22);
    ctx.lineTo(-138, -68); // Iconic 1953 Tailfin!
    ctx.lineTo(-92, -55);
    ctx.lineTo(38, -55);
    ctx.lineTo(124, -48);
    ctx.quadraticCurveTo(138, -36, 132, -16);
    ctx.lineTo(-132, -16);
    ctx.closePath();
    ctx.fill();

    // Wrap-around Glass Windshield
    ctx.fillStyle = 'rgba(160, 235, 255, 0.72)';
    ctx.beginPath();
    ctx.moveTo(18, -55);
    ctx.lineTo(46, -86);
    ctx.lineTo(58, -86);
    ctx.lineTo(42, -55);
    ctx.closePath();
    ctx.fill();

    // Driver silhouette inside convertible
    ctx.fillStyle = '#1e5fd9';
    ctx.fillRect(-18, -76, 26, 24);
    ctx.fillStyle = '#f0b88b';
    ctx.beginPath();
    ctx.arc(-4, -84, 11, 0, Math.PI * 2);
    ctx.fill();

    // Chrome Spear Trim & Bumpers
    ctx.fillStyle = '#e0e8f0';
    ctx.fillRect(-126, -38, 248, 5);
    this.roundRect(ctx, 120, -34, 22, 16, 6);
    ctx.fill();
    this.roundRect(ctx, -142, -32, 18, 14, 5);
    ctx.fill();

    // Bull Horns on Hood!
    ctx.strokeStyle = '#fff8e1';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(118, -50);
    ctx.quadraticCurveTo(142, -72, 152, -56);
    ctx.stroke();

    // Whitewall Tires with Chrome Hubcaps
    [-82, 82].forEach((wx) => {
      ctx.fillStyle = '#14161c';
      ctx.beginPath();
      ctx.arc(wx, -16, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f5f7fa';
      ctx.beginPath();
      ctx.arc(wx, -16, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#b0bec5';
      ctx.beginPath();
      ctx.arc(wx, -16, 9, 0, Math.PI * 2);
      ctx.fill();
    });

    // Banner above Cadillac
    ctx.fillStyle = '#ffd700';
    ctx.font = '900 14px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('1953 CADILLAC V8 - PLOW THROUGH POACHERS! (' + Math.ceil(car.timer / 60) + 's)', 0, -108);

    ctx.restore();
  }

  // ==========================================================================
  // DRAW DINOSAURS (VELOCIRAPTOR, TRICERATOPS, PTERANODON)
  // ==========================================================================
  drawDinosaur(dino, cameraX, time) {
    const ctx = this.ctx;
    const { sx, sy, groundY } = this.worldToScreen(dino.x, dino.y, dino.z, cameraX);
    if (sx < -160 || sx > this.width + 160) return;

    ctx.save();
    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(sx, groundY, 44, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(sx, sy);
    ctx.scale(dino.facing, 1);

    // Enraged flashing red tint vs calm green/orange
    const isEnraged = !dino.calm;
    const flashHit = dino.hurtTimer > 0 && dino.hurtTimer % 2 === 0;
    const stride = Math.sin(time * 0.02 + dino.x * 0.05) * 9;

    if (dino.dinoType === 'raptor') {
      const bodyColor = flashHit ? '#ffffff' : isEnraged ? '#d62828' : '#588157';
      const bellyColor = flashHit ? '#ffffff' : isEnraged ? '#fcbf49' : '#dad7cd';
      const stripeColor = isEnraged ? '#540b0e' : '#283618';

      // Whipping Tail
      ctx.strokeStyle = bodyColor;
      ctx.lineWidth = 11;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-18, -36);
      ctx.quadraticCurveTo(-55, -42 + stride * 0.5, -82, -56 - stride * 0.5);
      ctx.stroke();

      // Hind Legs
      ctx.fillStyle = bodyColor;
      ctx.fillRect(-14 + stride * 0.5, -32, 12, 30);
      ctx.fillRect(2 - stride * 0.5, -32, 12, 30);

      // Raptor Torso
      ctx.beginPath();
      ctx.ellipse(0, -40, 28, 16, -0.25, 0, Math.PI * 2);
      ctx.fill();

      // Tiger Stripes on back
      ctx.fillStyle = stripeColor;
      for (let s = -16; s <= 10; s += 9) {
        ctx.fillRect(s, -53, 4, 12);
      }

      // Belly highlight
      ctx.fillStyle = bellyColor;
      ctx.beginPath();
      ctx.ellipse(4, -34, 20, 7, -0.2, 0, Math.PI);
      ctx.fill();

      // Neck & Snout
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.moveTo(14, -46);
      ctx.lineTo(30, -68);
      ctx.lineTo(54, -64);
      ctx.lineTo(52, -52);
      ctx.lineTo(26, -40);
      ctx.closePath();
      ctx.fill();

      // Sharp Teeth & Eye
      ctx.fillStyle = '#fff';
      ctx.fillRect(36, -53, 12, 3);
      ctx.fillStyle = '#ffea00';
      ctx.beginPath();
      ctx.arc(34, -62, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (dino.dinoType === 'triceratops') {
      const bodyColor = flashHit ? '#ffffff' : isEnraged ? '#b5381a' : '#6c757d';
      const frillColor = flashHit ? '#ffffff' : isEnraged ? '#e63946' : '#495057';

      // Heavy Quadruped Legs
      ctx.fillStyle = bodyColor;
      ctx.fillRect(-38 + stride * 0.4, -28, 16, 28);
      ctx.fillRect(-12 - stride * 0.4, -28, 16, 28);
      ctx.fillRect(16 + stride * 0.4, -28, 16, 28);

      // Massive Armored Body
      ctx.beginPath();
      ctx.ellipse(-6, -42, 48, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Armored Neck Frill
      ctx.fillStyle = frillColor;
      ctx.beginPath();
      ctx.ellipse(26, -54, 14, 28, -0.35, 0, Math.PI * 2);
      ctx.fill();

      // Head & 3 Ivory Horns
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.moveTo(26, -64);
      ctx.lineTo(62, -42);
      ctx.lineTo(28, -28);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#fff8e7';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(38, -56);
      ctx.lineTo(74, -68);
      ctx.moveTo(56, -44);
      ctx.lineTo(68, -52);
      ctx.stroke();
    } else if (dino.dinoType === 'pteranodon') {
      const wingFlap = Math.sin(time * 0.025 + dino.x) * 24;
      const bodyColor = flashHit ? '#ffffff' : '#9d4edd';

      ctx.fillStyle = bodyColor;
      // Wings
      ctx.beginPath();
      ctx.moveTo(-10, -18);
      ctx.lineTo(-42, -38 + wingFlap);
      ctx.lineTo(15, -38 + wingFlap);
      ctx.closePath();
      ctx.fill();

      // Head Crest & Long Beak
      ctx.beginPath();
      ctx.moveTo(-28, -28);
      ctx.lineTo(36, -16);
      ctx.lineTo(6, -8);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    // State badge above dinosaur
    ctx.save();
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = dino.calm ? '#a7f3d0' : '#ff4d4d';
    ctx.fillText(dino.calm ? 'ZEKE [CALM]' : 'DINOSAUR [ENRAGED!]', sx, sy - 82);
    ctx.restore();
  }

  // ==========================================================================
  // DRAW HEROES, ENEMIES, AND BOSSES
  // ==========================================================================
  drawFighter(ent, cameraX, time) {
    const ctx = this.ctx;
    const { sx, sy, groundY } = this.worldToScreen(ent.x, ent.y, ent.z, cameraX);
    if (sx < -140 || sx > this.width + 140) return;

    const scale = ent.scale || 1;
    const pal = ent.palette;
    const flash = ent.hurtTimer > 0 && ent.hurtTimer % 2 === 0;

    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(sx, groundY, 26 * scale, 9 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(ent.facing * scale, scale);

    // Knockdown / Thrown rotation
    if (ent.state === 'knockdown' || ent.state === 'grabbed') {
      ctx.translate(0, -14);
      ctx.rotate(-Math.PI * 0.46);
    } else if (ent.state === 'dash_attack' && ent.heroId === 'mustapha') {
      // Mustapha's iconic horizontal flying dropkick!
      ctx.translate(0, -36);
      ctx.rotate(-Math.PI * 0.38);
    }

    const walkCycle = ent.isMoving ? Math.sin(time * 0.022) * 10 : 0;
    const punchExtend = ent.attackTimer > 0 ? 18 : 0;

    // Biker Motorcycle if biker enemy
    if (ent.isBiker) {
      ctx.fillStyle = '#1b1d24';
      ctx.beginPath();
      ctx.arc(-26, -14, 15, 0, Math.PI * 2);
      ctx.arc(28, -14, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d32f2f';
      ctx.fillRect(-24, -32, 48, 14);
    }

    // Back Leg
    ctx.fillStyle = flash ? '#fff' : (pal.pants || '#283d66');
    ctx.fillRect(-10 - walkCycle * 0.5, -34, 10, 24);
    ctx.fillStyle = flash ? '#fff' : (pal.boots || '#333');
    ctx.fillRect(-10 - walkCycle * 0.5, -10, 13, 10);

    // Front Leg (or Kick extension)
    const isKick = ent.attackTimer > 0 && (ent.comboStep >= 3 || ent.y > 5 || ent.state === 'special');
    if (isKick) {
      ctx.save();
      ctx.translate(4, -34);
      ctx.rotate(-0.75);
      ctx.fillStyle = flash ? '#fff' : (pal.pants || '#283d66');
      ctx.fillRect(0, 0, 28, 10);
      ctx.fillStyle = flash ? '#fff' : (pal.boots || '#b5241c');
      ctx.fillRect(24, -2, 12, 13);
      ctx.restore();
    } else {
      ctx.fillStyle = flash ? '#fff' : (pal.pants || '#283d66');
      ctx.fillRect(2 + walkCycle * 0.5, -34, 10, 24);
      ctx.fillStyle = flash ? '#fff' : (pal.boots || '#b5241c');
      ctx.fillRect(2 + walkCycle * 0.5, -10, 13, 10);
    }

    // Torso / Jacket / Vest
    const torsoW = ent.heroId === 'mess' || ent.enemyType === 'fatguy' || ent.isBoss ? 30 : 22;
    ctx.fillStyle = flash ? '#fff' : (pal.shirt || pal.jacket || '#f4f7ff');
    this.roundRect(ctx, -torsoW * 0.5, -68, torsoW, 36, 5);
    ctx.fill();

    if (pal.vest) {
      ctx.fillStyle = flash ? '#fff' : pal.vest;
      ctx.fillRect(-torsoW * 0.5, -68, torsoW * 0.36, 34);
      ctx.fillRect(torsoW * 0.14, -68, torsoW * 0.36, 34);
    }

    // Belt
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(-torsoW * 0.5, -36, torsoW, 4);

    // Head & Hair / Cap
    ctx.fillStyle = flash ? '#fff' : (pal.skin || '#f0b88b');
    ctx.beginPath();
    ctx.arc(0, -79, 11, 0, Math.PI * 2);
    ctx.fill();

    // Hannah's Blonde Ponytail
    if (ent.heroId === 'hannah') {
      ctx.fillStyle = pal.hair;
      ctx.beginPath();
      ctx.ellipse(-13, -78, 9, 5, -0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hair or Mustapha's Cap
    if (pal.cap) {
      ctx.fillStyle = pal.cap;
      ctx.beginPath();
      ctx.arc(0, -83, 11, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(0, -85, 16, 4);
    } else {
      ctx.fillStyle = pal.hair || '#2a1c14';
      ctx.beginPath();
      ctx.arc(0, -83, 11.5, Math.PI, 0);
      ctx.fill();
    }

    // Eyes / Sunglasses for Bosses
    ctx.fillStyle = ent.isBoss ? '#ff1744' : '#111';
    ctx.fillRect(3, -82, 6, 3);

    // Front Arm & Held Weapon
    ctx.fillStyle = flash ? '#fff' : (pal.skin || '#f0b88b');
    ctx.fillRect(-2, -62, 16 + punchExtend, 9);
    ctx.fillStyle = pal.gloves || '#52341e';
    ctx.fillRect(11 + punchExtend, -63, 9, 11);

    // Held Weapon
    if (ent.weapon) {
      this.drawWeaponIcon(ctx, ent.weapon.id, 22 + punchExtend, -58, 1.15);
    } else if (ent.enemyType === 'knifeguy') {
      this.drawWeaponIcon(ctx, 'knife', 20 + punchExtend, -58, 1.0);
    } else if (ent.enemyType === 'hunter') {
      this.drawWeaponIcon(ctx, 'm16', 20 + punchExtend, -58, 1.0);
    } else if (ent.bossId === 'butcher') {
      // Butcher's dual giant machetes
      ctx.fillStyle = '#e0f7fa';
      ctx.fillRect(18 + punchExtend, -74, 24, 7);
    }

    // Special Move Aura
    if (ent.state === 'special') {
      ctx.strokeStyle = pal.accent || '#00e5ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, -45, 48, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    // Floating Name / Health Bar for Enemies & AI Partner
    if (!ent.isPlayer1 && ent.hp > 0) {
      const barW = ent.isBoss ? 76 : 44;
      const barY = sy - 104 * scale;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(sx - barW / 2 - 1, barY - 1, barW + 2, 7);
      const pct = Math.max(0, ent.hp / ent.maxHp);
      ctx.fillStyle = ent.isPartner ? '#00e5ff' : ent.isBoss ? '#ff1744' : '#ff9100';
      ctx.fillRect(sx - barW / 2, barY, barW * pct, 5);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ent.name, sx, barY - 4);
    } else if (ent.isPlayer1) {
      // Player 1 indicator arrow
      ctx.fillStyle = '#ffd700';
      ctx.font = '900 11px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('1P', sx, sy - 102);
    }
  }

  // ==========================================================================
  // CPS-1 ARCADE HUD, BOSS BAR, AND POPUPS
  // ==========================================================================
  drawHUD(game, time) {
    const ctx = this.ctx;
    const p1 = game.player;
    if (!p1) return;

    // Top-Left P1 Status Frame
    ctx.save();
    ctx.fillStyle = 'rgba(8, 12, 24, 0.82)';
    this.roundRect(ctx, 18, 14, 370, 74, 8);
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Portrait Box
    ctx.fillStyle = p1.palette.vest || '#1e5fd9';
    ctx.fillRect(26, 22, 56, 58);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(26, 22, 56, 58);
    // Mini Portrait Head
    ctx.fillStyle = p1.palette.skin;
    ctx.beginPath();
    ctx.arc(54, 52, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p1.palette.cap || p1.palette.hair;
    ctx.beginPath();
    ctx.arc(54, 46, 16, Math.PI, 0);
    ctx.fill();

    // Name, Score, Lives
    ctx.fillStyle = '#ffd700';
    ctx.font = '900 18px Impact, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(p1.name, 94, 36);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('SCORE ' + String(game.score).padStart(7, '0'), 215, 36);

    // CPS-1 Yellow-over-Red Health Gauge
    const barX = 94;
    const barY = 44;
    const barW = 280;
    const barH = 18;

    ctx.fillStyle = '#3b0a0a';
    ctx.fillRect(barX, barY, barW, barH);

    // Delayed red drain bar
    const redPct = Math.max(0, (p1.displayHp || p1.hp) / p1.maxHp);
    ctx.fillStyle = '#ff1744';
    ctx.fillRect(barX, barY, barW * redPct, barH);

    // Actual yellow health bar
    const hpPct = Math.max(0, p1.hp / p1.maxHp);
    const hpGrad = ctx.createLinearGradient(barX, barY, barX, barY + barH);
    hpGrad.addColorStop(0, '#fff176');
    hpGrad.addColorStop(0.5, '#ffd600');
    hpGrad.addColorStop(1, '#ff6d00');
    ctx.fillStyle = hpGrad;
    ctx.fillRect(barX, barY, barW * hpPct, barH);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barW, barH);

    // Lives & Equipped Weapon + Cadillac Charges
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Segoe UI, sans-serif';
    const weaponText = p1.weapon
      ? `${p1.weapon.name} [${p1.weapon.ammo}]`
      : 'UNARMED (BRAWLER)';
    ctx.fillText(
      `LIVES x${game.lives}   |   ${weaponText}   |   CADILLAC [U]: x${game.cadillacCalls}`,
      94,
      79
    );

    // Top-Center Stage Banner & Combo Counter
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = '900 18px Impact, sans-serif';
    ctx.fillText(game.currentStage.title, this.width / 2, 32);

    if (game.comboCount > 1) {
      ctx.fillStyle = '#00e5ff';
      ctx.font = '900 28px Impact, sans-serif';
      ctx.fillText(`${game.comboCount} HIT COMBO!`, this.width / 2, 68);
    }

    // Partner Status (Top Right)
    if (game.partner && game.partner.hp > 0) {
      const px = this.width - 280;
      ctx.fillStyle = 'rgba(8, 12, 24, 0.82)';
      this.roundRect(ctx, px, 14, 260, 62, 8);
      ctx.fill();
      ctx.strokeStyle = '#00e5ff';
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#00e5ff';
      ctx.font = '900 15px Impact, sans-serif';
      ctx.fillText(`ALLY: ${game.partner.name}`, px + 14, 35);

      const pPct = Math.max(0, game.partner.hp / game.partner.maxHp);
      ctx.fillStyle = '#263238';
      ctx.fillRect(px + 14, 44, 230, 12);
      ctx.fillStyle = '#00e676';
      ctx.fillRect(px + 14, 44, 230 * pPct, 12);
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(px + 14, 44, 230, 12);
    }

    // Active Boss Multi-Bar Gauge at Bottom
    const activeBoss = game.enemies.find((e) => e.isBoss && e.hp > 0);
    if (activeBoss) {
      const bw = 560;
      const bx = (this.width - bw) / 2;
      const by = this.height - 54;

      ctx.fillStyle = 'rgba(15, 6, 12, 0.9)';
      this.roundRect(ctx, bx - 14, by - 26, bw + 28, 48, 8);
      ctx.fill();
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#ff5252';
      ctx.font = '900 16px Impact, sans-serif';
      ctx.fillText(`BOSS: ${activeBoss.name} — ${activeBoss.subtitle}`, bx, by - 7);

      const bossPct = Math.max(0, activeBoss.hp / activeBoss.maxHp);
      ctx.fillStyle = '#33080e';
      ctx.fillRect(bx, by, bw, 14);
      const bossGrad = ctx.createLinearGradient(bx, by, bx + bw, by);
      bossGrad.addColorStop(0, '#ff1744');
      bossGrad.addColorStop(0.5, '#ff9100');
      bossGrad.addColorStop(1, '#ffd600');
      ctx.fillStyle = bossGrad;
      ctx.fillRect(bx, by, bw * bossPct, 14);
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(bx, by, bw, 14);
    }

    // Flashing "GO! >>" Arcade Arrow when wave is cleared
    if (game.showGoArrow && Math.floor(time / 240) % 2 === 0) {
      ctx.fillStyle = '#ffd700';
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 4;
      ctx.font = '900 54px Impact, sans-serif';
      ctx.textAlign = 'right';
      ctx.strokeText('GO! >>>', this.width - 36, 165);
      ctx.fillText('GO! >>>', this.width - 36, 165);
    }

    ctx.restore();
  }
}

window.ArcadeRenderer = ArcadeRenderer;
