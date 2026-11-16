(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const preloader = document.querySelector('.preloader');
  const menuToggle = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.primary-nav');
  const navLinks = [...document.querySelectorAll('.nav-link')];
  const toast = document.querySelector('.toast');
  let toastTimer;

  document.documentElement.dataset.sidebarMotion = 'lift';
  document.body.classList.add('is-loading');
  window.addEventListener('load', () => {
    window.setTimeout(() => {
      preloader?.classList.add('is-done');
      document.body.classList.remove('is-loading');
    }, reducedMotion ? 0 : 350);
  }, { once: true });

  // Live clock (uses the visitor's own device time)
  const clockTime = document.querySelector('#clock-time');
  if (clockTime) {
    const hEl = clockTime.querySelector('[data-h]');
    const mEl = clockTime.querySelector('[data-m]');
    const sEl = clockTime.querySelector('[data-s]');
    const tzEl = document.querySelector('#clock-tz');
    const longEl = document.querySelector('.clock-date .d-long');
    const shortEl = document.querySelector('.clock-date .d-short');
    const longFmt = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const shortFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const pad = (n) => String(n).padStart(2, '0');
    const zoneNames = { 'Asia/Jakarta': 'WIB', 'Asia/Pontianak': 'WIB', 'Asia/Makassar': 'WITA', 'Asia/Jayapura': 'WIT' };
    let lastDay = '';

    const zoneLabel = (date) => {
      let zone = '';
      try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { /* ignore */ }
      if (zoneNames[zone]) return zoneNames[zone];
      const offset = -date.getTimezoneOffset();
      const sign = offset >= 0 ? '+' : '-';
      const abs = Math.abs(offset);
      return `UTC${sign}${pad(Math.floor(abs / 60))}${abs % 60 ? ':' + pad(abs % 60) : ''}`;
    };

    const tick = () => {
      const now = new Date();
      hEl.textContent = pad(now.getHours());
      mEl.textContent = pad(now.getMinutes());
      sEl.textContent = pad(now.getSeconds());
      const day = now.toDateString();
      if (day !== lastDay) {
        lastDay = day;
        longEl.textContent = longFmt.format(now);
        shortEl.textContent = shortFmt.format(now);
        tzEl.textContent = zoneLabel(now);
        clockTime.setAttribute('datetime', now.toISOString());
      }
      window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };
    tick();
  }

  // Twinkling starfield with slow parallax + occasional shooting star
  const starCanvas = document.querySelector('.starfield');
  const ctx = starCanvas?.getContext('2d');
  if (starCanvas && ctx) {
    let w = 0, h = 0, dpr = 1, stars = [], shooting = null, nextShot = 0, running = true;
    const tints = ['236,231,218', '236,231,218', '236,231,218', '228,199,121', '150,160,255'];
    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      starCanvas.width = w * dpr; starCanvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(220, Math.max(70, (w * h) / 9000)));
      stars = Array.from({ length: count }, () => {
        const depth = Math.random();
        return {
          x: Math.random() * w, y: Math.random() * h, depth,
          r: 0.4 + depth * 1.3, tint: tints[Math.floor(Math.random() * tints.length)],
          speed: 0.6 + Math.random() * 1.8, phase: Math.random() * Math.PI * 2,
          sparkle: Math.random() < 0.09 && depth > 0.45
        };
      });
    };
    const drawSparkle = (x, y, size, alpha, tint) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `rgb(${tint})`;
      ctx.shadowColor = `rgb(${tint})`;
      ctx.shadowBlur = size * 2.2;
      ctx.beginPath();
      ctx.moveTo(0, -size); ctx.quadraticCurveTo(size * .12, -size * .12, size, 0);
      ctx.quadraticCurveTo(size * .12, size * .12, 0, size);
      ctx.quadraticCurveTo(-size * .12, size * .12, -size, 0);
      ctx.quadraticCurveTo(-size * .12, -size * .12, 0, -size);
      ctx.fill();
      ctx.restore();
    };
    const frame = (time) => {
      if (!running) return;
      const t = time / 1000;
      const scroll = window.scrollY;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const y = ((s.y - scroll * s.depth * 0.12) % h + h) % h;
        const alpha = reducedMotion ? 0.7 : 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
        if (s.sparkle) { drawSparkle(s.x, y, 4 + s.depth * 5, alpha, s.tint); continue; }
        ctx.globalAlpha = alpha * (0.45 + s.depth * 0.55);
        ctx.fillStyle = `rgb(${s.tint})`;
        ctx.beginPath(); ctx.arc(s.x, y, s.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reducedMotion) {
        if (!shooting && t > nextShot) {
          shooting = { x: Math.random() * w * 0.8 + w * 0.2, y: Math.random() * h * 0.35, vx: -(6 + Math.random() * 3), vy: 3 + Math.random() * 2, life: 0 };
        }
        if (shooting) {
          shooting.x += shooting.vx; shooting.y += shooting.vy; shooting.life += 1;
          const fade = Math.max(0, 1 - shooting.life / 55);
          const grad = ctx.createLinearGradient(shooting.x, shooting.y, shooting.x - shooting.vx * 9, shooting.y - shooting.vy * 9);
          grad.addColorStop(0, `rgba(236,231,218,${fade})`); grad.addColorStop(1, 'rgba(236,231,218,0)');
          ctx.strokeStyle = grad; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(shooting.x, shooting.y); ctx.lineTo(shooting.x - shooting.vx * 9, shooting.y - shooting.vy * 9); ctx.stroke();
          if (fade <= 0) { shooting = null; nextShot = t + 5 + Math.random() * 8; }
        }
        window.requestAnimationFrame(frame);
      }
    };
    build();
    nextShot = 3;
    window.requestAnimationFrame(frame);
    window.addEventListener('resize', () => { build(); if (reducedMotion) window.requestAnimationFrame(frame); });
    document.addEventListener('visibilitychange', () => {
      const wasRunning = running;
      running = !document.hidden;
      if (running && !wasRunning) window.requestAnimationFrame(frame);
    });
  }

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3400);
  };

  menuToggle?.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    menuToggle.setAttribute('aria-label', expanded ? 'Buka menu navigasi' : 'Tutup menu navigasi');
    navigation?.classList.toggle('is-open', !expanded);
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      menuToggle?.setAttribute('aria-expanded', 'false');
      menuToggle?.setAttribute('aria-label', 'Buka menu navigasi');
      navigation?.classList.remove('is-open');
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !navigation?.classList.contains('is-open')) return;
    navigation.classList.remove('is-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    menuToggle?.setAttribute('aria-label', 'Buka menu navigasi');
  });

  const navTargets = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const activeHref = `#${entry.target.id}`;
        navLinks.forEach((link) => {
          const isActive = link.getAttribute('href') === activeHref;
          link.classList.toggle('is-active', isActive);
          if (isActive) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-30% 0px -55% 0px', threshold: 0 });
    navTargets.forEach((section) => sectionObserver.observe(section));
  }

  const revealItems = document.querySelectorAll('.reveal');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.13, rootMargin: '0px 0px -30px 0px' });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const progress = document.querySelector('.scroll-progress');
  let progressFrame = 0;
  window.addEventListener('scroll', () => {
    if (progressFrame) return;
    progressFrame = window.requestAnimationFrame(() => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const percent = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      if (progress) progress.style.width = `${percent}%`;
      progressFrame = 0;
    });
  }, { passive: true });

  const tiltCard = document.querySelector('[data-tilt]');
  if (tiltCard && !reducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    tiltCard.addEventListener('pointermove', (event) => {
      const rect = tiltCard.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      tiltCard.style.transform = `rotateX(${-y * 10}deg) rotateY(${x * 10}deg) rotateZ(-1deg)`;
    });
    tiltCard.addEventListener('pointerleave', () => {
      tiltCard.style.transform = '';
    });
  }

  if (!reducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.magnetic').forEach((btn) => {
      btn.addEventListener('pointermove', (event) => {
        const rect = btn.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.22;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.22;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.transform = '';
      });
    });

    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    window.addEventListener('pointermove', (event) => {
      if (!dot || !ring) return;
      dot.style.opacity = '1';
      ring.style.opacity = '1';
      dot.style.left = `${event.clientX}px`;
      dot.style.top = `${event.clientY}px`;
      ring.style.left = `${event.clientX}px`;
      ring.style.top = `${event.clientY}px`;
    }, { passive: true });
    document.querySelectorAll('a, button, [data-tilt], .tool-sticker').forEach((target) => {
      target.addEventListener('pointerenter', () => ring?.classList.add('is-hover'));
      target.addEventListener('pointerleave', () => ring?.classList.remove('is-hover'));
    });
  }

  document.querySelectorAll('[data-placeholder]').forEach((button) => {
    button.addEventListener('click', () => {
      showToast('Proyek ini masih berstatus Coming Soon! Nantikan segera ya 🚀');
    });
  });

  document.querySelectorAll('[data-contact]').forEach((button) => {
    button.addEventListener('click', () => {
      const channel = button.dataset.contact;
      showToast(`Link ${channel} akan segera ditambahkan nanti!`);
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', link.getAttribute('href'));
      if (link.closest('.contact-main')) {
        window.setTimeout(() => document.querySelector('#contact-links a, [data-contact]')?.focus({ preventScroll: true }), reducedMotion ? 0 : 450);
      }
    });
  });
})();
