document.addEventListener('DOMContentLoaded', () => {
    const $ = (s) => document.querySelector(s);

    const input = $('#apiKey');
    const modelSelect = $('#modelSelect');
    const saveBtn = $('#save');
    const clearBtn = $('#clear');
    const toggleBtn = $('#toggleVis');
    const copyBtn = $('#copyKey');
    const toast = $('#toast');

    // Load saved settings
    chrome.storage.sync.get(['groqApiKey', 'groqModel'], (res) => {
        if (res.groqApiKey) input.value = res.groqApiKey;
        if (res.groqModel) {
            const optionExists = Array.from(modelSelect.options).some(opt => opt.value === res.groqModel);
            if (optionExists) {
                modelSelect.value = res.groqModel;
            } else {
                modelSelect.value = "meta-llama/llama-4-scout-17b-16e-instruct";
            }
        }
    });

    function validKey(v) {
        return /^gsk_[A-Za-z0-9-_]{16,}$/.test((v || '').trim());
    }

    // Save
    document.getElementById('apiForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const key = input.value.trim();

        if (key && !validKey(key)) return toastMsg('Enter a valid Groq key (starts with gsk_).');

        chrome.storage.sync.set({ 
            groqApiKey: key,
            groqModel: modelSelect.value
        }, () => {
            toastMsg('Settings saved successfully.');
        });
    });

    // Clear
    clearBtn.addEventListener('click', () => {
        input.value = '';
        chrome.storage.sync.remove(['groqApiKey'], () => toastMsg('API Key cleared.'));
    });

    // Show/Hide
    toggleBtn.addEventListener('click', () => {
        input.type = input.type === 'password' ? 'text' : 'password';
    });

    // Copy
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(input.value || '');
            toastMsg('Copied to clipboard.');
        } catch {
            toastMsg('Copy failed.');
        }
    });

    let t;
    function toastMsg(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(t);
        t = setTimeout(() => toast.classList.remove('show'), 2000);
    }
});