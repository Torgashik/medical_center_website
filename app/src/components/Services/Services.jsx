import React from 'react';
import { FaStethoscope, FaProcedures, FaLungs, FaFingerprint, FaClipboardCheck, FaFemale, FaXRay, FaEye, FaTooth } from 'react-icons/fa';
import './Services.css';

const services = [
  {
    id: 1,
    title: 'Полный check-up организма',
    icon: <FaStethoscope />,
    description: 'Комплексное обследование организма с использованием современных методов диагностики для раннего выявления заболеваний',
  },
  {
    id: 2,
    title: 'Реабилитация после травмы',
    icon: <FaProcedures />,
    description: 'Индивидуальные программы восстановления с использованием передовых методик                                           ',
  },
  {
    id: 3,
    title: 'Реабилитация после covid-19',
    icon: <FaLungs />,
    description: 'Специализированные программы восстановления дыхательной системы и общего состояния после COVID-19',
  },
  {
    id: 4,
    title: 'Биометрия',
    icon: <FaFingerprint />,
    description: 'Создание цифрового профиля с использованием современных биометрических технологий и систем безопасности',
  },
  {
    id: 5,
    title: 'Диспансеризация',
    icon: <FaClipboardCheck />,
    description: 'Комплексное профилактическое обследование с использованием современных методов диагностики и анализов',
  },
  {
    id: 6,
    title: 'Женское здоровье',
    icon: <FaFemale />,
    description: 'Комплексное обследование и лечение с использованием современных методик и специализированного оборудования',
  },
  {
    id: 7,
    title: 'Томография',
    icon: <FaXRay />,
    description: 'Современные методы диагностики с использованием высокоточного оборудования и передовых технологий',
  },
  {
    id: 8,
    title: 'Коррекция зрения',
    icon: <FaEye />,
    description: 'Комплексная диагностика и коррекция зрения с использованием современных методик и оборудования',
  },
  {
    id: 9,
    title: 'Стоматология',
    icon: <FaTooth />,
    description: 'Комплексное лечение и профилактика с использованием современных технологий и материалов',
  },
];

const Services = () => {
  return (
    <section className="services-section">
      <div className="container">
        <h2 className="section-title">Наши услуги</h2>
        <div className="services-grid">
          {services.map((service) => (
            <div key={service.id} className="service-card">
              <div className="service-icon">{service.icon}</div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-description">{service.description}</p>
              <button className="service-button">Узнать больше</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services; 