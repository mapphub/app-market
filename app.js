(async function () {
  const CATALOG = 'https://mapphub.github.io/catalog.json';
  const list = document.getElementById('list');
  try {
    const res = await fetch(CATALOG);
    const data = await res.json();
    for (const app of data.apps || []) {
      const li = document.createElement('li');
      li.innerHTML = '<strong>' + (app.name || app.id) + '</strong> <small>v' + (app.version || '') + '</small>';
      if (app.packageUrl) {
        const a = document.createElement('a');
        a.href = app.packageUrl;
        a.textContent = ' zip';
        a.target = '_blank';
        li.appendChild(a);
      }
      list.appendChild(li);
    }
  } catch (e) {
    list.textContent = String(e);
  }
})();
