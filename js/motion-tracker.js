/**
 * AURA MOTORS - Motion Tracking, Navigation & Collision Engine
 * Supports the grand 110m x 55m multi-wing showroom with 30 exhibition bays,
 * proximity tracking across all 20-30 cars, and seamless Car Focus transitions.
 */

import * as THREE from 'three';
import { inventory, SHOWROOM_BAYS } from './inventory-data.js';

export const MODES = {
  OVERVIEW: 'OVERVIEW',
  FREE_WALK: 'FREE_WALK',
  GUIDED_TOUR: 'GUIDED_TOUR',
  CAR_FOCUS: 'CAR_FOCUS',
  PAUSED: 'PAUSED',
};

export class MotionTracker {
  constructor(camera, domElement, inputValidator, soundEngine) {
    this.camera = camera;
    this.domElement = domElement;
    this.input = inputValidator;
    this.sound = soundEngine;

    // Current State
    // Overview is idle until the visitor explicitly starts walking. Starting in
    // FREE_WALK makes setMode(FREE_WALK) return early and leaves the landing UI
    // out of sync with the movement state.
    this.mode = null;
    this.previousMode = MODES.FREE_WALK;

    // Avatar Transform (Entrance Spawn, eye height 1.6m)
    this.position = new THREE.Vector3(4.5, 1.6, 12.0);
    this.lastValidPosition = this.position.clone();
    this.velocity = new THREE.Vector3();
    this.targetVelocity = new THREE.Vector3();

    // Look Angles
    this.yaw = Math.PI - 0.25;
    this.pitch = 0.0;
    this.savedWalkState = {
      position: this.position.clone(),
      yaw: this.yaw,
      pitch: this.pitch,
      pointerLocked: false,
    };

    // Movement Constants
    this.WALK_SPEED = 1.4;
    this.RUN_SPEED = 2.8;
    this.ACCEL_TIME = 0.2;
    this.AVATAR_RADIUS = 0.45;
    this.EYE_HEIGHT = 1.6;
    this.MAX_PITCH = (80 * Math.PI) / 180;

    // Live Metrics
    this.currentSpeed = 0.0;
    this.speedState = 'idle';
    this.currentZone = 'Entrance Rotunda';
    this.nearestCar = null;
    this.distanceToNearestCar = 999.0;
    this.isFacingNearestCar = false;
    this.fps = 60;
    this.frameCount = 0;
    this.fpsTimer = 0;

    // Mega Pavilion Boundaries (110m x 55m)
    this.boundary = {
      minX: -44.0,
      maxX: 39.0,
      minZ: -32.0,
      maxZ: 32.0,
    };

    // Columns
    this.columns = [
      { x: -6.2, z: 4.5, radius: 0.85 },
      { x: -4.7, z: 4.5, isPlanter: true, minX: -5.3, maxX: -4.1, minZ: 4.0, maxZ: 5.0 },
      { x: -6.2, z: -8.0, radius: 0.85 },
      { x: 3.5, z: 12.0, radius: 0.85 },
      { x: -20.0, z: 8.0, radius: 0.85 },
      { x: -20.0, z: -8.0, radius: 0.85 },
      { x: 18.0, z: 8.0, radius: 0.85 },
      { x: 18.0, z: -8.0, radius: 0.85 },
    ];

    // Transitions & Debounce state (PRD 5: 500ms debounce)
    this.isTransitioning = false;
    this.transitionProgress = 1.0;
    this.transitionDuration = 1.0;
    this.transitionStartPos = new THREE.Vector3();
    this.transitionEndPos = new THREE.Vector3();
    this.transitionStartLook = new THREE.Vector3();
    this.transitionEndLook = new THREE.Vector3();
    this.lastActionTime = 0;

    // Tour Waypoints
    this.tourWaypoints = [
      { pos: new THREE.Vector3(4.5, 1.6, 12.0), target: new THREE.Vector3(-1.8, 0.8, 0.0), hold: 2.0, name: 'Grand Entrance' },
      { pos: new THREE.Vector3(-4.4, 1.6, 3.6), target: new THREE.Vector3(-1.8, 0.65, 0.0), hold: 3.5, name: 'Bay 01: AURA APEX GT' },
      { pos: new THREE.Vector3(-18.0, 1.6, 16.0), target: new THREE.Vector3(-26.0, 0.7, 16.0), hold: 3.0, name: 'Bay 07: VELOCE E-GT' },
      { pos: new THREE.Vector3(16.0, 1.6, 16.0), target: new THREE.Vector3(24.0, 0.7, 16.0), hold: 3.0, name: 'Bay 15: STRATOS X SUV' },
      { pos: new THREE.Vector3(34.0, 1.6, -4.0), target: new THREE.Vector3(38.0, 0.8, -4.0), hold: 2.5, name: 'VIP Glass Lounge' },
      { pos: new THREE.Vector3(0.0, 1.6, -16.0), target: new THREE.Vector3(0.0, 0.8, -22.0), hold: 3.0, name: 'Bay 25: CONCEPT ATELIER' },
      { pos: new THREE.Vector3(4.5, 1.6, 12.0), target: new THREE.Vector3(-1.8, 0.8, 0.0), hold: 2.0, name: 'Tour Complete' },
    ];
    this.tourIndex = 0;
    this.tourWaitTimer = 0;

    this.isPointerLocked = false;
    this.isMouseLookDragging = false;
    this.lastMousePosition = { x: 0, y: 0 };
    this.currentCarIndex = 0;

    this.bindEvents();
    window.motionTracker = this;
  }

