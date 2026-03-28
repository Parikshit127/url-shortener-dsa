#include <iostream>
#include <string>
#include <list>
#include <utility>
#include <cmath>

using namespace std;

template<typename K, typename V>
class HashMap {
private:
    struct Node {
        K key;
        V value;
        Node(const K& k, const V& v) : key(k), value(v) {}
    };
    
    list<Node>* table;
    int capacity;
    int size;
    static const int DEFAULT_CAPACITY = 100;
    static const double LOAD_FACTOR_THRESHOLD;
    
    int hash(const K& key) const {
        hash<K> hasher;
        return hasher(key) % capacity;
    }
    
    void resize() {
        int oldCapacity = capacity;
        list<Node>* oldTable = table;
        
        capacity *= 2;
        table = new list<Node>[capacity];
        size = 0;
        
        for (int i = 0; i < oldCapacity; i++) {
            for (const auto& node : oldTable[i]) {
                insert(node.key, node.value);
            }
        }
        
        delete[] oldTable;
    }
    
public:
    HashMap() : capacity(DEFAULT_CAPACITY), size(0) {
        table = new list<Node>[capacity];
    }
    
    ~HashMap() {
        delete[] table;
    }
    
    void insert(const K& key, const V& value) {
        if ((double)size / capacity >= LOAD_FACTOR_THRESHOLD) {
            resize();
        }
        
        int index = hash(key);
        
        // Check if key already exists
        for (auto& node : table[index]) {
            if (node.key == key) {
                node.value = value;
                return;
            }
        }
        
        // Insert new key-value pair
        table[index].push_back(Node(key, value));
        size++;
    }
    
    V* get(const K& key) {
        int index = hash(key);
        
        for (auto& node : table[index]) {
            if (node.key == key) {
                return &(node.value);
            }
        }
        
        return nullptr;
    }
    
    bool remove(const K& key) {
        int index = hash(key);
        
        for (auto it = table[index].begin(); it != table[index].end(); ++it) {
            if (it->key == key) {
                table[index].erase(it);
                size--;
                return true;
            }
        }
        
        return false;
    }
    
    bool contains(const K& key) const {
        int index = hash(key);
        
        for (const auto& node : table[index]) {
            if (node.key == key) {
                return true;
            }
        }
        
        return false;
    }
    
    int getSize() const {
        return size;
    }
    
    bool isEmpty() const {
        return size == 0;
    }
    
    void clear() {
        for (int i = 0; i < capacity; i++) {
            table[i].clear();
        }
        size = 0;
    }
    
    // Print hashmap statistics
    void printStats() const {
        cout << "Hashmap Statistics:" << endl;
        cout << "Size: " << size << endl;
        cout << "Capacity: " << capacity << endl;
        cout << "Load Factor: " << (double)size / capacity << endl;
        
        int maxChainLength = 0;
        int emptyBuckets = 0;
        
        for (int i = 0; i < capacity; i++) {
            int chainLength = table[i].size();
            if (chainLength > maxChainLength) {
                maxChainLength = chainLength;
            }
            if (chainLength == 0) {
                emptyBuckets++;
            }
        }
        
        cout << "Max Chain Length: " << maxChainLength << endl;
        cout << "Empty Buckets: " << emptyBuckets << endl;
        cout << "Utilization: " << (double)(capacity - emptyBuckets) / capacity * 100 << "%" << endl;
    }
};

template<typename K, typename V>
const double HashMap<K, V>::LOAD_FACTOR_THRESHOLD = 0.75; 