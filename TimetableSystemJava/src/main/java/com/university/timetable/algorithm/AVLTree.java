package com.university.timetable.algorithm;

import com.university.timetable.model.TimetableEntry;
import java.util.ArrayList;
import java.util.List;

/**
 * AVL Tree for storing and managing time-based schedules
 * Ensures O(log n) time complexity for insertion, deletion, and search
 * Automatically detects time conflicts during insertion
 */
public class AVLTree {
    
    private class Node {
        TimetableEntry entry;
        Node left, right;
        int height;
        
        Node(TimetableEntry entry) {
            this.entry = entry;
            this.height = 1;
        }
    }
    
    private Node root;
    private List<String> conflicts;
    
    public AVLTree() {
        this.conflicts = new ArrayList<>();
    }
    
    // Get height of node
    private int height(Node node) {
        return node == null ? 0 : node.height;
    }
    
    // Get balance factor
    private int getBalance(Node node) {
        return node == null ? 0 : height(node.left) - height(node.right);
    }
    
    // Right rotate
    private Node rightRotate(Node y) {
        Node x = y.left;
        Node T2 = x.right;
        
        x.right = y;
        y.left = T2;
        
        y.height = Math.max(height(y.left), height(y.right)) + 1;
        x.height = Math.max(height(x.left), height(x.right)) + 1;
        
        return x;
    }
    
    // Left rotate
    private Node leftRotate(Node x) {
        Node y = x.right;
        Node T2 = y.left;
        
        y.left = x;
        x.right = T2;
        
        x.height = Math.max(height(x.left), height(x.right)) + 1;
        y.height = Math.max(height(y.left), height(y.right)) + 1;
        
        return y;
    }
    
    /**
     * Insert a new timetable entry and check for conflicts
     * Returns true if inserted successfully, false if conflict detected
     */
    public boolean insert(TimetableEntry entry) {
        conflicts.clear();
        root = insertNode(root, entry);
        return conflicts.isEmpty();
    }
    
    private Node insertNode(Node node, TimetableEntry entry) {
        // Standard BST insertion
        if (node == null) {
            return new Node(entry);
        }
        
        int compareResult = compareEntries(entry, node.entry);
        
        if (compareResult < 0) {
            node.left = insertNode(node.left, entry);
        } else if (compareResult > 0) {
            node.right = insertNode(node.right, entry);
        } else {
            // Check for conflicts (same day and overlapping time)
            if (hasTimeConflict(entry, node.entry)) {
                conflicts.add("Conflict detected with: " + node.entry.getCourse().getName() + 
                            " at " + node.entry.getTimeSlot().getStartTime());
            }
            node.right = insertNode(node.right, entry);
        }
        
        // Update height
        node.height = 1 + Math.max(height(node.left), height(node.right));
        
        // Get balance factor and rebalance if needed
        int balance = getBalance(node);
        
        // Left Left Case
        if (balance > 1 && compareEntries(entry, node.left.entry) < 0) {
            return rightRotate(node);
        }
        
        // Right Right Case
        if (balance < -1 && compareEntries(entry, node.right.entry) > 0) {
            return leftRotate(node);
        }
        
        // Left Right Case
        if (balance > 1 && compareEntries(entry, node.left.entry) > 0) {
            node.left = leftRotate(node.left);
            return rightRotate(node);
        }
        
        // Right Left Case
        if (balance < -1 && compareEntries(entry, node.right.entry) < 0) {
            node.right = rightRotate(node.right);
            return leftRotate(node);
        }
        
        return node;
    }
    
    /**
     * Compare two entries based on day and start time
     */
    private int compareEntries(TimetableEntry e1, TimetableEntry e2) {
        // First compare by day
        int dayCompare = e1.getTimeSlot().getDay().compareTo(e2.getTimeSlot().getDay());
        if (dayCompare != 0) return dayCompare;
        
        // Then compare by start time
        return e1.getTimeSlot().getStartTime().compareTo(e2.getTimeSlot().getStartTime());
    }
    
    /**
     * Check if two entries have time conflicts
     */
    private boolean hasTimeConflict(TimetableEntry e1, TimetableEntry e2) {
        // Same day?
        if (!e1.getTimeSlot().getDay().equals(e2.getTimeSlot().getDay())) {
            return false;
        }
        
        // Same room or same professor?
        boolean sameRoom = e1.getRoom().getId().equals(e2.getRoom().getId());
        boolean sameProfessor = e1.getProfessor().getId().equals(e2.getProfessor().getId());
        
        if (!sameRoom && !sameProfessor) {
            return false;
        }
        
        // Check time overlap
        String start1 = e1.getTimeSlot().getStartTime();
        String end1 = e1.getTimeSlot().getEndTime();
        String start2 = e2.getTimeSlot().getStartTime();
        String end2 = e2.getTimeSlot().getEndTime();
        
        // Times overlap if: start1 < end2 AND start2 < end1
        return start1.compareTo(end2) < 0 && start2.compareTo(end1) < 0;
    }
    
    /**
     * Get all entries in sorted order (in-order traversal)
     */
    public List<TimetableEntry> getAllEntries() {
        List<TimetableEntry> entries = new ArrayList<>();
        inOrderTraversal(root, entries);
        return entries;
    }
    
    private void inOrderTraversal(Node node, List<TimetableEntry> entries) {
        if (node != null) {
            inOrderTraversal(node.left, entries);
            entries.add(node.entry);
            inOrderTraversal(node.right, entries);
        }
    }
    
    /**
     * Get conflict messages from last insert operation
     */
    public List<String> getConflicts() {
        return new ArrayList<>(conflicts);
    }
    
    /**
     * Search for entries by day
     */
    public List<TimetableEntry> findByDay(String day) {
        List<TimetableEntry> result = new ArrayList<>();
        findByDayHelper(root, day, result);
        return result;
    }
    
    private void findByDayHelper(Node node, String day, List<TimetableEntry> result) {
        if (node != null) {
            findByDayHelper(node.left, day, result);
            if (node.entry.getTimeSlot().getDay().equalsIgnoreCase(day)) {
                result.add(node.entry);
            }
            findByDayHelper(node.right, day, result);
        }
    }
}

