const preloader = document.getElementById('preloader');
let preloaderHidden = false;
const hidePreloader = () => {
  if (preloaderHidden || !preloader) return;
  preloaderHidden = true;
  document.body.classList.remove('is-loading');
  preloader.classList.add('is-hidden');
  preloader.addEventListener('transitionend', () => preloader.remove(), { once: true });
};
window.addEventListener('load', () => setTimeout(hidePreloader, 350));
setTimeout(hidePreloader, 4000);

const nav = document.getElementById('nav');
const menuBtn = document.querySelector('.menu-btn');

function toggleMenu(){
  const isOpen = nav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(isOpen));
}
function closeMenu(){
  nav.classList.remove('open');
  menuBtn.setAttribute('aria-expanded', 'false');
}

nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('click', (event) => {
  if (nav.classList.contains('open') && !nav.contains(event.target) && !menuBtn.contains(event.target)) closeMenu();
});
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });

const header = document.querySelector('.header');
const scrollTopBtn = document.querySelector('.scroll-top');
const onScroll = () => {
  header.classList.toggle('is-scrolled', window.scrollY > 8);
  scrollTopBtn.classList.toggle('is-visible', window.scrollY > 480);
};
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

const navLinks = document.querySelectorAll('.nav a[href^="#"]');
const sections = [...navLinks].map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach((section) => sectionObserver.observe(section));

const revealTargets = Array.from(document.querySelectorAll('.section-title, .section-heading2, .section-sub, .card, .ailment, .team-card, .step, .about-media, .about-copy, .value-card, .faq-item, .gallery-item, .sede-photo, .sede-benefits')).filter((el) => !el.closest('.info-modal'));
revealTargets.forEach((el) => el.classList.add('reveal'));
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
revealTargets.forEach((el) => revealObserver.observe(el));

function setupCarousel(name, trackId){
  const track = document.getElementById(trackId);
  const dotsContainer = document.querySelector(`[data-carousel-dots="${name}"]`);
  const prevBtn = document.querySelector(`[data-carousel-prev="${name}"]`);
  const nextBtn = document.querySelector(`[data-carousel-next="${name}"]`);
  if (!track || !dotsContainer) return;

  const items = Array.from(track.children);
  const dots = items.map((item, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', `Ir a la tarjeta ${index + 1}`);
    dot.addEventListener('click', () => {
      track.scrollTo({ left: item.offsetLeft - track.offsetLeft, behavior: 'smooth' });
    });
    dotsContainer.appendChild(dot);
    return dot;
  });

  const step = () => (items[0] ? items[0].getBoundingClientRect().width + 22 : 300);

  prevBtn?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  nextBtn?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));

  let ticking = false;
  const updateState = () => {
    ticking = false;
    const trackLeft = track.offsetLeft;
    let closestIndex = 0;
    let closestDistance = Infinity;
    items.forEach((item, index) => {
      const distance = Math.abs((item.offsetLeft - trackLeft) - track.scrollLeft);
      if (distance < closestDistance) { closestDistance = distance; closestIndex = index; }
    });
    dots.forEach((dot, index) => dot.classList.toggle('is-active', index === closestIndex));
    if (prevBtn) prevBtn.disabled = track.scrollLeft <= 4;
    if (nextBtn) nextBtn.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
  };
  track.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(updateState); }
  }, { passive: true });
  window.addEventListener('resize', updateState);
  updateState();

  const AUTOPLAY_DELAY = 4000;
  let autoplayId = null;
  const isAtEnd = () => track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
  const advance = () => {
    if (isAtEnd()) track.scrollTo({ left: 0, behavior: 'smooth' });
    else track.scrollBy({ left: step(), behavior: 'smooth' });
  };
  const startAutoplay = () => {
    stopAutoplay();
    autoplayId = window.setInterval(advance, AUTOPLAY_DELAY);
  };
  function stopAutoplay(){
    if (autoplayId) { window.clearInterval(autoplayId); autoplayId = null; }
  }
  const wrapper = track.closest('.cards-carousel');
  wrapper?.addEventListener('mouseenter', stopAutoplay);
  wrapper?.addEventListener('mouseleave', startAutoplay);
  wrapper?.addEventListener('touchstart', stopAutoplay, { passive: true });
  wrapper?.addEventListener('focusin', stopAutoplay);
  wrapper?.addEventListener('focusout', startAutoplay);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoplay(); else startAutoplay();
  });
  startAutoplay();
}
setupCarousel('services', 'servicesCarousel');
setupCarousel('team', 'teamCarousel');

