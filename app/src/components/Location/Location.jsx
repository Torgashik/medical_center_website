import React from 'react';
import './Location.css';

const Location = () => {
  return (
    <section className="location-section">
      <div className="container">
        <h2 className="section-title">Где нас найти</h2>
        <div className="location-content">
          <div className="map-container">
            <iframe
              src="https://yandex.ru/map-widget/v1/?um=constructor%3A1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f&amp;source=constructor&amp;ll=37.481%2C55.670&amp;z=16"
              width="100%"
              height="100%"
              frameBorder="0"
              title="Карта расположения клиники"
            ></iframe>
          </div>
          <div className="location-info">
            <h3>Наш адрес</h3>
            <p>г. Москва, проспект Вернадского, 78</p>
            <p>Рядом с метро Юго-Западная</p>
            <div className="contact-details">
              <div className="contact-item">
                <h4>Телефон</h4>
                <p>+7 (800) 123-45-67</p>
              </div>
              <div className="contact-item">
                <h4>Часы работы</h4>
                <p>Пн-Пт: 9:00 - 20:00</p>
                <p>Сб: 10:00 - 18:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Location; 