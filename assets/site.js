/* Falah Academy — scroll-reveal (progressive enhancement).
   Elements only get the .rvl class when JS runs and the user
   hasn't asked for reduced motion, so content is never hidden. */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  var targets = document.querySelectorAll(
    'body > section, body > footer, body > div > section, form > .card'
  );

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(function (el) {
    el.classList.add('rvl');
    io.observe(el);
  });
})();

/* Mobile nav — collapses the header <nav> behind a hamburger button
   (assets/site.css only shows .nav-toggle / turns .hdr nav into a
   dropdown at 980px and below; desktop is untouched). */
(function () {
  var toggle = document.querySelector('.hdr .nav-toggle');
  var nav = document.querySelector('.hdr nav');
  if (!toggle || !nav) return;

  function closeNav() {
    nav.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = nav.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('click', function (e) {
    if (nav.classList.contains('nav-open') && !nav.contains(e.target) && e.target !== toggle) closeNav();
  });
  nav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeNav);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 980) closeNav();
  });
})();
