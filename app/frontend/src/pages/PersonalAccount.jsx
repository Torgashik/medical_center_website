import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './PersonalAccount.css';

const PersonalAccount = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await api.get('/users/me');
        setUserData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Проверка размера файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Размер файла не должен превышать 5MB');
      return;
    }

    // Проверка типа файла
    if (!file.type.match(/image\/(jpeg|png|jpg)/)) {
      setError('Поддерживаются только файлы формата JPEG, JPG или PNG');
      return;
    }

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await api.put('/users/me/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Перезагружаем страницу после успешной загрузки фото
      window.location.reload();
    } catch (err) {
      setError('Ошибка при загрузке фото. Пожалуйста, попробуйте позже.');
      console.error('Photo upload error:', err);
    }
  };

  if (loading) {
    return <div className="personal-account loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="personal-account error">{error}</div>;
  }

  return (
    <div className="personal-account">
      <h1>Личный кабинет</h1>
      <div className="profile-container">
        <div className="photo-section">
          <div className="photo-wrapper">
            <img
              src={userData?.photo ? `http://78.24.223.206:8001${userData.photo}` : '/default-doctor.png'}
              alt="Фото профиля"
              className="profile-photo"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/default-doctor.png';
              }}
            />
            <label className="photo-upload-button">
              Изменить фото
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
        <div className="info-section">
          <div className="info-item">
            <span className="label">Имя:</span>
            <span className="value">{userData?.first_name}</span>
          </div>
          <div className="info-item">
            <span className="label">Фамилия:</span>
            <span className="value">{userData?.last_name}</span>
          </div>
          <div className="info-item">
            <span className="label">Email:</span>
            <span className="value">{userData?.email}</span>
          </div>
          <div className="info-item">
            <span className="label">Телефон:</span>
            <span className="value">{userData?.phone}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalAccount; 