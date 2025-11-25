package com.university.timetable;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TimetableApplication {

    public static void main(String[] args) {
        SpringApplication.run(TimetableApplication.class, args);
        System.out.println("\n✅ University Timetable System is running!");
        System.out.println("🌐 Open your browser and go to: http://localhost:8082\n");
    }
}

