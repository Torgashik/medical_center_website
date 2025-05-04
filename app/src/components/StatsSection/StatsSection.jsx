import React, { useState, useEffect } from 'react';
import './StatsSection.css';
import doctorIcon from '../../assets/icons/doctor.png';
import patientIcon from '../../assets/icons/patient.png';
import biometricsIcon from '../../assets/icons/biometrics.png';
import { api } from '../../services/api';

const StatsSection = () => {
  const [doctorsCount, setDoctorsCount] = useState(0);
  const [patientsCount, setPatientsCount] = useState(0);
  const [biometricsCount, setBiometricsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Фиктивные данные для неавторизованных пользователей
  const fakeStats = {
    doctors: 127,
    patients: 842,
    biometrics: 35600
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get('/users/me');
        setIsAuthorized(true);
      } catch (error) {
        setIsAuthorized(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        if (isAuthorized) {
          const stats = await api.get('/stats');
          setDoctorsCount(stats.doctors);
          setPatientsCount(stats.patients);
          setBiometricsCount(stats.biometrics);
        } else {
          setDoctorsCount(fakeStats.doctors);
          setPatientsCount(fakeStats.patients);
          setBiometricsCount(fakeStats.biometrics);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        // В случае ошибки показываем фиктивные данные
        setDoctorsCount(fakeStats.doctors);
        setPatientsCount(fakeStats.patients);
        setBiometricsCount(fakeStats.biometrics);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAuthorized]);

  if (loading) {
    return (
      <section className="stats-section">
        <div className="stats-container">
          <div className="stats-grid">
            <div className="stat-card">Загрузка...</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="stats-section">
      <div className="stats-container">
        <div className="stats-grid">
          <div className="stat-card">
            <img src={doctorIcon} alt="Врачи" className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">{doctorsCount}+</span>
              <span className="stat-label">Врачей</span>
            </div>
          </div>
          <div className="stat-card">
            <img src={patientIcon} alt="Пациенты" className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">{patientsCount}+</span>
              <span className="stat-label">Пациентов</span>
            </div>
          </div>
          <div className="stat-card">
            <img src={biometricsIcon} alt="Биометрия" className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">{biometricsCount}</span>
              <span className="stat-label">Биометрических исследований</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;