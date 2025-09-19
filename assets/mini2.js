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
    generatedText = `Dummy generated document content.\nSecond line of dummy content.\nPrompt was: "${promptText}"`;
  } else {
    console.log('⚠️ [003] Attempting to call generateDocumentWithAI (not expected in minimal)');
    generatedText = await generateDocumentWithAI(promptText);
    if (!generatedText) {
      return alert('AI failed to generate document.');
    }
  }

  // Convert to branded HTML
  const brandedHtml = renderBrandedPDFDocument(generatedText);
  console.log('⚠️ [004] Generated branded HTML length:', brandedHtml.length);

  // Insert into DOM
  docOutput.innerHTML = brandedHtml;

  // Force DOM reflow (in case html2pdf renders before styles apply)
  docOutput.offsetHeight;

  // Reveal preview section
  previewSection.classList.remove('hidden');
  console.log('⚠️ [005] Preview section shown');

  // Log current docOutput innerHTML
  console.log('⚠️ [006] docOutput.innerHTML:', docOutput.innerHTML.slice(0, 300) + '...');
});


 async function generatePdfClientSide() {
    const element = document.getElementById('docOutput');

    if (!element || !element.innerHTML.trim()) {
      console.error("❌ docOutput is empty. Aborting PDF generation.");
      return alert("Document content is empty.");
    }

    console.log('🧾 Starting client-side PDF generation');
    console.log('📦 Content size:', element.offsetWidth, 'x', element.offsetHeight);

    const opt = {
      margin:       0.5,
      filename:     `branded-document-${Date.now()}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Optional: Wait a short moment to let DOM styles apply
    await new Promise(resolve => setTimeout(resolve, 300));

    await html2pdf().set(opt).from(element).save();
  }

  downloadBtn.addEventListener('click', async () => {
  console.log("🧾 Download button clicked");
  await generatePdfClientSide();
});
    


  function renderBrandedPDFDocument(aiText = '') {
  const title = 'Automate-AIG Generated Document';

  // Basic Markdown to HTML converter with better paragraph splitting
  const htmlFormattedContent = aiText
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/\n{2,}/g, '\n\n') // preserve paragraph breaks
    .split(/\n{2,}/g) // split into paragraphs
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  const finalHtml = `
    <div style="font-family: 'Arial', sans-serif; font-size: 14px; color: #000; background: white; border: 1px solid #ccc; border-radius: 8px; width: 100%; max-width: 750px; margin: auto; box-shadow: 0 0 10px rgba(0,0,0,0.05);">

      <!-- HEADER -->
      <div style="background: linear-gradient(to right, #2563eb, #4f46e5); color: white; padding: 20px 28px;">
        <h1 style="margin: 0; font-size: 22px;">${title}</h1>
        <p style="margin-top: 4px; font-size: 13px;">Generated on ${new Date().toLocaleDateString()}</p>
      </div>

      <!-- BODY -->
      <div style="padding: 20px 28px; page-break-inside: auto; page-break-after: auto; page-break-before: auto;">
        ${htmlFormattedContent}
      </div>

      <!-- FOOTER -->
      <div style="background-color: #f5f8ff; color: #555; font-size: 12px; padding: 12px 28px; text-align: center; border-top: 1px solid #ccc;">
        &copy; 2025 Ian Clem | Built with GitHub, Supabase, Resend, and html2pdf.js
      </div>

    </div>
  `;

  return finalHtml;
}




    async function generateBasicPdf() {
      const element = docOutput;

      const opt = {
        margin: 0.5,
        filename: `test-document-${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    }
