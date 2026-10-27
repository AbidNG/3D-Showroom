import { SHOWROOM_BAYS } from './inventory-data.js';

const INQUIRY_STATUSES = ['New', 'Contacted', 'Qualified', 'Closed', 'Spam'];
const CATEGORIES = ['Hypercar', 'Grand Tourer', 'Luxury SUV', 'Concept'];
const CAR_STATUSES = ['Floor Display', 'Pre-Order', 'Reserved', 'Service'];
const PHOTO_KEYS = ['front', 'rear', 'side1', 'side2', 'top'];
const SAMPLE_PHOTOS = {
  front: 'assets/images/sample_front.jpg',
  rear: 'assets/images/sample_rear.jpg',
  side1: 'assets/images/sample_side1.jpg',
  side2: 'assets/images/sample_side2.jpg',
  top: 'assets/images/sample_top.jpg',
};

class AdminDashboard {
  constructor() {
    this.csrfToken = '';
    this.cars = [];
    this.inquiries = [];
    this.photoUrls = new Map();
    this.bindEvents();
    this.bootstrap();
  }

  async bootstrap() {
    try {
      const response = await fetch('/api/auth/session', { credentials: 'same-origin' });
      if (!response.ok) throw new Error('The dashboard service is unavailable.');
      const session = await response.json();
      this.csrfToken = session.csrfToken;
      if (session.authenticated) await this.showDashboard();
      else this.showLogin();
    } catch (error) {
      this.showLogin(error.message || 'Could not connect to the dashboard service.');
    }
  }

