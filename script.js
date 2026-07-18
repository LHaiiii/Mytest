const optionsWrapper = document.getElementById('optionsWrapper');
const addCustomOptionButton = document.getElementById('addCustomOptionButton');
const customOptionRow = document.getElementById('customOptionRow');
const customOptionInput = document.getElementById('customOptionInput');
const contactInput = document.getElementById('contactInfo');
const honeypot = document.getElementById('website');
const form = document.getElementById('choiceForm');
const submitButton = document.getElementById('submitButton');
const messageEl = document.getElementById('message');
const pageShell = document.querySelector('.page-shell');
const optionsGrid = optionsWrapper.querySelector('.options-grid');

const selectedOptions = new Set();

function toggleOption(option) {
  const value = option.dataset.value || '';
  if (!value) {
    return;
  }

  if (selectedOptions.has(value)) {
    selectedOptions.delete(value);
    option.classList.remove('active');
  } else {
    selectedOptions.add(value);
    option.classList.add('active', 'pulse');
    setTimeout(() => option.classList.remove('pulse'), 180);
  }

  clearValidationError();
}

function bindChip(option) {
  option.addEventListener('click', () => toggleOption(option));
}

Array.from(document.querySelectorAll('.option-chip[data-value]')).forEach(bindChip);

// FIX: look up an existing chip by value (case-insensitive, trimmed) so we
// never end up with two chips that share a value but are out of sync with
// the `selectedOptions` Set.
function findChipByValue(value) {
  const normalized = value.trim().toLowerCase();
  return Array.from(optionsGrid.querySelectorAll('.option-chip[data-value]')).find(
    (chip) => (chip.dataset.value || '').trim().toLowerCase() === normalized
  );
}

addCustomOptionButton.addEventListener('click', () => {
  customOptionRow.hidden = false;
  customOptionRow.classList.add('show');
  customOptionInput.focus();
});

customOptionInput.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') {
    return;
  }

  event.preventDefault();
  const value = customOptionInput.value.trim();

  if (!value) {
    showError('Thêm món cho tôi thử phát');
    return;
  }

  const existingChip = findChipByValue(value);

  if (existingChip) {
    // FIX: instead of creating a duplicate chip, just make sure the
    // existing one is selected and let the user know, so the UI and
    // `selectedOptions` never disagree about what's chosen.
    if (!selectedOptions.has(existingChip.dataset.value)) {
      toggleOption(existingChip);
    }
    showError(`"${existingChip.dataset.value}" đã có trong danh sách rồi nhé`);
    customOptionInput.value = '';
    customOptionRow.classList.remove('show');
    customOptionRow.hidden = true;
    return;
  }

  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'option-chip active pulse';
  chip.dataset.value = value;
  chip.textContent = value;
  bindChip(chip);

  optionsGrid.insertBefore(chip, addCustomOptionButton);
  selectedOptions.add(value);
  customOptionInput.value = '';
  customOptionRow.classList.remove('show');
  customOptionRow.hidden = true;
  clearValidationError();

  setTimeout(() => chip.classList.remove('pulse'), 180);
});

// Endpoint dùng cho gửi (POST) và xem kết quả (GET) cục bộ trên server Node.js / Express
const SUBMIT_URL = '/submit';

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (honeypot.value.trim() !== '') {
    return;
  }

  if (selectedOptions.size === 0) {
    showError('Bạn hãy chọn 1 món đê !!');
    optionsWrapper.classList.remove('error');
    void optionsWrapper.offsetWidth;
    optionsWrapper.classList.add('error');
    return;
  }

  startLoading();

  const payload = {
    selectedFoods: Array.from(selectedOptions),
    sender: contactInput.value.trim(),
    timestamp: new Date().toISOString(),
    source: 'birthday-food-picker'
  };

  try {
    const response = await fetch(SUBMIT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Không thể gửi dữ liệu lúc này.');
    }

    showSuccess(result.message || 'Tôi sẽ bao bạn những món đó (nếu có thể)');
    resetFormState();
    // Add the success class last so the CSS transition to the "done" view
    // happens after resetFormState has already cleared the old selections.
    pageShell.classList.add('success');
  } catch (error) {
    showError(error.message || 'Không thể gửi dữ liệu lúc này. Vui lòng thử lại sau.');
  } finally {
    stopLoading();
  }
});

function startLoading() {
  submitButton.disabled = true;
  submitButton.classList.add('loading');
}

function stopLoading() {
  submitButton.disabled = false;
  submitButton.classList.remove('loading');
}

function showError(text) {
  messageEl.textContent = text;
  messageEl.className = 'message error';
}

function showSuccess(text) {
  messageEl.textContent = text;
  messageEl.className = 'message success';
}

function clearValidationError() {
  optionsWrapper.classList.remove('error');
  if (messageEl.classList.contains('error')) {
    messageEl.textContent = '';
    messageEl.className = 'message';
  }
}

// FIX: after a successful submission, clear all in-memory state (selected
// values, active chip styling, and the name field) so that if the page is
// ever shown again (e.g. a future "submit another" button, or the success
// class being removed), it starts from a clean slate instead of resubmitting
// stale selections.
function resetFormState() {
  selectedOptions.clear();
  Array.from(optionsGrid.querySelectorAll('.option-chip.active')).forEach((chip) => {
    chip.classList.remove('active');
  });
  contactInput.value = '';
  customOptionInput.value = '';
  customOptionRow.classList.remove('show');
  customOptionRow.hidden = true;
}

const backToSurveyBtn = document.getElementById('backToSurveyBtn');
if (backToSurveyBtn) {
  backToSurveyBtn.addEventListener('click', () => {
    pageShell.classList.remove('success');
    messageEl.textContent = '';
    messageEl.className = 'message';
  });
}
