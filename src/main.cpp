#include <iostream>
#include <string>
#include <cstdlib>
#include <ctime>
#include "url_shortener.h"

using namespace std;

void printMenu() {
    cout << "\n=== URL Shortener - DSA Project ===" << endl;
    cout << "1. Shorten a URL" << endl;
    cout << "2. Get original URL" << endl;
    cout << "3. View all URLs" << endl;
    cout << "4. View statistics" << endl;
    cout << "5. Clear all URLs" << endl;
    cout << "6. Test with sample URLs" << endl;
    cout << "7. Exit" << endl;
    cout << "===================================" << endl;
    cout << "Enter your choice: ";
}

void testWithSampleURLs(URLShortener& shortener) {
    cout << "\n=== Testing with Sample URLs ===" << endl;
    
    string sampleURLs[] = {
        "https://www.google.com",
        "https://www.github.com",
        "https://www.stackoverflow.com",
        "https://www.wikipedia.org",
        "https://www.youtube.com"
    };
    
    for (const auto& url : sampleURLs) {
        string shortURL = shortener.shortenURL(url);
        cout << "Original: " << url << endl;
        cout << "Shortened: " << shortURL << endl;
        cout << "Retrieved: " << shortener.getLongURL(shortURL) << endl;
        cout << "---" << endl;
    }
}

int main() {
    srand(time(nullptr));
    
    cout << "Initializing URL Shortener..." << endl;
    URLShortener shortener;
    
    int choice;
    string input;
    
    while (true) {
        printMenu();
        cin >> choice;
        cin.ignore(); // Clear buffer
        
        switch (choice) {
            case 1: {
                cout << "Enter the URL to shorten: ";
                getline(cin, input);
                
                string shortURL = shortener.shortenURL(input);
                if (shortURL == "INVALID_URL") {
                    cout << "Error: Invalid URL format!" << endl;
                } else if (shortURL == "GENERATION_FAILED") {
                    cout << "Error: Failed to generate short URL!" << endl;
                } else {
                    cout << "Shortened URL: " << shortURL << endl;
                }
                break;
            }
            
            case 2: {
                cout << "Enter the short URL: ";
                getline(cin, input);
                
                string longURL = shortener.getLongURL(input);
                if (longURL == "NOT_FOUND") {
                    cout << "Error: Short URL not found!" << endl;
                } else {
                    cout << "Original URL: " << longURL << endl;
                }
                break;
            }
            
            case 3:
                shortener.printAllURLs();
                break;
                
            case 4:
                shortener.printStats();
                break;
                
            case 5:
                cout << "Are you sure you want to clear all URLs? (y/n): ";
                getline(cin, input);
                if (input == "y" || input == "Y") {
                    shortener.clearAll();
                }
                break;
                
            case 6:
                testWithSampleURLs(shortener);
                break;
                
            case 7:
                cout << "Saving data and exiting..." << endl;
                shortener.saveToFileNow();
                cout << "Goodbye!" << endl;
                return 0;
                
            default:
                cout << "Invalid choice! Please try again." << endl;
        }
    }
    
    return 0;
} 