import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import './Header.css';
import logo from '../../assets/images/logo.png';
import phoneIcon from '../../assets/icons/phone.png';

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPatient, setIsPatient] = useState(false);
  const [isDoctor, setIsDoctor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoggedIn(false);
        setIsAdmin(false);
        setIsPatient(false);
        setIsDoctor(false);
        setIsLoading(false);
        return;
      }

      try {
        const user = await api.get('/users/me');
        setIsLoggedIn(true);
        setIsAdmin(user.role === 'admin');
        setIsPatient(user.role === 'patient');
        setIsDoctor(user.role === 'doctor');
      } catch (error) {
        console.error('Error checking auth status:', error);
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setIsAdmin(false);
        setIsPatient(false);
        setIsDoctor(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setIsPatient(false);
    setIsDoctor(false);
    navigate('/');
  };

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
        <div className="auth-buttons">
          {!isLoading && (
            isLoggedIn ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="auth-button admin">
                    Админ панель
                  </Link>
                )}
                {isPatient && (
                  <>
                    <Link to="/appointments" className="auth-button">
                      Записаться на приём
                    </Link>
                    <Link to="/personal-account" className="auth-button">
                      Личный кабинет
                    </Link>
                  </>
                )}
                {isDoctor && (
                  <Link to="/doctor-appointments" className="auth-button">
                    Приёмы
                  </Link>
                )}
                <button onClick={handleLogout} className="auth-button logout">
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="auth-button">
                  Войти
                </Link>
                <Link to="/register" className="auth-button">
                  Регистрация
                </Link>
              </>
            )
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 