const infoModal = document.getElementById('infoModal');
const infoModalTitle = document.getElementById('infoModalTitle');
const infoModalDesc = document.getElementById('infoModalDesc');
const infoModalCta = document.getElementById('infoModalCta');

function openInfoModal(el){
  infoModalTitle.textContent = el.dataset.serviceTitle || '';
  infoModalDesc.textContent = el.dataset.serviceDesc || '';
  infoModalCta.textContent = el.dataset.serviceCtaLabel || 'Agendar evaluación';
  infoModalCta.setAttribute('href', el.dataset.serviceCtaHref || '#contacto');
  if (el.dataset.serviceCtaExternal === 'true') {
    infoModalCta.setAttribute('target', '_blank');
    infoModalCta.setAttribute('rel', 'noopener noreferrer');
  } else {
    infoModalCta.removeAttribute('target');
    infoModalCta.removeAttribute('rel');
  }
  infoModal.classList.add('is-open');
  infoModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeInfoModal(){
  infoModal.classList.remove('is-open');
  infoModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

document.querySelectorAll('[data-service-title]').forEach((el) => {
  el.addEventListener('click', () => openInfoModal(el));
  el.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openInfoModal(el); }
  });
});
infoModal.querySelectorAll('[data-modal-close]').forEach((el) => el.addEventListener('click', closeInfoModal));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && infoModal.classList.contains('is-open')) closeInfoModal(); });

const contactModal = document.getElementById('contactModal');
function openContactModal(){
  contactModal.classList.add('is-open');
  contactModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeContactModal(){
  contactModal.classList.remove('is-open');
  contactModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
contactModal.querySelectorAll('[data-modal-close]').forEach((el) => el.addEventListener('click', closeContactModal));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && contactModal.classList.contains('is-open')) closeContactModal(); });

document.querySelectorAll('a[href="#contacto"]:not(#infoModalCta)').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    closeInfoModal();
    openContactModal();
  });
});

infoModalCta.addEventListener('click', (event) => {
  closeInfoModal();
  const href = infoModalCta.getAttribute('href');
  if (href === '#contacto') {
    event.preventDefault();
    openContactModal();
  } else if (href && href.indexOf('#agenda-') === 0) {
    event.preventDefault();
    openBookingModal(href === '#agenda-nutricion' ? 'nutricion' : 'fisio');
  }
});

