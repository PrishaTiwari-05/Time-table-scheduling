// API Base URL
const API_URL = 'http://localhost:8082/api';

// Global state
let allCourses = [];
let allProfessors = [];
let allRooms = [];
let allTimeSlots = [];
let allSchedule = [];
let currentDay = 'Monday';

// Algorithm performance tracking
let algoStats = {
    avl: { operations: 0, conflicts: 0 },
    trie: { searches: 0, totalTime: 0, lastTime: 0 },
    greedy: { allocations: 0, totalEfficiency: 0 }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
    setupEventListeners();

    // Simple "login" entry – no credentials, just a welcome screen
    const enterBtn = document.getElementById('enterDashboardBtn');
    const welcome = document.getElementById('welcome-screen');
    if (enterBtn && welcome) {
        enterBtn.addEventListener('click', () => {
            welcome.style.opacity = '0';
            welcome.style.transition = 'opacity 0.25s ease';
            setTimeout(() => {
                welcome.style.display = 'none';
            }, 250);
        });
    }
});

// ==================== LOAD ALL DATA ====================
async function loadAllData() {
    try {
        [allCourses, allProfessors, allRooms, allTimeSlots, allSchedule] = await Promise.all([
            fetch(`${API_URL}/courses`).then(r => r.json()),
            fetch(`${API_URL}/professors`).then(r => r.json()),
            fetch(`${API_URL}/rooms`).then(r => r.json()),
            fetch(`${API_URL}/timeslots`).then(r => r.json()),
            fetch(`${API_URL}/schedule/all`).then(r => r.json())
        ]);
        
        renderSchedule(currentDay);
        renderRooms();
        renderAllCourses();
        renderAllRooms();
        updateUtilization();
        updateAlgorithmStats();
        setupGlobalSearch();
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error loading data. Please refresh.', 'error');
    }
}

// ==================== RENDER SCHEDULE ====================
function renderSchedule(day = 'Monday') {
    const scheduleRoot = document.getElementById('schedule');
    currentDay = day;
    
    let filtered = allSchedule;
    if (day !== 'all') {
        filtered = allSchedule.filter(entry => entry.timeSlot.day === day);
    }
    
    scheduleRoot.innerHTML = '';
    
    if (filtered.length === 0) {
        scheduleRoot.innerHTML = '<div class="small">No classes scheduled for this day.</div>';
        return;
    }
    
    filtered.forEach(entry => {
        const el = document.createElement('div');
        el.className = 'entry';
        el.tabIndex = 0;
        
        const timeStr = `${entry.timeSlot.startTime} - ${entry.timeSlot.endTime}`;
        const profName = entry.professor.name;
        const roomNum = entry.room.roomNumber;
        
        el.innerHTML = `
            <div class="meta">
                <div class="badge time">${timeStr}</div>
                <div>
                    <div style="font-weight:700;margin-bottom:4px;color:var(--text-dark);font-size:15px">${entry.course.code} - ${entry.course.name}</div>
                    <div class="small" style="color:var(--muted)">${profName} • Room ${roomNum}</div>
                </div>
            </div>
            <div>
                <button class='ghost' onclick="viewEntry('${entry.id}')">View</button>
            </div>
        `;
        
        scheduleRoot.appendChild(el);
    });
}

// ==================== DAY FILTER HANDLERS ====================
function setupEventListeners() {
    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = btn.dataset.section;
            switchSection(section);
            
            // Update active state
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Day filter chips
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            document.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
            chip.classList.add('active');
            renderSchedule(chip.dataset.day);
        });
    });
    
    // New schedule button
    document.getElementById('new-schedule').addEventListener('click', openModal);
    
    // Room filter (dashboard)
    document.getElementById('roomFilter').addEventListener('input', (e) => {
        renderRooms(e.target.value);
    });
    
    // Rooms section filter
    const roomsFilter = document.getElementById('roomsFilter');
    if (roomsFilter) {
        roomsFilter.addEventListener('input', (e) => {
            renderAllRooms(e.target.value);
        });
    }
    
    // Course filter
    const courseFilter = document.getElementById('courseFilter');
    if (courseFilter) {
        courseFilter.addEventListener('input', (e) => {
            renderAllCourses(e.target.value);
        });
    }
    
    // Export CSV
    document.getElementById('exportCSV').addEventListener('click', exportRoomsCSV);
    const exportRoomsCSVBtn = document.getElementById('exportRoomsCSV');
    if (exportRoomsCSVBtn) {
        exportRoomsCSVBtn.addEventListener('click', exportRoomsCSV);
    }
    
    // Trie search
    const trieCourseSearch = document.getElementById('trieCourseSearch');
    if (trieCourseSearch) {
        trieCourseSearch.addEventListener('input', handleTrieCourseSearch);
    }
    
    const trieRoomSearch = document.getElementById('trieRoomSearch');
    if (trieRoomSearch) {
        trieRoomSearch.addEventListener('input', handleTrieRoomSearch);
    }
    
    // Compact toggle
    document.getElementById('compactToggle').addEventListener('click', () => {
        document.body.classList.toggle('compact');
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// ==================== SECTION SWITCHING ====================
function switchSection(section) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.style.display = 'none';
    });
    
    // Show selected section
    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
        targetSection.style.display = 'block';
        
        // Load data for specific sections
        if (section === 'courses') {
            renderAllCourses();
        } else if (section === 'rooms') {
            renderAllRooms();
        } else if (section === 'algorithm') {
            // Show overview of all algorithms
            renderAlgorithmOverview();
        }
    }
}

