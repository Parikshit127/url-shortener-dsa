#include <iostream>
#include <string>
#include <cstdlib>
#include <ctime>
#include "url_shortener.h"

void printMenu() {
    std::cout << "\n=== URL Shortener - DSA Project ===" << std::endl;
    std::cout << "1. Shorten a URL" << std::endl;
    std::cout << "2. Get original URL" << std::endl;
    std::cout << "3. View all URLs" << std::endl;
    std::cout << "4. View statistics" << std::endl;
    std::cout << "5. Clear all URLs" << std::endl;
    std::cout << "6. Test with sample URLs" << std::endl;
    std::cout << "7. Exit" << std::endl;
    std::cout << "===================================" << std::endl;
    std::cout << "Enter your choice: ";
}

void testWithSampleURLs(URLShortener& shortener) {
    std::cout << "\n=== Testing with Sample URLs ===" << std::endl;
    
    std::string sampleURLs[] = {
        "https://www.google.com",
        "https://www.github.com",
        "https://www.stackoverflow.com",
        "https://www.wikipedia.org",
        "https://www.youtube.com"
    };
    
    for (const auto& url : sampleURLs) {
        std::string shortURL = shortener.shortenURL(url);
        std::cout << "Original: " << url << std::endl;
        std::cout << "Shortened: " << shortURL << std::endl;
        std::cout << "Retrieved: " << shortener.getLongURL(shortURL) << std::endl;
        std::cout << "---" << std::endl;
    }
}

int main() {
    std::srand(std::time(nullptr));
    
    std::cout << "Initializing URL Shortener..." << std::endl;
    URLShortener shortener;
    
    int choice;
    std::string input;
    
    while (true) {
        printMenu();
        std::cin >> choice;
        std::cin.ignore(); // Clear buffer
        
        switch (choice) {
            case 1: {
                std::cout << "Enter the URL to shorten: ";
                std::getline(std::cin, input);
                
                std::string shortURL = shortener.shortenURL(input);
                if (shortURL == "INVALID_URL") {
                    std::cout << "Error: Invalid URL format!" << std::endl;
                } else if (shortURL == "GENERATION_FAILED") {
                    std::cout << "Error: Failed to generate short URL!" << std::endl;
                } else {
                    std::cout << "Shortened URL: " << shortURL << std::endl;
                }
                break;
            }
            
            case 2: {
                std::cout << "Enter the short URL: ";
                std::getline(std::cin, input);
                
                std::string longURL = shortener.getLongURL(input);
                if (longURL == "NOT_FOUND") {
                    std::cout << "Error: Short URL not found!" << std::endl;
                } else {
                    std::cout << "Original URL: " << longURL << std::endl;
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
                std::cout << "Are you sure you want to clear all URLs? (y/n): ";
                std::getline(std::cin, input);
                if (input == "y" || input == "Y") {
                    shortener.clearAll();
                }
                break;
                
            case 6:
                testWithSampleURLs(shortener);
                break;
                
            case 7:
                std::cout << "Saving data and exiting..." << std::endl;
                shortener.saveToFileNow();
                std::cout << "Goodbye!" << std::endl;
                return 0;
                
            default:
                std::cout << "Invalid choice! Please try again." << std::endl;
        }
    }
    
    return 0;
} 