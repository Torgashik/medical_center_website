import React from 'react';
import './Footer.css';
import vkIcon from '../../assets/icons/vk.png';
import telegramIcon from '../../assets/icons/telegram.png';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section about-clinic">
          <h3>О клинике</h3>
          <p className="clinic-name">Центр клинической медицины</p>
          <p>Современное медицинское учреждение, предоставляющее широкий спектр медицинских услуг.</p>
        </div>
        <div className="footer-section">
          <h3>Контакты</h3>
          <div className="contact-info">
            <p>г. Москва, пр. Вернадского, 78</p>
            <p>
              <span>Основной:</span>
              <a href="tel:+78001234567">8 (800) 123-45-67</a>
            </p>
            <p>
              <span>Запасной:</span>
              <a href="tel:+7800123569">8 (800) 123-35-69</a>
            </p>
          </div>
        </div>
        <div className="footer-section">
          <h3>Часы работы</h3>
          <div className="working-hours">
            <p>Пн-Пт: 9:00 - 20:00</p>
            <p>Сб: 10:00 - 18:00</p>
          </div>
        </div>
        <div className="footer-section">
          <h3>Мы в соцсетях</h3>
          <div className="social-links">
            <a href="https://t.me/rtumirea_official" target="_blank" rel="noopener noreferrer">
              <img src={telegramIcon} alt="Telegram" className="social-icon" />
            </a>
            <a href="https://vk.com/mirea_official" target="_blank" rel="noopener noreferrer">
              <img src={vkIcon} alt="VK" className="social-icon" />
            </a>
          </div>
        </div>
      </div>
      <div className="copyright">
        © 2025 Центр клинической медицины. Все права защищены.
      </div>
    </footer>
  );
};

export default Footer; 