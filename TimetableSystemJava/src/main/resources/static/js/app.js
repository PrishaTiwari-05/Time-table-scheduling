// API Base URL
const API_URL = 'http://localhost:8082/api';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadCourses();
    loadProfessors();
    loadTimeSlots();
    loadAllSchedule();
    setupAutoComplete();
});

// ==================== COURSE AUTO-COMPLETE (TRIE) ====================
function setupAutoComplete() {
    const courseSearch = document.getElementById('courseSearch');
    const courseSuggestions = document.getElementById('courseSuggestions');
    
    courseSearch.addEventListener('input', async (e) => {
        const prefix = e.target.value.trim();
        
        if (prefix.length < 1) {
            courseSuggestions.innerHTML = '';
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/autocomplete/course?prefix=${prefix}`);
            const suggestions = await response.json();
            
            courseSuggestions.innerHTML = '';
            suggestions.forEach(suggestion => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.textContent = suggestion;
                div.onclick = () => {
                    courseSearch.value = suggestion;
                    courseSuggestions.innerHTML = '';
                };
                courseSuggestions.appendChild(div);
            });
        } catch (error) {
            console.error('Auto-complete error:', error);
        }
    });
    
    // Room search auto-complete
    const roomSearch = document.getElementById('roomSearch');
    const roomSuggestions = document.getElementById('roomSuggestions');
    
    roomSearch.addEventListener('input', async (e) => {
        const prefix = e.target.value.trim();
        
        if (prefix.length < 1) {
            roomSuggestions.innerHTML = '';
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/autocomplete/room?prefix=${prefix}`);
            const suggestions = await response.json();
            
            roomSuggestions.innerHTML = '';
            suggestions.forEach(suggestion => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.textContent = suggestion;
                roomSuggestions.appendChild(div);
            });
        } catch (error) {
            console.error('Room search error:', error);
        }
    });
}

// ==================== LOAD DATA ====================
async function loadCourses() {
    try {
        const response = await fetch(`${API_URL}/courses`);
        const courses = await response.json();
        
        const select = document.getElementById('courseSelect');
        select.innerHTML = '<option value="">Select Course</option>';
        
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = `${course.code} - ${course.name} (${course.enrolledStudents} students)`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading courses:', error);
    }
}

