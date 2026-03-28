"""
URL Shortener - Vercel Serverless API
DSA Project: Custom HashMap with Separate Chaining + Base62 URL Encoding

This module reimplements the C++ HashMap and URLShortener classes in Python
for serverless deployment on Vercel. The DSA concepts are identical:
- HashMap with separate chaining for collision resolution
- DJB2 hash function for string hashing
- Base62 encoding for URL-friendly short codes
- Dynamic resizing when load factor exceeds threshold
"""

from flask import Flask, request, jsonify, redirect
import time
import re

app = Flask(__name__)


# ============================================================
# DSA: HashMap with Separate Chaining
# ============================================================

class HashNode:
    """A node in a separate chain (linked list bucket)."""
    __slots__ = ('key', 'value')

    def __init__(self, key, value):
        self.key = key
        self.value = value


class HashMap:
    """
    Custom HashMap using separate chaining for collision resolution.

    Mirrors the C++ HashMap<K,V> template from src/url_shortener.h:
    - Array of buckets, each bucket is a list (chain) of HashNodes
    - Automatic resizing when load factor >= 0.75
    - O(1) average for insert, get, remove, contains
    - O(n) worst case when all keys hash to the same bucket

    Time Complexity:
        insert:   O(1) average, O(n) worst
        get:      O(1) average, O(n) worst
        remove:   O(1) average, O(n) worst
        contains: O(1) average, O(n) worst

    Space Complexity: O(n) where n = number of stored key-value pairs
    """
    DEFAULT_CAPACITY = 100
    LOAD_FACTOR_THRESHOLD = 0.75

    def __init__(self, capacity=None):
        self.capacity = capacity or self.DEFAULT_CAPACITY
        self.size = 0
        # Each bucket is a Python list acting as a chain
        self.table = [[] for _ in range(self.capacity)]

    def _hash(self, key):
        """
        Hash function: maps a key to a bucket index [0, capacity).
        Uses Python's built-in hash() modulo capacity.
        """
        return hash(key) % self.capacity

    def _resize(self):
        """
        Double the table capacity and rehash all existing entries.
        Called automatically when load factor >= 0.75.
        This maintains O(1) average performance.
        """
        old_table = self.table
        self.capacity *= 2
        self.table = [[] for _ in range(self.capacity)]
        self.size = 0
        for bucket in old_table:
            for node in bucket:
                self.insert(node.key, node.value)

    def insert(self, key, value):
        """Insert or update a key-value pair."""
        if self.size / self.capacity >= self.LOAD_FACTOR_THRESHOLD:
            self._resize()

        index = self._hash(key)

        # Update existing key
        for node in self.table[index]:
            if node.key == key:
                node.value = value
                return

        # Append new node to chain
        self.table[index].append(HashNode(key, value))
        self.size += 1

    def get(self, key):
        """Retrieve value by key. Returns None if not found."""
        index = self._hash(key)
        for node in self.table[index]:
            if node.key == key:
                return node.value
        return None

    def contains(self, key):
        """Check if a key exists in the map."""
        return self.get(key) is not None

    def remove(self, key):
        """Remove a key-value pair. Returns True if removed."""
        index = self._hash(key)
        for i, node in enumerate(self.table[index]):
            if node.key == key:
                self.table[index].pop(i)
                self.size -= 1
                return True
        return False

    def clear(self):
        """Remove all entries."""
        self.table = [[] for _ in range(self.capacity)]
        self.size = 0

    def get_all_items(self):
        """Return all key-value pairs."""
        items = []
        for bucket in self.table:
            for node in bucket:
                items.append((node.key, node.value))
        return items

    def get_stats(self):
        """
        Compute hashmap statistics for the dashboard.
        Shows how well the hash function distributes keys.
        """
        max_chain = 0
        empty_buckets = 0

        for bucket in self.table:
            chain_len = len(bucket)
            if chain_len > max_chain:
                max_chain = chain_len
            if chain_len == 0:
                empty_buckets += 1

        used_buckets = self.capacity - empty_buckets
        utilization = (used_buckets / self.capacity) * 100 if self.capacity > 0 else 0
        load_factor = self.size / self.capacity if self.capacity > 0 else 0

        return {
            'total_urls': self.size,
            'capacity': self.capacity,
            'load_factor': load_factor,
            'max_chain': max_chain,
            'empty_buckets': empty_buckets,
            'utilization': utilization
        }


# ============================================================
# URL Shortener using custom HashMap
# ============================================================

