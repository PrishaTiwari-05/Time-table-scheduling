package com.university.timetable.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Room {
    private String id;
    private String roomNumber;
    private String building;
    private int capacity;
    private String type; // Lecture Hall, Lab, Seminar Room
}






