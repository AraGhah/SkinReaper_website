/*
 * image-slot.js — drag and drop placeholders for images that are not in img/ yet.
 *
 *   ImageSlot.src(path)      path, or a local preview URL if a file was dropped on the slot
 *   ImageSlot.missing(path)  true once the browser failed to load the path
 *   ImageSlot.onChange(fn)   called whenever a probe finishes or a file is dropped
 *
 * Any element with data-slot="img/w1.png" accepts a dropped image or opens a file picker on click.
 * Dropped files are previews for this browser session only. Save the real file into img/ to publish it.
 */
(function () {
  var status = {};
  var overrides = {};
  var listeners = [];

  function notify() {
    listeners.forEach(function (fn) { fn(); });
  }

  function probe(path) {
    if (status[path]) return;
    status[path] = 'loading';
    var img = new Image();
    img.onload = function () { status[path] = 'ok'; notify(); };
    img.onerror = function () { status[path] = 'missing'; notify(); };
    img.src = path;
  }

  function set(path, file) {
    if (!file || !/^image\//.test(file.type)) return;
    if (overrides[path]) URL.revokeObjectURL(overrides[path]);
    overrides[path] = URL.createObjectURL(file);
    notify();
  }

  function pick(path) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function () { set(path, input.files && input.files[0]); };
    input.click();
  }

  function zoneOf(e) {
    return e.target && e.target.closest ? e.target.closest('[data-slot]') : null;
  }

  document.addEventListener('dragover', function (e) {
    var z = zoneOf(e);
    if (!z) return;
    e.preventDefault();
    z.setAttribute('data-over', '');
  });
  document.addEventListener('dragleave', function (e) {
    var z = zoneOf(e);
    if (z) z.removeAttribute('data-over');
  });
  document.addEventListener('drop', function (e) {
    var z = zoneOf(e);
    if (!z) return;
    e.preventDefault();
    z.removeAttribute('data-over');
    set(z.getAttribute('data-slot'), e.dataTransfer.files && e.dataTransfer.files[0]);
  });
  document.addEventListener('click', function (e) {
    var z = zoneOf(e);
    if (z) pick(z.getAttribute('data-slot'));
  });
  document.addEventListener('keydown', function (e) {
    var z = zoneOf(e);
    if (z && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      pick(z.getAttribute('data-slot'));
    }
  });

  window.ImageSlot = {
    src: function (path) {
      return overrides[path] || path;
    },
    missing: function (path) {
      probe(path);
      return !overrides[path] && status[path] === 'missing';
    },
    onChange: function (fn) {
      listeners.push(fn);
    }
  };
})();
