/**
 * AURA MOTORS - Enterprise Inventory & Dealership Registry
 * Manages 20-30 Demo Showroom Vehicles across 4 prestige showroom zones,
 * Exhibition Bay mappings (Bays 1 - 30), VIP Client Inquiries, and Business Telemetry.
 */

// Showroom Exhibition Bay Floor Coordinates (Multi-Wing Pavilion: 110m x 55m)
export const SHOWROOM_BAYS = [
  // Wing A: Hypercar Rotunda (Bays 1 - 6)
  { bay: 1, zone: 'Hypercar Rotunda', x: -1.8, z: 0.0, rotY: Math.PI - 0.42, featured: true, name: 'Centerpiece Turntable' },
  { bay: 2, zone: 'Hypercar Rotunda', x: -14.0, z: 4.0, rotY: Math.PI - 0.25, featured: true, name: 'Rotunda West 1' },
  { bay: 3, zone: 'Hypercar Rotunda', x: -14.0, z: -4.0, rotY: Math.PI + 0.25, featured: true, name: 'Rotunda West 2' },
  { bay: 4, zone: 'Hypercar Rotunda', x: 10.0, z: 4.0, rotY: Math.PI - 0.35, featured: true, name: 'Rotunda East 1' },
  { bay: 5, zone: 'Hypercar Rotunda', x: 10.0, z: -4.0, rotY: Math.PI + 0.35, featured: true, name: 'Rotunda East 2' },
  { bay: 6, zone: 'Hypercar Rotunda', x: -2.0, z: -10.0, rotY: Math.PI, featured: true, name: 'Rotunda North Prime' },

  // Wing B: Grand Tourer & Electric Boulevard (Bays 7 - 14)
  { bay: 7, zone: 'GT Boulevard', x: -26.0, z: 16.0, rotY: -Math.PI / 2, featured: false, name: 'Boulevard South 1' },
  { bay: 8, zone: 'GT Boulevard', x: -26.0, z: 8.0, rotY: -Math.PI / 2, featured: false, name: 'Boulevard South 2' },
  { bay: 9, zone: 'GT Boulevard', x: -26.0, z: 0.0, rotY: -Math.PI / 2, featured: false, name: 'Boulevard South 3' },
  { bay: 10, zone: 'GT Boulevard', x: -26.0, z: -8.0, rotY: -Math.PI / 2, featured: false, name: 'Boulevard South 4' },
  { bay: 11, zone: 'GT Boulevard', x: -36.0, z: 16.0, rotY: Math.PI / 2, featured: false, name: 'Boulevard North 1' },
  { bay: 12, zone: 'GT Boulevard', x: -36.0, z: 8.0, rotY: Math.PI / 2, featured: false, name: 'Boulevard North 2' },
  { bay: 13, zone: 'GT Boulevard', x: -36.0, z: 0.0, rotY: Math.PI / 2, featured: false, name: 'Boulevard North 3' },
  { bay: 14, zone: 'GT Boulevard', x: -36.0, z: -8.0, rotY: Math.PI / 2, featured: false, name: 'Boulevard North 4' },

  // Wing C: Cyber SUV & Performance Wing (Bays 15 - 22)
  { bay: 15, zone: 'SUV Pavilion', x: 24.0, z: 16.0, rotY: -Math.PI / 2, featured: false, name: 'SUV Boulevard 1' },
  { bay: 16, zone: 'SUV Pavilion', x: 24.0, z: 8.0, rotY: -Math.PI / 2, featured: false, name: 'SUV Boulevard 2' },
  { bay: 17, zone: 'SUV Pavilion', x: 24.0, z: 0.0, rotY: -Math.PI / 2, featured: false, name: 'SUV Boulevard 3' },
  { bay: 18, zone: 'SUV Pavilion', x: 24.0, z: -8.0, rotY: -Math.PI / 2, featured: false, name: 'SUV Boulevard 4' },
  { bay: 19, zone: 'SUV Pavilion', x: 34.0, z: 16.0, rotY: Math.PI / 2, featured: false, name: 'SUV East 1' },
  { bay: 20, zone: 'SUV Pavilion', x: 34.0, z: 8.0, rotY: Math.PI / 2, featured: false, name: 'SUV East 2' },
  { bay: 21, zone: 'SUV Pavilion', x: 34.0, z: 0.0, rotY: Math.PI / 2, featured: false, name: 'SUV East 3' },
  { bay: 22, zone: 'SUV Pavilion', x: 34.0, z: -8.0, rotY: Math.PI / 2, featured: false, name: 'SUV East 4' },

  // Wing D: Heritage & Concept Atelier (Bays 23 - 30)
  { bay: 23, zone: 'Concept Atelier', x: -16.0, z: -22.0, rotY: Math.PI, featured: true, name: 'Concept Pod 1' },
  { bay: 24, zone: 'Concept Atelier', x: -8.0, z: -22.0, rotY: Math.PI, featured: true, name: 'Concept Pod 2' },
  { bay: 25, zone: 'Concept Atelier', x: 0.0, z: -22.0, rotY: Math.PI, featured: true, name: 'Concept Pod 3' },
  { bay: 26, zone: 'Concept Atelier', x: 8.0, z: -22.0, rotY: Math.PI, featured: true, name: 'Concept Pod 4' },
  { bay: 27, zone: 'Concept Atelier', x: 16.0, z: -22.0, rotY: Math.PI, featured: false, name: 'Open Bay 27' },
  { bay: 28, zone: 'Concept Atelier', x: -24.0, z: -22.0, rotY: Math.PI, featured: false, name: 'Open Bay 28' },
  { bay: 29, zone: 'Executive Portico', x: 26.0, z: -22.0, rotY: Math.PI, featured: false, name: 'Open Bay 29' },
  { bay: 30, zone: 'Executive Portico', x: -44.0, z: 4.0, rotY: 0.0, featured: false, name: 'Open Bay 30' },
];

