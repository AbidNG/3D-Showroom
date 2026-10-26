/**
 * AURA MOTORS - Master Application Coordinator
 * PRD Version 1.0 Full Compliance:
 * - Integrates MotionTracker, InputValidator, MobileController, Showroom Architecture & Photorealistic Vehicles
 * - Implements PRD Section 5 Button Specification & Debouncing
 * - Implements PRD Section 7.2 Strict Form Validation & Sanitization
 * - Implements PRD Section 8 State Rules & Edge Cases (Low FPS handling, PointerLock recovery, Focus guard)
 */

import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { Showroom } from './showroom.js';
import { VehicleManager } from './car-models.js';
import { MotionTracker, MODES } from './motion-tracker.js';
import { InputValidator } from './input-validator.js';
import { MobileController } from './mobile-controls.js';
import { sound } from './audio.js';
import { inventory } from './inventory-data.js';

class App {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();

    // Curated paint palette
    this.paintColors = [
      { name: 'Liquid Quicksilver', hex: 0xd8dde4, css: '#d8dde4' },
      { name: 'Monaco Rosso Metallic', hex: 0xb31226, css: '#b31226' },
      { name: 'Obsidian Stealth Black', hex: 0x121417, css: '#121417' },
      { name: 'Riviera Cyan Pearlescent', hex: 0x00b4d8, css: '#00b4d8' },
      { name: 'British Racing Emerald', hex: 0x1b4332, css: '#1b4332' },
      { name: 'Solaris Gold Metallic', hex: 0xe0a944, css: '#e0a944' },
      { name: 'Nardo Chalk Gray', hex: 0x9aa0a6, css: '#9aa0a6' },
      { name: 'Ultraviolet Amethyst', hex: 0x5e17eb, css: '#5e17eb' },
    ];

    this.rimFinishes = [
      { name: 'Titanium Silver', hex: 0xd5dce5, css: '#d5dce5' },
      { name: 'Gloss Jet Black', hex: 0x15171c, css: '#15171c' },
      { name: 'Polished Champagne Gold', hex: 0xdeb887, css: '#deb887' },
      { name: 'Satin Dark Carbon', hex: 0x343a40, css: '#343a40' },
    ];

    this.caliperColors = [
      { name: 'Electric Cyan', hex: 0x00e5ff, css: '#00e5ff' },
      { name: 'Monza Racing Red', hex: 0xe63946, css: '#e63946' },
      { name: 'Acid Neon Green', hex: 0x39ff14, css: '#39ff14' },
      { name: 'Speed Yellow', hex: 0xffb703, css: '#ffb703' },
    ];

    this.currentPaint = this.paintColors[0];
    this.currentFinish = 'metallic';

    this.initThree();
    this.initEnvironment();
    this.initPostProcessing();
    this.initModules();
    this.initUI();
    this.initFormValidation();
    this.animate();

