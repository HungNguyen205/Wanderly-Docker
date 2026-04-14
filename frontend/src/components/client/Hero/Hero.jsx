import React, { useState, useEffect, useRef } from "react";
import "./Hero.css";

const Hero = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);
    const autoPlayRef = useRef(null);
    const animationDuration = 300; // 0.9s (giữ nguyên thời gian animation để đồng bộ các phần tử khác)

    const images = [
        {
            url: "https://static-images.vnncdn.net/files/publish/2022/7/27/ha-long-bay-1-852.jpg",
            title: "Ha Long Bay",
            description: "Ha Long Bay is a UNESCO wonder with thousands of limestone islands emerging from emerald waters.",
        },
        {
            url: "https://phunugioi.com/wp-content/uploads/2021/10/Hinh-anh-Hoi-An-1.jpg",
            title: "Hoi An",
            description: "Hoi An is an ancient town renowned for its well-preserved architecture and colorful lanterns.",
        },
        {
            url: "https://www.thegioicombo.vn/uploads/AN-GIANG/CHUA-HANG/THIEN-AM/5-min.jpg",
            title: "Hang Pagoda",
            description: "Hang Pagoda is located in a large cave, creating a unique spiritual space blending with nature.",
        },
        {
            url: "https://img4.thuthuatphanmem.vn/uploads/2020/12/26/anh-phong-nha-ke-bang-huyen-ao_101202393.jpg",
            title: "Phong Nha Cave",
            description: "Phong Nha-Ke Bang National Park features spectacular caves and underground rivers in pristine jungle.",
        },
        {
            url: "https://haycafe.vn/wp-content/uploads/2022/01/Hinh-anh-Da-Lat-canh-suong-mu-ban-dem.jpg",
            title: "Da Lat",
            description: "Da Lat is famous for its cool climate, pine forests, and romantic French colonial architecture.",
        }
    ];

    // Auto play
    useEffect(() => {
        if (isPlaying && !isAnimating) {
            autoPlayRef.current = setInterval(() => nextSlide(), 3500);
        } else {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        }
        return () => autoPlayRef.current && clearInterval(autoPlayRef.current);
    }, [isPlaying, isAnimating]);

    // Chuyển slide
    const goToSlide = (index) => {
        if (isAnimating || index === currentIndex) return;

        setIsAnimating(true);

        // Cập nhật DOM (controls, progress bar, text overlay)
        const prevArrow = document.getElementById('prevArrow');
        const nextArrow = document.getElementById('nextArrow');
        const progressBar = document.getElementById('progressBar');
        const textOverlay = document.getElementById('textOverlay');
        const slideImage = document.getElementById('slideImage');

        // Vô hiệu hóa controls và reset progress bar
        if (prevArrow) prevArrow.disabled = true;
        if (nextArrow) nextArrow.disabled = true;
        if (progressBar) {
            progressBar.classList.remove('active');
            progressBar.classList.add('reset');
        }
        if (textOverlay) textOverlay.classList.add('hiding');
        if (slideImage) slideImage.classList.add('fading-out'); // Kích hoạt hiệu ứng mờ

        // Đợi animation mờ dần và chuyển ảnh (900ms)
        setTimeout(() => {
            setCurrentIndex(index); // Chuyển sang ảnh mới

            // Cập nhật text overlay
            const newImage = images[index];
            const titleEl = document.getElementById('slideTitle');
            const descriptionEl = document.getElementById('slideDescription');
            if (titleEl && descriptionEl) {
                titleEl.textContent = newImage.title;
                descriptionEl.textContent = newImage.description;
            }
            if (textOverlay) textOverlay.classList.remove('hiding');
            if (slideImage) slideImage.classList.remove('fading-out'); // Kết thúc mờ, ảnh mới hiện ra

            // Kích hoạt lại
            if (prevArrow) prevArrow.disabled = false;
            if (nextArrow) nextArrow.disabled = false;

            if (isPlaying && progressBar) {
                setTimeout(() => {
                    progressBar.classList.remove('reset');
                    progressBar.classList.add('active');
                }, 50);
            }

            setIsAnimating(false);
        }, animationDuration);
    };

    const nextSlide = () => {
        const nextIndex = (currentIndex + 1) % images.length;
        goToSlide(nextIndex);
    };

    const prevSlide = () => {
        const prevIndex = (currentIndex - 1 + images.length) % images.length;
        goToSlide(prevIndex);
    };

    const toggleAutoPlay = () => setIsPlaying(!isPlaying);
    const currentImage = images[currentIndex];

    return (
        <section id="home" className="hero">
            <div className="slider-container">
                {/* progress bar */}
                <div className="progress-ring">
                    <div
                        className={`progress-bar ${isPlaying && !isAnimating ? "active" : "reset"}`}
                        id="progressBar"
                    ></div>
                </div>

                {/* stage: Chỉ là một div đơn giản cho hiệu ứng fade */}
                <div className="slider-stage">
                    <div
                        id="slideImage"
                        className="simple-slide-image"
                        style={{ backgroundImage: `url(${currentImage.url})` }}
                    ></div>
                </div>

                {/* text overlay */}
                <div className={`text-overlay ${isAnimating ? "hiding" : ""}`} id="textOverlay">
                    <h2 className="slide-title" id="slideTitle">{currentImage.title}</h2>
                    <p className="slide-description" id="slideDescription">{currentImage.description}</p>
                </div>

                {/* arrows */}
                <button
                    className="nav-arrow prev"
                    id="prevArrow"
                    onClick={prevSlide}
                    aria-label="Previous"
                    disabled={isAnimating}
                ></button>
                <button
                    className="nav-arrow next"
                    id="nextArrow"
                    onClick={nextSlide}
                    aria-label="Next"
                    disabled={isAnimating}
                ></button>

                {/* play / pause & dots & thumbnails (Giữ nguyên) */}
                <div className="controls">
                    <button
                        className={`control-btn play-pause-btn ${isPlaying ? "" : "paused"}`}
                        id="playPauseBtn"
                        onClick={toggleAutoPlay}
                        title="Play/Pause"
                    >
                        <span className="play-icon"></span>
                        <span className="pause-icon"></span>
                    </button>
                </div>

                <div className="dots" id="dots">
                    {images.map((_, index) => (
                        <div
                            key={index}
                            className={`dot ${index === currentIndex ? "active" : ""}`}
                            onClick={() => goToSlide(index)}
                        ></div>
                    ))}
                </div>

                <div className="thumbnails-container" id="thumbnails">
                    {images.map((img, index) => (
                        <div
                            key={index}
                            className={`thumbnail ${index === currentIndex ? "active" : ""}`}
                            style={{ backgroundImage: `url(${img.url})` }}
                            onClick={() => goToSlide(index)}
                        ></div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Hero;