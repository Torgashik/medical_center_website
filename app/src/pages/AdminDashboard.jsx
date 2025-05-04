import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, API_URL } from '../services/api';
import defaultDoctorPhoto from '../assets/images/default-doctor.png';
import './AdminDashboard.css';

const SPECIALIZATIONS = {
  'checkup': [
    'Терапевт общего профиля',
    'Врач общей практики',
    'Профпатолог-терапевт'
  ],
  'rehabilitation': [
    'Травматолог-ортопед',
    'Физиотерапевт-реабилитолог',
    'Невролог-реабилитолог',
    'Реабилитолог ЛФК'
  ],
  'covid': [
    'Пульмонолог-инфекционист',
    'Кардиолог-реабилитолог',
    'Реабилитолог дыхательной системы',
    'Физиотерапевт дыхательной системы'
  ],
  'biometrics': [
    'Врач функциональной диагностики',
    'Профпатолог-диагност',
    'IT-специалист медицинской диагностики'
  ],
  'dispensary': [
    'Терапевт диспансерного наблюдения',
    'Врач общей практики диспансеризации',
    'Профпатолог диспансерного учета'
  ],
  'women': [
    'Гинеколог-эндокринолог',
    'Маммолог-онколог',
    'Гинеколог-репродуктолог'
  ],
  'tomography': [
    'Рентгенолог-диагност',
    'Врач лучевой диагностики',
    'Нейрорадиолог'
  ],
  'vision': [
    'Офтальмолог-хирург',
    'Офтальмолог-диагност',
    'Оптометрист-контактолог'
  ],
  'dentistry': [
    'Стоматолог-терапевт',
    'Ортодонт',
    'Хирург-стоматолог',
    'Пародонтолог'
  ]
};

