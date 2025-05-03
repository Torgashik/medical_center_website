import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './AuthPages.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Здесь будет логика входа
    console.log('Login data:', formData);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Вход в личный кабинет</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Введите ваш email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Введите ваш пароль"
            />
          </div>
          <button type="submit" className="auth-button">Войти</button>
          <div className="auth-links">
            <span>Нет аккаунта? <Link to="/register">Зарегистрироваться</Link></span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage; 