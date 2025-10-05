document.addEventListener('DOMContentLoaded', () => {
  const $ = (s) => document.querySelector(s);
  const input = $('#apiKey');
  const saveBtn = $('#save');
  const clearBtn = $('#clear');
  const toggleBtn = $('#toggleVis');
  const copyBtn = $('#copyKey');
  const toast = $('#toast');

  // Load saved key
  chrome.storage.local.get(['groqApiKey'], (res) => {
    if (res.groqApiKey) input.value = res.groqApiKey;
    setDirty(false);
  });

  // Basic format check: starts with gsk_
  function validKey(v) {
    return /^gsk_[A-Za-z0-9-_]{16,}$/.test((v || '').trim());
  }

  function setDirty(state) {
    saveBtn.disabled = !state || !validKey(input.value);
  }

  input.addEventListener('input', () => setDirty(true));

  // Save
  document.getElementById('apiForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value.trim();
    if (!validKey(v)) return toastMsg('Enter a valid Groq key (starts with gsk_).');
    chrome.storage.local.set({ groqApiKey: v }, () => {
      toastMsg('API key saved.');
      setDirty(false);
    });
  });

  // Clear stored key
  clearBtn.addEventListener('click', () => {
    input.value = '';
    chrome.storage.local.remove(['groqApiKey'], () => toastMsg('Key cleared.'));
    setDirty(false);
  });

  // Show/Hide
  toggleBtn.addEventListener('click', () => {
    input.type = input.type === 'password' ? 'text' : 'password';
    toggleBtn.classList.toggle('on');
  });

  // Copy to clipboard
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(input.value || '');
      toastMsg('Copied to clipboard.');
    } catch {
      toastMsg('Copy failed.');
    }
  });

  // Tiny toast helper
  let t;
  function toastMsg(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(t);
    t = setTimeout(() => toast.classList.remove('show'), 1600);
  }
});
