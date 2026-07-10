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
     Hero video: scroll-triggered scrubbing (plays as the user
     scrolls through the pinned hero, instead of autoplaying)
     ============================================================ */
  var heroVideo = document.getElementById('heroVideo');
  var heroScroll = document.getElementById('topo');

  if (heroVideo && heroScroll) {
    var heroReady = false;

    var primeVideo = function () {
      if (heroReady) return;
      heroReady = true;
      heroVideo.pause();
    };
    heroVideo.addEventListener('loadedmetadata', primeVideo);
    // Some mobile browsers only report a usable duration after a play() call.
    var kickoff = heroVideo.play();
    if (kickoff && kickoff.then) { kickoff.then(primeVideo).catch(primeVideo); }

    var updateHeroScrub = function () {
      if (!heroVideo.duration) return;
      var rect = heroScroll.getBoundingClientRect();
      var total = heroScroll.offsetHeight - window.innerHeight;
      var progress = total > 0 ? (-rect.top) / total : 0;
      progress = Math.min(Math.max(progress, 0), 1);
      var targetTime = progress * heroVideo.duration;
      if (Math.abs(heroVideo.currentTime - targetTime) > 0.03) {
        heroVideo.currentTime = targetTime;
      }
    };

    window.addEventListener('scroll', updateHeroScrub, { passive: true });
    window.addEventListener('resize', updateHeroScrub);
    updateHeroScrub();
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
     Contact section WhatsApp link
     ============================================================ */
  var contactWhatsapp = document.getElementById('contactWhatsapp');
  if (contactWhatsapp) {
    contactWhatsapp.href = 'https://wa.me/' + CONFIG.whatsappNumber;
  }

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
