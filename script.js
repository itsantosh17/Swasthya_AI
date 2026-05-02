tailwind.config = {
            theme: {
                extend: {
                    animation: {
                        'fade-in': 'fadeIn 0.6s ease-out',
                        'slide-up': 'slideUp 0.8s ease-out',
                        'bounce-slow': 'bounce 3s infinite',
                        'pulse-glow': 'pulseGlow 2s ease-in-out infinite alternate',
                        'float': 'float 3s ease-in-out infinite',
                    },
                    keyframes: {
                        fadeIn: {
                            from: { opacity: 0 },
                            to: { opacity: 1 }
                        },
                        slideUp: {
                            from: { opacity: 0, transform: 'translateY(30px)' },
                            to: { opacity: 1, transform: 'translateY(0)' }
                        },
                        pulseGlow: {
                            from: { boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' },
                            to: { boxShadow: '0 0 40px rgba(59, 130, 246, 0.8)' }
                        },
                        float: {
                            '0%, 100%': { transform: 'translateY(0px)' },
                            '50%': { transform: 'translateY(-10px)' }
                        }
                    }
                }
            }
        }

let appState = {
            currentUser: null,
            currentPage: 'home',
            chatMessages: [],
            userMood: null,
            appointments: [],
            notifications: []
        };

        const API_BASE = '';

        async function apiFetch(apiPath, options = {}) {
            const res = await fetch(API_BASE + apiPath, {
                headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
                ...options
            });
            const contentType = res.headers.get('content-type') || '';
            const data = contentType.includes('application/json') ? await res.json() : await res.text();
            if (!res.ok) {
                const msg = (data && data.error) ? data.error : `Request failed (${res.status})`;
                throw new Error(msg);
            }
            return data;
        }

        function checkAuth() {
            const user = localStorage.getItem('currentUser');
            if (user) {
                appState.currentUser = JSON.parse(user);
                return true;
            }
            return false;
        }

        function navigate(page) {
            appState.currentPage = page;
            window.scrollTo(0, 0); // Scroll to top on page change
            showPage(page);

            if (page === 'booking') {
                initBooking();
            }
        }

        function showPage(page) {
            const pages = ['home-page', 'dashboard-page', 'login-page', 'chat-page', 'resources-page', 'booking-page', 'community-page', 'admin-dashboard-page'];
            pages.forEach(p => {
                const element = document.getElementById(p);
                if (element) {
                    element.style.display = 'none';
                }
            });
            
            const targetPage = document.getElementById(page + '-page');
            if (targetPage) {
                targetPage.style.display = 'block';
            }

            updateNavbar();
        }

        function updateNavbar() {
            const navbar = document.getElementById('navbar');
            if (appState.currentUser) {
                navbar.innerHTML = getLoggedInNavbar();
                 // Update username after navbar is rendered
                if (appState.currentUser.userType !== 'admin') {
                    updateUsernameDisplay(appState.currentUser.username);
                }
            } else {
                navbar.innerHTML = getPublicNavbar();
            }
        }

        function initApp() {
            if (checkAuth()) {
                if (appState.currentUser.userType === 'admin') {
                    navigate('admin-dashboard');
                } else {
                    navigate('dashboard');
                }
            } else {
                navigate('home');
            }
        }
        
        function getPublicNavbar() {
            return `
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        <div class="flex items-center space-x-2">
                           <div class="w-10 h-10 rounded-xl overflow-hidden shadow-md transition-transform duration-300 hover:scale-110 hover:shadow-lg">
                            <img src="logo.jpg" alt="sw" class="w-full h-full object-cover">
                            </div>

                            <span class="text-xl font-bold gradient-text cursor-pointer" onclick="navigate('home')">Swasthya AI</span>
                        </div>
                        <div class="hidden md:flex items-center">
                            <div class="flex space-x-8">
                                <button onclick="navigate('home')" class="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium">Home</button>
                                <button onclick="document.getElementById('features').scrollIntoView({ behavior: 'smooth' })" class="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium">Features</button>
                                <button class="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium">Contact</button>
                            </div>
                            <button onclick="navigate('login')" class="ml-8 px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold text-sm hover:opacity-90 transition-opacity duration-200 shadow-lg">
                                Log In
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        function getLoggedInNavbar() {
            const isAdmin = appState.currentUser && appState.currentUser.userType === 'admin';
            if (isAdmin) {
                return ''; // Admin dashboard has its own header, so main navbar can be hidden
            }
            
            const initials = (appState.currentUser.username.charAt(0).toUpperCase() || 'U');
            
            return `
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        <div class="flex items-center space-x-2">
                            <div class="w-10 h-10 rounded-xl overflow-hidden shadow-md transition-transform duration-300 hover:scale-110 hover:shadow-lg">
                            <img src="logo.jpg" alt="sw" class="w-full h-full object-cover">
                            </div>

                            <span class="text-xl font-bold gradient-text cursor-pointer" onclick="navigate('dashboard')">Swasthya AI</span>
                        </div>
                        <div class="hidden md:flex items-center">
                            <div class="flex space-x-8">
                                <button onclick="navigate('dashboard')" class="text-blue-600 font-semibold">Dashboard</button>
                                <button onclick="navigate('chat')" class="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium">Chat</button>
                                <button onclick="navigate('resources')" class="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium">Resources</button>
                                <button onclick="navigate('booking')" class="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium">Booking</button>
                            </div>
                            <div class="ml-8 flex items-center space-x-4">
                                <div class="flex items-center space-x-2">
                                    <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                        <span class="text-purple-600 font-bold text-sm">${initials}</span>
                                    </div>
                                    <span class="font-semibold text-gray-700" id="nav-username">User</span>
                                </div>
                                <button onclick="logout()" class="px-4 py-2 text-gray-700 hover:text-red-500 font-medium transition-colors">Logout</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        function switchLoginType(type) {
            const userBtn = document.getElementById('user-login-btn');
            const adminBtn = document.getElementById('admin-login-btn');
            const userForm = document.getElementById('user-login-form');
            const adminForm = document.getElementById('admin-login-form');

            if (type === 'user') {
                userBtn.className = 'flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold transition';
                adminBtn.className = 'flex-1 py-3 px-4 bg-gray-200 text-gray-700 font-semibold transition hover:bg-gray-300';
                userForm.style.display = 'block';
                adminForm.style.display = 'none';
            } else {
                adminBtn.className = 'flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold transition';
                userBtn.className = 'flex-1 py-3 px-4 bg-gray-200 text-gray-700 font-semibold transition hover:bg-gray-300';
                adminForm.style.display = 'block';
                userForm.style.display = 'none';
            }
        }

        function handleLogin(event, userType = 'user') {
            event.preventDefault();
            
            let username, password;
            
            if (userType === 'admin') {
                username = document.getElementById('admin-username').value;
                password = document.getElementById('admin-password').value;
                
                if (username === 'admin' && password === 'admin123') {
                    const user = { username: 'Admin', userType: 'admin' };
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    appState.currentUser = user;
                    navigate('admin-dashboard');
                } else {
                    alert('Invalid admin credentials. Use:\nUsername: admin\nPassword: admin123');
                    return;
                }
            } else {
                username = document.getElementById('username').value;
                password = document.getElementById('password').value;

                if (!(username && password)) {
                    alert('Please enter both username and password');
                    return;
                }

                apiFetch('/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ username, password, userType: 'user' })
                }).then((data) => {
                    const user = data.user || { username: username, userType: 'user' };
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    appState.currentUser = user;
                    navigate('dashboard');
                }).catch(() => {
                    // Backend not running: keep old behavior so the UI still works.
                    const user = { username: username, userType: 'user' };
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    appState.currentUser = user;
                    navigate('dashboard');
                });
            }
        }

        function logout() {
            localStorage.removeItem('currentUser');
            appState.currentUser = null;
            navigate('home');
        }

        function updateUsernameDisplay(username) {
            const displays = ['username-display', 'nav-username'];
            displays.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = username;
                }
            });
        }
        
        function switchAdminTab(tabName) {
            document.querySelectorAll('.admin-tab-content').forEach(tab => {
                tab.style.display = 'none';
            });
            document.querySelectorAll('.admin-tab-btn').forEach(btn => {
                btn.classList.remove('admin-tab-active');
                btn.classList.add('text-gray-600', 'hover:text-gray-800');
            });

            document.getElementById(`admin-${tabName}-tab`).style.display = 'block';
            const activeBtn = event.currentTarget;
            activeBtn.classList.add('admin-tab-active');
            activeBtn.classList.remove('text-gray-600', 'hover:text-gray-800');
        }

        function setMood(mood) {
            appState.userMood = mood;
            const feedback = document.getElementById('mood-feedback');
            const messages = {
                'great': 'Wonderful! Keep up the positive energy!',
                'good': 'Great to hear you\'re doing well!',
                'okay': 'Thanks for checking in. Take care of yourself.',
                'sad': 'Sorry you\'re feeling down. Consider talking to someone.',
                'very-sad': 'I\'m concerned about you. Please reach out for support.'
            };
            
            feedback.textContent = messages[mood];
            feedback.className = 'mt-4 text-center text-sm ' + (mood === 'very-sad' || mood === 'sad' ? 'text-red-500' : 'text-green-500');
        }

        function sendMessage() {
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            
            if (!message) return;
            
            addChatMessage(message, 'user');
            input.value = '';

            const username = (appState.currentUser && appState.currentUser.username) ? appState.currentUser.username : 'anonymous';
            apiFetch('/api/chat', {
                method: 'POST',
                body: JSON.stringify({ username, message })
            }).catch(() => {});
            
            setTimeout(() => {
                const response = generateAIResponse(message);
                addChatMessage(response, 'ai');
            }, 1000);
        }

        function handleChatKeypress(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        }

        function addChatMessage(message, sender) {
            const chatMessages = document.getElementById('chat-messages');
            const messageDiv = document.createElement('div');
            
            if (sender === 'user') {
                messageDiv.className = 'flex items-start space-x-3 chat-message justify-end';
                messageDiv.innerHTML = `
                    <div class="bg-blue-500 text-white rounded-lg p-4 max-w-md">
                        <p>${message}</p>
                    </div>
                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span class="text-blue-600 font-bold text-sm">You</span>
                    </div>
                `;
            } else {
                messageDiv.className = 'flex items-start space-x-3 chat-message';
                messageDiv.innerHTML = `
                    <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span class="text-purple-600 font-bold text-sm">AI</span>
                    </div>
                    <div class="bg-purple-50 rounded-lg p-4 max-w-md">
                        <p class="text-gray-800">${message}</p>
                    </div>
                `;
            }
            
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function generateAIResponse(userMessage) {
            const responses = [
                "I understand you're going through something difficult. Can you tell me more about how you're feeling?",
                "Thank you for sharing that with me. It's important to acknowledge these feelings. What would help you feel better right now?",
                "That sounds challenging. Remember that it's okay to have difficult days. What coping strategies have helped you in the past?",
                "I hear you, and your feelings are valid. Have you considered talking to a counselor about this?",
                "It's brave of you to reach out. Taking care of your mental health is important. What support do you have in your life?",
            ];
            
            const lowerMessage = userMessage.toLowerCase();
            
            if (lowerMessage.includes('sad') || lowerMessage.includes('depressed')) {
                return "I'm sorry you're feeling sad. These feelings are valid, and it's important to talk about them. Would you like to explore what might be contributing to these feelings?";
            } else if (lowerMessage.includes('anxious') || lowerMessage.includes('worry')) {
                return "Anxiety can be overwhelming. It's good that you're recognizing these feelings. What situations tend to make you feel most anxious?";
            } else if (lowerMessage.includes('stress')) {
                return "Stress is very common, especially for students. Let's talk about what's causing you stress and some ways to manage it. What are your biggest stressors right now?";
            }
            
            return responses[Math.floor(Math.random() * responses.length)];
        }

        function filterResources(category) {
            document.querySelectorAll('.resource-filter').forEach(btn => {
                btn.classList.remove('active', 'bg-purple-600', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            });
            
            event.currentTarget.classList.remove('bg-gray-200', 'text-gray-700');
            event.currentTarget.classList.add('active', 'bg-purple-600', 'text-white');
            
            loadResources(category);
        }

        function loadResources(category = 'all') {
            apiFetch(`/api/resources?type=${encodeURIComponent(category)}`)
                .then((data) => {
                    const resources = data.resources || [];
                    const grid = document.getElementById('resources-grid');
                    if (!grid) return;

                    grid.innerHTML = resources.map(resource => `
                <div class="bg-white rounded-3xl shadow-lg overflow-hidden card-hover">
                    <div class="h-48 bg-gradient-to-br from-${getResourceColor(resource.type)}-400 to-${getResourceColor(resource.type)}-600 flex items-center justify-center">
                        <div class="text-white text-center">
                            <div class="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                                ${getResourceIcon(resource.type)}
                            </div>
                            <span class="text-sm font-semibold uppercase tracking-wide">${resource.type}</span>
                        </div>
                    </div>
                    <div class="p-6">
                        <h3 class="text-xl font-bold text-gray-800 mb-2">${resource.title}</h3>
                        <p class="text-gray-600 mb-4">${resource.description}</p>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-500">${resource.duration}</span>
                            <button class="px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-semibold hover:bg-purple-700 transition">
                                Access
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
                })
                .catch(() => {
                    // Fallback if backend isn't running
                    const resources = [
                        { title: "Managing Academic Stress", type: "articles", description: "Practical strategies for handling academic pressure and maintaining balance.", duration: "5 min read" },
                        { title: "Mindfulness Meditation for Students", type: "audio", description: "Guided meditation session designed specifically for student life challenges.", duration: "15 min" },
                        { title: "Understanding Anxiety", type: "videos", description: "Learn about anxiety symptoms, triggers, and coping mechanisms.", duration: "12 min" },
                        { title: "Sleep Hygiene Guide", type: "articles", description: "Tips for better sleep habits to improve mental health and academic performance.", duration: "7 min read" },
                        { title: "Breathing Exercises for Calm", type: "audio", description: "Quick breathing techniques to reduce stress and anxiety in the moment.", duration: "8 min" },
                        { title: "Building Resilience", type: "videos", description: "Develop mental strength and bounce back from challenges.", duration: "18 min" },
                        { title: "Mood Tracker", type: "tools", description: "Interactive tool to track your daily mood and identify patterns.", duration: "Interactive" },
                        { title: "Study-Life Balance Planner", type: "tools", description: "Plan your schedule to maintain healthy balance between studies and self-care.", duration: "Interactive" }
                    ];

                    const filteredResources = category === 'all' ? resources : resources.filter(r => r.type === category);
                    const grid = document.getElementById('resources-grid');
                    if (!grid) return;
                    grid.innerHTML = filteredResources.map(resource => `
                        <div class="bg-white rounded-3xl shadow-lg overflow-hidden card-hover">
                            <div class="h-48 bg-gradient-to-br from-${getResourceColor(resource.type)}-400 to-${getResourceColor(resource.type)}-600 flex items-center justify-center">
                                <div class="text-white text-center">
                                    <div class="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                                        ${getResourceIcon(resource.type)}
                                    </div>
                                    <span class="text-sm font-semibold uppercase tracking-wide">${resource.type}</span>
                                </div>
                            </div>
                            <div class="p-6">
                                <h3 class="text-xl font-bold text-gray-800 mb-2">${resource.title}</h3>
                                <p class="text-gray-600 mb-4">${resource.description}</p>
                                <div class="flex items-center justify-between">
                                    <span class="text-sm text-gray-500">${resource.duration}</span>
                                    <button class="px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-semibold hover:bg-purple-700 transition">
                                        Access
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('');
                });
        }

        function getResourceColor(type) {
            const colors = { 'articles': 'blue', 'videos': 'purple', 'audio': 'green', 'tools': 'orange' };
            return colors[type] || 'gray';
        }

        function getResourceIcon(type) {
            const icons = {
                'articles': '<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" /></svg>',
                'videos': '<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8,5.14V19.14L19,12.14L8,5.14Z" /></svg>',
                'audio': '<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z" /></svg>',
                'tools': '<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" /></svg>'
            };
            return icons[type] || icons['articles'];
        }

        function initBooking() {
            const form = document.getElementById('booking-form');
            if (form && !form.dataset.bound) {
                form.dataset.bound = '1';
                form.addEventListener('submit', handleBookingSubmit);
            }

            const dateInput = document.getElementById('booking-date');
            if (dateInput && !dateInput.value) {
                const now = new Date();
                const yyyy = now.getFullYear();
                const mm = String(now.getMonth() + 1).padStart(2, '0');
                const dd = String(now.getDate()).padStart(2, '0');
                dateInput.value = `${yyyy}-${mm}-${dd}`;
            }

            refreshAppointments();
        }

        function setBookingStatus(text, isError = false) {
            const el = document.getElementById('booking-status');
            if (!el) return;
            el.textContent = text || '';
            el.className = 'text-sm ' + (isError ? 'text-red-600' : 'text-gray-600');
        }

        async function handleBookingSubmit(event) {
            event.preventDefault();
            if (!appState.currentUser || appState.currentUser.userType !== 'user') {
                alert('Please log in as a user to book.');
                return;
            }

            const counselor = document.getElementById('booking-counselor')?.value || '';
            const date = document.getElementById('booking-date')?.value || '';
            const time = document.getElementById('booking-time')?.value || '';
            const notes = document.getElementById('booking-notes')?.value || '';

            setBookingStatus('Submitting...');

            try {
                await apiFetch('/api/appointments', {
                    method: 'POST',
                    body: JSON.stringify({
                        username: appState.currentUser.username,
                        counselor,
                        date,
                        time,
                        notes
                    })
                });
                setBookingStatus('Appointment request submitted.');
                const notesEl = document.getElementById('booking-notes');
                if (notesEl) notesEl.value = '';
                await refreshAppointments();
            } catch (err) {
                setBookingStatus(err.message || 'Failed to submit.', true);
            }
        }

        async function refreshAppointments() {
            if (!appState.currentUser || appState.currentUser.userType !== 'user') {
                const list = document.getElementById('appointments-list');
                if (list) list.innerHTML = '<div class="text-gray-500 text-sm">Log in to see your appointments.</div>';
                return;
            }

            const list = document.getElementById('appointments-list');
            if (!list) return;

            try {
                const data = await apiFetch(`/api/appointments?username=${encodeURIComponent(appState.currentUser.username)}`);
                const appointments = data.appointments || [];
                if (!appointments.length) {
                    list.innerHTML = '<div class="text-gray-500 text-sm">No appointments yet.</div>';
                    return;
                }
                list.innerHTML = appointments.map(a => `
                    <div class="border border-gray-200 rounded-2xl p-4">
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <div class="font-bold text-gray-800">${a.counselor}</div>
                                <div class="text-sm text-gray-600">${a.date} • ${a.time}</div>
                                <div class="text-xs text-gray-500 mt-1">Status: ${a.status}</div>
                                ${a.notes ? `<div class="text-sm text-gray-700 mt-2">${a.notes}</div>` : ''}
                            </div>
                            <button class="px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition"
                                onclick="cancelAppointment('${a.id}')">
                                Cancel
                            </button>
                        </div>
                    </div>
                `).join('');
            } catch {
                list.innerHTML = '<div class="text-gray-500 text-sm">Backend not running. Start <code>node server.js</code> and refresh.</div>';
            }
        }

        async function cancelAppointment(id) {
            if (!appState.currentUser || appState.currentUser.userType !== 'user') return;
            try {
                await apiFetch(`/api/appointments/${encodeURIComponent(id)}?username=${encodeURIComponent(appState.currentUser.username)}`, {
                    method: 'DELETE'
                });
                await refreshAppointments();
            } catch (err) {
                alert(err.message || 'Failed to cancel');
            }
        }

        document.addEventListener('DOMContentLoaded', function() {
            initApp();
            
            if (document.getElementById('resources-grid')) {
                loadResources('all');
            }
        });
