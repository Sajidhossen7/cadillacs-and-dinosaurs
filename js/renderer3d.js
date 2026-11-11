// ============================================================================
// CADILLACS & DINOSAURS 3D: THREE.JS WEBGL REAL-TIME 3D ENGINE
// ============================================================================

class ArcadeRenderer3D {
  constructor(webglCanvas) {
    this.canvas = webglCanvas;
    this.width = webglCanvas.width;
    this.height = webglCanvas.height;
    this.cameraMode = 'arcade3d'; // 'arcade3d', 'action3d', 'classic2d'

    this.initThree();
    this.fighterMeshes = new Map();
    this.dinoMeshes = new Map();
    this.propMeshes = new Map();
    this.pickupMeshes = new Map();
    this.projMeshes = [];
    this.particleMeshes = [];
    this.cadillacMesh = null;
    this.builtStageId = null;
  }

  initThree() {
    const THREE = window.THREE;
    if (!THREE) return;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d152e);
    this.scene.fog = new THREE.FogExp2(0x161d38, 0.00055);

    this.camera = new THREE.PerspectiveCamera(42, this.width / this.height, 10, 4500);
    this.camera.position.set(640, 265, 580);
    this.camera.lookAt(640, 55, 0);

    // Groups
    this.envGroup = new THREE.Group();
    this.entityGroup = new THREE.Group();
    this.fxGroup = new THREE.Group();
    this.scene.add(this.envGroup);
    this.scene.add(this.entityGroup);
    this.scene.add(this.fxGroup);

    // Shared Geometries for performance
    this.sharedBox = new THREE.BoxGeometry(1, 1, 1);
    this.sharedCyl = new THREE.CylinderGeometry(1, 1, 1, 12);
    this.sharedSphere = new THREE.SphereGeometry(1, 12, 12);

