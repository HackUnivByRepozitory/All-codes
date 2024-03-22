// Duration of the video in seconds (you need to replace this value with the actual duration of your video)
const videoDuration = 4; // Example: 60 seconds

// Get video element
const video = document.getElementById('video');

// Hide video controls
video.controls = false;

// Set playback rate for smoother scrolling
video.playbackRate = 1; // Example: Double the playback rate

// Function to adjust video time based on scroll
function adjustVideoTimeOnScroll() {
    const scrollTop = window.scrollY;
    const scrollFraction = scrollTop / (document.body.scrollHeight - window.innerHeight);
    const currentTime = scrollFraction * videoDuration;

    // Smoothly set the current time of the video
    smoothSetCurrentTime(currentTime);
}

// Smoothly set the current time of the video
function smoothSetCurrentTime(currentTime) {
    const targetTime = Math.min(Math.max(currentTime, 0), video.duration);
    if (!video.paused) {
        requestAnimationFrame(() => smoothSetCurrentTime(currentTime));
    }
    video.currentTime += (targetTime - video.currentTime) * 0.1; // Adjust the 0.1 value for smoother or faster scrolling
}

// Initial setup
video.currentTime = 0;

// Listen for scroll events and adjust video time accordingly
window.addEventListener('scroll', adjustVideoTimeOnScroll);