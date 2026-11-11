// ============================================================================
// CADILLACS & DINOSAURS: XENOZOIC RAMPAGE - GAME DATA & STAGE DEFINITIONS
// ============================================================================

window.GAME_DATA = {
  HEROES: {
    jack: {
      id: 'jack',
      name: 'JACK TENREC',
      title: 'XENOZOIC MECHANIC',
      bio: 'Defender of the Old Blood & master of classic 1953 Cadillacs. Balanced speed and devastating spiral uppercuts.',
      stats: { power: 8, speed: 8, technique: 9, stamina: 140 },
      speedX: 4.5,
      speedZ: 3.1,
      jumpPower: 13.8,
      attackDamage: [14, 16, 20, 32],
      dashDamage: 28,
      specialName: 'SPIRAL VOLCANO UPPER',
      specialDamage: 46,
      palette: {
        skin: '#f0b88b',
        hair: '#2a1c14',
        vest: '#1e5fd9',
        shirt: '#f4f7ff',
        pants: '#283d66',
        boots: '#b5241c',
        gloves: '#52341e',
        accent: '#00e5ff'
      }
    },
    hannah: {
      id: 'hannah',
      name: 'HANNAH DUNDEE',
      title: 'WASSOON AMBASSADOR',
      bio: 'Brilliant diplomat and wilderness tracker. Lightning-fast strikes and +25% bonus damage with all weapons.',
      stats: { power: 7, speed: 10, technique: 10, stamina: 125 },
      speedX: 5.1,
      speedZ: 3.5,
      jumpPower: 14.5,
      attackDamage: [12, 14, 18, 28],
      dashDamage: 25,
      weaponBonus: 1.25,
      specialName: 'FLASH CYCLONE KICK',
      specialDamage: 42,
      palette: {
        skin: '#f7c8a0',
        hair: '#f5c542',
        vest: '#d9232e',
        shirt: '#ffffff',
        pants: '#2b7a4b',
        boots: '#8c4b27',
        gloves: '#d9232e',
        accent: '#ff427b'
      }
    },
    mustapha: {
      id: 'mustapha',
      name: 'MUSTAPHA CAIRO',
      title: 'MASTER ENGINEER',
      bio: 'Jack’s best friend and aerial acrobat. Famous for his screen-clearing flying dropkick and tornado flip kicks.',
      stats: { power: 7, speed: 10, technique: 9, stamina: 130 },
      speedX: 5.3,
      speedZ: 3.6,
      jumpPower: 15.0,
      attackDamage: [13, 15, 19, 30],
      dashDamage: 34, // Iconic Mustapha flying dropkick!
      specialName: 'TORNADO FLIP KICK',
      specialDamage: 45,
      palette: {
        skin: '#9c6137',
        hair: '#1c140d',
        cap: '#ffd000',
        vest: '#269e49',
        shirt: '#269e49',
        pants: '#e87e1b',
        boots: '#d9232e',
        gloves: '#ffd000',
        accent: '#ffe600'
      }
    },
    mess: {
      id: 'mess',
      name: "MESS O'BRADOVICH",
      title: 'HEAVYWEIGHT TITAN',
      bio: 'Gentle giant with unstoppable raw strength. Crushes poachers and enraged dinosaurs alike with seismic slams.',
      stats: { power: 10, speed: 6, technique: 7, stamina: 175 },
      speedX: 3.9,
      speedZ: 2.7,
      jumpPower: 13.0,
      attackDamage: [19, 22, 27, 42],
      dashDamage: 38,
      specialName: 'SEISMIC LARIAT CRASH',
      specialDamage: 56,
      palette: {
        skin: '#e8a87c',
        hair: '#3d2314',
        vest: '#c91e1e',
        shirt: '#c91e1e',
        pants: '#2c497f',
        boots: '#242424',
        gloves: '#3a3a3a',
        accent: '#ff5100'
      }
    }
  },

  WEAPONS: {
    revolver: {
      id: 'revolver',
      name: '.44 REVOLVER',
      type: 'gun',
      ammo: 6,
      damage: 32,
      fireRate: 16,
      bulletSpeed: 18,
      color: '#cfd8dc'
    },
    shotgun: {
      id: 'shotgun',
      name: 'RIOT SHOTGUN',
      type: 'gun',
      ammo: 5,
      damage: 48,
      spread: true,
      fireRate: 28,
      bulletSpeed: 16,
      color: '#ffb74d'
    },
    m16: {
      id: 'm16',
      name: 'M16 ASSAULT RIFLE',
      type: 'gun',
      ammo: 24,
      damage: 18,
      fireRate: 6,
      bulletSpeed: 21,
      color: '#90a4ae'
    },
    bazooka: {
      id: 'bazooka',
      name: 'ROCKET LAUNCHER',
      type: 'gun',
      ammo: 4,
      damage: 85,
      explosive: true,
      fireRate: 36,
      bulletSpeed: 14,
      color: '#4caf50'
    },
    club: {
      id: 'club',
      name: 'SPIKED CLUB',
      type: 'melee',
      ammo: 10,
      damage: 34,
      color: '#a1662f'
    },
    knife: {
      id: 'knife',
      name: 'HUNTER BOWIE',
      type: 'melee',
      ammo: 8,
      damage: 28,
      color: '#e0f7fa'
    },
    dynamite: {
      id: 'dynamite',
      name: 'DYNAMITE BUNDLE',
      type: 'thrown',
      ammo: 3,
      damage: 75,
      explosive: true,
      color: '#ff1744'
    },
    radio: {
      id: 'radio',
      name: 'CADILLAC TRANSMITTER',
      type: 'summon',
      ammo: 1,
      color: '#00e5ff'
    }
  },

  ITEMS: {
    dino_steak: { id: 'dino_steak', name: 'ROAST DINO STEAK', heal: 110, score: 1500, color: '#d84315' },
    bbq_ribs:   { id: 'bbq_ribs',   name: 'BARBECUE RIBS',    heal: 75,  score: 1000, color: '#ef6c00' },
    burger:     { id: 'burger',     name: 'CLASSIC BURGER',   heal: 48,  score: 600,  color: '#fbc02d' },
    apple:      { id: 'apple',      name: 'FRESH APPLE',      heal: 28,  score: 300,  color: '#e53935' },
    gold_bars:  { id: 'gold_bars',  name: 'GOLD BULLION',     heal: 0,   score: 5000, color: '#ffd700' },
    diamond:    { id: 'diamond',    name: 'XENOZOIC GEM',     heal: 0,   score: 10000,color: '#00e5ff' }
  },

  ENEMIES: {
    poacher: {
      name: 'FERRIS',
      hp: 65,
      speed: 2.3,
      damage: 10,
      score: 400,
      scale: 1.0,
      palette: { skin: '#e0a882', jacket: '#6a329f', pants: '#2f3e56', hair: '#d9534f' }
    },
    knifeguy: {
      name: 'BLADE',
      hp: 58,
      speed: 3.3,
      damage: 13,
      score: 550,
      scale: 0.96,
      palette: { skin: '#d8a07e', jacket: '#1b8057', pants: '#232730', hair: '#ffd11a' }
    },
    fatguy: {
      name: 'HAMMER G.',
      hp: 115,
      speed: 1.85,
      damage: 18,
      score: 750,
      scale: 1.24,
      palette: { skin: '#e5a073', jacket: '#b84b14', pants: '#343b29', hair: '#222222' }
    },
    hunter: {
      name: 'POACHER RIFLEMAN',
      hp: 75,
      speed: 2.1,
      damage: 14,
      score: 700,
      ranged: true,
      scale: 1.02,
      palette: { skin: '#cfa07e', jacket: '#856d35', pants: '#3c3424', hair: '#301d10' }
    },
    biker: {
      name: 'HOG RIDER',
      hp: 90,
      speed: 5.5,
      damage: 20,
      score: 900,
      isBiker: true,
      scale: 1.08,
      palette: { skin: '#d49b72', jacket: '#22252a', pants: '#192a48', hair: '#ff5500' }
    }
  },

  BOSSES: {
    vice: {
      id: 'vice',
      name: 'VICE TERHUNE',
      subtitle: 'CITY ROOFTOP POACHER WARLORD',
      hp: 460,
      speed: 2.9,
      damage: 22,
      score: 15000,
      scale: 1.32,
      palette: { skin: '#c4835b', jacket: '#b51b2e', pants: '#1d2230', hair: '#e8e8e8' }
    },
    butcher: {
      id: 'butcher',
      name: 'THE BUTCHER',
      subtitle: 'NORTHERN WOODS DINOSAUR HUNTER',
      hp: 620,
      speed: 3.2,
      damage: 26,
      score: 25000,
      scale: 1.42,
      palette: { skin: '#d99870', jacket: '#3b1d5e', pants: '#2b1b12', hair: '#ff3b00' }
    },
    fessenden: {
      id: 'fessenden',
      name: 'DR. SIMON FESSENDEN',
      subtitle: 'MUTANT BIO-REX ABOMINATION',
      hp: 850,
      speed: 3.5,
      damage: 30,
      score: 50000,
      scale: 1.58,
      palette: { skin: '#4caf50', jacket: '#8e24aa', pants: '#263238', hair: '#ffeb3b' }
    }
  },

  STAGES: [
    {
      id: 1,
      title: 'STAGE 1: CITY IN THE SEA',
      subtitle: '2513 AD - SUNKEN MANHATTAN OVERGROWN JUNGLE',
      music: 'stage1',
      length: 3400,
      theme: 'jungle_city',
      startWithCadillac: false,
      props: [
        { x: 420, z: 30, type: 'barrel', drop: 'revolver' },
        { x: 780, z: -25, type: 'crate', drop: 'burger' },
        { x: 1180, z: 40, type: 'barrel', drop: 'm16' },
        { x: 1560, z: -30, type: 'tire_stack', drop: 'bbq_ribs' },
        { x: 1950, z: 20, type: 'crate', drop: 'radio' },
        { x: 2380, z: -20, type: 'barrel', drop: 'shotgun' },
        { x: 2780, z: 35, type: 'crate', drop: 'dino_steak' },
        { x: 3120, z: -25, type: 'barrel', drop: 'dynamite' }
      ],
      waves: [
        {
          triggerX: 300,
          lockCamera: true,
          spawns: [
            { type: 'poacher', xOffset: 450, z: -20 },
            { type: 'poacher', xOffset: -380, z: 30 },
            { type: 'knifeguy', xOffset: 520, z: 25 }
          ]
        },
        {
          triggerX: 920,
          lockCamera: true,
          spawns: [
            { type: 'poacher', xOffset: 480, z: -30 },
            { type: 'hunter', xOffset: 540, z: 20 },
            { type: 'dino_raptor', xOffset: 600, z: 0, calm: true },
            { type: 'knifeguy', xOffset: -420, z: 15 }
          ]
        },
        {
          triggerX: 1650,
          lockCamera: true,
          spawns: [
            { type: 'fatguy', xOffset: 480, z: 0 },
            { type: 'poacher', xOffset: 520, z: -35 },
            { type: 'poacher', xOffset: -440, z: 35 },
            { type: 'dino_pteranodon', xOffset: 550, z: -15 }
          ]
        },
        {
          triggerX: 2350,
          lockCamera: true,
          spawns: [
            { type: 'hunter', xOffset: 480, z: -25 },
            { type: 'knifeguy', xOffset: 510, z: 30 },
            { type: 'fatguy', xOffset: -450, z: 10 },
            { type: 'dino_raptor', xOffset: 580, z: -10, calm: false }
          ]
        },
        {
          triggerX: 3050,
          lockCamera: true,
          isBossWave: true,
          bossId: 'vice',
          spawns: [
            { type: 'boss', bossId: 'vice', xOffset: 460, z: 0 },
            { type: 'dino_raptor', xOffset: 520, z: -35, calm: false },
            { type: 'poacher', xOffset: -420, z: 30 }
          ]
        }
      ]
    },
    {
      id: 2,
      title: "STAGE 2: THE BUTCHER'S HIGHWAY",
      subtitle: 'SWAMPLAND CANYON - HIGH-SPEED 1953 CADILLAC ASSAULT',
      music: 'stage2',
      length: 3800,
      theme: 'swamp_highway',
      startWithCadillac: true,
      props: [
        { x: 550, z: 25, type: 'barrel', drop: 'shotgun' },
        { x: 1050, z: -30, type: 'tire_stack', drop: 'gold_bars' },
        { x: 1620, z: 35, type: 'crate', drop: 'm16' },
        { x: 2150, z: -25, type: 'barrel', drop: 'dino_steak' },
        { x: 2680, z: 15, type: 'crate', drop: 'bazooka' },
        { x: 3250, z: -30, type: 'barrel', drop: 'dino_steak' }
      ],
      waves: [
        {
          triggerX: 360,
          lockCamera: false,
          spawns: [
            { type: 'biker', xOffset: 550, z: -20 },
            { type: 'biker', xOffset: 650, z: 25 },
            { type: 'poacher', xOffset: 480, z: 0 }
          ]
        },
        {
          triggerX: 1050,
          lockCamera: true,
          spawns: [
            { type: 'biker', xOffset: 540, z: -25 },
            { type: 'dino_triceratops', xOffset: 600, z: 15, calm: false },
            { type: 'hunter', xOffset: 480, z: -30 },
            { type: 'poacher', xOffset: -420, z: 25 }
          ]
        },
        {
          triggerX: 1850,
          lockCamera: true,
          spawns: [
            { type: 'fatguy', xOffset: 480, z: -15 },
            { type: 'fatguy', xOffset: 530, z: 30 },
            { type: 'biker', xOffset: 600, z: 0 },
            { type: 'dino_pteranodon', xOffset: 520, z: -20 }
          ]
        },
        {
          triggerX: 2650,
          lockCamera: true,
          spawns: [
            { type: 'dino_triceratops', xOffset: 550, z: -10, calm: false },
            { type: 'hunter', xOffset: 490, z: 30 },
            { type: 'knifeguy', xOffset: -420, z: -20 },
            { type: 'knifeguy', xOffset: 520, z: 20 }
          ]
        },
        {
          triggerX: 3420,
          lockCamera: true,
          isBossWave: true,
          bossId: 'butcher',
          spawns: [
            { type: 'boss', bossId: 'butcher', xOffset: 470, z: 0 },
            { type: 'dino_raptor', xOffset: 540, z: 35, calm: false },
            { type: 'hunter', xOffset: -420, z: -25 }
          ]
        }
      ]
    },
    {
      id: 3,
      title: "STAGE 3: FESSENDEN'S BIO-LAB",
      subtitle: 'UNDERGROUND BUNKER - GENETIC DINOSAUR MUTATION CORE',
      music: 'stage3',
      length: 3600,
      theme: 'bio_lab',
      startWithCadillac: false,
      props: [
        { x: 460, z: -25, type: 'crate', drop: 'm16' },
        { x: 960, z: 30, type: 'barrel', drop: 'bbq_ribs' },
        { x: 1480, z: -20, type: 'crate', drop: 'bazooka' },
        { x: 1980, z: 25, type: 'barrel', drop: 'diamond' },
        { x: 2520, z: -30, type: 'crate', drop: 'dino_steak' },
        { x: 3080, z: 25, type: 'barrel', drop: 'shotgun' },
        { x: 3220, z: -25, type: 'crate', drop: 'dino_steak' }
      ],
      waves: [
        {
          triggerX: 320,
          lockCamera: true,
          spawns: [
            { type: 'knifeguy', xOffset: 460, z: -25 },
            { type: 'knifeguy', xOffset: -420, z: 25 },
            { type: 'hunter', xOffset: 520, z: 10 },
            { type: 'dino_raptor', xOffset: 580, z: -10, calm: false }
          ]
        },
        {
          triggerX: 1040,
          lockCamera: true,
          spawns: [
            { type: 'fatguy', xOffset: 480, z: -20 },
            { type: 'fatguy', xOffset: -440, z: 20 },
            { type: 'dino_triceratops', xOffset: 560, z: 0, calm: false },
            { type: 'hunter', xOffset: 520, z: 35 }
          ]
        },
        {
          triggerX: 1840,
          lockCamera: true,
          spawns: [
            { type: 'dino_raptor', xOffset: 480, z: -30, calm: false },
            { type: 'dino_raptor', xOffset: -440, z: 30, calm: false },
            { type: 'dino_pteranodon', xOffset: 540, z: 0 },
            { type: 'hunter', xOffset: 500, z: -15 },
            { type: 'fatguy', xOffset: 550, z: 25 }
          ]
        },
        {
          triggerX: 2540,
          lockCamera: true,
          spawns: [
            { type: 'fatguy', xOffset: 460, z: -25 },
            { type: 'knifeguy', xOffset: 500, z: 25 },
            { type: 'hunter', xOffset: -420, z: -15 },
            { type: 'dino_triceratops', xOffset: 570, z: 15, calm: false }
          ]
        },
        {
          triggerX: 3240,
          lockCamera: true,
          isBossWave: true,
          bossId: 'fessenden',
          spawns: [
            { type: 'boss', bossId: 'fessenden', xOffset: 460, z: 0 },
            { type: 'dino_raptor', xOffset: 540, z: -35, calm: false },
            { type: 'dino_raptor', xOffset: -440, z: 35, calm: false }
          ]
        }
      ]
    }
  ]
};
