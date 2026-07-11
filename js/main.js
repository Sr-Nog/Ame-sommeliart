(function () {
  'use strict';

  /* ============================================================
     CONFIG
     ============================================================ */
  var CONFIG = {
    whatsappNumber: '5564992248116',
    eventName: 'SOMMELIART'
  };

  /* ============================================================
     Header: shrink + swap logo on scroll
     ============================================================ */
  var header = document.getElementById('siteHeader');
  function updateHeader() {
    if (window.scrollY > 40) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  /* ============================================================
     Mobile nav toggle
     ============================================================ */
  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('mainNav');
  navToggle.addEventListener('click', function () {
    var isOpen = mainNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
  mainNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      mainNav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* ============================================================
     Fade carousels (Sobre / Depoimentos) — cross-fade autoplay
     ============================================================ */
  var fadeCarousels = document.querySelectorAll('.fade-carousel');
  fadeCarousels.forEach(function (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('img'));
    if (slides.length < 2) return;

    var delay = parseInt(carousel.getAttribute('data-autoplay-delay'), 10) || 5000;
    var current = slides.findIndex(function (img) { return img.classList.contains('is-active'); });
    if (current < 0) {
      current = 0;
      slides[0].classList.add('is-active');
    }

    var timer = null;

    function goTo(index) {
      slides[current].classList.remove('is-active');
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('is-active');
    }

    function start() {
      timer = setInterval(function () { goTo(current + 1); }, delay);
    }
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    start();
    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
  });

  /* ============================================================
     Experience carousel — drag/swipe, autoplay, loop, indicators
     ============================================================ */
  var expCarousel = document.getElementById('expCarousel');
  if (expCarousel) {
    var expTrack = document.getElementById('expCarouselTrack');
    var expCards = Array.prototype.slice.call(expTrack.children);
    var expPrev = document.getElementById('expPrev');
    var expNext = document.getElementById('expNext');
    var expIndicatorsEl = document.getElementById('expIndicators');
    var expDelay = parseInt(expCarousel.getAttribute('data-autoplay-delay'), 10) || 3500;
    var expActive = 0;
    var expTimer = null;

    expCards.forEach(function (card, i) {
      var dot = document.createElement('li');
      dot.className = 'exp-carousel-indicator';
      dot.setAttribute('role', 'button');
      dot.setAttribute('tabindex', '0');
      dot.setAttribute('aria-label', 'Ir para item ' + (i + 1));
      dot.addEventListener('click', function () {
        setActive(i);
        restartAutoplay();
      });
      expIndicatorsEl.appendChild(dot);
    });
    var expDots = Array.prototype.slice.call(expIndicatorsEl.children);

    function updateOffsets() {
      var total = expCards.length;
      expCards.forEach(function (card, i) {
        var diff = i - expActive;
        if (diff > total / 2) { diff -= total; }
        if (diff < -total / 2) { diff += total; }
        card.style.setProperty('--offset', diff);
        card.style.setProperty('--abs-offset', Math.abs(diff));
        card.classList.toggle('is-active', i === expActive);
      });
      expDots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === expActive);
      });
      centerTrack(0);
    }

    function trackBaseOffset() {
      var viewport = expTrack.parentElement;
      var cardWidth = expCards[0].offsetWidth;
      var gapStr = getComputedStyle(expTrack).columnGap || getComputedStyle(expTrack).gap || '28px';
      var gap = parseFloat(gapStr) || 28;
      var cardCenter = expActive * (cardWidth + gap) + cardWidth / 2;
      var viewportCenter = viewport.clientWidth / 2;
      return viewportCenter - cardCenter;
    }

    function centerTrack(extra) {
      var translateX = trackBaseOffset() + (extra || 0);
      expTrack.style.transform = 'translateX(' + translateX + 'px)';
    }

    function setActive(index) {
      var total = expCards.length;
      expActive = (index + total) % total;
      updateOffsets();
    }

    window.addEventListener('resize', function () { centerTrack(0); });

    function restartAutoplay() {
      if (expTimer) { clearInterval(expTimer); }
      expTimer = setInterval(function () { setActive(expActive + 1); }, expDelay);
    }
    function stopAutoplay() {
      if (expTimer) { clearInterval(expTimer); expTimer = null; }
    }

    expPrev.addEventListener('click', function () { setActive(expActive - 1); restartAutoplay(); });
    expNext.addEventListener('click', function () { setActive(expActive + 1); restartAutoplay(); });

    expCarousel.addEventListener('mouseenter', stopAutoplay);
    expCarousel.addEventListener('mouseleave', restartAutoplay);

    var isDragging = false;
    var dragStartX = 0;
    var dragDelta = 0;

    function onPointerDown(e) {
      isDragging = true;
      dragStartX = e.clientX;
      dragDelta = 0;
      expTrack.classList.add('is-dragging');
      stopAutoplay();
    }
    function onPointerMove(e) {
      if (!isDragging) { return; }
      dragDelta = e.clientX - dragStartX;
      centerTrack(dragDelta);
    }
    function onPointerUp() {
      if (!isDragging) { return; }
      isDragging = false;
      expTrack.classList.remove('is-dragging');
      var threshold = 40;
      if (dragDelta > threshold) {
        setActive(expActive - 1);
      } else if (dragDelta < -threshold) {
        setActive(expActive + 1);
      } else {
        centerTrack(0);
      }
      dragDelta = 0;
      restartAutoplay();
    }

    expTrack.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    expTrack.addEventListener('click', function (e) {
      if (Math.abs(dragDelta) > 5) { return; }
      var card = e.target.closest ? e.target.closest('.feature-card') : null;
      if (!card) { return; }
      var idx = expCards.indexOf(card);
      if (idx !== -1 && idx !== expActive) {
        setActive(idx);
        restartAutoplay();
      }
    });

    setActive(0);
    restartAutoplay();
  }

  /* ============================================================
     Accordion (FAQ)
     ============================================================ */
  var accordionItems = document.querySelectorAll('.accordion-item');
  accordionItems.forEach(function (item) {
    var trigger = item.querySelector('.accordion-trigger');
    var panel = item.querySelector('.accordion-panel');

    trigger.addEventListener('click', function () {
      var isOpen = item.classList.contains('is-open');

      accordionItems.forEach(function (other) {
        other.classList.remove('is-open');
        other.querySelector('.accordion-panel').style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add('is-open');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });

  /* ============================================================
     Ticket purchase — cria o link de checkout via /api/create-checkout
     e redireciona para o pagamento na InfinitePay
     ============================================================ */
  var checkoutForm = document.getElementById('checkoutForm');
  var checkoutNote = document.getElementById('checkoutNote');
  var btnComprar = document.getElementById('btnComprarIngresso');

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var nome = checkoutForm.nome.value.trim();
      var email = checkoutForm.email.value.trim();
      var whatsapp = checkoutForm.whatsapp.value.trim();

      if (!nome || !email || !whatsapp) {
        checkoutNote.textContent = 'Preencha nome, e-mail e WhatsApp para continuar.';
        return;
      }

      btnComprar.disabled = true;
      checkoutNote.textContent = 'Preparando seu pagamento seguro...';

      fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome, email: email, whatsapp: whatsapp })
      })
        .then(function (res) {
          if (!res.ok) { throw new Error('checkout_failed'); }
          return res.json();
        })
        .then(function (data) {
          if (!data.url) { throw new Error('checkout_failed'); }
          checkoutNote.textContent = 'Tudo certo! Redirecionando você para o pagamento...';
          window.location.href = data.url;
        })
        .catch(function () {
          btnComprar.disabled = false;
          checkoutNote.textContent =
            'Não foi possível iniciar o pagamento agora. Tente novamente em instantes ou fale conosco pelo WhatsApp.';
        });
    });
  }

  /* ============================================================
     Interest form -> WhatsApp redirect with confirmation message
     ============================================================ */
  var form = document.getElementById('interestForm');
  var formNote = document.getElementById('formNote');

  function buildWhatsAppMessage(data) {
    var lines = [
      'Olá! Quero confirmar minha reserva no ' + CONFIG.eventName + '. ✨',
      '',
      'Nome: ' + data.nome,
      'E-mail: ' + data.email,
      data.acompanhantes ? ('Acompanhantes: ' + data.acompanhantes) : null,
      'Pagamento realizado: ' + (data.confirmaCompra ? 'Sim' : 'Ainda não'),
    ].filter(Boolean);
    return lines.join('\n');
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var nome = form.nome.value.trim();
      var whatsapp = form.whatsapp.value.trim();
      var email = form.email.value.trim();
      var acompanhantes = form.acompanhantes.value.trim();
      var confirmaCompra = form.confirmaCompra.checked;

      if (!nome || !whatsapp || !email) {
        formNote.textContent = 'Preencha nome, WhatsApp e e-mail para continuar.';
        return;
      }

      var message = buildWhatsAppMessage({
        nome: nome, email: email, acompanhantes: acompanhantes, confirmaCompra: confirmaCompra
      });

      var url = 'https://wa.me/' + CONFIG.whatsappNumber + '?text=' + encodeURIComponent(message);

      formNote.textContent = 'Tudo certo! Redirecionando você para o WhatsApp...';
      window.open(url, '_blank', 'noopener');
    });
  }

  /* ============================================================
     Floating WhatsApp button
     ============================================================ */
  var whatsappFloat = document.getElementById('whatsappFloat');
  if (whatsappFloat) {
    whatsappFloat.href = 'https://wa.me/' + CONFIG.whatsappNumber;
  }

  /* ============================================================
     Footer year
     ============================================================ */
  var yearEl = document.getElementById('year');
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

})();
