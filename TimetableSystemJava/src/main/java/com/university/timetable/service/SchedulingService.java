package com.university.timetable.service;

import com.university.timetable.algorithm.AVLTree;
import com.university.timetable.algorithm.GreedyRoomAllocator;
import com.university.timetable.algorithm.Trie;
import com.university.timetable.model.*;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Main Scheduling Service that integrates:
 * 1. AVL Tree - for time-based scheduling and conflict detection
 * 2. Trie - for auto-completion of courses and rooms
 * 3. Greedy Algorithm - for optimal room allocation
 */
@Service
public class SchedulingService {
    
    private AVLTree scheduleTree;
    private Trie courseTrie;
    private Trie roomTrie;
    private GreedyRoomAllocator roomAllocator;
    
    private List<TimetableEntry> allEntries;
    private List<Course> allCourses;
    private List<Room> allRooms;
    private List<Professor> allProfessors;
    private List<TimeSlot> allTimeSlots;
    
    public SchedulingService() {
        // Initialize algorithms
        scheduleTree = new AVLTree();
        courseTrie = new Trie();
        roomTrie = new Trie();
        roomAllocator = new GreedyRoomAllocator();
        
        // Initialize data structures
        allEntries = new ArrayList<>();
        allCourses = new ArrayList<>();
        allRooms = new ArrayList<>();
        allProfessors = new ArrayList<>();
        allTimeSlots = new ArrayList<>();
        
        // Load sample data
        initializeSampleData();
    }
    
    private void initializeSampleData() {
        // Sample Rooms
        allRooms.add(new Room("R1", "101", "Engineering Block", 30, "Lecture Hall"));
        allRooms.add(new Room("R2", "102", "Engineering Block", 50, "Lecture Hall"));
        allRooms.add(new Room("R3", "103", "Engineering Block", 80, "Lecture Hall"));
        allRooms.add(new Room("R4", "LAB1", "CS Block", 40, "Lab"));
        allRooms.add(new Room("R5", "LAB2", "CS Block", 40, "Lab"));
        allRooms.add(new Room("R6", "201", "Science Building", 60, "Lecture Hall"));
        
        // Sample Courses
        allCourses.add(new Course("C1", "CS501", "Advanced Algorithms", 4, "Computer Science", 45));
        allCourses.add(new Course("C2", "CS502", "Database Systems", 3, "Computer Science", 50));
        allCourses.add(new Course("C3", "CS503", "Machine Learning", 4, "Computer Science", 40));
        allCourses.add(new Course("C4", "MATH301", "Linear Algebra", 3, "Mathematics", 60));
        allCourses.add(new Course("C5", "CS504", "Operating Systems", 4, "Computer Science", 35));
        
        // Sample Professors
        allProfessors.add(new Professor("P1", "Dr. Smith", "Computer Science", "smith@university.edu"));
        allProfessors.add(new Professor("P2", "Dr. Johnson", "Computer Science", "johnson@university.edu"));
        allProfessors.add(new Professor("P3", "Dr. Williams", "Mathematics", "williams@university.edu"));
        allProfessors.add(new Professor("P4", "Dr. Brown", "Computer Science", "brown@university.edu"));
        
        // Sample Time Slots
        allTimeSlots.add(new TimeSlot("T1", "Monday", "09:00", "10:30"));
        allTimeSlots.add(new TimeSlot("T2", "Monday", "11:00", "12:30"));
        allTimeSlots.add(new TimeSlot("T3", "Monday", "14:00", "15:30"));
        allTimeSlots.add(new TimeSlot("T4", "Tuesday", "09:00", "10:30"));
        allTimeSlots.add(new TimeSlot("T5", "Tuesday", "11:00", "12:30"));
        allTimeSlots.add(new TimeSlot("T6", "Wednesday", "09:00", "10:30"));
        allTimeSlots.add(new TimeSlot("T7", "Wednesday", "14:00", "15:30"));
        allTimeSlots.add(new TimeSlot("T8", "Thursday", "09:00", "10:30"));
        allTimeSlots.add(new TimeSlot("T9", "Friday", "11:00", "12:30"));
        
        // Build Tries
        for (Course course : allCourses) {
            courseTrie.insert(course.getCode());
            courseTrie.insert(course.getName());
        }
        
        for (Room room : allRooms) {
            roomTrie.insert(room.getRoomNumber());
            roomTrie.insert(room.getBuilding());
        }
    }
    
