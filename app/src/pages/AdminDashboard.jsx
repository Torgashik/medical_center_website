import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [view, setView] = useState('patients'); // 'patients', 'doctors', or 'none'
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const user = await api.get('/users/me');
        if (user.role !== 'admin') {
          navigate('/');
          return;
        }
        await fetchData();
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/login');
      }
    };

    const fetchData = async () => {
      try {
        setLoading(true);
        const [patientsData, doctorsData] = await Promise.all([
          api.get('/users?role=patient'),
          api.get('/users?role=doctor')
        ]);
        setPatients(patientsData);
        setDoctors(doctorsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [navigate]);

  if (loading) {
    return <div className="admin-dashboard loading">Загрузка...</div>;
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Панель администратора</h1>
      </header>

      <div className="admin-stats">
        <div className="stat-card">
          <h3>Всего пациентов</h3>
          <p>{patients.length}</p>
        </div>
        <div className="stat-card">
          <h3>Всего врачей</h3>
          <p>{doctors.length}</p>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-button ${view === 'patients' ? 'active' : ''}`}
          onClick={() => setView('patients')}
        >
          Пациенты
        </button>
        <button
          className={`tab-button ${view === 'doctors' ? 'active' : ''}`}
          onClick={() => setView('doctors')}
        >
          Врачи
        </button>
        <button
          className={`tab-button ${view === 'none' ? 'active' : ''}`}
          onClick={() => setView('none')}
        >
          Скрыть
        </button>
      </div>

      {view === 'patients' && (
        <div className="admin-content">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Имя</th>
                  <th>Фамилия</th>
                  <th>Email</th>
                  <th>Телефон</th>
                  <th>Дата регистрации</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id}>
                    <td>{patient.id}</td>
                    <td>{patient.first_name}</td>
                    <td>{patient.last_name}</td>
                    <td>{patient.email}</td>
                    <td>{patient.phone}</td>
                    <td>{new Date(patient.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'doctors' && (
        <div className="admin-content">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Имя</th>
                  <th>Фамилия</th>
                  <th>Email</th>
                  <th>Телефон</th>
                  <th>Дата регистрации</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doctor) => (
                  <tr key={doctor.id}>
                    <td>{doctor.id}</td>
                    <td>{doctor.first_name}</td>
                    <td>{doctor.last_name}</td>
                    <td>{doctor.email}</td>
                    <td>{doctor.phone}</td>
                    <td>{new Date(doctor.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 