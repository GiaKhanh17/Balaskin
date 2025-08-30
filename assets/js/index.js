// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");

mobileMenuBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
});

// Close mobile menu when clicking on a link
const mobileLinks = mobileMenu.querySelectorAll("a");
mobileLinks.forEach((link) => {
    link.addEventListener("click", () => {
        mobileMenu.classList.add("hidden");
    });
});

// Back to Top Button
const backToTopBtn = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
    if (window.pageYOffset > 300) {
        backToTopBtn.classList.remove("opacity-0", "invisible");
        backToTopBtn.classList.add("opacity-100", "visible");
    } else {
        backToTopBtn.classList.add("opacity-0", "invisible");
        backToTopBtn.classList.remove("opacity-100", "visible");
    }
});

backToTopBtn.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth",
    });
});

// Product Tabs
const tabBtns = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        const tabId = btn.getAttribute("data-tab");

        // Update active tab button
        tabBtns.forEach((b) => {
            b.classList.remove("bg-primary", "text-white");
            b.classList.add("text-gray-600");
        });
        btn.classList.add("bg-primary", "text-white");
        btn.classList.remove("text-gray-600");

        // Update active tab content
        tabContents.forEach((content) => {
            content.classList.remove("active");
        });
        document.getElementById(tabId).classList.add("active");
    });
});

// FAQ Accordion
const faqQuestions = document.querySelectorAll(".faq-question");

faqQuestions.forEach((question) => {
    question.addEventListener("click", () => {
        const answer = question.nextElementSibling;
        const icon = question.querySelector("i");

        // Toggle answer visibility
        answer.classList.toggle("hidden");

        // Toggle icon
        if (answer.classList.contains("hidden")) {
            icon.classList.remove("fa-minus");
            icon.classList.add("fa-plus");
        } else {
            icon.classList.remove("fa-plus");
            icon.classList.add("fa-minus");
        }
    });
});

// Form Submission
const orderForm = document.getElementById("orderForm");
const formMessage = document.getElementById("formMessage");

orderForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Get form data
    const formData = new FormData(orderForm);
    const name = formData.get("name");
    const phone = formData.get("phone");
    const email = formData.get("email");
    const address = formData.get("address");
    const product = formData.get("product");
    const quantity = formData.get("quantity");
    const message = formData.get("message");

    // Calculate total
    let total = 0;
    if (cart.length > 0) {
        cart.forEach((item) => {
            total += item.price * item.quantity;
        });
    }

    // Send data to Google Sheet
    fetch("https://script.google.com/macros/s/YOUR_GOOGLE_SCRIPT_ID/exec", {
        method: "POST",
        body: formData,
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.result === "success") {
                // Show success message
                formMessage.textContent =
                    "Cảm ơn bạn đã đặt hàng! Chúng tôi sẽ liên hệ với bạn sớm nhất.";
                formMessage.classList.add("bg-green-100", "text-green-700");
                formMessage.classList.remove("bg-red-100", "text-red-700");
                formMessage.classList.remove("hidden");

                // Reset form and cart
                orderForm.reset();
                cart = [];
                updateCart();

                // Track Facebook conversion
                fbq("track", "Purchase", {
                    value: total,
                    currency: "VND",
                    content_name: product,
                });

                // Track TikTok conversion
                ttq.track("PlaceAnOrder", {
                    content_type: "product",
                    content_name: product,
                    value: total,
                    currency: "VND",
                });
            } else {
                // Show error message
                formMessage.textContent = "Đã xảy ra lỗi. Vui lòng thử lại sau.";
                formMessage.classList.add("bg-red-100", "text-red-700");
                formMessage.classList.remove("bg-green-100", "text-green-700");
                formMessage.classList.remove("hidden");
            }
        })
        .catch((error) => {
            console.error("Error:", error);
            // Show error message
            formMessage.textContent = "Đã xảy ra lỗi. Vui lòng thử lại sau.";
            formMessage.classList.add("bg-red-100", "text-red-700");
            formMessage.classList.remove("bg-green-100", "text-green-700");
            formMessage.classList.remove("hidden");
        });

    // Send data to email (using Formspree as an example)
    fetch("https://formspree.io/f/your-formspree-id", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: name,
            phone: phone,
            email: email,
            address: address,
            product: product,
            quantity: quantity,
            message: message,
            total: total,
        }),
    });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
        e.preventDefault();

        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 80,
                behavior: "smooth",
            });
        }
    });
});