const AdminDashboard = () => {
  const [view, setView] = useState('patients'); // 'patients', 'doctors', or 'none'
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [showEditDoctor, setShowEditDoctor] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [newDoctor, setNewDoctor] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    position: '',
    qualification: '',
    age: '',
    experience: '',
    specializations: [],
    photo: null
  });
  const [error, setError] = useState(null);
  const [showEditPatient, setShowEditPatient] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [newPatient, setNewPatient] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    photo: null
  });
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [patientsData, doctorsData] = await Promise.all([
        api.get('/users?role=patient'),
        api.get('/doctors')
      ]);
      console.log('Doctors data:', doctorsData);
      setPatients(patientsData);
      setDoctors(doctorsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

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

    checkAdmin();
  }, [navigate]);

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!newDoctor.first_name) newErrors.first_name = 'Имя обязательно';
    if (!newDoctor.last_name) newErrors.last_name = 'Фамилия обязательна';
    if (!newDoctor.email) newErrors.email = 'Email обязателен';
    if (!newDoctor.phone) newErrors.phone = 'Телефон обязателен';
    if (!newDoctor.password) newErrors.password = 'Пароль обязателен';
    if (!newDoctor.position) newErrors.position = 'Должность обязательна';
    if (!newDoctor.qualification) newErrors.qualification = 'Звание обязательно';
    if (!newDoctor.age) newErrors.age = 'Возраст обязателен';
    if (!newDoctor.experience) newErrors.experience = 'Опыт работы обязателен';
    if (newDoctor.specializations.length === 0) newErrors.specializations = 'Выберите хотя бы одну специализацию';
    
    if (Object.keys(newErrors).length > 0) {
      setError(newErrors);
      return;
    }

    try {
      const formData = new FormData();
      
      // Добавляем все поля в FormData
      formData.append('first_name', newDoctor.first_name);
      formData.append('last_name', newDoctor.last_name);
      formData.append('email', newDoctor.email);
      formData.append('phone', newDoctor.phone);
      formData.append('password', newDoctor.password);
      formData.append('position', newDoctor.position);
      formData.append('qualification', newDoctor.qualification);
      formData.append('age', newDoctor.age);
      formData.append('experience', newDoctor.experience);
      formData.append('specializations', JSON.stringify(newDoctor.specializations));
      
      // Добавляем фото, если оно есть
      if (newDoctor.photo) {
        formData.append('photo', newDoctor.photo);
      }

      console.log('Sending form data:', {
        first_name: newDoctor.first_name,
        last_name: newDoctor.last_name,
        email: newDoctor.email,
        photo: newDoctor.photo ? newDoctor.photo.name : 'no photo'
      });

      const response = await api.post('/doctors', formData);
      console.log('Server response:', response);
      
      if (response && response.id) {
        setShowAddDoctor(false);
        setNewDoctor({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          password: '',
          position: '',
          qualification: '',
          age: '',
          experience: '',
          specializations: [],
          photo: null
        });
        setError(null);
        await fetchData();
      } else {
        setError({ submit: 'Ошибка при добавлении врача: неожиданный ответ сервера' });
      }
    } catch (error) {
      console.error('Error adding doctor:', error);
      setError({ submit: error.message || 'Ошибка при добавлении врача' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDoctor(prev => ({
        ...prev,
        [name]: value
    }));
  };

  const handleSpecializationChange = (direction, specialization) => {
    const key = `${direction}-${specialization}`;
    setNewDoctor(prev => {
        const newSpecializations = [...prev.specializations];
        const index = newSpecializations.indexOf(key);
        
        if (index === -1) {
            newSpecializations.push(key);
        } else {
            newSpecializations.splice(index, 1);
        }
        
        return { ...prev, specializations: newSpecializations };
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setNewDoctor(prev => ({ ...prev, photo: file }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const formatSpecialization = (spec) => {
    if (spec.includes('-')) {
        const [direction, specialization] = spec.split('-');
        return specialization;
    }
    // Удаляем лишние символы из специализации
    return spec.replace(/[\[\]"]/g, '');
  };

  const handleDeleteDoctor = async (doctorId) => {
    if (window.confirm('Вы уверены, что хотите удалить этого врача?')) {
      try {
        await api.delete(`/doctors/${doctorId}`);
        await fetchData(); // Обновляем данные после удаления
      } catch (error) {
        console.error('Error deleting doctor:', error);
        setError({ submit: `Ошибка при удалении врача: ${error.message}` });
      }
    }
  };

  const isSpecializationSelected = (direction, specialization) => {
    const key = `${direction}-${specialization}`;
    return newDoctor.specializations.includes(key);
  };

  const handleEditDoctor = async (doctor) => {
    try {
        // Получаем актуальные данные врача с сервера
        const response = await api.get(`/doctors/${doctor.id}`);
        console.log('Doctor data from server:', response);
        
        // Преобразуем специализации в нужный формат
        const formattedSpecializations = response.specializations.map(spec => {
            if (typeof spec === 'string') {
                // Если специализация уже в формате "направление-специализация"
                if (spec.includes('-')) {
                    return spec;
                }
                // Ищем направление для специализации
                for (const [direction, specs] of Object.entries(SPECIALIZATIONS)) {
                    if (specs.includes(spec)) {
                        return `${direction}-${spec}`;
                    }
                }
            }
            return spec;
        });
        
        setEditingDoctor(response);
        setNewDoctor({
            first_name: response.first_name || '',
            last_name: response.last_name || '',
            email: response.email || '',
            phone: response.phone || '',
            position: response.position || '',
            qualification: response.qualification || '',
            age: response.age || '',
            experience: response.experience || '',
            specializations: formattedSpecializations,
            photo: null
        });
        setShowEditDoctor(true);
    } catch (error) {
        console.error('Error fetching doctor data:', error);
        setError(error.message);
    }
  };

  const handleUpdateDoctor = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
        console.log('Starting doctor update...');
        console.log('Current doctor data:', editingDoctor);
        console.log('New doctor data:', newDoctor);
        
        const formData = new FormData();
        
        // Добавляем только те поля, которые были изменены
        if (newDoctor.first_name !== editingDoctor.first_name) {
            formData.append('first_name', newDoctor.first_name);
            console.log('Will update first_name:', newDoctor.first_name);
        }
        if (newDoctor.last_name !== editingDoctor.last_name) {
            formData.append('last_name', newDoctor.last_name);
            console.log('Will update last_name:', newDoctor.last_name);
        }
        if (newDoctor.email !== editingDoctor.email) {
            formData.append('email', newDoctor.email);
            console.log('Will update email:', newDoctor.email);
        }
        if (newDoctor.phone !== editingDoctor.phone) {
            formData.append('phone', newDoctor.phone);
            console.log('Will update phone:', newDoctor.phone);
        }
        if (newDoctor.position !== editingDoctor.position) {
            formData.append('position', newDoctor.position);
            console.log('Will update position:', newDoctor.position);
        }
        if (newDoctor.qualification !== editingDoctor.qualification) {
            formData.append('qualification', newDoctor.qualification);
            console.log('Will update qualification:', newDoctor.qualification);
        }
        if (newDoctor.age !== editingDoctor.age) {
            formData.append('age', newDoctor.age);
            console.log('Will update age:', newDoctor.age);
        }
        if (newDoctor.experience !== editingDoctor.experience) {
            formData.append('experience', newDoctor.experience);
            console.log('Will update experience:', newDoctor.experience);
        }
        
        // Проверяем изменения в специализациях
        const currentSpecializations = Array.isArray(editingDoctor.specializations) 
            ? editingDoctor.specializations.join(',') 
            : editingDoctor.specializations;
        const newSpecializations = Array.isArray(newDoctor.specializations)
            ? newDoctor.specializations.join(',')
            : newDoctor.specializations;
            
        if (currentSpecializations !== newSpecializations) {
            formData.append('specializations', newSpecializations);
            console.log('Will update specializations:', newSpecializations);
        }
        
        // Добавляем фото, если оно было изменено
        if (newDoctor.photo) {
            console.log('Adding photo to form data:', newDoctor.photo);
            formData.append('photo', newDoctor.photo);
        }

        console.log('Sending form data:', Object.fromEntries(formData));
        
        try {
            const response = await api.put(`/doctors/${editingDoctor.id}`, formData);
            console.log('Server response:', response);
            
            if (response) {
                console.log('Update successful, refreshing data...');
                
                // Обновляем данные в состоянии
                setDoctors(prevDoctors => 
                    prevDoctors.map(doctor => 
                        doctor.id === editingDoctor.id 
                            ? { ...doctor, ...response }
                            : doctor
                    )
                );
                
                setShowEditDoctor(false);
                setEditingDoctor(null);
                setNewDoctor({
                    first_name: '',
                    last_name: '',
                    email: '',
                    phone: '',
                    position: '',
                    qualification: '',
                    age: '',
                    experience: '',
                    specializations: [],
                    photo: null
                });
            }
        } catch (error) {
            console.error('Error updating doctor:', error);
            setError(error.message || 'Ошибка при обновлении данных врача');
        }
    } catch (error) {
        console.error('Error in handleUpdateDoctor:', error);
        setError(error.message || 'Произошла ошибка при обработке данных');
    }
  };

  const handleEditPatient = (patient) => {
    setEditingPatient(patient);
    setNewPatient({
      first_name: patient.first_name,
      last_name: patient.last_name,
      email: patient.email,
      phone: patient.phone,
      photo: null  // Сбрасываем фото при редактировании
    });
    setShowEditPatient(true);
  };

  const handleDeletePatient = async (patientId) => {
    if (window.confirm('Вы уверены, что хотите удалить этого пациента?')) {
      try {
        await api.delete(`/users/${patientId}`);
        await fetchData();
      } catch (error) {
        console.error('Error deleting patient:', error);
        setError({ submit: `Ошибка при удалении пациента: ${error.message}` });
      }
    }
  };

  const handleUpdatePatient = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      const formData = new FormData();
      
      // Всегда добавляем все поля
      formData.append('first_name', newPatient.first_name);
      formData.append('last_name', newPatient.last_name);
      formData.append('email', newPatient.email);
      formData.append('phone', newPatient.phone);
      
      // Добавляем фото, если оно есть
      if (newPatient.photo) {
        formData.append('photo', newPatient.photo);
      }

      console.log('Sending form data:', {
        first_name: newPatient.first_name,
        last_name: newPatient.last_name,
        email: newPatient.email,
        phone: newPatient.phone,
        photo: newPatient.photo ? newPatient.photo.name : 'no photo'
      });

      const response = await api.put(`/users/${editingPatient.id}`, formData);
      console.log('Server response:', response);
      
      if (response) {
        setPatients(prevPatients => 
          prevPatients.map(patient => 
            patient.id === editingPatient.id 
              ? { ...patient, ...response }
              : patient
          )
        );
        
        setShowEditPatient(false);
        setEditingPatient(null);
        setNewPatient({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          photo: null
        });
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      setError(error.message || 'Ошибка при обновлении данных пациента');
    }
  };

  const handlePatientInputChange = (e) => {
    const { name, value } = e.target;
    setNewPatient(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePatientPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPatient(prev => ({ ...prev, photo: file }));
    }
  };

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
          <div className="table-header">
            <h2>Список пациентов</h2>
            <button 
              className="refresh-button"
              onClick={() => fetchData()}
            >
              Обновить
            </button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Фото</th>
                  <th>Имя</th>
                  <th>Фамилия</th>
                  <th>Email</th>
                  <th>Телефон</th>
                  <th>Дата регистрации</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id}>
                    <td>{patient.id}</td>
                    <td>
                      <div className="doctor-photo">
                        <img 
                          src={patient.photo ? `${API_URL}${patient.photo}?t=${Date.now()}` : defaultDoctorPhoto} 
                          alt={`${patient.first_name} ${patient.last_name}`}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = defaultDoctorPhoto;
                          }}
                        />
                      </div>
                    </td>
                    <td>{patient.first_name}</td>
                    <td>{patient.last_name}</td>
                    <td>{patient.email}</td>
                    <td>{patient.phone}</td>
                    <td>{new Date(patient.created_at).toLocaleDateString()}</td>
                    <td className="doctor-actions">
                      <button 
                        className="edit-button"
                        onClick={() => handleEditPatient(patient)}
                      >
                        Изменить
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeletePatient(patient.id)}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'doctors' && (
        <div className="admin-content">
          <div className="table-header">
            <h2>Список врачей</h2>
            <div className="table-actions">
              <button 
                className="refresh-button"
                onClick={() => fetchData()}
              >
                Обновить
              </button>
              <button 
                className="add-doctor-button"
                onClick={() => setShowAddDoctor(true)}
              >
                Добавить врача
              </button>
            </div>
          </div>
          
          {showAddDoctor && (
            <div className="add-doctor-form">
              <h2>{editingDoctor ? 'Редактировать врача' : 'Добавить нового врача'}</h2>
              <form onSubmit={editingDoctor ? handleUpdateDoctor : handleAddDoctor}>
                <div className="form-group">
                  <label>Имя</label>
                  <input
                    type="text"
                    value={newDoctor.first_name}
                    onChange={handleInputChange}
                    name="first_name"
                  />
                  {error?.first_name && <span className="error">{error.first_name}</span>}
                </div>

                <div className="form-group">
                  <label>Фамилия</label>
                  <input
                    type="text"
                    value={newDoctor.last_name}
                    onChange={handleInputChange}
                    name="last_name"
                  />
                  {error?.last_name && <span className="error">{error.last_name}</span>}
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={newDoctor.email}
                    onChange={handleInputChange}
                    name="email"
                  />
                  {error?.email && <span className="error">{error.email}</span>}
                </div>

                <div className="form-group">
                  <label>Телефон</label>
                  <input
                    type="tel"
                    value={newDoctor.phone}
                    onChange={handleInputChange}
                    name="phone"
                  />
                  {error?.phone && <span className="error">{error.phone}</span>}
                </div>

                <div className="form-group">
                  <label>Пароль</label>
                  <input
                    type="password"
                    value={newDoctor.password}
                    onChange={handleInputChange}
                    name="password"
                  />
                  {error?.password && <span className="error">{error.password}</span>}
                </div>

                <div className="form-group">
                  <label>Должность</label>
                  <input
                    type="text"
                    value={newDoctor.position}
                    onChange={handleInputChange}
                    name="position"
                  />
                  {error?.position && <span className="error">{error.position}</span>}
                </div>

                <div className="form-group">
                  <label>Звание</label>
                  <input
                    type="text"
                    value={newDoctor.qualification}
                    onChange={handleInputChange}
                    name="qualification"
                  />
                  {error?.qualification && <span className="error">{error.qualification}</span>}
                </div>

                <div className="form-group">
                  <label>Возраст</label>
                  <input
                    type="number"
                    value={newDoctor.age}
                    onChange={handleInputChange}
                    name="age"
                  />
                  {error?.age && <span className="error">{error.age}</span>}
                </div>

                <div className="form-group">
                  <label>Опыт работы (лет)</label>
                  <input
                    type="number"
                    value={newDoctor.experience}
                    onChange={handleInputChange}
                    name="experience"
                  />
                  {error?.experience && <span className="error">{error.experience}</span>}
                </div>

                <div className="form-group">
                  <label>Специализации</label>
                  <div className="specializations-grid">
                    {Object.entries(SPECIALIZATIONS).map(([direction, specs]) => (
                      <div key={direction} className="specialization-group">
                        <h3>{direction}</h3>
                        {specs.map(spec => (
                          <label key={spec} className="specialization-checkbox">
                            <input
                              type="checkbox"
                              checked={isSpecializationSelected(direction, spec)}
                              onChange={() => handleSpecializationChange(direction, spec)}
                            />
                            {spec}
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                  {error?.specializations && <span className="error">{error.specializations}</span>}
                </div>

                <div className="form-group">
                  <label>Фото профиля</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                  {error?.photo && <span className="error">{error.photo}</span>}
                </div>

                {error?.submit && <div className="error">{error.submit}</div>}

                <div className="form-actions">
                  <button type="submit" className="submit-button">Добавить врача</button>
                  <button type="button" className="cancel-button" onClick={() => setShowAddDoctor(false)}>
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Фото</th>
                  <th>ФИО</th>
                  <th>Должность</th>
                  <th>Звание</th>
                  <th>Возраст</th>
                  <th>Опыт (лет)</th>
                  <th>Специализации</th>
                  <th>Контакты</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doctor) => (
                  <tr key={doctor.id}>
                    <td>{doctor.id}</td>
                    <td>
                      <div className="doctor-photo">
                        <img 
                          src={doctor.photo ? `${API_URL}${doctor.photo}?t=${Date.now()}` : defaultDoctorPhoto} 
                          alt={`${doctor.first_name} ${doctor.last_name}`}
                          onError={(e) => {
                            console.error('Error loading photo:', e.target.src);
                            e.target.onerror = null;
                            e.target.src = defaultDoctorPhoto;
                          }}
                        />
                      </div>
                    </td>
                    <td>{`${doctor.first_name} ${doctor.last_name}`}</td>
                    <td>{doctor.position}</td>
                    <td>{doctor.qualification}</td>
                    <td>{doctor.age}</td>
                    <td>{doctor.experience}</td>
                    <td>
                      <div className="specializations-list">
                        {doctor.specializations.map((spec, index) => (
                          <span key={index} className="specialization-tag">
                            {formatSpecialization(spec)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="contacts">
                        <span>{doctor.email}</span>
                        <span>{doctor.phone}</span>
                      </div>
                    </td>
                    <td className="doctor-actions">
                      <button 
                        className="edit-button"
                        onClick={() => handleEditDoctor(doctor)}
                      >
                        Изменить
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteDoctor(doctor.id)}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showEditDoctor && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Редактировать врача</h2>
            <form onSubmit={handleUpdateDoctor}>
              <div className="form-group">
                <label>Имя</label>
                <input
                  type="text"
                  name="first_name"
                  value={newDoctor.first_name}
                  onChange={handleInputChange}
                />
                {error?.first_name && <span className="error">{error.first_name}</span>}
              </div>

              <div className="form-group">
                <label>Фамилия</label>
                <input
                  type="text"
                  name="last_name"
                  value={newDoctor.last_name}
                  onChange={handleInputChange}
                />
                {error?.last_name && <span className="error">{error.last_name}</span>}
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={newDoctor.email}
                  onChange={handleInputChange}
                />
                {error?.email && <span className="error">{error.email}</span>}
              </div>

              <div className="form-group">
                <label>Телефон</label>
                <input
                  type="tel"
                  name="phone"
                  value={newDoctor.phone}
                  onChange={handleInputChange}
                />
                {error?.phone && <span className="error">{error.phone}</span>}
              </div>

              <div className="form-group">
                <label>Должность</label>
                <input
                  type="text"
                  name="position"
                  value={newDoctor.position}
                  onChange={handleInputChange}
                />
                {error?.position && <span className="error">{error.position}</span>}
              </div>

              <div className="form-group">
                <label>Звание</label>
                <input
                  type="text"
                  name="qualification"
                  value={newDoctor.qualification}
                  onChange={handleInputChange}
                />
                {error?.qualification && <span className="error">{error.qualification}</span>}
              </div>

              <div className="form-group">
                <label>Возраст</label>
                <input
                  type="number"
                  name="age"
                  value={newDoctor.age}
                  onChange={handleInputChange}
                />
                {error?.age && <span className="error">{error.age}</span>}
              </div>

              <div className="form-group">
                <label>Опыт работы (лет)</label>
                <input
                  type="number"
                  name="experience"
                  value={newDoctor.experience}
                  onChange={handleInputChange}
                />
                {error?.experience && <span className="error">{error.experience}</span>}
              </div>

              <div className="form-group">
                <label>Специализации</label>
                <div className="specializations-grid">
                  {Object.entries(SPECIALIZATIONS).map(([direction, specs]) => (
                    <div key={direction} className="specialization-group">
                      <h3>{direction}</h3>
                      {specs.map(spec => (
                        <label key={spec} className="specialization-checkbox">
                          <input
                            type="checkbox"
                            checked={isSpecializationSelected(direction, spec)}
                            onChange={() => handleSpecializationChange(direction, spec)}
                          />
                          {spec}
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
                {error?.specializations && <span className="error">{error.specializations}</span>}
              </div>

              <div className="form-group">
                <label>Фото профиля</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
                {editingDoctor?.photo && (
                  <div className="current-photo">
                    <img 
                      src={`${API_URL}${editingDoctor.photo}?t=${Date.now()}`} 
                      alt="Текущее фото"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = defaultDoctorPhoto;
                      }}
                    />
                    <span>Текущее фото</span>
                  </div>
                )}
              </div>

              {error && <div className="error">{error}</div>}

              <div className="form-actions">
                <button type="submit" className="submit-button">Сохранить изменения</button>
                <button 
                  type="button" 
                  className="cancel-button" 
                  onClick={() => {
                    setShowEditDoctor(false);
                    setEditingDoctor(null);
                    setError(null);
                  }}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditPatient && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Редактировать пациента</h2>
            <form onSubmit={handleUpdatePatient}>
              <div className="form-group">
                <label>Имя</label>
                <input
                  type="text"
                  name="first_name"
                  value={newPatient.first_name}
                  onChange={handlePatientInputChange}
                />
                {error?.first_name && <span className="error">{error.first_name}</span>}
              </div>

              <div className="form-group">
                <label>Фамилия</label>
                <input
                  type="text"
                  name="last_name"
                  value={newPatient.last_name}
                  onChange={handlePatientInputChange}
                />
                {error?.last_name && <span className="error">{error.last_name}</span>}
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={newPatient.email}
                  onChange={handlePatientInputChange}
                />
                {error?.email && <span className="error">{error.email}</span>}
              </div>

              <div className="form-group">
                <label>Телефон</label>
                <input
                  type="tel"
                  name="phone"
                  value={newPatient.phone}
                  onChange={handlePatientInputChange}
                />
                {error?.phone && <span className="error">{error.phone}</span>}
              </div>

              <div className="form-group">
                <label>Фото профиля</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePatientPhotoChange}
                />
                {editingPatient?.photo && (
                  <div className="current-photo">
                    <img 
                      src={`${API_URL}${editingPatient.photo}?t=${Date.now()}`} 
                      alt="Текущее фото"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = defaultDoctorPhoto;
                      }}
                    />
                    <span>Текущее фото</span>
                  </div>
                )}
              </div>

              {error && <div className="error">{error}</div>}

              <div className="form-actions">
                <button type="submit" className="submit-button">Сохранить изменения</button>
                <button 
                  type="button" 
                  className="cancel-button" 
                  onClick={() => {
                    setShowEditPatient(false);
                    setEditingPatient(null);
                    setError(null);
                  }}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 