package com.university.timetable.service;

import com.university.timetable.model.*;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class TimetableService {
    
    private List<Course> courses = new ArrayList<>();
    private List<Professor> professors = new ArrayList<>();
    private List<Room> rooms = new ArrayList<>();
    private List<TimeSlot> timeSlots = new ArrayList<>();
    private List<TimetableEntry> timetableEntries = new ArrayList<>();

    public TimetableService() {
        initializeSampleData();
    }

    private void initializeSampleData() {
        // Initialize Professors
        professors.add(new Professor("P1", "Dr. John Smith", "Computer Science", "john.smith@university.edu"));
        professors.add(new Professor("P2", "Dr. Sarah Johnson", "Mathematics", "sarah.johnson@university.edu"));
        professors.add(new Professor("P3", "Dr. Michael Brown", "Computer Science", "michael.brown@university.edu"));
        professors.add(new Professor("P4", "Dr. Emily Davis", "Physics", "emily.davis@university.edu"));

        // Initialize Rooms
        rooms.add(new Room("R1", "101", "Engineering Block", 60, "Lecture Hall"));
        rooms.add(new Room("R2", "202", "Science Building", 40, "Lab"));
        rooms.add(new Room("R3", "303", "Engineering Block", 50, "Lecture Hall"));
        rooms.add(new Room("R4", "104", "Science Building", 30, "Seminar Room"));

        // Initialize Courses
        courses.add(new Course("C1", "CS501", "Advanced Algorithms", 4, "Computer Science", 45));
        courses.add(new Course("C2", "CS502", "Database Systems", 3, "Computer Science", 40));
        courses.add(new Course("C3", "MATH301", "Linear Algebra", 3, "Mathematics", 50));
        courses.add(new Course("C4", "PHY401", "Quantum Mechanics", 4, "Physics", 35));

        // Initialize Time Slots
        timeSlots.add(new TimeSlot("T1", "Monday", "09:00", "10:30"));
        timeSlots.add(new TimeSlot("T2", "Monday", "11:00", "12:30"));
        timeSlots.add(new TimeSlot("T3", "Tuesday", "09:00", "10:30"));
        timeSlots.add(new TimeSlot("T4", "Tuesday", "14:00", "15:30"));
        timeSlots.add(new TimeSlot("T5", "Wednesday", "09:00", "10:30"));
        timeSlots.add(new TimeSlot("T6", "Thursday", "11:00", "12:30"));
        timeSlots.add(new TimeSlot("T7", "Friday", "09:00", "10:30"));

        // Initialize Timetable Entries
        timetableEntries.add(new TimetableEntry("TE1", courses.get(0), professors.get(0), rooms.get(0), timeSlots.get(0)));
        timetableEntries.add(new TimetableEntry("TE2", courses.get(1), professors.get(2), rooms.get(2), timeSlots.get(1)));
        timetableEntries.add(new TimetableEntry("TE3", courses.get(2), professors.get(1), rooms.get(0), timeSlots.get(2)));
        timetableEntries.add(new TimetableEntry("TE4", courses.get(3), professors.get(3), rooms.get(1), timeSlots.get(3)));
        timetableEntries.add(new TimetableEntry("TE5", courses.get(0), professors.get(0), rooms.get(2), timeSlots.get(4)));
    }

    // Get all methods
    public List<Course> getAllCourses() {
        return new ArrayList<>(courses);
    }

    public List<Professor> getAllProfessors() {
        return new ArrayList<>(professors);
    }

    public List<Room> getAllRooms() {
        return new ArrayList<>(rooms);
    }

    public List<TimeSlot> getAllTimeSlots() {
        return new ArrayList<>(timeSlots);
    }

    public List<TimetableEntry> getAllTimetableEntries() {
        return new ArrayList<>(timetableEntries);
    }

    // Add methods
    public TimetableEntry addTimetableEntry(TimetableEntry entry) {
        entry.setId("TE" + (timetableEntries.size() + 1));
        timetableEntries.add(entry);
        return entry;
    }

    public Course addCourse(Course course) {
        course.setId("C" + (courses.size() + 1));
        courses.add(course);
        return course;
    }

    public Professor addProfessor(Professor professor) {
        professor.setId("P" + (professors.size() + 1));
        professors.add(professor);
        return professor;
    }

    public Room addRoom(Room room) {
        room.setId("R" + (rooms.size() + 1));
        rooms.add(room);
        return room;
    }

    // Delete methods
    public boolean deleteTimetableEntry(String id) {
        return timetableEntries.removeIf(entry -> entry.getId().equals(id));
    }

    // Check for conflicts
    public boolean hasConflict(TimetableEntry newEntry) {
        for (TimetableEntry existing : timetableEntries) {
            if (existing.getTimeSlot().getId().equals(newEntry.getTimeSlot().getId())) {
                // Check if same room
                if (existing.getRoom().getId().equals(newEntry.getRoom().getId())) {
                    return true;
                }
                // Check if same professor
                if (existing.getProfessor().getId().equals(newEntry.getProfessor().getId())) {
                    return true;
                }
            }
        }
        return false;
    }
}






