import { supabaseClient } from './config.js';

// Elements
const form = document.getElementById('aigEntryForm');
const inputs = Array.from(document.querySelectorAll('.aig-numeric-input'));
const livePreview = document.getElementById('livePreview');
const aiErrorMsg = document.getElementById('aiErrorMessage');
const rawErrorMsg = document.getElementById('rawErrorMessage');
const submitBtn = document.getElementById('submitBtn');

function clearErrors() {
  aiErrorMsg.textContent = '';
  rawErrorMsg.textContent = '';
  rawErrorMsg.style.opacity = '0';
}

// Renders fetched rows into the preview box
async function fetchAndRenderTableRows() {
  const { data, error } = await supabaseClient
    .from('aig_entries')
    .select('*')
    .order('id', { ascending: false })
    .limit(30);

  if (error) {
    livePreview.innerHTML = `<p class="text-red-600">❌ Failed to fetch rows: ${error.message}</p>`;
    return;
  }

  if (!data.length) {
    livePreview.innerHTML = `<p class="text-gray-500">No entries yet.</p>`;
    return;
  }

  // Render as a compact block per row
  livePreview.innerHTML = data.map(row => {
    const { id, ...cols } = row;
    return `
      <div class="mb-3 p-2 bg-white border rounded shadow-sm">
        <div class="text-xs text-gray-500 mb-1">ID: ${id}</div>
        <pre class="text-sm">${JSON.stringify(cols, null, 2)}</pre>
      </div>
    `;
  }).join('');
}

function showAIError(message) {
  aiErrorMsg.textContent = message;
}

function showRawError(error) {
  rawErrorMsg.textContent = error;
  rawErrorMsg.style.opacity = '1';
  setTimeout(() => {
    rawErrorMsg.style.transition = 'opacity 1s ease';
    rawErrorMsg.style.opacity = '0';
  }, 2000);
}

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

  const rowData = {};
  inputs.forEach((input) => {
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

    // Success: clear form and refresh preview
    inputs.forEach(input => (input.value = ''));
    showAIError('✅ Entry submitted successfully!');
    fetchAndRenderTableRows();

  } catch (err) {
    showAIError('Unexpected error occurred.');
    showRawError(err.message);
  }
}

// Live update on input
inputs.forEach(input => {
  input.addEventListener('input', () => {
    aiErrorMsg.textContent = '';
    rawErrorMsg.textContent = '';
  });
});

form.addEventListener('submit', handleSubmit);

// Initial preview load
fetchAndRenderTableRows();