    // Lighting
    this.hemiLight = new THREE.HemisphereLight(0xffd8b0, 0x1e293b, 0.78);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff0d0, 1.35);
    this.sunLight.position.set(300, 520, 340);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 50;
    this.sunLight.shadow.camera.far = 1600;
    const d = 620;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Hero dramatic rim light
    this.rimLight = new THREE.DirectionalLight(0x00e5ff, 0.45);
    this.rimLight.position.set(-200, 180, -350);
    this.scene.add(this.rimLight);
  }

  cycleCameraMode() {
    const modes = ['arcade3d', 'action3d', 'classic2d'];
    const idx = (modes.indexOf(this.cameraMode) + 1) % modes.length;
    this.cameraMode = modes[idx];
    this.canvas.style.display = this.cameraMode === 'classic2d' ? 'none' : 'block';
    return this.cameraMode;
  }

  // Convert 2.5D game coords (x, y, z) -> 3D world coords
  to3D(x, y = 0, z = 0) {
    return { x, y, z: z * 2.4 };
  }

  // Project 3D world position to 2D canvas coordinates for HUD/labels
  projectToScreen(x, y, z) {
    const THREE = window.THREE;
    if (!THREE || !this.camera) return { sx: x, sy: y, groundY: y };
    const p3 = this.to3D(x, y, z);
    const vec = new THREE.Vector3(p3.x, p3.y, p3.z);
    vec.project(this.camera);
    const sx = (vec.x * 0.5 + 0.5) * this.width;
    const sy = (-vec.y * 0.5 + 0.5) * this.height;

    const gVec = new THREE.Vector3(p3.x, 0, p3.z);
    gVec.project(this.camera);
    const groundY = (-gVec.y * 0.5 + 0.5) * this.height;
    return { sx, sy, groundY };
  }

  // ==========================================================================
  // 3D STAGE ENVIRONMENT BUILDER
  // ==========================================================================
  buildStageEnvironment(stage) {
    const THREE = window.THREE;
    if (!THREE) return;
    this.builtStageId = stage.id;

    // Clear previous stage
    while (this.envGroup.children.length > 0) {
      this.envGroup.remove(this.envGroup.children[0]);
    }
    this.clearDynamicEntities();

    const len = stage.length + 1400;
    const theme = stage.theme;

    if (theme === 'jungle_city') {
      this.scene.background = new THREE.Color(0x161936);
      this.scene.fog = new THREE.FogExp2(0x282042, 0.00048);
      this.hemiLight.color.setHex(0xffb580);
      this.hemiLight.groundColor.setHex(0x1b2b38);
      this.sunLight.color.setHex(0xffc994);
    } else if (theme === 'swamp_highway') {
      this.scene.background = new THREE.Color(0x361420);
      this.scene.fog = new THREE.FogExp2(0x4a1c24, 0.00048);
      this.hemiLight.color.setHex(0xff9e5e);
      this.hemiLight.groundColor.setHex(0x2d1e14);
      this.sunLight.color.setHex(0xffaa66);
    } else {
      this.scene.background = new THREE.Color(0x06101a);
      this.scene.fog = new THREE.FogExp2(0x0a1c2e, 0.00055);
      this.hemiLight.color.setHex(0x80f8ff);
      this.hemiLight.groundColor.setHex(0x0c1926);
      this.sunLight.color.setHex(0xb8f2ff);
    }

    // 1. Main 3D Roadway / Arena Floor
    const roadColor = theme === 'jungle_city' ? 0x232836 : theme === 'swamp_highway' ? 0x453224 : 0x1c2833;
    const roadMat = new THREE.MeshStandardMaterial({
      color: roadColor,
      roughness: theme === 'bio_lab' ? 0.35 : 0.78,
      metalness: theme === 'bio_lab' ? 0.55 : 0.12
    });
    const roadMesh = new THREE.Mesh(new THREE.BoxGeometry(len, 20, 290), roadMat);
    roadMesh.position.set(len * 0.5 - 300, -10, 0);
    roadMesh.receiveShadow = true;
    this.envGroup.add(roadMesh);

    // Sidewalks / Curbs (Back & Front)
    const curbMat = new THREE.MeshStandardMaterial({
      color: theme === 'swamp_highway' ? 0x6b4c35 : 0x3b4459,
      roughness: 0.7
    });
    const backWalk = new THREE.Mesh(new THREE.BoxGeometry(len, 16, 110), curbMat);
    backWalk.position.set(len * 0.5 - 300, 4, -195);
    backWalk.receiveShadow = true;
    this.envGroup.add(backWalk);

    const frontCurb = new THREE.Mesh(new THREE.BoxGeometry(len, 10, 24), curbMat);
    frontCurb.position.set(len * 0.5 - 300, 2, 152);
    frontCurb.receiveShadow = true;
    this.envGroup.add(frontCurb);

    // Road Dashed Center Lines
    const stripeMat = new THREE.MeshBasicMaterial({
      color: theme === 'bio_lab' ? 0x00e5ff : 0xffca28
    });
    for (let x = -100; x < len - 300; x += 170) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(85, 1.5, 8), stripeMat);
      stripe.position.set(x, 0.5, 0);
      this.envGroup.add(stripe);
    }

    // 2. Theme-Specific 3D Architecture & Scenery
    if (theme === 'jungle_city') {
      // Sunken Sea Water Plane behind the road
      const waterMat = new THREE.MeshStandardMaterial({
        color: 0x0f3854,
        roughness: 0.2,
        metalness: 0.75
      });
      const water = new THREE.Mesh(new THREE.PlaneGeometry(len, 1200), waterMat);
      water.rotation.x = -Math.PI * 0.5;
      water.position.set(len * 0.5 - 300, -18, -750);
      this.envGroup.add(water);

      // Giant Retro Sunset Sphere in distance
      const sunMat = new THREE.MeshBasicMaterial({ color: 0xff9d2e });
      const sunSphere = new THREE.Mesh(new THREE.SphereGeometry(220, 32, 32), sunMat);
      sunSphere.position.set(1800, 460, -1450);
      this.envGroup.add(sunSphere);

      // 3D Sunken Manhattan Skyscrapers, Jungle Trees & Streetlights
      const bldgMat1 = new THREE.MeshStandardMaterial({ color: 0x1d253b, roughness: 0.65 });
      const bldgMat2 = new THREE.MeshStandardMaterial({ color: 0x29324d, roughness: 0.65 });
      const winMat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.9 });
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x1b6e3a, roughness: 0.65 });

      for (let x = -150; x < len - 300; x += 280) {
        // Distant 3D Skyscraper
        const bh = 320 + ((x * 37) % 280);
        const bw = 140 + ((x * 13) % 70);
        const bldg = new THREE.Mesh(
          new THREE.BoxGeometry(bw, bh, 140),
          (x / 280) % 2 === 0 ? bldgMat1 : bldgMat2
        );
        bldg.position.set(x, bh * 0.5 - 40, -440 - ((x * 19) % 220));
        bldg.castShadow = true;
        bldg.receiveShadow = true;
        this.envGroup.add(bldg);

        // Glowing 3D Windows on Skyscraper
        for (let wy = 50; wy < bh - 60; wy += 45) {
          const winStrip = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.75, 14, 4), winMat);
          winStrip.position.set(bldg.position.x, wy, bldg.position.z + 71);
          this.envGroup.add(winStrip);
        }

        // Boulevard 3D Prehistoric Jungle Tree
        const treeGroup = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(9, 14, 105, 8), trunkMat);
        trunk.position.y = 52;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        for (let c = 0; c < 3; c++) {
          const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(42 - c * 7, 1), leafMat);
          crown.position.set((c - 1) * 20, 105 + c * 18, (c % 2) * 12);
          crown.castShadow = true;
          treeGroup.add(crown);
        }
        treeGroup.position.set(x + 90, 8, -175);
        this.envGroup.add(treeGroup);

        // 3D Overpass Pillar & Neon Garage Sign every 560 units
        if (x % 560 === 0) {
          const pillar = new THREE.Mesh(new THREE.BoxGeometry(45, 220, 45), curbMat);
          pillar.position.set(x, 110, -225);
          pillar.castShadow = true;
          this.envGroup.add(pillar);

          const signBoard = new THREE.Mesh(
            new THREE.BoxGeometry(140, 48, 10),
            new THREE.MeshStandardMaterial({ color: 0x101828, emissive: 0x004d66 })
          );
          signBoard.position.set(x, 145, -198);
          this.envGroup.add(signBoard);

          const neonRim = new THREE.Mesh(
            new THREE.BoxGeometry(146, 54, 6),
            new THREE.MeshBasicMaterial({ color: 0x00e5ff })
          );
          neonRim.position.set(x, 145, -201);
          this.envGroup.add(neonRim);
        }
      }
    } else if (theme === 'swamp_highway') {
      // Canyon Mesas, Guardrails & Giant Dino Skulls
      const mesaMat = new THREE.MeshStandardMaterial({ color: 0x7a2e22, roughness: 0.88 });
      const railMat = new THREE.MeshStandardMaterial({ color: 0x90a4ae, metalness: 0.7, roughness: 0.3 });
      const boneMat = new THREE.MeshStandardMaterial({ color: 0xe8dec8, roughness: 0.6 });

      for (let x = -150; x < len - 300; x += 260) {
        // Guardrail section
        const rail = new THREE.Mesh(new THREE.BoxGeometry(230, 14, 8), railMat);
        rail.position.set(x, 22, -145);
        rail.castShadow = true;
        this.envGroup.add(rail);

        // Giant 3D Canyon Mesa
        const mh = 260 + ((x * 29) % 240);
        const mesa = new THREE.Mesh(new THREE.ConeGeometry(160, mh, 6), mesaMat);
        mesa.position.set(x + 60, mh * 0.5 - 10, -450 - ((x * 17) % 180));
        this.envGroup.add(mesa);

        // Giant Prehistoric Ribcage Arches on roadside
        for (let r = 0; r < 3; r++) {
          const rib = new THREE.Mesh(new THREE.TorusGeometry(38, 5, 8, 16, Math.PI), boneMat);
          rib.position.set(x + r * 26, 8, -195);
          rib.rotation.y = 0.3;
          rib.castShadow = true;
          this.envGroup.add(rib);
        }
      }
    } else {
      // STAGE 3: Fessenden's 3D Bio-Lab with Glowing Cloning Vats!
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x16222f, metalness: 0.6, roughness: 0.4 });
      const backWall = new THREE.Mesh(new THREE.BoxGeometry(len, 420, 30), wallMat);
      backWall.position.set(len * 0.5 - 300, 200, -260);
      backWall.receiveShadow = true;
      this.envGroup.add(backWall);

      const glassMat = new THREE.MeshPhongMaterial({
        color: 0x00e676,
        emissive: 0x004d28,
        transparent: true,
        opacity: 0.58,
        shininess: 100
      });
      const capMat = new THREE.MeshStandardMaterial({ color: 0x455a64, metalness: 0.8, roughness: 0.25 });
      const embryoMat = new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.4 });

      for (let x = 0; x < len - 300; x += 320) {
        const vatGroup = new THREE.Group();
        const cyl = new THREE.Mesh(new THREE.CylinderGeometry(42, 42, 190, 20), glassMat);
        cyl.position.y = 110;
        vatGroup.add(cyl);

        const baseCap = new THREE.Mesh(new THREE.CylinderGeometry(48, 52, 24, 20), capMat);
        baseCap.position.y = 12;
        vatGroup.add(baseCap);

        const topCap = new THREE.Mesh(new THREE.CylinderGeometry(48, 48, 24, 20), capMat);
        topCap.position.y = 205;
        vatGroup.add(topCap);

        // Mutant specimen inside vat
        const specimen = new THREE.Mesh(new THREE.TorusKnotGeometry(16, 6, 32, 8), embryoMat);
        specimen.position.y = 110;
        vatGroup.add(specimen);
        vatGroup.userData.specimen = specimen;

        vatGroup.position.set(x, 8, -195);
        this.envGroup.add(vatGroup);
      }
    }
  }

  clearDynamicEntities() {
    while (this.entityGroup.children.length > 0) {
      this.entityGroup.remove(this.entityGroup.children[0]);
    }
    while (this.fxGroup.children.length > 0) {
      this.fxGroup.remove(this.fxGroup.children[0]);
    }
    this.fighterMeshes.clear();
    this.dinoMeshes.clear();
    this.propMeshes.clear();
    this.pickupMeshes.clear();
    this.projMeshes = [];
    this.particleMeshes = [];
    this.cadillacMesh = null;
  }

  // ==========================================================================
  // 3D ARTICULATED FIGHTER RIG (HEROES, POACHERS, BIKERS, BOSSES)
  // ==========================================================================
  createFighterMesh(ent) {
    const THREE = window.THREE;
    const root = new THREE.Group();
    const scale = ent.scale || 1.0;
    root.scale.set(scale, scale, scale);

    const pal = ent.palette || {};
    const skinMat = new THREE.MeshStandardMaterial({ color: pal.skin || '#f0b88b', roughness: 0.55 });
    const shirtMat = new THREE.MeshStandardMaterial({
      color: pal.shirt || pal.jacket || '#f4f7ff',
      roughness: 0.5
    });
    const vestMat = new THREE.MeshStandardMaterial({
      color: pal.vest || pal.jacket || '#1e5fd9',
      roughness: 0.45
    });
    const pantsMat = new THREE.MeshStandardMaterial({ color: pal.pants || '#283d66', roughness: 0.6 });
    const bootMat = new THREE.MeshStandardMaterial({ color: pal.boots || '#b5241c', roughness: 0.4 });
    const hairMat = new THREE.MeshStandardMaterial({
      color: pal.cap || pal.hair || '#2a1c14',
      roughness: 0.5
    });
    const gloveMat = new THREE.MeshStandardMaterial({ color: pal.gloves || '#52341e', roughness: 0.4 });

    const bodyRig = new THREE.Group();
    root.add(bodyRig);

    // Torso
    const isHeavy = ent.heroId === 'mess' || ent.enemyType === 'fatguy' || ent.isBoss;
    const torsoW = isHeavy ? 28 : 20;
    const torso = new THREE.Mesh(new THREE.BoxGeometry(16, 32, torsoW), shirtMat);
    torso.position.y = 48;
    torso.castShadow = true;
    bodyRig.add(torso);

    // 3D Vest Jacket Panels
    if (pal.vest || ent.isBoss) {
      const vestL = new THREE.Mesh(new THREE.BoxGeometry(17.5, 31, torsoW * 0.4), vestMat);
      vestL.position.set(0, 48, torsoW * 0.32);
      vestL.castShadow = true;
      bodyRig.add(vestL);

      const vestR = new THREE.Mesh(new THREE.BoxGeometry(17.5, 31, torsoW * 0.4), vestMat);
      vestR.position.set(0, 48, -torsoW * 0.32);
      vestR.castShadow = true;
      bodyRig.add(vestR);
    }

    // Belt with Gold Buckle
    const belt = new THREE.Mesh(
      new THREE.BoxGeometry(17, 4.5, torsoW + 1),
      new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.7, roughness: 0.3 })
    );
    belt.position.y = 32;
    bodyRig.add(belt);

    // Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 74, 0);
    bodyRig.add(headGroup);

    const head = new THREE.Mesh(new THREE.SphereGeometry(10.5, 16, 16), skinMat);
    head.castShadow = true;
    headGroup.add(head);

    // Hair / Cap / Visor
    const hairTop = new THREE.Mesh(new THREE.SphereGeometry(11.2, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), hairMat);
    hairTop.position.y = 1.5;
    headGroup.add(hairTop);

    if (pal.cap) {
      const visor = new THREE.Mesh(new THREE.BoxGeometry(10, 2.2, 14), hairMat);
      visor.position.set(7, 4, 0);
      headGroup.add(visor);
    }
    if (ent.heroId === 'hannah') {
      const ponytail = new THREE.Mesh(new THREE.ConeGeometry(5, 18, 10), hairMat);
      ponytail.position.set(-12, 0, 0);
      ponytail.rotation.z = Math.PI * 0.35;
      headGroup.add(ponytail);
    }

    // Eyes / Boss Visor
    const eyeMat = new THREE.MeshBasicMaterial({ color: ent.isBoss ? 0xff1744 : 0x111111 });
    const eyes = new THREE.Mesh(new THREE.BoxGeometry(3, 3.2, 12), eyeMat);
    eyes.position.set(8.8, 1.5, 0);
    headGroup.add(eyes);

    // Articulated Legs
    const makeLeg = (zOffset) => {
      const pivot = new THREE.Group();
      pivot.position.set(0, 32, zOffset);
      const thigh = new THREE.Mesh(new THREE.BoxGeometry(10, 20, 9), pantsMat);
      thigh.position.y = -10;
      thigh.castShadow = true;
      pivot.add(thigh);

      const boot = new THREE.Mesh(new THREE.BoxGeometry(14, 12, 10), bootMat);
      boot.position.set(2, -26, 0);
      boot.castShadow = true;
      pivot.add(boot);
      bodyRig.add(pivot);
      return pivot;
    };

    const leftLeg = makeLeg(torsoW * 0.28);
    const rightLeg = makeLeg(-torsoW * 0.28);

    // Articulated Arms + Weapon Mount
    const makeArm = (zOffset) => {
      const pivot = new THREE.Group();
      pivot.position.set(0, 61, zOffset);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(9, 22, 8), skinMat);
      arm.position.y = -10;
      arm.castShadow = true;
      pivot.add(arm);

      const glove = new THREE.Mesh(new THREE.SphereGeometry(5.8, 10, 10), gloveMat);
      glove.position.y = -22;
      pivot.add(glove);

      const weaponMount = new THREE.Group();
      weaponMount.position.set(4, -22, 0);
      pivot.add(weaponMount);

      bodyRig.add(pivot);
      return { pivot, weaponMount };
    };

    const leftArm = makeArm(torsoW * 0.5 + 5);
    const rightArm = makeArm(-(torsoW * 0.5 + 5));

    // Special Move Energy Torus Aura
    const auraMat = new THREE.MeshBasicMaterial({
      color: pal.accent || 0x00e5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.75
    });
    const specialAura = new THREE.Mesh(new THREE.TorusGeometry(38, 4, 10, 24), auraMat);
    specialAura.rotation.x = Math.PI * 0.5;
    specialAura.position.y = 42;
    specialAura.visible = false;
    root.add(specialAura);

    // Player 1 Golden Ground Ring
    if (ent.isPlayer1 || ent.isPartner) {
      const ringMat = new THREE.MeshBasicMaterial({
        color: ent.isPlayer1 ? 0xffd700 : 0x00e5ff,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(20, 25, 24), ringMat);
      ring.rotation.x = -Math.PI * 0.5;
      ring.position.y = 1.2;
      root.add(ring);
    }

    // 3D Chopper Motorcycle for Bikers
    if (ent.isBiker) {
      const bikeGroup = new THREE.Group();
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x181a20, roughness: 0.8 });
      const frameMat = new THREE.MeshStandardMaterial({ color: 0xd32f2f, metalness: 0.6, roughness: 0.3 });

      const wFront = new THREE.Mesh(new THREE.CylinderGeometry(16, 16, 8, 16), wheelMat);
      wFront.rotation.x = Math.PI * 0.5;
      wFront.position.set(28, 16, 0);
      bikeGroup.add(wFront);

      const wBack = new THREE.Mesh(new THREE.CylinderGeometry(16, 16, 10, 16), wheelMat);
      wBack.rotation.x = Math.PI * 0.5;
      wBack.position.set(-28, 16, 0);
      bikeGroup.add(wBack);

      const chassis = new THREE.Mesh(new THREE.BoxGeometry(52, 14, 14), frameMat);
      chassis.position.set(0, 24, 0);
      bikeGroup.add(chassis);
      root.add(bikeGroup);
    }

    root.userData = {
      bodyRig,
      torso,
      headGroup,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      specialAura,
      equippedWeaponId: null
    };

    this.entityGroup.add(root);
    return root;
  }

  build3DWeaponMesh(weaponId) {
    const THREE = window.THREE;
    const g = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.8, roughness: 0.25 });
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.7, roughness: 0.35 });
    const wood = new THREE.MeshStandardMaterial({ color: 0x795548, roughness: 0.7 });

    if (weaponId === 'revolver') {
      const barrel = new THREE.Mesh(new THREE.BoxGeometry(20, 5, 4), metal);
      barrel.position.set(10, 2, 0);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(5, 10, 4), wood);
      grip.position.set(0, -4, 0);
      g.add(barrel, grip);
    } else if (weaponId === 'shotgun' || weaponId === 'm16') {
      const barrel = new THREE.Mesh(new THREE.BoxGeometry(36, 5, 4), darkMetal);
      barrel.position.set(16, 2, 0);
      const stock = new THREE.Mesh(new THREE.BoxGeometry(12, 7, 4), weaponId === 'shotgun' ? wood : darkMetal);
      stock.position.set(-4, 0, 0);
      g.add(barrel, stock);
    } else if (weaponId === 'bazooka') {
      const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(6, 6, 48, 12),
        new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: 0.5 })
      );
      tube.rotation.z = Math.PI * 0.5;
      tube.position.set(12, 8, 0);
      g.add(tube);
    } else if (weaponId === 'knife') {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(18, 4, 1.5), metal);
      blade.position.set(10, 0, 0);
      g.add(blade);
    } else if (weaponId === 'club') {
      const club = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 2.5, 34, 10), wood);
      club.rotation.z = -Math.PI * 0.5;
      club.position.set(14, 0, 0);
      g.add(club);
    } else if (weaponId === 'radio') {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(14, 14, 10),
        new THREE.MeshStandardMaterial({ color: 0x00e5ff, metalness: 0.5 })
      );
      g.add(box);
    } else {
      const stick = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 3, 18, 10),
        new THREE.MeshStandardMaterial({ color: 0xff1744 })
      );
      g.add(stick);
    }
    return g;
  }

  updateFighterMesh(ent, mesh, time) {
    const p3 = this.to3D(ent.x, ent.y, ent.z);
    mesh.position.set(p3.x, p3.y, p3.z);

    const scale = ent.scale || 1.0;
    mesh.scale.set(ent.facing * scale, scale, scale);

    const u = mesh.userData;
    const bodyRig = u.bodyRig;

    // Reset rotations
    bodyRig.rotation.set(0, 0, 0);
    bodyRig.position.set(0, 0, 0);
    u.leftLeg.rotation.set(0, 0, 0);
    u.rightLeg.rotation.set(0, 0, 0);
    u.leftArm.pivot.rotation.set(0, 0, 0);
    u.rightArm.pivot.rotation.set(0, 0, 0);
    u.specialAura.visible = false;

    // Update 3D weapon in hand
    const desiredWeapon = ent.weapon
      ? ent.weapon.id
      : ent.enemyType === 'knifeguy'
      ? 'knife'
      : ent.enemyType === 'hunter'
      ? 'm16'
      : ent.bossId === 'butcher'
      ? 'knife'
      : null;

    if (u.equippedWeaponId !== desiredWeapon) {
      u.equippedWeaponId = desiredWeapon;
      while (u.leftArm.weaponMount.children.length > 0) {
        u.leftArm.weaponMount.remove(u.leftArm.weaponMount.children[0]);
      }
      if (desiredWeapon) {
        u.leftArm.weaponMount.add(this.build3DWeaponMesh(desiredWeapon));
      }
    }

    // Animations
    if (ent.state === 'knockdown') {
      bodyRig.position.y = 12;
      bodyRig.rotation.z = Math.PI * 0.46;
    } else if (ent.state === 'dash_attack' && ent.heroId === 'mustapha') {
      // Mustapha's iconic horizontal 3D flying dropkick!
      bodyRig.position.y = 38;
      bodyRig.rotation.z = Math.PI * 0.4;
      u.leftLeg.rotation.z = -Math.PI * 0.45;
      u.rightLeg.rotation.z = -Math.PI * 0.35;
    } else if (ent.state === 'special') {
      bodyRig.rotation.y = time * 0.035;
      u.leftArm.pivot.rotation.z = -Math.PI * 0.65;
      u.rightArm.pivot.rotation.z = -Math.PI * 0.65;
      u.leftLeg.rotation.z = -Math.PI * 0.45;
      u.specialAura.visible = true;
      u.specialAura.rotation.z = time * 0.02;
    } else if (ent.attackTimer > 0) {
      if (ent.comboStep >= 3 || ent.y > 5) {
        // High 3D Roundhouse Kick!
        u.leftLeg.rotation.z = -Math.PI * 0.56;
        bodyRig.rotation.z = 0.16;
      } else {
        // 3D Punch / Weapon Aim
        const activeArm = ent.comboStep % 2 === 0 ? u.leftArm : u.rightArm;
        activeArm.pivot.rotation.z = -Math.PI * 0.52;
        bodyRig.rotation.y = ent.comboStep % 2 === 0 ? 0.25 : -0.25;
      }
    } else if (ent.isMoving) {
      const speedMult = ent.isRunning ? 0.032 : 0.02;
      const swing = Math.sin(time * speedMult + ent.x * 0.05) * 0.65;
      u.leftLeg.rotation.z = swing;
      u.rightLeg.rotation.z = -swing;
      u.leftArm.pivot.rotation.z = -swing * 0.8;
      u.rightArm.pivot.rotation.z = swing * 0.8;
      if (ent.isRunning) bodyRig.rotation.z = -0.18;
    } else {
      // Breathing idle & fighter guard stance
      const breathe = Math.sin(time * 0.006 + ent.x) * 1.2;
      bodyRig.position.y = breathe;
      u.leftArm.pivot.rotation.z = -0.45;
      u.rightArm.pivot.rotation.z = -0.35;
    }
  }

  // ==========================================================================
  // 3D DINOSAUR MODELS (VELOCIRAPTOR, TRICERATOPS, PTERANODON)
  // ==========================================================================
  createDinoMesh(dino) {
    const THREE = window.THREE;
    const root = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: dino.calm ? 0x4caf50 : 0xd62828,
      roughness: 0.45
    });
    const bellyMat = new THREE.MeshStandardMaterial({ color: 0xe9c46a, roughness: 0.6 });
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xfff8e7, roughness: 0.3 });

    if (dino.dinoType === 'raptor') {
      // Sculpted 3D Raptor
      const torso = new THREE.Mesh(new THREE.SphereGeometry(18, 16, 12), bodyMat);
      torso.scale.set(1.7, 0.95, 0.85);
      torso.position.set(0, 38, 0);
      torso.castShadow = true;
      root.add(torso);

      // Neck & Snout
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(7, 11, 26, 12), bodyMat);
      neck.position.set(22, 52, 0);
      neck.rotation.z = -0.45;
      root.add(neck);

      const snout = new THREE.Mesh(new THREE.BoxGeometry(26, 11, 12), bodyMat);
      snout.position.set(36, 62, 0);
      snout.castShadow = true;
      root.add(snout);

      // Glowing Raptor Eyes
      const eye = new THREE.Mesh(
        new THREE.BoxGeometry(4, 4, 13.5),
        new THREE.MeshBasicMaterial({ color: 0xffea00 })
      );
      eye.position.set(32, 64, 0);
      root.add(eye);

      // Whipping 3D Tail
      const tail = new THREE.Mesh(new THREE.ConeGeometry(9, 58, 12), bodyMat);
      tail.position.set(-44, 42, 0);
      tail.rotation.z = Math.PI * 0.45;
      tail.castShadow = true;
      root.add(tail);

      // Hind Legs
      const legL = new THREE.Mesh(new THREE.CylinderGeometry(6, 4, 36, 10), bodyMat);
      legL.position.set(-4, 18, 9);
      legL.castShadow = true;
      const legR = legL.clone();
      legR.position.z = -9;
      root.add(legL, legR);

      root.userData = { bodyMat, tail, legL, legR };
    } else if (dino.dinoType === 'triceratops') {
      // Massive 3D Armored Triceratops
      const torso = new THREE.Mesh(new THREE.SphereGeometry(28, 18, 14), bodyMat);
      torso.scale.set(1.65, 1.05, 1.05);
      torso.position.set(-6, 42, 0);
      torso.castShadow = true;
      root.add(torso);

      // Armored Neck Frill
      const frill = new THREE.Mesh(new THREE.CylinderGeometry(28, 28, 7, 16), bellyMat);
      frill.rotation.z = Math.PI * 0.38;
      frill.position.set(24, 56, 0);
      frill.castShadow = true;
      root.add(frill);

      // Head & 3 Ivory Horns
      const head = new THREE.Mesh(new THREE.ConeGeometry(18, 34, 12), bodyMat);
      head.rotation.z = -Math.PI * 0.5;
      head.position.set(42, 44, 0);
      root.add(head);

      const hornL = new THREE.Mesh(new THREE.ConeGeometry(3.5, 32, 10), hornMat);
      hornL.rotation.z = -Math.PI * 0.38;
      hornL.position.set(48, 60, 10);
      const hornR = hornL.clone();
      hornR.position.z = -10;
      root.add(hornL, hornR);

      const legL = new THREE.Mesh(new THREE.CylinderGeometry(8, 7, 32, 10), bodyMat);
      legL.position.set(18, 16, 16);
      const legR = legL.clone();
      legR.position.set(-24, 16, -16);
      root.add(legL, legR);

      root.userData = { bodyMat, legL, legR };
    } else {
      // Swooping 3D Pteranodon
      const pteroMat = new THREE.MeshStandardMaterial({ color: 0x9d4edd, roughness: 0.4 });
      const body = new THREE.Mesh(new THREE.ConeGeometry(9, 42, 10), pteroMat);
      body.rotation.z = -Math.PI * 0.5;
      root.add(body);

      const wingGeo = new THREE.BoxGeometry(24, 2.5, 48);
      const wingL = new THREE.Mesh(wingGeo, pteroMat);
      wingL.position.set(0, 0, 24);
      const wingR = new THREE.Mesh(wingGeo, pteroMat);
      wingR.position.set(0, 0, -24);
      root.add(wingL, wingR);

      root.userData = { bodyMat: pteroMat, wingL, wingR };
    }

    this.entityGroup.add(root);
    return root;
  }

  updateDinoMesh(dino, mesh, time) {
    const p3 = this.to3D(dino.x, dino.y, dino.z);
    mesh.position.set(p3.x, p3.y, p3.z);
    mesh.scale.set(dino.facing, 1, 1);

    const u = mesh.userData;
    if (u.bodyMat && dino.dinoType !== 'pteranodon') {
      u.bodyMat.color.setHex(dino.calm ? 0x4caf50 : 0xd62828);
      u.bodyMat.emissive.setHex(dino.hurtTimer > 0 ? 0x555555 : !dino.calm ? 0x330505 : 0x000000);
    }

    const cycle = Math.sin(time * 0.025 + dino.x * 0.05) * 0.45;
    if (u.legL && u.legR) {
      u.legL.rotation.z = cycle;
      u.legR.rotation.z = -cycle;
    }
    if (u.tail) {
      u.tail.rotation.y = cycle * 0.5;
    }
    if (u.wingL && u.wingR) {
      u.wingL.rotation.x = cycle * 0.9;
      u.wingR.rotation.x = -cycle * 0.9;
    }
  }

  // ==========================================================================
  // 3D 1953 CADILLAC ELDORADO CONVERTIBLE V8
  // ==========================================================================
  createCadillacMesh() {
    const THREE = window.THREE;
    const car = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xd90429,
      metalness: 0.65,
      roughness: 0.22
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe8f1f5,
      metalness: 0.92,
      roughness: 0.12
    });
    const glassMat = new THREE.MeshPhongMaterial({
      color: 0x90e0ef,
      transparent: true,
      opacity: 0.6,
      shininess: 120
    });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x141619, roughness: 0.85 });

    // Main Sculpted Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(255, 32, 92), bodyMat);
    chassis.position.set(0, 30, 0);
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    car.add(chassis);

    // Iconic 1953 Rear Tailfins!
    [-40, 40].forEach((zf) => {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(68, 22, 8), bodyMat);
      fin.position.set(-96, 52, zf);
      fin.rotation.z = 0.22;
      fin.castShadow = true;
      car.add(fin);
    });

    // Chrome Side Spears & Heavy Chrome Bumpers
    const chromeSpear = new THREE.Mesh(new THREE.BoxGeometry(260, 5, 96), chromeMat);
    chromeSpear.position.set(0, 28, 0);
    car.add(chromeSpear);

    const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(18, 16, 98), chromeMat);
    frontBumper.position.set(130, 22, 0);
    car.add(frontBumper);

    const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(18, 16, 98), chromeMat);
    rearBumper.position.set(-130, 22, 0);
    car.add(rearBumper);

    // Wrap-around Glass Windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(12, 28, 84), glassMat);
    windshield.position.set(36, 56, 0);
    windshield.rotation.z = 0.38;
    car.add(windshield);

    // 4 Spinning Whitewall Tires
    const wheels = [];
    [
      [-82, 46],
      [-82, -46],
      [82, 46],
      [82, -46]
    ].forEach(([wx, wz]) => {
      const wGroup = new THREE.Group();
      wGroup.position.set(wx, 20, wz);
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 14, 20), tireMat);
      tire.rotation.x = Math.PI * 0.5;
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 15, 16), chromeMat);
      rim.rotation.x = Math.PI * 0.5;
      wGroup.add(tire, rim);
      car.add(wGroup);
      wheels.push(wGroup);
    });

    // Real 3D Headlight SpotLight illuminating the road ahead!
    const headLight = new THREE.SpotLight(0xfff3b0, 2.8, 750, Math.PI * 0.22, 0.4, 1);
    headLight.position.set(132, 38, 0);
    headLight.target.position.set(520, 0, 0);
    car.add(headLight);
    car.add(headLight.target);

    // Twin Nitro Exhaust Flame Cones
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const flameL = new THREE.Mesh(new THREE.ConeGeometry(8, 42, 10), flameMat);
    flameL.rotation.z = Math.PI * 0.5;
    flameL.position.set(-150, 22, 26);
    const flameR = flameL.clone();
    flameR.position.z = -26;
    car.add(flameL, flameR);

    car.userData = { wheels, flameL, flameR };
    this.entityGroup.add(car);
    return car;
  }

  // ==========================================================================
  // 3D BREAKABLE PROPS & FLOATING 3D PICKUPS
  // ==========================================================================
  createPropMesh(prop) {
    const THREE = window.THREE;
    const g = new THREE.Group();

    if (prop.type === 'barrel') {
      const barrelMat = new THREE.MeshStandardMaterial({
        color: 0xd32f2f,
        metalness: 0.45,
        roughness: 0.4
      });
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 62, 18), barrelMat);
      drum.position.y = 31;
      drum.castShadow = true;
      drum.receiveShadow = true;
      g.add(drum);

      const ringMat = new THREE.MeshStandardMaterial({ color: 0xffca28, metalness: 0.6 });
      const r1 = new THREE.Mesh(new THREE.CylinderGeometry(23, 23, 5, 18), ringMat);
      r1.position.y = 44;
      const r2 = r1.clone();
      r2.position.y = 20;
      g.add(r1, r2);
    } else if (prop.type === 'crate') {
      const crateMat = new THREE.MeshStandardMaterial({ color: 0x8d5524, roughness: 0.75 });
      const box = new THREE.Mesh(new THREE.BoxGeometry(52, 52, 52), crateMat);
      box.position.y = 26;
      box.castShadow = true;
      box.receiveShadow = true;
      g.add(box);
    } else {
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x1c1e24, roughness: 0.85 });
      for (let i = 0; i < 3; i++) {
        const t = new THREE.Mesh(new THREE.TorusGeometry(20, 8, 10, 18), tireMat);
        t.rotation.x = Math.PI * 0.5;
        t.position.y = 10 + i * 15;
        t.castShadow = true;
        g.add(t);
      }
    }

    this.entityGroup.add(g);
    return g;
  }

  createPickupMesh(item) {
    const THREE = window.THREE;
    const g = new THREE.Group();

    if (item.category === 'weapon') {
      const wMesh = this.build3DWeaponMesh(item.id);
      wMesh.scale.set(1.35, 1.35, 1.35);
      wMesh.position.y = 22;
      g.add(wMesh);
    } else if (item.id === 'dino_steak' || item.id === 'bbq_ribs') {
      const bone = new THREE.Mesh(
        new THREE.CylinderGeometry(3.5, 3.5, 44, 10),
        new THREE.MeshStandardMaterial({ color: 0xf5f5f5 })
      );
      bone.rotation.z = Math.PI * 0.5;
      bone.position.y = 20;
      const meat = new THREE.Mesh(
        new THREE.SphereGeometry(15, 14, 12),
        new THREE.MeshStandardMaterial({ color: 0xbf360c, roughness: 0.45 })
      );
      meat.scale.set(1.3, 0.9, 0.9);
      meat.position.y = 20;
      g.add(bone, meat);
    } else if (item.id === 'diamond') {
      const gem = new THREE.Mesh(
        new THREE.OctahedronGeometry(14, 0),
        new THREE.MeshStandardMaterial({ color: 0x00e5ff, metalness: 0.3, roughness: 0.1 })
      );
      gem.position.y = 22;
      g.add(gem);
    } else {
      const gold = new THREE.Mesh(
        new THREE.SphereGeometry(12, 14, 12),
        new THREE.MeshStandardMaterial({ color: 0xffca28, metalness: 0.5, roughness: 0.3 })
      );
      gold.position.y = 18;
      g.add(gold);
    }

    // Glowing Ground Halo Ring
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(14, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xffea00, side: THREE.DoubleSide })
    );
    halo.rotation.x = -Math.PI * 0.5;
    halo.position.y = 1.5;
    g.add(halo);

    this.entityGroup.add(g);
    return g;
  }

  // ==========================================================================
  // RENDER FULL 3D SCENE (GAMEPLAY OR CHARACTER SELECT SHOWCASE)
  // ==========================================================================
  renderScene(game, time) {
    const THREE = window.THREE;
    if (!THREE || !this.renderer || this.cameraMode === 'classic2d') return;

    // Ensure current stage 3D environment is built
    if (this.builtStageId !== game.currentStage.id) {
      this.buildStageEnvironment(game.currentStage);
    }

    if (game.mode === 'select') {
      this.renderSelectShowcase(game, time);
      return;
    }

    // 1. Update 3D Camera Position & Angle
    const camCenterX = game.cameraX + this.width * 0.5;
    const shakeX = game.screenShake > 0 ? (Math.random() - 0.5) * game.screenShake * 2.5 : 0;
    const shakeY = game.screenShake > 0 ? (Math.random() - 0.5) * game.screenShake * 2.5 : 0;

    if (this.cameraMode === 'action3d' && game.player) {
      // Dynamic Closer Action 3D Camera
      const targetX = game.player.x + game.player.facing * 95;
      this.camera.position.set(targetX + shakeX, 195 + shakeY, 440 + game.player.z * 1.4);
      this.camera.lookAt(targetX, 55, game.player.z * 1.8);
    } else {
      // Wide 3D Arcade Perspective Camera
      this.camera.position.set(camCenterX + shakeX, 265 + shakeY, 595);
      this.camera.lookAt(camCenterX, 52, -15);
    }

    // Move sun shadow frustum with camera
    this.sunLight.position.set(camCenterX + 260, 520, 340);
    this.sunLight.target.position.set(camCenterX, 0, 0);

    // 2. Sync Fighters (Player, Partner, Enemies, Bosses)
    const activeFighters = new Set();
    if (game.player && !game.player.dead && !(game.cadillac && game.cadillac.active)) {
      activeFighters.add(game.player);
    }
    if (game.partner && !game.partner.dead) {
      activeFighters.add(game.partner);
    }
    for (const e of game.enemies) {
      if (!e.dead) activeFighters.add(e);
    }

    for (const [f, mesh] of this.fighterMeshes.entries()) {
      if (!activeFighters.has(f)) {
        this.entityGroup.remove(mesh);
        this.fighterMeshes.delete(f);
      }
    }
    for (const f of activeFighters) {
      let mesh = this.fighterMeshes.get(f);
      if (!mesh) {
        mesh = this.createFighterMesh(f);
        this.fighterMeshes.set(f, mesh);
      }
      this.updateFighterMesh(f, mesh, time);
    }

    // 3. Sync Dinosaurs
    const activeDinos = new Set(game.dinosaurs.filter((d) => !d.dead));
    for (const [d, mesh] of this.dinoMeshes.entries()) {
      if (!activeDinos.has(d)) {
        this.entityGroup.remove(mesh);
        this.dinoMeshes.delete(d);
      }
    }
    for (const d of activeDinos) {
      let mesh = this.dinoMeshes.get(d);
      if (!mesh) {
        mesh = this.createDinoMesh(d);
        this.dinoMeshes.set(d, mesh);
      }
      this.updateDinoMesh(d, mesh, time);
    }

    // 4. Sync 3D 1953 Cadillac Eldorado
    if (game.cadillac && game.cadillac.active) {
      if (!this.cadillacMesh) {
        this.cadillacMesh = this.createCadillacMesh();
      }
      const p3 = this.to3D(game.cadillac.x, game.cadillac.y, game.cadillac.z);
      this.cadillacMesh.position.set(p3.x, p3.y + Math.sin(time * 0.04) * 2, p3.z);
      this.cadillacMesh.userData.wheels.forEach((w) => {
        w.rotation.z -= 0.28;
      });
      const fScale = 0.8 + Math.random() * 0.6;
      this.cadillacMesh.userData.flameL.scale.set(1, fScale, 1);
      this.cadillacMesh.userData.flameR.scale.set(1, fScale, 1);
    } else if (this.cadillacMesh) {
      this.entityGroup.remove(this.cadillacMesh);
      this.cadillacMesh = null;
    }

    // 5. Sync Breakable 3D Props
    const activeProps = new Set(game.props);
    for (const [p, mesh] of this.propMeshes.entries()) {
      if (!activeProps.has(p)) {
        this.entityGroup.remove(mesh);
        this.propMeshes.delete(p);
      }
    }
    for (const p of activeProps) {
      let mesh = this.propMeshes.get(p);
      if (!mesh) {
        mesh = this.createPropMesh(p);
        this.propMeshes.set(p, mesh);
      }
      const p3 = this.to3D(p.x, 0, p.z);
      const shake = p.hitShake > 0 ? (Math.random() - 0.5) * 6 : 0;
      mesh.position.set(p3.x + shake, 0, p3.z);
    }

    // 6. Sync Rotating 3D Pickups
    const activePickups = new Set(game.pickups);
    for (const [pk, mesh] of this.pickupMeshes.entries()) {
      if (!activePickups.has(pk)) {
        this.entityGroup.remove(mesh);
        this.pickupMeshes.delete(pk);
      }
    }
    for (const pk of activePickups) {
      let mesh = this.pickupMeshes.get(pk);
      if (!mesh) {
        mesh = this.createPickupMesh(pk);
        this.pickupMeshes.set(pk, mesh);
      }
      const p3 = this.to3D(pk.x, 0, pk.z);
      mesh.position.set(p3.x, Math.sin(time * 0.006 + pk.x) * 4, p3.z);
      mesh.rotation.y = time * 0.004;
    }

    // 7. Sync 3D Projectiles & 3D Explosion Particles
    while (this.fxGroup.children.length > 0) {
      this.fxGroup.remove(this.fxGroup.children[0]);
    }
    for (const proj of game.projectiles) {
      const p3 = this.to3D(proj.x, proj.y, proj.z);
      const m = new THREE.Mesh(
        this.sharedSphere,
        new THREE.MeshBasicMaterial({ color: proj.color || 0xffeb3b })
      );
      const r = proj.explosive ? 7.5 : 4.5;
      m.scale.set(r * 1.8, r, r);
      m.position.set(p3.x, p3.y, p3.z);
      this.fxGroup.add(m);
    }
    for (const pt of game.particles) {
      const p3 = this.to3D(pt.x, pt.y, pt.z);
      const m = new THREE.Mesh(
        this.sharedBox,
        new THREE.MeshBasicMaterial({ color: pt.color || 0xffab00 })
      );
      m.scale.set(pt.size, pt.size, pt.size);
      m.position.set(p3.x, p3.y, p3.z);
      m.rotation.set(time * 0.02, time * 0.03, 0);
      this.fxGroup.add(m);
    }

    this.renderer.render(this.scene, this.camera);
  }

  // Live 3D Showcase Background on Character Select Screen
  renderSelectShowcase(game, time) {
    const orbitX = 640 + Math.sin(time * 0.0005) * 160;
    this.camera.position.set(orbitX, 185, 420);
    this.camera.lookAt(640, 65, -40);
    this.sunLight.position.set(800, 480, 320);
    this.sunLight.target.position.set(640, 0, 0);

    if (!this.cadillacMesh) {
      this.cadillacMesh = this.createCadillacMesh();
    }
    this.cadillacMesh.position.set(640, 2, -65);
    this.cadillacMesh.rotation.y = Math.sin(time * 0.0008) * 0.35;

    this.renderer.render(this.scene, this.camera);
  }
}

window.ArcadeRenderer3D = ArcadeRenderer3D;