  bindEvents() {
    document.addEventListener('pointerdown', event => {
      const target = event.target;
      if (target instanceof Element && target.closest('button, a, input, select, textarea, label, dialog, .showroom-header, .mobile-actions-bar, .mobile-dpad, .joystick-zone')) return;
      if (this.mode !== MODES.FREE_WALK || this.isPointerLocked || event.pointerType !== 'mouse' || event.button !== 0) return;
      this.isMouseLookDragging = true;
      this.lastMousePosition = { x: event.clientX, y: event.clientY };
      this.domElement.classList.add('is-dragging');
      event.preventDefault();
    });

    const endMouseLook = () => {
      this.isMouseLookDragging = false;
      this.domElement.classList.remove('is-dragging');
    };
    window.addEventListener('pointerup', endMouseLook);
    window.addEventListener('pointercancel', endMouseLook);
    window.addEventListener('blur', endMouseLook);

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = (document.pointerLockElement === this.domElement);
      if (this.isPointerLocked) endMouseLook();
      if (!this.isPointerLocked && this.mode === MODES.FREE_WALK) {
        this.pause();
      }
    });

    document.addEventListener('pointermove', event => {
      if (this.mode !== MODES.FREE_WALK) return;
      let deltaX = 0;
      let deltaY = 0;
      if (this.isPointerLocked) {
        deltaX = event.movementX;
        deltaY = event.movementY;
      } else if (this.isMouseLookDragging) {
        deltaX = event.clientX - this.lastMousePosition.x;
        deltaY = event.clientY - this.lastMousePosition.y;
        this.lastMousePosition = { x: event.clientX, y: event.clientY };
      } else {
        return;
      }
      this.applyLookDelta(deltaX, deltaY);
    });

    this.input.onInteract = () => this.handleInteractKey();
    this.input.onEscape = () => {
      if (this.mode === MODES.CAR_FOCUS) {
        this.exitCarFocus();
      } else if (this.mode === MODES.FREE_WALK) {
        this.pause();
      } else if (this.mode === MODES.PAUSED) {
        this.resume();
      }
    };
  }

  applyLookDelta(deltaX, deltaY) {
    const { dx, dy } = this.input.validateMouseDelta(deltaX, deltaY);
    this.yaw -= dx;
    this.pitch -= dy;
    this.pitch = Math.max(-this.MAX_PITCH, Math.min(this.MAX_PITCH, this.pitch));
    this.yaw = (this.yaw + Math.PI * 2) % (Math.PI * 2);
  }

  exitPointerLock() {
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  setMode(newMode) {
    if (this.mode === newMode) return;
    if (newMode !== MODES.FREE_WALK) {
      this.isMouseLookDragging = false;
      this.domElement.classList.remove('is-dragging');
    }
    this.previousMode = this.mode;
    this.mode = newMode;

    const heroOverlay = document.getElementById('showroom-hero-overlay');
    const walkReticle = document.getElementById('walk-reticle');
    const walkGuideHud = document.getElementById('walk-guide-hud');
    const configDock = document.getElementById('configurator-dock');
    const pauseOverlay = document.getElementById('pause-overlay');
    const exitFocusBtn = document.getElementById('btn-exit-focus');
    const tourHud = document.getElementById('tour-hud');

    if (newMode === MODES.OVERVIEW) {
      this.exitPointerLock();
      document.body.classList.remove('in-walk-mode', 'in-car-focus', 'in-paused');
      heroOverlay?.classList.remove('hidden');
      walkReticle?.classList.add('hidden');
      walkGuideHud?.classList.add('hidden');
      configDock?.classList.remove('open');
      pauseOverlay?.classList.add('hidden');
      exitFocusBtn?.classList.add('hidden');
      tourHud?.classList.add('hidden');
    } else if (newMode === MODES.FREE_WALK) {
      document.body.classList.add('in-walk-mode');
      document.body.classList.remove('in-car-focus', 'in-paused');
      heroOverlay?.classList.add('hidden');
      walkReticle?.classList.remove('hidden');
      walkGuideHud?.classList.remove('hidden');
      configDock?.classList.remove('open');
      pauseOverlay?.classList.add('hidden');
      exitFocusBtn?.classList.add('hidden');
      tourHud?.classList.add('hidden');
    } else if (newMode === MODES.CAR_FOCUS) {
      this.exitPointerLock();
      document.body.classList.remove('in-walk-mode', 'in-paused');
      document.body.classList.add('in-car-focus');
      heroOverlay?.classList.add('hidden');
      walkReticle?.classList.add('hidden');
      walkGuideHud?.classList.add('hidden');
      configDock?.classList.add('open');
      exitFocusBtn?.classList.remove('hidden');
      pauseOverlay?.classList.add('hidden');
      tourHud?.classList.add('hidden');
    } else if (newMode === MODES.PAUSED) {
      this.exitPointerLock();
      document.body.classList.remove('in-walk-mode');
      document.body.classList.add('in-paused');
      walkReticle?.classList.add('hidden');
      walkGuideHud?.classList.add('hidden');
      pauseOverlay?.classList.remove('hidden');
      exitFocusBtn?.classList.add('hidden');
      tourHud?.classList.add('hidden');
    } else if (newMode === MODES.GUIDED_TOUR) {
      this.exitPointerLock();
      document.body.classList.remove('in-walk-mode', 'in-car-focus');
      walkReticle?.classList.add('hidden');
      walkGuideHud?.classList.add('hidden');
      configDock?.classList.remove('open');
      tourHud?.classList.remove('hidden');
      pauseOverlay?.classList.add('hidden');
      exitFocusBtn?.classList.add('hidden');
    }

    const modeBadge = document.getElementById('current-mode-badge');
    if (modeBadge) {
      const labels = {
        OVERVIEW: 'VIRTUAL SHOWROOM',
        FREE_WALK: 'FREE WALK',
        GUIDED_TOUR: 'GUIDED TOUR',
        CAR_FOCUS: 'CAR FOCUS',
        PAUSED: 'PAUSED',
      };
      modeBadge.textContent = labels[newMode] || newMode;
    }
  }

  pause() {
    if (this.mode !== MODES.PAUSED) {
      this.setMode(MODES.PAUSED);
    }
  }

  resume() {
    if (this.mode === MODES.PAUSED) {
      this.setMode(this.previousMode || MODES.FREE_WALK);
    }
  }

  resetToEntrance() {
    if (this.isDebounced()) return;
    this.lastActionTime = performance.now();

    this.sound.playClick(1300);
    this.setMode(MODES.FREE_WALK);

    this.startCameraGlide(
      new THREE.Vector3(4.5, this.EYE_HEIGHT, 12.0),
      new THREE.Vector3(-1.8, 0.85, 0.0),
      1.0,
      () => {
        this.position.set(4.5, this.EYE_HEIGHT, 12.0);
        this.yaw = Math.PI - 0.25;
        this.pitch = 0.0;
        this.lastValidPosition.copy(this.position);
      }
    );
  }

  isDebounced() {
    if (this.isTransitioning) return true;
    const now = performance.now();
    return (now - this.lastActionTime < 500);
  }

  handleInteractKey() {
    if (this.mode === MODES.FREE_WALK && this.nearestCar && this.distanceToNearestCar <= 3.2 && this.isFacingNearestCar) {
      this.enterCarFocus(this.nearestCar);
    } else if (this.mode === MODES.CAR_FOCUS) {
      this.exitCarFocus();
    }
  }

  enterCarFocus(car) {
    return this.focusCar(car);
  }

  focusCar(car) {
    if (!car || this.isDebounced()) return false;
    this.lastActionTime = performance.now();

    this.sound.playClick(1500);

    if (this.mode !== MODES.CAR_FOCUS) {
      this.savedWalkState.position.copy(this.position);
      this.savedWalkState.yaw = this.yaw;
      this.savedWalkState.pitch = this.pitch;
      this.savedWalkState.pointerLocked = this.isPointerLocked;
    }

    const cars = inventory.getCars();
    const carIndex = cars.findIndex(item => item.id === car.id);
    if (carIndex >= 0) this.currentCarIndex = carIndex;
    window.vehicles?.setActiveCar(car.id);
    this.setMode(MODES.CAR_FOCUS);

    const bay = SHOWROOM_BAYS.find(b => b.bay === car.bay) || { x: 0, z: 0 };
    const focusPos = new THREE.Vector3(bay.x + 2.8, 1.4, bay.z + 2.8);
    const focusTarget = new THREE.Vector3(bay.x, 0.7, bay.z);

    this.startCameraGlide(focusPos, focusTarget, 1.0);
    return true;
  }

  exitCarFocus() {
    if (this.isDebounced()) return;
    this.lastActionTime = performance.now();

    this.sound.playClick(1200);

    const restoreLookTarget = this.savedWalkState.position.clone().add(
      new THREE.Vector3(
        -Math.sin(this.savedWalkState.yaw) * Math.cos(this.savedWalkState.pitch),
        Math.sin(this.savedWalkState.pitch),
        -Math.cos(this.savedWalkState.yaw) * Math.cos(this.savedWalkState.pitch)
      )
    );

    this.startCameraGlide(this.savedWalkState.position, restoreLookTarget, 0.9, () => {
      this.position.copy(this.savedWalkState.position);
      this.yaw = this.savedWalkState.yaw;
      this.pitch = this.savedWalkState.pitch;
      this.setMode(MODES.FREE_WALK);
    });
  }

  cycleCar(direction = 1) {
    if (this.isDebounced()) return;
    this.lastActionTime = performance.now();

    const cars = inventory.getCars();
    if (!cars.length) return;
    this.currentCarIndex = (this.currentCarIndex + direction + cars.length) % cars.length;
    const targetCar = cars[this.currentCarIndex];
    window.vehicles?.setActiveCar(targetCar.id);

    const bay = SHOWROOM_BAYS.find(b => b.bay === targetCar.bay) || { x: 0, z: 0 };
    const focusPos = new THREE.Vector3(bay.x + 2.8, 1.4, bay.z + 2.8);
    const focusTarget = new THREE.Vector3(bay.x, 0.7, bay.z);

    if (this.mode !== MODES.CAR_FOCUS) {
      this.setMode(MODES.CAR_FOCUS);
    }

    this.startCameraGlide(focusPos, focusTarget, 1.0);
  }

  startGuidedTour() {
    if (this.isDebounced()) return;
    this.lastActionTime = performance.now();

    this.sound.playClick(1600);
    this.setMode(MODES.GUIDED_TOUR);
    this.tourIndex = 0;
    this.tourWaitTimer = 0;
    this.advanceTourWaypoint();
  }

  advanceTourWaypoint() {
    if (this.mode !== MODES.GUIDED_TOUR) return;
    const wp = this.tourWaypoints[this.tourIndex];
    document.getElementById('tour-stop-title').textContent = wp.name;

    this.startCameraGlide(wp.pos, wp.target, 1.6, () => {
      this.tourWaitTimer = wp.hold;
    });
  }

  resumeFreeWalkFromTour() {
    this.sound.playClick(1200);
    this.position.copy(this.camera.position);
    this.position.y = this.EYE_HEIGHT;
    this.setMode(MODES.FREE_WALK);
  }

  startCameraGlide(endPos, endTarget, duration = 1.0, onComplete = null) {
    this.isTransitioning = true;
    this.transitionProgress = 0.0;
    this.transitionDuration = duration;
    this.onTransitionComplete = onComplete;

    this.transitionStartPos.copy(this.camera.position);
    this.transitionEndPos.copy(endPos);

    const currentDir = new THREE.Vector3();
    this.camera.getWorldDirection(currentDir);
    this.transitionStartLook.copy(this.camera.position).addScaledVector(currentDir, 5.0);
    this.transitionEndLook.copy(endTarget);
  }

  update(rawDt) {
    const dt = this.input.validateDeltaTime(rawDt);

    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    if (this.isTransitioning) {
      this.transitionProgress += dt / this.transitionDuration;
      if (this.transitionProgress >= 1.0) {
        this.transitionProgress = 1.0;
        this.isTransitioning = false;
        if (this.onTransitionComplete) {
          this.onTransitionComplete();
          this.onTransitionComplete = null;
        }
      }
      const t = this.transitionProgress;
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      this.camera.position.lerpVectors(this.transitionStartPos, this.transitionEndPos, ease);
      const currentLook = new THREE.Vector3().lerpVectors(this.transitionStartLook, this.transitionEndLook, ease);
      this.camera.lookAt(currentLook);
      return;
    }

    if (this.mode === MODES.GUIDED_TOUR) {
      if (this.tourWaitTimer > 0) {
        this.tourWaitTimer -= dt;
        if (this.tourWaitTimer <= 0) {
          this.tourIndex = (this.tourIndex + 1) % this.tourWaypoints.length;
          this.advanceTourWaypoint();
        }
      }
      return;
    }

    if (this.mode === MODES.CAR_FOCUS) {
      return;
    }

    if (this.mode === MODES.PAUSED) {
      return;
    }

    if (this.mode === MODES.OVERVIEW) {
      return;
    }

    if (this.mode === MODES.FREE_WALK) {
      this.updateFreeWalk(dt);
    }

    this.updateProximityAndTelemetry();
  }

  updateFreeWalk(dt) {
    const moveDir = new THREE.Vector3();

    let moveZ = 0;
    if (this.input.keys.forward) moveZ -= 1;
    if (this.input.keys.backward) moveZ += 1;

    let moveX = 0;
    if (this.input.keys.left) moveX -= 1;
    if (this.input.keys.right) moveX += 1;

    moveDir.set(moveX, 0, moveZ);

    const isMoving = moveDir.lengthSq() > 0.001;
    const isRunning = isMoving && this.input.keys.run;

    if (!isMoving) {
      this.speedState = 'idle';
      this.targetVelocity.set(0, 0, 0);
    } else {
      this.speedState = isRunning ? 'run' : 'walk';
      const targetSpeed = isRunning ? this.RUN_SPEED : this.WALK_SPEED;

      moveDir.normalize();
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      moveDir.multiplyScalar(targetSpeed);
      this.targetVelocity.copy(moveDir);
    }

    const accelRate = 1.0 - Math.exp(-dt / this.ACCEL_TIME);
    this.velocity.lerp(this.targetVelocity, accelRate);
    this.currentSpeed = this.velocity.length();

    const displacement = this.velocity.clone().multiplyScalar(dt);
    if (displacement.lengthSq() < 0.000001) {
      this.updateCameraTransform();
      return;
    }

    const newPos = this.position.clone().add(displacement);
    const resolvedPos = this.resolveCollisionsWithSliding(this.position, newPos);

    resolvedPos.x = Math.max(this.boundary.minX + this.AVATAR_RADIUS, Math.min(this.boundary.maxX - this.AVATAR_RADIUS, resolvedPos.x));
    resolvedPos.z = Math.max(this.boundary.minZ + this.AVATAR_RADIUS, Math.min(this.boundary.maxZ - this.AVATAR_RADIUS, resolvedPos.z));
    resolvedPos.y = this.EYE_HEIGHT;

    if (isNaN(resolvedPos.x) || isNaN(resolvedPos.z) || isNaN(resolvedPos.y)) {
      this.position.copy(this.lastValidPosition);
      this.velocity.set(0, 0, 0);
    } else {
      this.position.copy(resolvedPos);
      this.lastValidPosition.copy(resolvedPos);
    }

    this.updateCameraTransform();
  }

  resolveCollisionsWithSliding(oldPos, newPos) {
    let result = newPos.clone();

    // Check columns
    this.columns.forEach(col => {
      if (col.isPlanter) {
        result = this.slideAgainstAABB(oldPos, result, col.minX, col.maxX, col.minZ, col.maxZ);
      } else {
        const distToCol = Math.hypot(result.x - col.x, result.z - col.z);
        const minDist = col.radius + this.AVATAR_RADIUS;
        if (distToCol < minDist) {
          const normal = new THREE.Vector2(result.x - col.x, result.z - col.z).normalize();
          result.x = col.x + normal.x * minDist;
          result.z = col.z + normal.y * minDist;
        }
      }
    });

    // Check Bays
    SHOWROOM_BAYS.forEach(b => {
      const pad = 1.6;
      result = this.slideAgainstAABB(oldPos, result, b.x - pad, b.x + pad, b.z - 2.8, b.z + 2.8);
    });

    return result;
  }

  slideAgainstAABB(oldPos, targetPos, minX, maxX, minZ, maxZ) {
    const pad = this.AVATAR_RADIUS;
    const boxMinX = minX - pad;
    const boxMaxX = maxX + pad;
    const boxMinZ = minZ - pad;
    const boxMaxZ = maxZ + pad;

    if (targetPos.x > boxMinX && targetPos.x < boxMaxX && targetPos.z > boxMinZ && targetPos.z < boxMaxZ) {
      const canMoveX = (oldPos.x > boxMinX && oldPos.x < boxMaxX);
      const canMoveZ = (oldPos.z > boxMinZ && oldPos.z < boxMaxZ);

      const resolved = targetPos.clone();
      if (!canMoveX) {
        resolved.x = (oldPos.x < boxMinX) ? boxMinX : boxMaxX;
      }
      if (!canMoveZ) {
        resolved.z = (oldPos.z < boxMinZ) ? boxMinZ : boxMaxZ;
      }
      return resolved;
    }
    return targetPos;
  }

  updateCameraTransform() {
    this.camera.position.copy(this.position);

    const dir = new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    );

    const lookTarget = this.position.clone().add(dir);
    this.camera.lookAt(lookTarget);
  }

  updateProximityAndTelemetry() {
    let closestCar = null;
    let minDistance = 999.0;
    const cars = inventory.getCars();

    cars.forEach(car => {
      const bay = SHOWROOM_BAYS.find(b => b.bay === car.bay);
      if (!bay) return;

      const dist = Math.hypot(this.position.x - bay.x, this.position.z - bay.z);
      if (dist < minDistance) {
        minDistance = dist;
        closestCar = car;
      }
    });

    this.nearestCar = closestCar;
    this.distanceToNearestCar = minDistance;

    if (closestCar) {
      const bay = SHOWROOM_BAYS.find(b => b.bay === closestCar.bay);
      const camDir = new THREE.Vector3();
      this.camera.getWorldDirection(camDir);
      camDir.y = 0;
      camDir.normalize();

      const toCar = new THREE.Vector3().subVectors(new THREE.Vector3(bay.x, 0, bay.z), this.position);
      toCar.y = 0;
      toCar.normalize();

      this.isFacingNearestCar = (camDir.dot(toCar) >= 0.35);
    }

    // Zone detection
    if (this.position.x < -20.0) {
      this.currentZone = 'GT & Electric Boulevard';
    } else if (this.position.x > 18.0) {
      this.currentZone = 'Cyber SUV Pavilion';
    } else if (this.position.z < -16.0) {
      this.currentZone = 'Concept & Bespoke Atelier';
    } else {
      this.currentZone = 'Hypercar Rotunda';
    }

    const canInteract = (this.mode === MODES.FREE_WALK && closestCar && minDistance <= 3.2 && this.isFacingNearestCar);
    const triggerPrompt = document.getElementById('car-proximity-prompt');
    const inspectBtn = document.getElementById('btn-inspect-car');

    if (triggerPrompt) {
      if (canInteract) {
        triggerPrompt.classList.remove('hidden');
        document.getElementById('prompt-car-name').textContent = `BAY ${String(closestCar.bay).padStart(2, '0')}: ${closestCar.name}`;
      } else {
        triggerPrompt.classList.add('hidden');
      }
    }

    if (inspectBtn) {
      if (canInteract) {
        inspectBtn.removeAttribute('disabled');
        inspectBtn.classList.add('ready');
      } else {
        inspectBtn.setAttribute('disabled', 'true');
        inspectBtn.classList.remove('ready');
      }
    }

    const hudCoords = document.getElementById('telemetry-coords');
    const hudSpeed = document.getElementById('telemetry-speed');
    const hudHeading = document.getElementById('telemetry-heading');
    const hudZone = document.getElementById('telemetry-zone');
    const hudCar = document.getElementById('telemetry-nearest-car');
    const hudFps = document.getElementById('telemetry-fps');

    if (hudCoords) hudCoords.textContent = `${this.position.x.toFixed(1)}, ${this.position.y.toFixed(1)}, ${this.position.z.toFixed(1)}`;
    if (hudSpeed) hudSpeed.textContent = `${this.currentSpeed.toFixed(2)} m/s (${this.speedState.toUpperCase()})`;
    if (hudHeading) hudHeading.textContent = `Yaw: ${((this.yaw * 180) / Math.PI).toFixed(0)}°`;
    if (hudZone) hudZone.textContent = this.currentZone;
    if (hudCar && this.nearestCar) hudCar.textContent = `BAY ${String(this.nearestCar.bay).padStart(2, '0')}: ${this.nearestCar.name} (${this.distanceToNearestCar.toFixed(1)}m)`;
    if (hudFps) hudFps.textContent = `${this.fps} FPS`;
  }
}
