import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import logo from '../../assets/images/logo.png';
import phoneIcon from '../../assets/icons/phone.png';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <img src={logo} alt="Логотип клиники" className="logo-image" />
          <div className="logo-text">
            <div>Центр</div>
            <div>клинической</div>
            <div>медицины</div>
          </div>
          <div className="vertical-divider"></div>
          <div className="motto">
            <div>Терапия</div>
            <div>Цифровизация</div>
            <div>Биометрия</div>
          </div>
        </Link>
        <div className="contacts">
          <div className="contact-item">
            <div>Контактный центр</div>
            <a href="tel:+78001234567">
              <img src={phoneIcon} alt="Телефон" className="phone-icon" />
              8 (800) 123-45-67
            </a>
          </div>
          <div className="contact-item">
            <div>Скорая помощь</div>
            <a href="tel:+78001234568">
              <img src={phoneIcon} alt="Телефон" className="phone-icon" />
              8 (800) 123-45-68
            </a>
          </div>
        </div>
        <div className="auth">
          <Link to="/login" className="login-btn">Вход</Link>
          <Link to="/register" className="register-btn">Регистрация</Link>
        </div>
      </div>
    </header>
  );
};

export default Header; 