let currentUserType = '';
let isLoggedIn = false;
let googleUser = {};
let uploadedFiles = [];
let signupUploadedFiles = [];
let currentRating = 0;
let currentFilter = 'all';
let map;
let markers = [];
let testimonials = [];
let currentLightboxIndex = 0;
const galleryImages = [
    'gallery/1.png',
    'gallery/2.png',
    'gallery/3.png',
    'gallery/4.png',
    'gallery/5.png',
    'gallery/6.png',
    'gallery/7.png',
    'gallery/8.png',
    'gallery/9.png',
    'gallery/10.png',
    'gallery/11.png'
];

// Enhanced map locations data with 20+ locations
const locations = [
    // Adoption Centers
    {type: 'adoption', name: 'Happy Paws Adoption Center', lat: 27.6915, lng: 85.3240, contact: '+977-9812345678', description: 'Find your perfect companion here'},
    {type: 'adoption', name: 'Furry Friends Home', lat: 27.7172, lng: 85.3240, contact: '+977-9823456789', description: 'Loving homes for loving pets'},
    {type: 'adoption', name: 'Forever Home Kathmandu', lat: 27.7050, lng: 85.3100, contact: '+977-9834567891', description: '50+ pets ready for adoption'},
    {type: 'adoption', name: 'Pet Paradise Adoption', lat: 27.6880, lng: 85.3280, contact: '+977-9845678902', description: 'Cats and dogs looking for families'},
    
    // Animals in Danger
    {type: 'danger', name: 'Injured Dog - Urgent', lat: 27.7000, lng: 85.3300, contact: '+977-9834567890', description: 'Needs immediate medical attention'},
    {type: 'danger', name: 'Abandoned Puppies', lat: 27.6850, lng: 85.3150, contact: '+977-9845678901', description: '5 puppies found in street'},
    {type: 'danger', name: 'Injured Cat - Critical', lat: 27.7120, lng: 85.3180, contact: '+977-9856789013', description: 'Hit by vehicle, needs surgery'},
    {type: 'danger', name: 'Malnourished Dogs', lat: 27.6920, lng: 85.3250, contact: '+977-9867890124', description: 'Pack of 4 dogs, extremely weak'},
    
    // Free Vaccination Events
    {type: 'event', name: 'Free Vaccination Camp', lat: 27.7100, lng: 85.3200, contact: 'Register Now', description: 'Dec 20-22, 2024'},
    {type: 'event', name: 'Pet Health Checkup', lat: 27.6950, lng: 85.3350, contact: 'Register Now', description: 'Free health screening'},
    {type: 'event', name: 'Rabies Prevention Drive', lat: 27.7030, lng: 85.3120, contact: 'Register Now', description: 'Dec 25-26, 2024'},
    
    // NGOs/INGOs
    {type: 'ngo', name: 'Animal Welfare Society', lat: 27.7050, lng: 85.3180, contact: '+977-9856789012', description: 'Registered NGO since 2010'},
    {type: 'ngo', name: 'Kathmandu Pet Care', lat: 27.6980, lng: 85.3280, contact: '+977-9867890123', description: 'Community-driven organization'},
    {type: 'ngo', name: 'Nepal Animal Rights', lat: 27.7090, lng: 85.3220, contact: '+977-9878901235', description: 'Advocacy and rescue'},
    {type: 'ngo', name: 'Paws for Change', lat: 27.6890, lng: 85.3190, contact: '+977-9889012346', description: 'International animal welfare'},
    
    // Shelters
    {type: 'shelter', name: 'Safe Haven Shelter', lat: 27.7120, lng: 85.3220, contact: '+977-9878901234', description: 'Capacity: 150 animals'},
    {type: 'shelter', name: 'Hope Animal Shelter', lat: 27.6920, lng: 85.3320, contact: '+977-9889012345', description: 'Emergency shelter available'},
    {type: 'shelter', name: 'Rainbow Bridge Sanctuary', lat: 27.7010, lng: 85.3140, contact: '+977-9890123457', description: 'Senior pet care facility'},
    {type: 'shelter', name: 'Second Chance Shelter', lat: 27.6870, lng: 85.3270, contact: '+977-9801234568', description: 'Rehabilitation center'},
    
    // Veterinary Clinics
    {type: 'vet', name: 'Pet Care Veterinary Clinic', lat: 27.7080, lng: 85.3260, contact: '+977-9890123456', description: '24/7 emergency service'},
    {type: 'vet', name: 'Animal Hospital Kathmandu', lat: 27.6970, lng: 85.3190, contact: '+977-9801234567', description: 'Specialized pet care'},
    {type: 'vet', name: 'Valley Vet Center', lat: 27.7040, lng: 85.3290, contact: '+977-9812345679', description: 'Surgery and diagnostics'},
    {type: 'vet', name: 'Paws & Claws Clinic', lat: 27.6930, lng: 85.3160, contact: '+977-9823456780', description: 'Preventive care specialists'}
];

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function openLightbox(index) {
    currentLightboxIndex = index;
    const lightbox = document.getElementById('lightboxOverlay');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxCounter = document.getElementById('lightboxCounter');
    
    lightboxImage.src = galleryImages[index];
    lightboxCounter.textContent = `${index + 1} / ${galleryImages.length}`;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightboxOverlay');
    lightbox.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function closeLightboxOnOverlay(event) {
    if (event.target === document.getElementById('lightboxOverlay')) {
        closeLightbox();
    }
}

function navigateLightbox(direction) {
    currentLightboxIndex += direction;
    
    if (currentLightboxIndex < 0) {
        currentLightboxIndex = galleryImages.length - 1;
    } else if (currentLightboxIndex >= galleryImages.length) {
        currentLightboxIndex = 0;
    }
    
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxCounter = document.getElementById('lightboxCounter');
    
    lightboxImage.style.opacity = '0';
    setTimeout(() => {
        lightboxImage.src = galleryImages[currentLightboxIndex];
        lightboxCounter.textContent = `${currentLightboxIndex + 1} / ${galleryImages.length}`;
        lightboxImage.style.opacity = '1';
    }, 150);
}

// Keyboard navigation for lightbox
document.addEventListener('keydown', function(event) {
    const lightbox = document.getElementById('lightboxOverlay');
    if (lightbox.classList.contains('active')) {
        if (event.key === 'Escape') {
            closeLightbox();
        } else if (event.key === 'ArrowLeft') {
            navigateLightbox(-1);
        } else if (event.key === 'ArrowRight') {
            navigateLightbox(1);
        }
    }
});

function toggleMapControls() {
    const controls = document.getElementById('mapControls');
    controls.classList.toggle('open');
}

function initMap() {
    map = L.map('rescueMap').setView([27.7000, 85.3240], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const icons = {
        adoption: L.divIcon({className: 'custom-marker', html: '<div style="background:#4ade80;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.3)">🏠</div>'}),
        danger: L.divIcon({className: 'custom-marker', html: '<div style="background:#ef4444;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.3)">⚠️</div>'}),
        event: L.divIcon({className: 'custom-marker', html: '<div style="background:#3b82f6;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.3)">💉</div>'}),
        ngo: L.divIcon({className: 'custom-marker', html: '<div style="background:#f59e0b;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.3)">🏢</div>'}),
        shelter: L.divIcon({className: 'custom-marker', html: '<div style="background:#8b5cf6;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.3)">🏘️</div>'}),
        vet: L.divIcon({className: 'custom-marker', html: '<div style="background:#ec4899;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.3)">🩺</div>'})
    };

    locations.forEach(loc => {
        const marker = L.marker([loc.lat, loc.lng], {icon: icons[loc.type]}).addTo(map);
        const isEvent = loc.type === 'event';
        const popupContent = `
            <div class="location-popup">
                <h3>${loc.name}</h3>
                <p><strong>Type:</strong> ${loc.type.charAt(0).toUpperCase() + loc.type.slice(1)}</p>
                <p>${loc.description}</p>
                <p style="color:#4ade80;font-weight:600;margin-top:0.5rem">${loc.contact}</p>
                <div class="popup-buttons">
                    <button class="popup-btn contact" onclick="handleContact('${loc.name}', '${loc.contact}')">${isEvent ? 'Register' : 'Contact'}</button>
                    <button class="popup-btn navigate" onclick="handleNavigate(${loc.lat}, ${loc.lng})">Navigate</button>
                </div>
            </div>
        `;
        marker.bindPopup(popupContent);
        marker.locationType = loc.type;
        markers.push(marker);
    });
}

function filterMap(filter) {
    currentFilter = filter;
    const buttons = document.querySelectorAll('.map-filter-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });

    markers.forEach(marker => {
        if (filter === 'all' || marker.locationType === filter) {
            marker.addTo(map);
        } else {
            map.removeLayer(marker);
        }
    });
}

function handleContact(name, contact) {
    if (contact === 'Register Now') {
        if (!isLoggedIn) {
            showNotification('Login Required', 'Please login to register for events');
            openModal();
        } else {
            showNotification('Registration', `Successfully registered for ${name}`);
        }
    } else {
        showNotification('Contact', `Call ${contact} for ${name}`);
    }
}

function handleNavigate(lat, lng) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
}

function setRating(rating) {
    currentRating = rating;
    const stars = document.querySelectorAll('#ratingInput i');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function submitTestimonial(event) {
    event.preventDefault();
    
    if (!isLoggedIn) {
        showNotification('Login Required', 'Please login to post a review');
        openModal();
        return;
    }

    if (currentRating === 0) {
        showNotification('Rating Required', 'Please select a rating');
        return;
    }

    const text = document.getElementById('testimonialText').value;
    const userName = googleUser.name || 'User';
    const userAvatar = googleUser.picture || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + Date.now();

    const testimonial = {
        name: userName,
        avatar: userAvatar,
        rating: currentRating,
        text: text,
        date: new Date().toLocaleDateString()
    };

    testimonials.unshift(testimonial);
    renderTestimonials();

    document.getElementById('testimonialText').value = '';
    setRating(0);
    showNotification('Success', 'Your review has been posted!');
}

function renderTestimonials() {
    const grid = document.getElementById('testimonialsGrid');
    grid.innerHTML = testimonials.map(t => `
        <div class="testimonial-card">
            <div class="testimonial-header">
                <img src="${t.avatar}" alt="${t.name}" class="testimonial-avatar" style="width:60px;height:60px;border-radius:50%;object-fit:cover">
                <div class="testimonial-info">
                    <h4>${t.name}</h4>
                    <p>${t.date}</p>
                </div>
            </div>
            <div class="testimonial-rating">
                ${'<i class="ri-star-fill"></i>'.repeat(t.rating)}${'<i class="ri-star-line"></i>'.repeat(5 - t.rating)}
            </div>
            <p class="testimonial-text">${t.text}</p>
        </div>
    `).join('');
}

function showNotification(title, message) {
    const toast = document.getElementById('notificationToast');
    const titleEl = document.getElementById('notificationTitle');
    const messageEl = document.getElementById('notificationMessage');
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

function toggleMenu() {
    const navLinks = document.getElementById('navLinks');
    const hamburger = document.getElementById('hamburger');
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('active');
}

function closeMenu() {
    const navLinks = document.getElementById('navLinks');
    const hamburger = document.getElementById('hamburger');
    navLinks.classList.remove('active');
    hamburger.classList.remove('active');
}

function toggleDropdown() {
    const dropdown = document.getElementById('categoryDropdown');
    dropdown.classList.toggle('active');
}

function handleCategoryClick(category) {
    showNotification(`${category.charAt(0).toUpperCase() + category.slice(1)}`, 'Section coming soon!');
    toggleDropdown();
}

function openModal() {
    document.getElementById('modalOverlay').classList.add('active');
    showLogin();
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

function closeModalOnOverlay(event) {
    if (event.target === document.getElementById('modalOverlay')) {
        closeModal();
    }
}

function showLogin() {
    document.getElementById('loginToggle').classList.add('active');
    document.getElementById('signupToggle').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('signupForm').classList.remove('active');
}

function showSignup() {
    document.getElementById('loginToggle').classList.remove('active');
    document.getElementById('signupToggle').classList.add('active');
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('signupForm').classList.add('active');
    document.getElementById('signupFormElement').style.display = 'none';
}

function selectUserType(type) {
    currentUserType = type;
    const cards = document.querySelectorAll('.user-type-card');
    cards.forEach(card => card.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    document.getElementById('signupFormElement').style.display = 'block';

    const verificationUpload = document.getElementById('signupVerificationUpload');
    const googleSignupSection = document.getElementById('googleSignupSection');

    if (type === 'ngo' || type === 'shelter' || type === 'veterinary') {
        verificationUpload.style.display = 'block';
        googleSignupSection.style.display = 'none';
    } else {
        verificationUpload.style.display = 'none';
        googleSignupSection.style.display = 'block';
    }
}

function backToUserTypeSelection() {
    document.getElementById('signupFormElement').style.display = 'none';
    const cards = document.querySelectorAll('.user-type-card');
    cards.forEach(card => card.classList.remove('selected'));
}

function handleSignupFileUpload(event) {
    const files = event.target.files;
    const uploadedFilesDiv = document.getElementById('signupUploadedFiles');
    for (let file of files) {
        signupUploadedFiles.push(file);
        const fileItem = document.createElement('div');
        fileItem.className = 'uploaded-file-item';
        fileItem.innerHTML = `
            <i class="ri-file-text-line"></i>
            <span>${file.name}</span>
        `;
        uploadedFilesDiv.appendChild(fileItem);
    }
}

function handleLogin(event) {
    event.preventDefault();
    const email = event.target.querySelector('input[type="email"]').value;
    const userName = email.split('@')[0];
    isLoggedIn = true;
    const userIcon = document.getElementById('userIcon');
    const userAvatar = document.getElementById('userAvatar');
    userAvatar.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + Date.now();
    googleUser.name = userName;
    userIcon.style.display = 'none';
    userAvatar.style.display = 'block';
    closeModal();
    showNotification('Login Successful!', `Welcome back, ${userName}!`);
}

function handleSignup(event) {
    event.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    if (password !== confirmPassword) {
        showNotification('Error', 'Passwords do not match!');
        return;
    }
    if (password.length < 6) {
        showNotification('Error', 'Password must be at least 6 characters!');
        return;
    }

    isLoggedIn = true;
    googleUser.name = name;
    const userIcon = document.getElementById('userIcon');
    const userAvatar = document.getElementById('userAvatar');
    const signOutBtn = document.getElementById('signOutBtn');
    userAvatar.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + Date.now();
    userIcon.style.display = 'none';
    userAvatar.style.display = 'block';
    signOutBtn.style.display = 'inline-block';
    closeModal();

    const userTypeNames = {
        user: 'User',
        ngo: "NGO/INGO",
        shelter: 'Shelter',
        veterinary: 'Veterinary'
    };
    
    showNotification('Account Created!', `Welcome to HamroCare, ${name}! (${userTypeNames[currentUserType]})`);
    event.target.reset();
    signupUploadedFiles = [];
    document.getElementById('signupUploadedFiles').innerHTML = '';
    backToUserTypeSelection();
}

function handleGoogleSignup(response) {
    googleUser = JSON.parse(atob(response.credential.split('.')[1]));
    isLoggedIn = true;
    const userIcon = document.getElementById('userIcon');
    const userAvatar = document.getElementById('userAvatar');
    const signOutBtn = document.getElementById('signOutBtn');
    userAvatar.src = googleUser.picture;
    userIcon.style.display = 'none';
    userAvatar.style.display = 'block';
    signOutBtn.style.display = 'inline-block';
    closeModal();
    showNotification('Account Created!', `Welcome to HamroCare, ${googleUser.name}! (User)`);
    document.getElementById('signupFormElement').reset();
    signupUploadedFiles = [];
    document.getElementById('signupUploadedFiles').innerHTML = '';
    backToUserTypeSelection();
}

function handleGoogleLogin(response) {
    googleUser = JSON.parse(atob(response.credential.split('.')[1]));
    isLoggedIn = true;
    const userIcon = document.getElementById('userIcon');
    const userAvatar = document.getElementById('userAvatar');
    const signOutBtn = document.getElementById('signOutBtn');
    userAvatar.src = googleUser.picture;
    userIcon.style.display = 'none';
    userAvatar.style.display = 'block';
    signOutBtn.style.display = 'inline-block';
    closeModal();
    showNotification('Login Successful!', `Welcome back, ${googleUser.name}!`);
}

function toggleUserMenu() {
    if (isLoggedIn) {
        const signOutBtn = document.getElementById('signOutBtn');
        signOutBtn.style.display = signOutBtn.style.display === 'none' ? 'inline-block' : 'none';
    }
}

function handleSignOut() {
    isLoggedIn = false;
    googleUser = {};
    const userIcon = document.getElementById('userIcon');
    const userAvatar = document.getElementById('userAvatar');
    const signOutBtn = document.getElementById('signOutBtn');
    userIcon.style.display = 'flex';
    userAvatar.style.display = 'none';
    signOutBtn.style.display = 'none';
    showNotification('Signed Out', 'Successfully signed out');
}

document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('categoryDropdown');
    if (!dropdown.contains(event.target)) {
        dropdown.classList.remove('active');
    }
});

window.onload = function () {
    google.accounts.id.initialize({
        client_id: "1091162397024-te53me83sai0uhfmpk0rv7evvre59aeg.apps.googleusercontent.com",
        callback: handleGoogleLogin,
        context: "signin",
        ux_mode: "popup",
        auto_select: false,
        use_fedcm_for_prompt: true,
    });
    
    initMap();
    
    // Sample testimonials
    testimonials = [
        {
            name: 'Anjali Sharma',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=anjali',
            rating: 5,
            text: 'HamroCare helped me find the perfect companion! The adoption process was smooth and the staff was incredibly supportive. My new furry friend has brought so much joy to my life.',
            date: 'Dec 10, 2024'
        },
        {
            name: 'Rajesh Thapa',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rajesh',
            rating: 5,
            text: 'I reported an injured dog through their platform and the rescue team responded within 30 minutes. The animal is now recovering well at a shelter. Truly amazing service!',
            date: 'Dec 8, 2024'
        },
        {
            name: 'Priya Gurung',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
            rating: 4,
            text: 'Great platform for animal welfare. The live map feature is very helpful to locate nearby shelters and veterinary clinics. Would love to see more features added soon.',
            date: 'Dec 5, 2024'
        },
        {
            name: 'Santosh Rai',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=santosh',
            rating: 5,
            text: 'As a veterinary professional, I appreciate how HamroCare connects animal lovers with proper resources. The emergency alert system is particularly useful.',
            date: 'Dec 2, 2024'
        },
        {
            name: 'Nisha Karki',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nisha',
            rating: 5,
            text: 'Adopted my lovely cat Charlie through HamroCare two months ago. The team provided excellent post-adoption support and guidance. Highly recommend!',
            date: 'Nov 28, 2024'
        },
        {
            name: 'Bikash Tamang',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bikash',
            rating: 4,
            text: 'The donation system is transparent and I can see exactly where my contributions are going. Keep up the excellent work in animal welfare!',
            date: 'Nov 25, 2024'
        }
    ];
    renderTestimonials();
};