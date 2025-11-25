package com.university.timetable.algorithm;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Trie (Prefix Tree) for fast auto-completion of course codes and room numbers
 * Provides O(m) time complexity for search where m = length of prefix
 */
public class Trie {
    
    private class TrieNode {
        Map<Character, TrieNode> children;
        boolean isEndOfWord;
        String fullWord;
        
        TrieNode() {
            children = new HashMap<>();
            isEndOfWord = false;
            fullWord = null;
        }
    }
    
    private TrieNode root;
    
    public Trie() {
        root = new TrieNode();
    }
    
    /**
     * Insert a word into the Trie
     * Time Complexity: O(m) where m = length of word
     */
    public void insert(String word) {
        if (word == null || word.isEmpty()) {
            return;
        }
        
        TrieNode current = root;
        word = word.toUpperCase(); // Case insensitive
        
        for (char ch : word.toCharArray()) {
            current.children.putIfAbsent(ch, new TrieNode());
            current = current.children.get(ch);
        }
        
        current.isEndOfWord = true;
        current.fullWord = word;
    }
    
    /**
     * Search for exact word match
     * Time Complexity: O(m) where m = length of word
     */
    public boolean search(String word) {
        if (word == null || word.isEmpty()) {
            return false;
        }
        
        TrieNode node = findNode(word.toUpperCase());
        return node != null && node.isEndOfWord;
    }
    
    /**
     * Find all words with given prefix
     * Returns list of matching words sorted alphabetically
     * Time Complexity: O(m + n) where m = prefix length, n = number of results
     */
    public List<String> findWithPrefix(String prefix) {
        List<String> results = new ArrayList<>();
        
        if (prefix == null || prefix.isEmpty()) {
            return results;
        }
        
        prefix = prefix.toUpperCase();
        TrieNode node = findNode(prefix);
        
        if (node == null) {
            return results;
        }
        
        // Collect all words with this prefix
        collectAllWords(node, prefix, results);
        return results;
    }
    
    /**
     * Find the node corresponding to a prefix/word
     */
    private TrieNode findNode(String str) {
        TrieNode current = root;
        
        for (char ch : str.toCharArray()) {
            if (!current.children.containsKey(ch)) {
                return null;
            }
            current = current.children.get(ch);
        }
        
        return current;
    }
    
    /**
     * Recursively collect all words from a given node
     */
    private void collectAllWords(TrieNode node, String currentWord, List<String> results) {
        if (node == null) {
            return;
        }
        
        if (node.isEndOfWord) {
            results.add(node.fullWord);
        }
        
        for (Map.Entry<Character, TrieNode> entry : node.children.entrySet()) {
            collectAllWords(entry.getValue(), currentWord + entry.getKey(), results);
        }
    }
    
    /**
     * Auto-complete: suggest words based on partial input
     * Example: "CS" -> ["CS101", "CS102", "CS-LAB1"]
     */
    public List<String> autoComplete(String prefix) {
        return findWithPrefix(prefix);
    }
    
    /**
     * Check if any word starts with the given prefix
     */
    public boolean startsWith(String prefix) {
        if (prefix == null || prefix.isEmpty()) {
            return false;
        }
        
        return findNode(prefix.toUpperCase()) != null;
    }
    
    /**
     * Delete a word from the Trie
     */
    public boolean delete(String word) {
        if (word == null || word.isEmpty()) {
            return false;
        }
        
        return deleteHelper(root, word.toUpperCase(), 0);
    }
    
    private boolean deleteHelper(TrieNode current, String word, int index) {
        if (index == word.length()) {
            if (!current.isEndOfWord) {
                return false; // Word doesn't exist
            }
            current.isEndOfWord = false;
            current.fullWord = null;
            return current.children.isEmpty();
        }
        
        char ch = word.charAt(index);
        TrieNode node = current.children.get(ch);
        
        if (node == null) {
            return false; // Word doesn't exist
        }
        
        boolean shouldDeleteCurrentNode = deleteHelper(node, word, index + 1);
        
        if (shouldDeleteCurrentNode) {
            current.children.remove(ch);
            return current.children.isEmpty() && !current.isEndOfWord;
        }
        
        return false;
    }
    
    /**
     * Get total number of words in the Trie
     */
    public int getWordCount() {
        return countWords(root);
    }
    
    private int countWords(TrieNode node) {
        if (node == null) {
            return 0;
        }
        
        int count = node.isEndOfWord ? 1 : 0;
        
        for (TrieNode child : node.children.values()) {
            count += countWords(child);
        }
        
        return count;
    }
}

