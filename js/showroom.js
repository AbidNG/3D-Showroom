/**
 * AURA MOTORS - Grand Multi-Wing Dealership Pavilion (110m x 55m)
 * Features 30 Exhibition Bays across 4 prestige zones:
 * - Zone 1: Hypercar Rotunda (Bays 1 - 6)
 * - Zone 2: Grand Tourer & EV Boulevard (Bays 7 - 14)
 * - Zone 3: Cyber SUV Pavilion (Bays 15 - 22)
 * - Zone 4: Concept & Bespoke Atelier (Bays 23 - 30)
 * With real-time Optical Planar Floor Reflector, runway lighting, and bay pedestals.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SHOWROOM_BAYS } from './inventory-data.js';

export class Showroom {
  constructor(scene) {
    this.scene = scene;
    this.lights = {};
    this.materials = {};
    this.currentLightingMode = 'daylight';
    this.turntableMesh = null;
    this.turntableGroup = null;
    this.isTurntableSpinning = false;
    this.turntableSpeed = 0.005;

    this.gltfLoader = new GLTFLoader();

    this.initMaterials();
    this.buildArchitecture();
    this.buildLighting();
  }

  initMaterials() {
    // 1. High-End Luxury Architectural Ultra-Matte Slate Floor (Zero White Glare / Zero Specular Reflection)
    this.materials.floor = new THREE.MeshStandardMaterial({
      color: 0x12151c,
      roughness: 0.96, // Diffuse matte scattering eliminates all white specular reflection
      metalness: 0.0,  // Pure dielectric: zero mirror reflection
    });

    this.materials.whiteConcrete = new THREE.MeshStandardMaterial({
      color: 0xc8cdd6,
      roughness: 0.7,
      metalness: 0.05,
    });

    this.materials.ceiling = new THREE.MeshStandardMaterial({
      color: 0x181c24,
      roughness: 0.8,
      metalness: 0.1,
    });

    this.materials.mullion = new THREE.MeshStandardMaterial({
      color: 0x101318,
      roughness: 0.35,
      metalness: 0.85,
    });

    this.materials.brushedMetal = new THREE.MeshStandardMaterial({
      color: 0x8a93a0,
      roughness: 0.25,
      metalness: 0.9,
    });

    this.materials.curtainGlass = new THREE.MeshPhysicalMaterial({
      color: 0x161e2b,
      transparent: true,
      opacity: 0.25,
      roughness: 0.22,
      transmission: 0.88,
      ior: 1.35,
      reflectivity: 0.1,
      depthWrite: false,
    });

    this.materials.plinth = new THREE.MeshStandardMaterial({
      color: 0x131720,
      roughness: 0.92,
      metalness: 0.02,
    });

    this.materials.ledCyan = new THREE.MeshStandardMaterial({
      color: 0x00c8e0,
      emissive: 0x0090aa,
      emissiveIntensity: 0.35,
      roughness: 0.5,
    });

    this.materials.ledGold = new THREE.MeshStandardMaterial({
      color: 0xd4a017,
      emissive: 0xaa7810,
      emissiveIntensity: 0.35,
      roughness: 0.5,
    });

    this.materials.ledWarm = new THREE.MeshStandardMaterial({
      color: 0xf0e6d6,
      emissive: 0xc8b89e,
      emissiveIntensity: 0.25,
      roughness: 0.5,
    });
  }

  buildArchitecture() {
    // Grand Mega Pavilion Dimensions: 110m length (Z: -35 to +35), 90m width (X: -48 to +42), 8.5m height
    const roomWidth = 90;
    const roomLength = 70;
    const roomHeight = 8.5;

    // 1. High-End Dark Luxury Architectural Matte-Satin Floor (Zero White Glare / Reflection)
    const floorGeo = new THREE.PlaneGeometry(roomWidth, roomLength);
    const floorMesh = new THREE.Mesh(floorGeo, this.materials.floor);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(-3, 0, 0);
    floorMesh.receiveShadow = true;
    this.scene.add(floorMesh);

    // 2. High Architectural Dark Ceiling
    const ceilingGeo = new THREE.PlaneGeometry(roomWidth, roomLength);
    const ceiling = new THREE.Mesh(ceilingGeo, this.materials.ceiling);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(-3, roomHeight, 0);
    this.scene.add(ceiling);

    // Ceiling linear lighting troughs & downlights
    this.buildCeilingDetails(roomWidth, roomLength, roomHeight);

    // 3. Panoramic Glass Curtain Wall on East Side (X = 42)
    this.buildGlassCurtainWall(roomLength, roomHeight, 42.0);

    // 4. Exterior Campus Landscape beyond the Glass
    this.buildOutdoorEnvironment();

    // 5. Back Feature Wall (Z = -35)
    this.buildBackFeatureWall(roomWidth, roomHeight);

    // 6. Architectural Cylindrical Columns Rows
    this.buildColumns(roomHeight);

    // 7. VIP Glass Lounge Seating
    this.buildVIPLounge();

    // 8. 30 Exhibition Bays with Illuminated Runway Markings & Pedestals
    this.buildShowroomBays();

    // 9. Centerpiece Turntable Plinth (Bay 1)
    this.buildTurntable();
  }

  buildCeilingDetails(width, length, height) {
    const troughGeo = new THREE.BoxGeometry(0.4, 0.15, length - 6);
    const troughMat = new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 0.6 });

    // 5 Major Lighting Troughs across the grand showroom
    const xPositions = [-36, -20, -1.8, 18, 34];
    xPositions.forEach(x => {
      const trough = new THREE.Mesh(troughGeo, troughMat);
      trough.position.set(x, height - 0.08, 0);
      this.scene.add(trough);

      const stripGeo = new THREE.BoxGeometry(0.15, 0.04, length - 8);
      const strip = new THREE.Mesh(stripGeo, this.materials.ledWarm);
      strip.position.set(x, height - 0.12, 0);
      this.scene.add(strip);
    });

    // Clean architectural recessed downlight fixtures
    const downlightGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.04, 16);
    const downlightMat = new THREE.MeshStandardMaterial({ color: 0x141820, metalness: 0.8, roughness: 0.3 });
    const emitterGeo = new THREE.CircleGeometry(0.12, 16);
    const emitterMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      emissive: 0x94a3b8,
      emissiveIntensity: 0.15,
      roughness: 0.6,
    });

    for (let z = -28; z <= 28; z += 9.0) {
      for (let x = -38; x <= 34; x += 9.0) {
        const rim = new THREE.Mesh(downlightGeo, downlightMat);
        rim.position.set(x, height - 0.02, z);
        this.scene.add(rim);

        const emitter = new THREE.Mesh(emitterGeo, emitterMat);
        emitter.rotation.x = Math.PI / 2;
        emitter.position.set(x, height - 0.035, z);
        this.scene.add(emitter);
      }
    }
  }

  buildBackFeatureWall(width, height) {
    const wallGroup = new THREE.Group();

    const backWallGeo = new THREE.BoxGeometry(width, height, 0.8);
    const backWall = new THREE.Mesh(backWallGeo, this.materials.whiteConcrete);
    backWall.position.set(-3, height / 2, -35.2);
    backWall.receiveShadow = true;
    wallGroup.add(backWall);

    // Central acoustic wood slat feature section
    const slatSectionGeo = new THREE.BoxGeometry(24, height, 0.15);
    const slatMat = new THREE.MeshStandardMaterial({ color: 0x1f232b, roughness: 0.6, metalness: 0.1 });
    const slatSection = new THREE.Mesh(slatSectionGeo, slatMat);
    slatSection.position.set(-1.8, height / 2, -34.7);
    wallGroup.add(slatSection);

    // Framed Blueprint Artwork
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('assets/images/gallery_blueprint.jpg', (artTexture) => {
      artTexture.colorSpace = THREE.SRGBColorSpace;
      const artMat = new THREE.MeshBasicMaterial({ map: artTexture });
      const artGeo = new THREE.PlaneGeometry(8.0, 4.5);
      const artMesh = new THREE.Mesh(artGeo, artMat);
      artMesh.position.set(-1.8, 4.2, -34.5);
      wallGroup.add(artMesh);
    });

    this.scene.add(wallGroup);
  }

  buildGlassCurtainWall(length, height, xPos) {
    const glassGroup = new THREE.Group();

    const glassGeo = new THREE.BoxGeometry(0.08, height, length);
    const glassPane = new THREE.Mesh(glassGeo, this.materials.curtainGlass);
    glassPane.position.set(xPos, height / 2, 0);
    glassGroup.add(glassPane);

    for (let z = -34; z <= 34; z += 3.0) {
      const mullionGeo = new THREE.BoxGeometry(0.2, height, 0.14);
      const mullion = new THREE.Mesh(mullionGeo, this.materials.mullion);
      mullion.position.set(xPos, height / 2, z);
      glassGroup.add(mullion);
    }

    [0.1, 2.2, height - 0.1].forEach(h => {
      const transomGeo = new THREE.BoxGeometry(0.18, 0.14, length);
      const transom = new THREE.Mesh(transomGeo, this.materials.mullion);
      transom.position.set(xPos, h, 0);
      glassGroup.add(transom);
    });

    this.scene.add(glassGroup);
  }

  buildOutdoorEnvironment() {
    const envGroup = new THREE.Group();

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('assets/images/exterior_landscape.jpg', (bgTexture) => {
      bgTexture.colorSpace = THREE.SRGBColorSpace;
      const backdropGeo = new THREE.PlaneGeometry(90, 24);
      const backdropMat = new THREE.MeshBasicMaterial({ map: bgTexture, depthWrite: false });
      const backdrop = new THREE.Mesh(backdropGeo, backdropMat);
      backdrop.position.set(52, 9, 0);
      backdrop.rotation.y = -Math.PI / 2;
      envGroup.add(backdrop);
    });

    const outdoorGroundGeo = new THREE.PlaneGeometry(35, 80);
    const outdoorGroundMat = new THREE.MeshStandardMaterial({ color: 0x7a838d, roughness: 0.8 });
    const outdoorGround = new THREE.Mesh(outdoorGroundGeo, outdoorGroundMat);
    outdoorGround.rotation.x = -Math.PI / 2;
    outdoorGround.position.set(56, -0.05, 0);
    envGroup.add(outdoorGround);

    this.scene.add(envGroup);
  }

  buildColumns(height) {
    const colCoords = [
      { x: -6.2, z: 4.5, hasPlanter: true },
      { x: -6.2, z: -8.0, hasPlanter: false },
      { x: 3.5, z: 12.0, hasPlanter: false },
      { x: -20.0, z: 8.0, hasPlanter: true },
      { x: -20.0, z: -8.0, hasPlanter: false },
      { x: 18.0, z: 8.0, hasPlanter: true },
      { x: 18.0, z: -8.0, hasPlanter: false },
    ];

    colCoords.forEach(pos => {
      const colGroup = new THREE.Group();
      colGroup.position.set(pos.x, 0, pos.z);

      const colGeo = new THREE.CylinderGeometry(0.8, 0.8, height, 48);
      const col = new THREE.Mesh(colGeo, this.materials.whiteConcrete);
      col.position.y = height / 2;
      col.castShadow = true;
      col.receiveShadow = true;
      colGroup.add(col);

      const collarGeo = new THREE.CylinderGeometry(0.88, 0.88, 0.16, 48);
      const collar = new THREE.Mesh(collarGeo, this.materials.brushedMetal);
      collar.position.y = 0.08;
      colGroup.add(collar);

      if (pos.hasPlanter) {
        const potGeo = new THREE.BoxGeometry(0.9, 0.75, 0.9);
        const potMat = new THREE.MeshStandardMaterial({ color: 0x161a22, roughness: 0.35, metalness: 0.3 });
        const pot = new THREE.Mesh(potGeo, potMat);
        pot.position.set(1.5, 0.375, 0);
        colGroup.add(pot);

        const leafMat = new THREE.MeshStandardMaterial({ color: 0x224a1e, roughness: 0.65 });
        const sphereGeo = new THREE.DodecahedronGeometry(0.45, 2);
        const tree = new THREE.Mesh(sphereGeo, leafMat);
        tree.position.set(1.5, 1.8, 0);
        colGroup.add(tree);
      }

      this.scene.add(colGroup);
    });
  }

  buildVIPLounge() {
    const loungeGroup = new THREE.Group();
    loungeGroup.position.set(38.0, 0, -4.0);

    const chairOffsets = [
      { x: 0, z: -3.5, rot: -0.25 },
      { x: -0.5, z: -1.0, rot: -0.15 },
      { x: -0.3, z: 1.8, rot: 0.12 },
      { x: 0.2, z: 4.2, rot: 0.3 },
    ];

    this.gltfLoader.load('assets/models/SheenChair.glb', (gltf) => {
      const baseChair = gltf.scene;
      baseChair.scale.set(1.6, 1.6, 1.6);

      chairOffsets.forEach(cfg => {
        const inst = baseChair.clone();
        inst.position.set(cfg.x, 0, cfg.z);
        inst.rotation.y = cfg.rot;
        loungeGroup.add(inst);
      });
    });

    this.scene.add(loungeGroup);
  }

  /**
   * Builds the 30 Exhibition Bays with illuminated ground pads and pedestals
   */
  buildShowroomBays() {
    const baysGroup = new THREE.Group();

    SHOWROOM_BAYS.forEach(b => {
      if (b.bay === 1) return; // Bay 1 is the main centerpiece turntable

      const padGroup = new THREE.Group();
      padGroup.position.set(b.x, 0, b.z);

      // 1. Dark Exhibition Ground Pad (6m x 3.2m)
      const padGeo = new THREE.BoxGeometry(3.2, 0.02, 5.8);
      const pad = new THREE.Mesh(padGeo, this.materials.plinth);
      pad.position.y = 0.01;
      pad.receiveShadow = true;
      padGroup.add(pad);

      // 2. Perimeter Illuminated LED Accent Runway Line
      const runwayGeo = new THREE.BoxGeometry(3.25, 0.03, 0.06);
      const runwayFront = new THREE.Mesh(runwayGeo, b.featured ? this.materials.ledGold : this.materials.ledCyan);
      runwayFront.position.set(0, 0.015, 2.9);
      padGroup.add(runwayFront);

      const runwayBack = new THREE.Mesh(runwayGeo, b.featured ? this.materials.ledGold : this.materials.ledCyan);
      runwayBack.position.set(0, 0.015, -2.9);
      padGroup.add(runwayBack);

      // 3. Illuminated Bay Monolith Pedestal with Bay Number
      const pedestalGeo = new THREE.BoxGeometry(0.35, 0.75, 0.25);
      const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x12151b, metalness: 0.7, roughness: 0.3 });
      const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
      pedestal.position.set(1.9, 0.375, 2.6);
      padGroup.add(pedestal);

      // Glowing Bay Badge
      const badgeGeo = new THREE.PlaneGeometry(0.24, 0.12);
      const badgeCanvas = document.createElement('canvas');
      badgeCanvas.width = 128;
      badgeCanvas.height = 64;
      const bCtx = badgeCanvas.getContext('2d');
      bCtx.fillStyle = '#0a0d14';
      bCtx.fillRect(0, 0, 128, 64);
      bCtx.fillStyle = b.featured ? '#ffd700' : '#00e5ff';
      bCtx.font = 'bold 24px monospace';
      bCtx.textAlign = 'center';
      bCtx.fillText(`BAY ${String(b.bay).padStart(2, '0')}`, 64, 40);

      const badgeTexture = new THREE.CanvasTexture(badgeCanvas);
      const badgeMat = new THREE.MeshBasicMaterial({ map: badgeTexture });
      const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
      badgeMesh.position.set(1.9, 0.55, 2.73);
      padGroup.add(badgeMesh);

      baysGroup.add(padGroup);
    });

    this.scene.add(baysGroup);
  }

  buildTurntable() {
    this.turntableGroup = new THREE.Group();
    this.turntableGroup.position.set(-1.8, 0, 0);

    const plinthGeo = new THREE.CylinderGeometry(3.6, 3.65, 0.04, 64);
    this.turntableMesh = new THREE.Mesh(plinthGeo, this.materials.plinth);
    this.turntableMesh.position.y = 0.02;
    this.turntableMesh.receiveShadow = true;
    this.turntableGroup.add(this.turntableMesh);

    const ringGeo = new THREE.TorusGeometry(3.62, 0.02, 16, 64);
    const ring = new THREE.Mesh(ringGeo, this.materials.ledCyan);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.035;
    this.turntableGroup.add(ring);

    this.scene.add(this.turntableGroup);
  }

  buildLighting() {
    this.lights.ambient = new THREE.AmbientLight(0xdce5f2, 0.75);
    this.scene.add(this.lights.ambient);

    this.lights.sun = new THREE.DirectionalLight(0xfff6eb, 0.85);
    this.lights.sun.position.set(30, 32, 15);
    this.lights.sun.castShadow = true;
    this.lights.sun.shadow.mapSize.width = 2048;
    this.lights.sun.shadow.mapSize.height = 2048;
    this.lights.sun.shadow.camera.left = -45;
    this.lights.sun.shadow.camera.right = 45;
    this.lights.sun.shadow.camera.top = 35;
    this.lights.sun.shadow.camera.bottom = -35;
    this.lights.sun.shadow.bias = -0.0003;
    this.scene.add(this.lights.sun);

    this.setLightingMode('daylight');
  }

  setLightingMode(mode) {
    this.currentLightingMode = mode;
    if (mode === 'daylight') {
      this.lights.ambient.intensity = 0.75;
      this.lights.sun.intensity = 0.85;
    } else if (mode === 'golden') {
      this.lights.ambient.intensity = 0.65;
      this.lights.sun.intensity = 0.95;
    } else {
      this.lights.ambient.intensity = 0.40;
      this.lights.sun.intensity = 0.30;
    }
  }

  toggleTurntable() {
    this.isTurntableSpinning = !this.isTurntableSpinning;
    return this.isTurntableSpinning;
  }

  update(delta) {
    if (this.isTurntableSpinning && this.turntableGroup) {
      this.turntableGroup.rotation.y += this.turntableSpeed;
    }
  }
}