const INITIAL_CARS = [
  // 1-6 Hypercar Rotunda
  {
    id: 'apex-gt-01',
    name: 'AURA APEX GT',
    series: 'Apex Series',
    year: 2026,
    category: 'Hypercar',
    price: 284500,
    hp: 1050,
    topSpeed: 218,
    zeroToSixty: 2.1,
    powertrain: '4.0L Twin-Turbo V8 + Quad Electric Motors',
    colorName: 'Liquid Quicksilver',
    colorHex: 0xd8dde4,
    finish: 'metallic',
    bay: 1,
    status: 'Floor Display',
    inStock: 3,
    views: 4820,
    description: 'Flagship mid-engine hybrid aerodynamic beast with carbon monocoque chassis.'
  },
  {
    id: 'apex-spyder-02',
    name: 'AURA APEX SPYDER',
    series: 'Apex Series',
    year: 2026,
    category: 'Hypercar',
    price: 310000,
    hp: 1050,
    topSpeed: 215,
    zeroToSixty: 2.2,
    powertrain: '4.0L Twin-Turbo V8 Hybrid',
    colorName: 'Monaco Rosso',
    colorHex: 0xb31226,
    finish: 'gloss',
    bay: 2,
    status: 'Floor Display',
    inStock: 2,
    views: 3140,
    description: 'Open-cockpit roadster with dihedral doors and active carbon aero.'
  },
  {
    id: 'apex-track-03',
    name: 'AURA APEX TRACK CARBON',
    series: 'Apex Series',
    year: 2026,
    category: 'Hypercar',
    price: 345000,
    hp: 1120,
    topSpeed: 224,
    zeroToSixty: 2.0,
    powertrain: '4.0L Twin-Turbo Flat-Plane V8 Track-Tuned',
    colorName: 'Obsidian Carbon',
    colorHex: 0x121417,
    finish: 'matte',
    bay: 3,
    status: 'Allocated',
    inStock: 1,
    views: 3950,
    description: 'Lightweight track-focused edition producing 980 kg downforce.'
  },
  {
    id: 'apex-lemans-04',
    name: 'AURA APEX LE MANS',
    series: 'Apex Series',
    year: 2026,
    category: 'Hypercar',
    price: 360000,
    hp: 1080,
    topSpeed: 220,
    zeroToSixty: 2.1,
    powertrain: 'Hybrid LMP1-Derived V8',
    colorName: 'Riviera Cyan',
    colorHex: 0x00b4d8,
    finish: 'metallic',
    bay: 4,
    status: 'Floor Display',
    inStock: 1,
    views: 2890,
    description: 'Homologated endurance racer with roof air intake scoop.'
  },
  {
    id: 'apex-sv-05',
    name: 'AURA APEX SV GOLD',
    series: 'Apex Series',
    year: 2026,
    category: 'Hypercar',
    price: 390000,
    hp: 1150,
    topSpeed: 226,
    zeroToSixty: 1.98,
    powertrain: 'Bespoke Quad-Motor AWD Electric',
    colorName: 'Solaris Gold',
    colorHex: 0xe0a944,
    finish: 'metallic',
    bay: 5,
    status: 'VIP Reserved',
    inStock: 1,
    views: 4200,
    description: 'Ultra-exclusive 1-of-10 collector edition finished in Solaris 24k leaf.'
  },
  {
    id: 'apex-proto-06',
    name: 'AURA PROTO ZERO',
    series: 'Apex Series',
    year: 2027,
    category: 'Concept',
    price: 450000,
    hp: 1200,
    topSpeed: 232,
    zeroToSixty: 1.9,
    powertrain: 'Solid-State Battery Dual Inverter',
    colorName: 'Stealth Amethyst',
    colorHex: 0x5e17eb,
    finish: 'pearlescent',
    bay: 6,
    status: 'Prototype',
    inStock: 1,
    views: 5120,
    description: 'Advanced development prototype exploring active ground-effect venturi channels.'
  },

  // 7-14 Grand Tourer & Electric Boulevard
  {
    id: 'veloce-egt-07',
    name: 'AURA VELOCE E-GT',
    series: 'Veloce Series',
    year: 2026,
    category: 'Grand Tourer',
    price: 198000,
    hp: 890,
    topSpeed: 205,
    zeroToSixty: 2.6,
    powertrain: 'Dual Permanent-Magnet Synchronous Motors',
    colorName: 'Deep Riviera Sapphire',
    colorHex: 0x144576,
    finish: 'metallic',
    bay: 7,
    status: 'Floor Display',
    inStock: 4,
    views: 2650,
    description: 'Ultra-refined 2+2 fastback grand tourer with 520 miles range.'
  },
  {
    id: 'veloce-sport-08',
    name: 'AURA VELOCE SPORTBACK',
    series: 'Veloce Series',
    year: 2026,
    category: 'Grand Tourer',
    price: 185000,
    hp: 820,
    topSpeed: 200,
    zeroToSixty: 2.8,
    powertrain: 'Dual Motor AWD 800V Architecture',
    colorName: 'Nardo Chalk',
    colorHex: 0x9aa0a6,
    finish: 'gloss',
    bay: 8,
    status: 'Floor Display',
    inStock: 5,
    views: 2100,
    description: 'Everyday high-performance coupe silhouette with panoramic electrochromic roof.'
  },
  {
    id: 'veloce-exec-09',
    name: 'AURA VELOCE SEDAN',
    series: 'Veloce Series',
    year: 2026,
    category: 'Executive',
    price: 175000,
    hp: 760,
    topSpeed: 195,
    zeroToSixty: 3.0,
    powertrain: 'Electric Dual-Motor Executive Spec',
    colorName: 'British Racing Emerald',
    colorHex: 0x1b4332,
    finish: 'metallic',
    bay: 9,
    status: 'Floor Display',
    inStock: 6,
    views: 1840,
    description: 'Chauffeured executive sports sedan with rear reclining executive lounge seats.'
  },
  {
    id: 'veloce-v12-10',
    name: 'AURA VELOCE HERITAGE V12',
    series: 'Veloce Series',
    year: 2026,
    category: 'Grand Tourer',
    price: 220000,
    hp: 850,
    topSpeed: 210,
    zeroToSixty: 2.7,
    powertrain: 'Naturally Aspirated 6.5L V12',
    colorName: 'Liquid Quicksilver',
    colorHex: 0xd8dde4,
    finish: 'metallic',
    bay: 10,
    status: 'Floor Display',
    inStock: 2,
    views: 3410,
    description: 'Tribute to classic analog super-touring with vocal free-breathing V12.'
  },
  {
    id: 'veloce-black-11',
    name: 'AURA VELOCE BLACK BADGE',
    series: 'Veloce Series',
    year: 2026,
    category: 'Grand Tourer',
    price: 240000,
    hp: 910,
    topSpeed: 208,
    zeroToSixty: 2.5,
    powertrain: 'High-Output Dual Motor with Torque Vectoring',
    colorName: 'Obsidian Stealth',
    colorHex: 0x121417,
    finish: 'matte',
    bay: 11,
    status: 'Floor Display',
    inStock: 2,
    views: 2980,
    description: 'Darkened stealth aesthetic with blackened chrome and bespoke dark carbon trim.'
  },
  {
    id: 'veloce-cabrio-12',
    name: 'AURA VELOCE CABRIOLET',
    series: 'Veloce Series',
    year: 2026,
    category: 'Grand Tourer',
    price: 205000,
    hp: 820,
    topSpeed: 200,
    zeroToSixty: 2.8,
    powertrain: 'Electric Dual-Motor AWD',
    colorName: 'Champagne Metallic',
    colorHex: 0xdeb887,
    finish: 'metallic',
    bay: 12,
    status: 'Floor Display',
    inStock: 3,
    views: 2250,
    description: 'Open-air grand tourer with acoustic multi-layer soft top deployable in 11s.'
  },
  {
    id: 'veloce-estate-13',
    name: 'AURA VELOCE TOURING ESTATE',
    series: 'Veloce Series',
    year: 2026,
    category: 'Grand Tourer',
    price: 168000,
    hp: 750,
    topSpeed: 190,
    zeroToSixty: 3.1,
    powertrain: 'Electric AWD Long Range',
    colorName: 'Alpine White',
    colorHex: 0xf4f7fa,
    finish: 'gloss',
    bay: 13,
    status: 'Floor Display',
    inStock: 4,
    views: 1620,
    description: 'High-utility performance shooting brake with expansive cargo volume.'
  },
  {
    id: 'veloce-sline-14',
    name: 'AURA VELOCE S-LINE',
    series: 'Veloce Series',
    year: 2026,
    category: 'Grand Tourer',
    price: 192000,
    hp: 840,
    topSpeed: 202,
    zeroToSixty: 2.7,
    powertrain: 'Dual Motor Performance Plus',
    colorName: 'Monaco Rosso',
    colorHex: 0xb31226,
    finish: 'gloss',
    bay: 14,
    status: 'Floor Display',
    inStock: 3,
    views: 1940,
    description: 'Dynamic sports suspension, carbon ceramic brakes, and sport bucket interior.'
  },

  // 15-22 Cyber SUV & Performance Wing
  {
    id: 'stratos-x-15',
    name: 'AURA STRATOS X',
    series: 'Stratos Series',
    year: 2026,
    category: 'Luxury SUV',
    price: 225000,
    hp: 780,
    topSpeed: 190,
    zeroToSixty: 3.1,
    powertrain: 'Tri-Motor Torque-Vectoring AWD',
    colorName: 'Titanium Slate',
    colorHex: 0x4a5568,
    finish: 'metallic',
    bay: 15,
    status: 'Floor Display',
    inStock: 5,
    views: 3100,
    description: 'Cybernetic luxury performance crossover with adaptive triple-chamber air suspension.'
  },
  {
    id: 'stratos-safari-16',
    name: 'AURA STRATOS SAFARI',
    series: 'Stratos Series',
    year: 2026,
    category: 'Luxury SUV',
    price: 240000,
    hp: 780,
    topSpeed: 185,
    zeroToSixty: 3.3,
    powertrain: 'Tri-Motor All-Terrain AWD',
    colorName: 'Desert Sand Dune',
    colorHex: 0xd4a373,
    finish: 'matte',
    bay: 16,
    status: 'Floor Display',
    inStock: 2,
    views: 2450,
    description: 'Reinforced underbody titanium skid plates, 35-inch all-terrain tires.'
  },
  {
    id: 'stratos-black-17',
    name: 'AURA STRATOS BLACKLINE',
    series: 'Stratos Series',
    year: 2026,
    category: 'Luxury SUV',
    price: 255000,
    hp: 820,
    topSpeed: 195,
    zeroToSixty: 3.0,
    powertrain: 'Quad-Motor 800V Performance',
    colorName: 'Jet Obsidian',
    colorHex: 0x121417,
    finish: 'gloss',
    bay: 17,
    status: 'Floor Display',
    inStock: 3,
    views: 2780,
    description: 'Monochromatic midnight styling with 23-inch forged diamond-cut wheels.'
  },
  {
    id: 'stratos-ev-18',
    name: 'AURA STRATOS EV PERFORMANCE',
    series: 'Stratos Series',
    year: 2026,
    category: 'Luxury SUV',
    price: 265000,
    hp: 890,
    topSpeed: 198,
    zeroToSixty: 2.8,
    powertrain: 'Tri-Motor EV High Output',
    colorName: 'Electric Cyan',
    colorHex: 0x00e5ff,
    finish: 'metallic',
    bay: 18,
    status: 'Floor Display',
    inStock: 2,
    views: 2990,
    description: 'Sub-3-second hyper-SUV capable of dynamic active roll stabilization.'
  },
  {
    id: 'stratos-trophy-19',
    name: 'AURA STRATOS TROPHY',
    series: 'Stratos Series',
    year: 2026,
    category: 'Luxury SUV',
    price: 280000,
    hp: 920,
    topSpeed: 202,
    zeroToSixty: 2.7,
    powertrain: 'Race-Derived Hybrid Powertrain',
    colorName: 'Monaco Rosso',
    colorHex: 0xb31226,
    finish: 'metallic',
    bay: 19,
    status: 'Floor Display',
    inStock: 1,
    views: 2600,
    description: 'Dakar rally inspired aerodynamics with roof-mounted LED laser spotlights.'
  },
  {
    id: 'stratos-lwb-20',
    name: 'AURA STRATOS LWB VIP',
    series: 'Stratos Series',
    year: 2026,
    category: 'Luxury SUV',
    price: 295000,
    hp: 750,
    topSpeed: 188,
    zeroToSixty: 3.4,
    powertrain: 'Ultra-Smooth Dual Motor Architecture',
    colorName: 'Midnight Amethyst',
    colorHex: 0x3d2645,
    finish: 'pearlescent',
    bay: 20,
    status: 'Allocated',
    inStock: 1,
    views: 2210,
    description: 'Extended wheelbase sanctuary featuring heated massage ottoman seats and champagne chiller.'
  },
  {
    id: 'stratos-stealth-21',
    name: 'AURA STRATOS STEALTH',
    series: 'Stratos Series',
    year: 2026,
    category: 'Luxury SUV',
    price: 310000,
    hp: 850,
    topSpeed: 195,
    zeroToSixty: 2.9,
    powertrain: 'High-Output EV Quad-Motor',
    colorName: 'Carbon Slate',
    colorHex: 0x2b2d42,
    finish: 'matte',
    bay: 21,
    status: 'Floor Display',
    inStock: 2,
    views: 1870,
    description: 'Full exposed carbon fiber body panels with acoustic privacy glass.'
  },
  {
    id: 'stratos-overland-22',
    name: 'AURA STRATOS OVERLAND',
    series: 'Stratos Series',
    year: 2026,
    category: 'Luxury SUV',
    price: 250000,
    hp: 760,
    topSpeed: 180,
    zeroToSixty: 3.4,
    powertrain: 'Off-Grid Solar Assisted Electric AWD',
    colorName: 'Forest Emerald',
    colorHex: 0x224a1e,
    finish: 'gloss',
    bay: 22,
    status: 'Floor Display',
    inStock: 3,
    views: 2120,
    description: 'Integrated solar roof canopy, vehicle-to-load 240V power station.'
  },

  // 23-26 Concept & Bespoke Atelier Showcase
  {
    id: 'vision-speedster-23',
    name: 'AURA VISION SPEEDSTER',
    series: 'Concept Atelier',
    year: 2030,
    category: 'Concept',
    price: 1200000,
    hp: 1400,
    topSpeed: 245,
    zeroToSixty: 1.8,
    powertrain: 'Quantum Flux Axial Motors',
    colorName: 'Liquid Chrome Mirror',
    colorHex: 0xe5e7eb,
    finish: 'gloss',
    bay: 23,
    status: 'Collector Showcase',
    inStock: 1,
    views: 6400,
    description: 'Visionary open-top barchetta without windscreen exploring pure aerodynamic flow.'
  },
  {
    id: 'concept-r-24',
    name: 'AURA MONOCOQUE CONCEPT R',
    series: 'Concept Atelier',
    year: 2028,
    category: 'Concept',
    price: 850000,
    hp: 1300,
    topSpeed: 238,
    zeroToSixty: 1.85,
    powertrain: 'Twin-Inverter Hyper-Electric',
    colorName: 'Raw Carbon Weave',
    colorHex: 0x181a1f,
    finish: 'matte',
    bay: 24,
    status: 'Prototype',
    inStock: 1,
    views: 4780,
    description: 'Ultra-lightweight structural monocoque with zero traditional subframes (990 kg total).'
  },
  {
    id: 'daytona-gt-25',
    name: 'AURA DAYTONA TRIBUTE GT',
    series: 'Heritage Atelier',
    year: 2026,
    category: 'Heritage',
    price: 650000,
    hp: 950,
    topSpeed: 216,
    zeroToSixty: 2.4,
    powertrain: 'Bi-Turbo V8 with Manual Gated Sequential',
    colorName: 'Vintage Racing Blue',
    colorHex: 0x1d3557,
    finish: 'gloss',
    bay: 25,
    status: 'Allocated',
    inStock: 1,
    views: 3820,
    description: 'Hand-formed aluminum bodywork celebrating 1960s endurance racing glory.'
  },
  {
    id: 'hyper-ev-26',
    name: 'AURA HYPER-EV ROADSTER',
    series: 'Concept Atelier',
    year: 2027,
    category: 'Hypercar',
    price: 420000,
    hp: 1100,
    topSpeed: 225,
    zeroToSixty: 2.05,
    powertrain: 'Tri-Motor 900V Silicon-Carbide',
    colorName: 'Arctic Pearl White',
    colorHex: 0xf8fafc,
    finish: 'pearlescent',
    bay: 26,
    status: 'Pre-Order',
    inStock: 2,
    views: 3950,
    description: 'Next-generation electric roadster with targa glass roof and active air curtains.'
  }
];

