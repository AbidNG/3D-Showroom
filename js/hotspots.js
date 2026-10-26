/**
 * AURA MOTORS - 3D Interactive Hotspot (POI) System
 * Projects 3D world positions to 2D screen coordinates with smooth pulsing badges,
 * camera zoom transitions, and interactive technical modal sheets.
 */

import * as THREE from 'three';

export class HotspotManager {
  constructor(camera, controlsManager, soundEngine) {
    this.camera = camera;
    this.controls = controlsManager;
    this.sound = soundEngine;

    this.container = document.getElementById('hotspots-overlay');
    this.modal = document.getElementById('hotspot-modal');
    this.isVisible = true;

    // Hotspot Definitions on the Hero Vehicle (world space relative to turntable at -1.8, 0, 0)
    this.hotspots = [
      {
        id: 'engine',
        label: 'HYBRID V8',
        category: 'POWERTRAIN',
        title: '4.0L Twin-Turbo Flat-Plane V8 + Quad Electric Motors',
        desc: 'Mid-mounted twin-turbocharged dry-sump internal combustion engine paired with 800V axial-flux electric motors providing instant torque fill across the entire rev band.',
        stats: [
          { val: '1,050 HP', label: 'COMBINED OUTPUT' },
          { val: '9,200 RPM', label: 'REV LIMIT' },
          { val: '1,120 Nm', label: 'PEAK TORQUE' },
          { val: '2.1s', label: '0-60 MPH' },
        ],
        pos: new THREE.Vector3(-1.8, 0.88, -1.05),
        camView: 'hero',
      },
      {
        id: 'aero',
        label: 'ACTIVE WING',
        category: 'AERODYNAMICS',
        title: 'Dynamic DRS Active Aerodynamic Wing',
        desc: 'Dual-pylon electro-hydraulic rear wing with multi-stage air braking capability, dynamic angle-of-attack modulation, and integrated carbon fiber gurney flaps.',
        stats: [
          { val: '820 kg', label: 'DOWNFORCE @ 150MPH' },
          { val: '0.24 Cd', label: 'LOW-DRAG MODE' },
          { val: '+45°', label: 'AIR-BRAKE PITCH' },
          { val: '0.12s', label: 'DEPLOYMENT TIME' },
        ],
        pos: new THREE.Vector3(-1.8, 0.98, -1.95),
        camView: 'hero',
      },
      {
        id: 'brakes',
        label: 'CARBON BRAKES',
        category: 'CHASSIS & BRAKING',
        title: '410mm Carbon-Ceramic Matrix Discs',
        desc: 'Aircraft-grade cross-drilled carbon-silicon-carbide composite rotors clamped by lightweight 10-piston forged monoblock calipers.',
        stats: [
          { val: '410 mm', label: 'FRONT ROTOR DIA' },
          { val: '10-Piston', label: 'MONOBLOCK CALIPER' },
          { val: '98 ft', label: '60-0 MPH STOP' },
          { val: '1,000°C', label: 'MAX TEMP TOLERANCE' },
        ],
        pos: new THREE.Vector3(-2.8, 0.42, 1.35),
        camView: 'wheels',
      },
      {
        id: 'cockpit',
        label: 'GLASS COCKPIT',
        category: 'INTERIOR ATELIER',
        title: 'Bespoke Carbon Monocoque & OLED Cluster',
        desc: 'Hand-tailored lightweight Alcantara racing bucket seats, titanium rotary dials, curved high-refresh OLED glass instrument binnacle, and augmented HUD projection.',
        stats: [
          { val: 'Curved OLED', label: 'DISPLAYS' },
          { val: 'Carbon Core', label: 'SEAT SHELL' },
          { val: 'H-Point Low', label: 'ERGONOMICS' },
          { val: 'Active ANC', label: 'SOUND CANCEL' },
        ],
        pos: new THREE.Vector3(-1.8, 1.15, 0.35),
        camView: 'interior',
      },
      {
        id: 'matrix',
        label: 'MATRIX LASER',
        category: 'EXTERIOR ILLUMINATION',
        title: 'Ultra-High Intensity Matrix Laser Headlamps',
        desc: 'Individual micro-mirror digital beam projector units capable of carving illumination around oncoming traffic with razor-sharp precision.',
        stats: [
          { val: '650 m', label: 'BEAM RANGE' },
          { val: '1.3M Pixels', label: 'RESOLUTION' },
          { val: 'Adaptive', label: 'CORNERING BEAM' },
          { val: '10,000 cd', label: 'PEAK INTENSITY' },
        ],
        pos: new THREE.Vector3(-1.12, 0.62, 2.05),
        camView: 'hero',
      },
    ];

    this.domPins = [];
    this.createDomElements();
    this.bindEvents();
  }

  createDomElements() {
    if (!this.container) return;
    this.container.innerHTML = '';

    this.hotspots.forEach(hs => {
      const pin = document.createElement('div');
      pin.className = 'hotspot-pin';
      pin.dataset.id = hs.id;

      pin.innerHTML = `
        <div class="hotspot-ring"></div>
        <div class="hotspot-label-pill">${hs.label}</div>
      `;

      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openHotspotModal(hs);
      });

      this.container.appendChild(pin);
      this.domPins.push({ element: pin, data: hs });
    });
  }

  bindEvents() {
    const closeBtn = document.getElementById('hotspot-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.closeHotspotModal();
      });
    }

    // Close when clicking outside
    window.addEventListener('click', (e) => {
      if (this.modal && !this.modal.classList.contains('hidden')) {
        if (!this.modal.contains(e.target) && !e.target.closest('.hotspot-pin')) {
          this.closeHotspotModal();
        }
      }
    });
  }

  openHotspotModal(hs) {
    if (!this.modal) return;
    this.sound.playClick(1100);

    // Populate data
    document.getElementById('hotspot-category').textContent = hs.category;
    document.getElementById('hotspot-title').textContent = hs.title;
    document.getElementById('hotspot-desc').textContent = hs.desc;

    const statsWrap = document.getElementById('hotspot-stats');
    statsWrap.innerHTML = hs.stats
      .map(st => `
        <div class="hotspot-stat-item">
          <strong>${st.val}</strong>
          <span>${st.label}</span>
        </div>
      `)
      .join('');

    this.modal.classList.remove('hidden');

    // Smoothly focus camera if preset view available
    if (hs.camView) {
      this.controls.transitionTo(hs.camView);
    }
  }

  closeHotspotModal() {
    if (this.modal) {
      this.modal.classList.add('hidden');
    }
  }

  toggleVisibility() {
    this.isVisible = !this.isVisible;
    if (this.container) {
      this.container.style.display = this.isVisible ? 'block' : 'none';
    }
    if (!this.isVisible) {
      this.closeHotspotModal();
    }
    return this.isVisible;
  }

  /**
   * Project 3D coordinates to 2D screen positions each frame
   */
  update() {
    if (!this.isVisible || !this.camera) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const halfW = width / 2;
    const halfH = height / 2;

    const tempV = new THREE.Vector3();

    this.domPins.forEach(item => {
      tempV.copy(item.data.pos);
      tempV.project(this.camera);

      // Check if behind camera
      if (tempV.z > 1.0) {
        item.element.style.display = 'none';
        return;
      }

      item.element.style.display = 'flex';
      const screenX = tempV.x * halfW + halfW;
      const screenY = -(tempV.y * halfH) + halfH;

      item.element.style.left = `${screenX}px`;
      item.element.style.top = `${screenY}px`;
    });
  }
}
