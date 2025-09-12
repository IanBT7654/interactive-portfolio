import { supabaseClient } from './config.js';

const form = document.getElementById('aigEntryForm');
const inputs = Array.from(document.querySelectorAll('.aig-numeric-input'));
const livePreview = document.getElementById('livePreview');
const aiErrorMsg = document.getElementById('aiErrorMessage');
const rawErrorMsg = document.getElementById('rawErrorMessage');
const submitBtn = document.getElementById('submitBtn');
const col1Input = document.getElementById('col1');

const groqApiUrl = 'https://tuktukjust3.functions.supabase.co/groq_explain';

// Clear both error message containers
function clearErrors() {
  aiErrorMsg.textContent = '';
  rawErrorMsg.textContent = '';
  rawErrorMsg.style.opacity = '0';
}

// Show a human-readable explanation
function showAIError(message) {
  aiErrorMsg.textContent = message;
}

// Show the raw error for 10 seconds
function showRawError(error) {
  rawErrorMsg.textContent = error;
  rawErrorMsg.style.opacity = '1';
  setTimeout(() => {
    rawErrorMsg.style.transition = 'opacity 1s ease';
    rawErrorMsg.style.opacity = '0';
  }, 10000);
}

// Validate form inputs (optional — currently disabled)
function validateInputs() {
  return inputs.every(input => input.value.trim() !== '' && !isNaN(Number(input.value)));
}

// Fetch latest rows
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
          ${data.map(row => `
            <tr class="hover:bg-indigo-50">
              <td class="border px-2 py-1">${row.id}</td>
              <td class="border px-2 py-1">${row.col1}</td>
              <td class="border px-2 py-1">${row.col2}</td>
              <td class="border px-2 py-1">${row.col3}</td>
              <td class="border px-2 py-1">${row.col4}</td>
              <td class="border px-2 py-1">${row.col5}</td>
              <td class="border px-2 py-1">${row.col6}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  livePreview.innerHTML = tableHTML;
}

// Autofill columns 2–6 from col1
col1Input.addEventListener('input', () => {
  const base = parseInt(col1Input.value, 10);
  if (!isNaN(base) && base <= 50) {
    for (let i = 1; i < inputs.length; i++) {
      inputs[i].value = base + i;
    }
    fetchAndRenderTableRows(); // Refresh preview after fill
  }
});

// Submit handler
async function handleSubmit(e) {
  e.preventDefault();
  clearErrors();

  // Optionally re-enable validation
  // if (!validateInputs()) {
  //   showAIError('Please enter valid numeric values in all columns.');
  //   return;
  // }

  const rowData = {};
  inputs.forEach(input => {
    rowData[input.name] = input.value === '' ? null : Number(input.value);
  });

  try {
    const { data, error } = await supabaseClient
      .from('aig_entries')
      .insert([rowData]);

    if (error) {
      showRawError(error.message);

      // Ask GROQ to explain the error
      try {
        const aiResponse = await fetch(groqApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Supabase-Project-Ref': 'tuktukjust3',
            Authorization: 'Bearer ${GROQ_API_KEY}'
          },
          body: JSON.stringify({ query: error.message })
        });

        const aiData = await aiResponse.json();
        if (aiData?.explanation) {
          showAIError(aiData.explanation);
        } else {
          showAIError('⚠️ An unexpected error occurred.');
        }
      } catch (groqErr) {
        console.warn('Groq call failed:', groqErr);
        showAIError('⚠️ AI explanation unavailable.');
      }

      return;
    }

    // All good!
    showAIError('✅ Entry submitted successfully!');
    inputs.forEach(input => (input.value = ''));
    fetchAndRenderTableRows();

  } catch (err) {
    showAIError('❌ Unexpected error occurred.');
    showRawError(err.message);
  }
}

// Clear errors while typing
inputs.forEach(input => {
  input.addEventListener('input', () => {
    aiErrorMsg.textContent = '';
    rawErrorMsg.textContent = '';
  });
});

form.addEventListener('submit', handleSubmit);
fetchAndRenderTableRows(); // Load data initially
