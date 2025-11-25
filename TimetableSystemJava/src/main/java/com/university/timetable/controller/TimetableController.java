package com.university.timetable.controller;

import com.university.timetable.model.*;
import com.university.timetable.service.SchedulingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class TimetableController {

    @Autowired
    private SchedulingService schedulingService;

    // ========== SMART SCHEDULING ENDPOINTS (Using AVL Tree, Trie, Greedy) ==========
    
    /**
     * Schedule a class using:
     * - Greedy Algorithm for room allocation
     * - AVL Tree for conflict detection
     */
    @PostMapping("/schedule")
    public ResponseEntity<?> scheduleClass(@RequestBody Map<String, String> request) {
        String courseId = request.get("courseId");
        String professorId = request.get("professorId");
        String timeSlotId = request.get("timeSlotId");
        
        Map<String, Object> result = schedulingService.scheduleClass(courseId, professorId, timeSlotId);
        
        if ((Boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    /**
     * Auto-complete course codes/names using Trie
     * Example: GET /api/autocomplete/course?prefix=CS
     * Returns: ["CS501", "CS502", "CS503", "CS504"]
     */
    @GetMapping("/autocomplete/course")
    public List<String> autoCompleteCourse(@RequestParam String prefix) {
        return schedulingService.autoCompleteCourse(prefix);
    }
    
    /**
     * Auto-complete room numbers/buildings using Trie
     * Example: GET /api/autocomplete/room?prefix=LAB
     * Returns: ["LAB1", "LAB2"]
     */
    @GetMapping("/autocomplete/room")
    public List<String> autoCompleteRoom(@RequestParam String prefix) {
        return schedulingService.autoCompleteRoom(prefix);
    }
    
    /**
     * Get available rooms for a time slot (Greedy algorithm)
     * Example: GET /api/rooms/available?timeSlotId=T1
     */
    @GetMapping("/rooms/available")
    public List<Room> getAvailableRooms(@RequestParam String timeSlotId) {
        return schedulingService.getAvailableRooms(timeSlotId);
    }
    
    /**
     * Get schedule for a specific day (AVL Tree search)
     * Example: GET /api/schedule/day?day=Monday
     */
    @GetMapping("/schedule/day")
    public List<TimetableEntry> getScheduleByDay(@RequestParam String day) {
        return schedulingService.getScheduleByDay(day);
    }
    
    /**
     * Get all scheduled entries (sorted by AVL Tree)
     */
    @GetMapping("/schedule/all")
    public List<TimetableEntry> getAllScheduledEntries() {
        return schedulingService.getAllScheduledEntries();
    }

    // ========== BASIC CRUD ENDPOINTS ==========
    
    // Courses
    @GetMapping("/courses")
    public List<Course> getAllCourses() {
        return schedulingService.getAllCourses();
    }

    @PostMapping("/courses")
    public Course addCourse(@RequestBody Course course) {
        return schedulingService.addCourse(course);
    }

    // Professors
    @GetMapping("/professors")
    public List<Professor> getAllProfessors() {
        return schedulingService.getAllProfessors();
    }

    @PostMapping("/professors")
    public Professor addProfessor(@RequestBody Professor professor) {
        return schedulingService.addProfessor(professor);
    }

    // Rooms
    @GetMapping("/rooms")
    public List<Room> getAllRooms() {
        return schedulingService.getAllRooms();
    }

    @PostMapping("/rooms")
    public Room addRoom(@RequestBody Room room) {
        return schedulingService.addRoom(room);
    }

    // Time Slots
    @GetMapping("/timeslots")
    public List<TimeSlot> getAllTimeSlots() {
        return schedulingService.getAllTimeSlots();
    }
    
    @PostMapping("/timeslots")
    public TimeSlot addTimeSlot(@RequestBody TimeSlot timeSlot) {
        return schedulingService.addTimeSlot(timeSlot);
    }
}






