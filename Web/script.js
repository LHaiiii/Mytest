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

const selectedOptions = new Set();

const defaultOptions = Array.from(document.querySelectorAll('.option-chip[data-value]'));

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

defaultOptions.forEach((option) => {
  option.addEventListener('click', () => toggleOption(option));
});

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

  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'option-chip active pulse';
  chip.dataset.value = value;
  chip.textContent = value;
  chip.addEventListener('click', () => toggleOption(chip));

  optionsWrapper.querySelector('.options-grid').insertBefore(chip, addCustomOptionButton);
  selectedOptions.add(value);
  customOptionInput.value = '';
  customOptionRow.classList.remove('show');
  customOptionRow.hidden = true;
  clearValidationError();

  setTimeout(() => chip.classList.remove('pulse'), 180);
});

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

  const baseUrl = window.location.protocol === 'file:'
    ? 'http://localhost:5001'
    : window.location.origin;
  const submissionEndpoint = `${baseUrl}/submit`;
  const payload = {
    selectedFoods: Array.from(selectedOptions),
    sender: contactInput.value.trim(),
    timestamp: new Date().toISOString(),
    source: 'birthday-food-picker'
  };

  try {
    const response = await fetch(submissionEndpoint, {
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

    pageShell.classList.add('success');
    showSuccess(result.message || 'Tôi sẽ bao bạn những món đó (nếu có thể)');
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
