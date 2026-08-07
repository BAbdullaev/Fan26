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