    /**
     * Schedule a new class using all three algorithms
     * 1. Greedy allocates best room
     * 2. AVL checks for conflicts
     * 3. Returns result
     */
    public Map<String, Object> scheduleClass(String courseId, String professorId, String timeSlotId) {
        Map<String, Object> result = new HashMap<>();
        
        // Find entities
        Course course = findCourseById(courseId);
        Professor professor = findProfessorById(professorId);
        TimeSlot timeSlot = findTimeSlotById(timeSlotId);
        
        if (course == null || professor == null || timeSlot == null) {
            result.put("success", false);
            result.put("message", "Invalid course, professor, or time slot");
            return result;
        }
        
        // Step 1: Use Greedy Algorithm to allocate best room
        Room allocatedRoom = roomAllocator.allocateRoom(
            course.getEnrolledStudents(), 
            timeSlot, 
            allRooms, 
            allEntries
        );
        
        if (allocatedRoom == null) {
            result.put("success", false);
            result.put("message", "No suitable room available for this time slot");
            result.put("suggestion", "Try a different time slot");
            return result;
        }
        
        // Step 2: Create entry and check conflicts using AVL Tree
        TimetableEntry newEntry = new TimetableEntry(
            "TE" + (allEntries.size() + 1),
            course,
            professor,
            allocatedRoom,
            timeSlot
        );
        
        boolean noConflict = scheduleTree.insert(newEntry);
        
        if (!noConflict) {
            result.put("success", false);
            result.put("message", "Scheduling conflict detected");
            result.put("conflicts", scheduleTree.getConflicts());
            return result;
        }
        
        // Step 3: Add to entries list
        allEntries.add(newEntry);
        
        double utilization = roomAllocator.calculateUtilization(
            course.getEnrolledStudents(), 
            allocatedRoom
        );
        
        result.put("success", true);
        result.put("message", "Class scheduled successfully");
        result.put("entry", newEntry);
        result.put("room", allocatedRoom);
        result.put("utilization", String.format("%.1f%%", utilization));
        
        return result;
    }
    
    /**
     * Auto-complete course codes or names using Trie
     */
    public List<String> autoCompleteCourse(String prefix) {
        return courseTrie.autoComplete(prefix);
    }
    
    /**
     * Auto-complete room numbers or buildings using Trie
     */
    public List<String> autoCompleteRoom(String prefix) {
        return roomTrie.autoComplete(prefix);
    }
    
    /**
     * Get all available rooms for a time slot (Greedy algorithm)
     */
    public List<Room> getAvailableRooms(String timeSlotId) {
        TimeSlot timeSlot = findTimeSlotById(timeSlotId);
        if (timeSlot == null) {
            return new ArrayList<>();
        }
        
        return roomAllocator.getAvailableRooms(timeSlot, allRooms, allEntries);
    }
    
    /**
     * Get schedule for a specific day (AVL Tree search)
     */
    public List<TimetableEntry> getScheduleByDay(String day) {
        return scheduleTree.findByDay(day);
    }
    
    /**
     * Get all scheduled entries (sorted by AVL Tree)
     */
    public List<TimetableEntry> getAllScheduledEntries() {
        return scheduleTree.getAllEntries();
    }
    
    // Getter methods for data
    public List<Course> getAllCourses() {
        return new ArrayList<>(allCourses);
    }
    
    public List<Room> getAllRooms() {
        return new ArrayList<>(allRooms);
    }
    
    public List<Professor> getAllProfessors() {
        return new ArrayList<>(allProfessors);
    }
    
    public List<TimeSlot> getAllTimeSlots() {
        return new ArrayList<>(allTimeSlots);
    }
    
    // Add new entities
    public Course addCourse(Course course) {
        course.setId("C" + (allCourses.size() + 1));
        allCourses.add(course);
        courseTrie.insert(course.getCode());
        courseTrie.insert(course.getName());
        return course;
    }
    
    public Room addRoom(Room room) {
        room.setId("R" + (allRooms.size() + 1));
        allRooms.add(room);
        roomTrie.insert(room.getRoomNumber());
        return room;
    }
    
    public Professor addProfessor(Professor professor) {
        professor.setId("P" + (allProfessors.size() + 1));
        allProfessors.add(professor);
        return professor;
    }
    
    public TimeSlot addTimeSlot(TimeSlot timeSlot) {
        timeSlot.setId("T" + (allTimeSlots.size() + 1));
        allTimeSlots.add(timeSlot);
        return timeSlot;
    }
    
    // Helper methods to find entities
    private Course findCourseById(String id) {
        return allCourses.stream()
            .filter(c -> c.getId().equals(id))
            .findFirst()
            .orElse(null);
    }
    
    private Professor findProfessorById(String id) {
        return allProfessors.stream()
            .filter(p -> p.getId().equals(id))
            .findFirst()
            .orElse(null);
    }
    
    private TimeSlot findTimeSlotById(String id) {
        return allTimeSlots.stream()
            .filter(t -> t.getId().equals(id))
            .findFirst()
            .orElse(null);
    }
}