async function loadProfessors() {
    try {
        const response = await fetch(`${API_URL}/professors`);
        const professors = await response.json();
        
        const select = document.getElementById('professorSelect');
        select.innerHTML = '<option value="">Select Professor</option>';
        
        professors.forEach(prof => {
            const option = document.createElement('option');
            option.value = prof.id;
            option.textContent = `${prof.name} - ${prof.department}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading professors:', error);
    }
}

async function loadTimeSlots() {
    try {
        const response = await fetch(`${API_URL}/timeslots`);
        const slots = await response.json();
        
        const select = document.getElementById('timeSlotSelect');
        select.innerHTML = '<option value="">Select Time Slot</option>';
        
        slots.forEach(slot => {
            const option = document.createElement('option');
            option.value = slot.id;
            option.textContent = `${slot.day} ${slot.startTime} - ${slot.endTime}`;
            select.appendChild(option);
        });
        
        // Add event listener to show available rooms when time slot is selected
        select.addEventListener('change', showAvailableRooms);
    } catch (error) {
        console.error('Error loading time slots:', error);
    }
}

// ==================== SHOW AVAILABLE ROOMS (GREEDY PREVIEW) ====================
async function showAvailableRooms() {
    const timeSlotId = document.getElementById('timeSlotSelect').value;
    const availableRoomsDiv = document.getElementById('availableRooms');
    
    if (!timeSlotId) {
        availableRoomsDiv.innerHTML = '';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/rooms/available?timeSlotId=${timeSlotId}`);
        const rooms = await response.json();
        
        if (rooms.length === 0) {
            availableRoomsDiv.innerHTML = '<div class="info-box warning">⚠️ No rooms available for this time slot!</div>';
            return;
        }
        
        let html = '<div class="info-box success">';
        html += `<strong>✅ ${rooms.length} Available Rooms:</strong><br>`;
        rooms.forEach(room => {
            html += `📍 ${room.roomNumber} (${room.building}) - Capacity: ${room.capacity} - Type: ${room.type}<br>`;
        });
        html += '<em>Best room will be auto-selected using Greedy Algorithm</em>';
        html += '</div>';
        
        availableRoomsDiv.innerHTML = html;
    } catch (error) {
        console.error('Error loading available rooms:', error);
    }
}

// ==================== SCHEDULE CLASS (USING ALL 3 ALGORITHMS) ====================
document.getElementById('scheduleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const courseId = document.getElementById('courseSelect').value;
    const professorId = document.getElementById('professorSelect').value;
    const timeSlotId = document.getElementById('timeSlotSelect').value;
    
    const resultDiv = document.getElementById('scheduleResult');
    resultDiv.innerHTML = '<div class="info-box">⏳ Scheduling class...</div>';
    
    try {
        const response = await fetch(`${API_URL}/schedule`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ courseId, professorId, timeSlotId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            const entry = result.entry;
            resultDiv.innerHTML = `
                <div class="info-box success">
                    <h3>✅ Class Scheduled Successfully!</h3>
                    <p><strong>Course:</strong> ${entry.course.code} - ${entry.course.name}</p>
                    <p><strong>Professor:</strong> ${entry.professor.name}</p>
                    <p><strong>Room Allocated (Greedy):</strong> ${entry.room.roomNumber} - ${entry.room.building}</p>
                    <p><strong>Capacity:</strong> ${entry.room.capacity} (${entry.course.enrolledStudents} students)</p>
                    <p><strong>Utilization:</strong> ${result.utilization}</p>
                    <p><strong>Time:</strong> ${entry.timeSlot.day} ${entry.timeSlot.startTime} - ${entry.timeSlot.endTime}</p>
                    <p><em>✓ No conflicts detected (AVL Tree)</em></p>
                </div>
            `;
            
            // Reload schedule
            loadAllSchedule();
            
            // Reset form
            document.getElementById('scheduleForm').reset();
            document.getElementById('availableRooms').innerHTML = '';
        } else {
            let errorMsg = `<div class="info-box error">
                <h3>❌ Scheduling Failed</h3>
                <p><strong>Reason:</strong> ${result.message}</p>`;
            
            if (result.conflicts) {
                errorMsg += '<p><strong>Conflicts:</strong></p><ul>';
                result.conflicts.forEach(conflict => {
                    errorMsg += `<li>${conflict}</li>`;
                });
                errorMsg += '</ul>';
            }
            
            if (result.suggestion) {
                errorMsg += `<p><em>💡 ${result.suggestion}</em></p>`;
            }
            
            errorMsg += '</div>';
            resultDiv.innerHTML = errorMsg;
        }
    } catch (error) {
        console.error('Scheduling error:', error);
        resultDiv.innerHTML = '<div class="info-box error">❌ Error scheduling class</div>';
    }
});

// ==================== LOAD SCHEDULE (AVL TREE SORTED) ====================
async function loadAllSchedule() {
    try {
        const response = await fetch(`${API_URL}/schedule/all`);
        const entries = await response.json();
        
        displaySchedule(entries);
    } catch (error) {
        console.error('Error loading schedule:', error);
    }
}

async function loadScheduleByDay(day) {
    try {
        let url = `${API_URL}/schedule/all`;
        if (day !== 'all') {
            url = `${API_URL}/schedule/day?day=${day}`;
        }
        
        const response = await fetch(url);
        const entries = await response.json();
        
        displaySchedule(entries);
    } catch (error) {
        console.error('Error loading schedule:', error);
    }
}

function displaySchedule(entries) {
    const scheduleList = document.getElementById('scheduleList');
    
    if (entries.length === 0) {
        scheduleList.innerHTML = '<p class="info-box">No classes scheduled yet.</p>';
        return;
    }
    
    let html = '<div class="schedule-table">';
    entries.forEach(entry => {
        html += `
            <div class="schedule-card">
                <div class="schedule-header">
                    <h3>${entry.course.code} - ${entry.course.name}</h3>
                    <span class="day-badge">${entry.timeSlot.day}</span>
                </div>
                <div class="schedule-details">
                    <p>🕒 <strong>Time:</strong> ${entry.timeSlot.startTime} - ${entry.timeSlot.endTime}</p>
                    <p>👨‍🏫 <strong>Professor:</strong> ${entry.professor.name}</p>
                    <p>🏛️ <strong>Room:</strong> ${entry.room.roomNumber} (${entry.room.building})</p>
                    <p>👥 <strong>Students:</strong> ${entry.course.enrolledStudents} / ${entry.room.capacity}</p>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    scheduleList.innerHTML = html;
}