class InventoryManager {
  constructor() {
    this.storageKey = 'AURA_SHOWROOM_FLEET_v1';
    this.inquiriesKey = 'AURA_CLIENT_INQUIRIES_v1';
    this.cars = this.loadCars();
    this.inquiries = this.loadInquiries();
  }

  loadCars() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 20) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Using default car fleet:', e);
    }
    return [...INITIAL_CARS];
  }

  saveCars() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.cars));
    } catch (e) {
      console.error('Failed to save fleet:', e);
    }
  }

  getCars() {
    return this.cars;
  }

  getCarById(id) {
    return this.cars.find(c => c.id === id);
  }

  getCarByBay(bayNumber) {
    return this.cars.find(c => c.bay === bayNumber);
  }

  getNextOpenBay() {
    const occupied = new Set(this.cars.map(c => c.bay));
    for (let b = 1; b <= 30; b++) {
      if (!occupied.has(b)) return b;
    }
    return 30; // Fallback to last bay
  }

  /**
   * Adds a newly generated or registered vehicle to the showroom fleet
   */
  addCar(carData) {
    const bay = carData.bay || this.getNextOpenBay();
    const newCar = {
      id: carData.id || `custom-${Date.now()}`,
      name: (carData.name || 'AURA CUSTOM BESPOKE').toUpperCase(),
      series: carData.series || 'Bespoke Atelier',
      year: parseInt(carData.year) || 2026,
      category: carData.category || 'Hypercar',
      price: parseInt(carData.price) || 295000,
      hp: parseInt(carData.hp) || 980,
      topSpeed: parseInt(carData.topSpeed) || 215,
      zeroToSixty: parseFloat(carData.zeroToSixty) || 2.3,
      powertrain: carData.powertrain || '4.0L Twin-Turbo Hybrid V8',
      colorName: carData.colorName || 'Liquid Quicksilver',
      colorHex: typeof carData.colorHex === 'number' ? carData.colorHex : 0xd8dde4,
      finish: carData.finish || 'metallic',
      bay: bay,
      status: 'Floor Display',
      inStock: 1,
      views: 120,
      description: carData.description || 'Synthesized from multi-angle photography into 3D showroom digital twin.',
      isAiGenerated: true,
      photos: carData.photos || null,
    };

    // Remove any previous car occupying this bay
    this.cars = this.cars.filter(c => c.bay !== bay);
    this.cars.push(newCar);
    this.saveCars();
    return newCar;
  }

  updateCar(id, updates) {
    const idx = this.cars.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.cars[idx] = { ...this.cars[idx], ...updates };
      this.saveCars();
      return this.cars[idx];
    }
    return null;
  }

  deleteCar(id) {
    this.cars = this.cars.filter(c => c.id !== id);
    this.saveCars();
  }

  // =========================================================================
  // VIP Client Inquiries CRM
  // =========================================================================

  loadInquiries() {
    try {
      const saved = localStorage.getItem(this.inquiriesKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    // Demo inquiries
    return [
      {
        id: 'inq-101',
        name: 'Lord Alistair Sterling',
        phone: '9845012345',
        email: 'sterling@mayfairprivate.co.uk',
        date: '2026-11-14',
        carId: 'apex-gt-01',
        carName: 'AURA APEX GT',
        message: 'Requesting carbon track pack with liquid silver exterior.',
        status: 'Deposit Received',
        deposit: '$5,000',
        timestamp: '2 hours ago'
      },
      {
        id: 'inq-102',
        name: 'Dr. Elena Rostova',
        phone: '9988776655',
        email: 'elena.rostova@zurichbiotech.ch',
        date: '2026-11-20',
        carId: 'veloce-egt-07',
        carName: 'AURA VELOCE E-GT',
        message: 'Interested in bespoke sapphire blue executive delivery at Geneva.',
        status: 'Concierge Review',
        deposit: 'Pending',
        timestamp: '5 hours ago'
      },
      {
        id: 'inq-103',
        name: 'Vikramaditya Singhania',
        phone: '9820011223',
        email: 'vikram@singhaniagroup.com',
        date: '2026-11-08',
        carId: 'stratos-x-15',
        carName: 'AURA STRATOS X',
        message: 'Schedule private track day session at BIC Buddh Circuit.',
        status: 'Allocated',
        deposit: '$10,000',
        timestamp: '1 day ago'
      }
    ];
  }

  addInquiry(inq) {
    const car = this.getCarById(inq.carId) || { name: 'AURA APEX GT' };
    const newInq = {
      id: `inq-${Date.now()}`,
      name: inq.name,
      phone: inq.phone,
      email: inq.email,
      date: inq.date,
      carId: inq.carId,
      carName: car.name,
      message: inq.message || 'General VIP showroom inquiry.',
      status: 'Deposit Received',
      deposit: '$5,000',
      timestamp: 'Just now'
    };
    this.inquiries.unshift(newInq);
    try {
      localStorage.setItem(this.inquiriesKey, JSON.stringify(this.inquiries));
    } catch (e) {}
    return newInq;
  }

  getInquiries() {
    return this.inquiries;
  }

  // =========================================================================
  // Executive Business Analytics
  // =========================================================================

  getAnalytics() {
    const totalCars = this.cars.length;
    const totalValuation = this.cars.reduce((sum, c) => sum + (c.price || 0), 0);
    const totalViews = this.cars.reduce((sum, c) => sum + (c.views || 0), 0);
    const totalInquiries = this.inquiries.length;
    const occupiedBays = new Set(this.cars.map(c => c.bay)).size;

    return {
      totalCars,
      totalValuation,
      totalViews,
      totalInquiries,
      occupiedBays,
      totalBays: 30,
      occupancyRate: ((occupiedBays / 30) * 100).toFixed(0) + '%',
      avgCarPrice: Math.round(totalValuation / totalCars),
      mostPopularCar: [...this.cars].sort((a, b) => (b.views || 0) - (a.views || 0))[0],
    };
  }
}

export const inventory = new InventoryManager();
