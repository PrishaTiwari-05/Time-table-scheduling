package com.university.timetable.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Course {
    private String id;
    private String code;
    private String name;
    private int credits;
    private String department;
    private int enrolledStudents;
}