  bindEvents() {
    if (import.meta.env.DEV) {
      const showroomLink = document.getElementById('btn-return-showroom');
      if (showroomLink) showroomLink.href = 'http://localhost:5173/';
    }

    document.getElementById('admin-login-form')?.addEventListener('submit', event => this.login(event));
    document.getElementById('admin-logout')?.addEventListener('click', () => this.logout());
    document.getElementById('btn-export-inquiries')?.addEventListener('click', () => {
      window.location.assign('/api/admin/inquiries/export.csv');
    });

    document.querySelectorAll('.admin-nav-item').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.admin-nav-item').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.admin-tab-pane').forEach(pane => pane.classList.remove('active'));
        button.classList.add('active');
        document.getElementById(`tab-${button.dataset.tab}`)?.classList.add('active');
      });
    });

    document.getElementById('fleet-search')?.addEventListener('input', () => this.renderFleetTable());
    document.getElementById('fleet-filter-category')?.addEventListener('change', () => this.renderFleetTable());
    document.getElementById('btn-open-add-car')?.addEventListener('click', () => this.openVehicleForm());
    document.getElementById('modal-add-car-close')?.addEventListener('click', () => this.closeVehicleForm());
    document.getElementById('form-add-car')?.addEventListener('submit', event => this.saveVehicle(event));
    document.getElementById('fleet-table-body')?.addEventListener('click', event => this.handleFleetAction(event));
    document.getElementById('inquiries-table-body')?.addEventListener('change', event => this.updateInquiryStatus(event));
    document.getElementById('inquiries-table-body')?.addEventListener('click', event => this.handleInquiryAction(event));

    PHOTO_KEYS.forEach(key => {
      document.getElementById(`input-photo-${key}`)?.addEventListener('change', event => this.previewPhoto(key, event.target.files?.[0]));
    });
    document.getElementById('btn-load-sample-photos')?.addEventListener('click', () => this.loadSamplePhotos());
  }

  async request(path, { method = 'GET', body } = {}) {
    const headers = {};
    const options = { method, credentials: 'same-origin', headers };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      headers['X-CSRF-Token'] = this.csrfToken;
      options.body = JSON.stringify(body);
    }
    const response = await fetch(path, options);
    const result = response.headers.get('content-type')?.includes('application/json')
      ? await response.json()
      : null;
    if (response.status === 401 && path.startsWith('/api/admin/')) {
      this.showLogin('Your sign-in expired. Please sign in again.');
    }
    if (!response.ok) throw new Error(result?.error || 'The request could not be completed.');
    return result;
  }

  async login(event) {
    event.preventDefault();
    const passwordInput = document.getElementById('admin-password');
    const codeInput = document.getElementById('admin-totp-code');
    const button = document.getElementById('admin-login-submit');
    const error = document.getElementById('admin-login-error');
    error.textContent = '';
    button.disabled = true;
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': this.csrfToken },
        body: JSON.stringify({ password: passwordInput.value, code: codeInput.value }),
      });
      const result = await response.json().catch(() => ({}));
      passwordInput.value = '';
      codeInput.value = '';
      if (!response.ok) throw new Error(result.error || 'Sign in failed.');
      this.csrfToken = result.csrfToken;
      await this.showDashboard();
    } catch (cause) {
      error.textContent = cause.message || 'Sign in failed.';
      passwordInput.focus();
    } finally {
      button.disabled = false;
    }
  }

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST', body: {} });
    } catch (error) {
      this.showToast(error.message);
    }
    this.showLogin();
    this.bootstrap();
  }

  showLogin(message = '') {
    const login = document.getElementById('admin-login');
    const shell = document.getElementById('admin-shell');
    login.classList.remove('hidden');
    shell.classList.add('hidden');
    shell.setAttribute('aria-hidden', 'true');
    document.getElementById('admin-login-error').textContent = message;
    document.getElementById('admin-password').focus();
  }

  async showDashboard() {
    document.getElementById('admin-login').classList.add('hidden');
    const shell = document.getElementById('admin-shell');
    shell.classList.remove('hidden');
    shell.setAttribute('aria-hidden', 'false');
    await this.refreshDashboard();
  }

  async refreshDashboard() {
    try {
      const result = await this.request('/api/admin/dashboard');
      this.cars = result.cars;
      this.inquiries = result.inquiries;
      this.renderAnalytics(result.stats);
      this.renderFleetTable();
      this.renderInquiriesTable();
      this.renderFloorplan();
    } catch (error) {
      this.showToast(error.message);
    }
  }

  renderAnalytics(stats) {
    document.getElementById('stat-total-cars').textContent = `${stats.totalCars} Vehicles`;
    document.getElementById('stat-fleet-value').textContent = `$${stats.fleetValue.toLocaleString()}`;
    document.getElementById('stat-bay-occupancy').textContent = `${stats.occupiedBays} / ${stats.totalBays} (${Math.round(stats.occupiedBays / stats.totalBays * 100)}%)`;
    document.getElementById('stat-open-inquiries').textContent = String(stats.openInquiries);
    document.getElementById('stat-new-inquiries').textContent = String(stats.newInquiries);
    document.getElementById('stat-total-inquiries').textContent = String(stats.totalInquiries);
  }

  renderFleetTable() {
    const tbody = document.getElementById('fleet-table-body');
    if (!tbody) return;
    const term = document.getElementById('fleet-search').value.trim().toLocaleLowerCase();
    const category = document.getElementById('fleet-filter-category').value;
    const cars = this.cars.filter(car => {
      const matchesCategory = category === 'all' || car.category === category;
      const searchable = `${car.name} ${car.series || ''} ${car.colorName || ''}`.toLocaleLowerCase();
      return matchesCategory && searchable.includes(term);
    });
    tbody.replaceChildren();
    if (!cars.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 7;
      cell.textContent = 'No vehicles match this filter.';
      row.append(cell);
      tbody.append(row);
      return;
    }

    for (const car of cars) {
      const row = document.createElement('tr');
      this.addCell(row, `BAY ${String(car.bay).padStart(2, '0')}`, true);
      const nameCell = document.createElement('td');
      const name = document.createElement('div');
      name.className = 'table-car-name';
      name.textContent = car.name;
      const detail = document.createElement('small');
      detail.textContent = `${car.year} • ${car.series || car.category}`;
      nameCell.append(name, detail);
      row.append(nameCell);

      const paintCell = document.createElement('td');
      const dot = document.createElement('span');
      dot.className = 'color-dot-indicator';
      dot.style.backgroundColor = `#${Number(car.colorHex).toString(16).padStart(6, '0')}`;
      paintCell.append(dot, document.createTextNode(car.colorName || 'Custom paint'));
      row.append(paintCell);
      this.addCell(row, `${car.hp} HP`);
      this.addCell(row, `$${Number(car.price).toLocaleString()}`, true);
      this.addCell(row, car.status || 'Floor Display');

      const actions = document.createElement('td');
      const edit = this.actionButton('Edit', 'edit-car', car.id);
      const remove = this.actionButton('Remove', 'delete-car', car.id, 'tbl-action-btn delete-btn');
      actions.append(edit, document.createTextNode(' '), remove);
      row.append(actions);
      tbody.append(row);
    }
  }

  addCell(row, value, strong = false) {
    const cell = document.createElement('td');
    if (strong) {
      const node = document.createElement('strong');
      node.textContent = value;
      cell.append(node);
    } else cell.textContent = value;
    row.append(cell);
  }

  actionButton(label, action, id, className = 'tbl-action-btn') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    button.dataset.action = action;
    button.dataset.id = id;
    return button;
  }

  async handleFleetAction(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const car = this.cars.find(item => item.id === button.dataset.id);
    if (!car) return;
    if (button.dataset.action === 'edit-car') return this.openVehicleForm(car);
    if (button.dataset.action === 'delete-car' && window.confirm(`Remove ${car.name} from the showroom?`)) {
      try {
        await this.request(`/api/admin/cars/${encodeURIComponent(car.id)}`, { method: 'DELETE', body: {} });
        await this.refreshDashboard();
        this.showToast('Vehicle removed.');
      } catch (error) { this.showToast(error.message); }
    }
  }

  openVehicleForm(car = null, suggestedBay = null) {
    const form = document.getElementById('form-add-car');
    form.dataset.carId = car?.id || '';
    document.getElementById('vehicle-modal-title').textContent = car ? 'Edit Vehicle' : 'Register Vehicle';
    document.getElementById('vehicle-save-button').textContent = car ? 'Save changes' : 'Add vehicle';
    document.getElementById('vehicle-form-error').classList.add('hidden');
    document.getElementById('add-car-name').value = car?.name || '';
    document.getElementById('add-car-series').value = car?.series || '';
    document.getElementById('add-car-year').value = String(car?.year || new Date().getFullYear());
    document.getElementById('add-car-price').value = String(car?.price ?? '');
    document.getElementById('add-car-hp').value = String(car?.hp ?? '');
    document.getElementById('add-car-top-speed').value = String(car?.topSpeed ?? '');
    document.getElementById('add-car-cat').value = CATEGORIES.includes(car?.category) ? car.category : 'Hypercar';
    document.getElementById('add-car-status').value = CAR_STATUSES.includes(car?.status) ? car.status : 'Floor Display';
    document.getElementById('add-car-color').value = `#${Number(car?.colorHex ?? 0x00b4d8).toString(16).padStart(6, '0')}`;

    const baySelect = document.getElementById('add-car-bay');
    baySelect.replaceChildren();
    const auto = document.createElement('option');
    auto.value = '';
    auto.textContent = 'Automatically assign an open bay';
    baySelect.append(auto);
    const occupied = new Map(this.cars.map(item => [item.bay, item.id]));
    for (const slot of SHOWROOM_BAYS) {
      if (occupied.has(slot.bay) && occupied.get(slot.bay) !== car?.id) continue;
      const option = document.createElement('option');
      option.value = String(slot.bay);
      option.textContent = `Bay ${String(slot.bay).padStart(2, '0')} · ${slot.zone}`;
      baySelect.append(option);
    }
    baySelect.value = String(car?.bay ?? suggestedBay ?? '');
    document.getElementById('modal-add-car').classList.remove('hidden');
    document.getElementById('add-car-name').focus();
  }

  closeVehicleForm() {
    document.getElementById('modal-add-car').classList.add('hidden');
  }

  async saveVehicle(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const error = document.getElementById('vehicle-form-error');
    const button = document.getElementById('vehicle-save-button');
    error.textContent = '';
    error.classList.add('hidden');
    button.disabled = true;
    const color = document.getElementById('add-car-color').value;
    const payload = {
      name: document.getElementById('add-car-name').value,
      series: document.getElementById('add-car-series').value,
      year: Number(document.getElementById('add-car-year').value),
      bay: document.getElementById('add-car-bay').value ? Number(document.getElementById('add-car-bay').value) : null,
      price: Number(document.getElementById('add-car-price').value),
      hp: Number(document.getElementById('add-car-hp').value),
      topSpeed: Number(document.getElementById('add-car-top-speed').value),
      category: document.getElementById('add-car-cat').value,
      colorHex: color,
      colorName: 'Custom Paint',
      status: document.getElementById('add-car-status').value,
      finish: 'metallic',
    };
    try {
      const carId = form.dataset.carId;
      await this.request(carId ? `/api/admin/cars/${encodeURIComponent(carId)}` : '/api/admin/cars', {
        method: carId ? 'PATCH' : 'POST',
        body: payload,
      });
      this.closeVehicleForm();
      await this.refreshDashboard();
      this.showToast(carId ? 'Vehicle updated.' : 'Vehicle added.');
    } catch (cause) {
      error.textContent = cause.message;
      error.classList.remove('hidden');
    } finally {
      button.disabled = false;
    }
  }

  renderInquiriesTable() {
    const tbody = document.getElementById('inquiries-table-body');
    tbody.replaceChildren();
    if (!this.inquiries.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 7;
      cell.textContent = 'No inquiries have been submitted yet.';
      row.append(cell);
      tbody.append(row);
      return;
    }
    for (const inquiry of this.inquiries) {
      const row = document.createElement('tr');
      const contact = document.createElement('td');
      const name = document.createElement('strong');
      name.textContent = inquiry.name;
      const details = document.createElement('small');
      details.textContent = `${inquiry.email} • ${inquiry.phone}`;
      contact.append(name, document.createElement('br'), details);
      row.append(contact);
      this.addCell(row, inquiry.carName);
      this.addCell(row, inquiry.preferredDate);
      const message = document.createElement('td');
      message.className = 'inquiry-message';
      message.textContent = inquiry.message || 'No message provided';
      row.append(message);

      const statusCell = document.createElement('td');
      const select = document.createElement('select');
      select.dataset.inquiryId = inquiry.id;
      select.setAttribute('aria-label', `Status for ${inquiry.name}`);
      for (const status of INQUIRY_STATUSES) {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        select.append(option);
      }
      select.value = INQUIRY_STATUSES.includes(inquiry.status) ? inquiry.status : 'New';
      statusCell.append(select);
      row.append(statusCell);
      this.addCell(row, new Date(inquiry.createdAt).toLocaleString());
      const actions = document.createElement('td');
      actions.append(this.actionButton('Delete', 'delete-inquiry', inquiry.id, 'tbl-action-btn delete-btn'));
      row.append(actions);
      tbody.append(row);
    }
  }

  async updateInquiryStatus(event) {
    const select = event.target.closest('select[data-inquiry-id]');
    if (!select) return;
    try {
      await this.request(`/api/admin/inquiries/${encodeURIComponent(select.dataset.inquiryId)}`, {
        method: 'PATCH', body: { status: select.value },
      });
      await this.refreshDashboard();
      this.showToast('Inquiry status updated.');
    } catch (error) {
      this.showToast(error.message);
      await this.refreshDashboard();
    }
  }

  async handleInquiryAction(event) {
    const button = event.target.closest('button[data-action="delete-inquiry"]');
    if (!button || !window.confirm('Delete this inquiry permanently?')) return;
    try {
      await this.request(`/api/admin/inquiries/${encodeURIComponent(button.dataset.id)}`, { method: 'DELETE', body: {} });
      await this.refreshDashboard();
      this.showToast('Inquiry deleted.');
    } catch (error) { this.showToast(error.message); }
  }

  renderFloorplan() {
    const container = document.getElementById('floorplan-bays-grid');
    container.replaceChildren();
    for (const bay of SHOWROOM_BAYS) {
      const card = document.createElement('article');
      card.className = `floorplan-bay-card ${this.cars.some(car => car.bay === bay.bay) ? 'occupied' : 'vacant'}`;
      const heading = document.createElement('div');
      heading.className = 'bay-card-header';
      const id = document.createElement('span');
      id.className = 'bay-id-tag';
      id.textContent = `BAY ${String(bay.bay).padStart(2, '0')}`;
      const zone = document.createElement('span');
      zone.className = 'bay-zone-tag';
      zone.textContent = bay.zone;
      heading.append(id, zone);
      card.append(heading);
      const car = this.cars.find(item => item.bay === bay.bay);
      const title = document.createElement('div');
      title.className = car ? 'bay-car-title' : 'bay-vacant-text';
      title.textContent = car?.name || 'Open allocation bay';
      card.append(title);
      if (car) {
        const meta = document.createElement('div');
        meta.className = 'bay-car-meta';
        meta.textContent = `$${Number(car.price).toLocaleString()} • ${car.hp} HP`;
        card.append(meta);
      }
      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'btn-table-action';
      action.textContent = car ? 'Edit vehicle' : 'Add vehicle';
      action.addEventListener('click', () => this.openVehicleForm(car || null, bay.bay));
      card.append(action);
      container.append(card);
    }
  }

  previewPhoto(key, file) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
      this.showToast('Choose a JPEG, PNG, or WebP image under 8 MB.');
      return;
    }
    const oldUrl = this.photoUrls.get(key);
    if (oldUrl) URL.revokeObjectURL(oldUrl);
    const objectUrl = URL.createObjectURL(file);
    this.photoUrls.set(key, objectUrl);
    const image = document.getElementById(`preview-photo-${key}`);
    image.src = objectUrl;
    image.classList.remove('hidden');
    document.getElementById(`card-angle-${key}`).classList.add('has-file');
  }

  loadSamplePhotos() {
    for (const key of PHOTO_KEYS) {
      const image = document.getElementById(`preview-photo-${key}`);
      const oldUrl = this.photoUrls.get(key);
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      this.photoUrls.delete(key);
      image.src = SAMPLE_PHOTOS[key];
      image.classList.remove('hidden');
      document.getElementById(`card-angle-${key}`).classList.add('has-file');
    }
    this.showToast('Sample images loaded for this tab only.');
  }

  showToast(message) {
    const toast = document.getElementById('toast');
    const target = document.getElementById('toast-message');
    target.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3500);
  }
}

window.addEventListener('DOMContentLoaded', () => new AdminDashboard());