// Countdown Timer
function updateCountdown() {
    // Set the date we're counting down to (7 days from now)
    const countDownDate = new Date();
    countDownDate.setDate(countDownDate.getDate() + 7);

    // Update the count down every 1 second
    const x = setInterval(function () {
        // Get today's date and time
        const now = new Date().getTime();

        // Find the distance between now and the count down date
        const distance = countDownDate - now;

        // Time calculations for days, hours, minutes and seconds
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
            (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
            (distance % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Display the result
        document.getElementById("days").innerText = days
            .toString()
            .padStart(2, "0");
        document.getElementById("hours").innerText = hours
            .toString()
            .padStart(2, "0");
        document.getElementById("minutes").innerText = minutes
            .toString()
            .padStart(2, "0");
        document.getElementById("seconds").innerText = seconds
            .toString()
            .padStart(2, "0");

        // If the count down is finished, write some text
        if (distance < 0) {
            clearInterval(x);
            document.getElementById("days").innerText = "00";
            document.getElementById("hours").innerText = "00";
            document.getElementById("minutes").innerText = "00";
            document.getElementById("seconds").innerText = "00";
        }
    }, 1000);
}

updateCountdown();

// Video Play/Pause Functionality
const video = document.getElementById('koc-video');
const playOverlay = document.getElementById('play-overlay');
const replayBtn = document.getElementById('replay-video');

// Play video when clicking on overlay
playOverlay.addEventListener('click', () => {
    video.play();
    playOverlay.style.display = 'none';
});

// Show overlay when video is paused
video.addEventListener('pause', () => {
    if (video.currentTime > 0 && !video.ended) {
        playOverlay.style.display = 'flex';
    }
});

// Hide overlay when video is playing
video.addEventListener('play', () => {
    playOverlay.style.display = 'none';
});

// Show overlay when video ends
video.addEventListener('ended', () => {
    playOverlay.style.display = 'flex';
});

// Replay video
replayBtn.addEventListener('click', () => {
    video.currentTime = 0;
    video.play();
    playOverlay.style.display = 'none';

    // Scroll to video
    document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
});

document.addEventListener('DOMContentLoaded', function () {
    // Carousel functionality
    const carousel = document.getElementById('results-carousel');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const indicators = document.querySelectorAll('.indicator');
    let currentSlide = 0;
    const totalSlides = 3;

    // Update carousel position
    function updateCarousel() {
        carousel.style.transform = `translateX(-${currentSlide * 100}%)`;

        // Update indicators
        indicators.forEach((indicator, index) => {
            if (index === currentSlide) {
                indicator.classList.add('active');
                indicator.classList.remove('bg-gray-300');
            } else {
                indicator.classList.remove('active');
                indicator.classList.add('bg-gray-300');
            }
        });
    }

    // Next slide
    nextBtn.addEventListener('click', () => {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateCarousel();
    });

    // Previous slide
    prevBtn.addEventListener('click', () => {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        updateCarousel();
    });

    // Indicator click
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            currentSlide = index;
            updateCarousel();
        });
    });

    // Auto-play carousel
    setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateCarousel();
    }, 5000);

    // Touch support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    carousel.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        if (touchEndX < touchStartX - 50) {
            // Swipe left
            currentSlide = (currentSlide + 1) % totalSlides;
            updateCarousel();
        }

        if (touchEndX > touchStartX + 50) {
            // Swipe right
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            updateCarousel();
        }
    }
});