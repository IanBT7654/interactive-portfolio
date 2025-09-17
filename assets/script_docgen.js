// Debug toggle: true = use dummy data, false = call real AI function
const USE_DUMMY_DATA = true;

const form = document.getElementById('docForm');
const docPrompt = document.getElementById('docPrompt');
const recipientEmail = document.getElementById('recipientEmail');
const docOutput = document.getElementById('docOutput');
const previewSection = document.getElementById('previewSection');
const downloadBtn = document.getElementById('downloadBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log('⚠️ [001] Submit handler started');

  const promptText = docPrompt.value.trim();
  const email = recipientEmail.value.trim();

  if (!promptText || !email) {
    return alert('Please enter both prompt and email.');
  }

  let generatedText;

  if (USE_DUMMY_DATA) {
    console.log('⚠️ [002] Using dummy data');
    generatedText = `Dummy document content.\nGenerated for prompt: "${promptText}".\nSent to: ${email}`;
  } else {
    console.log('⚠️ [003] Calling generateDocumentWithAI() from Supabase...');
    generatedText = await generateDocumentWithAI(promptText, email);
    if (!generatedText) {
      return alert('AI failed to generate the document.');
    }
  }

  const brandedHtml = renderBrandedPDFDocument(generatedText);
  console.log('⚠️ [004] Generated branded HTML length:', brandedHtml.length);

  docOutput.innerHTML = brandedHtml;
  previewSection.classList.remove('hidden');
  console.log('⚠️ [005] Preview section shown');
});

// Handle download button
downloadBtn.addEventListener('click', async () => {
  console.log("🧾 Download button clicked");
  await generatePdfClientSide();
});

// Render the branded PDF HTML
function renderBrandedPDFDocument(aiText = '') {
  const title = 'Automate-AIG Generated Document';

  const htmlFormattedContent = aiText
    .replace(/^### (.*$)/gim, '<h3 style="font-size: 18px;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size: 20px;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="font-size: 22px;">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>');

  return `
    <div style="font-family: 'Roboto Mono', monospace; font-size: 14px; color: #000; background: white; border: 1px solid #ccc; border-radius: 8px; overflow: visible; width: 100%; max-width: 750px; margin: auto;">
      <div style="background: linear-gradient(to right, #2563eb, #4f46e5); color: white; padding: 24px 32px;">
        <h1 style="margin: 0; font-size: 24px;">${title}</h1>
        <p style="margin-top: 4px; font-size: 14px;">Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      <div style="padding: 32px;">
        <p>${htmlFormattedContent}</p>
      </div>
      <div style="background-color: #f5f8ff; color: #555; font-size: 12px; padding: 16px 32px; text-align: center; border-top: 1px solid #ccc;">
        &copy; 2025 Ian B | Built with GitHub, Supabase, Resend, and html2pdf.js
      </div>
    </div>
  `;
}

// PDF generation function
async function generatePdfClientSide() {
  const element = document.getElementById('docOutput');

  if (!element || !element.innerHTML.trim()) {
    console.error("❌ docOutput is empty. Aborting PDF generation.");
    return alert("Document content is empty.");
  }

  console.log('🧾 Starting client-side PDF generation');
  console.log('📦 Content size:', element.offsetWidth, 'x', element.offsetHeight);

  const opt = {
    margin: 0.5,
    filename: `branded-document-${Date.now()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  await new Promise(resolve => setTimeout(resolve, 300));
  await html2pdf().set(opt).from(element).save();
}

// Optional Supabase integration function
async function generateDocumentWithAI(promptText, email) {
  try {
    const response = await fetch('/api/generate-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptText, email })
    });

    if (!response.ok) {
      console.error("❌ Failed to fetch document from Supabase");
      return null;
    }

    const result = await response.json();
    console.log("✅ Document generated via Supabase:", result);
    return result?.content || null;

  } catch (err) {
    console.error("❌ Error calling Supabase:", err);
    return null;
  }
}
