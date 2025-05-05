import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AppointmentForm.css';

const AppointmentForm = () => {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [message, setMessage] = useState('');
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchServices();
    fetchPatientAppointments();
  }, []);

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('Пожалуйста, войдите в систему для доступа к услугам');
        return;
      }

      const response = await axios.get('http://78.24.223.206:8001/services', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServices(response.data);
    } catch (error) {
      console.error('Ошибка при получении услуг:', error);
      setMessage('Ошибка при получении списка услуг');
    }
  };

  const fetchPatientAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('http://78.24.223.206:8001/appointments/patient', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatientAppointments(response.data);
    } catch (error) {
      console.error('Ошибка при получении записей:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('Пожалуйста, войдите в систему');
        return;
      }

      const response = await axios.post(
        'http://78.24.223.206:8001/appointments',
        {
          service_id: selectedService,
          appointment_date: appointmentDate
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMessage('Запись успешно создана!');
      setSelectedService('');
      setAppointmentDate('');
      fetchPatientAppointments();
    } catch (error) {
      console.error('Ошибка при создании записи:', error);
      setMessage('Ошибка при создании записи. Пожалуйста, попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Ожидает подтверждения';
      case 'accepted':
        return 'Подтверждена';
      case 'completed':
        return 'Завершена';
      case 'cancelled':
        return 'Отменена';
      default:
        return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'accepted':
        return 'status-accepted';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  return (
    <div className="appointment-container">
      <div className="appointment-form-section">
        <h2>Создать новую запись</h2>
        <form onSubmit={handleSubmit} className="appointment-form">
          <div className="form-group">
            <label htmlFor="service">Выберите услугу:</label>
            <select
              id="service"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              required
              className="form-select"
            >
              <option value="">-- Выберите услугу --</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.title} - {service.price} ₽
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="date">Дата и время записи:</label>
            <input
              type="datetime-local"
              id="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Создание записи...' : 'Создать запись'}
          </button>

          {message && (
            <div className={`message ${message.includes('Ошибка') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}
        </form>
      </div>

      <div className="appointments-list-section">
        <h2>Мои записи</h2>
        {patientAppointments.length > 0 ? (
          <div className="appointments-grid">
            {patientAppointments.map(appointment => (
              <div key={appointment.id} className="appointment-card">
                <div className="appointment-header">
                  <h3>{appointment.service_title}</h3>
                  <span className={`status-badge ${getStatusClass(appointment.status)}`}>
                    {getStatusText(appointment.status)}
                  </span>
                </div>
                <div className="appointment-details">
                  <p><strong>Дата:</strong> {new Date(appointment.appointment_date).toLocaleString('ru-RU')}</p>
                  {appointment.doctor_name && (
                    <p><strong>Врач:</strong> {appointment.doctor_name}</p>
                  )}
                  <p><strong>Создано:</strong> {new Date(appointment.created_at).toLocaleString('ru-RU')}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-appointments">У вас пока нет записей</p>
        )}
      </div>
    </div>
  );
};

export default AppointmentForm; 