import React, { useState, useEffect, useCallback } from 'react';
import './Carousel.css';
import image1 from '../../assets/images/building.jpg';
import image2 from '../../assets/images/newmed.jpg';
import image3 from '../../assets/images/prof.jpeg';
import image4 from '../../assets/images/reab.jpg';
import image5 from '../../assets/images/bio.jpg'

const Carousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  
  const slides = [
    {
      image: image1,
      text: "Современный больничный комплекс"
    },
    {
      image: image2,
      text: "Комфортные условия для пациентов"
    },
    {
      image: image3,
      text: "Команда профессиональных врачей мирового уровня"
    },
    {
        image: image4,
        text: "Широкий спектр реабилитационных услуг"
    },
    {
        image: image5,
        text: "Биометрические услуги любой сложности"
    },
  ];

  // Функция для перехода к конкретному слайду
  const goToSlide = useCallback((index) => {
    if (!transitioning && index !== currentIndex) {
      setTransitioning(true);
      setCurrentIndex(index);
    }
  }, [transitioning, currentIndex]);

  // Функция для перехода к следующему слайду
  const goToNextSlide = useCallback(() => {
    goToSlide((currentIndex + 1) % slides.length);
  }, [currentIndex, slides.length, goToSlide]);

  // Эффект для автоперелистывания
  useEffect(() => {
    const interval = setInterval(() => {
      goToNextSlide();
    }, 5000); // Интервал 5 секунд
    
    return () => clearInterval(interval);
  }, [goToNextSlide]);

  // Сброс состояния анимации после завершения
  useEffect(() => {
    if (transitioning) {
      const timer = setTimeout(() => {
        setTransitioning(false);
      }, 600); // Должно соответствовать длительности анимации в CSS
      return () => clearTimeout(timer);
    }
  }, [transitioning]);

  return (
    <div className="carousel-container">
      <div className="main-image-container">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`slide ${index === currentIndex ? 'active' : ''} ${
              transitioning ? 'transitioning' : ''
            }`}
            style={{ backgroundImage: `url(${slide.image})` }}
          />
        ))}
        
        <div className="left-panel">
          <div className="panel-content">
            <p>{slides[currentIndex].text}</p>
          </div>
        </div>
        
        <div className="right-panel"></div>
      </div>
      
      <div className="dots-container">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;