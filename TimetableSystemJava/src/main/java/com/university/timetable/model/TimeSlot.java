package com.university.timetable.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TimeSlot {
    private String id;
    private String day; // Monday, Tuesday, etc.
    private String startTime;
    private String endTime;
}






