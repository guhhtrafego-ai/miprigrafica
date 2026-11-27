/* Mipri Gráfica Express — main.js */
(function () {
  "use strict";

  /* ---------- Mobile navigation ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var mainNav = document.querySelector(".main-nav");

  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = mainNav.classList.toggle("open");
      navToggle.classList.toggle("open", isOpen);
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Dropdown toggle on mobile (tap "Serviços" to expand submenu)
    document.querySelectorAll(".has-dropdown > a").forEach(function (link) {
      link.addEventListener("click", function (e) {
        if (window.innerWidth <= 860) {
          var parent = link.parentElement;
          var alreadyOpen = parent.classList.contains("open");
          if (!alreadyOpen) {
            e.preventDefault();
            document.querySelectorAll(".has-dropdown.open").forEach(function (el) {
              el.classList.remove("open");
            });
            parent.classList.add("open");
          }
        }
      });
    });

    // Close mobile menu when a normal link is clicked
    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.innerWidth <= 860 && !link.parentElement.classList.contains("has-dropdown")) {
          mainNav.classList.remove("open");
          navToggle.classList.remove("open");
          navToggle.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  /* ---------- Vídeo de fundo do hero ---------- */
  // Só baixa o vídeo (4 MB) em telas largas e quando o usuário não pediu
  // "reduzir movimento". No celular fica só o fundo teal + overlay.
  var heroVideo = document.querySelector(".hero-video[data-src]");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (heroVideo && !reduceMotion && window.matchMedia("(min-width: 641px)").matches) {
    var source = document.createElement("source");
    source.src = heroVideo.getAttribute("data-src");
    source.type = "video/webm";
    heroVideo.appendChild(source);
    heroVideo.load();
    var playPromise = heroVideo.play();
    if (playPromise && playPromise.catch) playPromise.catch(function () {});
  }

  /* ---------- Hero carousel ---------- */
  var slides = document.querySelectorAll(".hero-slide");
  if (slides.length > 1) {
    var dotsWrap = document.querySelector(".hero-dots");
    var current = 0;
    var intervalMs = 6000;
    var timer;

    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", "Ir para slide " + (i + 1));
        if (i === 0) dot.classList.add("active");
        dot.addEventListener("click", function () {
          goToSlide(i);
          resetTimer();
        });
        dotsWrap.appendChild(dot);
      });
    }

    var dots = dotsWrap ? dotsWrap.querySelectorAll("button:not(.hero-pause)") : [];

    function goToSlide(index) {
      var newIndex = (index + slides.length) % slides.length;
      if (newIndex === current) return;

      // Direção pelo caminho mais curto no círculo de slides: 1 = entra pela
      // direita (avançando), -1 = entra pela esquerda (voltando).
      var diff = (newIndex - current + slides.length) % slides.length;
      var direction = diff <= slides.length / 2 ? 1 : -1;

      var oldSlide = slides[current];
      var newSlide = slides[newIndex];

      // Posiciona o slide que vai entrar do lado correto, sem transição,
      // antes de animar — assim ele sempre parte do lugar certo.
      newSlide.style.transition = "none";
      newSlide.style.transform = "translateX(" + (direction === 1 ? "100%" : "-100%") + ")";
      void newSlide.offsetWidth; // força o reflow pra aplicar a posição instantânea
      newSlide.style.transition = "";
      newSlide.classList.add("active");

      requestAnimationFrame(function () {
        newSlide.style.transform = "translateX(0)";
        oldSlide.style.transform = "translateX(" + (direction === 1 ? "-100%" : "100%") + ")";
      });

      oldSlide.classList.remove("active");
      if (dots[current]) dots[current].classList.remove("active");
      current = newIndex;
      if (dots[current]) dots[current].classList.add("active");
    }

    function nextSlide() { goToSlide(current + 1); }
    function prevSlide() { goToSlide(current - 1); }

    // Autoplay pausa com o mouse em cima, com foco do teclado dentro do
    // carrossel, com a aba em segundo plano, ou pelo botão de pausa
    // (WCAG 2.2.2). Não inicia se o usuário prefere menos movimento.
    var userPaused = reduceMotion;
    var hoverPaused = false;

    function resetTimer() {
      clearInterval(timer);
      if (!userPaused && !hoverPaused && !document.hidden) {
        timer = setInterval(nextSlide, intervalMs);
      }
    }

    var carousel = document.querySelector(".hero-carousel");
    if (carousel) {
      carousel.addEventListener("mouseenter", function () { hoverPaused = true; resetTimer(); });
      carousel.addEventListener("mouseleave", function () { hoverPaused = false; resetTimer(); });
      carousel.addEventListener("focusin", function () { hoverPaused = true; resetTimer(); });
      carousel.addEventListener("focusout", function (e) {
        if (!carousel.contains(e.relatedTarget)) { hoverPaused = false; resetTimer(); }
      });
    }
    document.addEventListener("visibilitychange", resetTimer);

    if (dotsWrap) {
      var pauseBtn = document.createElement("button");
      pauseBtn.type = "button";
      pauseBtn.className = "hero-pause";
      var syncPauseBtn = function () {
        pauseBtn.textContent = userPaused ? "Retomar" : "Pausar";
        pauseBtn.setAttribute("aria-label", userPaused ? "Retomar troca automática de slides" : "Pausar troca automática de slides");
      };
      syncPauseBtn();
      pauseBtn.addEventListener("click", function () {
        userPaused = !userPaused;
        syncPauseBtn();
        resetTimer();
      });
      dotsWrap.appendChild(pauseBtn);
    }

    var nextBtn = document.querySelector(".hero-arrow.next");
    var prevBtn = document.querySelector(".hero-arrow.prev");
    if (nextBtn) nextBtn.addEventListener("click", function () { nextSlide(); resetTimer(); });
    if (prevBtn) prevBtn.addEventListener("click", function () { prevSlide(); resetTimer(); });

    resetTimer();
  }

  /* ---------- Active nav link highlighting ---------- */
  var currentPath = window.location.pathname.replace(/\/+$/, "").split("/").pop() || "index.html";
  document.querySelectorAll(".main-nav a[href]").forEach(function (link) {
    var href = link.getAttribute("href").split("/").pop();
    if (href === currentPath) link.classList.add("active");
  });
  // Também marca o item "Serviços" como ativo quando a página atual é uma
  // subpágina de serviço, sem depender de class="active" fixa no HTML.
  document.querySelectorAll(".has-dropdown").forEach(function (item) {
    if (item.querySelector(".dropdown a.active")) {
      item.querySelector(":scope > a").classList.add("active");
    }
  });

  /* ---------- Contact form ---------- */
  // O envio é feito pelo Web3Forms (serviço gratuito, sem servidor nosso):
  // ele recebe os dados e manda um e-mail para o endereço ligado à chave
  // abaixo. A chave é pública (feita para ficar no site); ela só permite
  // mandar mensagens para esse e-mail. Para trocar o e-mail de destino,
  // gere uma chave nova em https://web3forms.com com o novo endereço.
  // Sem chave, o formulário volta a abrir um e-mail (mailto) preenchido.
  var WEB3FORMS_KEY = "";
  var WEB3FORMS_URL = "https://api.web3forms.com/submit";
  var FALLBACK_EMAIL = "mipri@miprigrafica.com";
  var ERROR_MESSAGE = "Não foi possível enviar agora. Fale conosco pelo WhatsApp (11) 94981-0102.";

  document.querySelectorAll("form.contact-form-el").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var statusEl = form.querySelector(".form-status");
      var button = form.querySelector('button[type="submit"]');
      var data = new FormData(form);
      var payload = {};
      data.forEach(function (value, key) { payload[key] = value; });

      function showStatus(type, message) {
        if (!statusEl) return;
        statusEl.textContent = message;
        statusEl.className = "form-status " + type;
      }

      function trackSubmit() {
        if (window.dataLayer) {
          window.dataLayer.push({ event: "contact_form_submit", form_id: form.id || "contact_form" });
        }
      }

      if (WEB3FORMS_KEY) {
        if (button) { button.disabled = true; button.dataset.label = button.textContent; button.textContent = "Enviando..."; }
        showStatus("", "");

        fetch(WEB3FORMS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            access_key: WEB3FORMS_KEY,
            subject: "Orçamento pelo site: " + (payload.nome || "") + " (" + (payload.assunto || "") + ")",
            from_name: "Site Mipri Gráfica",
            botcheck: payload.botcheck || "",
            "Nome": payload.nome || "",
            email: payload.email || "",
            "Telefone / WhatsApp": payload.telefone || "",
            "Assunto": payload.assunto || "",
            "Mensagem": payload.mensagem || "",
            "Enviado da página": window.location.href,
          }),
        })
          .then(function (response) {
            return response.json().catch(function () { return {}; }).then(function (json) {
              if (!response.ok || !json.success) throw new Error(json.message || "HTTP " + response.status);
            });
          })
          .then(function () {
            trackSubmit();
            showStatus("success", "Mensagem enviada com sucesso! Em breve entraremos em contato.");
            form.reset();
          })
          .catch(function () {
            showStatus("error", ERROR_MESSAGE);
          })
          .then(function () {
            if (button) { button.disabled = false; button.textContent = button.dataset.label; }
          });
      } else {
        trackSubmit();
        var subject = encodeURIComponent("Contato via site - " + (payload.nome || ""));
        var body = encodeURIComponent(
          "Nome: " + (payload.nome || "") +
          "\nE-mail: " + (payload.email || "") +
          "\nTelefone: " + (payload.telefone || "") +
          "\nAssunto: " + (payload.assunto || "") +
          "\nMensagem: " + (payload.mensagem || "")
        );
        window.location.href = "mailto:" + FALLBACK_EMAIL + "?subject=" + subject + "&body=" + body;
        showStatus("success", "Abrindo seu e-mail para concluir o envio...");
      }
    });
  });

  /* ---------- WhatsApp click tracking (GA4/GTM) ---------- */
  document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"]').forEach(function (link) {
    link.addEventListener("click", function () {
      if (window.dataLayer) {
        window.dataLayer.push({ event: "whatsapp_click", link_url: link.href });
      }
    });
  });

  /* ---------- Catálogo de produtos / lightbox ---------- */
  // Cada .product-card tem seu próprio conjunto de fotos (foto principal +
  // miniaturas). O lightbox navega só dentro das fotos daquele produto.
  var lightbox = document.getElementById("lightbox");
  var productCards = document.querySelectorAll(".product-card");
  if (lightbox && productCards.length) {
    var lightboxImg = lightbox.querySelector(".lightbox-img");
    var lightboxCounter = lightbox.querySelector(".lightbox-counter");
    var activeItems = [];
    var lightboxIndex = 0;

    function showLightbox(index) {
      lightboxIndex = (index + activeItems.length) % activeItems.length;
      var img = activeItems[lightboxIndex].querySelector("img");
      // data-full aponta para a versão grande (a miniatura é pequena demais para o lightbox).
      lightboxImg.src = img.getAttribute("data-full") || img.currentSrc || img.src;
      lightboxImg.alt = img.alt;
      if (lightboxCounter) lightboxCounter.textContent = (lightboxIndex + 1) + " / " + activeItems.length;
    }

    function openLightbox(items, index) {
      activeItems = items;
      showLightbox(index);
      lightbox.classList.toggle("single", items.length <= 1);
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
      lightbox.classList.remove("open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    productCards.forEach(function (card) {
      var items = Array.prototype.slice.call(card.querySelectorAll(".gallery-item"));
      items.forEach(function (item, index) {
        item.addEventListener("click", function () { openLightbox(items, index); });
      });
    });

    var closeBtn = lightbox.querySelector(".lightbox-close");
    var prevBtn = lightbox.querySelector(".lightbox-arrow.prev");
    var nextBtn = lightbox.querySelector(".lightbox-arrow.next");
    if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
    if (prevBtn) prevBtn.addEventListener("click", function () { showLightbox(lightboxIndex - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { showLightbox(lightboxIndex + 1); });

    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") showLightbox(lightboxIndex - 1);
      if (e.key === "ArrowRight") showLightbox(lightboxIndex + 1);
    });
  }

  /* ---------- Catálogo: filtro de categoria + busca por texto ---------- */
  // homeCategoryFilter só existe no catálogo combinado (Home e /servicos);
  // productSearch existe ali e também em cada subpágina de categoria (buscando
  // só dentro dos produtos daquela página). As duas coisas se combinam quando
  // ambas existem na mesma página.
  var categoryNav = document.getElementById("homeCategoryFilter");
  var searchInput = document.getElementById("productSearch");
  var noResultsMsg = document.getElementById("noResultsMessage");

  if (categoryNav || searchInput) {
    var scope = document.getElementById("homeProductGrid") || document.querySelector(".product-grid");
    var cards = scope ? Array.prototype.slice.call(scope.querySelectorAll(".product-card")) : [];
    var activeCategory = "todos";

    var diacriticsRe = new RegExp(
      "[" + String.fromCharCode(0x0300) + "-" + String.fromCharCode(0x036f) + "]",
      "g"
    );
    function normalizeText(str) {
      return str.toLowerCase().normalize("NFD").replace(diacriticsRe, "");
    }

    function applyFilters() {
      var query = searchInput ? normalizeText(searchInput.value.trim()) : "";
      var visibleCount = 0;
      cards.forEach(function (card) {
        var matchesCategory = !categoryNav || activeCategory === "todos" || card.getAttribute("data-category") === activeCategory;
        var titleEl = card.querySelector(".product-card-title");
        var matchesSearch = !query || (titleEl && normalizeText(titleEl.textContent).indexOf(query) !== -1);
        var show = matchesCategory && matchesSearch;
        card.style.display = show ? "" : "none";
        if (show) visibleCount++;
      });
      if (noResultsMsg) noResultsMsg.style.display = visibleCount === 0 ? "" : "none";
    }

    if (categoryNav) {
      var filterBtns = Array.prototype.slice.call(categoryNav.querySelectorAll("[data-filter]"));
      filterBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          filterBtns.forEach(function (b) { b.classList.remove("active"); });
          btn.classList.add("active");
          activeCategory = btn.getAttribute("data-filter");
          applyFilters();
        });
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", applyFilters);
    }
  }

  /* ---------- Voltar ao topo ---------- */
  // A rolagem suave até #top é feita pelo CSS (html{scroll-behavior:smooth}).
  var backToTop = document.getElementById("backToTop");
  if (backToTop) {
    window.addEventListener(
      "scroll",
      function () {
        backToTop.classList.toggle("visible", window.scrollY > 500);
      },
      { passive: true }
    );
  }
})();