/* BOOKING WIZARD (vista previa — no reemplaza confirmación real por WhatsApp) */
const bookingModal = document.getElementById('bookingModal');
const BOOKING_DOCTORS = {
  fisio: [
    { name: 'Dra. Valeria Rojas', role: 'Fisioterapia deportiva', img: 'https://images.unsplash.com/photo-1579684453423-f84349ef60b0?auto=format&fit=crop&w=100&q=80' },
    { name: 'Lic. Diego Salas', role: 'Entrenamiento terapéutico', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80' },
  ],
  nutricion: [
    { name: 'Nut. Sofía Calderón', role: 'Nutrición deportiva', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=100&q=80' },
  ],
};
const BOOKING_SLOTS = ['8:00 a.m.', '9:00 a.m.', '10:20 a.m.', '11:20 a.m.', '3:00 p.m.', '4:20 p.m.'];
const BOOKING_AMOUNT = { fisio: 'S/. 80.00', nutricion: 'S/. 60.00' };
const PAY_INFO = {
  yape: 'Te enviaremos el número Yape para completar el pago por WhatsApp al confirmar tu solicitud.',
  deposito: 'Te enviaremos los datos de la cuenta bancaria por WhatsApp al confirmar tu solicitud.',
  tarjeta: 'El pago con tarjeta en línea estará disponible próximamente. Por ahora coordinamos el cobro por WhatsApp.',
};

let bookingContext = 'fisio';
let bookingSelectedDoctor = null;
let bookingSelectedSlot = null;
let bookingSelectedPay = null;

function bookingGoToStep(step){
  bookingModal.querySelectorAll('.booking-step').forEach((el) => {
    el.hidden = el.dataset.step !== String(step);
  });
  bookingModal.querySelectorAll('.booking-steps__list li').forEach((li) => {
    const n = Number(li.dataset.stepIndicator);
    li.classList.toggle('is-current', n === step);
    li.classList.toggle('is-done', n < step);
  });
}

function renderBookingDoctors(){
  const container = document.getElementById('bkDoctors');
  container.innerHTML = '';
  BOOKING_DOCTORS[bookingContext].forEach((doctor) => {
    const card = document.createElement('div');
    card.className = 'doctor-card';
    card.innerHTML = `
      <div class="doctor-card__head">
        <img src="${doctor.img}" alt="${doctor.name}" loading="lazy">
        <div><strong>${doctor.name}</strong><span>${doctor.role}</span></div>
      </div>
      <div class="slot-grid"></div>
    `;
    const slotGrid = card.querySelector('.slot-grid');
    BOOKING_SLOTS.forEach((slot) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slot-btn';
      btn.textContent = slot;
      btn.addEventListener('click', () => {
        bookingModal.querySelectorAll('.slot-btn').forEach((b) => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        bookingSelectedDoctor = doctor;
        bookingSelectedSlot = slot;
        document.getElementById('bkStep2Next').disabled = false;
      });
      slotGrid.appendChild(btn);
    });
    container.appendChild(card);
  });
}

function openBookingModal(context){
  bookingContext = context === 'nutricion' ? 'nutricion' : 'fisio';
  bookingSelectedDoctor = null;
  bookingSelectedSlot = null;
  bookingSelectedPay = null;
  document.getElementById('bkStep2Next').disabled = true;
  document.getElementById('bkStep3Next').disabled = true;
  document.getElementById('bkPayInfo').textContent = '';
  bookingModal.querySelectorAll('.booking-pay-btn').forEach((b) => b.classList.remove('is-selected'));
  document.getElementById('bkAmount').textContent = BOOKING_AMOUNT[bookingContext];
  document.getElementById('bkStep1Error').textContent = '';
  const dateInput = document.getElementById('bkFecha');
  if (dateInput) dateInput.min = new Date().toISOString().slice(0, 10);
  renderBookingDoctors();
  bookingGoToStep(1);
  bookingModal.classList.add('is-open');
  bookingModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeBookingModal(){
  bookingModal.classList.remove('is-open');
  bookingModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
bookingModal.querySelectorAll('[data-modal-close]').forEach((el) => el.addEventListener('click', closeBookingModal));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && bookingModal.classList.contains('is-open')) closeBookingModal(); });

bookingModal.querySelectorAll('[data-step-back]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const current = Number(btn.closest('.booking-step').dataset.step);
    bookingGoToStep(current - 1);
  });
});

bookingModal.querySelector('[data-step-next="1"]').addEventListener('click', () => {
  const nombre = document.getElementById('bkNombre').value.trim();
  const doc = document.getElementById('bkDocNumero').value.trim();
  const celular = document.getElementById('bkCelular').value.trim();
  const politica = document.getElementById('bkPolitica').checked;
  const error = document.getElementById('bkStep1Error');
  if (!nombre || !doc || !celular || !politica) {
    error.textContent = 'Completa los campos obligatorios (*) para continuar.';
    return;
  }
  error.textContent = '';
  bookingGoToStep(2);
});

