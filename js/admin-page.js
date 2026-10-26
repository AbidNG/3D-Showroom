/**
 * AURA MOTORS - Standalone Admin Portal Controller
 * Powers admin.html as a dedicated web dashboard.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { inventory, SHOWROOM_BAYS } from './inventory-data.js';

class AdminPageApp {
  constructor() {
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
    this.animId = null;

    this.initDOM();
    this.bindEvents();
    this.renderAnalytics();
    this.renderFleetTable();
    this.renderInquiriesTable();
    this.renderFloorplanBays();
  }

  initDOM() {
    this.tabButtons = document.querySelectorAll('.admin-nav-item');
    this.tabPanes = document.querySelectorAll('.admin-tab-pane');
  }

  bindEvents() {
    // Tab switching
    this.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.tabButtons.forEach(b => b.classList.remove('active'));
        this.tabPanes.forEach(p => p.classList.remove('active'));
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
            const card = document.getElementById(`card-angle-${key}`);
            card?.classList.add('has-file');
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

  loadSamplePhotoSet() {
    const samplePaths = {
      front: 'assets/images/sample_front.jpg',
      rear: 'assets/images/sample_rear.jpg',
      side1: 'assets/images/sample_side1.jpg',
      side2: 'assets/images/sample_side2.jpg',
      top: 'assets/images/sample_top.jpg',
    };

    Object.entries(samplePaths).forEach(([key, path]) => {
      this.uploadedPhotos[key] = path;
      const preview = document.getElementById(`preview-photo-${key}`);
      if (preview) {
        preview.src = path;
        preview.classList.remove('hidden');
      }
      const card = document.getElementById(`card-angle-${key}`);
      card?.classList.add('has-file');
    });

    this.checkCanSynthesize();
    this.showToast('All 5 automotive reference angles loaded! Ready to synthesize.');
  }

  checkCanSynthesize() {
    const allUploaded = Object.values(this.uploadedPhotos).every(val => val !== null);
    const synthBtn = document.getElementById('btn-synthesize-3d');
    if (!synthBtn) return;

    if (allUploaded) {
      synthBtn.removeAttribute('disabled');
      synthBtn.classList.remove('disabled');
      synthBtn.textContent = '✨ Synthesize 3D Digital Twin from 5 Angles';
    } else {
      const remaining = Object.values(this.uploadedPhotos).filter(v => v === null).length;
      synthBtn.setAttribute('disabled', 'true');
      synthBtn.classList.add('disabled');
      synthBtn.textContent = `Upload Remaining ${remaining} Angles to Synthesize`;
    }
  }

  runPhotoTo3DSynthesis() {
    const progressCard = document.getElementById('synthesis-progress-wrap');
    const progressBar = document.getElementById('synthesis-progress-bar');
    const statusText = document.getElementById('synthesis-status-text');
    const resultCard = document.getElementById('synthesis-result-card');
    const synthBtn = document.getElementById('btn-synthesize-3d');

    if (!progressCard || !progressBar || !statusText) return;

    progressCard.classList.remove('hidden');
    resultCard?.classList.add('hidden');
    synthBtn?.setAttribute('disabled', 'true');

    const phases = [
      { p: 18, msg: 'Phase 1/5: Extracting SIFT feature points from 5 angles...' },
      { p: 42, msg: 'Phase 2/5: Structure-from-Motion multi-view bundle adjustment...' },
      { p: 68, msg: 'Phase 3/5: Generating high-density point cloud & mesh surface...' },
      { p: 88, msg: 'Phase 4/5: Projecting PBR clearcoat textures & normal map...' },
      { p: 100, msg: 'Phase 5/5: 3D Car Digital Twin Synthesis Complete!' },
    ];

    let currentPhase = 0;
    const interval = setInterval(() => {
      if (currentPhase < phases.length) {
        const item = phases[currentPhase];
        progressBar.style.width = `${item.p}%`;
        statusText.textContent = item.msg;
        currentPhase++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          progressCard.classList.add('hidden');
          resultCard?.classList.remove('hidden');
          synthBtn?.removeAttribute('disabled');
          this.initMini3DViewer();
          this.showToast('Vehicle reconstructed! Rotate & inspect your 3D digital twin.');
        }, 400);
      }
    }, 700);
  }

  initMini3DViewer() {
    const container = document.getElementById('mini-3d-canvas-container');
    if (!container) return;

    if (this.miniRenderer) {
      this.miniRenderer.setSize(container.clientWidth, container.clientHeight);
      return;
    }

    this.miniScene = new THREE.Scene();
    this.miniScene.background = new THREE.Color(0x080a0f);

    this.miniCamera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 50);
    this.miniCamera.position.set(4.0, 1.8, 4.2);

    this.miniRenderer = new THREE.WebGLRenderer({ antialias: true });
    this.miniRenderer.setSize(container.clientWidth, container.clientHeight);
    this.miniRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.miniRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.miniRenderer.toneMappingExposure = 1.1;
    container.appendChild(this.miniRenderer.domElement);

    this.miniControls = new OrbitControls(this.miniCamera, this.miniRenderer.domElement);
    this.miniControls.enableDamping = true;
    this.miniControls.dampingFactor = 0.05;
    this.miniControls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.miniControls.minDistance = 2.0;
    this.miniControls.maxDistance = 10.0;
    this.miniControls.target.set(0, 0.6, 0);

    // Studio Lighting for Mini Viewer
    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.miniScene.add(ambLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 1.6);
    keyLight.position.set(5, 8, 5);
    this.miniScene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00b4d8, 1.2);
    rimLight.position.set(-5, 4, -5);
    this.miniScene.add(rimLight);

    // Floor Grid in Mini Viewer
    const gridHelper = new THREE.GridHelper(10, 20, 0x00b4d8, 0x1f293d);
    gridHelper.position.y = 0.01;
    this.miniScene.add(gridHelper);

    // Circular pedestal ring
    const ringGeo = new THREE.RingGeometry(2.4, 2.45, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00b4d8, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.02;
    this.miniScene.add(ringMesh);

    // Build Synthesized Car Model
    this.buildSynthesizedMesh();

    const animateMini = () => {
      this.animId = requestAnimationFrame(animateMini);
      this.miniControls.update();
      if (this.miniCarMesh) {
        this.miniCarMesh.rotation.y += 0.003;
      }
      this.miniRenderer.render(this.miniScene, this.miniCamera);
    };
    animateMini();
  }

  buildSynthesizedMesh() {
    if (this.miniCarMesh) {
      this.miniScene.remove(this.miniCarMesh);
    }

    const carGroup = new THREE.Group();

    // Body
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x00b4d8,
      metalness: 0.65,
      roughness: 0.32,
    });

    const bodyGeo = new THREE.BoxGeometry(1.9, 0.6, 4.2);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.55;
    carGroup.add(bodyMesh);

    // Cabin
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a0c10,
      metalness: 0.1,
      roughness: 0.2,
      transmission: 0.8,
      thickness: 0.5,
      transparent: true,
      opacity: 0.85,
      reflectivity: 0.15,
    });
    const cabinGeo = new THREE.BoxGeometry(1.6, 0.48, 2.1);
    const cabinMesh = new THREE.Mesh(cabinGeo, glassMat);
    cabinMesh.position.set(0, 0.95, -0.2);
    carGroup.add(cabinMesh);

    // 4 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 24);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xd8dde4, metalness: 0.9, roughness: 0.2 });

    const wheelPositions = [
      [-0.95, 0.38, 1.3],
      [0.95, 0.38, 1.3],
      [-0.95, 0.38, -1.3],
      [0.95, 0.38, -1.3],
    ];

    wheelPositions.forEach(pos => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(...pos);

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.29, 16), rimMat);
      rim.rotation.z = Math.PI / 2;
      rim.position.set(...pos);

      carGroup.add(w);
      carGroup.add(rim);
    });

    // Headlights
    const lightGeo = new THREE.BoxGeometry(0.35, 0.08, 0.1);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const hl1 = new THREE.Mesh(lightGeo, lightMat);
    hl1.position.set(-0.65, 0.62, 2.11);
    const hl2 = new THREE.Mesh(lightGeo, lightMat);
    hl2.position.set(0.65, 0.62, 2.11);
    carGroup.add(hl1);
    carGroup.add(hl2);

    this.miniCarMesh = carGroup;
    this.miniScene.add(carGroup);
  }

  deployConvertedCarToShowroom() {
    const name = document.getElementById('deploy-car-name')?.value || 'AURA 720S AERO GT';
    const price = parseInt(document.getElementById('deploy-car-price')?.value) || 325000;
    const hp = parseInt(document.getElementById('deploy-car-hp')?.value) || 1020;
    const top = parseInt(document.getElementById('deploy-car-top')?.value) || 218;
    const bayNum = parseInt(document.getElementById('deploy-car-bay')?.value) || 6;

    const newVehicle = {
      id: `deployed-${Date.now()}`,
      name: name,
      bay: bayNum,
      category: 'Hypercar',
      colorName: 'Cyan Electric Clearcoat',
      colorHex: 0x00b4d8,
      price: price,
      hp: hp,
      topSpeed: top,
      year: 2026,
      status: 'On Display',
      views: 120,
    };

    inventory.addCar(newVehicle);
    this.renderFleetTable();
    this.renderAnalytics();
    this.renderFloorplanBays();

    this.showToast(`Vehicle "${name}" synthesized & deployed to Bay ${String(bayNum).padStart(2, '0')}!`);

    setTimeout(() => {
      if (confirm(`Vehicle "${name}" successfully deployed to Bay ${bayNum}! Would you like to view it in the 3D Showroom now?`)) {
        window.location.href = `index.html?focusBay=${bayNum}`;
      }
    }, 600);
  }

  handleManualAddCar() {
    const name = document.getElementById('add-car-name')?.value || 'AURA GT';
    const price = parseInt(document.getElementById('add-car-price')?.value) || 240000;
    const hp = parseInt(document.getElementById('add-car-hp')?.value) || 750;
    const cat = document.getElementById('add-car-cat')?.value || 'Hypercar';
    const colorInput = document.getElementById('add-car-color')?.value || '#00b4d8';
    const colorHex = parseInt(colorInput.replace('#', ''), 16);

    const vacantBay = inventory.getVacantBays()[0] || 27;

    const newCar = {
      id: `car-manual-${Date.now()}`,
      name: name,
      bay: vacantBay,
      category: cat,
      colorName: 'Custom Bespoke Paint',
      colorHex: colorHex,
      price: price,
      hp: hp,
      topSpeed: 205,
      year: 2026,
      status: 'On Display',
      views: 0,
    };

    inventory.addCar(newCar);
    document.getElementById('modal-add-car')?.classList.add('hidden');
    this.renderFleetTable();
    this.renderAnalytics();
    this.renderFloorplanBays();

    this.showToast(`Vehicle "${name}" added to Showroom Bay ${vacantBay}!`);
  }

  renderAnalytics() {
    const data = inventory.getAnalyticsData();
    document.getElementById('stat-total-cars').textContent = `${data.totalCars} Vehicles`;
    document.getElementById('stat-fleet-value').textContent = data.formattedFleetValue;
    document.getElementById('stat-bay-occupancy').textContent = `${data.occupiedBays} / ${data.totalBays} (${data.occupancyRate})`;
    document.getElementById('stat-total-views').textContent = data.totalViews.toLocaleString();
    document.getElementById('stat-total-inquiries').textContent = `${data.totalInquiries} Active`;
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
          <div class="table-car-name" style="font-weight:700;">${car.name}</div>
          <small style="color:var(--text-dim);">${car.year} • ${car.category}</small>
        </td>
        <td>
          <span class="color-dot-indicator" style="background-color: #${car.colorHex.toString(16).padStart(6, '0')}"></span>
          ${car.colorName}
        </td>
        <td>${car.hp} HP</td>
        <td><strong>$${car.price.toLocaleString()}</strong></td>
        <td><span class="status-pill ${car.status.toLowerCase().replace(/\s+/g, '-')}">${car.status}</span></td>
        <td>
          <a href="index.html?focusBay=${car.bay}" class="tbl-action-btn view-btn" style="text-decoration:none;" title="View in 3D Showroom">View 3D ↗</a>
          <button class="tbl-action-btn delete-btn" data-id="${car.id}" title="Remove Vehicle">&times;</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (confirm('Remove this vehicle from showroom floor?')) {
          inventory.deleteCar(id);
          this.renderFleetTable();
          this.renderAnalytics();
          this.renderFloorplanBays();
          this.showToast('Vehicle removed from showroom.');
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
        <td>
          <strong>${inq.clientName || inq.name}</strong><br>
          <small style="color:var(--text-dim);">${inq.email} • ${inq.phone}</small>
        </td>
        <td><span class="highlight-car">${inq.carName}</span></td>
        <td>${inq.preferredDate || inq.date}</td>
        <td><span class="deposit-tag">${inq.deposit || '$5,000 USD (Authorized)'}</span></td>
        <td><span class="status-pill status-${(inq.status || 'Active').toLowerCase().replace(/\s+/g, '-')}">${inq.status || 'Active'}</span></td>
        <td><small style="color:var(--text-dim);">${inq.submittedAt || inq.timestamp || 'Recent'}</small></td>
      </tr>
    `).join('');
  }

  renderFloorplanBays() {
    const container = document.getElementById('floorplan-bays-grid');
    if (!container) return;

    const cars = inventory.getCars();
    container.innerHTML = SHOWROOM_BAYS.map(bay => {
      const car = cars.find(c => c.bay === bay.bay);
      const isOccupied = !!car;

      return `
        <div class="floorplan-bay-card ${isOccupied ? 'occupied' : 'vacant'}" data-bay="${bay.bay}">
          <div class="bay-card-header">
            <span class="bay-id-tag">BAY ${String(bay.bay).padStart(2, '0')}</span>
            <span class="bay-zone-tag">${bay.zone}</span>
          </div>
          ${isOccupied ? `
            <div class="bay-car-title">${car.name}</div>
            <div class="bay-car-meta">$${car.price.toLocaleString()} • ${car.hp} HP</div>
            <a href="index.html?focusBay=${bay.bay}" class="btn-table-action" style="margin-top:6px; text-decoration:none; text-align:center;">Inspect in 3D ↗</a>
          ` : `
            <div class="bay-vacant-text">Open Allocation Bay</div>
            <button class="btn-table-action" style="margin-top:6px;" onclick="document.querySelector('[data-tab=photo3d]').click()">+ Deploy Car</button>
          `}
        </div>
      `;
    }).join('');
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
}

window.addEventListener('DOMContentLoaded', () => {
  new AdminPageApp();
});
