class URLShortenerUI {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.renderPreviousUrls();
        this.updateStats();
    }

    initializeElements() {
        this.longUrlInput = document.getElementById('longUrl');
        this.shortenBtn = document.getElementById('shortenBtn');
        this.resultDiv = document.getElementById('result');
        this.shortUrlInput = document.getElementById('shortUrl');
        this.copyBtn = document.getElementById('copyBtn');
        this.originalUrlSpan = document.getElementById('originalUrl');
        this.timestampSpan = document.getElementById('timestamp');
        this.directLink = document.getElementById('directLink');

        this.shortUrlInputExpand = document.getElementById('shortUrlInput');
        this.expandBtn = document.getElementById('expandBtn');
        this.expandResultDiv = document.getElementById('expandResult');
        this.expandedUrlInput = document.getElementById('expandedUrl');
        this.copyExpandedBtn = document.getElementById('copyExpandedBtn');

        this.totalUrlsSpan = document.getElementById('totalUrls');
        this.loadFactorSpan = document.getElementById('loadFactor');
        this.maxChainSpan = document.getElementById('maxChain');
        this.utilizationSpan = document.getElementById('utilization');
        this.previousUrlsList = document.getElementById('previousUrlsList');
    }

    bindEvents() {
        this.shortenBtn.addEventListener('click', () => this.shortenURL());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard(this.shortUrlInput.value, 'Short URL copied!'));
        this.longUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.shortenURL();
        });

        this.expandBtn.addEventListener('click', () => this.expandURL());
        this.copyExpandedBtn.addEventListener('click', () => this.copyToClipboard(this.expandedUrlInput.value, 'Original URL copied!'));
        this.shortUrlInputExpand.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.expandURL();
        });
    }

    async shortenURL() {
        const longUrl = this.longUrlInput.value.trim();
        if (!longUrl) {
            this.showNotification('Please enter a URL', 'error');
            return;
        }

        this.setLoading(this.shortenBtn, true, 'Shortening...', 'fa-cut');

        try {
            const response = await fetch('/api/shorten', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: longUrl })
            });
            const data = await response.json();

            if (data.success) {
                const fullShortUrl = `${location.origin}/${data.short_url}`;
                this.shortUrlInput.value = fullShortUrl;
                this.originalUrlSpan.textContent = longUrl;
                this.timestampSpan.textContent = new Date().toLocaleString();
                this.directLink.href = fullShortUrl;
                this.resultDiv.style.display = 'block';
                this.resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                this.addPreviousUrl(data.short_url, longUrl);
                this.updateStats();
                this.showNotification('URL shortened successfully!', 'success');
            } else {
                this.showNotification(data.error || 'Failed to shorten URL', 'error');
            }
        } catch {
            this.showNotification('Network error. Please try again.', 'error');
        } finally {
            this.setLoading(this.shortenBtn, false, 'Shorten', 'fa-cut');
        }
    }

    async expandURL() {
        const shortUrl = this.shortUrlInputExpand.value.trim();
        if (!shortUrl) {
            this.showNotification('Please enter a short code', 'error');
            return;
        }

        // Extract just the code if user pasted a full URL
        const code = shortUrl.includes('/') ? shortUrl.split('/').pop() : shortUrl;

        this.setLoading(this.expandBtn, true, 'Expanding...', 'fa-expand');

        try {
            const response = await fetch('/api/expand', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ short_url: code })
            });
            const data = await response.json();

            if (data.success) {
                this.expandedUrlInput.value = data.original_url;
                this.expandResultDiv.style.display = 'block';
                this.expandResultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                this.showNotification(data.error || 'Short URL not found', 'error');
            }
        } catch {
            this.showNotification('Network error. Please try again.', 'error');
        } finally {
            this.setLoading(this.expandBtn, false, 'Expand', 'fa-expand');
        }
    }

    async copyToClipboard(text, message) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification(message, 'success');
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showNotification(message, 'success');
        }
    }

    addPreviousUrl(shortCode, longUrl) {
        let prev = JSON.parse(localStorage.getItem('previousUrls') || '[]');
        // Avoid duplicates
        prev = prev.filter(u => u.short !== shortCode);
        prev.unshift({ short: shortCode, long: longUrl, time: Date.now() });
        if (prev.length > 20) prev = prev.slice(0, 20);
        localStorage.setItem('previousUrls', JSON.stringify(prev));
        this.renderPreviousUrls();
    }

    renderPreviousUrls() {
        const prev = JSON.parse(localStorage.getItem('previousUrls') || '[]');
        if (!prev.length) {
            this.previousUrlsList.innerHTML = '<p class="empty-state">No URLs shortened yet. Try shortening one above!</p>';
            return;
        }

        this.previousUrlsList.innerHTML = prev.map(url => `
            <div class="previous-url-item">
                <a href="${location.origin}/${url.short}" class="previous-url-short" target="_blank" rel="noopener">${url.short}</a>
                <span class="previous-url-long" title="${this.escapeHtml(url.long)}">${this.escapeHtml(url.long)}</span>
                <button class="previous-url-copy" data-url="${location.origin}/${url.short}">Copy</button>
            </div>
        `).join('');

        this.previousUrlsList.querySelectorAll('.previous-url-copy').forEach(btn => {
            btn.addEventListener('click', () => {
                this.copyToClipboard(btn.dataset.url, 'Short URL copied!');
            });
        });
    }

    async updateStats() {
        try {
            const response = await fetch('/api/stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const data = await response.json();

            if (data.success) {
                const s = data.stats;
                this.totalUrlsSpan.textContent = (s.total_urls || 0).toLocaleString();
                this.loadFactorSpan.textContent = ((s.load_factor || 0) * 100).toFixed(1) + '%';
                this.maxChainSpan.textContent = s.max_chain || 0;
                this.utilizationSpan.textContent = (s.utilization || 0).toFixed(1) + '%';
            }
        } catch {
            // Stats will show 0 on initial load, that's fine
        }
    }

    setLoading(button, loading, text, iconClass) {
        if (loading) {
            button.disabled = true;
            button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
        } else {
            button.disabled = false;
            button.innerHTML = `<i class="fas ${iconClass}"></i> ${text}`;
        }
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('removing');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new URLShortenerUI();

    // Typewriter effect for subtitle
    const subtitle = document.querySelector('.subtitle');
    if (subtitle) {
        const text = subtitle.textContent;
        subtitle.textContent = '';
        let i = 0;
        const type = () => {
            if (i < text.length) {
                subtitle.textContent += text.charAt(i);
                i++;
                setTimeout(type, 40);
            }
        };
        setTimeout(type, 500);
    }
});
