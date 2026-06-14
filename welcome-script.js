/* ═══════════════════════════════════════════════════
   BUONO - WELCOME PAGE SCRIPT
   All Interactions + Animations + Data Rendering
   Version: 1.0
   ═══════════════════════════════════════════════════ */

(function() {
  'use strict';

  // Performance tracker
  const startTime = performance.now();
  console.log('☕ [WELCOME] Script loading...');

  // ============ STATE ============
  const state = {
    currentTestimonial: 0,
    testimonialInterval: null,
    isScrolling: false,
    lastScrollY: 0,
    statsAnimated: false
  };

  // ============ HIDE PAGE LOADER ============
  function hidePageLoader() {
    setTimeout(() => {
      const loader = document.getElementById('pageLoader');
      if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 500);
      }
    }, 800);
  }

  // ============ RENDER HERO DATA ============
  function renderHero() {
    const data = WELCOME_DATA.hero;
    document.getElementById('heroWelcome').textContent = data.welcomeText;
    document.getElementById('heroBrand').textContent = data.brandName;
    document.getElementById('heroTagline').textContent = data.tagline;
    document.getElementById('heroSubtitle').textContent = data.subtitle;
    document.getElementById('heroDescription').textContent = data.description;
    document.getElementById('heroCtaPrimary').textContent = data.ctaPrimary;
    document.getElementById('heroCtaSecondary').textContent = data.ctaSecondary;
  }

  // ============ RENDER ABOUT DATA ============
  function renderAbout() {
    const data = WELCOME_DATA.about;
    document.getElementById('aboutTitle').textContent = data.title;
    document.getElementById('aboutPara1').textContent = data.paragraph1;
    document.getElementById('aboutPara2').textContent = data.paragraph2;
    document.getElementById('aboutPara3').textContent = data.paragraph3;

    // Render stats
    const container = document.getElementById('statsContainer');
    container.innerHTML = data.stats.map((stat, index) => `
      <div class="stat-card reveal-scale" style="animation-delay: ${index * 0.1}s;">
        <span class="stat-icon">${stat.icon}</span>
        <div class="stat-number" data-target="${stat.number}" data-suffix="${stat.suffix}">0</div>
        <div class="stat-label">${stat.label}</div>
      </div>
    `).join('');
  }

  // ============ RENDER MENU ============
  function renderMenu() {
    const data = WELCOME_DATA.menu;
    document.getElementById('menuTitle').textContent = data.title;
    document.getElementById('menuSubtitle').textContent = data.subtitle;

    const grid = document.getElementById('menuGrid');
    grid.innerHTML = data.items.map((item, index) => `
      <div class="menu-card reveal" style="transition-delay: ${index * 0.1}s;">
        ${item.badge ? `<div class="menu-card-badge">${item.badge}</div>` : ''}
        <span class="menu-card-icon">${item.icon}</span>
        <div class="menu-card-category">${item.category}</div>
        <h3 class="menu-card-name">${item.name}</h3>
        <p class="menu-card-description">${item.description}</p>
        <div class="menu-card-footer">
          <div class="menu-card-price">${item.price}</div>
          <div class="menu-card-rating">
            <span>⭐</span>
            <span>${item.rating}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  // ============ RENDER ACADEMY ============
  function renderAcademy() {
    const data = WELCOME_DATA.academy;
    document.getElementById('academyTitle').textContent = data.title;
    document.getElementById('academySubtitle').textContent = data.subtitle;

    const grid = document.getElementById('academyGrid');
    grid.innerHTML = data.courses.map((course, index) => `
      <div class="academy-card reveal" style="transition-delay: ${index * 0.15}s;">
        <div class="academy-card-header">
          <span class="academy-card-icon">${course.icon}</span>
          ${course.badge ? `<span class="academy-card-badge">${course.badge}</span>` : ''}
        </div>
        <div class="academy-card-code">${course.code}</div>
        <h3 class="academy-card-name">${course.name}</h3>
        <p class="academy-card-description">${course.description}</p>
        
        <div class="academy-card-meta">
          <div class="academy-meta-item">
            <div class="academy-meta-label">Duration</div>
            <div class="academy-meta-value">${course.duration}</div>
          </div>
          <div class="academy-meta-item">
            <div class="academy-meta-label">Level</div>
            <div class="academy-meta-value">${course.level}</div>
          </div>
          <div class="academy-meta-item">
            <div class="academy-meta-label">Fee</div>
            <div class="academy-meta-value">${course.fee}</div>
          </div>
        </div>

        <ul class="academy-card-features">
          ${course.features.map(f => `<li>${f}</li>`).join('')}
        </ul>

        <div class="academy-card-footer">
          <div class="academy-card-fee">${course.fee}</div>
          <a href="signup.html" class="academy-card-btn">Enroll Now →</a>
        </div>
      </div>
    `).join('');
  }

  // ============ RENDER WHY US ============
  function renderWhyUs() {
    const data = WELCOME_DATA.whyUs;
    document.getElementById('whyUsTitle').textContent = data.title;
    document.getElementById('whyUsSubtitle').textContent = data.subtitle;

    const grid = document.getElementById('whyUsGrid');
    grid.innerHTML = data.features.map((feature, index) => `
      <div class="feature-card reveal" style="transition-delay: ${index * 0.1}s;">
        <span class="feature-icon">${feature.icon}</span>
        <h3 class="feature-title">${feature.title}</h3>
        <p class="feature-description">${feature.description}</p>
      </div>
    `).join('');
  }

  // ============ RENDER TESTIMONIALS ============
  function renderTestimonials() {
    const data = WELCOME_DATA.testimonials;
    document.getElementById('testimonialsTitle').textContent = data.title;
    document.getElementById('testimonialsSubtitle').textContent = data.subtitle;

    const track = document.getElementById('testimonialsTrack');
    const controls = document.getElementById('testimonialsControls');

    track.innerHTML = data.reviews.map((review, index) => `
      <div class="testimonial-card ${index === 0 ? 'active' : ''}" data-index="${index}">
        <span class="testimonial-quote-icon">"</span>
        <p class="testimonial-text">${review.text}</p>
        <div class="testimonial-stars">${'★'.repeat(review.rating)}</div>
        <span class="testimonial-avatar">${review.avatar}</span>
        <div class="testimonial-name">${review.name}</div>
        <div class="testimonial-role">${review.role}</div>
      </div>
    `).join('');

    controls.innerHTML = data.reviews.map((_, index) => `
      <button class="testimonials-dot ${index === 0 ? 'active' : ''}" data-index="${index}" aria-label="Go to testimonial ${index + 1}"></button>
    `).join('');

    // Dot click handlers
    controls.querySelectorAll('.testimonials-dot').forEach(dot => {
      dot.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        showTestimonial(index);
        restartTestimonialInterval();
      });
    });
  }

  function showTestimonial(index) {
    const cards = document.querySelectorAll('.testimonial-card');
    const dots = document.querySelectorAll('.testimonials-dot');
    
    cards.forEach(card => card.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    cards[index]?.classList.add('active');
    dots[index]?.classList.add('active');
    
    state.currentTestimonial = index;
  }

  function nextTestimonial() {
    const total = WELCOME_DATA.testimonials.reviews.length;
    const next = (state.currentTestimonial + 1) % total;
    showTestimonial(next);
  }

  function startTestimonialInterval() {
    state.testimonialInterval = setInterval(nextTestimonial, 5000);
  }

  function restartTestimonialInterval() {
    clearInterval(state.testimonialInterval);
    startTestimonialInterval();
  }

  // ============ RENDER CONTACT ============
  function renderContact() {
    const data = WELCOME_DATA.contact;
    document.getElementById('contactTitle').textContent = data.title;
    document.getElementById('contactSubtitle').textContent = data.subtitle;
    document.getElementById('contactAddress').textContent = data.info.address;
    document.getElementById('contactPhone').textContent = data.info.phone;
    document.getElementById('contactWhatsapp').textContent = data.info.whatsapp;
    document.getElementById('contactEmail').textContent = data.info.email;

    // Phone href
    document.getElementById('contactPhone').href = `tel:${data.info.phone.replace(/\s/g, '')}`;
    document.getElementById('contactEmail').href = `mailto:${data.info.email}`;
    document.getElementById('contactWhatsapp').href = 
      `https://wa.me/${data.info.whatsapp.replace(/\D/g, '')}`;

    // Hours
    const hoursList = document.getElementById('contactHoursList');
    hoursList.innerHTML = data.info.hours.map(h => `
      <li>
        <span class="contact-hours-day">${h.day}</span>
        <span class="contact-hours-time">${h.time}</span>
      </li>
    `).join('');

    // Socials
    const socials = document.getElementById('contactSocials');
    socials.innerHTML = data.info.socials.map(s => `
      <a href="${s.url}" class="contact-social-link" title="${s.name}" target="_blank" rel="noopener">
        ${s.icon}
      </a>
    `).join('');
  }

  // ============ RENDER FOOTER ============
  function renderFooter() {
    const data = WELCOME_DATA.footer;
    document.getElementById('footerDescription').textContent = data.description;
    document.getElementById('footerCopyright').textContent = data.copyright;
    document.getElementById('footerMadeWith').textContent = data.madeWith;

    // Quick Links
    const quickLinks = document.getElementById('footerQuickLinks');
    quickLinks.innerHTML = data.quickLinks.map(link => `
      <li><a href="${link.href}">${link.name}</a></li>
    `).join('');

    // Services
    const services = document.getElementById('footerServices');
    services.innerHTML = data.services.map(link => `
      <li><a href="${link.href}">${link.name}</a></li>
    `).join('');

    // Legal
    const legal = document.getElementById('footerLegal');
    legal.innerHTML = data.legal.map(link => `
      <a href="${link.href}">${link.name}</a>
    `).join('');
  }

  // ============ SCROLL REVEAL ============
  function initScrollReveal() {
    const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          
          // Animate stats when visible
          if (entry.target.classList.contains('stat-card') && !state.statsAnimated) {
            animateStats();
          }
          
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(el => observer.observe(el));
  }

  // ============ ANIMATED COUNTER ============
  function animateStats() {
    if (state.statsAnimated) return;
    state.statsAnimated = true;

    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
      const target = parseInt(counter.dataset.target);
      const suffix = counter.dataset.suffix || '';
      const duration = 2000;
      const steps = 60;
      const stepDuration = duration / steps;
      const increment = target / steps;
      let current = 0;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        current = Math.min(Math.round(increment * step), target);
        counter.textContent = current + suffix;

        if (step >= steps) {
          counter.textContent = target + suffix;
          clearInterval(timer);
        }
      }, stepDuration);
    });
  }

  // ============ NAVIGATION ============
  function initNavigation() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('navHamburger');
    const mobileMenu = document.getElementById('navMobileMenu');
    
    // Scroll behavior
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      
      // Add scrolled class
      if (currentScrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
      
      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY && currentScrollY > 300) {
        navbar.classList.add('hidden');
      } else {
        navbar.classList.remove('hidden');
      }
      
      lastScrollY = currentScrollY;
      
      // Active link highlight
      updateActiveLink();
      
      // Back to top button
      const backToTop = document.getElementById('backToTop');
      if (currentScrollY > 500) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    });

    // Mobile menu toggle
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('active');
      hamburger.textContent = mobileMenu.classList.contains('active') ? '✕' : '☰';
    });

    // Close mobile menu on link click
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        hamburger.textContent = '☰';
      });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href === '#') return;
        
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const offset = 80;
          const targetPosition = target.getBoundingClientRect().top + window.scrollY - offset;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // ============ ACTIVE LINK HIGHLIGHT ============
  function updateActiveLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links .nav-link');
    
    let currentSection = '';
    const scrollY = window.scrollY + 150;
    
    sections.forEach(section => {
      if (scrollY >= section.offsetTop && scrollY < section.offsetTop + section.offsetHeight) {
        currentSection = section.id;
      }
    });
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  }

  // ============ BACK TO TOP ============
  function initBackToTop() {
    const btn = document.getElementById('backToTop');
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ============ NEWSLETTER FORM ============
  function initNewsletter() {
    const form = document.getElementById('newsletterForm');
    const input = document.getElementById('newsletterEmail');
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = input.value.trim();
      
      if (!email) return;
      
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        showFloatingMessage('Please enter a valid email', 'error');
        return;
      }
      
      // Success
      showFloatingMessage('🎉 Subscribed successfully!', 'success');
      input.value = '';
      
      // TODO: Future - save to Firestore newsletters collection
      console.log('📧 [NEWSLETTER] Subscribed:', email);
    });
  }

  // ============ FLOATING MESSAGE ============
  function showFloatingMessage(message, type = 'info') {
    const msg = document.createElement('div');
    msg.style.cssText = `
      position: fixed;
      top: 100px;
      right: 30px;
      padding: 16px 28px;
      background: ${type === 'success' ? '#51CF66' : type === 'error' ? '#FF6B6B' : '#D4AF37'};
      color: white;
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      z-index: 10000;
      animation: slideInRight 0.4s ease;
    `;
    msg.textContent = message;
    document.body.appendChild(msg);
    
    setTimeout(() => {
      msg.style.opacity = '0';
      msg.style.transform = 'translateX(100px)';
      msg.style.transition = 'all 0.3s ease';
      setTimeout(() => msg.remove(), 300);
    }, 3000);
  }

  // Add slide-in animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  // ============ INITIALIZATION ============
  function init() {
    console.log('🚀 [WELCOME] Initializing...');
    
    // Render all data
    renderHero();
    renderAbout();
    renderMenu();
    renderAcademy();
    renderWhyUs();
    renderTestimonials();
    renderContact();
    renderFooter();
    
    // Init interactions
    initNavigation();
    initScrollReveal();
    initBackToTop();
    initNewsletter();
    
    // Start testimonial auto-play
    startTestimonialInterval();
    
    // Hide loader
    hidePageLoader();
    
    const elapsed = Math.round(performance.now() - startTime);
    console.log(`✅ [WELCOME] Ready! Init time: ${elapsed}ms`);
    console.log('☕ [WELCOME] Buono Landing Page v1.0');
    console.log('🎨 [WELCOME] Coffee Theme Premium Edition');
  }

  // Start when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();