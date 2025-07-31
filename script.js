// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚗 Khan Automobiles - Landing Page Loaded');

    // Handle Admin Portal button
    const adminBtn = document.getElementById('adminBtn');
    const adminModal = document.getElementById('adminModal');
    const closeModal = document.querySelector('.close');

    if (adminBtn && adminModal) {
        adminBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('👤 Admin login modal opened');
            adminModal.style.display = 'block';
        });
    }

    if (closeModal && adminModal) {
        closeModal.addEventListener('click', function() {
            console.log('❌ Admin modal closed');
            adminModal.style.display = 'none';
        });
    }

    // Close modal when clicking outside
    if (adminModal) {
        window.addEventListener('click', function(e) {
            if (e.target === adminModal) {
                console.log('❌ Admin modal closed (outside click)');
                adminModal.style.display = 'none';
            }
        });
    }

    // Handle Phone Numbers Modal
    const contactBtn = document.getElementById('contactBtn');
    const phoneModal = document.getElementById('phoneNumbersModal');
    const closePhoneModal = document.querySelector('.close-phone');

    if (contactBtn && phoneModal) {
        contactBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('📞 Phone numbers modal opened');
            phoneModal.style.display = 'block';
        });
    }

    if (closePhoneModal && phoneModal) {
        closePhoneModal.addEventListener('click', function() {
            console.log('❌ Phone modal closed');
            phoneModal.style.display = 'none';
        });
    }

    // Close phone modal when clicking outside
    if (phoneModal) {
        window.addEventListener('click', function(e) {
            if (e.target === phoneModal) {
                console.log('❌ Phone modal closed (outside click)');
                phoneModal.style.display = 'none';
            }
        });
    }

    // Track phone number clicks
    const phoneLinks = document.querySelectorAll('.phone-link');
    phoneLinks.forEach(link => {
        link.addEventListener('click', function() {
            const phoneNumber = this.getAttribute('href').replace('tel:', '');
            console.log('📱 User clicked to call:', phoneNumber);
            // Close modal after clicking a number
            if (phoneModal) {
                phoneModal.style.display = 'none';
            }
        });
    });

    // Handle login form
    const adminForm = document.getElementById('adminForm');
    if (adminForm) {
        adminForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            
            console.log('🔐 Login attempt for username:', username);
            
            if (!username || !password) {
                alert('Please enter both username and password.');
                return;
            }
            
            // Send login request to server
            fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            })
            .then(response => {
                console.log('📡 Server response status:', response.status);
                return response.json();
            })
            .then(data => {
                console.log('📊 Server response data:', data);
                
                if (data.success) {
                    console.log('✅ Login successful');
                    
                    // Save both authentication flag and username
                    localStorage.setItem('isAdminLoggedIn', 'true');
                    localStorage.setItem('adminUsername', username);
                    sessionStorage.setItem('isAdminLoggedIn', 'true');
                    sessionStorage.setItem('adminUsername', username);
                    
                    console.log('💾 Saved authentication data:', {
                        isAdminLoggedIn: localStorage.getItem('isAdminLoggedIn'),
                        adminUsername: localStorage.getItem('adminUsername')
                    });
                    
                    // Close the modal
                    if (adminModal) {
                        adminModal.style.display = 'none';
                    }
                    
                    // Direct redirect without popup
                    window.location.href = 'admin.html';
                    
                } else {
                    console.log('❌ Login failed:', data.message || data.error);
                    alert('Incorrect username or password. Please try again.');
                }
            })
            .catch(error => {
                console.error('🚨 Login error:', error);
                alert('Login failed. Please try again.');
            });
        });
    }

    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                const headerHeight = document.querySelector('.header').offsetHeight || 80;
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Mobile menu functionality
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });

        // Close mobile menu when clicking on nav links
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });

        // Handle window resize - close menu on desktop
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });
    }

    // Header scroll effect
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (header) {
            if (window.scrollY > 100) {
                header.style.background = 'rgba(255, 255, 255, 0.98)';
                header.style.boxShadow = '0 2px 30px rgba(0, 0, 0, 0.15)';
            } else {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
                header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            }
        }
    });

    // Button click animations
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('div');
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255, 255, 255, 0.3)';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple 0.6s linear';
            ripple.style.left = (e.clientX - button.offsetLeft) + 'px';
            ripple.style.top = (e.clientY - button.offsetTop) + 'px';
            ripple.style.width = ripple.style.height = '20px';
            
            if (button.style.position !== 'absolute') {
                button.style.position = 'relative';
            }
            button.style.overflow = 'hidden';
            button.appendChild(ripple);
            
            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.remove();
                }
            }, 600);
        });
    });

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .nav-menu.active {
            display: flex !important;
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            padding: 1rem;
            gap: 1rem;
            z-index: 1000;
        }
        
        @media (max-width: 768px) {
            .nav-menu {
                display: none;
            }
        }
    `;
    document.head.appendChild(style);

    // Note: Visit Location and Call Now buttons now work automatically as links
    console.log('📍 Visit Location button: Opens Google Maps in new tab');
    console.log('📞 Call Now button: Opens popup with both phone numbers (8052594809 & 9118819531)');
    console.log('🎨 Header styling: Updated to professional blue-red gradient');
});
