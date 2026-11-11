(function () {
  var CATALOG = 'https://mapphub.github.io/catalog.json';
  var HOME_ID = 'market';

  var desktop = document.getElementById('desktop');
  var catalogEl = document.getElementById('catalog');
  var err = document.getElementById('err');
  var frame = document.getElementById('browser-frame');
  var browserTitle = document.getElementById('browser-title');
  var browserAction = document.getElementById('browser-action');

  var installed = {};
  var catalogApps = [];
  var current = null;

  function api() {
    return window.MiniApp || null;
  }

  function show(view) {
    ['view-home', 'view-market', 'view-browser'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.toggle('hidden', id !== view);
    });
    if (err) err.textContent = '';
  }

  function letter(name) {
    return String(name || '?').trim().charAt(0).toUpperCase() || '?';
  }

  function webUrlFor(app) {
    if (app.webUrl) return app.webUrl;
    if (app.repo) {
      var m = String(app.repo).match(/github\.com\/([^/]+)\/([^/]+)/);
      if (m) return 'https://' + m[1] + '.github.io/' + m[2].replace(/\.git$/, '') + '/';
    }
    if (app.id) return 'https://mapphub.github.io/app-' + app.id + '/';
    return null;
  }

  function ensureMarketTile() {
    if (document.getElementById('tile-market')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tile';
    btn.id = 'tile-market';
    btn.innerHTML =
      '<span class="avatar market"><span class="letter">M</span></span><span class="label">Маркет</span>';
    btn.onclick = openMarket;
    desktop.insertBefore(btn, desktop.firstChild);
  }

  function renderDesktop() {
    ensureMarketTile();
    // remove dynamic app tiles (keep #tile-market)
    Array.prototype.slice.call(desktop.querySelectorAll('.tile')).forEach(function (el) {
      if (el.id !== 'tile-market') el.remove();
    });
    Object.keys(installed).forEach(function (id) {
      if (id === HOME_ID) return;
      var a = installed[id];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tile';
      btn.innerHTML =
        '<span class="avatar"><span class="letter"></span></span><span class="label"></span>';
      btn.querySelector('.letter').textContent = letter(a.name || id);
      btn.querySelector('.label').textContent = a.name || id;
      btn.onclick = function () {
        var M = api();
        if (M && M.hub) {
          M.hub('open', { appId: id }).catch(function (e) {
            err.textContent = e.message || String(e);
          });
        } else {
          openWeb(a);
        }
      };
      desktop.appendChild(btn);
    });
  }

  async function refreshInstalled() {
    installed = {};
    var M = api();
    if (!M || !M.apps) return;
    try {
      var res = await M.apps('list', {});
      var apps = (res && res.apps) || res || [];
      if (!Array.isArray(apps)) apps = [];
      apps.forEach(function (a) {
        var id = a.id || a.appId;
        if (id) installed[id] = a;
      });
    } catch (e) {
      console.warn('[home] list', e);
    }
  }

  async function openMarket() {
    show('view-market');
    catalogEl.innerHTML = '<p class="muted">Загрузка каталога…</p>';
    await refreshInstalled();
    try {
      var res = await fetch(CATALOG, { cache: 'no-store' });
      if (!res.ok) throw new Error('catalog HTTP ' + res.status);
      var data = await res.json();
      catalogApps = data.apps || [];
      catalogEl.innerHTML = '';
      catalogApps.forEach(function (app) {
        if (!app || !app.id || app.id === HOME_ID) return;
        var isInst = !!installed[app.id];
        var card = document.createElement('button');
        card.type = 'button';
        card.className = 'card';
        card.innerHTML =
          '<span class="avatar"><span class="letter"></span></span>' +
          '<span class="meta"><strong></strong><small></small></span>' +
          '<span class="badge"></span>';
        card.querySelector('.letter').textContent = letter(app.name || app.id);
        card.querySelector('strong').textContent = app.name || app.id;
        card.querySelector('small').textContent =
          (app.description || app.author || '') +
          (app.version ? ' · v' + app.version : '');
        var badge = card.querySelector('.badge');
        badge.textContent = isInst ? 'установлено' : 'веб';
        if (isInst) badge.classList.add('on');
        card.onclick = function () {
          openWeb(app);
        };
        catalogEl.appendChild(card);
      });
      if (!catalogEl.children.length) {
        catalogEl.innerHTML = '<p class="muted">Каталог пуст</p>';
      }
    } catch (e) {
      catalogEl.innerHTML =
        '<p class="muted">Не удалось загрузить каталог: ' +
        String(e.message || e) +
        '</p>';
    }
  }

  function openWeb(app) {
    var url = webUrlFor(app);
    // Fallback: still allow install even if web 404
    current = {
      id: app.id,
      name: app.name || app.id,
      webUrl: url,
      packageUrl: app.packageUrl || app.releaseUrl || ''
    };
    browserTitle.textContent = current.name;
    updateActionBtn();
    if (url) {
      frame.src = url;
    } else {
      frame.srcdoc =
        '<body style="font-family:system-ui;padding:24px">Нет webUrl для этого приложения. Можно установить пакет.</body>';
    }
    show('view-browser');
  }

  function updateActionBtn() {
    if (!current) return;
    var isInst = !!installed[current.id];
    browserAction.textContent = isInst ? 'Удалить' : 'Установить';
    browserAction.classList.toggle('danger', isInst);
    browserAction.disabled = false;
  }

  async function onAction() {
    if (!current) return;
    var M = api();
    if (!M || !M.apps) {
      err.textContent = 'Установка доступна только внутри оболочки MiniApp';
      return;
    }
    browserAction.disabled = true;
    try {
      if (installed[current.id]) {
        await M.apps('remove', { appId: current.id });
        delete installed[current.id];
      } else {
        if (!current.packageUrl) throw new Error('Нет packageUrl');
        browserAction.textContent = '…';
        await M.apps('installUpdate', {
          appId: current.id,
          packageUrl: current.packageUrl
        });
        await refreshInstalled();
      }
      updateActionBtn();
      renderDesktop();
    } catch (e) {
      err.textContent = e.message || String(e);
      updateActionBtn();
    }
  }

  function wire() {
    var market = document.getElementById('tile-market');
    if (market) market.onclick = openMarket;
    document.getElementById('market-back').onclick = function () {
      show('view-home');
      renderDesktop();
    };
    document.getElementById('market-refresh').onclick = function () {
      openMarket();
    };
    document.getElementById('browser-back').onclick = function () {
      frame.src = 'about:blank';
      current = null;
      show('view-market');
    };
    browserAction.onclick = onAction;
  }

  async function boot() {
    wire();
    // Always show desktop with Market first — do not block on MiniApp
    renderDesktop();
    show('view-home');

    var M = api();
    if (M) {
      try {
        await M.shell('setChrome', { title: 'Рабочий стол', topBar: false, bottomBar: false });
      } catch (_) {}
      await refreshInstalled();
      renderDesktop();
    }
  }

  // Immediate paint
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  window.addEventListener('miniapp-ready', function () {
    refreshInstalled().then(renderDesktop);
  });
})();
