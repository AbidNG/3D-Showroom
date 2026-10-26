/**
 * AURA MOTORS - Enterprise Showroom Fleet Engine
 * Spawns and manages 20-30 interactive demo vehicles across 30 exhibition bays,
 * applying bespoke multi-layer clearcoat PBR paint materials, baked contact shadows,
 * and supporting dynamic deployment from the Photo-to-3D Admin Studio.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { inventory, SHOWROOM_BAYS } from './inventory-data.js';

export class VehicleManager {
  constructor(scene, turntableGroup) {
    this.scene = scene;
    this.turntableGroup = turntableGroup;

    // DRACO Loader configured with local decoders
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('draco/');

    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);

    // Active hero car on turntable
    this.heroCarGroup = null;
    this.heroPaintMaterial = null;

    // Showroom Fleet Map (bayNumber -> { group, carData })
    this.fleetMap = new Map();

    // Base template loaded model
    this.baseModel = null;
    this.aoTexture = null;
    this.carGroundOffsetY = 0.0;
    this.isHighPolyLoaded = false;

    this.initHeroMaterials();

    // 1. Instantly create aerodynamic procedural sports car template
    this.baseModel = this.createProceduralCarTemplate();
    this.carGroundOffsetY = 0.0;

    // 2. Immediately spawn all 26 cars so bays are populated from frame zero
    this.spawnAllInventoryCars();

    // 3. Asynchronously load high-poly DRACO mesh and upgrade
    this.loadBaseAssetsAndSpawnFleet();
  }

  initHeroMaterials() {
    this.heroPaintMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8dde4,
      metalness: 0.65,
      roughness: 0.32,
    });

    this.rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xc8d0db,
      metalness: 0.78,
      roughness: 0.35,
    });

    this.caliperMaterial = new THREE.MeshStandardMaterial({
      color: 0x00bcd4,
      metalness: 0.45,
      roughness: 0.35,
    });

    this.lightsOn = true;
    this.headlights = [];
    this.emissiveLights = [];
  }

  createProceduralCarTemplate() {
    const carGroup = new THREE.Group();

    // Body shell
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xd8dde4,
      metalness: 0.65,
      roughness: 0.32,
    });

    // Lower chassis & rocker panels
    const lowerGeo = new THREE.BoxGeometry(2.0, 0.42, 4.4);
    const lower = new THREE.Mesh(lowerGeo, bodyMat);
    lower.name = 'body_lower';
    lower.position.y = 0.38;
    lower.castShadow = true;
    carGroup.add(lower);

    // Aerodynamic hood taper
    const hoodGeo = new THREE.BoxGeometry(1.88, 0.26, 1.6);
    const hood = new THREE.Mesh(hoodGeo, bodyMat);
    hood.name = 'body_hood';
    hood.position.set(0, 0.52, 1.25);
    hood.castShadow = true;
    carGroup.add(hood);

    // Cockpit cabin glass
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0c0f16,
      roughness: 0.2,
      metalness: 0.1,
      transmission: 0.85,
      thickness: 0.4,
      transparent: true,
      opacity: 0.85,
      reflectivity: 0.15,
    });
    const cabinGeo = new THREE.BoxGeometry(1.58, 0.42, 1.95);
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.name = 'glass';
    cabin.position.set(0, 0.82, -0.2);
    cabin.castShadow = true;
    carGroup.add(cabin);

    // Rear aerodynamic carbon spoiler
    const wingGeo = new THREE.BoxGeometry(1.9, 0.06, 0.35);
    const wing = new THREE.Mesh(wingGeo, bodyMat);
    wing.name = 'body_wing';
    wing.position.set(0, 0.88, -2.05);
    carGroup.add(wing);

    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.1), bodyMat);
    p1.position.set(-0.6, 0.74, -2.05);
    const p2 = p1.clone();
    p2.position.x = 0.6;
    carGroup.add(p1);
    carGroup.add(p2);

    // 4 Performance Wheels with Rims & Calipers
    const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.28, 24);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.85 });
    const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.29, 16);
    const rimMat = this.rimMaterial;

    const positions = [
      [-1.02, 0.36, 1.3],
      [1.02, 0.36, 1.3],
      [-1.02, 0.36, -1.3],
      [1.02, 0.36, -1.3],
    ];

    positions.forEach(pos => {
      const tire = new THREE.Mesh(wheelGeo, tireMat);
      tire.name = 'tire';
      tire.rotation.z = Math.PI / 2;
      tire.position.set(...pos);
      tire.castShadow = true;

      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.name = 'rim';
      rim.rotation.z = Math.PI / 2;
      rim.position.set(...pos);

      carGroup.add(tire);
      carGroup.add(rim);
    });

    // Projector Matrix LED Headlights
    const hlGeo = new THREE.BoxGeometry(0.36, 0.08, 0.1);
    const hlMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x0090aa,
      emissiveIntensity: 0.35,
      roughness: 0.4,
    });
    const hlL = new THREE.Mesh(hlGeo, hlMat);
    hlL.position.set(-0.68, 0.5, 2.2);
    const hlR = new THREE.Mesh(hlGeo, hlMat);
    hlR.position.set(0.68, 0.5, 2.2);
    carGroup.add(hlL);
    carGroup.add(hlR);

    // Full-Width LED Tail Bar
    const tlGeo = new THREE.BoxGeometry(1.8, 0.05, 0.06);
    const tlMat = new THREE.MeshStandardMaterial({
      color: 0xd90429,
      emissive: 0x8a0014,
      emissiveIntensity: 0.35,
      roughness: 0.4,
    });
    const tl = new THREE.Mesh(tlGeo, tlMat);
    tl.position.set(0, 0.58, -2.2);
    carGroup.add(tl);

    return carGroup;
  }

  loadBaseAssetsAndSpawnFleet() {
    const textureLoader = new THREE.TextureLoader();

    textureLoader.load('assets/models/ferrari_ao.png', (ao) => {
      this.aoTexture = ao;
    });

    this.gltfLoader.load('assets/models/ferrari.glb', (gltf) => {
      const box = new THREE.Box3().setFromObject(gltf.scene);
      this.carGroundOffsetY = -box.min.y;
      this.baseModel = gltf.scene;
      this.isHighPolyLoaded = true;

      // Upgrade all 26 cars with high-poly geometry!
      this.spawnAllInventoryCars();
    }, undefined, (err) => {
      console.warn('Using high-fidelity procedural fleet:', err);
    });
  }

  /**
   * Spawns all demo cars across the grand showroom
   */
  spawnAllInventoryCars() {
    const cars = inventory.getCars();

    cars.forEach(car => {
      this.spawnCarAtBay(car, car.bay);
    });
  }

  /**
   * Spawns a vehicle at a specific Exhibition Bay (Bays 1 - 30)
   */
  spawnCarAtBay(carData, bayNumber) {
    if (!this.baseModel) return;

    const bayInfo = SHOWROOM_BAYS.find(b => b.bay === bayNumber);
    if (!bayInfo) return;

    // Remove existing car in this bay if present
    this.removeCarAtBay(bayNumber);

    const carGroup = new THREE.Group();

    // Clone base car model
    const carModel = this.baseModel.clone(true);
    if (this.isHighPolyLoaded) {
      carModel.scale.set(1.15, 1.15, 1.15);
      carModel.position.y = this.carGroundOffsetY * 1.15;
    } else {
      carModel.position.y = 0.0;
    }

    // Create bespoke paint material for this car (Sleek luxury automotive finish with zero white glare)
    const paintMat = new THREE.MeshStandardMaterial({
      color: carData.colorHex || 0xd8dde4,
      metalness: carData.finish === 'gloss' ? 0.35 : (carData.finish === 'matte' ? 0.15 : 0.65),
      roughness: carData.finish === 'gloss' ? 0.24 : (carData.finish === 'matte' ? 0.65 : 0.32),
    });

    carModel.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material && child.material.isMeshPhysicalMaterial) {
          child.material.clearcoat = 0;
          child.material.reflectivity = 0.2;
          if (child.material.roughness < 0.2) child.material.roughness = 0.2;
        }

        const name = child.name.toLowerCase();
        if (name.includes('body')) {
          child.material = (bayNumber === 1) ? this.heroPaintMaterial : paintMat;
        } else if (name.includes('rim')) {
          child.material = this.rimMaterial;
        } else if (name.includes('brake')) {
          child.material = this.caliperMaterial;
        }
      }
    });

    carGroup.add(carModel);

    // Ground Contact Shadow Map
    if (this.aoTexture) {
      const shadowPlaneGeo = new THREE.PlaneGeometry(5.2, 2.4);
      const shadowMat = new THREE.MeshBasicMaterial({
        map: this.aoTexture,
        transparent: true,
        opacity: 0.75,
        blending: THREE.MultiplyBlending,
        depthWrite: false,
      });
      const shadowMesh = new THREE.Mesh(shadowPlaneGeo, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.set(0, 0.005, 0);
      carGroup.add(shadowMesh);
    }

    if (bayNumber === 1) {
      // Bay 1: Turntable Centerpiece
      carGroup.position.set(0, 0.03, 0);
      carGroup.rotation.y = bayInfo.rotY;
      this.heroCarGroup = carGroup;
      this.turntableGroup.add(carGroup);
    } else {
      // General Exhibition Bay on Showroom Floor
      carGroup.position.set(bayInfo.x, 0.03, bayInfo.z);
      carGroup.rotation.y = bayInfo.rotY;
      this.scene.add(carGroup);
    }

    this.fleetMap.set(bayNumber, { group: carGroup, data: carData });
  }

  removeCarAtBay(bayNumber) {
    if (this.fleetMap.has(bayNumber)) {
      const entry = this.fleetMap.get(bayNumber);
      if (bayNumber === 1) {
        this.turntableGroup.remove(entry.group);
      } else {
        this.scene.remove(entry.group);
      }
      this.fleetMap.delete(bayNumber);
    }
  }

  removeCarFromShowroom(carId) {
    for (const [bay, entry] of this.fleetMap.entries()) {
      if (entry.data.id === carId) {
        this.removeCarAtBay(bay);
        break;
      }
    }
  }

  refreshAllCars() {
    for (const [bay, entry] of this.fleetMap.entries()) {
      if (bay !== 1) {
        this.scene.remove(entry.group);
      }
    }
    this.fleetMap.clear();

    const cars = inventory.getCars();
    cars.forEach(carData => {
      this.spawnCarAtBay(carData);
    });
  }

  refreshAllCars() {
    for (const [bay, entry] of this.fleetMap.entries()) {
      if (bay !== 1) {
        this.scene.remove(entry.group);
      }
    }
    this.fleetMap.clear();

    const cars = inventory.getCars();
    cars.forEach(carData => {
      this.spawnCarAtBay(carData, carData.bay);
    });
  }

  focusCarAtBay(bayNumber) {
    const bay = SHOWROOM_BAYS.find(b => b.bay === bayNumber);
    if (!bay) return;

    if (window.motionTracker) {
      window.motionTracker.position.set(bay.x + 3.0, 1.6, bay.z + 3.0);
      window.motionTracker.yaw = Math.atan2(bay.x - (bay.x + 3.0), bay.z - (bay.z + 3.0));
      window.motionTracker.pitch = -0.15;
    }
  }

  // ==================== REAL-TIME CUSTOMIZATION ====================

  setPaint(colorHex, finishType = 'metallic') {
    if (!this.heroPaintMaterial) return;
    this.heroPaintMaterial.color.setHex(colorHex);

    switch (finishType) {
      case 'metallic':
        this.heroPaintMaterial.metalness = 0.65;
        this.heroPaintMaterial.roughness = 0.32;
        break;
      case 'gloss':
        this.heroPaintMaterial.metalness = 0.35;
        this.heroPaintMaterial.roughness = 0.24;
        break;
      case 'matte':
        this.heroPaintMaterial.metalness = 0.15;
        this.heroPaintMaterial.roughness = 0.65;
        break;
      case 'pearlescent':
        this.heroPaintMaterial.metalness = 0.55;
        this.heroPaintMaterial.roughness = 0.28;
        break;
    }
  }

  setRimColor(colorHex) {
    if (this.rimMaterial) this.rimMaterial.color.setHex(colorHex);
  }

  setCaliperColor(colorHex) {
    if (this.caliperMaterial) this.caliperMaterial.color.setHex(colorHex);
  }

  toggleLights() {
    this.lightsOn = !this.lightsOn;
    this.headlights.forEach(spot => {
      spot.intensity = this.lightsOn ? 2.8 : 0;
    });
    return this.lightsOn;
  }

  update(delta) {}
}
