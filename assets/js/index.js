
// Script để auto play video khi scroll và pause khi scroll ra khỏi viewport
function initVideoAutoPlay() {
    let userHasInteracted = false;

    // Theo dõi user interaction để enable autoplay
    function enableAutoplay() {
        userHasInteracted = true;
        document.removeEventListener('click', enableAutoplay);
        document.removeEventListener('touchstart', enableAutoplay);
        document.removeEventListener('keydown', enableAutoplay);
    }

    // Lắng nghe các sự kiện user interaction
    document.addEventListener('click', enableAutoplay);
    document.addEventListener('touchstart', enableAutoplay);
    document.addEventListener('keydown', enableAutoplay);

    // Lấy tất cả iframe video
    const videoIframes = document.querySelectorAll('iframe[src*="youtube.com"]');

    // Intersection Observer để theo dõi khi video vào/ra khỏi viewport
    const observerOptions = {
        root: null,
        rootMargin: '-100px 0px -100px 0px', // Chỉ trigger khi video thực sự visible
        threshold: 0.3 // Video sẽ play khi 30% xuất hiện trên màn hình
    };

    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const iframe = entry.target;

            if (entry.isIntersecting) {
                // Video vào viewport
                setTimeout(() => {
                    playVideo(iframe);
                }, 500); // Delay 500ms để đảm bảo iframe đã sẵn sàng
            } else {
                // Video ra khỏi viewport - pause
                pauseVideo(iframe);
            }
        });
    }, observerOptions);

    // Setup và observe tất cả video iframes
    videoIframes.forEach((iframe, index) => {
        // Cập nhật URL với các parameter cần thiết
        let src = iframe.src;
        const hasQuery = src.includes('?');
        const params = [
            'enablejsapi=1',
            'autoplay=1',
            'mute=1', // Bắt đầu với mute để bypass autoplay policy
            'controls=1',
            'rel=0'
        ];

        if (!hasQuery) {
            iframe.src = src + '?' + params.join('&');
        } else {
            // Kiểm tra và thêm các parameter chưa có
            params.forEach(param => {
                const [key] = param.split('=');
                if (!src.includes(key + '=')) {
                    iframe.src += '&' + param;
                }
            });
        }

        // Thêm thuộc tính để identify
        iframe.setAttribute('data-video-index', index);

        // Observe iframe
        videoObserver.observe(iframe);
    });

    // Function để play video với fallback strategy
    function playVideo(iframe) {
        try {
            // Strategy 1: Thử play với unmute nếu user đã tương tác
            if (userHasInteracted) {
                iframe.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', '*');
                setTimeout(() => {
                    iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                }, 100);
            } else {
                // Strategy 2: Play muted trước, sẽ unmute sau khi user tương tác
                iframe.contentWindow.postMessage('{"event":"command","func":"mute","args":""}', '*');
                setTimeout(() => {
                    iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                }, 100);
            }

            console.log('Attempting to play video');
        } catch (error) {
            console.log('Không thể play video:', error);

            // Fallback: Tạo click event giả lập
            fallbackPlay(iframe);
        }
    }

    // Function để pause video
    function pauseVideo(iframe) {
        try {
            iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        } catch (error) {
            console.log('Không thể pause video:', error);
        }
    }

    // Function để reset video về đầu
    function resetVideo(iframe) {
        try {
            // Pause video trước
            iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
            // Reset về thời điểm 0
            setTimeout(() => {
                iframe.contentWindow.postMessage('{"event":"command","func":"seekTo","args":[0, true]}', '*');
            }, 100);
        } catch (error) {
            console.log('Không thể reset video:', error);
        }
    }

    // Fallback method khi postMessage không hoạt động
    function fallbackPlay(iframe) {
        // Tạo overlay button để simulate user click
        const overlay = createPlayOverlay(iframe);
        if (overlay) {
            setTimeout(() => {
                overlay.click();
            }, 200);
        }
    }

    // Tạo invisible overlay để trigger autoplay
    function createPlayOverlay(iframe) {
        const existingOverlay = iframe.parentNode.querySelector('.video-overlay');
        if (existingOverlay) return existingOverlay;

        const overlay = document.createElement('div');
        overlay.className = 'video-overlay';
        overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      z-index: 10;
      cursor: pointer;
      pointer-events: auto;
    `;

        overlay.onclick = function () {
            iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
            if (userHasInteracted) {
                iframe.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', '*');
            }
            overlay.style.display = 'none';
        };

        // Đảm bảo parent có position relative
        if (iframe.parentNode.style.position !== 'relative') {
            iframe.parentNode.style.position = 'relative';
        }

        iframe.parentNode.appendChild(overlay);
        return overlay;
    }

    // Listen for user interaction để unmute videos đang play
    document.addEventListener('click', function () {
        if (userHasInteracted) {
            videoIframes.forEach(iframe => {
                try {
                    iframe.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', '*');
                } catch (error) {
                    // Silent fail
                }
            });
        }
    }, { once: true });

    // Export functions để có thể sử dụng từ bên ngoài
    window.videoControls = {
        playVideo,
        pauseVideo,
        resetVideo
    };
}

// Xử lý details toggle với video reset
function initDetailsVideoHandler() {
    const detailsElements = document.querySelectorAll('details');

    detailsElements.forEach(details => {
        details.addEventListener('toggle', function () {
            const videoIframes = this.querySelectorAll('iframe[src*="youtube.com"]');

            if (this.open) {
                // Khi mở details - không cần làm gì, video sẽ tự play theo Intersection Observer
                console.log('Details opened');
            } else {
                // Khi đóng details - reset tất cả video trong details này
                videoIframes.forEach(iframe => {
                    if (window.videoControls) {
                        window.videoControls.resetVideo(iframe);
                    }
                });
                console.log('Details closed - videos reset');
            }
        });

        // Xử lý khi details được mở lại
        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'open') {
                    const details = mutation.target;
                    if (details.open) {
                        // Details vừa được mở - reset video về đầu
                        const videoIframes = details.querySelectorAll('iframe[src*="youtube.com"]');
                        videoIframes.forEach(iframe => {
                            if (window.videoControls) {
                                setTimeout(() => {
                                    window.videoControls.resetVideo(iframe);
                                }, 300); // Delay để đảm bảo details đã mở hoàn toàn
                            }
                        });
                    }
                }
            });
        });

        observer.observe(details, {
            attributes: true,
            attributeFilter: ['open']
        });
    });
}

// Khởi chạy khi DOM đã load xong
document.addEventListener('DOMContentLoaded', function () {
    initVideoAutoPlay();
    initDetailsVideoHandler();
});

// Backup: Khởi chạy lại sau 1 giây để đảm bảo iframe đã load
setTimeout(function () {
    initVideoAutoPlay();
    initDetailsVideoHandler();
}, 1000);



// filepath: d:\Code_HTML\Freelancer\Balaskin\index2.html
// Countdown 15 phút, reset về 0 khi hết
function startCountdown(duration) {
    let timer = duration,
        days,
        hours,
        minutes,
        seconds;
    setInterval(function () {
        days = Math.floor(timer / (60 * 60 * 24));
        hours = Math.floor((timer % (60 * 60 * 24)) / 3600);
        minutes = Math.floor((timer % 3600) / 60);
        seconds = timer % 60;

        document.getElementById("cd-day").textContent = days
            .toString()
            .padStart(2, "0");
        document.getElementById("cd-hour").textContent = hours
            .toString()
            .padStart(2, "0");
        document.getElementById("cd-min").textContent = minutes
            .toString()
            .padStart(2, "0");
        document.getElementById("cd-sec").textContent = seconds
            .toString()
            .padStart(2, "0");

        if (--timer < 0) {
            timer = 0;
            document.getElementById("cd-day").textContent = "00";
            document.getElementById("cd-hour").textContent = "00";
            document.getElementById("cd-min").textContent = "00";
            document.getElementById("cd-sec").textContent = "00";
        }
    }, 1000);
}
// 15 phút = 900 giây
startCountdown(900);

// Back to top
const btnTop = document.getElementById("backToTop");
window.addEventListener("scroll", () => {
    btnTop.style.display = window.scrollY > 200 ? "flex" : "none";
});
btnTop.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });



function isValidPhone(phone) {
    // Bắt đầu bằng số 0, gồm đúng 10 số
    return /^0\d{9}$/.test(phone);
}

// Xử lý submit form: gửi về Google Sheet và email (Formspree)
document.getElementById("leadForm").onsubmit = async function (e) {
    e.preventDefault();
    const form = e.target;
    const msg = document.getElementById("formMsg");

    // Kiểm tra số điện thoại
    if (!isValidPhone(form.phone.value.trim())) {
        msg.textContent = "Vui lòng nhập số điện thoại hợp lệ (10 số, bắt đầu bằng 0).";
        return;
    }

    msg.textContent = "Đang gửi...";

    // Lấy dữ liệu form
    const data = {
        name: form.name.value,
        phone: form.phone.value,
        address: form.address.value,
        product: form.product.value,
    };

    // Gửi về Google Sheet qua SheetDB
    fetch("https://sheetdb.io/api/v1/fwymewo4i0e83", {
        // Thay xxxxxx bằng API ID của bạn
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: data }),
    })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then(() => {
            form.reset();
            document.getElementById("thankyouPopup").classList.remove("hidden");
        })
        .catch(() => {
            msg.textContent =
                "Có lỗi xảy ra, vui lòng thử lại hoặc liên hệ hotline.";
        });

    // Gửi về email qua Formspree (nếu muốn)
    fetch("https://formspree.io/f/mnnbbvqq", {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
    });
};

// Đóng popup
document.getElementById("closeThankyou").onclick = function () {
    document.getElementById("thankyouPopup").classList.add("hidden");
};

// Danh sách ảnh trước/sau
const carouselData = [
    {
        before: "/img/feeback/ngoc-truoc.jpg",
        after: "/img/feeback/ngoc-sau.jpg",
    },
    {
        before: "/img/feeback/ni-truoc.jpg",
        after: "/img/feeback/ni-sau.jpg",
    },
    {
        before: "/img/feeback/vo-truoc.jpg",
        after: "/img/feeback/vo-sau.jpg",
    },
    {
        before: "/img/feeback/ngoc-truoc.jpg",
        after: "/img/feeback/ngoc-sau.jpg",
    },
    {
        before: "/img/feeback/ni-truoc.jpg",
        after: "/img/feeback/ni-sau.jpg",
    },
];

let currentIndex = 0;
let thumbStart = 0;
const thumbVisible = 4; // Số lượng thumbnail hiển thị cùng lúc

// Render thumbnails
const thumbsContainer = document.getElementById("carouselThumbs");
const thumbTemplate = document.getElementById("carouselThumbTemplate");

function renderThumbs() {
    thumbsContainer.innerHTML = "";
    for (
        let i = thumbStart;
        i < Math.min(thumbStart + thumbVisible, carouselData.length);
        i++
    ) {
        const item = carouselData[i];
        const node = thumbTemplate.content.cloneNode(true);
        const imgs = node.querySelectorAll("img");
        imgs[0].src = item.before;
        imgs[1].src = item.after;
        node.firstElementChild.classList.toggle("active", i === currentIndex);
        node.firstElementChild.onclick = () => setCarousel(i);
        thumbsContainer.appendChild(node);
    }
}

// Hiển thị ảnh lớn
function setCarousel(idx) {
    currentIndex = idx;
    document.getElementById("mainImgBefore").src = carouselData[idx].before;
    document.getElementById("mainImgAfter").src = carouselData[idx].after;
    // Active thumbnail
    renderThumbs();
}

// Điều hướng main carousel (có vòng lặp)
document.getElementById("carouselPrev").onclick = function () {
    if (currentIndex > 0) {
        setCarousel(currentIndex - 1);
        if (currentIndex < thumbStart) {
            thumbStart = currentIndex;
            renderThumbs();
        }
    } else {
        // Quay về ảnh cuối cùng
        setCarousel(carouselData.length - 1);
        thumbStart = Math.max(0, carouselData.length - thumbVisible);
        renderThumbs();
    }
};
document.getElementById("carouselNext").onclick = function () {
    if (currentIndex < carouselData.length - 1) {
        setCarousel(currentIndex + 1);
        if (currentIndex > thumbStart + thumbVisible - 1) {
            thumbStart = currentIndex - thumbVisible + 1;
            renderThumbs();
        }
    } else {
        // Quay về ảnh đầu tiên
        setCarousel(0);
        thumbStart = 0;
        renderThumbs();
    }
};

// Điều hướng thumbnail carousel (có vòng lặp)
document.getElementById("thumbPrev").onclick = function () {
    if (thumbStart > 0) {
        thumbStart--;
        renderThumbs();
    } else {
        // Quay về cuối
        thumbStart = Math.max(0, carouselData.length - thumbVisible);
        renderThumbs();
    }
};
document.getElementById("thumbNext").onclick = function () {
    if (thumbStart < carouselData.length - thumbVisible) {
        thumbStart++;
        renderThumbs();
    } else {
        // Quay về đầu
        thumbStart = 0;
        renderThumbs();
    }
};

// Click thumbnail
setCarousel(0);

// Phóng to khi click ảnh lớn
document.getElementById("carouselMain").onclick = function () {
    document.getElementById("zoomImgBefore").src =
        carouselData[currentIndex].before;
    document.getElementById("zoomImgAfter").src =
        carouselData[currentIndex].after;
    document.getElementById("zoomModal").classList.remove("hidden");
};
document.getElementById("closeZoom").onclick = function () {
    document.getElementById("zoomModal").classList.add("hidden");
};
// Đóng modal khi click nền
document.getElementById("zoomModal").onclick = function (e) {
    if (e.target === this) this.classList.add("hidden");
};

// Khởi tạo thumbnails ban đầu
renderThumbs();
