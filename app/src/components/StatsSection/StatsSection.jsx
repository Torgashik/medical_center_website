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

  // Фиктивные данные для биометрии
  const biometricsValue = 35600;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [patientsData, doctorsData] = await Promise.all([
          api.get('/users?role=patient'),
          api.get('/users?role=doctor')
        ]);
        
        setPatientsCount(patientsData.length);
        setDoctorsCount(doctorsData.length);
        setBiometricsCount(biometricsValue);
      } catch (error) {
        console.error('Error fetching stats:', error);
        // В случае ошибки показываем фиктивные данные
        setPatientsCount(842);
        setDoctorsCount(127);
        setBiometricsCount(biometricsValue);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <section className="stats-section">
      <div className="stats-container">
        <div className="stats-grid">
          <div className="stat-card">
            <img src={doctorIcon} alt="Врачи" className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">{doctorsCount}+</span>
              <span className="stat-label">Квалифицированных врачей</span>
            </div>
          </div>
          
          <div className="stat-card">
            <img src={patientIcon} alt="Пациенты" className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">{patientsCount}</span>
              <span className="stat-label">Пациентов проходят лечение</span>
            </div>
          </div>
          
          <div className="stat-card">
            <img src={biometricsIcon} alt="Биометрия" className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">{biometricsCount.toLocaleString()}</span>
              <span className="stat-label">Биометрических данных</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;