document.getElementById('bkStep2Next').addEventListener('click', () => {
  const sede = document.getElementById('bkSede').value;
  const fecha = document.getElementById('bkFecha').value;
  document.getElementById('bkSummary').innerHTML = `
    <p><strong>Paciente:</strong> ${document.getElementById('bkNombre').value.trim()}</p>
    <p><strong>Sede:</strong> ${sede}</p>
    <p><strong>Fecha:</strong> ${fecha || 'Por confirmar'}</p>
    <p><strong>Horario:</strong> ${bookingSelectedSlot || '—'}</p>
    <p><strong>Profesional:</strong> ${bookingSelectedDoctor ? bookingSelectedDoctor.name : '—'}</p>
  `;
  bookingGoToStep(3);
});

bookingModal.querySelectorAll('.booking-pay-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    bookingModal.querySelectorAll('.booking-pay-btn').forEach((b) => b.classList.remove('is-selected'));
    btn.classList.add('is-selected');
    bookingSelectedPay = btn.dataset.pay;
    document.getElementById('bkPayInfo').textContent = PAY_INFO[bookingSelectedPay] || '';
    document.getElementById('bkStep3Next').disabled = !document.getElementById('bkTerminos').checked;
  });
});
document.getElementById('bkTerminos').addEventListener('change', (event) => {
  document.getElementById('bkStep3Next').disabled = !(event.target.checked && bookingSelectedPay);
});

document.getElementById('bkStep3Next').addEventListener('click', () => {
  const nombre = document.getElementById('bkNombre').value.trim();
  const sede = document.getElementById('bkSede').value;
  const fecha = document.getElementById('bkFecha').value || 'por confirmar';
  const payLabel = { yape: 'Yape', deposito: 'Depósito / Transferencia', tarjeta: 'Tarjeta' }[bookingSelectedPay] || bookingSelectedPay;
  document.getElementById('bkFinalSummary').innerHTML = `
    <p><strong>Paciente:</strong> ${nombre}</p>
    <p><strong>Servicio:</strong> ${bookingContext === 'nutricion' ? 'Nutrición' : 'Fisioterapia / Entrenamiento'}</p>
    <p><strong>Sede:</strong> ${sede}</p>
    <p><strong>Fecha y hora:</strong> ${fecha} · ${bookingSelectedSlot || '—'}</p>
    <p><strong>Profesional:</strong> ${bookingSelectedDoctor ? bookingSelectedDoctor.name : '—'}</p>
    <p><strong>Monto:</strong> ${BOOKING_AMOUNT[bookingContext]}</p>
    <p><strong>Método de pago:</strong> ${payLabel}</p>
  `;
  const waText = encodeURIComponent(
    `Hola, quiero confirmar mi solicitud de cita:\nNombre: ${nombre}\nSede: ${sede}\nFecha/hora: ${fecha} ${bookingSelectedSlot || ''}\nProfesional: ${bookingSelectedDoctor ? bookingSelectedDoctor.name : ''}\nMétodo de pago: ${payLabel}`
  );
  document.getElementById('bkWhatsappCta').setAttribute('href', `https://wa.me/51973028539?text=${waText}`);
  bookingGoToStep(4);
});

document.querySelectorAll('a[href^="#agenda-"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    closeInfoModal();
    openBookingModal(link.getAttribute('href') === '#agenda-nutricion' ? 'nutricion' : 'fisio');
  });
});

const contactForm = document.getElementById('contactForm');
const formFeedback = document.getElementById('formFeedback');
if (contactForm) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    formFeedback.textContent = '';

    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      formFeedback.textContent = 'Revisa los campos marcados antes de enviar.';
      formFeedback.style.color = '#c0392b';
      return;
    }

    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
        body: new URLSearchParams(new FormData(contactForm))
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('No pudimos enviar tu mensaje. Escríbenos por WhatsApp o inténtalo de nuevo en unos minutos.');
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No fue posible enviar el formulario.');
      }

      contactForm.reset();
      formFeedback.textContent = data.message;
      formFeedback.style.color = '#0b8a3d';
    } catch (error) {
      formFeedback.textContent = error.message;
      formFeedback.style.color = '#c0392b';
    }
  });
}
