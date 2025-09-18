// script_docgen.js
import { supabaseClient } from './config.js';

// Debug toggle: true = use dummy data, false = call real AI function
const USE_DUMMY_DATA = true;

// DOM elements
const form = document.getElementById('docForm');
const docPrompt = document.getElementById('docPrompt');
const recipientEmail = document.getElementById('recipientEmail');
const docOutput = document.getElementById('docOutput');
const previewSection = document.getElementById('previewSection');
const sendEmailBtn = document.getElementById('sendEmailBtn');
const downloadBtn = document.getElementById('downloadBtn');
const statusSection = document.getElementById('statusSection');

// Status fields
const statusSent = document.getElementById('status-sent');
const statusDelivered = document.getElementById('status-delivered');
const statusOpened = document.getElementById('status-opened');

// Global cache to avoid duplicate PDF generation
let generatedPdfUrl = null;

// Waits for next paint + an optional delay (default: 4000ms)
async function waitForStableDOM(delay = 4000) {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      setTimeout(resolve, delay);
    });
  });
}

// ✨ Handle Form Submit
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const promptText = docPrompt.value.trim();
  const email = recipientEmail.value.trim();

  if (!promptText || !email) {
    return alert('Please enter both prompt and email.');
  }

  let generatedText;

  if (USE_DUMMY_DATA) {
    generatedText = `Dummy generated document content.\nSecond line of dummy content.\nPrompt was: "${promptText}"`;
  } else {
    generatedText = await generateDocumentWithAI(promptText);
    if (!generatedText) {
      return alert('AI failed to generate document.');
    }
  }

  // Insert generated content (preserves line breaks)
  //docOutput.innerHTML = generatedText.replace(/\n/g, '<br>');
  docOutput.innerHTML = renderBrandedPDFDocument(generatedText);


  // Show preview
  previewSection.classList.remove('hidden');
});

// 🧠 Generate text from AI (Supabase Edge Function)
async function generateDocumentWithAI(prompt) {


  try {
    const { data, error } = await supabaseClient.functions.invoke('generate_doc', {
      body: { prompt }
    });

    if (error) {
      console.error('Function Error:', error);
      throw new Error(error.message || 'AI generation failed');
    }

    return data.result;
  } catch (err) {
    console.error('AI generation error:', err);
    return null;
  }
}


// 🧾 Shared function: Generate PDF from HTML if not already generated
/* async function generatePdfIfNeeded() {
send to fuction - not using this anymore because it can't do formatting
  if (generatedPdfUrl) {
    console.log("♻️ Reusing cached PDF:", generatedPdfUrl);
    return generatedPdfUrl;
  }

  const htmlContent = docOutput.outerHTML.trim();
  const bounds = docOutput.getBoundingClientRect();

  if (!htmlContent || bounds.height === 0 || bounds.width === 0) {
    throw new Error('❌ Document is empty or not visible.');
  }

  console.log("⏳ Sending HTML to Supabase Edge Function to generate PDF...");

  const { data, error } = await supabaseClient.functions.invoke('generate_pdf', {
    body: {
      html: htmlContent,
      filename: `document-${Date.now()}`
    }
  });

  if (error || !data?.url) {
    console.error('❌ PDF generation failed:', error || data);
    throw new Error('PDF generation failed on the server.');
  }

  generatedPdfUrl = data.url;
  console.log("✅ PDF generated and cached:", generatedPdfUrl);
  
  return generatedPdfUrl;
} */


/* async function generatePdfClientSide() {
  const element = docOutput;

  console.log('DOC OUTPUT innerHTML:', element.innerHTML);
  console.log('DOC OUTPUT size:', element.offsetWidth, element.offsetHeight);

  const opt = {
    margin:       0,
    filename:     `document-${Date.now()}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  console.log("📄 Generating PDF from DOM element...");
  await html2pdf().set(opt).from(element).save();
} */

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

/* async function generateBasicPdf() {
  // Create a minimal test div with some basic formatted content
const element = docOutput;

  console.log('DOC OUTPUT innerHTML:', element.innerHTML);
  console.log('DOC OUTPUT size:', element.offsetWidth, element.offsetHeight);

  const opt = {
    margin: 0.5,
    filename: `document-${Date.now()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  console.log("📄 Generating PDF from DOM element...");
  await html2pdf().set(opt).from(element).save();
}  */

