import { supabaseClient } from './config.js';

// Elements
const form = document.getElementById('aigEntryForm');
const inputs = Array.from(document.querySelectorAll('.aig-numeric-input')); // your numeric inputs have this class
const livePreview = document.getElementById('livePreview');
const aiErrorMsg = document.getElementById('aiErrorMessage');
const rawErrorMsg = document.getElementById('rawErrorMessage');
const submitBtn = document.getElementById('submitBtn');

// Clear error messages
function clearErrors() {
  aiErrorMsg.textContent = '';
  rawErrorMsg.textContent = '';
  rawErrorMsg.style.opacity = '0';
}

// Update live preview
function updateLivePreview() {
  const values = inputs.map(input => input.value.trim());
  // If any input is empty or not a valid number, highlight but still show preview with what user has entered
  const rows = `<pre>${values.join(' | ')}</pre>`;
  livePreview.innerHTML = rows;
}

// Show AI-friendly error (always visible until new submission)
function showAIError(message) {
  aiErrorMsg.textContent = message;
}

// Show raw error for 2 seconds then fade
function showRawError(error) {
  rawErrorMsg.textContent = error;
  rawErrorMsg.style.opacity = '1';
  setTimeout(() => {
    rawErrorMsg.style.transition = 'opacity 1s ease';
    rawErrorMsg.style.opacity = '0';
  }, 2000);
}

// Validate inputs: all numeric and not empty
function validateInputs() {
  for (const input of inputs) {
    if (input.value.trim() === '' || isNaN(Number(input.value))) {
      return false;
    }
  }
  return true;
}

async function handleSubmit(e) {
  e.preventDefault();
  clearErrors();

  if (!validateInputs()) {
    showAIError('Please enter valid numeric values in all columns.');
    return;
  }

  // Prepare data for insert
  const rowData = {};
  inputs.forEach((input, idx) => {
    // assuming input names are col1, col2, ...
    rowData[input.name] = Number(input.value);
  });

  try {
    const { data, error } = await supabaseClient
      .from('aig_entries')
      .insert([rowData]);

    if (error) {
      showAIError('Oops! Something went wrong with your submission. Please check your data.');
      showRawError(error.message);
      return;
    }

    // Success: clear form and update preview
    inputs.forEach(input => (input.value = ''));
    updateLivePreview();
    showAIError('✅ Entry submitted successfully!');

  } catch (err) {
    showAIError('Unexpected error occurred.');
    showRawError(err.message);
  }
}

// Event listeners
inputs.forEach(input => {
  input.addEventListener('input', updateLivePreview);
});

form.addEventListener('submit', handleSubmit);

// Initialize preview
updateLivePreview();
