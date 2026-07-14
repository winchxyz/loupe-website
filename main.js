/* =========================================================
   Loupe — motion & interaction
   GSAP + ScrollTrigger. Motion runs for everyone.
   ========================================================= */
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------------------------------------------------------
     1. CUSTOM CURSOR (lerp-followed dot + ring)
  --------------------------------------------------------- */
  if (fine) {
    const cur = $('.cursor');
    // start far off-screen and invisible — only reveal once the pointer truly moves,
    // so a static/headless capture never shows a ring floating over the headline
    let mx = -200, my = -200, cx = mx, cy = my, shown = false;
    addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      if (!shown) { shown = true; cur.classList.add('is-on'); }
    });
    const tick = () => {
      cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2;
      cur.style.transform = `translate(${cx}px,${cy}px)`;
      requestAnimationFrame(tick);
    };
    tick();
    const hot = '.btn, a, button, .tile, .magnetic, .loop__node';
    document.addEventListener('mouseover', e => {
      if (e.target.closest(hot)) cur.classList.add('is-hot');
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest(hot)) cur.classList.remove('is-hot');
    });
  }

  /* ---------------------------------------------------------
     1b. MOBILE NAV (hamburger toggle)
  --------------------------------------------------------- */
  {
    const navEl = $('#nav'), burger = $('#navBurger'), navLinks = $('#navLinks');
    if (navEl && burger && navLinks) {
      const setOpen = open => {
        navEl.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      };
      burger.addEventListener('click', () => setOpen(!navEl.classList.contains('is-open')));
      navLinks.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
      addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
    }
    // scroll-spy: mark the nav link of the section currently in view
    const links = navLinks ? $$('a', navLinks) : [];
    const map = new Map();
    links.forEach(a => { const h = a.getAttribute('href'); if (h && h.startsWith('#')) { const sec = $(h); if (sec) map.set(sec, a); } });
    if (map.size && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          links.forEach(l => l.classList.remove('is-current'));
          const a = map.get(e.target); if (a) a.classList.add('is-current');
        });
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
      map.forEach((_, sec) => io.observe(sec));
    }
  }

  /* ---------------------------------------------------------
     2. REACTIVE DOT-FIELD background
  --------------------------------------------------------- */
  (() => {
    const cv = $('.dotfield');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    // Static engineer grid — grey dots on the grid intersections, NO animation.
    let w, h, dots = [], dpr = Math.min(devicePixelRatio || 1, 2);
    const GAP = 42;   // matches the static grid (.grain) so dots land on the line intersections
    function build() {
      w = cv.width = innerWidth * dpr; h = cv.height = innerHeight * dpr;
      cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
      dots = [];
      for (let y = GAP; y < innerHeight; y += GAP)
        for (let x = GAP; x < innerWidth; x += GAP)
          dots.push({ x, y });
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(123,123,131,0.16)';
      for (const d of dots) { ctx.beginPath(); ctx.arc(d.x * dpr, d.y * dpr, 1.2 * dpr, 0, Math.PI * 2); ctx.fill(); }
    }
    addEventListener('resize', () => { build(); draw(); });
    build();
    draw();
  })();

  /* ---------------------------------------------------------
     3. NAV state on scroll
  --------------------------------------------------------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-stuck', scrollY > 24);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });

  /* ---------------------------------------------------------
     4. MAGNETIC buttons / tiles
  --------------------------------------------------------- */
  if (fine && !reduce) {
    $$('.magnetic').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.25}px,${y * 0.35}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
    // tile spotlight follow
    $$('.tile').forEach(t => {
      t.addEventListener('mousemove', e => {
        const r = t.getBoundingClientRect();
        t.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        t.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------------------------------------------------------
     5. GSAP choreography
  --------------------------------------------------------- */
  const hasGSAP = window.gsap && window.ScrollTrigger;
  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);

    // TRANSFORM-ONLY entrance: opacity is never touched, so hero text is full,
    // legible white on EVERY frame (start, middle, end) — it can only glide a few
    // px into place, never fade to grey or "disappear", even if the rAF ticker is
    // throttled in a headless capture. A setTimeout failsafe (timer-driven, not
    // rAF-driven) hard-snaps to the settled state so the final frame is always done.
    const heroEls = '.hero .eyebrow,.hero__title .line,.hero__sub,.hero__actions,.hero__foot,.signature';
    const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
    intro.from('.hero .eyebrow', { y: 10, duration: 0.35 }, 0)
         .from('.hero__title .line', { y: 16, duration: 0.36, stagger: 0.03 }, 0.02)
         .from('.hero__sub', { y: 12, duration: 0.35 }, 0.08)
         .from('.hero__actions', { y: 12, duration: 0.35 }, 0.12)
         .from('.hero__foot', { y: 8, duration: 0.3 }, 0.16)
         .from('.signature', { y: 18, duration: 0.4 }, 0.04);

    // hard-lock to the final state fast (timer-driven, independent of rAF): clears the
    // temporary transforms/will-change layers so any captured frame past ~0.5s is settled
    const settleHero = () => gsap.set(heroEls, { clearProps: 'transform,willChange' });
    const heroFailsafe = setTimeout(settleHero, 650);
    intro.eventCallback('onComplete', () => { clearTimeout(heroFailsafe); settleHero(); });

    // (the Loupe lens mark has its own subtle CSS "breathe" — no GSAP pulse needed)

    // Generic reveal-on-scroll — TRANSFORM ONLY (no opacity), so elements are always
    // rendered (opacity:1) and merely glide up when scrolled into view.
    // Travel is kept BELOW the heading→lead gap (22px) on purpose: a heading and its
    // following lead reveal independently, so a larger travel would let the moving heading
    // transiently overlap the static lead as the section enters. 14/16px stays clean.
    $$('.reveal').forEach(el => {
      gsap.from(el, {
        y: 14, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 92%' }
      });
    });

    // Section titles — transform only, same reasoning (never hide the headings)
    $$('.section-title, .cta__title').forEach(t => {
      gsap.from(t, {
        y: 16, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: t, start: 'top 92%' }
      });
    });

    // Loop diagram nodes pop with scrub
    gsap.from('.loop__arrow', {
      opacity: 0, scaleX: 0, transformOrigin: 'left center', duration: 0.6, stagger: 0.2,
      scrollTrigger: { trigger: '#loopDiagram', start: 'top 70%' }
    });

    // Parallax depth on hero glow
    gsap.to('.hero__bg', {
      yPercent: 24, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    // "How it works" — PIN the row once it's centred, hold the page still while the
    // steps light up 01 → 02 → 03 in turn, then release so the page scrolls on.
    // Scrolling back up replays it 03 → 02 → 01 (ScrollTrigger handles reverse).
    const cards = $$('.how__card');
    const fill = $('#howFill');
    if (cards.length) {
      let lastActive = -1;
      const setActive = idx => {
        if (idx === lastActive) return;
        lastActive = idx;
        cards.forEach((c, i) => c.classList.toggle('is-active', i === idx));
      };
      setActive(0); // step 01 lit from the start

      const sweep = self => {
        gsap.set(fill, { width: (self.progress * 100) + '%' });
        setActive(Math.min(cards.length - 1, Math.floor(self.progress * cards.length * 0.9999)));
      };

      // gsap.matchMedia re-creates the correct trigger per breakpoint AND cleans up the
      // other one when the query stops matching — so resizing across 861px never leaves a
      // stale desktop pin-spacer behind (which would widen the page on a narrow viewport).
      const mm = gsap.matchMedia();
      mm.add('(min-width: 861px)', () => {
        // DESKTOP/TABLET: the 3 cards fit in a row, so pin & sweep in place
        lastActive = -1; setActive(0);
        const st = ScrollTrigger.create({
          trigger: '.how__sticky',
          start: 'center center',                       // pins once the block is mid-screen
          end: '+=' + (cards.length * 72) + '%',        // virtual scroll for the 1→2→3 sweep
          pin: '.how__sticky',
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          scrub: 0.5,
          onRefresh: () => setActive(0),
          onUpdate: sweep
        });
        return () => { st.kill(); if (fill) gsap.set(fill, { width: '0%' }); lastActive = -1; setActive(0); };
      });
      mm.add('(max-width: 860px)', () => {
        // PHONE: the stacked column is taller than the viewport, so don't pin — just
        // sweep the highlight as the section scrolls past.
        lastActive = -1; setActive(0);
        const st = ScrollTrigger.create({
          trigger: '.how', start: 'top 72%', end: 'bottom 62%',
          scrub: 0.5, invalidateOnRefresh: true, onUpdate: sweep
        });
        return () => { st.kill(); };
      });
    }

    // CTA mark float
    gsap.to('.mark--xl', {
      y: -14, scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true }
    });

    // Re-measure all triggers once fonts/images settle (prevents pin & reveal drift)
    addEventListener('load', () => ScrollTrigger.refresh());
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  } else {
    // GSAP unavailable: make sure nothing stays hidden or dimmed
    $$('.reveal').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    $$('.hero__title .line').forEach(el => { el.style.transform = 'none'; });
    $$('.how__card').forEach(el => el.classList.add('is-active'));
  }

  /* ---------------------------------------------------------
     6. SIGNATURE demo: pick -> edit -> verify (looping)
  --------------------------------------------------------- */
  (() => {
    const stage = $('.signature__stage');
    const target = $('#mockTarget');
    const sel = $('#sel');
    const selTag = sel ? sel.querySelector('.sel__tag') : null;
    const chip = $('#chip');
    const chipText = $('#chipText');
    const verify = $('#verify');
    const dc = $('#democursor');
    const steps = $$('.signature .step');
    if (!stage || !target) return;

    const NEW_TEXT = 'Ship in minutes.';
    const ORIG_TEXT = target.textContent;
    const g = window.gsap;
    const setStep = n => steps.forEach(s => s.classList.toggle('is-on', +s.dataset.step === n));

    const sigEl = $('#signature');
    // offsets of a target rect relative to the stage's own box (layout-stable)
    const rel = (rect, s) => ({
      x: rect.left - s.left, y: rect.top - s.top, w: rect.width, h: rect.height
    });
    const moveCursor = (x, y, dur = 0.7) => {
      if (g) return g.to(dc, { left: x, top: y, duration: dur, ease: 'power2.inOut' });
      dc.style.left = x + 'px'; dc.style.top = y + 'px';
      return Promise.resolve();
    };

    function reset() {
      target.textContent = ORIG_TEXT;
      target.style.color = '';
      chipText.textContent = '';
      if (selTag) g.set(selTag, { opacity: 1 });
      if (g) g.set([sel, chip, verify, dc], { opacity: 0, clearProps: 'transform' });
    }

    function typeText(str, done) {
      let i = 0;
      chipText.textContent = '';
      const iv = setInterval(() => {
        chipText.textContent = str.slice(0, ++i);
        if (i >= str.length) { clearInterval(iv); done && done(); }
      }, 48);
    }

    function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

    async function run() {
      reset();
      const s = stage.getBoundingClientRect();
      const t = rel(target.getBoundingClientRect(), s);

      // bring cursor in from lower-left
      if (g) g.set(dc, { left: s.width * 0.22, top: s.height * 0.86, opacity: 0 });
      if (g) await g.to(dc, { opacity: 1, duration: 0.3 });

      // ---- 1. PICK ----
      setStep(0);
      await moveCursor(t.x + t.w * 0.5, t.y + t.h * 0.6, 0.85);
      sel.style.width = (t.w + 16) + 'px';
      sel.style.height = (t.h + 12) + 'px';
      sel.style.left = (t.x - 8) + 'px';
      sel.style.top = (t.y - 6) + 'px';
      if (g) await g.to(sel, { opacity: 1, duration: 0.35, ease: 'power2.out' });
      await wait(520);

      // ---- 2. EDIT ---- chip floats in the clear band ABOVE the heading. The
      // selection tag is hidden so the two labels never stack on top of each other.
      setStep(1);
      if (selTag && g) g.to(selTag, { opacity: 0, duration: 0.2 });
      const chh = chip.offsetHeight || 34;
      const cx = Math.max(8, t.x - 8);
      // floor of 56 keeps the chip below the mock nav even with the tighter nav gap
      const cy = Math.max(56, t.y - chh - 12);
      chip.style.left = cx + 'px';
      chip.style.top = cy + 'px';
      if (g) g.fromTo(chip, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out' });
      await wait(220);
      await new Promise(res => typeText('Ship in minutes.', res));
      await wait(420);
      // apply the change live
      if (g) {
        await g.to(target, { opacity: 0, y: -8, duration: 0.22, ease: 'power1.in' });
        target.textContent = NEW_TEXT;
        target.style.color = '#fff';
        g.fromTo(target, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out' });
      } else {
        target.textContent = NEW_TEXT;
      }
      if (g) g.to(chip, { opacity: 0, y: 6, duration: 0.3, delay: 0.2 });
      await wait(420);

      // ---- 3. VERIFY ---- a clean toast centred in the reserved bottom strip,
      // so it never lands on top of the content cards above it.
      setStep(2);
      if (g) g.fromTo(verify,
        { opacity: 0, scale: 0.85, y: 10, xPercent: -50 },
        { opacity: 1, scale: 1, y: 0, xPercent: -50, duration: 0.5, ease: 'back.out(1.7)' });
      await wait(1900);
      if (g) g.to([sel, verify], { opacity: 0, duration: 0.4 });
      await wait(750);

      run(); // loop — re-measures every cycle, stays aligned through resizes
    }

    // Start only after intro transforms have cleared and fonts are loaded,
    // otherwise the live rect would be measured mid-animation and drift.
    let started = false;
    const start = () => { if (started) return; started = true; run(); };
    const arm = () => {
      const io = new IntersectionObserver(es => {
        es.forEach(e => { if (e.isIntersecting) { io.disconnect(); setTimeout(start, g ? 1200 : 250); } });
      }, { threshold: 0.25 });
      io.observe(sigEl);
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(arm); else arm();
  })();

  /* ---------------------------------------------------------
     7. tokens tile: auto-dark toggle micro-interaction
  --------------------------------------------------------- */
  (() => {
    const btn = $('#tokDark');
    if (!btn) return;
    const viz = btn.closest('.viz-tokens');
    // Toggle the SAMPLE panel's theme via a class (not an invert filter on the whole
    // tile — that also inverted the button itself and made it vanish). The button is
    // restyled by CSS in each theme so it always stays readable both ways.
    btn.addEventListener('click', () => {
      const light = viz.classList.toggle('is-light');
      btn.textContent = light ? '◐ light theme' : '◑ auto-dark';
      btn.setAttribute('aria-pressed', String(light));
    });
  })();

  /* ---------------------------------------------------------
     8. Marquee → SVG <text> with <pattern> fills.
     In SVG a glyph is a VECTOR outline, so a pattern/gradient fill is clipped EXACTLY
     to the letter shape — a fill can never spill onto half a letter (the artefact that
     CSS background-clip:text kept producing in some renderers). Each letter gets a
     material pattern (water / hair / glass); hovering a letter lights it up. Seamless
     scroll via Web Animations. If anything fails to build/measure, the plain CSS marquee
     stays as a safe fallback — it is never left blank.
  --------------------------------------------------------- */
  (() => {
    return; // marquee reverted to the original plain CSS outline type — no JS manipulation
    /* eslint-disable */
    const track = $('.marquee__track');
    if (!track) return;
    const NS = 'http://www.w3.org/2000/svg';
    const MAT = ['water', 'hair', 'glass'];

    // CSS fallback FIRST: split every word into per-letter material spans, so even if the
    // SVG upgrade never runs, the strip shows per-letter textures (not a bare gradient).
    const cssSplit = () => {
      if (track.querySelector('.ch')) return;
      let i = 0;
      [...track.children].forEach(word => {
        if (word.tagName !== 'SPAN') return;
        const text = word.textContent;
        const isSep = word.classList.contains('sep');
        word.textContent = '';
        word.classList.remove('grad');
        if (isSep) {
          const s = document.createElement('span');
          s.className = 'ch ch--sep'; s.textContent = text.trim() || '✦';
          word.appendChild(s); return;
        }
        [...text].forEach(chr => {
          const s = document.createElement('span');
          if (chr === ' ') { s.className = 'ch ch--sp'; s.innerHTML = '&nbsp;'; }
          else { s.className = 'ch m-' + MAT[i % MAT.length]; s.textContent = chr; i++; }
          word.appendChild(s);
        });
      });
    };
    cssSplit();

    const build = () => {
      try {
        if (track.classList.contains('is-svg')) return;     // already upgraded
        const oldSvg = track.querySelector('.mq-svg'); if (oldSvg) oldSvg.remove();
        const segs = [...track.children].slice(0, 8).map(n => ({
          sep: n.classList.contains('sep'),
          text: n.classList.contains('sep') ? '✦' : (n.textContent || '').trim()
        })).filter(s => s.text);
        if (!segs.length) return;

        const FS = 92, H = Math.round(FS * 1.55), baseY = Math.round(FS * 0.72);
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('class', 'mq-svg');
        svg.setAttribute('height', H);
        svg.setAttribute('aria-hidden', 'true');

        // build <defs> via DOMParser (SVG mime) so nodes are in the SVG namespace.
        // Smooth material gradients (no stripes) + a real specular-BEVEL filter = genuine
        // 3-D, all clipped to the vector glyph (cannot spill past the letter).
        const defsStr = '<svg xmlns="http://www.w3.org/2000/svg"><defs>' +
          '<linearGradient id="mq-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dff4ff"/>' +
          '<stop offset=".5" stop-color="#54ADFE"/><stop offset="1" stop-color="#15619c"/></linearGradient>' +
          '<linearGradient id="mq-hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6ddff"/>' +
          '<stop offset=".5" stop-color="#8a7ee6"/><stop offset="1" stop-color="#3a2f6e"/></linearGradient>' +
          '<linearGradient id="mq-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/>' +
          '<stop offset=".5" stop-color="#bfe0ff"/><stop offset="1" stop-color="#7fb4e6"/></linearGradient>' +
          '<linearGradient id="mq-prism" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#54ADFE"/>' +
          '<stop offset=".45" stop-color="#46D9CE"/><stop offset=".75" stop-color="#777BEC"/><stop offset="1" stop-color="#B95FAE"/></linearGradient>' +
          '<filter id="mq-bevel" x="-15%" y="-15%" width="130%" height="130%">' +
          '<feGaussianBlur in="SourceAlpha" stdDeviation="2.2" result="b"/>' +
          '<feSpecularLighting in="b" surfaceScale="3" specularConstant="0.85" specularExponent="14" lighting-color="#ffffff" result="s">' +
          '<feDistantLight azimuth="235" elevation="55"/></feSpecularLighting>' +
          '<feComposite in="s" in2="SourceAlpha" operator="in" result="sc"/>' +
          '<feComposite in="SourceGraphic" in2="sc" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>' +
          '</filter>' +
          '</defs></svg>';
        const parsed = new DOMParser().parseFromString(defsStr, 'image/svg+xml');
        if (parsed.querySelector('parsererror')) return;
        svg.appendChild(document.importNode(parsed.querySelector('defs'), true));

        const g = document.createElementNS(NS, 'g');
        g.setAttribute('class', 'mq-g');
        svg.appendChild(g);

        let li = 0;
        const makeText = (x) => {
          const t = document.createElementNS(NS, 'text');
          t.setAttribute('x', x); t.setAttribute('y', baseY);
          t.setAttribute('font-family', 'Inter,system-ui,sans-serif');
          t.setAttribute('font-weight', '900'); t.setAttribute('font-size', FS);
          segs.forEach(s => {
            if (s.sep) {
              const ts = document.createElementNS(NS, 'tspan');
              ts.setAttribute('fill', 'url(#mq-prism)'); ts.textContent = ' ✦ ';
              t.appendChild(ts); return;
            }
            [...s.text].forEach(ch => {
              const ts = document.createElementNS(NS, 'tspan');
              if (ch === ' ') { ts.textContent = ' '; }
              else {
                const m = MAT[li % MAT.length];
                ts.setAttribute('class', 'mq-l mq-' + m);
                ts.setAttribute('fill', 'url(#mq-' + m + ')');
                ts.textContent = ch; li++;
              }
              t.appendChild(ts);
            });
            const sp = document.createElementNS(NS, 'tspan'); sp.textContent = '  '; t.appendChild(sp);
          });
          g.appendChild(t); return t;
        };

        // append first (to measure), keeping the CSS marquee until we know it worked
        track.appendChild(svg);
        const t1 = makeText(0);
        let w = t1.getComputedTextLength();
        if (!w || w < 50) w = Math.round(FS * 0.52 * segs.reduce((a, s) => a + s.text.length + 2, 0)); // estimate, don't bail
        const total = Math.round(w + FS * 0.4);
        makeText(total);
        svg.setAttribute('width', total * 2);
        svg.setAttribute('viewBox', '0 0 ' + (total * 2) + ' ' + H);

        // success → drop the CSS letters, keep the SVG
        [...track.children].forEach(c => { if (c !== svg) c.remove(); });
        track.classList.add('is-svg');

        const anim = g.animate(
          [{ transform: 'translateX(0)' }, { transform: 'translateX(' + (-total) + 'px)' }],
          { duration: 34000, iterations: Infinity, easing: 'linear' });
        const band = track.closest('.hero__marquee');
        if (band) {
          band.addEventListener('mouseenter', () => anim.pause());
          band.addEventListener('mouseleave', () => anim.play());
        }
      } catch (e) { /* keep the CSS marquee fallback */ }
    };

    // SVG upgrade ON, triggered robustly (fonts.ready may never resolve headless): vector
    // <text> clips the per-letter material EXACTLY to each glyph. CSS letters are fallback.
    const tryBuild = () => { if (!track.classList.contains('is-svg')) build(); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(tryBuild);
    addEventListener('load', tryBuild);
    setTimeout(tryBuild, 1400);
  })();

  /* ---------------------------------------------------------
     9. Copy-to-clipboard (download / gallery code + prompt blocks)
  --------------------------------------------------------- */
  (() => {
    const flash = btn => {
      const l = btn.querySelector('.copytxt');
      if (btn._t) clearTimeout(btn._t);
      btn.classList.add('copied');
      if (l) l.textContent = 'Copied';
      btn._t = setTimeout(() => { btn.classList.remove('copied'); if (l) l.textContent = 'Copy'; btn._t = null; }, 1500);
    };
    const legacy = t => {
      const ta = document.createElement('textarea');
      ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
    };
    document.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('[data-copy]');
      if (!b) return;
      const sel = b.getAttribute('data-copy');
      let text = '';
      if (sel === '@self') text = b.getAttribute('data-copy-text') || '';
      else { const s = document.querySelector(sel); text = s ? (s.getAttribute('data-raw') || s.textContent) : ''; }
      text = (text || '').trim();
      if (navigator.clipboard && navigator.clipboard.writeText)
        navigator.clipboard.writeText(text).then(() => flash(b), () => { legacy(text); flash(b); });
      else { legacy(text); flash(b); }
    });
  })();

  /* ---------------------------------------------------------
     10. Prompt builder (gallery): assemble a /flow prompt live
  --------------------------------------------------------- */
  (() => {
    const el = document.querySelector('[data-builder]');
    if (!el) return;
    const brief = el.querySelector('#builderBrief');
    const out = el.querySelector('#builderOut');
    const order = ['structure', 'archetype', 'imagery', 'motion', 'density'];
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    el.addEventListener('click', e => {
      const b = e.target.closest('.opt');
      if (!b) return;
      const axis = b.getAttribute('data-axis'), was = b.classList.contains('sel');
      el.querySelectorAll('.opt[data-axis="' + axis + '"]').forEach(x => { x.classList.remove('sel'); x.setAttribute('aria-pressed', 'false'); });
      if (!was) { b.classList.add('sel'); b.setAttribute('aria-pressed', 'true'); }
      render();
    });
    if (brief) brief.addEventListener('input', render);
    function render() {
      const b = (brief && brief.value ? brief.value : '').trim();
      const toks = [];
      order.forEach(a => { const s = el.querySelector('.opt[data-axis="' + a + '"].sel'); if (s) toks.push(a + '=' + s.getAttribute('data-val')); });
      const raw = '/flow ' + b + (toks.length ? '\n' + toks.join(' ') : '');
      out.setAttribute('data-raw', raw);
      let html = '<span class="cmd">/flow</span> ' + esc(b);
      if (toks.length) html += '\n' + toks.map(t => '<span class="kv">' + esc(t) + '</span>').join(' ');
      out.innerHTML = html;
    }
    render();
  })();
})();
