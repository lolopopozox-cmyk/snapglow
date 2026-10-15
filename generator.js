// SnapGlow - AI Image Generator Logic
(function(){
  if (SG.ageOk()) { var g = document.getElementById('ageGate'); if (g) g.classList.add('hide'); }

  var imageData = null;
  var genBtn = document.getElementById('generateBtn');
  var resultBox = document.getElementById('resultBox');
  var resultActions = document.getElementById('resultActions');
  var downloadBtn = document.getElementById('downloadBtn');

  if (genBtn) {
    genBtn.addEventListener('click', function() {
      var username = document.getElementById('username').value.trim();
      var prompt = document.getElementById('prompt').value.trim();
      var ageConfirm = document.getElementById('ageConfirm').checked;

      if (!username) { SG.toast('Please enter a username'); return; }
      if (!ageConfirm) { SG.toast('You must confirm you are 18+'); return; }

      genBtn.disabled = true; genBtn.textContent = 'Generating...';
      resultActions.style.display = 'none';
      SG.spinner(resultBox);

      // Call backend API
      fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, prompt: prompt, ageConfirm: ageConfirm })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        genBtn.disabled = false; genBtn.textContent = 'Generate Image';
        if (data.success) {
          if (data.imageUrl) {
            imageData = data.imageUrl;
            resultBox.innerHTML = '<img src="' + data.imageUrl + '" alt="Generated Profile Pic" style="max-width:100%;max-height:380px;border-radius:8px">';
            resultActions.style.display = 'block';
          } else if (data.text) {
            resultBox.innerHTML = '<div style="padding:20px;color:var(--text-secondary)">' + data.text + '</div>';
          }
          // Award coins for generating
          SG.addCoins(5);
          var genCount = SG.g('genCount', 0); genCount++; SG.s('genCount', genCount);
          if (genCount >= 10) SG.giveBadge('SnapKing');
        } else {
          resultBox.innerHTML = '<p style="color:var(--txt-dim);padding:20px">' + (data.error || 'Generation failed. Try again.') + '</p>';
          resultActions.style.display = 'none';
        }
      })
      .catch(function(err) {
        genBtn.disabled = false; genBtn.textContent = 'Generate Image';
        resultBox.innerHTML = '<p style="color:var(--txt-dim);padding:20px">Network error. Please try again later.</p>';
        resultActions.style.display = 'none';
      });
    });
  }

  // Download button
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function() {
      if (!imageData) return;
      if (imageData.startsWith('data:')) {
        var link = document.createElement('a'); link.href = imageData; link.download = 'snapglow-profile.png'; link.click();
      } else {
        window.open(imageData, '_blank');
      }
    });
  }

  // Snap Score Booster (embedded in generator page if element exists)
  var boosterBtn = document.getElementById('boostBtn');
  if (boosterBtn) {
    var boostCount = SG.g('boostCount', 0);
    boosterBtn.addEventListener('click', function() {
      boostCount++; SG.s('boostCount', boostCount);
      var display = document.getElementById('boostScore');
      if (display) {
        var currentScore = parseInt(display.textContent.replace(/,/g,'')) || 0;
        var added = Math.floor(Math.random() * 500) + 100;
        display.textContent = SG.fmt(currentScore + added);
        display.classList.add('score-boost');
        setTimeout(function() { display.classList.remove('score-boost'); }, 400);
      }
      if (boostCount >= 10) SG.giveBadge('10Boosts');
    });
  }
})();