import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaStethoscope, FaProcedures, FaLungs, FaFingerprint, FaClipboardCheck, FaFemale, FaXRay, FaEye, FaTooth } from 'react-icons/fa';
import './Services.css';

const staticServices = [
    {
        id: 1,
        title: 'Полный check-up организма',
        description: 'Комплексное обследование организма с использованием современных методов диагностики для раннего выявления заболеваний',
        icon: <FaStethoscope />
    },
    {
        id: 2,
        title: 'Реабилитация после травмы',
        description: 'Индивидуальные программы восстановления с использованием передовых методик',
        icon: <FaProcedures />
    },
    {
        id: 3,
        title: 'Реабилитация после covid-19',
        description: 'Специализированные программы восстановления дыхательной системы и общего состояния после COVID-19',
        icon: <FaLungs />
    },
    {
        id: 4,
        title: 'Биометрия',
        description: 'Создание цифрового профиля с использованием современных биометрических технологий и систем безопасности',
        icon: <FaFingerprint />
    },
    {
        id: 5,
        title: 'Диспансеризация',
        description: 'Комплексное профилактическое обследование с использованием современных методов диагностики и анализов',
        icon: <FaClipboardCheck />
    },
    {
        id: 6,
        title: 'Женское здоровье',
        description: 'Комплексное обследование и лечение с использованием современных методик и специализированного оборудования',
        icon: <FaFemale />
    },
    {
        id: 7,
        title: 'Томография',
        description: 'Современные методы диагностики с использованием высокоточного оборудования и передовых технологий',
        icon: <FaXRay />
    },
    {
        id: 8,
        title: 'Коррекция зрения',
        description: 'Комплексная диагностика и коррекция зрения с использованием современных методик и оборудования',
        icon: <FaEye />
    },
    {
        id: 9,
        title: 'Стоматология',
        description: 'Комплексное лечение и профилактика с использованием современных технологий и материалов',
        icon: <FaTooth />
    }
];

const Services = () => {
    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [userRole, setUserRole] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUserRole(payload.role);
                fetchServices(token);
            } catch (e) {
                console.error('Error parsing token:', e);
                setServices(staticServices);
                setIsLoading(false);
            }
        } else {
            setServices(staticServices);
            setIsLoading(false);
        }
    }, []);

    const fetchServices = async (token) => {
        try {
            const response = await axios.get('http://78.24.223.206:8001/services', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setServices(response.data);
        } catch (error) {
            console.error('Error fetching services:', error);
            setError('Ошибка при загрузке услуг');
            setServices(staticServices);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLearnMore = (serviceId) => {
        if (!userRole) {
            navigate('/login');
        } else if (userRole === 'patient') {
            navigate('/appointments');
        } else if (userRole === 'doctor') {
            navigate('/doctor-appointments');
        }
    };

    if (isLoading) {
        return (
            <section className="services-section">
                <div className="container">
                    <div className="loading">Загрузка услуг...</div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="services-section">
                <div className="container">
                    <div className="error">{error}</div>
                </div>
            </section>
        );
    }

    return (
        <section className="services-section">
            <div className="container">
                <h2 className="section-title">Наши услуги</h2>
                <div className="services-grid">
                    {services.map((service) => (
                        <div key={service.id} className="service-card">
                            <div className="service-icon">
                                {service.id === 1 && <FaStethoscope />}
                                {service.id === 2 && <FaProcedures />}
                                {service.id === 3 && <FaLungs />}
                                {service.id === 4 && <FaFingerprint />}
                                {service.id === 5 && <FaClipboardCheck />}
                                {service.id === 6 && <FaFemale />}
                                {service.id === 7 && <FaXRay />}
                                {service.id === 8 && <FaEye />}
                                {service.id === 9 && <FaTooth />}
                            </div>
                            <h3 className="service-title">{service.title}</h3>
                            <p className="service-description">{service.description}</p>
                            <button 
                                className="service-button"
                                onClick={() => handleLearnMore(service.id)}
                            >
                                {!userRole ? 'Войти для записи' : 
                                 userRole === 'patient' ? 'Записаться' : 
                                 'Просмотреть записи'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Services; 