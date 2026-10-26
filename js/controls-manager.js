/**
 * AURA MOTORS - Camera & Navigation Controls Manager
 * Handles OrbitControls, First-Person Walk Mode, Smooth Cinematic Camera Transitions,
 * and 2D Real-time Minimap Radar HUD.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class ControlsManager {
  constructor(camera, domElement, scene) {
    this.camera = camera;
    this.domElement = domElement;
    this.scene = scene;

    // Camera presets dictionary
    this.presets = {
      // Exact viewpoint from the user's reference photo!
      entrance: {
        pos: new THREE.Vector3(4.5, 2.1, 9.8),
        target: new THREE.Vector3(-1.8, 0.85, 0.0),
        fov: 48,
      },
      hero: {
        pos: new THREE.Vector3(-4.4, 1.3, 3.6),
        target: new THREE.Vector3(-1.8, 0.65, 0.1),
        fov: 45,
      },
      interior: {
        pos: new THREE.Vector3(-2.2, 1.25, 0.45),
        target: new THREE.Vector3(-1.8, 0.82, -0.1),
        fov: 52,
      },
      wheels: {
        pos: new THREE.Vector3(-3.4, 0.52, 1.45),
        target: new THREE.Vector3(-2.75, 0.38, 1.35),
        fov: 38,
      },
      lounge: {
        pos: new THREE.Vector3(8.2, 1.25, -2.2),
        target: new THREE.Vector3(-1.8, 0.75, 0.0),
        fov: 52,
      },
    };

    // Orbit Controls
    this.orbit = new OrbitControls(this.camera, this.domElement);
    this.orbit.enableDamping = true;
    this.orbit.dampingFactor = 0.05;
    this.orbit.maxPolarAngle = Math.PI / 2.05; // Prevent camera from clipping through floor
    this.orbit.minDistance = 1.2;
    this.orbit.maxDistance = 24.0;
    this.orbit.target.copy(this.presets.entrance.target);

    // Initial camera position (reference photo angle)
    this.camera.position.copy(this.presets.entrance.pos);
    this.camera.fov = this.presets.entrance.fov;
    this.camera.updateProjectionMatrix();

    // Cinematic transition state
    this.isTransitioning = false;
    this.transitionStartPos = new THREE.Vector3();
    this.transitionEndPos = new THREE.Vector3();
    this.transitionStartTarget = new THREE.Vector3();
    this.transitionEndTarget = new THREE.Vector3();
    this.transitionProgress = 1.0;
    this.transitionDuration = 1.2; // seconds

    // Auto-Tour continuous orbit state
    this.isAutoTouring = false;
    this.tourAngle = 0;
    this.tourRadius = 6.2;
    this.tourHeight = 1.6;

    // First-Person Walk Mode State
    this.isWalkMode = false;
    this.walkSpeed = 4.2;
    this.keys = { w: false, a: false, s: false, d: false };
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.isMouseDown = false;
    this.previousMousePosition = { x: 0, y: 0 };

    // Minimap Canvas & 2D Context
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

    this.bindEvents();
  }

  bindEvents() {
    // Keyboard for walk mode
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (this.keys.hasOwnProperty(k)) this.keys[k] = true;
      if (e.key === 'Escape' && this.isWalkMode) {
        this.exitWalkMode();
      }
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (this.keys.hasOwnProperty(k)) this.keys[k] = false;
    });

    // Walk mode mouse look
    this.domElement.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isWalkMode || !this.isMouseDown) return;

      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      this.euler.setFromQuaternion(this.camera.quaternion);
      this.euler.y -= deltaX * 0.003;
      this.euler.x -= deltaY * 0.003;
      // Clamp vertical look angle
      this.euler.x = Math.max(-Math.PI / 2.6, Math.min(Math.PI / 2.6, this.euler.x));

      this.camera.quaternion.setFromEuler(this.euler);
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });
  }

  /**
   * Smoothly animates camera to a predefined viewpoint
   */
  transitionTo(viewName) {
    if (viewName === 'orbit') {
      this.isAutoTouring = !this.isAutoTouring;
      return this.isAutoTouring;
    }

    this.isAutoTouring = false;
    if (this.isWalkMode) this.exitWalkMode();

    const targetPreset = this.presets[viewName];
    if (!targetPreset) return;

    this.transitionStartPos.copy(this.camera.position);
    this.transitionEndPos.copy(targetPreset.pos);
    this.transitionStartTarget.copy(this.orbit.target);
    this.transitionEndTarget.copy(targetPreset.target);

    this.transitionProgress = 0.0;
    this.isTransitioning = true;
    this.orbit.enabled = false;
  }

  /**
   * Toggle First-Person Walk Mode
   */
  toggleWalkMode() {
    if (this.isWalkMode) {
      this.exitWalkMode();
    } else {
      this.enterWalkMode();
    }
    return this.isWalkMode;
  }

  enterWalkMode() {
    this.isWalkMode = true;
    this.isAutoTouring = false;
    this.orbit.enabled = false;

    // Set camera to eye-level standing height (1.68m)
    this.camera.position.set(0, 1.68, 6.0);
    this.euler.set(0, Math.PI, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(this.euler);

    document.getElementById('walk-hud')?.classList.remove('hidden');
    document.getElementById('btn-walk-mode')?.classList.add('active');
  }

  exitWalkMode() {
    this.isWalkMode = false;
    this.orbit.enabled = true;
    this.orbit.target.set(-1.8, 0.85, 0.0);

    document.getElementById('walk-hud')?.classList.add('hidden');
    document.getElementById('btn-walk-mode')?.classList.remove('active');

    // Return to entrance view
    this.transitionTo('entrance');
  }

  /**
   * Updates camera navigation and draws minimap each frame
   */
  update(delta) {
    // 1. Handle Smooth Camera Preset Transition
    if (this.isTransitioning) {
      this.transitionProgress += delta / this.transitionDuration;
      if (this.transitionProgress >= 1.0) {
        this.transitionProgress = 1.0;
        this.isTransitioning = false;
        this.orbit.enabled = true;
      }

      // Smooth cubic ease-in-out curve
      const t = this.transitionProgress;
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      this.camera.position.lerpVectors(this.transitionStartPos, this.transitionEndPos, ease);
      this.orbit.target.lerpVectors(this.transitionStartTarget, this.transitionEndTarget, ease);
    } else if (this.isAutoTouring) {
      // Continuous 360 degree orbit around hero car
      this.tourAngle += delta * 0.25;
      const centerX = -1.8;
      const centerZ = 0.0;
      this.camera.position.x = centerX + Math.cos(this.tourAngle) * this.tourRadius;
      this.camera.position.z = centerZ + Math.sin(this.tourAngle) * this.tourRadius;
      this.camera.position.y = this.tourHeight + Math.sin(this.tourAngle * 0.5) * 0.35;
      this.orbit.target.set(centerX, 0.7, centerZ);
      this.orbit.update();
    } else if (this.isWalkMode) {
      // 2. Handle First-Person Walk Movement
      const moveVector = new THREE.Vector3();
      if (this.keys.w) moveVector.z -= 1;
      if (this.keys.s) moveVector.z += 1;
      if (this.keys.a) moveVector.x -= 1;
      if (this.keys.d) moveVector.x += 1;

      if (moveVector.lengthSq() > 0) {
        moveVector.normalize();
        moveVector.applyEuler(new THREE.Euler(0, this.euler.y, 0));
        moveVector.multiplyScalar(this.walkSpeed * delta);

        const newPos = this.camera.position.clone().add(moveVector);

        // Architectural showroom boundary collision limits
        newPos.x = Math.max(-10.5, Math.min(10.8, newPos.x));
        newPos.z = Math.max(-19.5, Math.min(22.0, newPos.z));
        newPos.y = 1.68; // Lock to eye-level

        // Column collisions
        const col1Dist = Math.hypot(newPos.x - (-6.2), newPos.z - 4.5);
        const col2Dist = Math.hypot(newPos.x - (-6.2), newPos.z - (-8.0));
        if (col1Dist > 1.2 && col2Dist > 1.2) {
          this.camera.position.copy(newPos);
        }
      }
    } else {
      this.orbit.update();
    }

    // 3. Render Real-time Minimap Radar
    this.drawMinimap();
  }

  /**
   * Draws the architectural showroom floorplan on the minimap HUD
   */
  drawMinimap() {
    if (!this.minimapCtx || !this.minimapCanvas) return;
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Map showroom coordinates: X (-12 to +12) -> w (15 to w-15), Z (-22 to +24) -> h (h-10 to 10)
    const mapX = (x) => ((x + 12) / 24) * (w - 30) + 15;
    const mapZ = (z) => (1 - (z + 22) / 46) * (h - 20) + 10;

    // Showroom boundary
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX(-11.5), mapZ(23), mapX(11.5) - mapX(-11.5), mapZ(-21) - mapZ(23));

    // Glass Curtain Wall (Right side highlighted in cyan-white)
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(mapX(11.8), mapZ(-21));
    ctx.lineTo(mapX(11.8), mapZ(23));
    ctx.stroke();

    // Architectural Columns
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    [[-6.2, 4.5], [-6.2, -8.0], [3.5, 12.0]].forEach(pos => {
      ctx.beginPath();
      ctx.arc(mapX(pos[0]), mapZ(pos[1]), 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Hero Car (Aura Apex GT on Turntable)
    ctx.fillStyle = '#e5b967';
    ctx.beginPath();
    ctx.arc(mapX(-1.8), mapZ(0.0), 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Background Display Cars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(mapX(0.5), mapZ(-13.5), 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(mapX(-5.5), mapZ(-13.5), 3, 0, Math.PI * 2);
    ctx.fill();

    // Camera Location & Field of View Cone
    const camX = mapX(this.camera.position.x);
    const camZ = mapZ(this.camera.position.z);

    // Camera Direction Vector
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    const angle = Math.atan2(-dir.x, dir.z);

    // Draw FOV Vision Cone
    ctx.fillStyle = 'rgba(0, 229, 255, 0.18)';
    ctx.beginPath();
    ctx.moveTo(camX, camZ);
    const fovHalf = 0.45;
    const viewLen = 22;
    ctx.arc(camX, camZ, viewLen, angle - Math.PI / 2 - fovHalf, angle - Math.PI / 2 + fovHalf);
    ctx.closePath();
    ctx.fill();

    // Camera position blip
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(camX, camZ, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
