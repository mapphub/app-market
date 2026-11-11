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
  var current = null; // { id, name, webUrl, packageUrl }

  function api() { return window.MiniApp; }

  function show(view) {
    ['view-home', 'view-market', 'view-browser'].forEach(function (id) {
      document.getElementById(id).classList.toggle('hidden', id !== view);
    });
    err.textContent = '';
  }

  function letter(name) {
    return String(name || '?').trim().charAt(0).toUpperCase() || '?';
  }

  function tile(opts) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tile';
    var avClass = 'avatar' + (opts.market ? ' market' : '');
    btn.innerHTML =
      '<span class="' + avClass + '"><span class="letter"></span></span><span class="label"></span>';
    btn.querySelector('.letter').textContent = opts.letter || letter(opts.name);
    btn.querySelector('.label').textContent = opts.name || opts.id;
    btn.onclick = opts.onClick;
    return btn;
  }

  function webUrlFor(app) {
    if (app.webUrl) return app.webUrl;
    if (app.repo) {
      // GitHub Pages convention: mapphub/app-chat → https://mapphub.github.io/app-chat/
      var m = String(app.repo).match(/github\.com\/([^/]+)\/([^/]+)/);
      if (m) return 'https://' + m[1] + '.github.io/' + m[2].replace(/\.git$/, '') + '/';
    }
    if (app.id && app.id !== HOME_ID) {
      return 'https://mapphub.github.io/app-' + app.id + '/';
    }
    return null;
  }

  async function refreshInstalled() {
    installed = {};
    try {
      var res = await api().apps('list', {});
      var apps = (res && res.apps) || res || [];
      if (!Array.isArray(apps)) apps = [];
      apps.forEach(function (a) {
        var id = a.id || a.appId;
        if (id) installed[id] = a;
      });
    } catch (e) {
      console.warn(e);
    }
  }

  function renderDesktop() {
    desktop.innerHTML = '';
    // Always: Market icon only as system entry; other installed apps (not home)
    desktop.appendChild(
      tile({
        name: 'Маркет',
        letter: 'M',
        market: true,
        onClick: function () {
          openMarket();
        }
      })
    );
    Object.keys(installed).forEach(function (id) {
      if (id === HOME_ID) return;
      var a = installed[id];
      desktop.appendChild(
        tile({
          id: id,
          name: a.name || id,
          onClick: function () {
            // Prefer local package if installed
            api()
              .hub('open', { appId: id })
              .catch(function (e) {
                err.textContent = e.message || e;
              });
          }
        })
      );
    });
  }

  async function openMarket() {
    show('view-market');
    catalogEl.innerHTML = 'Загрузка…';
    await refreshInstalled();
    try {
      var res = await fetch(CATALOG, { cache: 'no-store' });
      var data = await res.json();
      catalogApps = data.apps || [];
      catalogEl.innerHTML = '';
      catalogApps.forEach(function (app) {
        if (app.id === HOME_ID) return; // home itself not in catalog grid as installable loop
        catalogEl.appendChild(
          tile({
            id: app.id,
            name: app.name || app.id,
            onClick: function () {
              openWeb(app);
            }
          })
        );
      });
      if (!catalogEl.children.length) {
        catalogEl.textContent = 'Каталог пуст';
      }
    } catch (e) {
      catalogEl.textContent = String(e.message || e);
    }
  }

  function openWeb(app) {
    var url = webUrlFor(app);
    if (!url) {
      err.textContent = 'Нет webUrl для ' + (app.id || app.name);
      return;
    }
    current = {
      id: app.id,
      name: app.name || app.id,
      webUrl: url,
      packageUrl: app.packageUrl || app.releaseUrl || ''
    };
    browserTitle.textContent = current.name;
    updateActionBtn();
    frame.src = url;
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
    browserAction.disabled = true;
    try {
      if (installed[current.id]) {
        await M.apps('remove', { appId: current.id });
        delete installed[current.id];
        try {
          await M.notify('toast', { text: 'Удалено: ' + current.name });
        } catch (_) {}
      } else {
        if (!current.packageUrl) throw new Error('Нет packageUrl');
        browserAction.textContent = '…';
        await M.apps('installUpdate', {
          appId: current.id,
          packageUrl: current.packageUrl
        });
        await refreshInstalled();
        try {
          await M.notify('toast', { text: 'Установлено: ' + current.name });
        } catch (_) {}
      }
      updateActionBtn();
      renderDesktop();
    } catch (e) {
      err.textContent = e.message || e;
      updateActionBtn();
    }
  }

  async function boot() {
    var M = api();
    if (!M) {
      err.textContent = 'MiniApp недоступен';
      return;
    }
    try {
      await M.shell('setChrome', { title: 'Рабочий стол', topBar: false, bottomBar: false });
    } catch (_) {}

    document.getElementById('market-back').onclick = function () {
      show('view-home');
      renderDesktop();
    };
    document.getElementById('browser-back').onclick = function () {
      frame.src = 'about:blank';
      current = null;
      show('view-market');
    };
    browserAction.onclick = onAction;

    await refreshInstalled();
    renderDesktop();
    show('view-home');
  }

  if (window.MiniApp) boot();
  else window.addEventListener('miniapp-ready', boot);
})();