// ==================== RENDER ROOMS ====================
function renderRooms(filter = '') {
    const roomsRoot = document.getElementById('rooms');
    roomsRoot.innerHTML = '';
    
    const filtered = allRooms.filter(r => 
        r.roomNumber.includes(filter) || 
        r.name.toLowerCase().includes(filter.toLowerCase()) ||
        r.type.toLowerCase().includes(filter.toLowerCase())
    ).slice(0, 12);
    
    if (filtered.length === 0) {
        roomsRoot.innerHTML = '<div class="small">No rooms found.</div>';
        return;
    }
    
    filtered.forEach(room => {
        const el = document.createElement('div');
        el.className = 'room';
        el.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <div class='title'>${room.roomNumber}</div>
                <div class='type'>${room.type}</div>
            </div>
            <div class='cap'>Capacity: ${room.capacity} • ${room.building}</div>
        `;
        roomsRoot.appendChild(el);
    });
}

// ==================== MODAL FOR SCHEDULING ====================
function openModal() {
    const modalRoot = document.getElementById('modalRoot');
    
    modalRoot.innerHTML = `
        <div class='modal-backdrop' role='dialog' aria-modal='true' onclick="if(event.target===this) closeModal()">
            <div class='modal' onclick="event.stopPropagation()">
                <h3>Schedule a Class</h3>
                <div class='form-row'>
                    <div style='flex:1'>
                        <label>Course</label>
                        <select id='mCourse'>
                            <option value="">Select Course</option>
                            ${allCourses.map(c => `<option value="${c.id}">${c.code} - ${c.name} (${c.enrolledStudents} students)</option>`).join('')}
                        </select>
                    </div>
                    <div style='flex:1'>
                        <label>Professor</label>
                        <select id='mProf'>
                            <option value="">Select Professor</option>
                            ${allProfessors.map(p => `<option value="${p.id}">${p.name} - ${p.department}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class='form-row'>
                    <div style='flex:1'>
                        <label>Time Slot</label>
                        <select id='mTime'>
                            <option value="">Select Time Slot</option>
                            ${allTimeSlots.map(t => `<option value="${t.id}">${t.day} ${t.startTime} - ${t.endTime}</option>`).join('')}
                        </select>
                    </div>
                    <div style='flex:1'>
                        <label>Suggested Room (Auto-allocated)</label>
                        <input id='mRoom' readonly placeholder="Select course and time slot first" />
                    </div>
                </div>
                <div id="conflictWarning" style="display:none"></div>
                <div style='display:flex;justify-content:flex-end;gap:10px;margin-top:18px'>
                    <button class='ghost' id='cancel'>Cancel</button>
                    <button class='btn' id='save'>Schedule Class</button>
                </div>
                <div class='hints' style='margin-top:10px'>
                    System suggests the smallest available room using Greedy Algorithm. Conflicts will be flagged by AVL Tree.
                </div>
            </div>
        </div>
    `;
    
    modalRoot.setAttribute('aria-hidden', 'false');
    
    // Hook events
    document.getElementById('cancel').addEventListener('click', closeModal);
    document.getElementById('save').addEventListener('click', saveSchedule);
    document.getElementById('mCourse').addEventListener('change', suggestRoom);
    document.getElementById('mTime').addEventListener('change', suggestRoom);
    document.getElementById('mProf').addEventListener('change', suggestRoom);
}

function closeModal() {
    const modalRoot = document.getElementById('modalRoot');
    modalRoot.innerHTML = '';
    modalRoot.setAttribute('aria-hidden', 'true');
}

// Removed handleCourseSearch - now using dropdowns

// ==================== SUGGEST ROOM (GREEDY) ====================
async function suggestRoom() {
    const courseId = document.getElementById('mCourse').value;
    const timeSlotId = document.getElementById('mTime').value;
    const roomInput = document.getElementById('mRoom');
    const conflictDiv = document.getElementById('conflictWarning');
    
    if (!timeSlotId) {
        roomInput.value = 'Select time slot first';
        conflictDiv.style.display = 'none';
        return;
    }
    
    if (!courseId) {
        roomInput.value = 'Select course first';
        conflictDiv.style.display = 'none';
        return;
    }
    
    // Find course by ID
    const course = allCourses.find(c => c.id === courseId);
    
    if (!course) {
        roomInput.value = 'Course not found';
        conflictDiv.style.display = 'none';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/rooms/available?timeSlotId=${timeSlotId}`);
        const availableRooms = await response.json();
        
        const suitable = availableRooms.filter(r => r.capacity >= course.enrolledStudents)
            .sort((a, b) => a.capacity - b.capacity);
        
        if (suitable.length > 0) {
            roomInput.value = `${suitable[0].roomNumber} (Capacity: ${suitable[0].capacity})`;
            conflictDiv.style.display = 'none';
        } else {
            roomInput.value = 'No suitable room available';
            conflictDiv.innerHTML = '<div class="conflict-warning">⚠️ No room with sufficient capacity available for this time slot.</div>';
            conflictDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching available rooms:', error);
        roomInput.value = 'Error fetching rooms';
    }
}

// ==================== SAVE SCHEDULE ====================
async function saveSchedule() {
    const courseId = document.getElementById('mCourse').value;
    const professorId = document.getElementById('mProf').value;
    const timeSlotId = document.getElementById('mTime').value;
    
    if (!courseId || !professorId || !timeSlotId) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/schedule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                courseId: courseId, 
                professorId: professorId, 
                timeSlotId: timeSlotId 
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Track algorithm usage
            algoStats.avl.operations++;
            algoStats.greedy.allocations++;
            if (result.conflicts && result.conflicts.length > 0) {
                algoStats.avl.conflicts += result.conflicts.length;
            }
            if (result.utilization) {
                algoStats.greedy.totalEfficiency += parseFloat(result.utilization.replace('%', ''));
            }
            updateAlgorithmStats();
            
            logAlgorithmExecution('avl', `AVL Tree: Inserted schedule entry, checked for conflicts`);
            logAlgorithmExecution('greedy', `Greedy Algorithm: Allocated room ${result.entry.room.roomNumber} (${result.utilization} utilization)`);
            
            showToast('Class scheduled successfully!', 'success');
            closeModal();
            await loadAllData(); // Reload all data
        } else {
            algoStats.avl.operations++;
            if (result.conflicts && result.conflicts.length > 0) {
                algoStats.avl.conflicts += result.conflicts.length;
                logAlgorithmExecution('avl', `AVL Tree: Conflict detected - ${result.conflicts.join(', ')}`, 'error');
            }
            updateAlgorithmStats();
            
            let errorMsg = result.message || 'Scheduling failed';
            if (result.conflicts && result.conflicts.length > 0) {
                errorMsg += ': ' + result.conflicts.join(', ');
            }
            showToast(errorMsg, 'error');
        }
    } catch (error) {
        console.error('Scheduling error:', error);
        showToast('Error scheduling class. Please try again.', 'error');
    }
}

// ==================== GLOBAL SEARCH ====================
function setupGlobalSearch() {
    const gs = document.getElementById('globalSearch');
    
    gs.addEventListener('input', (e) => {
        const v = e.target.value.trim().toUpperCase();
        if (!v) return;
        
        const courseMatches = allCourses.filter(x => 
            x.code.startsWith(v) || 
            x.name.toUpperCase().includes(v)
        ).slice(0, 3);
        
        const roomMatches = allRooms.filter(x => 
            x.roomNumber.startsWith(v) || 
            x.name.toUpperCase().includes(v)
        ).slice(0, 3);
        
        const profMatches = allProfessors.filter(x => 
            x.name.toUpperCase().includes(v)
        ).slice(0, 3);
        
        // Show first match in placeholder as hint
        if (courseMatches.length) {
            gs.placeholder = `${courseMatches[0].code} — ${courseMatches[0].name}`;
        } else if (roomMatches.length) {
            gs.placeholder = `${roomMatches[0].roomNumber} — ${roomMatches[0].name}`;
        } else if (profMatches.length) {
            gs.placeholder = profMatches[0].name;
        } else {
            gs.placeholder = 'No matches found';
        }
        
        setTimeout(() => {
            gs.placeholder = 'Search courses, rooms, professors... (try: CS or 101)';
        }, 2000);
    });
}

// ==================== RENDER ALL COURSES ====================
function renderAllCourses(filter = '') {
    const coursesList = document.getElementById('coursesList');
    if (!coursesList) return;
    
    coursesList.innerHTML = '';
    
    const filtered = allCourses.filter(c => 
        c.code.toLowerCase().includes(filter.toLowerCase()) ||
        c.name.toLowerCase().includes(filter.toLowerCase()) ||
        (c.department && c.department.toLowerCase().includes(filter.toLowerCase()))
    );
    
    if (filtered.length === 0) {
        coursesList.innerHTML = '<div class="small">No courses found.</div>';
        return;
    }
    
    filtered.forEach(course => {
        const el = document.createElement('div');
        el.className = 'course-card';
        el.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
                <div>
                    <div style="font-weight:700;font-size:16px;color:var(--text-dark);margin-bottom:4px">${course.code}</div>
                    <div style="font-weight:600;color:var(--text-dark);margin-bottom:4px">${course.name}</div>
                    <div class="small">${course.department || 'N/A'}</div>
                </div>
            </div>
            <div style="display:flex;gap:12px;margin-top:12px">
                <div class="small"><strong>Credits:</strong> ${course.credits || 'N/A'}</div>
                <div class="small"><strong>Students:</strong> ${course.enrolledStudents || 0}</div>
            </div>
        `;
        coursesList.appendChild(el);
    });
}

// ==================== RENDER ALL ROOMS ====================
function renderAllRooms(filter = '') {
    const roomsList = document.getElementById('roomsList');
    if (!roomsList) return;
    
    roomsList.innerHTML = '';
    
    const filtered = allRooms.filter(r => 
        r.roomNumber.includes(filter) || 
        r.name.toLowerCase().includes(filter.toLowerCase()) ||
        r.type.toLowerCase().includes(filter.toLowerCase()) ||
        r.building.toLowerCase().includes(filter.toLowerCase())
    );
    
    if (filtered.length === 0) {
        roomsList.innerHTML = '<div class="small">No rooms found.</div>';
        return;
    }
    
    filtered.forEach(room => {
        const el = document.createElement('div');
        el.className = 'room-card';
        el.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
                <div>
                    <div style="font-weight:700;font-size:16px;color:var(--text-dark);margin-bottom:4px">${room.roomNumber}</div>
                    <div class="small" style="margin-bottom:4px">${room.name}</div>
                    <div class="small">${room.building}</div>
                </div>
                <div class="type">${room.type}</div>
            </div>
            <div style="margin-top:12px">
                <div class="small"><strong>Capacity:</strong> ${room.capacity} students</div>
            </div>
        `;
        roomsList.appendChild(el);
    });
}

// ==================== TRIE SEARCH HANDLERS ====================
async function handleTrieCourseSearch(e) {
    const prefix = e.target.value.trim();
    const resultsDiv = document.getElementById('trieCourseResults');
    
    if (prefix.length < 1) {
        resultsDiv.classList.remove('show');
        resultsDiv.innerHTML = '';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/autocomplete/course?prefix=${prefix}`);
        const suggestions = await response.json();
        
        resultsDiv.innerHTML = '';
        if (suggestions.length > 0) {
            resultsDiv.classList.add('show');
            suggestions.forEach(suggestion => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.textContent = suggestion;
                item.onclick = () => {
                    e.target.value = suggestion;
                    resultsDiv.classList.remove('show');
                };
                resultsDiv.appendChild(item);
            });
        } else {
            resultsDiv.classList.remove('show');
        }
    } catch (error) {
        console.error('Trie course search error:', error);
    }
}

async function handleTrieRoomSearch(e) {
    const prefix = e.target.value.trim();
    const resultsDiv = document.getElementById('trieRoomResults');
    
    if (prefix.length < 1) {
        resultsDiv.classList.remove('show');
        resultsDiv.innerHTML = '';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/autocomplete/room?prefix=${prefix}`);
        const suggestions = await response.json();
        
        resultsDiv.innerHTML = '';
        if (suggestions.length > 0) {
            resultsDiv.classList.add('show');
            suggestions.forEach(suggestion => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.textContent = suggestion;
                item.onclick = () => {
                    e.target.value = suggestion;
                    resultsDiv.classList.remove('show');
                };
                resultsDiv.appendChild(item);
            });
        } else {
            resultsDiv.classList.remove('show');
        }
    } catch (error) {
        console.error('Trie room search error:', error);
    }
}

// ==================== UTILITY FUNCTIONS ====================
function viewEntry(id) {
    const entry = allSchedule.find(e => e.id === id);
    if (!entry) return;
    
    const modalRoot = document.getElementById('modalRoot');
    const capacityWarning = entry.course.enrolledStudents > entry.room.capacity;
    
    modalRoot.innerHTML = `
        <div class='modal-backdrop' role='dialog' aria-modal='true' onclick="if(event.target===this) closeDetailModal()">
            <div class='modal' onclick="event.stopPropagation()">
                <h3>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    Schedule Details
                </h3>
                
                <div class="detail-section">
                    <div class="detail-section-title">Course Information</div>
                    <div class="detail-item">
                        <span class="detail-label">Course Code</span>
                        <span class="detail-value">${entry.course.code}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Course Name</span>
                        <span class="detail-value">${entry.course.name}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Department</span>
                        <span class="detail-value">${entry.course.department || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Credits</span>
                        <span class="detail-value">${entry.course.credits || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Enrolled Students</span>
                        <span class="detail-value">${entry.course.enrolledStudents}</span>
                    </div>
                </div>
                
                <div class="detail-section">
                    <div class="detail-section-title">Professor Information</div>
                    <div class="detail-item">
                        <span class="detail-label">Professor Name</span>
                        <span class="detail-value">${entry.professor.name}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Department</span>
                        <span class="detail-value">${entry.professor.department || 'N/A'}</span>
                    </div>
                </div>
                
                <div class="detail-section">
                    <div class="detail-section-title">Room Information</div>
                    <div class="detail-item">
                        <span class="detail-label">Room Number</span>
                        <span class="detail-value">${entry.room.roomNumber}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Building</span>
                        <span class="detail-value">${entry.room.building}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Room Type</span>
                        <span class="detail-value">${entry.room.type}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Capacity</span>
                        <span class="detail-value">${entry.room.capacity} students</span>
                    </div>
                </div>
                
                <div class="detail-section">
                    <div class="detail-section-title">Schedule Information</div>
                    <div class="detail-item">
                        <span class="detail-label">Day</span>
                        <span class="detail-value">${entry.timeSlot.day}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Time</span>
                        <span class="detail-value">${entry.timeSlot.startTime} - ${entry.timeSlot.endTime}</span>
                    </div>
                </div>
                
                ${capacityWarning ? `
                <div class="conflict-warning" style="margin-top:20px">
                    <strong>⚠️ Capacity Warning:</strong> This course has ${entry.course.enrolledStudents} enrolled students, but the room capacity is only ${entry.room.capacity}. Consider assigning a larger room.
                </div>
                ` : ''}
                
                <div style='display:flex;justify-content:flex-end;gap:10px;margin-top:24px'>
                    <button class='ghost' id='closeDetail'>Close</button>
                    <button class='btn' id='editSchedule'>Edit Schedule</button>
                </div>
            </div>
        </div>
    `;
    
    modalRoot.setAttribute('aria-hidden', 'false');
    
    // Hook events
    document.getElementById('closeDetail').addEventListener('click', closeDetailModal);
    document.getElementById('editSchedule').addEventListener('click', () => {
        closeDetailModal();
        // Could open edit modal here in the future
        showToast('Edit functionality coming soon', 'success');
    });
}

function closeDetailModal() {
    const modalRoot = document.getElementById('modalRoot');
    modalRoot.innerHTML = '';
    modalRoot.setAttribute('aria-hidden', 'true');
}

function updateUtilization() {
    const totalRooms = allRooms.length;
    const usedRooms = new Set(allSchedule.map(e => e.room.id)).size;
    const utilization = totalRooms > 0 ? Math.round((usedRooms / totalRooms) * 100) : 0;
    document.getElementById('util').textContent = `${utilization}%`;
}

function exportRoomsCSV() {
    const csv = [
        'Room ID,Name,Type,Capacity,Building',
        ...allRooms.map(r => `${r.roomNumber},${r.name},${r.type},${r.capacity},${r.building}`)
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rooms.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Rooms exported to CSV', 'success');
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function handleKeyboardShortcuts(e) {
    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        alert('Keyboard Shortcuts:\n\n' +
              'N — New Schedule\n' +
              '? — Show shortcuts\n' +
              'C — Toggle Compact view\n' +
              'ESC — Close modal');
    }
    if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey) {
        if (document.getElementById('modalRoot').getAttribute('aria-hidden') === 'true') {
            openModal();
        }
    }
    if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) {
        document.body.classList.toggle('compact');
    }
    if (e.key === 'Escape') {
        closeModal();
        closeDetailModal();
    }
}

// ==================== ALGORITHM DETAILS & PERFORMANCE ====================
function updateAlgorithmStats() {
    if (document.getElementById('avl-ops')) {
        document.getElementById('avl-ops').textContent = algoStats.avl.operations;
        document.getElementById('avl-conflicts').textContent = algoStats.avl.conflicts;
    }
    
    if (document.getElementById('trie-searches')) {
        document.getElementById('trie-searches').textContent = algoStats.trie.searches;
        const avgTime = algoStats.trie.searches > 0 
            ? Math.round(algoStats.trie.totalTime / algoStats.trie.searches) 
            : 0;
        document.getElementById('trie-avg').textContent = `${avgTime}ms`;
    }
    
    if (document.getElementById('greedy-allocs')) {
        document.getElementById('greedy-allocs').textContent = algoStats.greedy.allocations;
        const avgEff = algoStats.greedy.allocations > 0
            ? Math.round(algoStats.greedy.totalEfficiency / algoStats.greedy.allocations)
            : 0;
        document.getElementById('greedy-eff').textContent = `${avgEff}%`;
    }
}

function showAlgoDetails(algo) {
    switchSection('algorithm');
    renderAlgorithmDetails(algo);
    
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const algoBtn = document.querySelector(`[data-section="algorithm"]`);
    if (algoBtn) algoBtn.classList.add('active');
}

function renderAlgorithmDetails(algo) {
    const content = document.getElementById('algorithm-details-content');
    if (!content) return;
    
    const algorithms = {
        avl: {
            title: 'AVL Tree - Self-Balancing Binary Search Tree',
            description: 'An AVL tree is a self-balancing binary search tree that maintains O(log n) time complexity for all operations. In this system, it\'s used to store and manage timetable entries sorted by time, enabling fast conflict detection.',
            complexity: [
                { operation: 'Insert', time: 'O(log n)', space: 'O(1)', description: 'Insert new schedule entry with automatic balancing' },
                { operation: 'Search', time: 'O(log n)', space: 'O(1)', description: 'Find entries by time slot for conflict checking' },
                { operation: 'Delete', time: 'O(log n)', space: 'O(1)', description: 'Remove schedule entry with rebalancing' },
                { operation: 'Conflict Check', time: 'O(log n)', space: 'O(1)', description: 'Check for time/professor/room conflicts' }
            ],
            implementation: `// AVL Tree maintains sorted schedule by time
Node insert(Node node, TimetableEntry entry) {
    // 1. Standard BST insert
    // 2. Update height
    // 3. Get balance factor
    // 4. Rotate if unbalanced (LL, RR, LR, RL)
    // 5. Check for conflicts during traversal
    return balancedNode;
}`,
            features: [
                'Automatic height balancing (balance factor ≤ 1)',
                'O(log n) guaranteed for all operations',
                'In-order traversal provides sorted schedule',
                'Conflict detection during insertion',
                'Efficient range queries for time slots'
            ]
        },
        trie: {
            title: 'Trie (Prefix Tree) - Fast Auto-Complete',
            description: 'A Trie is a tree-like data structure that stores strings for efficient prefix matching. Used here for instant auto-completion of course codes and room numbers as users type.',
            complexity: [
                { operation: 'Insert', time: 'O(m)', space: 'O(m)', description: 'Insert course/room code where m = length' },
                { operation: 'Search', time: 'O(m)', space: 'O(1)', description: 'Find exact match' },
                { operation: 'Prefix Search', time: 'O(m + k)', space: 'O(k)', description: 'Find all words with prefix, k = results' }
            ],
            implementation: `// Trie enables instant prefix matching
List<String> searchByPrefix(String prefix) {
    TrieNode current = root;
    // Traverse prefix: O(m)
    for (char c : prefix) {
        current = current.children.get(c);
        if (current == null) return empty;
    }
    // Collect all words: O(k)
    return collectAllWords(current);
}`,
            features: [
                'O(m) search time independent of dataset size',
                'Instant suggestions as user types',
                'Case-insensitive matching',
                'Efficient memory usage with shared prefixes',
                'Supports partial matching'
            ]
        },
        greedy: {
            title: 'Greedy Algorithm - Optimal Room Allocation',
            description: 'A greedy algorithm makes locally optimal choices at each step. Here, it selects the smallest available room that meets capacity requirements, minimizing space wastage while ensuring all students fit.',
            complexity: [
                { operation: 'Sort Rooms', time: 'O(n log n)', space: 'O(1)', description: 'Sort by capacity (ascending)' },
                { operation: 'Find Available', time: 'O(n)', space: 'O(1)', description: 'Check availability for each room' },
                { operation: 'Allocate', time: 'O(n log n)', space: 'O(1)', description: 'Total complexity for allocation' }
            ],
            implementation: `// Greedy: Always choose smallest suitable room
Room allocateRoom(int requiredCapacity, TimeSlot slot) {
    // 1. Sort rooms by capacity: O(n log n)
    rooms.sort((a, b) -> a.capacity - b.capacity);
    
    // 2. Greedy choice: First suitable room
    for (Room room : rooms) {
        if (room.capacity >= requiredCapacity && 
            isAvailable(room, slot)) {
            return room; // Optimal local choice
        }
    }
    return null;
}`,
            features: [
                'Minimizes wasted space (smallest suitable room)',
                'Ensures all students fit comfortably',
                'Fast allocation with O(n log n) complexity',
                'Balances room utilization across building',
                'Checks availability to prevent conflicts'
            ]
        }
    };
    
    const algoData = algorithms[algo];
    if (!algoData) return;
    
    content.innerHTML = `
        <div class="algo-detail-section">
            <h3>${algoData.title}</h3>
            <p style="color:var(--muted);line-height:1.6;margin-bottom:16px">${algoData.description}</p>
            
            <h4 style="margin-top:20px;margin-bottom:12px;color:var(--text-dark)">Time & Space Complexity</h4>
            <table class="complexity-table">
                <thead>
                    <tr>
                        <th>Operation</th>
                        <th>Time Complexity</th>
                        <th>Space Complexity</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    ${algoData.complexity.map(op => `
                        <tr>
                            <td><strong>${op.operation}</strong></td>
                            <td><strong>${op.time}</strong></td>
                            <td>${op.space}</td>
                            <td>${op.description}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <h4 style="margin-top:24px;margin-bottom:12px;color:var(--text-dark)">Key Features</h4>
            <ul style="margin-left:20px;color:var(--muted);line-height:1.8">
                ${algoData.features.map(f => `<li>${f}</li>`).join('')}
            </ul>
            
            <h4 style="margin-top:24px;margin-bottom:12px;color:var(--text-dark)">Implementation Overview</h4>
            <div class="code-block">
                <div class="comment">// ${algoData.title}</div>
                ${algoData.implementation.split('\n').map(line => 
                    line.trim() ? `<div>${line}</div>` : '<br>'
                ).join('')}
            </div>
            
            <div style="margin-top:20px;padding:12px;background:linear-gradient(90deg, rgba(59,130,246,0.05), rgba(6,182,212,0.05));border-radius:8px;border-left:3px solid var(--accent)">
                <strong style="color:var(--accent)">Real-World Application:</strong>
                <p style="margin:8px 0 0;color:var(--muted);font-size:13px">
                    ${algo === 'avl' ? 'Ensures no scheduling conflicts while maintaining sorted order for efficient day-based filtering and time slot queries.' : 
                      algo === 'trie' ? 'Provides instant search results as professors type course codes, improving user experience and reducing input errors.' :
                      'Maximizes room utilization efficiency, ensuring optimal space usage while meeting all capacity requirements.'}
                </p>
            </div>
        </div>
    `;
}

function logAlgorithmExecution(algo, message, type = 'success') {
    const logDiv = document.getElementById('algoLog');
    const logContent = document.getElementById('algoLogContent');
    
    if (!logDiv || !logContent) return;
    
    logDiv.style.display = 'flex';
    
    const entry = document.createElement('div');
    entry.className = `algo-log-entry ${type}`;
    const time = new Date().toLocaleTimeString();
    entry.innerHTML = `
        <div class="time">[${time}] ${algo.toUpperCase()}</div>
        <div class="message">${message}</div>
    `;
    
    logContent.insertBefore(entry, logContent.firstChild);
    
    // Keep only last 10 entries
    while (logContent.children.length > 10) {
        logContent.removeChild(logContent.lastChild);
    }
}

function closeAlgoLog() {
    const logDiv = document.getElementById('algoLog');
    if (logDiv) logDiv.style.display = 'none';
}

function renderAlgorithmOverview() {
    const content = document.getElementById('algorithm-details-content');
    if (!content) return;

    // Estimate time and manual work saved based on current data
    const classesCount = allSchedule.length;
    // Very conservative assumptions for a manual, spreadsheet-based process:
    // - 5 minutes per class to pick a room, check capacity, and check conflicts
    const minutesPerClass = 5;
    const totalMinutes = classesCount * minutesPerClass;
    const totalHours = (totalMinutes / 60).toFixed(1);
    // Roughly split the benefit across algorithms
    const avlShare = 0.4;
    const greedyShare = 0.4;
    const trieShare = 0.2;
    const avlMinutes = Math.round(totalMinutes * avlShare);
    const greedyMinutes = Math.round(totalMinutes * greedyShare);
    const trieMinutes = Math.round(totalMinutes * trieShare);
    
    content.innerHTML = `
        <div style="margin-bottom:24px">
            <p style="color:var(--muted);line-height:1.6;font-size:15px">
                This Smart Timetable System implements three advanced algorithms to optimize scheduling, 
                search, and resource allocation. Click on any algorithm card above to view detailed analysis.
            </p>
        </div>
        
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:24px">
            <div class="algo-card-detailed" onclick="showAlgoDetails('avl')" style="cursor:pointer">
                <h3 style="margin:0 0 8px;color:var(--accent)">AVL Tree</h3>
                <p class="small" style="margin-bottom:12px">Self-balancing BST for conflict detection</p>
                <div class="algo-badge" style="display:inline-block">O(log n)</div>
            </div>
            <div class="algo-card-detailed" onclick="showAlgoDetails('trie')" style="cursor:pointer">
                <h3 style="margin:0 0 8px;color:var(--accent)">Trie</h3>
                <p class="small" style="margin-bottom:12px">Prefix tree for auto-completion</p>
                <div class="algo-badge" style="display:inline-block">O(m)</div>
            </div>
            <div class="algo-card-detailed" onclick="showAlgoDetails('greedy')" style="cursor:pointer">
                <h3 style="margin:0 0 8px;color:var(--accent)">Greedy</h3>
                <p class="small" style="margin-bottom:12px">Optimal room allocation</p>
                <div class="algo-badge" style="display:inline-block">O(n log n)</div>
            </div>
        </div>
        
        <div style="margin-top:32px;padding:20px;background:linear-gradient(135deg, rgba(59,130,246,0.05), rgba(6,182,212,0.05));border-radius:10px;border:1px solid var(--border-light)">
            <h3 style="margin:0 0 12px;color:var(--text-dark)">How These Algorithms Reduce Manual Work</h3>
            <p style="color:var(--muted);line-height:1.8;margin:0 0 12px">
                Instead of manually checking spreadsheets for clashes and searching for available rooms, 
                the system uses the algorithms to do this in milliseconds. This section gives an estimate 
                of how much effort is being saved with the current timetable.
            </p>
            <ul style="margin:0 0 14px 20px;color:var(--muted);font-size:13px;line-height:1.7">
                <li><strong>AVL Tree</strong> automatically checks for professor and room conflicts in \\(O(\\log n)\\) time, avoiding repeated manual scanning of existing entries.</li>
                <li><strong>Trie</strong> provides instant auto-complete for courses and rooms, reducing typing and lookup time for each search.</li>
                <li><strong>Greedy allocator</strong> suggests the smallest suitable free room, eliminating trial-and-error room selection and capacity checks.</li>
            </ul>
            <div style="display:flex;flex-wrap:wrap;gap:18px;margin-top:6px">
                <div style="flex:1;min-width:180px">
                    <div class="small"><strong>Classes currently scheduled:</strong></div>
                    <div style="font-size:18px;font-weight:700;color:var(--text-dark)">${classesCount}</div>
                </div>
                <div style="flex:1;min-width:220px">
                    <div class="small"><strong>Estimated manual effort avoided:</strong></div>
                    <div style="font-size:18px;font-weight:700;color:var(--text-dark)">${totalMinutes} minutes (~${totalHours} hours)</div>
                    <div class="small" style="margin-top:4px">
                        Assuming about ${minutesPerClass} minutes of manual checking per class (room search, capacity check, conflict check).
                    </div>
                </div>
            </div>
            
            <div class="impact-chart">
                <div class="impact-chart-title">Estimated Time Saved by Each Algorithm</div>
                <div class="impact-row">
                    <span class="impact-label">AVL Tree</span>
                    <div class="impact-bar-wrap">
                        <div class="impact-bar avl" style="width:${avlShare * 100}%"></div>
                    </div>
                    <span class="impact-value">${avlMinutes} min</span>
                </div>
                <div class="impact-row">
                    <span class="impact-label">Greedy Allocator</span>
                    <div class="impact-bar-wrap">
                        <div class="impact-bar greedy" style="width:${greedyShare * 100}%"></div>
                    </div>
                    <span class="impact-value">${greedyMinutes} min</span>
                </div>
                <div class="impact-row">
                    <span class="impact-label">Trie (Auto-complete)</span>
                    <div class="impact-bar-wrap">
                        <div class="impact-bar trie" style="width:${trieShare * 100}%"></div>
                    </div>
                    <span class="impact-value">${trieMinutes} min</span>
                </div>
            </div>
        </div>
    `;
}
