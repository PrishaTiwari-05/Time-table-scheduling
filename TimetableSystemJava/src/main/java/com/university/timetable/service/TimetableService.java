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
        professors.add(new Professor("P1", "Prof. Nimesh Bumb", "Computer Science", "nimesh.bumb@university.edu"));
        professors.add(new Professor("P2", "Prof. Sridhar Pappu", "Computer Vision", "sridhar.pappu@university.edu"));
        professors.add(new Professor("P3", "Dr. Patil", "Emerging Technologies", "patil@university.edu"));
        professors.add(new Professor("P4", "Prof. Pramod Bhide", "Emerging Technologies Lab", "pramod.bhide@university.edu"));
        professors.add(new Professor("P5", "Prof. Naresh Kaushik", "Mathematics", "naresh.kaushik@university.edu"));
        professors.add(new Professor("P6", "Dr. Sarah Johnson", "Cloud Computing", "sarah.johnson@university.edu"));
        professors.add(new Professor("P7", "Dr. Emily Davis", "NLP", "emily.davis@university.edu"));

        // Initialize Rooms - Building 1 has 7 floors, 10 rooms each
        final String building = "Building 1";
        int roomIdCounter = 1;
        for (int floor = 1; floor <= 7; floor++) {
            for (int roomNumber = 1; roomNumber <= 10; roomNumber++) {
                String formattedNumber = floor + String.format("%02d", roomNumber);
                int capacity = 35 + (floor * 3) + ((roomNumber % 4) * 5);
                String type = (roomNumber % 3 == 0) ? "Seminar Room" : "Lecture Hall";
                rooms.add(new Room("R" + roomIdCounter++, formattedNumber, building, capacity, type));
            }
        }
        // Dedicated labs on first floor
        rooms.add(new Room("R" + roomIdCounter++, "101A", building, 32, "Lab"));
        rooms.add(new Room("R" + roomIdCounter++, "101B", building, 32, "Lab"));

        // Initialize Courses (B.Tech Year 3)
        courses.add(new Course("C1", "CS701", "Advanced Algorithms", 4, "Computer Science", 48));
        courses.add(new Course("C2", "CS702", "Emerging Technologies (Theory)", 3, "Computer Science", 46));
        courses.add(new Course("C3", "CS702L", "Emerging Technologies Lab", 1, "Computer Science", 24));
        courses.add(new Course("C4", "CS703", "Numeric Optimization Techniques", 3, "Computer Science", 52));
        courses.add(new Course("C5", "CS704", "Cloud Application Development", 3, "Computer Science", 50));
        courses.add(new Course("C6", "CS705", "Natural Language Processing", 3, "Computer Science", 45));
        courses.add(new Course("C7", "CS706", "Computer Vision", 3, "Computer Science", 44));

        // Initialize Time Slots
        timeSlots.add(new TimeSlot("T1", "Monday", "09:00", "10:30"));
        timeSlots.add(new TimeSlot("T2", "Monday", "11:00", "12:30"));
        timeSlots.add(new TimeSlot("T3", "Tuesday", "09:00", "10:30"));
        timeSlots.add(new TimeSlot("T4", "Tuesday", "14:00", "15:30"));
        timeSlots.add(new TimeSlot("T5", "Wednesday", "09:00", "10:30"));
        timeSlots.add(new TimeSlot("T6", "Thursday", "11:00", "12:30"));
        timeSlots.add(new TimeSlot("T7", "Friday", "09:00", "10:30"));

        // Initialize Timetable Entries (sample schedule)
        timetableEntries.add(new TimetableEntry("TE1", courses.get(0), professors.get(0), rooms.get(0), timeSlots.get(0))); // Advanced Algo
        timetableEntries.add(new TimetableEntry("TE2", courses.get(6), professors.get(1), rooms.get(5), timeSlots.get(1))); // Computer Vision
        timetableEntries.add(new TimetableEntry("TE3", courses.get(1), professors.get(2), rooms.get(10), timeSlots.get(2))); // Emerging Tech Theory
        timetableEntries.add(new TimetableEntry("TE4", courses.get(2), professors.get(3), rooms.get(11), timeSlots.get(3))); // Emerging Tech Lab
        timetableEntries.add(new TimetableEntry("TE5", courses.get(3), professors.get(4), rooms.get(2), timeSlots.get(4))); // Numeric Optimization
        timetableEntries.add(new TimetableEntry("TE6", courses.get(4), professors.get(5), rooms.get(15), timeSlots.get(5))); // Cloud App Dev
        timetableEntries.add(new TimetableEntry("TE7", courses.get(5), professors.get(6), rooms.get(20), timeSlots.get(6))); // NLP
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






