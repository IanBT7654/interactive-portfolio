(function () {
  if (window.zapblog) return;

  window.zapblog = {
    init: function ({ container, blog_id }) {
      if (!container || !blog_id) {
        console.error("[ZapBlog] Missing 'container' or 'blog_id' in zapblog.init()");
        return;
      }

      const el = document.querySelector(container);
      if (!el) {
        console.error(`[ZapBlog] Container '${container}' not found.`);
        return;
      }

      const endpoint = `https://wezfdjtopfgqdcjfmdtj.functions.supabase.co/profile_js_inject?blog_id=${encodeURIComponent(blog_id)}`;

      fetch(endpoint)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        })
        .then((html) => {
          el.innerHTML = html;
        })
        .catch((err) => {
          console.error("[ZapBlog] Failed to load blog:", err);
          el.innerHTML = `
            <div style="color:red; font-family:sans-serif">
              ⚠️ Blog failed to load. Try again later.
            </div>`;
        });
    }
  };
})();
