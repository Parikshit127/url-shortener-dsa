import subprocess
import json
import os
import re
from flask import Flask, request, jsonify, send_from_directory, redirect
import threading
import time
import queue

app = Flask(__name__)

def run_cpp_command(commands):
    """Run C++ program with specific commands and return output"""
    try:
        # Create the full command sequence
        full_input = ""
        for cmd in commands:
            full_input += str(cmd) + "\n"
        
        # Run the C++ program
        result = subprocess.run(
            ['./url_shortener'],
            input=full_input,
            capture_output=True,
            text=True,
            timeout=15
        )
        
        if result.returncode != 0:
            print(f"C++ program error: {result.stderr}")
            return None
            
        return result.stdout.strip()
    except subprocess.TimeoutExpired:
        print("C++ program timeout")
        return None
    except Exception as e:
        print(f"Error running C++ program: {e}")
        return None

@app.route('/')
def index():
    return send_from_directory('web', 'index.html')

@app.route('/style.css')
def style_css():
    return send_from_directory('web', 'style.css')

@app.route('/script.js')
def script_js():
    return send_from_directory('web', 'script.js')

@app.route('/<shortcode>')
def redirect_short_url(shortcode):
    print(f"Redirect request for shortcode: {shortcode}")
    # Handle redirect for short URLs
    if re.match(r'^[A-Za-z0-9]{6,8}$', shortcode):
        print(f"Shortcode {shortcode} matches pattern")
        # Look up the original URL using the backend
        output = run_cpp_command([2, shortcode, 7])
        print(f"C++ output: {output}")
        if output:
            lines = output.split('\n')
            original_url = None
            for line in lines:
                if 'Original URL:' in line:
                    original_url = line.split('Original URL:')[1].strip()
                    break
            print(f"Found original URL: {original_url}")
            if original_url and original_url != 'NOT_FOUND':
                return redirect(original_url, code=302)
        else:
            print("No output from C++ backend")
    else:
        print(f"Shortcode {shortcode} does not match pattern")
    
    # If not found, show a 404 page
    return "Short URL not found", 404

@app.route('/api/shorten', methods=['POST'])
def shorten_url():
    try:
        data = request.get_json()
        url = data.get('url', '')
        
        # Run the shorten command
        output = run_cpp_command([1, url, 7])
        
        if not output:
            return jsonify({'success': False, 'error': 'Backend communication failed'})
        
        # Parse the output
        lines = output.split('\n')
        short_url = None
        
        for line in lines:
            if 'Shortened URL:' in line:
                short_url = line.split('Shortened URL:')[1].strip()
                break
        
        if short_url and short_url not in ['INVALID_URL', 'GENERATION_FAILED']:
            return jsonify({'success': True, 'short_url': short_url, 'original_url': url})
        else:
            return jsonify({'success': False, 'error': 'Failed to shorten URL'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/expand', methods=['POST'])
def expand_url():
    try:
        data = request.get_json()
        short_url = data.get('short_url', '')
        
        # Run the expand command
        output = run_cpp_command([2, short_url, 7])
        
        if not output:
            return jsonify({'success': False, 'error': 'Backend communication failed'})
        
        # Parse the output
        lines = output.split('\n')
        original_url = None
        
        for line in lines:
            if 'Original URL:' in line:
                original_url = line.split('Original URL:')[1].strip()
                break
        
        if original_url and original_url != 'NOT_FOUND':
            return jsonify({'success': True, 'original_url': original_url, 'short_url': short_url})
        else:
            return jsonify({'success': False, 'error': 'Short URL not found'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/stats', methods=['POST'])
def get_stats():
    try:
        output = run_cpp_command([4, 7])
        
        if not output:
            return jsonify({'success': False, 'error': 'Backend communication failed'})
        
        # Parse statistics from output
        stats = {}
        lines = output.split('\n')
        
        for line in lines:
            if 'Total URLs:' in line:
                stats['total_urls'] = int(line.split(':')[1].strip())
            elif 'Load Factor:' in line:
                stats['load_factor'] = float(line.split(':')[1].strip().replace('%', '')) / 100
            elif 'Max Chain Length:' in line:
                stats['max_chain'] = int(line.split(':')[1].strip())
            elif 'Hashmap Utilization:' in line:
                stats['utilization'] = float(line.split(':')[1].strip().replace('%', ''))
        
        return jsonify({'success': True, 'stats': stats})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/clear', methods=['POST'])
def clear_urls():
    try:
        output = run_cpp_command([3, 7])
        
        if not output:
            return jsonify({'success': False, 'error': 'Backend communication failed'})
        
        # Check if clear was successful
        if 'All URLs cleared successfully' in output:
            return jsonify({'success': True, 'message': 'All URLs cleared successfully'})
        else:
            return jsonify({'success': False, 'error': 'Failed to clear URLs'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/test', methods=['POST'])
def test_urls():
    try:
        output = run_cpp_command([5, 7])
        
        if not output:
            return jsonify({'success': False, 'error': 'Backend communication failed'})
        
        # Parse test results
        test_results = []
        lines = output.split('\n')
        current_test = {}
        
        for line in lines:
            if 'Test' in line and ':' in line:
                if current_test:
                    test_results.append(current_test)
                current_test = {}
            elif 'Original:' in line:
                current_test['original'] = line.split('Original:')[1].strip()
            elif 'Shortened:' in line:
                current_test['shortened'] = line.split('Shortened:')[1].strip()
            elif 'Retrieved:' in line:
                current_test['retrieved'] = line.split('Retrieved:')[1].strip()
        
        if current_test:
            test_results.append(current_test)
        
        return jsonify({'success': True, 'test_results': test_results})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/list', methods=['POST'])
def list_urls():
    try:
        output = run_cpp_command([6, 7])
        
        if not output:
            return jsonify({'success': False, 'error': 'Backend communication failed'})
        
        # Parse URL list
        urls = []
        lines = output.split('\n')
        
        for line in lines:
            if 'Short:' in line and 'Long:' in line:
                parts = line.split('Long:')
                short_part = parts[0].split('Short:')[1].strip()
                long_url = parts[1].strip()
                urls.append({'short': short_part, 'long': long_url})
        
        return jsonify({'success': True, 'urls': urls})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    # Use environment variable for port (Render requirement)
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=False) 