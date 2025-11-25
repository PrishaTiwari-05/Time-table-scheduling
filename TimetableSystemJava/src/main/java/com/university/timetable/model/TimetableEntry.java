package com.university.timetable.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TimetableEntry {
    private String id;
    private Course course;
    private Professor professor;
    private Room room;
    private TimeSlot timeSlot;
}






