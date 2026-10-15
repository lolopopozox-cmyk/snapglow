// SnapGlow Admin Panel Logic
(function() {
  var loginScreen = document.getElementById('loginScreen');
  var dashboard = document.getElementById('dashboard');
  var loginBtn = document.getElementById('loginBtn');
  var logoutBtn = document.getElementById('logoutBtn');
  var adminPass = document.getElementById('adminPass');
  var loginError = document.getElementById('loginError');

  // Check if already logged in (session in sessionStorage)
  if (sessionStorage.getItem('adminAuth') === 'true') {
    showDashboard();
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', function() {
      var pass = adminPass.value.trim();
      if (!pass) { loginError.style.display = 'block'; loginError.textContent = 'Enter password'; return; }
      // Verify against env variable via API
      fetch('/api/admin/stats', {
        method: 'GET',
        headers: { 'x-admin-key': pass }
      })
      .then(function(r) {
        if (r.status === 200) { return r.json(); }
        throw new Error('Unauthorized');
      })
      .then(function(data) {
        sessionStorage.setItem('adminAuth', 'true');
        showDashboard();
        loadData(data);
      })
      .catch(function() {
        loginError.style.display = 'block';
        loginError.textContent = 'Wrong password';
      });
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      sessionStorage.removeItem('adminAuth');
      loginScreen.style.display = 'block';
      dashboard.style.display = 'none';
    });
  }

  function showDashboard() {
    loginScreen.style.display = 'none';
    dashboard.style.display = 'block';
    // Load data
    fetch('/api/admin/stats', { method: 'GET', headers: { 'x-admin-key': 'snapglow2024' } })
    .then(function(r) { return r.json(); })
    .then(function(data) { loadData(data); })
    .catch(function() { document.getElementById('contactList').innerHTML = '<p style="color:var(--danger)">Failed to load</p>'; });
  }

  function loadData(data) {
    if (!data) return;
    document.getElementById('totalViews').textContent = data.totalViews || 0;
    var contacts = data.contacts || [];
    var cl = document.getElementById('contactList');
    if (contacts.length === 0) {
      cl.innerHTML = '<p style="color:var(--txt-mute)">No messages yet</p>';
    } else {
      cl.innerHTML = '';
      contacts.forEach(function(c) {
        cl.innerHTML += '<div style="background:var(--bg-dark);padding:12px;border-radius:8px;margin-bottom:8px">' +
          '<strong>' + (c.name || 'Anonymous') + '</strong> &lt;' + (c.email || 'no email') + '&gt;<br>' +
          '<span style="color:var(--txt-dim)">' + (c.message || '') + '</span><br>' +
          '<small style="color:var(--txt-mute)">' + (c.date || '') + '</small></div>';
      });
    }
  }

  // CSV Download
  var csvBtn = document.getElementById('downloadCSV');
  if (csvBtn) {
    csvBtn.addEventListener('click', function() {
      fetch('/api/admin/stats', { method: 'GET', headers: { 'x-admin-key': 'snapglow2024' } })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var contacts = data.contacts || [];
        var csv = 'Name,Email,Message,Date\n';
        contacts.forEach(function(c) {
          csv += '"' + (c.name||'').replace(/"/g,'""') + '","' + (c.email||'').replace(/"/g,'""') + '","' + (c.message||'').replace(/"/g,'""') + '","' + (c.date||'') + '"\n';
        });
        var blob = new Blob([csv], { type: 'text/csv' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a'); a.href = url; a.download = 'snapglow-contacts.csv'; a.click();
        URL.revokeObjectURL(url);
      });
    });
  }
})();