class URLShortener:
    """
    URL Shortener implementation using custom HashMap.

    Mirrors the C++ URLShortener class from src/url_shortener.cpp:
    - DJB2 hash function (hash = 5381; hash = hash * 33 + char)
    - Base62 encoding for URL-friendly short codes (6-8 chars)
    - XOR with timestamp for uniqueness
    - Two HashMaps: long->short and short->long for bidirectional lookup
    """
    BASE62_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

    def __init__(self):
        self.url_map = HashMap()          # long_url -> short_code
        self.short_to_long = HashMap()    # short_code -> long_url
        self.url_storage = []             # ordered list of (short_code, long_url)

    def _djb2_hash(self, text):
        """
        DJB2 hash function - same algorithm as the C++ implementation.

        hash = 5381
        for each char: hash = hash * 33 + char

        This is Daniel J. Bernstein's hash function, known for its
        simplicity and good distribution properties for strings.
        """
        hash_val = 5381
        for ch in text:
            hash_val = ((hash_val << 5) + hash_val) + ord(ch)
            hash_val &= 0xFFFFFFFFFFFFFFFF  # Keep as unsigned 64-bit

        # XOR with timestamp for uniqueness (same as C++ version)
        timestamp_ms = int(time.time() * 1000)
        hash_val ^= timestamp_ms
        hash_val &= 0xFFFFFFFFFFFFFFFF

        return hash_val

    def _to_base62(self, num):
        """
        Convert an integer to a Base62 string (6-8 characters).

        Base62 uses: 0-9, A-Z, a-z (62 characters total)
        This produces URL-safe short codes without special characters.
        """
        if num == 0:
            return "000000"

        result = ""
        while num > 0:
            result = self.BASE62_CHARS[num % 62] + result
            num //= 62

        # Pad to minimum 6 characters
        while len(result) < 6:
            result = "0" + result

        # Limit to 8 characters maximum
        if len(result) > 8:
            result = result[:8]

        return result

    @staticmethod
    def _is_valid_url(url):
        """Validate URL format (matches C++ isValidURL)."""
        if not url or len(url) < 4:
            return False
        lower = url.lower()
        return (lower.startswith("http://") or
                lower.startswith("https://") or
                lower.startswith("www.") or
                lower.startswith("ftp://"))

    def shorten(self, long_url):
        """
        Shorten a URL. Returns (short_code, error).
        If the URL was already shortened, returns the existing code.
        """
        if not self._is_valid_url(long_url):
            return None, "Invalid URL. Must start with http://, https://, www., or ftp://"

        # Return existing short code if URL already shortened
        existing = self.url_map.get(long_url)
        if existing:
            return existing, None

        # Try up to 10 times to generate a unique short code
        short_code = None
        for attempt in range(10):
            candidate = self._to_base62(self._djb2_hash(long_url + str(attempt)))
            if not self.short_to_long.contains(candidate):
                short_code = candidate
                break

        if not short_code:
            return None, "Failed to generate unique short code. Please try again."

        # Store bidirectional mappings in both HashMaps
        self.url_map.insert(long_url, short_code)
        self.short_to_long.insert(short_code, long_url)
        self.url_storage.append((short_code, long_url))

        return short_code, None

    def expand(self, short_code):
        """Get original URL from a short code."""
        return self.short_to_long.get(short_code)

    def get_all_urls(self):
        """Get all stored URL mappings."""
        return [{'short': s, 'long': l} for s, l in self.url_storage]

    def get_stats(self):
        """Get HashMap statistics from the short_to_long map."""
        return self.short_to_long.get_stats()

    def clear_all(self):
        """Clear all URL mappings."""
        self.url_map.clear()
        self.short_to_long.clear()
        self.url_storage.clear()


# ============================================================
# Global instance (persists within a single serverless instance)
# Note: Data resets on cold starts. For persistent storage,
# connect a database (Vercel KV, Supabase, PlanetScale, etc.)
# ============================================================

shortener = URLShortener()


# ============================================================
# Flask API Routes
# ============================================================

@app.route('/api/shorten', methods=['POST'])
def api_shorten():
    """Shorten a URL. Expects JSON: { "url": "https://..." }"""
    data = request.get_json()
    if not data or 'url' not in data:
        return jsonify({'success': False, 'error': 'Missing URL in request body'}), 400

    url = data['url'].strip()
    short_code, error = shortener.shorten(url)

    if error:
        return jsonify({'success': False, 'error': error})

    return jsonify({
        'success': True,
        'short_url': short_code,
        'original_url': url
    })


@app.route('/api/expand', methods=['POST'])
def api_expand():
    """Expand a short code. Expects JSON: { "short_url": "ABC123" }"""
    data = request.get_json()
    if not data or 'short_url' not in data:
        return jsonify({'success': False, 'error': 'Missing short_url in request body'}), 400

    short_code = data['short_url'].strip()
    original = shortener.expand(short_code)

    if original:
        return jsonify({
            'success': True,
            'original_url': original,
            'short_url': short_code
        })

    return jsonify({'success': False, 'error': 'Short URL not found'})


@app.route('/api/stats', methods=['POST'])
def api_stats():
    """Get HashMap statistics for the dashboard."""
    stats = shortener.get_stats()
    return jsonify({'success': True, 'stats': stats})


@app.route('/api/list', methods=['POST'])
def api_list():
    """List all shortened URLs."""
    urls = shortener.get_all_urls()
    return jsonify({'success': True, 'urls': urls})


@app.route('/api/clear', methods=['POST'])
def api_clear():
    """Clear all stored URLs."""
    shortener.clear_all()
    return jsonify({'success': True, 'message': 'All URLs cleared successfully'})


@app.route('/api/test', methods=['POST'])
def api_test():
    """Run test with sample URLs to demonstrate the system."""
    test_urls = [
        "https://www.google.com",
        "https://www.github.com",
        "https://www.stackoverflow.com",
        "https://www.wikipedia.org",
        "https://www.youtube.com"
    ]

    results = []
    for url in test_urls:
        short_code, error = shortener.shorten(url)
        retrieved = shortener.expand(short_code) if short_code else None
        results.append({
            'original': url,
            'shortened': short_code or 'FAILED',
            'retrieved': retrieved or 'FAILED',
            'match': url == retrieved
        })

    return jsonify({'success': True, 'test_results': results})


@app.route('/<path:shortcode>')
def redirect_short(shortcode):
    """
    Catch-all route for short code redirects.
    If the path matches a valid shortcode pattern (6-8 alphanumeric chars),
    look it up and redirect. Otherwise return 404.
    """
    if re.match(r'^[A-Za-z0-9]{6,8}$', shortcode):
        original = shortener.expand(shortcode)
        if original:
            return redirect(original, code=302)

    return jsonify({'error': 'Short URL not found'}), 404
