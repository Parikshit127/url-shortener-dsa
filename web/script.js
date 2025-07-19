class URLShortenerUI {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.loadStats();
    }

    initializeElements() {
        // Shorten URL elements
        this.longUrlInput = document.getElementById('longUrl');
        this.shortenBtn = document.getElementById('shortenBtn');
        this.resultDiv = document.getElementById('result');
        this.shortUrlInput = document.getElementById('shortUrl');
        this.copyBtn = document.getElementById('copyBtn');
        this.originalUrlSpan = document.getElementById('originalUrl');
        this.timestampSpan = document.getElementById('timestamp');
        
        // Expand URL elements
        this.shortUrlInputExpand = document.getElementById('shortUrlInput');
        this.expandBtn = document.getElementById('expandBtn');
        this.expandResultDiv = document.getElementById('expandResult');
        this.expandedUrlInput = document.getElementById('expandedUrl');
        this.copyExpandedBtn = document.getElementById('copyExpandedBtn');
        
        // Stats elements
        this.totalUrlsSpan = document.getElementById('totalUrls');
        this.loadFactorSpan = document.getElementById('loadFactor');
        this.maxChainSpan = document.getElementById('maxChain');
        this.utilizationSpan = document.getElementById('utilization');
        this.previousUrlsList = document.getElementById('previousUrlsList');
    }

    bindEvents() {
        // Shorten URL events
        this.shortenBtn.addEventListener('click', () => this.shortenURL());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        this.longUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.shortenURL();
            }
        });
        
        // Expand URL events
        this.expandBtn.addEventListener('click', () => this.expandURL());
        this.copyExpandedBtn.addEventListener('click', () => this.copyExpandedToClipboard());
        this.shortUrlInputExpand.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.expandURL();
            }
        });
    }

    async shortenURL() {
        const longUrl = this.longUrlInput.value.trim();
        if (!longUrl) {
            this.showError('Please enter a URL');
            return;
        }

        this.setLoading(true);
        
        fetch('/api/shorten', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: longUrl })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.shortUrlInput.value = data.short_url;
                this.originalUrlSpan.textContent = longUrl;
                this.timestampSpan.textContent = new Date().toLocaleString();
                this.resultDiv.style.display = 'block';
                
                // Set the direct link href
                const directLink = document.getElementById('directLink');
                directLink.href = `${location.origin}/${data.short_url}`;
                
                // Add to previous URLs
                this.addPreviousUrl(data.short_url, longUrl);
                this.updateStats();
            } else {
                this.showError(data.error || 'Failed to shorten URL');
            }
        })
        .catch(() => {
            this.showError('An error occurred while shortening the URL');
        })
        .finally(() => {
            this.setLoading(false);
        });
    }

    isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }



    async copyToClipboard() {
        try {
            await navigator.clipboard.writeText(this.shortUrlInput.value);
            this.showSuccess('URL copied to clipboard!');
        } catch (error) {
            this.showError('Failed to copy URL');
        }
    }

    async expandURL() {
        const shortUrl = this.shortUrlInputExpand.value.trim();
        
        if (!shortUrl) {
            this.showError('Please enter a short URL');
            return;
        }

        this.setLoadingExpand(true);
        
        try {
            const response = await fetch('/api/expand', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ short_url: shortUrl })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.displayExpandResult(data.original_url);
            } else {
                this.showError(data.error || 'Failed to expand URL');
            }
        } catch (error) {
            this.showError('An error occurred while expanding URL');
        } finally {
            this.setLoadingExpand(false);
        }
    }

    displayExpandResult(originalUrl) {
        this.expandedUrlInput.value = originalUrl;
        this.expandResultDiv.style.display = 'block';
        this.expandResultDiv.scrollIntoView({ behavior: 'smooth' });
    }

    async copyExpandedToClipboard() {
        try {
            await navigator.clipboard.writeText(this.expandedUrlInput.value);
            this.showSuccess('Original URL copied to clipboard!');
        } catch (error) {
            this.showError('Failed to copy URL');
        }
    }



    addPreviousUrl(shortUrl, longUrl) {
        // Store in localStorage
        let prev = JSON.parse(localStorage.getItem('previousUrls') || '[]');
        prev.unshift({ short: shortUrl, long: longUrl });
        if (prev.length > 20) prev = prev.slice(0, 20);
        localStorage.setItem('previousUrls', JSON.stringify(prev));
        this.renderPreviousUrls();
    }

    renderPreviousUrls() {
        let prev = JSON.parse(localStorage.getItem('previousUrls') || '[]');
        if (!prev.length) {
            this.previousUrlsList.innerHTML = '<p style="color:#b0b0b0;">No URLs yet.</p>';
            return;
        }
        this.previousUrlsList.innerHTML = prev.map(url => `
            <div class="previous-url-item">
                <a href="${location.origin}/${url.short}" class="previous-url-short" target="_blank">${location.origin}/${url.short}</a>
                <span class="previous-url-long">${url.long}</span>
                <button class="previous-url-copy" data-url="${location.origin}/${url.short}">Copy</button>
            </div>
        `).join('');
        // Add copy event listeners
        this.previousUrlsList.querySelectorAll('.previous-url-copy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                navigator.clipboard.writeText(btn.getAttribute('data-url'));
                this.showSuccess('Short URL copied!');
            });
        });
    }

    // Remove clearURLs and related logic

    setLoading(loading) {
        if (loading) {
            this.shortenBtn.classList.add('loading');
            this.shortenBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Shortening...';
            this.shortenBtn.disabled = true;
        } else {
            this.shortenBtn.classList.remove('loading');
            this.shortenBtn.innerHTML = '<i class="fas fa-cut"></i> Shorten';
            this.shortenBtn.disabled = false;
        }
    }

    setLoadingExpand(loading) {
        if (loading) {
            this.expandBtn.classList.add('loading');
            this.expandBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Expanding...';
            this.expandBtn.disabled = true;
        } else {
            this.expandBtn.classList.remove('loading');
            this.expandBtn.innerHTML = '<i class="fas fa-expand"></i> Expand';
            this.expandBtn.disabled = false;
        }
    }



    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            background: ${type === 'error' ? '#dc3545' : '#28a745'};
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    loadStats() {
        // Simulate loading stats from backend
        this.updateStats();
        this.renderPreviousUrls();
    }

    async updateStats() {
        try {
            const response = await fetch('/api/stats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({})
            });
            
            const data = await response.json();
            
            if (data.success) {
                const stats = data.stats;
                this.totalUrlsSpan.textContent = (stats.total_urls || 0).toLocaleString();
                this.loadFactorSpan.textContent = ((stats.load_factor || 0) * 100).toFixed(1) + '%';
                this.maxChainSpan.textContent = stats.max_chain || 0;
                this.utilizationSpan.textContent = (stats.utilization || 0).toFixed(1) + '%';
            } else {
                // Fallback to mock stats
                this.updateMockStats();
            }
        } catch (error) {
            console.error('Stats API Error:', error);
            // Fallback to mock stats
            this.updateMockStats();
        }
    }

    updateMockStats() {
        const totalUrls = Math.floor(Math.random() * 1000) + 100;
        const loadFactor = (Math.random() * 30 + 20).toFixed(1);
        const maxChain = Math.floor(Math.random() * 5) + 1;
        const utilization = (Math.random() * 20 + 60).toFixed(1);
        
        this.totalUrlsSpan.textContent = totalUrls.toLocaleString();
        this.loadFactorSpan.textContent = loadFactor + '%';
        this.maxChainSpan.textContent = maxChain;
        this.utilizationSpan.textContent = utilization + '%';
    }
}

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new URLShortenerUI();
});

// Add some interactive features
document.addEventListener('DOMContentLoaded', () => {
    // Add typing effect to subtitle
    const subtitle = document.querySelector('.subtitle');
    const originalText = subtitle.textContent;
    subtitle.textContent = '';
    
    let i = 0;
    const typeWriter = () => {
        if (i < originalText.length) {
            subtitle.textContent += originalText.charAt(i);
            i++;
            setTimeout(typeWriter, 50);
        }
    };
    
    setTimeout(typeWriter, 1000);
    
    // Add hover effects to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
}); 