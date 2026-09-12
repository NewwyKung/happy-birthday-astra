(() => {
  'use strict';
  const byId = (id) => document.getElementById(id);
  const dialog = byId('wish-dialog');
  const form = byId('wish-form');
  const input = byId('wish-text');
  const stage = byId('cake-stage');
  const tilt = byId('cake-tilt');
  const birthday = document.querySelector('.birthday');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const soundToggle = byId('sound-toggle');
  let state = 'ready';
  let soundEnabled = false;
  let audioContext;
  let celebrationTimer;
  let confettiFrame;

  function announce(message) { byId('announcement').textContent = message; }

  async function playChime(celebrating = false) {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw new Error('Audio not supported');
      audioContext ||= new AudioContext();
      if (audioContext.state === 'suspended') await audioContext.resume();
      if (!soundEnabled) return;
      const notes = celebrating ? [523.25, 659.25, 783.99, 1046.5, 1318.5, 1046.5] : [659.25, 783.99, 1046.5];
      const now = audioContext.currentTime;
      notes.forEach((frequency, index) => {
        const start = now + index * .15;
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(.065, start + .025);
        gain.gain.exponentialRampToValueAtTime(.001, start + .85);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(start);
        oscillator.stop(start + .9);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      });
    } catch {
      soundEnabled = false;
      updateSoundButton();
      announce('อุปกรณ์นี้ยังเล่นเสียงไม่ได้ แต่เล่นเซอร์ไพรส์ต่อได้เลย');
    }
  }

  function updateSoundButton() {
    soundToggle.setAttribute('aria-pressed', String(soundEnabled));
    soundToggle.setAttribute('aria-label', soundEnabled ? 'ปิดเสียง' : 'เปิดเสียง');
    byId('sound-label').textContent = soundEnabled ? 'ปิดเสียง' : 'เปิดเสียง';
  }

  soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    updateSoundButton();
    if (soundEnabled) {
      void playChime();
    } else if (audioContext?.state === 'running') {
      void audioContext.suspend().catch(() => {});
    }
  });

  byId('open-wish').addEventListener('click', () => {
    if (state !== 'ready') return;
    byId('wish-error').textContent = '';
    dialog.showModal();
    input.focus();
    void playChime();
  });
  byId('close-wish').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  input.addEventListener('input', () => {
    byId('character-count').textContent = `${input.value.length} / 280`;
    byId('wish-error').textContent = '';
    input.removeAttribute('aria-invalid');
  });

  function confetti() {
    if (reducedMotion.matches) return;
    const canvas = byId('confetti');
    const context = canvas.getContext('2d');
    if (!context) return;
    cancelAnimationFrame(confettiFrame);
    const width = window.innerWidth;
    const height = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const colors = ['#ef8437', '#f3bf49', '#ffd18e', '#ffa68a', '#ddaa4e', '#fffef2'];
    const pieces = Array.from({ length: width < 600 ? 90 : 150 }, () => ({
      x: width / 2, y: height * .5,
      vx: (Math.random() - .5) * (width < 600 ? 13 : 22),
      vy: -5 - Math.random() * 14,
      size: 4 + Math.random() * 7,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - .5) * .2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    const start = performance.now();
    let previous = start;
    const draw = (now) => {
      const delta = Math.min((now - previous) / 16.67, 2);
      previous = now;
      context.clearRect(0, 0, width, height);
      if (now - start > 5200 || reducedMotion.matches) return;
      context.globalAlpha = Math.min(1, (5200 - (now - start)) / 1300);
      pieces.forEach((piece) => {
        piece.x += piece.vx * delta;
        piece.y += piece.vy * delta;
        piece.vy += .13 * delta;
        piece.rotation += piece.spin * delta;
        context.save();
        context.translate(piece.x, piece.y);
        context.rotate(piece.rotation);
        context.fillStyle = piece.color;
        context.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * .6);
        context.restore();
      });
      confettiFrame = requestAnimationFrame(draw);
    };
    confettiFrame = requestAnimationFrame(draw);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (state !== 'ready') return;
    const wish = input.value.trim();
    if (!wish || wish.length > 280) {
      byId('wish-error').textContent = !wish ? 'เขียนคำอธิษฐานก่อนนะ ♡' : 'ขอไม่เกิน 280 ตัวอักษรนะ';
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    state = 'sending';
    dialog.close();
    birthday.classList.add('sending');
    byId('open-wish').disabled = true;
    byId('open-wish').textContent = 'กำลังส่งคำอธิษฐาน…';
    byId('flying-wish').classList.add('fly');
    announce('ส่งคำอธิษฐานแล้ว กำลังเป่าเทียน');
    celebrationTimer = window.setTimeout(() => {
      state = 'celebrating';
      byId('candle-flame').classList.add('out');
      byId('smoke').classList.add('rise');
      byId('wish-result').textContent = wish;
      byId('invitation').hidden = true;
      byId('celebration').hidden = false;
      birthday.classList.remove('sending');
      birthday.classList.add('is-celebrating');
      byId('success-title').focus({ preventScroll: true });
      announce('เป่าเทียนแล้ว ขอให้ทุกคำอธิษฐานเป็นจริง สุขสันต์วันเกิดนะ');
      confetti();
      void playChime(true);
    }, reducedMotion.matches ? 0 : 1400);
  });

  byId('replay').addEventListener('click', () => {
    clearTimeout(celebrationTimer);
    cancelAnimationFrame(confettiFrame);
    const canvas = byId('confetti');
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    state = 'ready';
    birthday.classList.remove('is-celebrating', 'sending');
    byId('candle-flame').classList.remove('out');
    byId('smoke').classList.remove('rise');
    byId('flying-wish').classList.remove('fly');
    byId('invitation').hidden = false;
    byId('celebration').hidden = true;
    byId('wish-result').textContent = '';
    byId('open-wish').disabled = false;
    byId('open-wish').textContent = 'อธิษฐานแล้วเป่าเทียน';
    form.reset();
    byId('character-count').textContent = '0 / 280';
    byId('wish-error').textContent = '';
    input.removeAttribute('aria-invalid');
    byId('open-wish').focus({ preventScroll: true });
    announce('จุดเทียนแล้ว อธิษฐานได้อีกครั้ง');
  });

  stage.addEventListener('pointermove', (event) => {
    if (reducedMotion.matches || event.pointerType !== 'mouse' || state === 'sending') return;
    const bounds = stage.getBoundingClientRect();
    tilt.style.setProperty('--ry', `${((event.clientX - bounds.left) / bounds.width - .5) * 10}deg`);
    tilt.style.setProperty('--rx', `${-((event.clientY - bounds.top) / bounds.height - .5) * 7}deg`);
  });
  stage.addEventListener('pointerleave', () => {
    tilt.style.setProperty('--rx', '0deg');
    tilt.style.setProperty('--ry', '0deg');
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(confettiFrame);
      const canvas = byId('confetti');
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
      if (audioContext?.state === 'running') void audioContext.suspend().catch(() => {});
    }
  });
})();
