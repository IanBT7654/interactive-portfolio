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
  if (USE_DUMMY_DATA) {
    console.log('⚠️ Using dummy data');
    return `
# Monthly Report

**Client:** ACME Corporation  
**Date:** September 2025

## Summary

This document provides a breakdown of services rendered and payment details.

### Services Rendered
- AI Document Generation
- Email Tracking Integration
- PDF Export Setup

**Total Amount:** $2000

---

*Prompt used:* "${prompt}"
`;
  }

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
async function generatePdfIfNeeded() {
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
}


function renderBrandedPDFDocument(aiText = '') {
  const title = 'Automate-AIG Generated Document';
  const lines = aiText.split('\n');

  let html = '';
  let inList = false;

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (trimmed.match(/^### (.*)/)) {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      html += `<h3 style="font-size: 18px; margin-bottom: 8px;">${RegExp.$1}</h3>`;
    } else if (trimmed.match(/^## (.*)/)) {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      html += `<h2 style="font-size: 20px; margin-bottom: 10px;">${RegExp.$1}</h2>`;
    } else if (trimmed.match(/^# (.*)/)) {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      html += `<h1 style="font-size: 22px; margin-bottom: 12px;">${RegExp.$1}</h1>`;
    } else if (trimmed.match(/^- (.*)/)) {
      if (!inList) {
        inList = true;
        html += '<ul style="margin-left: 20px; margin-bottom: 16px;">';
      }
      let item = RegExp.$1;
      item = item
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      html += `<li>${item}</li>`;
    } else if (trimmed === '') {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      html += '<p style="margin-bottom: 16px;"></p>';
    } else {
      let paragraph = trimmed
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      html += `<p style="margin-bottom: 16px;">${paragraph}</p>`;
    }
  });

  if (inList) {
    html += '</ul>';
    inList = false;
  }

  const finalHtml = `
    <div style="width: 100%; max-width: 750px; margin: auto; font-family: 'Roboto Mono', monospace; color: #000; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
      <!-- HEADER -->
      <div style="background: linear-gradient(to right, #2563eb, #4f46e5); color: white; padding: 24px 32px;">
        <h1 style="margin: 0; font-size: 24px;">${title}</h1>
        <p style="margin: 4px 0 0; font-size: 14px;">Generated using AI on ${new Date().toLocaleDateString()}</p>
      </div>
      <!-- BODY -->
      <div style="padding: 32px;">
        ${html}
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
    const pdfUrl = await generatePdfIfNeeded();
    window.open(generatedPdfUrl, '_blank');
    /*const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `Document_${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link); */
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
