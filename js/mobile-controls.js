/**
 * AURA MOTORS - Mobile Touch & Virtual Joystick Controller
 * PRD Section 4.2 & 5 Compliance:
 * - Left touch joystick zone (forward/back/strafe)
 * - Right touch drag look zone with clamped sensitivity
 * - Touch action buttons: ▲ ◄ ▼ ►, Run toggle, Interact, Menu, Next/Prev Car
 * - Multi-touch conflict prevention & touchcancel safety cleanup
 */

export class MobileController {
  constructor(motionTracker, inputValidator) {
    this.tracker = motionTracker;
    this.input = inputValidator;

    this.joystickZone = document.getElementById('mobile-joystick-zone');
    this.joystickKnob = document.getElementById('joystick-knob');
    this.lookZone = document.getElementById('mobile-look-zone');

    this.joystickActive = false;
    this.joystickTouchId = null;
    this.joystickCenter = { x: 0, y: 0 };
    this.maxRadius = 45; // pixels

    this.lookTouchId = null;
    this.lastLookTouch = { x: 0, y: 0 };

    this.initTouchControls();
    this.initActionButtons();
  }

  initTouchControls() {
    if (!this.joystickZone || !this.lookZone) return;

    // 1. Virtual Joystick (Left Zone)
    this.joystickZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.joystickActive) return;

      const touch = e.changedTouches[0];
      this.joystickTouchId = touch.identifier;
      this.joystickActive = true;

      const rect = this.joystickZone.getBoundingClientRect();
      this.joystickCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };

      this.updateJoystickPosition(touch.clientX, touch.clientY);
    }, { passive: false });

    this.joystickZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!this.joystickActive) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joystickTouchId) {
          this.updateJoystickPosition(touch.clientX, touch.clientY);
          break;
        }
      }
    }, { passive: false });

    const stopJoystick = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.joystickTouchId) {
          this.joystickActive = false;
          this.joystickTouchId = null;
          if (this.joystickKnob) {
            this.joystickKnob.style.transform = 'translate(0px, 0px)';
          }
          this.input.keys.forward = false;
          this.input.keys.backward = false;
          this.input.keys.left = false;
          this.input.keys.right = false;
          break;
        }
      }
    };

    this.joystickZone.addEventListener('touchend', stopJoystick);
    this.joystickZone.addEventListener('touchcancel', stopJoystick);

    // 2. Touch Drag Look (Right Zone)
    this.lookZone.addEventListener('touchstart', (e) => {
      if (this.lookTouchId !== null) return;
      const touch = e.changedTouches[0];
      this.lookTouchId = touch.identifier;
      this.lastLookTouch = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });

    this.lookZone.addEventListener('touchmove', (e) => {
      if (this.lookTouchId === null) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.lookTouchId) {
          const deltaX = touch.clientX - this.lastLookTouch.x;
          const deltaY = touch.clientY - this.lastLookTouch.y;

          const { dx, dy } = this.input.validateMouseDelta(deltaX, deltaY);

          this.tracker.yaw -= dx * 1.5;
          this.tracker.pitch -= dy * 1.5;
          this.tracker.pitch = Math.max(-this.tracker.MAX_PITCH, Math.min(this.tracker.MAX_PITCH, this.tracker.pitch));
          this.tracker.yaw = (this.tracker.yaw + Math.PI * 2) % (Math.PI * 2);

          this.lastLookTouch = { x: touch.clientX, y: touch.clientY };
          break;
        }
      }
    }, { passive: true });

    const stopLook = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.lookTouchId) {
          this.lookTouchId = null;
          break;
        }
      }
    };

    this.lookZone.addEventListener('touchend', stopLook);
    this.lookZone.addEventListener('touchcancel', stopLook);
  }

  updateJoystickPosition(clientX, clientY) {
    const dx = clientX - this.joystickCenter.x;
    const dy = clientY - this.joystickCenter.y;
    const dist = Math.hypot(dx, dy);

    const clampedDist = Math.min(this.maxRadius, dist);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    if (this.joystickKnob) {
      this.joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;
    }

    // Deadzone (15%)
    if (clampedDist < 8) {
      this.input.keys.forward = false;
      this.input.keys.backward = false;
      this.input.keys.left = false;
      this.input.keys.right = false;
      return;
    }

    // Normalize -1 to 1
    const normX = knobX / this.maxRadius;
    const normY = knobY / this.maxRadius;

    this.input.keys.forward = (normY < -0.3);
    this.input.keys.backward = (normY > 0.3);
    this.input.keys.left = (normX < -0.3);
    this.input.keys.right = (normX > 0.3);
  }

  initActionButtons() {
    // 1. Mobile Run Toggle Button (PRD Section 4.2 & 5)
    const runBtn = document.getElementById('mobile-btn-run');
    runBtn?.addEventListener('click', () => {
      this.input.keys.run = !this.input.keys.run;
      runBtn.classList.toggle('active', this.input.keys.run);
      this.tracker.sound.playClick(1500);
    });

    // 2. Mobile On-screen D-Pad Directional Buttons (▲ ◄ ▼ ►)
    const dpadButtons = [
      { id: 'dpad-up', key: 'forward' },
      { id: 'dpad-down', key: 'backward' },
      { id: 'dpad-left', key: 'left' },
      { id: 'dpad-right', key: 'right' },
    ];

    dpadButtons.forEach(btnDef => {
      const el = document.getElementById(btnDef.id);
      if (!el) return;

      const press = (e) => {
        e.preventDefault();
        this.input.keys[btnDef.key] = true;
        el.classList.add('pressed');
      };

      const release = (e) => {
        e.preventDefault();
        this.input.keys[btnDef.key] = false;
        el.classList.remove('pressed');
      };

      el.addEventListener('touchstart', press);
      el.addEventListener('touchend', release);
      el.addEventListener('touchcancel', release);
      el.addEventListener('mousedown', press);
      el.addEventListener('mouseup', release);
      el.addEventListener('mouseleave', release);
    });

    // 3. Mobile Inspect Button
    const inspectBtn = document.getElementById('mobile-btn-interact');
    inspectBtn?.addEventListener('click', () => {
      this.tracker.handleInteractKey();
    });

    // 4. Mobile Menu / Pause
    const menuBtn = document.getElementById('mobile-btn-menu');
    menuBtn?.addEventListener('click', () => {
      if (this.tracker.mode === 'PAUSED') {
        this.tracker.resume();
      } else {
        this.tracker.pause();
      }
    });
  }
}
