(function () {
  var CATALOG = 'https://mapphub.github.io/catalog.json';
  var grid = document.getElementById('grid');
  var store = document.getElementById('store');
  var err = document.getElementById('err');
  var installed = {};

  function api() {
    return window.MiniApp || window.MiniApps;
  }

  function letter(name) {
    return String(name || '?').trim().charAt(0).toUpperCase() || '?';
  }

  function tile(app, onClick) {
    var id = app.id || app.appId;
    var name = app.name || id;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tile';
    btn.innerHTML =
      '<span class="avatar"><span class="letter">' +
      letter(name) +
      '</span></span><span class="label"></span>';
    btn.querySelector('.label').textContent = name;
    btn.onclick = function () {
      onClick(id, app);
    };
    return btn;
  }

  async function loadInstalled() {
    var M = api();
    var apps = [];
    try {
      var res = await M.apps('list', {});
      apps = (res && res.apps) || res || [];
      if (!Array.isArray(apps)) apps = [];
    } catch (e) {
      err.textContent = e.message || e;
      apps = [];
    }
    installed = {};
    grid.innerHTML = '';
    apps.forEach(function (a) {
      var id = a.id || a.appId;
      if (!id) return;
      installed[id] = a;
      // hide pure system-only noise
      grid.appendChild(
        tile(a, function (appId) {
          M.hub('open', { appId: appId }).catch(function (e) {
            err.textContent = e.message || e;
          });
        })
      );
    });
    // always show catalog shortcut on desktop
    var cat = document.createElement('button');
    cat.type = 'button';
    cat.className = 'tile';
    cat.innerHTML =
      '<span class="avatar"><span class="letter">+</span></span><span class="label">Каталог</span>';
    cat.onclick = function () {
      document.querySelector('[data-tab="store"]').click();
    };
    grid.appendChild(cat);
  }

  async function loadStore() {
    store.innerHTML = 'Загрузка…';
    try {
      var res = await fetch(CATALOG, { cache: 'no-store' });
      var data = await res.json();
      store.innerHTML = '';
      (data.apps || []).forEach(function (app) {
        var id = app.id;
        var card = document.createElement('div');
        card.className = 'card';
        var meta = document.createElement('div');
        meta.className = 'meta';
        meta.innerHTML =
          '<strong></strong><small></small>';
        meta.querySelector('strong').textContent = app.name || id;
        meta.querySelector('small').textContent =
          'v' + (app.version || '') + (installed[id] ? ' · установлено' : '');
        card.appendChild(meta);

        var action = document.createElement('button');
        action.type = 'button';
        if (installed[id]) {
          action.textContent = 'Открыть';
          action.onclick = function () {
            api()
              .hub('open', { appId: id })
              .catch(function (e) {
                err.textContent = e.message || e;
              });
          };
        } else {
          action.textContent = 'Установить';
          action.onclick = async function () {
            action.disabled = true;
            action.textContent = '…';
            try {
              await api().apps('installUpdate', {
                appId: id,
                packageUrl: app.packageUrl || app.releaseUrl
              });
              await loadInstalled();
              meta.querySelector('small').textContent =
                'v' + (app.version || '') + ' · установлено';
              action.textContent = 'Открыть';
              action.disabled = false;
              action.onclick = function () {
                api().hub('open', { appId: id });
              };
            } catch (e) {
              err.textContent = e.message || e;
              action.disabled = false;
              action.textContent = 'Установить';
            }
          };
        }
        card.appendChild(action);
        store.appendChild(card);
      });
    } catch (e) {
      store.textContent = String(e.message || e);
    }
  }

  function boot() {
    var M = api();
    if (!M) {
      err.textContent = 'MiniApp недоступен';
      return;
    }
    try {
      M.shell('setChrome', { title: 'Лаунчер', topBar: true, bottomBar: false });
    } catch (e) {}

    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.onclick = function () {
        document.querySelectorAll('.tab').forEach(function (t) {
          t.classList.remove('active');
        });
        tab.classList.add('active');
        var name = tab.getAttribute('data-tab');
        document.getElementById('panel-home').classList.toggle('hidden', name !== 'home');
        document.getElementById('panel-store').classList.toggle('hidden', name !== 'store');
        if (name === 'store') loadStore();
      };
    });

    loadInstalled();
  }

  if (window.MiniApp || window.MiniApps) boot();
  else {
    window.addEventListener('miniapp-ready', boot);
    window.addEventListener('miniapps-ready', boot);
  }
})();
