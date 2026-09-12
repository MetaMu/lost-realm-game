(function () {
  'use strict';
  const endpoint = 'https://vqellojlkdiczhjuehah.supabase.co/rest/v1/leaderboard_scores';
  const headers = { apikey: 'sb_publishable_H9IGjyapGijKSfsd5EJ_zQ_Ji7Ab-qT', 'Content-Type': 'application/json' };
  async function request(query = '', body) {
    const response = await fetch(endpoint + query, {
      method: body ? 'POST' : 'GET', headers, signal: AbortSignal.timeout(12000),
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    if (!response.ok) {
      if (body && response.status === 409) return; // Same run already saved after a retry.
      throw new Error('Leaderboard unavailable. Please try again.');
    }
    return body ? undefined : response.json();
  }
  const dialog = document.createElement('dialog');
  dialog.id = 'leaderboardDialog';
  dialog.innerHTML = '<button class="dialog-close" aria-label="Close leaderboard">×</button><p class="eyebrow">THE SHARED HALL OF GUARDIANS</p><h2>Knoll legends</h2><p>Top 25 · Ranked by victory, level, wave reached, then birds defeated.</p><p class="leader-status" role="status"></p><ol class="leader-list"></ol><button class="primary leader-refresh">Refresh rankings</button><p><small>Community scores are player-reported. Nicknames are public and not reserved.</small></p>';
  document.body.append(dialog);
  dialog.querySelector('.dialog-close').onclick = () => dialog.close();
  let loading = false;
  async function refresh() {
    if (loading) return;
    loading = true;
    const status = dialog.querySelector('.leader-status'), list = dialog.querySelector('ol');
    status.textContent = 'Loading shared scores…';
    try {
      const rows = await request('?select=player_name,kills,stage,wave,won&order=won.desc,stage.desc,wave.desc,kills.desc,created_at.asc&limit=25');
      list.replaceChildren();
      for (const row of rows) {
        const li = document.createElement('li');
        const name = document.createElement('strong'), detail = document.createElement('span');
        name.textContent = row.player_name;
        detail.textContent = `${row.won ? 'Victory · ' : ''}Level ${row.stage} · Wave ${row.wave} · ${row.kills} birds`;
        li.append(name, document.createElement('br'), detail); list.append(li);
      }
      status.textContent = rows.length ? '' : 'No scores yet. Be the first to defend the knoll!';
    } catch (error) { status.textContent = error.message; }
    finally { loading = false; }
  }
  dialog.querySelector('.leader-refresh').onclick = refresh;
  const open = () => { if (!dialog.open) dialog.showModal(); refresh(); };
  const button = document.createElement('button'); button.className = 'quiet'; button.textContent = 'Leaderboard'; button.onclick = open;
  document.querySelector('.masthead nav').prepend(button);

  const form = document.createElement('form'); form.className = 'leader-submit';
  form.innerHTML = '<label for="playerNickname">Your public nickname</label><input id="playerNickname" name="nickname" maxlength="24" required autocomplete="nickname" placeholder="e.g. Forest Defender"><button class="primary" type="submit">Save my run</button><p role="status"></p><button class="text-btn" type="button">View shared leaderboard →</button>';
  document.querySelector('#restartBtn').before(form);
  form.querySelector('button[type="button"]').onclick = open;
  const input = form.querySelector('input'), submit = form.querySelector('[type="submit"]'), message = form.querySelector('p');
  try { input.value = localStorage.getItem('knoll-nickname') || ''; } catch {}
  let run = null, busy = false;
  window.addEventListener('knoll-run-ended', ({ detail }) => {
    run = { run_id: crypto.randomUUID(), kills: detail.kills, stage: detail.stage, wave: detail.wave, won: detail.won };
    busy = false; submit.disabled = false; input.disabled = false; message.textContent = 'Optional: publish this run with a nickname. No account needed.';
  });
  form.onsubmit = async event => {
    event.preventDefault();
    if (!run || busy || submit.disabled) return;
    const name = input.value.trim();
    if (!name || name.length > 24 || /[\x00-\x1f\x7f<>]/.test(name)) { message.textContent = 'Use 1–24 characters, without < or >.'; return; }
    const current = run;
    busy = true; submit.disabled = true; message.textContent = 'Saving your run…';
    try {
      await request('', { ...current, player_name: name });
      try { localStorage.setItem('knoll-nickname', name); } catch {}
      if (run === current) { message.textContent = 'Saved to the shared leaderboard!'; input.disabled = true; }
    } catch (error) { if (run === current) { message.textContent = error.message; submit.disabled = false; } }
    finally { if (run === current) busy = false; }
  };
})();
