/**
 * AURA MOTORS - Input Validation & Sanitization Engine
 * PRD Section 7 Compliance:
 * - 7.1 Movement and Look Input Validation (key whitelisting, mouse delta capping, dt clamping, stuck-key prevention)
 * - 7.2 Form Entries Validation (Name, Phone +91, Email, 60-day Date window, Car ID, Message sanitization)
 */

export class InputValidator {
  constructor() {
    // 7.1 Sensitivity & Speed Presets
    this.sensitivity = 1.0;
    this.speedPreset = 'walk'; // 'walk' (1.4 m/s) or 'run' (2.8 m/s)

    // Allowed movement keys whitelist (preserves browser shortcuts like Ctrl+R, F5, etc.)
    this.allowedKeys = new Set([
      'KeyW', 'KeyA', 'KeyS', 'KeyD',
      'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight',
      'ShiftLeft', 'ShiftRight',
      'KeyE', 'Escape', 'Space'
    ]);

    // Active held key states
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      run: false,
      interact: false,
    };

    // Flag to disable movement when user types in form fields
    this.isInputFocused = false;

    // Callbacks
    this.onInteract = null;
    this.onEscape = null;
    this.onRunToggle = null;

    this.bindWindowEvents();
    this.bindFormFocusEvents();
  }

  // =========================================================================
  // 7.1 Movement & Look Validation
  // =========================================================================

  bindWindowEvents() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));

    // Clear all held inputs on blur or tab visibility change (PRD Section 5 & 7 stuck-key prevention)
    window.addEventListener('blur', () => this.clearHeldInputs());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.clearHeldInputs();
      }
    });

    // Handle touch cancel
    window.addEventListener('touchcancel', () => this.clearHeldInputs());
  }

  bindFormFocusEvents() {
    // Whenever an input field is focused, block WASD movement from moving the avatar
    document.addEventListener('focusin', (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        this.isInputFocused = true;
        this.clearHeldInputs();
      }
    });

    document.addEventListener('focusout', (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        this.isInputFocused = false;
      }
    });
  }

  handleKeyDown(e) {
    // If typing in a form or dialog, do not process 3D movement
    if (this.isInputFocused) return;

    // Never intercept standard browser shortcuts
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === 'F5' || e.code === 'F11' || e.code === 'F12') return;

    // Ignore unmapped keys
    if (!this.allowedKeys.has(e.code)) return;

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.run = true;
        break;
      case 'KeyE':
        if (!e.repeat && this.onInteract) {
          this.onInteract();
        }
        break;
      case 'Escape':
        if (this.onEscape) {
          this.onEscape();
        }
        break;
    }
  }

  handleKeyUp(e) {
    if (this.isInputFocused) return;

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.run = false;
        break;
    }
  }

  /**
   * Immediately resets all held states to prevent "stuck key" drift
   */
  clearHeldInputs() {
    this.keys.forward = false;
    this.keys.backward = false;
    this.keys.left = false;
    this.keys.right = false;
    this.keys.run = false;
  }

  /**
   * Validates and caps mouse delta to discard spikes from pointer-lock refocus (PRD 7.1)
   */
  validateMouseDelta(rawDeltaX, rawDeltaY) {
    if (typeof rawDeltaX !== 'number' || typeof rawDeltaY !== 'number' || isNaN(rawDeltaX) || isNaN(rawDeltaY)) {
      return { dx: 0, dy: 0 };
    }

    // Cap delta per frame to ±200px
    const MAX_SPIKE = 200;
    const dx = Math.max(-MAX_SPIKE, Math.min(MAX_SPIKE, rawDeltaX));
    const dy = Math.max(-MAX_SPIKE, Math.min(MAX_SPIKE, rawDeltaY));

    return {
      dx: dx * this.sensitivity * 0.002,
      dy: dy * this.sensitivity * 0.002,
    };
  }

  /**
   * Clamps look sensitivity setting between 0.1 and 3.0 (default 1.0)
   */
  setSensitivity(val) {
    const num = parseFloat(val);
    if (isNaN(num)) {
      this.sensitivity = 1.0;
    } else {
      this.sensitivity = Math.max(0.1, Math.min(3.0, num));
    }
    return this.sensitivity;
  }

  /**
   * Validates and clamps delta time (PRD 7.1: 0 < dt <= 0.1s)
   */
  validateDeltaTime(rawDt) {
    if (typeof rawDt !== 'number' || isNaN(rawDt) || rawDt <= 0) {
      return 0.016; // default fallback 60fps frame
    }
    // Prevent wall-clipping jumps after tab hidden
    return Math.min(rawDt, 0.1);
  }

  // =========================================================================
  // 7.2 Form Entries Validation (VIP Reservation & Test-Drive)
  // =========================================================================

  /**
   * Validates full form data according to PRD 7.2 rules
   */
  validateBookingForm(formData) {
    const errors = {};

    // 1. Name: Required, 2-60 chars, letters, spaces, hyphens, apostrophes
    const name = (formData.name || '').trim();
    const nameRegex = /^[a-zA-Z\s'\-]{2,60}$/;
    if (!name) {
      errors.name = 'Please enter your name.';
    } else if (!nameRegex.test(name)) {
      errors.name = 'Name must be 2–60 characters (letters, spaces, hyphens, apostrophes only).';
    }

    // 2. Phone: Required, 10 digits for India (+91 optional), digits only after stripping spaces/dashes
    const rawPhone = (formData.phone || '').trim();
    // Strip spaces, dashes, parentheses
    const cleanPhone = rawPhone.replace(/[\s\-\(\)]/g, '');
    // Check if starts with +91 or 91
    let localDigits = cleanPhone;
    if (localDigits.startsWith('+91')) {
      localDigits = localDigits.substring(3);
    } else if (localDigits.startsWith('91') && localDigits.length === 12) {
      localDigits = localDigits.substring(2);
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!rawPhone) {
      errors.phone = 'Enter a valid 10-digit mobile number.';
    } else if (!phoneRegex.test(localDigits)) {
      errors.phone = 'Enter a valid 10-digit mobile number (starts with 6, 7, 8, or 9).';
    }

    // 3. Email: Required, standard email format, max 254 chars
    const email = (formData.email || '').trim();
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
    if (!email) {
      errors.email = 'Enter a valid email address.';
    } else if (email.length > 254 || !emailRegex.test(email)) {
      errors.email = 'Enter a valid email address.';
    }

    // 4. Preferred Date: Today or later, within next 60 days
    const dateStr = (formData.date || '').trim();
    if (!dateStr) {
      errors.date = 'Choose a date within the next 60 days.';
    } else {
      const selectedDate = new Date(dateStr);
      selectedDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const maxDate = new Date();
      maxDate.setDate(today.getDate() + 60);
      maxDate.setHours(23, 59, 59, 999);

      if (isNaN(selectedDate.getTime()) || selectedDate < today || selectedDate > maxDate) {
        errors.date = 'Choose a date within the next 60 days.';
      }
    }

    // 5. Car selection: Must be an existing car ID
    const validCarIds = ['apex', 'veloce', 'stratos'];
    if (!formData.carId || !validCarIds.includes(formData.carId.toLowerCase())) {
      errors.carId = 'Please select a car from the list.';
    }

    // 6. Message: Optional, max 500 chars, strip HTML/script
    const rawMsg = formData.message || '';
    if (rawMsg.length > 500) {
      errors.message = 'Message is too long (max 500 characters).';
    }

    const sanitizedMessage = this.sanitizeHtml(rawMsg);

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        name,
        phone: localDigits,
        email,
        date: dateStr,
        carId: formData.carId,
        message: sanitizedMessage,
      }
    };
  }

  /**
   * Strips HTML/script tags (PRD 7.2 sanitization)
   */
  sanitizeHtml(str) {
    if (!str) return '';
    return str
      .replace(/<[^>]*>?/gm, '') // Strip HTML tags
      .replace(/[<>&"']/g, (m) => {
        return {
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          '"': '&quot;',
          "'": '&#39;',
        }[m];
      })
      .trim();
  }
}
