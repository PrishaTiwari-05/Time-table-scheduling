package com.university.timetable.algorithm;

import com.university.timetable.model.Room;
import com.university.timetable.model.TimetableEntry;
import com.university.timetable.model.TimeSlot;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Greedy Algorithm for optimal classroom allocation
 * Allocates the smallest available room that meets the batch size requirement
 * Ensures minimal space wastage and balanced classroom usage
 */
public class GreedyRoomAllocator {
    
    /**
     * Find the best available room for a class
     * Strategy: Select smallest room that:
     * 1. Has sufficient capacity for the students
     * 2. Is available at the given time slot
     * 3. Minimizes wasted space
     * 
     * Time Complexity: O(n log n) for sorting + O(n) for allocation = O(n log n)
     */
    public Room allocateRoom(
            int requiredCapacity, 
            TimeSlot timeSlot, 
            List<Room> allRooms, 
            List<TimetableEntry> existingEntries) {
        
        if (allRooms == null || allRooms.isEmpty()) {
            return null;
        }
        
        // Step 1: Sort rooms by capacity (ascending) - Greedy Strategy
        List<Room> sortedRooms = allRooms.stream()
                .sorted(Comparator.comparingInt(Room::getCapacity))
                .collect(Collectors.toList());
        
        // Step 2: Find smallest suitable room that is available
        for (Room room : sortedRooms) {
            // Check if room has sufficient capacity
            if (room.getCapacity() >= requiredCapacity) {
                // Check if room is available at this time
                if (isRoomAvailable(room, timeSlot, existingEntries)) {
                    return room; // Greedy choice: first suitable room
                }
            }
        }
        
        return null; // No suitable room found
    }
    
    /**
     * Find the best available room with room type preference
     */
    public Room allocateRoomWithType(
            int requiredCapacity,
            String preferredType,
            TimeSlot timeSlot,
            List<Room> allRooms,
            List<TimetableEntry> existingEntries) {
        
        if (allRooms == null || allRooms.isEmpty()) {
            return null;
        }
        
        // First try to find a room of preferred type
        List<Room> preferredRooms = allRooms.stream()
                .filter(r -> r.getType().equalsIgnoreCase(preferredType))
                .sorted(Comparator.comparingInt(Room::getCapacity))
                .collect(Collectors.toList());
        
        for (Room room : preferredRooms) {
            if (room.getCapacity() >= requiredCapacity) {
                if (isRoomAvailable(room, timeSlot, existingEntries)) {
                    return room;
                }
            }
        }
        
        // If no preferred type room available, fall back to any suitable room
        return allocateRoom(requiredCapacity, timeSlot, allRooms, existingEntries);
    }
    
    /**
     * Check if a room is available at given time slot
     */
    private boolean isRoomAvailable(Room room, TimeSlot timeSlot, List<TimetableEntry> existingEntries) {
        if (existingEntries == null) {
            return true;
        }
        
        for (TimetableEntry entry : existingEntries) {
            // Same room and same time slot means conflict
            if (entry.getRoom().getId().equals(room.getId()) &&
                hasTimeOverlap(entry.getTimeSlot(), timeSlot)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Check if two time slots overlap
     */
    private boolean hasTimeOverlap(TimeSlot slot1, TimeSlot slot2) {
        // Different days = no overlap
        if (!slot1.getDay().equalsIgnoreCase(slot2.getDay())) {
            return false;
        }
        
        // Check time overlap: slot1.start < slot2.end AND slot2.start < slot1.end
        return slot1.getStartTime().compareTo(slot2.getEndTime()) < 0 &&
               slot2.getStartTime().compareTo(slot1.getEndTime()) < 0;
    }
    
    /**
     * Get list of all available rooms for a time slot
     */
    public List<Room> getAvailableRooms(
            TimeSlot timeSlot,
            List<Room> allRooms,
            List<TimetableEntry> existingEntries) {
        
        List<Room> availableRooms = new ArrayList<>();
        
        for (Room room : allRooms) {
            if (isRoomAvailable(room, timeSlot, existingEntries)) {
                availableRooms.add(room);
            }
        }
        
        // Sort by capacity for easier selection
        availableRooms.sort(Comparator.comparingInt(Room::getCapacity));
        
        return availableRooms;
    }
    
    /**
     * Calculate space utilization percentage
     */
    public double calculateUtilization(int studentCount, Room room) {
        if (room == null || room.getCapacity() == 0) {
            return 0.0;
        }
        
        return (studentCount * 100.0) / room.getCapacity();
    }
    
    /**
     * Find optimal room with best utilization (closest to 80-90% capacity)
     */
    public Room findOptimalRoom(
            int requiredCapacity,
            TimeSlot timeSlot,
            List<Room> allRooms,
            List<TimetableEntry> existingEntries) {
        
        List<Room> availableRooms = getAvailableRooms(timeSlot, allRooms, existingEntries);
        
        Room bestRoom = null;
        double bestUtilization = 0;
        double targetUtilization = 85.0; // Target 85% capacity
        
        for (Room room : availableRooms) {
            if (room.getCapacity() >= requiredCapacity) {
                double utilization = calculateUtilization(requiredCapacity, room);
                
                // Prefer rooms with utilization close to target
                if (bestRoom == null || 
                    Math.abs(utilization - targetUtilization) < Math.abs(bestUtilization - targetUtilization)) {
                    bestRoom = room;
                    bestUtilization = utilization;
                }
            }
        }
        
        return bestRoom;
    }
}

