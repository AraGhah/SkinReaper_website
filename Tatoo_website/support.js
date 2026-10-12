/*
 * support.js: runtime for .dc.html Design Component files.
 *
 * Template syntax (inside <x-dc><template> ... </template></x-dc>):
 *   {{ expr }}                         text or attribute interpolation (escaped)
 *   <sc-for each="list" as="item" index="i"> ... </sc-for>
 *   <sc-if test="expr"> ... </sc-if> <sc-else> ... </sc-else>
 *   on-click="method(arg1, arg2)"      also on-input, on-change, on-submit, on-keydown
 *                                      the DOM event is passed as the last argument
 *   if-checked="expr"                  boolean attribute (any name after "if-")
 *   sc-html="expr"                     raw HTML content (trusted strings only)
 *   data-key="..."                     forces a fresh node when the key changes
 *
 * Expressions are evaluated against: props, state, then the object returned by renderVals().
 */
(function () {
  var EVENTS = ['click', 'input', 'change', 'submit', 'keydown'];
  var VOID = { AREA: 1, BASE: 1, BR: 1, COL: 1, EMBED: 1, HR: 1, IMG: 1, INPUT: 1, LINK: 1, META: 1, SOURCE: 1, TRACK: 1, WBR: 1 };
  var cache = new Map();

  function compile(expr) {
    var fn = cache.get(expr);
    if (!fn) {
      fn = new Function('$s', 'with ($s) { return (' + expr + '); }');
      cache.set(expr, fn);
    }
    return fn;
  }

  function evaluate(expr, scope) {
    try {
      return compile(expr)(scope);
    } catch (err) {
      console.warn('[dc] expression failed:', expr, err);
      return '';
    }
  }

  function esc(v) {
    return String(v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function interp(str, scope) {
    if (str.indexOf('{{') === -1) return str;
    return str.replace(/\{\{([\s\S]+?)\}\}/g, function (_, e) {
      var v = evaluate(e.trim(), scope);
      return v == null || v === false ? '' : String(v);
    });
  }

  function renderNodes(nodes, scope, ctx) {
    var out = '';
    var lastIf = null;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.nodeType === 3) {
        out += esc(interp(n.nodeValue, scope));
        continue;
      }
      if (n.nodeType !== 1) continue;
      var tag = n.tagName;

      if (tag === 'SC-FOR') {
        var list = evaluate(n.getAttribute('each'), scope) || [];
        var as = n.getAttribute('as') || 'item';
        var idx = n.getAttribute('index') || 'i';
        for (var j = 0; j < list.length; j++) {
          var child = Object.create(scope);
          child[as] = list[j];
          child[idx] = j;
          out += renderNodes(n.childNodes, child, ctx);
        }
        continue;
      }
      if (tag === 'SC-IF') {
        lastIf = !!evaluate(n.getAttribute('test'), scope);
        if (lastIf) out += renderNodes(n.childNodes, scope, ctx);
        continue;
      }
      if (tag === 'SC-ELSE') {
        if (lastIf === false) out += renderNodes(n.childNodes, scope, ctx);
        lastIf = null;
        continue;
      }

      var name = n.localName;
      var html = null;
      var attrs = '';
      for (var a = 0; a < n.attributes.length; a++) {
        var at = n.attributes[a];
        var an = at.name;
        if (an.indexOf('on-') === 0) {
          var m = /^\s*([\w$]+)\s*(?:\(([\s\S]*)\))?\s*$/.exec(at.value);
          if (!m) continue;
          var args = m[2] && m[2].trim() ? evaluate('[' + m[2] + ']', scope) : [];
          ctx.handlers.push({ method: m[1], args: args || [] });
          attrs += ' data-dc-' + an.slice(3) + '="' + (ctx.handlers.length - 1) + '"';
        } else if (an.indexOf('if-') === 0) {
          if (evaluate(at.value, scope)) attrs += ' ' + an.slice(3);
        } else if (an === 'sc-html') {
          var raw = evaluate(at.value, scope);
          html = raw == null ? '' : String(raw);
        } else {
          attrs += ' ' + an + '="' + esc(interp(at.value, scope)) + '"';
        }
      }
      out += '<' + name + attrs + '>';
      if (VOID[tag]) continue;
      out += html != null ? html : renderNodes(n.childNodes, scope, ctx);
      out += '</' + name + '>';
    }
    return out;
  }

  function sameNode(a, b) {
    if (a.nodeType !== b.nodeType) return false;
    if (a.nodeType !== 1) return true;
    return a.tagName === b.tagName && a.getAttribute('data-key') === b.getAttribute('data-key');
  }

  function patch(o, n) {
    if (o.nodeType !== 1) {
      if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue;
      return;
    }
    var i, at;
    for (i = o.attributes.length - 1; i >= 0; i--) {
      at = o.attributes[i];
      if (!n.hasAttribute(at.name)) o.removeAttribute(at.name);
    }
    for (i = 0; i < n.attributes.length; i++) {
      at = n.attributes[i];
      if (o.getAttribute(at.name) !== at.value) o.setAttribute(at.name, at.value);
    }
    var tag = o.tagName;
    if (tag === 'INPUT') {
      if (o.type === 'checkbox' || o.type === 'radio') o.checked = n.hasAttribute('checked');
      else if (o.type !== 'file') {
        var v = n.getAttribute('value') || '';
        if (o.value !== v) o.value = v;
      }
      return;
    }
    if (tag === 'TEXTAREA') {
      if (o.value !== n.value) o.value = n.value;
      return;
    }
    if (tag === 'IFRAME') return;
    morph(o, n);
  }

  function morph(from, to) {
    var oldKids = Array.prototype.slice.call(from.childNodes);
    var newKids = Array.prototype.slice.call(to.childNodes);
    for (var i = 0; i < newKids.length; i++) {
      var n = newKids[i];
      var o = oldKids[i];
      if (!o) from.appendChild(n);
      else if (sameNode(o, n)) patch(o, n);
      else from.replaceChild(n, o);
    }
    for (var k = newKids.length; k < oldKids.length; k++) from.removeChild(oldKids[k]);
  }

  function Component(props) {
    this.props = props || {};
    this.state = {};
  }

  Component.prototype.renderVals = function () {
    return {};
  };

  Component.prototype.setState = function (patchObj) {
    var next = typeof patchObj === 'function' ? patchObj(this.state) : patchObj;
    for (var k in next) this.state[k] = next[k];
    this.update();
  };

  Component.prototype.update = function () {
    var self = this;
    if (self._queued || !self._root) return;
    self._queued = true;
    requestAnimationFrame(function () {
      self._queued = false;
      self._render();
    });
  };

  Component.prototype._render = function () {
    var scope = Object.create(null);
    var k;
    for (k in this.props) scope[k] = this.props[k];
    scope.props = this.props;
    for (k in this.state) scope[k] = this.state[k];
    scope.state = this.state;
    var vals = this.renderVals() || {};
    for (k in vals) scope[k] = vals[k];

    var ctx = { handlers: [] };
    var html = renderNodes(this._tpl.childNodes, scope, ctx);
    var t = document.createElement('template');
    t.innerHTML = html;
    this._handlers = ctx.handlers;
    morph(this._root, t.content);
    if (!this._mounted) {
      this._mounted = true;
      if (this.mounted) this.mounted();
    }
    if (this.updated) this.updated();
  };

  function mount(Ctor, host, props) {
    host = host || document.querySelector('x-dc');
    if (!host) throw new Error('[dc] no <x-dc> element found');

    var helmet = document.querySelector('helmet');
    if (helmet) {
      while (helmet.firstChild) document.head.appendChild(helmet.firstChild);
      helmet.parentNode.removeChild(helmet);
    }

    var tplEl = host.querySelector('template');
    var tpl = tplEl ? tplEl.content : document.createRange().createContextualFragment(host.innerHTML);
    var root = document.createElement('div');
    root.setAttribute('data-dc-root', '');
    host.parentNode.replaceChild(root, host);

    var comp = new Ctor(props || {});
    comp._tpl = tpl;
    comp._root = root;

    EVENTS.forEach(function (type) {
      root.addEventListener(type, function (e) {
        var attr = 'data-dc-' + type;
        var el = e.target;
        while (el && el !== root) {
          if (el.nodeType === 1 && el.hasAttribute(attr)) {
            var h = comp._handlers[+el.getAttribute(attr)];
            if (!h || typeof comp[h.method] !== 'function') return;
            if (type === 'submit') e.preventDefault();
            comp[h.method].apply(comp, h.args.concat([e]));
            return;
          }
          el = el.parentNode;
        }
      });
    });

    comp._render();
    return comp;
  }

  window.DC = { Component: Component, mount: mount };
})();