    this.simulateLoader();
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c10);

    // Initial Camera Transform (Entrance Spawn, eye-height 1.6m)
    this.camera = new THREE.PerspectiveCamera(
      48,
      window.innerWidth / window.innerHeight,
      0.1,
      120
    );
    this.camera.position.set(4.5, 1.6, 9.8);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.90;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => this.onResize());
  }

  initEnvironment() {
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();
    this.rgbeLoader = new RGBELoader();
    this.loadHdrEnvironment('assets/textures/studio_env.hdr');
  }

  loadHdrEnvironment(path) {
    this.rgbeLoader.load(path, (hdrTexture) => {
      const envMap = this.pmremGenerator.fromEquirectangular(hdrTexture).texture;
      this.scene.environment = envMap;
      if ('environmentIntensity' in this.scene) {
        this.scene.environmentIntensity = 0.55;
      }
      hdrTexture.dispose();
    }, undefined, (err) => {
      console.warn('Fallback environment:', err);
    });
  }

  initPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  initModules() {
    // 1. Showroom Architecture with Real-time Floor Reflector
    this.showroom = new Showroom(this.scene);

    // 2. High-Poly Exotic Sports Car with Baked AO Contact Shadow
    this.vehicles = new VehicleManager(this.scene, this.showroom.turntableGroup);

    // 3. PRD Input Validation Engine
    this.inputValidator = new InputValidator();

    // 4. PRD Motion Tracking & Navigation Engine
    this.motionTracker = new MotionTracker(
      this.camera,
      this.renderer.domElement,
      this.inputValidator,
      sound
    );

    // 5. PRD Mobile Touch & Virtual Joystick Controller
    this.mobileController = new MobileController(
      this.motionTracker,
      this.inputValidator
    );

    window.motionTracker = this.motionTracker;
    window.vehicles = this.vehicles;

    // Listen to changes made in the separate Admin Portal web tab
    window.addEventListener('storage', (e) => {
      if (e.key === 'aura_showroom_inventory') {
        this.vehicles.refreshAllCars();
        this.showToast('Showroom inventory updated from Admin Portal.');
      }
    });
  }

  initUI() {
    // =========================================================================
    // PRD Section 5: Button Specification
    // =========================================================================

    // 1. Start Walk Handlers (Header button & Hero button)
    const activateWalkMode = () => {
      sound.playClick(1400);
      this.motionTracker.setMode(MODES.FREE_WALK);
      this.motionTracker.requestPointerLock();
      this.showToast('Walk Mode active. WASD to move, Shift to sprint, Mouse to look.');
    };

    document.getElementById('btn-start-walk')?.addEventListener('click', activateWalkMode);
    document.getElementById('btn-hero-start-walk')?.addEventListener('click', activateWalkMode);

    // Exit Walk Mode Button
    document.getElementById('btn-exit-walk')?.addEventListener('click', () => {
      sound.playClick(1100);
      this.motionTracker.exitPointerLock();
      this.motionTracker.setMode(MODES.PAUSED);
      document.body.classList.remove('in-walk-mode', 'in-car-focus');
      document.getElementById('showroom-hero-overlay')?.classList.remove('hidden');
      document.getElementById('walk-reticle')?.classList.add('hidden');
      document.getElementById('walk-guide-hud')?.classList.add('hidden');
      document.getElementById('configurator-dock')?.classList.remove('open');
      const modeBadge = document.getElementById('current-mode-badge');
      if (modeBadge) modeBadge.textContent = 'OVERVIEW';
    });

    // Canvas click re-locks mouse when in walk mode
    this.container.addEventListener('click', () => {
      if (this.motionTracker.mode === MODES.FREE_WALK && !this.motionTracker.isPointerLocked) {
        this.motionTracker.requestPointerLock();
      }
    });

    // Auto-focus bay if navigated from Admin Portal (?focusBay=X)
    const urlParams = new URLSearchParams(window.location.search);
    const focusBay = urlParams.get('focusBay');
    if (focusBay) {
      setTimeout(() => {
        const bayNum = parseInt(focusBay);
        this.vehicles.focusCarAtBay(bayNum);
        this.showToast(`Navigated directly to Bay ${String(bayNum).padStart(2, '0')}.`);
      }, 700);
    }

    // 2. Previous Car Button (Debounced 500ms, wraps)
    const prevCarBtn = document.getElementById('btn-prev-car');
    prevCarBtn?.addEventListener('click', () => {
      this.motionTracker.cycleCar(-1);
    });

    // 3. Next Car Button (Debounced 500ms, wraps)
    const nextCarBtn = document.getElementById('btn-next-car');
    nextCarBtn?.addEventListener('click', () => {
      this.motionTracker.cycleCar(1);
    });

    // 4. Inspect Car Button ([E])
    const inspectBtn = document.getElementById('btn-inspect-car');
    inspectBtn?.addEventListener('click', () => {
      this.motionTracker.handleInteractKey();
    });

    // Proximity Prompt Inspect Button
    const promptInspectBtn = document.getElementById('btn-prompt-inspect');
    promptInspectBtn?.addEventListener('click', () => {
      this.motionTracker.handleInteractKey();
    });

    // 5. Exit Car Focus Floating Button
    const exitFocusBtn = document.getElementById('btn-back-to-walk');
    exitFocusBtn?.addEventListener('click', () => {
      this.motionTracker.exitCarFocus();
    });

    // 6. Start Guided Tour Button
    const tourBtn = document.getElementById('btn-guided-tour');
    tourBtn?.addEventListener('click', () => {
      this.motionTracker.startGuidedTour();
    });

    // Resume Walk from Guided Tour
    const resumeTourBtn = document.getElementById('btn-tour-resume-walk');
    resumeTourBtn?.addEventListener('click', () => {
      this.motionTracker.resumeFreeWalkFromTour();
    });

    // 7. Reset View / Return to Entrance Button
    const resetBtn = document.getElementById('btn-reset-view');
    resetBtn?.addEventListener('click', () => {
      this.motionTracker.resetToEntrance();
    });

    // 8. Pause / Resume Toggle Button
    const pauseBtn = document.getElementById('btn-pause-toggle');
    pauseBtn?.addEventListener('click', () => {
      if (this.motionTracker.mode === MODES.PAUSED) {
        this.motionTracker.resume();
      } else {
        this.motionTracker.pause();
      }
    });

    // Resume button on Pause Overlay
    const resumeExploreBtn = document.getElementById('btn-resume-explore');
    resumeExploreBtn?.addEventListener('click', () => {
      this.motionTracker.resume();
    });

    // Audio Mute/Unmute Toggle
    const audioBtn = document.getElementById('btn-audio');
    const audioIconOn = document.getElementById('audio-icon-on');
    const audioIconOff = document.getElementById('audio-icon-off');
    audioBtn?.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      if (isMuted) {
        audioIconOn.classList.add('hidden');
        audioIconOff.classList.remove('hidden');
      } else {
        audioIconOn.classList.remove('hidden');
        audioIconOff.classList.add('hidden');
      }
    });

    // Lighting Dropdown
    const lightBtn = document.getElementById('btn-lighting');
    const lightMenu = document.getElementById('lighting-menu');
    const lightLabel = document.getElementById('light-mode-label');

    lightBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.playClick(1200);
      lightMenu?.classList.toggle('open');
    });

    document.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', () => {
        sound.playClick(1300);
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const mode = item.dataset.light;
        this.showroom.setLightingMode(mode);

        if (mode === 'golden') {
          this.loadHdrEnvironment('assets/textures/sunset_env.hdr');
          this.renderer.toneMappingExposure = 1.0;
        } else if (mode === 'daylight') {
          this.loadHdrEnvironment('assets/textures/studio_env.hdr');
          this.renderer.toneMappingExposure = 0.95;
        } else {
          this.renderer.toneMappingExposure = 0.78;
        }

        if (lightLabel) lightLabel.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
        lightMenu?.classList.remove('open');
      });
    });

    window.addEventListener('click', () => {
      lightMenu?.classList.remove('open');
    });

    // Build Paint & Wheel Swatches
    this.buildPaintSwatches();
    this.buildWheelSwatches();

    // Configurator Dock Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick(1300);
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.dock-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        document.getElementById(`panel-${tab}`)?.classList.add('active');
      });
    });

    // Action Dock Buttons
    document.getElementById('btn-toggle-lights')?.addEventListener('click', () => {
      sound.playClick(1500);
      this.vehicles.toggleLights();
    });

    document.getElementById('btn-toggle-turntable')?.addEventListener('click', () => {
      sound.playClick(1200);
      this.showroom.toggleTurntable();
    });

    document.getElementById('btn-rev-sound')?.addEventListener('click', () => {
      sound.playEngineRev();
    });

    document.getElementById('btn-snapshot-dock')?.addEventListener('click', () => {
      this.captureSnapshot();
    });
  }

  buildPaintSwatches() {
    const swatchesContainer = document.getElementById('paint-swatches');
    const currentPaintName = document.getElementById('current-paint-name');
    if (!swatchesContainer) return;

    this.paintColors.forEach((color, index) => {
      const swatch = document.createElement('div');
      swatch.className = `color-swatch ${index === 0 ? 'active' : ''}`;
      swatch.style.backgroundColor = color.css;
      swatch.title = color.name;

      swatch.addEventListener('click', () => {
        sound.playClick(1500);
        document.querySelectorAll('#paint-swatches .color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        this.currentPaint = color;
        this.vehicles.setPaint(color.hex, this.currentFinish);

        if (currentPaintName) currentPaintName.textContent = color.name;
      });

      swatchesContainer.appendChild(swatch);
    });

    document.querySelectorAll('#finish-selector .pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick(1200);
        document.querySelectorAll('#finish-selector .pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFinish = btn.dataset.finish;
        this.vehicles.setPaint(this.currentPaint.hex, this.currentFinish);
      });
    });
  }

  buildWheelSwatches() {
    const rimContainer = document.getElementById('rim-swatches');
    if (rimContainer) {
      this.rimFinishes.forEach((rim, index) => {
        const swatch = document.createElement('div');
        swatch.className = `color-swatch ${index === 0 ? 'active' : ''}`;
        swatch.style.backgroundColor = rim.css;
        swatch.title = rim.name;
        swatch.addEventListener('click', () => {
          sound.playClick(1400);
          document.querySelectorAll('#rim-swatches .color-swatch').forEach(s => s.classList.remove('active'));
          swatch.classList.add('active');
          this.vehicles.setRimColor(rim.hex);
        });
        rimContainer.appendChild(swatch);
      });
    }

    const caliperContainer = document.getElementById('caliper-swatches');
    if (caliperContainer) {
      this.caliperColors.forEach((cal, index) => {
        const swatch = document.createElement('div');
        swatch.className = `color-swatch ${index === 0 ? 'active' : ''}`;
        swatch.style.backgroundColor = cal.css;
        swatch.title = cal.name;
        swatch.addEventListener('click', () => {
          sound.playClick(1400);
          document.querySelectorAll('#caliper-swatches .color-swatch').forEach(s => s.classList.remove('active'));
          swatch.classList.add('active');
          this.vehicles.setCaliperColor(cal.hex);
        });
        caliperContainer.appendChild(swatch);
      });
    }
  }

  // =========================================================================
  // PRD Section 7.2: Form Entries Validation & Real-Time Feedback
  // =========================================================================

  initFormValidation() {
    const modal = document.getElementById('booking-modal');
    const openBtn = document.getElementById('btn-booking-open');
    const closeBtn = document.getElementById('modal-close');
    const submitBtn = document.getElementById('modal-submit-btn');

    const inputName = document.getElementById('form-name');
    const inputPhone = document.getElementById('form-phone');
    const inputEmail = document.getElementById('form-email');
    const inputDate = document.getElementById('form-date');
    const selectCar = document.getElementById('form-car-select');
    const inputMsg = document.getElementById('form-message');

    // Configure 60-day date boundary on datepicker
    if (inputDate) {
      const today = new Date();
      const maxDate = new Date();
      maxDate.setDate(today.getDate() + 60);

      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      inputDate.min = `${yyyy}-${mm}-${dd}`;
      inputDate.value = `${yyyy}-${mm}-${dd}`;

      const maxY = maxDate.getFullYear();
      const maxM = String(maxDate.getMonth() + 1).padStart(2, '0');
      const maxD = String(maxDate.getDate()).padStart(2, '0');
      inputDate.max = `${maxY}-${maxM}-${maxD}`;
    }

    openBtn?.addEventListener('click', () => {
      sound.playClick(1200);
      modal?.classList.remove('hidden');
    });

    closeBtn?.addEventListener('click', () => {
      modal?.classList.add('hidden');
    });

    const validateFormRealtime = () => {
      const formData = {
        name: inputName?.value || '',
        phone: inputPhone?.value || '',
        email: inputEmail?.value || '',
        date: inputDate?.value || '',
        carId: selectCar?.value || 'apex',
        message: inputMsg?.value || '',
      };

      const result = this.inputValidator.validateBookingForm(formData);

      // Update inline error messages & field invalid borders
      const fields = [
        { el: inputName, errEl: document.getElementById('error-name'), key: 'name' },
        { el: inputPhone, errEl: document.getElementById('error-phone'), key: 'phone' },
        { el: inputEmail, errEl: document.getElementById('error-email'), key: 'email' },
        { el: inputDate, errEl: document.getElementById('error-date'), key: 'date' },
        { el: selectCar, errEl: document.getElementById('error-car'), key: 'carId' },
      ];

      fields.forEach(f => {
        if (!f.el || !f.errEl) return;
        if (result.errors[f.key]) {
          f.el.classList.add('invalid');
          f.errEl.textContent = result.errors[f.key];
          f.errEl.classList.remove('hidden');
        } else {
          f.el.classList.remove('invalid');
          f.errEl.classList.add('hidden');
        }
      });

      // Enable or disable Submit button based on validation
      if (result.isValid) {
        submitBtn?.removeAttribute('disabled');
        submitBtn?.classList.remove('disabled');
      } else {
        submitBtn?.setAttribute('disabled', 'true');
        submitBtn?.classList.add('disabled');
      }

      return result;
    };

    // Attach listeners on blur and input
    [inputName, inputPhone, inputEmail, inputDate, selectCar, inputMsg].forEach(el => {
      el?.addEventListener('input', validateFormRealtime);
      el?.addEventListener('blur', validateFormRealtime);
    });

    submitBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      const result = validateFormRealtime();
      if (result.isValid) {
        sound.playClick(1800);
        modal?.classList.add('hidden');

        // Record VIP Inquiry to Dealership Inventory CRM
        const selectedCarLabel = selectCar?.options[selectCar.selectedIndex]?.text || result.sanitized.carId;
        inventory.addInquiry({
          clientName: result.sanitized.name,
          phone: result.sanitized.phone,
          email: result.sanitized.email,
          carName: selectedCarLabel,
          preferredDate: result.sanitized.date,
          deposit: '$5,000 USD (Authorized)',
          status: 'New Allocation Lead',
          submittedAt: new Date().toISOString().slice(0, 10),
          message: result.sanitized.message || 'VIP In-Person Private Viewing'
        });

        this.showToast(`Allocation confirmed for ${result.sanitized.name}! Registered in Dealer CRM.`);
      }
    });
  }

  captureSnapshot() {
    sound.playClick(2000);
    this.composer.render();
    const dataUrl = this.renderer.domElement.toDataURL('image/jpeg', 0.98);

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `AURA_WALK_STUDIO_${Date.now()}.jpg`;
    a.click();

    this.showToast('High-resolution 4K showroom snapshot saved to downloads!');
  }

  showToast(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    if (toast && toastMsg) {
      toastMsg.textContent = msg;
      toast.classList.remove('hidden');
      setTimeout(() => {
        toast.classList.add('hidden');
      }, 3500);
    }
  }

  simulateLoader() {
    let progress = 0;
    const bar = document.getElementById('loader-bar');
    const percent = document.getElementById('loader-percent');
    const text = document.getElementById('loader-text');

    const steps = [
      { p: 25, t: 'Loading architectural glass curtain wall & Reflector...' },
      { p: 55, t: 'Initializing motion tracker & collision physics...' },
      { p: 85, t: 'Calibrating input validator & vehicle proximity...' },
      { p: 100, t: 'Showroom ready. Enter Free Walk.' },
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        progress = steps[stepIndex].p;
        if (bar) bar.style.width = `${progress}%`;
        if (percent) percent.textContent = `${progress}%`;
        if (text) text.textContent = steps[stepIndex].t;
        stepIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          document.body.classList.remove('loading');
        }, 300);
      }
    }, 150);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const rawDelta = this.clock.getDelta();

    // 1. Update Showroom & Vehicle Animations
    this.showroom.update(rawDelta);
    this.vehicles.update(rawDelta);

    // 2. Update PRD Motion Tracking, Walk Physics & Collision
    this.motionTracker.update(rawDelta);

    // 3. Low FPS Adaptation (PRD Section 8: reduce pixel ratio if < 20 FPS, never slow physics)
    if (this.motionTracker.fps < 20 && this.renderer.getPixelRatio() > 1.0) {
      this.renderer.setPixelRatio(1.0);
    }

    // 4. Render Clean Architectural WebGL Scene (Zero White Reflections / Zero Bloom Flare)
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
