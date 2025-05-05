import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DoctorAppointments.css';

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8001/appointments/doctor', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAppointments(response.data);
      } catch (error) {
        console.error('Ошибка при получении записей:', error);
      }
    };

    fetchAppointments();
  }, []);

  const handleAcceptAppointment = async (appointmentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8001/appointments/${appointmentId}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage('Запись успешно принята!');
      // Обновляем список записей
      const response = await axios.get('http://localhost:8001/appointments/doctor', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAppointments(response.data);
    } catch (error) {
      console.error('Ошибка при принятии записи:', error);
      setMessage('Ошибка при принятии записи. Пожалуйста, попробуйте снова.');
    }
  };

  return (
    <div className="doctor-appointments-container">
      <h2>Управление записями</h2>
      {message && <p className={`message ${message.includes('успешно') ? 'success' : 'error'}`}>{message}</p>}
      <div className="appointments-list">
        {appointments.length === 0 ? (
          <p className="no-appointments">Записи не найдены</p>
        ) : (
          appointments.map((appointment) => (
            <div key={appointment.id} className="appointment-card">
              <div className="appointment-info">
                <h3>{appointment.service_title}</h3>
                <p><strong>Пациент:</strong> {appointment.patient_name}</p>
                <p><strong>Дата:</strong> {new Date(appointment.appointment_date).toLocaleString()}</p>
                <p><strong>Статус:</strong> {appointment.status === 'pending' ? 'Ожидает подтверждения' : 'Подтверждена'}</p>
              </div>
              {appointment.status === 'pending' && (
                <button
                  className="accept-button"
                  onClick={() => handleAcceptAppointment(appointment.id)}
                >
                  Принять запись
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DoctorAppointments; 