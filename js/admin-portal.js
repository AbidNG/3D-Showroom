/**
 * AURA MOTORS - Enterprise Admin Portal & Photo-to-3D Neural Mesh Studio
 * Enables dealership admins to:
 * 1. Upload Front, Back, Side 1, Side 2, and Top photos
 * 2. Run multi-view photogrammetric reconstruction simulation into interactive 3D meshes
 * 3. Preview 3D converted vehicles in a dedicated WebGL studio
 * 4. Deploy converted cars directly to showroom exhibition bays (Bays 1-30)
 * 5. Manage 20-30 demo cars, inventory pricing, and VIP CRM reservation leads
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { inventory, SHOWROOM_BAYS } from './inventory-data.js';

export class AdminPortal {
  constructor(vehicleManager, showroom) {
    this.vehicles = vehicleManager;
    this.showroom = showroom;

    // Admin state
    this.currentTab = 'analytics';
    this.uploadedPhotos = {
      front: null,
      rear: null,
      side1: null,
      side2: null,
      top: null,
    };
    this.generatedModelData = null;

    // Mini 3D Preview Engine in Admin
    this.miniScene = null;
    this.miniCamera = null;
    this.miniRenderer = null;
    this.miniControls = null;
    this.miniCarMesh = null;

    this.initDOM();
    this.bindEvents();
    this.renderAnalytics();
    this.renderFleetTable();
    this.renderInquiriesTable();
    this.renderFloorplanBays();
  }

  initDOM() {
    this.viewShowroomBtn = document.getElementById('btn-nav-showroom');
    this.viewAdminBtn = document.getElementById('btn-nav-admin');
    this.showroomView = document.getElementById('canvas-container');
    this.showroomHUD = document.querySelector('.showroom-header');
    this.configDock = document.querySelector('.configurator-dock');
    this.telemetryHUD = document.getElementById('telemetry-panel');
    this.adminContainer = document.getElementById('admin-portal-view');
  }

  bindEvents() {
    // Mode Switcher: Showroom vs Admin Portal
    this.viewAdminBtn?.addEventListener('click', () => this.openAdmin());
    this.viewShowroomBtn?.addEventListener('click', () => this.closeAdmin());

    // Admin Sidebar Navigation Tabs
    document.querySelectorAll('.admin-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.admin-tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        this.currentTab = tab;
        document.getElementById(`tab-${tab}`)?.classList.add('active');

        if (tab === 'photo3d' && !this.miniRenderer) {
          setTimeout(() => this.initMini3DViewer(), 100);
        }
      });
    });

    // 1-Click Demo Photo Set Loader (Front, Rear, Side1, Side2, Top)
    const loadSampleBtn = document.getElementById('btn-load-sample-photos');
    loadSampleBtn?.addEventListener('click', () => this.loadSamplePhotoSet());

    // File Input Dropzones
    const angleKeys = ['front', 'rear', 'side1', 'side2', 'top'];
    angleKeys.forEach(key => {
      const input = document.getElementById(`input-photo-${key}`);
      const preview = document.getElementById(`preview-photo-${key}`);

      input?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            this.uploadedPhotos[key] = evt.target.result;
            if (preview) {
              preview.src = evt.target.result;
              preview.classList.remove('hidden');
            }
            this.checkCanSynthesize();
          };
          reader.readAsDataURL(file);
        }
      });
    });

    // Start 3D Photogrammetry Synthesis Button
    const synthesizeBtn = document.getElementById('btn-synthesize-3d');
    synthesizeBtn?.addEventListener('click', () => this.runPhotoTo3DSynthesis());

    // Deploy Converted 3D Car to Showroom Floor
    const deployBtn = document.getElementById('btn-deploy-to-showroom');
    deployBtn?.addEventListener('click', () => this.deployConvertedCarToShowroom());

    // Fleet Search & Filter
    const searchInput = document.getElementById('fleet-search');
    const filterCat = document.getElementById('fleet-filter-category');
    searchInput?.addEventListener('input', () => this.renderFleetTable());
    filterCat?.addEventListener('change', () => this.renderFleetTable());

    // Quick Add New Vehicle Modal
    document.getElementById('btn-open-add-car')?.addEventListener('click', () => {
      document.getElementById('modal-add-car')?.classList.remove('hidden');
    });
    document.getElementById('modal-add-car-close')?.addEventListener('click', () => {
      document.getElementById('modal-add-car')?.classList.add('hidden');
    });
    document.getElementById('form-add-car')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleManualAddCar();
    });
  }

  openAdmin() {
    this.adminContainer?.classList.remove('hidden');
    this.showroomHUD?.classList.add('hidden');
    this.configDock?.classList.add('hidden');
    this.telemetryHUD?.classList.add('hidden');
    document.getElementById('car-proximity-prompt')?.classList.add('hidden');

    this.renderAnalytics();
    this.renderFleetTable();
    this.renderInquiriesTable();
  }

  closeAdmin() {
    this.adminContainer?.classList.add('hidden');
    this.showroomHUD?.classList.remove('hidden');
    this.configDock?.classList.remove('hidden');
    this.telemetryHUD?.classList.remove('hidden');
  }

  // =========================================================================
  // Photo-to-3D Synthesis Engine
  // =========================================================================

  loadSamplePhotoSet() {
    const samples = {
      front: 'assets/images/sample_front.jpg',
      rear: 'assets/images/sample_rear.jpg',
      side1: 'assets/images/sample_side1.jpg',
      side2: 'assets/images/sample_side2.jpg',
      top: 'assets/images/sample_top.jpg',
    };

    Object.keys(samples).forEach(key => {
      this.uploadedPhotos[key] = samples[key];
      const preview = document.getElementById(`preview-photo-${key}`);
      if (preview) {
        preview.src = samples[key];
        preview.classList.remove('hidden');
      }
    });

    this.checkCanSynthesize();
  }

  checkCanSynthesize() {
    const btn = document.getElementById('btn-synthesize-3d');
    const allUploaded = Object.values(this.uploadedPhotos).every(val => val !== null);
    if (btn) {
      if (allUploaded) {
        btn.removeAttribute('disabled');
        btn.classList.remove('disabled');
        btn.textContent = 'Synthesize 3D Vehicle Mesh';
      } else {
        btn.setAttribute('disabled', 'true');
        btn.classList.add('disabled');
        btn.textContent = 'Upload All 5 Angles to Synthesize';
      }
    }
  }

  runPhotoTo3DSynthesis() {
    const progressWrap = document.getElementById('synthesis-progress-wrap');
    const progressBar = document.getElementById('synthesis-progress-bar');
    const progressStatus = document.getElementById('synthesis-status-text');
    const resultCard = document.getElementById('synthesis-result-card');
    const synthesizeBtn = document.getElementById('btn-synthesize-3d');

    progressWrap?.classList.remove('hidden');
    resultCard?.classList.add('hidden');
    synthesizeBtn?.setAttribute('disabled', 'true');

    const steps = [
      { p: 15, msg: 'Phase 1/5: Extracting silhouette edges & 32,000 SIFT keypoints...' },
      { p: 40, msg: 'Phase 2/5: Solving structure-from-motion (SfM) camera poses...' },
      { p: 65, msg: 'Phase 3/5: Generating high-density point cloud & Poisson surface mesh...' },
      { p: 85, msg: 'Phase 4/5: Projecting 4K multi-view textures & clearcoat PBR maps...' },
      { p: 100, msg: 'Phase 5/5: 3D Vehicle Digital Twin successfully synthesized!' },
    ];

    let step = 0;
    const interval = setInterval(() => {
      if (step < steps.length) {
        const item = steps[step];
        if (progressBar) progressBar.style.width = `${item.p}%`;
        if (progressStatus) progressStatus.textContent = item.msg;
        step++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          progressWrap?.classList.add('hidden');
          resultCard?.classList.remove('hidden');
          synthesizeBtn?.removeAttribute('disabled');

          // Initialize 3D preview of the converted car
          this.initMini3DViewer();
          this.loadSynthesizedCarInPreview();
        }, 500);
      }
    }, 700);
  }

  initMini3DViewer() {
    const container = document.getElementById('mini-3d-canvas-container');
    if (!container || this.miniRenderer) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 280;

    this.miniScene = new THREE.Scene();
    this.miniScene.background = new THREE.Color(0x0e1219);

    this.miniCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    this.miniCamera.position.set(3.5, 1.6, 4.2);

    this.miniRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.miniRenderer.setSize(width, height);
    this.miniRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.miniRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.miniRenderer.shadowMap.enabled = true;
    container.appendChild(this.miniRenderer.domElement);

    this.miniControls = new OrbitControls(this.miniCamera, this.miniRenderer.domElement);
    this.miniControls.enableDamping = true;
    this.miniControls.autoRotate = true;
    this.miniControls.autoRotateSpeed = 2.0;

    // Studio Lighting for Mini Viewer
    const amb = new THREE.AmbientLight(0xffffff, 1.2);
    this.miniScene.add(amb);

    const dir1 = new THREE.DirectionalLight(0xfffaed, 2.5);
    dir1.position.set(5, 8, 4);
    this.miniScene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0x70a5ff, 1.2);
    dir2.position.set(-5, 4, -4);
    this.miniScene.add(dir2);

    // Circular pedestal
    const plinthGeo = new THREE.CylinderGeometry(2.4, 2.5, 0.1, 32);
    const plinthMat = new THREE.MeshStandardMaterial({ color: 0x161a22, metalness: 0.5, roughness: 0.3 });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.y = -0.05;
    this.miniScene.add(plinth);

    const renderLoop = () => {
      requestAnimationFrame(renderLoop);
      if (this.miniControls) this.miniControls.update();
      if (this.miniRenderer && this.miniScene && this.miniCamera) {
        this.miniRenderer.render(this.miniScene, this.miniCamera);
      }
    };
    renderLoop();
  }

  loadSynthesizedCarInPreview() {
    if (!this.miniScene) return;

    if (this.miniCarMesh) {
      this.miniScene.remove(this.miniCarMesh);
    }

    // Clone high-poly car model from vehicle manager
    this.miniCarMesh = new THREE.Group();

    // Use vehicle manager's Ferrari model or synthesized geometry
    this.vehicles.gltfLoader.load('assets/models/ferrari.glb', (gltf) => {
      const model = gltf.scene.clone();
      model.scale.set(0.95, 0.95, 0.95);
      model.position.set(0, 0, 0);

      const bespokePaint = new THREE.MeshPhysicalMaterial({
        color: 0xd8dde4, // Liquid Quicksilver
        metalness: 0.9,
        roughness: 0.15,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
      });

      model.traverse(child => {
        if (child.isMesh && child.name.toLowerCase().includes('body')) {
          child.material = bespokePaint;
        }
      });

      this.miniCarMesh.add(model);
      this.miniScene.add(this.miniCarMesh);
    });

    // Populate default metadata for publication
    document.getElementById('deploy-car-name').value = 'AURA 720S AERO GT';
    document.getElementById('deploy-car-price').value = '325000';
    document.getElementById('deploy-car-hp').value = '1020';
    document.getElementById('deploy-car-top').value = '218';
    document.getElementById('deploy-car-bay').value = inventory.getNextOpenBay();
  }

  deployConvertedCarToShowroom() {
    const name = document.getElementById('deploy-car-name').value || 'AURA 720S AERO GT';
    const price = parseInt(document.getElementById('deploy-car-price').value) || 325000;
    const hp = parseInt(document.getElementById('deploy-car-hp').value) || 1020;
    const topSpeed = parseInt(document.getElementById('deploy-car-top').value) || 218;
    const bay = parseInt(document.getElementById('deploy-car-bay').value) || inventory.getNextOpenBay();

    const newCar = inventory.addCar({
      name,
      price,
      hp,
      topSpeed,
      zeroToSixty: 2.2,
      category: 'Hypercar',
      powertrain: '4.0L Twin-Turbo V8 + Dual Flux Motors',
      colorName: 'Liquid Quicksilver',
      colorHex: 0xd8dde4,
      finish: 'metallic',
      bay: bay,
      description: 'Synthesized from 5-angle studio photography into photorealistic 3D showroom twin.',
      photos: this.uploadedPhotos,
    });

    // Spawn directly into 3D Showroom scene
    this.vehicles.spawnCarAtBay(newCar, bay);

    alert(`Success! "${newCar.name}" has been converted to 3D and deployed to Showroom Exhibition Bay #${bay}!`);

    // Switch back to showroom view and focus newly added car
    this.closeAdmin();
    this.vehicles.focusCarAtBay(bay);
  }

  // =========================================================================
  // Executive Dealership Analytics & CRM
  // =========================================================================

  renderAnalytics() {
    const data = inventory.getAnalytics();

    document.getElementById('stat-total-cars').textContent = data.totalCars;
    document.getElementById('stat-fleet-value').textContent = `$${(data.totalValuation / 1000000).toFixed(1)}M`;
    document.getElementById('stat-bay-occupancy').textContent = `${data.occupiedBays} / ${data.totalBays} (${data.occupancyRate})`;
    document.getElementById('stat-total-views').textContent = data.totalViews.toLocaleString();
    document.getElementById('stat-total-inquiries').textContent = data.totalInquiries;
    document.getElementById('stat-top-car').textContent = data.mostPopularCar ? data.mostPopularCar.name : 'AURA APEX GT';
  }

  renderFleetTable() {
    const tbody = document.getElementById('fleet-table-body');
    if (!tbody) return;

    const searchTerm = (document.getElementById('fleet-search')?.value || '').toLowerCase();
    const catFilter = document.getElementById('fleet-filter-category')?.value || 'all';

    let cars = inventory.getCars();

    if (catFilter !== 'all') {
      cars = cars.filter(c => c.category === catFilter);
    }
    if (searchTerm) {
      cars = cars.filter(c => c.name.toLowerCase().includes(searchTerm) || c.colorName.toLowerCase().includes(searchTerm));
    }

    tbody.innerHTML = cars.map(car => `
      <tr>
        <td><strong>BAY ${String(car.bay).padStart(2, '0')}</strong></td>
        <td>
          <div class="table-car-name">${car.name}</div>
          <small class="table-sub">${car.year} • ${car.category}</small>
        </td>
        <td>
          <span class="color-dot-indicator" style="background-color: #${car.colorHex.toString(16).padStart(6, '0')}"></span>
          ${car.colorName}
        </td>
        <td>${car.hp} HP</td>
        <td><strong>$${car.price.toLocaleString()}</strong></td>
        <td><span class="status-pill ${car.status.toLowerCase().replace(/\s+/g, '-')}">${car.status}</span></td>
        <td>
          <button class="tbl-action-btn view-btn" data-bay="${car.bay}" title="View in 3D Showroom">View 3D</button>
          <button class="tbl-action-btn delete-btn" data-id="${car.id}" title="Remove Vehicle">&times;</button>
        </td>
      </tr>
    `).join('');

    // Attach actions
    tbody.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const bay = parseInt(btn.dataset.bay);
        this.closeAdmin();
        this.vehicles.focusCarAtBay(bay);
      });
    });

    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (confirm('Remove this vehicle from showroom floor?')) {
          inventory.deleteCar(id);
          this.vehicles.removeCarFromShowroom(id);
          this.renderFleetTable();
          this.renderAnalytics();
          this.renderFloorplanBays();
        }
      });
    });
  }

  renderInquiriesTable() {
    const tbody = document.getElementById('inquiries-table-body');
    if (!tbody) return;

    const inqs = inventory.getInquiries();
    tbody.innerHTML = inqs.map(inq => `
      <tr>
        <td><strong>${inq.name}</strong><br><small class="table-sub">${inq.email} • +91 ${inq.phone}</small></td>
        <td><span class="highlight-car">${inq.carName}</span></td>
        <td>${inq.date}</td>
        <td><span class="deposit-tag">${inq.deposit || '$5,000'}</span></td>
        <td><span class="status-pill status-${inq.status.toLowerCase().replace(/\s+/g, '-')}">${inq.status}</span></td>
        <td><small class="table-sub">${inq.timestamp || 'Recent'}</small></td>
      </tr>
    `).join('');
  }

  renderFloorplanBays() {
    const grid = document.getElementById('floorplan-bays-grid');
    if (!grid) return;

    grid.innerHTML = SHOWROOM_BAYS.map(b => {
      const car = inventory.getCarByBay(b.bay);
      const isOccupied = !!car;

      return `
        <div class="floorplan-bay-card ${isOccupied ? 'occupied' : 'empty'}">
          <div class="bay-card-top">
            <span class="bay-number">BAY ${String(b.bay).padStart(2, '0')}</span>
            <span class="bay-zone">${b.zone}</span>
          </div>
          <div class="bay-car-info">
            ${isOccupied ? `<strong>${car.name}</strong><small>$${car.price.toLocaleString()}</small>` : '<span class="empty-lbl">Available Bay</span>'}
          </div>
          ${isOccupied ? `<button class="btn-bay-inspect" data-bay="${b.bay}">Inspect in 3D</button>` : ''}
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.btn-bay-inspect').forEach(btn => {
      btn.addEventListener('click', () => {
        const bay = parseInt(btn.dataset.bay);
        this.closeAdmin();
        this.vehicles.focusCarAtBay(bay);
      });
    });
  }

  handleManualAddCar() {
    const name = document.getElementById('add-car-name').value;
    const price = parseInt(document.getElementById('add-car-price').value);
    const hp = parseInt(document.getElementById('add-car-hp').value);
    const category = document.getElementById('add-car-cat').value;
    const colorHexStr = document.getElementById('add-car-color').value.replace('#', '');
    const colorHex = parseInt(colorHexStr, 16);

    const newCar = inventory.addCar({
      name,
      price,
      hp,
      topSpeed: 210,
      zeroToSixty: 2.5,
      category,
      powertrain: 'Electric Dual-Motor AWD',
      colorName: 'Custom Bespoke',
      colorHex,
      finish: 'metallic',
      bay: inventory.getNextOpenBay(),
    });

    this.vehicles.spawnCarAtBay(newCar, newCar.bay);
    document.getElementById('modal-add-car')?.classList.add('hidden');
    this.renderFleetTable();
    this.renderAnalytics();
    this.renderFloorplanBays();
    alert(`Vehicle added and assigned to Bay #${newCar.bay}!`);
  }
}
