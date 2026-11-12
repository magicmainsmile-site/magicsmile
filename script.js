// Header goes solid once the page leaves the hero; phones get a toggle menu.
(function header() {
  const el = document.querySelector('[data-header]');
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  if (!el) return;

  const update = () => el.classList.toggle('is-solid', window.scrollY > 40);
  update();
  window.addEventListener('scroll', update, { passive: true });

  const setOpen = (open) => {
    el.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Закрыть' : 'Меню';
  };
  toggle.addEventListener('click', () => setOpen(!el.classList.contains('is-open')));
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
})();

// Doubles the review cards so the phone row can loop without a visible jump.
// Visitors who prefer reduced motion get a row they can swipe by hand instead.
(function reviewLoop() {
  const loop = document.querySelector('[data-review-loop]');
  if (!loop) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const track = loop.querySelector('.bento__track');
  [...track.children].forEach((card) => {
    const clone = card.cloneNode(true);
    clone.classList.add('review--clone');
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });
  loop.classList.add('is-looping');
})();

// As the next card slides over, the covered card shrinks slightly so the layers read clearly.
(function stackDepth() {
  const cards = [...document.querySelectorAll('.stack__card')];
  if (!cards.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let queued = false;
  const update = () => {
    queued = false;
    cards.slice(0, -1).forEach((card, i) => {
      const stuckAt = parseFloat(getComputedStyle(card).top) || 0;
      const height = card.offsetHeight;
      const overlap = stuckAt + height - cards[i + 1].getBoundingClientRect().top;
      const progress = Math.min(Math.max(overlap / height, 0), 1);
      card.style.transform = progress ? `scale(${1 - progress * 0.05})` : '';
    });
  };
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  update();
})();

// Phones: the service cards stay pinned and scrolling slides each new card in from the right.
// Without JavaScript, or with reduced motion, they remain a normal vertical list.
(function servicesSlide() {
  const pin = document.querySelector('[data-card-pin]');
  if (!pin) return;

  const list = pin.querySelector('.cards');
  const cards = [...list.children];
  const phone = window.matchMedia('(max-width: 680px)');
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  const STEP = 340; // Scroll distance per card, in pixels.
  const PEEK = 10; // How much of the next card shows at the right edge.
  const clamp = (value) => Math.min(Math.max(value, 0), 1);
  let active = false;
  let queued = false;

  const update = () => {
    queued = false;
    if (!active) return;
    const scrolled = parseFloat(getComputedStyle(list).top) - pin.getBoundingClientRect().top;
    const gutter = cards[0].offsetLeft;
    const travel = list.clientWidth - PEEK - gutter;
    // Each card arrives over 80% of its step, then holds still long enough to read.
    const arrival = cards.map((_, i) => (i === 0 ? 1 : clamp((scrolled - (i - 1) * STEP) / (STEP * 0.8))));
    cards.forEach((card, i) => {
      const shift = travel * (1 - arrival[i]);
      const scale = 1 - (arrival[i + 1] || 0) * 0.05;
      card.style.transform = `translate3d(${shift}px, 0, 0) scale(${scale})`;
      // Only the next card peeks in; the ones after it stay invisible until their turn.
      card.style.opacity = i > 1 && arrival[i - 1] === 0 ? '0' : '';
    });
  };
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  const setup = () => {
    active = phone.matches && !calm.matches;
    pin.classList.toggle('is-pinned', active);
    pin.style.height = active ? `${list.offsetHeight + (cards.length - 1) * STEP}px` : '';
    if (!active) cards.forEach((card) => { card.style.transform = ''; card.style.opacity = ''; });
    update();
  };

  // Tabbing to a link scrolls its card into view.
  list.addEventListener('focusin', (event) => {
    if (!active) return;
    const i = cards.indexOf(event.target.closest('.card'));
    const pinTop = pin.getBoundingClientRect().top + window.scrollY;
    const stuckAt = parseFloat(getComputedStyle(list).top);
    window.scrollTo(0, pinTop - stuckAt + Math.max(i, 0) * STEP);
  });

  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', setup);
  phone.addEventListener('change', setup);
  calm.addEventListener('change', setup);
  setup();
})();