async function generateBasicPdf() {
  // Create a minimal test div dynamically (not relying on docOutput)
  console.log('starting generateBasicPdf:');

  const testDiv = document.createElement('div');
  testDiv.innerHTML = `
    <div style="padding: 20px; font-size: 16px; background: white; color: black;">
      <h1>Hello world</h1>
      <p>This is a minimal inline test PDF.</p>
    </div>
  `;

  document.body.appendChild(testDiv); // ← required to render for html2canvas

  const opt = {
    margin: 0.5,
    filename: `minimal-test-${Date.now()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  console.log("📄 Generating PDF from minimal inline div...");
  await html2pdf().set(opt).from(testDiv).save();

  document.body.removeChild(testDiv); // cleanup
  console.log('ending generateBasicPdf:');

}




function renderBrandedPDFDocument(aiText = '') {
  const title = 'Automate-AIG Generated Document';

  // Basic Markdown to HTML converter
  const htmlFormattedContent = aiText
    .replace(/^### (.*$)/gim, '<h3 style="font-size: 18px; margin-bottom: 8px;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size: 20px; margin-bottom: 10px;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="font-size: 22px; margin-bottom: 12px;">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/\n{2,}/g, '</p><p>') // Paragraph breaks
    .replace(/\n/g, '<br>');

  const finalHtml = `
    <div style="font-family: 'Roboto Mono', monospace; font-size: 14px; color: #000; background: white; border: 1px solid #ccc; border-radius: 8px; overflow: visible; box-shadow: 0 0 10px rgba(0,0,0,0.05); width: 100%; max-width: 750px; margin: auto;">
    
      <!-- HEADER -->
      <div style="background: linear-gradient(to right, #2563eb, #4f46e5); color: white; padding: 24px 32px;">
        <h1 style="margin: 0; font-size: 24px;">${title}</h1>
        <p style="margin-top: 4px; font-size: 14px;">Generated using AI on ${new Date().toLocaleDateString()}</p>
      </div>

      <!-- BODY -->
      <div style="padding: 32px;">
        <p>${htmlFormattedContent}</p>
      </div>

      <!-- FOOTER -->
      <div style="background-color: #f5f8ff; color: #555; font-size: 12px; padding: 16px 32px; text-align: center; border-top: 1px solid #ccc;">
        &copy; 2025 Ian B | Built with GitHub, Supabase, Resend, and html2pdf.js
      </div>

    </div>
  `;

  return finalHtml;
}





// 📩 Send email with PDF attached
sendEmailBtn.addEventListener('click', async () => {
  const email = recipientEmail.value.trim();
  if (!email) return alert('Please enter an email.');

  try {
    const publicUrl = await generatePdfIfNeeded();

    const { data, error } = await supabaseClient.functions.invoke('send-email', {
  body: { email, file_url: publicUrl }
});

if (error) {
  console.error('Send email failed:', error);
  return alert('Email sending failed.');
}

    const result = await res.json();

    if (!res.ok) {
      console.error('Send email failed:', result);
      return alert('Email sending failed.');
    }

    const { message_id } = result;

    statusSection.classList.remove('hidden');
    statusSent.textContent = `📤 Sent: ${new Date().toLocaleTimeString()}`;
    statusDelivered.textContent = `📬 Delivered: (waiting...)`;
    statusOpened.textContent = `📖 Opened: (waiting...)`;

    trackEmailStatus(message_id);
  } catch (err) {
    alert(err.message || 'Something went wrong during email send.');
  }
});

// ⬇️ Download PDF locally
downloadBtn.addEventListener('click', async () => {
  try {
    console.log("🧾 Download button clicked");
    const pdfUrl = await generatePdfClientSide();       //await generateBasicPdf();  

  } catch (err) {
    console.error('Download error:', err);
    alert(err.message || 'Failed to download PDF.');
  }
});



// 🔄 Poll for email delivery/open status
function trackEmailStatus(message_id) {
  const interval = setInterval(async () => {
    const { data, error } = await supabaseClient
      .from('email_tracking')
      .select('*')
      .eq('message_id', message_id)
      .single();

    if (error || !data) return;

    if (data.delivered_at) {
      statusDelivered.textContent = `📬 Delivered: ${new Date(data.delivered_at).toLocaleTimeString()}`;
    }

    if (data.opened_at) {
      statusOpened.textContent = `📖 Opened: ${new Date(data.opened_at).toLocaleTimeString()}`;
      clearInterval(interval); // stop polling
    }
  }, 4000);
}


