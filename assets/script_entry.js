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

  // Render as table
  const tableHTML = `
    <div class="overflow-auto">
      <table class="min-w-full border text-sm text-left text-gray-700 bg-white">
        <thead class="bg-gray-100 sticky top-0 z-10">
          <tr>
            <th class="border px-2 py-1">ID</th>
            <th class="border px-2 py-1">Col1</th>
            <th class="border px-2 py-1">Col2</th>
            <th class="border px-2 py-1">Col3</th>
            <th class="border px-2 py-1">Col4</th>
            <th class="border px-2 py-1">Col5</th>
            <th class="border px-2 py-1">Col6</th>
          </tr>
        </thead>
        <tbody>
          ${data
            .map(row => `
              <tr class="hover:bg-indigo-50">
                <td class="border px-2 py-1">${row.id}</td>
                <td class="border px-2 py-1">${row.col1}</td>
                <td class="border px-2 py-1">${row.col2}</td>
                <td class="border px-2 py-1">${row.col3}</td>
                <td class="border px-2 py-1">${row.col4}</td>
                <td class="border px-2 py-1">${row.col5}</td>
                <td class="border px-2 py-1">${row.col6}</td>
              </tr>
            `)
            .join('')}
        </tbody>
      </table>
    </div>
  `;

  livePreview.innerHTML = tableHTML;
}

// Auto-fill logic when Column 1 changes
const col1Input = document.getElementById('col1');
col1Input.addEventListener('input', () => {
  const base = parseInt(col1Input.value, 10);
  if (!isNaN(base) && base <= 50) {
    for (let i = 1; i < inputs.length; i++) {
      const nextVal = base + i;
      if (inputs[i]) inputs[i].value = nextVal;
    }
    updateLivePreview();
  }
});

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
