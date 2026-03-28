#include "url_shortener.h"
#include <iostream>
#include <chrono>
#include <random>

using namespace std;

// Define the static member for HashMap template
template<typename K, typename V>
const double HashMap<K, V>::LOAD_FACTOR_THRESHOLD = 0.75;

// Explicit template instantiation for the types we use
template class HashMap<string, string>;

URLShortener::URLShortener(const string& filename) 
    : dataFile(filename), counter(0) {
    loadFromFile();
}

URLShortener::~URLShortener() {
    saveToFile();
}

string URLShortener::generateHash(const string& url) {
    unsigned long long hash = 5381;
    int c;
    
    for (char ch : url) {
        c = static_cast<int>(ch);
        hash = ((hash << 5) + hash) + c; // hash * 33 + c
    }
    
    // Add timestamp for uniqueness
    auto now = chrono::high_resolution_clock::now();
    auto time = chrono::duration_cast<chrono::milliseconds>(
        now.time_since_epoch()).count();
    hash ^= time;
    
    return toBase62(hash);
}

string URLShortener::toBase62(unsigned long long num) {
    const string chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    string result;
    
    if (num == 0) {
        return "0";
    }
    
    while (num > 0) {
        result = chars[num % 62] + result;
        num /= 62;
    }
    
    // Ensure minimum length of 6 characters
    while (result.length() < 6) {
        result = "0" + result;
    }
    
    // Limit to 8 characters maximum
    if (result.length() > 8) {
        result = result.substr(0, 8);
    }
    
    return result;
}

bool URLShortener::isValidURL(const string& url) {
    if (url.empty() || url.length() < 4) {
        return false;
    }
    
    // Check for basic URL patterns
    string lowerURL = url;
    transform(lowerURL.begin(), lowerURL.end(), lowerURL.begin(), ::tolower);
    
    return (lowerURL.find("http://") == 0 || 
            lowerURL.find("https://") == 0 || 
            lowerURL.find("www.") == 0 ||
            lowerURL.find("ftp://") == 0);
}

string URLShortener::shortenURL(const string& longURL) {
    if (!isValidURL(longURL)) {
        return "INVALID_URL";
    }
    
    // Check if URL already exists
    string* existingShort = urlMap.get(longURL);
    if (existingShort) {
        return *existingShort;
    }
    
    // Generate new short URL
    string shortURL;
    int attempts = 0;
    const int maxAttempts = 10;
    
    do {
        shortURL = generateHash(longURL + to_string(attempts));
        attempts++;
    } while (shortToLongMap.contains(shortURL) && attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
        return "GENERATION_FAILED";
    }
    
    // Store the mapping
    urlMap.insert(longURL, shortURL);
    shortToLongMap.insert(shortURL, longURL);
    
    // Store in our vector for persistence
    urlStorage.push_back(make_pair(shortURL, longURL));
    
    // Save to file
    saveToFile();
    
    return shortURL;
}

string URLShortener::getLongURL(const string& shortURL) {
    string* longURL = shortToLongMap.get(shortURL);
    if (longURL) {
        return *longURL;
    }
    return "NOT_FOUND";
}

void URLShortener::loadFromFile() {
    ifstream file(dataFile);
    if (!file.is_open()) {
        cout << "Creating new data file: " << dataFile << endl;
        return;
    }
    
    string line;
    int count = 0;
    
    while (getline(file, line)) {
        // Skip comment lines
        if (line.empty() || line[0] == '#') {
            continue;
        }
        
        size_t pos = line.find('|');
        if (pos != string::npos) {
            string shortURL = line.substr(0, pos);
            string longURL = line.substr(pos + 1);
            
            urlMap.insert(longURL, shortURL);
            shortToLongMap.insert(shortURL, longURL);
            urlStorage.push_back(make_pair(shortURL, longURL));
            count++;
        }
    }
    
    file.close();
    cout << "Loaded " << count << " URLs from file." << endl;
}

void URLShortener::saveToFile() {
    ofstream file(dataFile);
    if (!file.is_open()) {
        cerr << "Error: Cannot open file for writing: " << dataFile << endl;
        return;
    }
    
    cout << "Saving URLs to file..." << endl;
    
    // Save all URLs from our storage vector
    for (const auto& urlPair : urlStorage) {
        file << urlPair.first << "|" << urlPair.second << endl;
    }
    
    file.close();
} 