# URL Shortener - DSA Project

A modern URL shortener built with C++ backend (hashmap implementation) and web frontend, designed as a Data Structures and Algorithms project.

## 🌟 Features

- **Fast Performance**: O(1) average time complexity using custom hashmap implementation
- **Collision Safe**: Separate chaining for collision resolution
- **Persistent Storage**: URLs saved to file for data persistence
- **Modern Web Interface**: Beautiful, responsive UI with premium design
- **Real-time Statistics**: Live hashmap statistics and performance metrics
- **Direct Link Access**: Clickable shortened URLs that work in browsers
- **Previous URLs History**: Track and manage your shortened URLs
- **API Endpoints**: RESTful API for programmatic access

## 🏗️ Architecture

- **Backend**: C++ with custom hashmap implementation
- **Web Server**: Python Flask server bridging frontend and C++ backend
- **Frontend**: HTML5, CSS3, JavaScript with modern UI/UX
- **Data Structure**: Hashmap with separate chaining collision resolution
- **Storage**: File-based persistence for URL data

## 🚀 Live Demo

Visit the live application: [Your Render URL will be here]

## 📋 Prerequisites

- C++ compiler (g++)
- Python 3.7+
- Git

## 🛠️ Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/url-shortener-dsa.git
cd url-shortener-dsa
```

### 2. Compile the C++ Backend
```bash
g++ -o url_shortener src/url_shortener.cpp
```

### 3. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Application
```bash
python server.py
```

### 5. Access the Application
Open your browser and go to: `http://localhost:8000`

## 🌐 Deployment on Render

### 1. Push to GitHub
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy on Render
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `url-shortener-dsa`
   - **Environment**: `Python`
   - **Build Command**: `pip install -r requirements.txt && g++ -o url_shortener src/url_shortener.cpp`
   - **Start Command**: `gunicorn server:app --bind 0.0.0.0:$PORT`
5. Click "Create Web Service"

### 3. Get Your Public URL
Once deployed, Render will provide you with a public URL like:
`https://url-shortener-dsa.onrender.com`

## 📊 API Endpoints

### Shorten URL
```http
POST /api/shorten
Content-Type: application/json

{
  "url": "https://example.com/very-long-url"
}
```

### Expand URL
```http
POST /api/expand
Content-Type: application/json

{
  "short_url": "abc123"
}
```

### Get Statistics
```http
POST /api/stats
Content-Type: application/json

{}
```

### Clear All URLs
```http
POST /api/clear
Content-Type: application/json

{}
```

## 🏛️ Data Structure Implementation

### Hashmap Features
- **Custom Hash Function**: Efficient string hashing
- **Separate Chaining**: Linked list collision resolution
- **Dynamic Resizing**: Automatic hashmap expansion
- **Load Factor Management**: Optimal performance tuning
- **Base62 Encoding**: URL-friendly short codes

### Performance Characteristics
- **Average Case**: O(1) for insert, search, and delete
- **Worst Case**: O(n) with high collision rate
- **Space Complexity**: O(n) where n is number of URLs

## 🎨 Frontend Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Premium UI**: Black and grey theme with gold accents
- **Real-time Updates**: Live statistics and URL history
- **Copy to Clipboard**: One-click URL copying
- **Direct Navigation**: Clickable shortened URLs
- **Error Handling**: User-friendly error messages

## 📁 Project Structure

```
url-shortener-dsa/
├── src/
│   ├── url_shortener.cpp    # C++ backend implementation
│   └── url_shortener.h      # Header file
├── web/
│   ├── index.html          # Main frontend page
│   ├── style.css           # Styling
│   └── script.js           # Frontend logic
├── server.py               # Flask web server
├── requirements.txt        # Python dependencies
├── render.yaml            # Render deployment config
└── README.md              # This file
```

## 🔧 Customization

### Changing the Base URL
Update the `shortLinkFormat` span in `web/index.html` to match your domain.

### Modifying the Hashmap
Edit `src/url_shortener.cpp` to change hashmap behavior, size, or collision resolution.

### Styling Changes
Modify `web/style.css` to customize the appearance and theme.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Project: URL Shortener DSA

## 🙏 Acknowledgments

- Data Structures and Algorithms concepts
- Modern web development practices
- Flask and Python community
- Render for free hosting

---

**Note**: This project demonstrates advanced DSA concepts with practical web application development, making it perfect for academic presentations and learning purposes. 