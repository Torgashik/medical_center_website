import React, { useState, useEffect } from 'react';
import './StatsSection.css';
import doctorIcon from '../../assets/icons/doctor.png';
import patientIcon from '../../assets/icons/patient.png';
import biometricsIcon from '../../assets/icons/biometrics.png';

const StatsSection = () => {
  const [doctorsCount, setDoctorsCount] = useState(0);
  const [patientsCount, setPatientsCount] = useState(0);
  const [biometricsCount, setBiometricsCount] = useState(0);

  // Фиктивные данные (позже заменим на реальные из БД)
  const targetValues = {
    doctors: 127,
    patients: 842,
    biometrics: 35600
  };

  // Анимация увеличения чисел
  useEffect(() => {
    const duration = 2000; // 2 секунды на анимацию
    const step = 20; // Частота обновления (мс)
    
    const animateValue = (setValue, target) => {
      let start = 0;
      const increment = target / (duration / step);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          setValue(target);
          clearInterval(timer);
        } else {
          setValue(Math.floor(start));
        }
      }, step);
    };

    animateValue(setDoctorsCount, targetValues.doctors);
    animateValue(setPatientsCount, targetValues.patients);
    animateValue(setBiometricsCount, targetValues.biometrics);
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