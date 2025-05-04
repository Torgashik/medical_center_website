const API_URL = 'http://localhost:8001';

const handleResponse = async (response) => {
    if (!response.ok) {
        let errorMessage;
        try {
            const errorData = await response.json();
            console.error('Error response:', errorData);
            
            if (response.status === 422) {
                // Обработка ошибок валидации
                if (Array.isArray(errorData.detail)) {
                    errorMessage = errorData.detail.map(err => err.msg).join(', ');
                } else if (typeof errorData.detail === 'object') {
                    errorMessage = Object.values(errorData.detail)
                        .flat()
                        .join(', ');
                } else {
                    errorMessage = errorData.detail || 'Проверьте правильность введенных данных';
                }
            } else if (response.status === 401) {
                // Проверяем, не истек ли токен
                const token = localStorage.getItem('token');
                if (!token) {
                    errorMessage = 'Требуется авторизация';
                } else {
                    errorMessage = 'Сессия истекла. Пожалуйста, войдите снова.';
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }
            } else {
                errorMessage = errorData.detail || 'Произошла ошибка при выполнении запроса';
            }
        } catch (e) {
            console.error('Error parsing error response:', e);
            errorMessage = 'Не удалось подключиться к серверу';
        }
        throw new Error(errorMessage);
    }
    return response.json();
};

const api = {
    register: async (userData) => {
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    email: userData.email,
                    phone: userData.phone,
                    password: userData.password
                }),
            });
            return handleResponse(response);
        } catch (error) {
            if (error.message === 'Failed to fetch') {
                throw new Error('Не удалось подключиться к серверу. Проверьте, запущен ли сервер.');
            }
            throw error;
        }
    },

    login: async (credentials) => {
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: credentials.email,
                    password: credentials.password
                }),
            });
            return handleResponse(response);
        } catch (error) {
            if (error.message === 'Failed to fetch') {
                throw new Error('Не удалось подключиться к серверу. Проверьте, запущен ли сервер.');
            }
            throw error;
        }
    },

    get: async (endpoint) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                mode: 'cors',
            });
            return handleResponse(response);
        } catch (error) {
            if (error.message === 'Failed to fetch') {
                throw new Error('Не удалось подключиться к серверу. Проверьте, запущен ли сервер.');
            }
            throw error;
        }
    },

    post: async (endpoint, data, options = {}) => {
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Authorization': `Bearer ${token}`,
                ...options.headers
            };

            // Если это FormData, не устанавливаем Content-Type, браузер сделает это сам
            if (data instanceof FormData) {
                delete headers['Content-Type'];
            }

            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers,
                body: data instanceof FormData ? data : JSON.stringify(data)
            });
            return handleResponse(response);
        } catch (error) {
            if (error.message === 'Failed to fetch') {
                throw new Error('Не удалось подключиться к серверу. Проверьте, запущен ли сервер.');
            }
            throw error;
        }
    },

    put: async (endpoint, data, options = {}) => {
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Authorization': `Bearer ${token}`,
                ...options.headers
            };

            // Если это FormData, не устанавливаем Content-Type, браузер сделает это сам
            if (data instanceof FormData) {
                delete headers['Content-Type'];
            }

            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'PUT',
                headers,
                body: data instanceof FormData ? data : JSON.stringify(data)
            });
            return handleResponse(response);
        } catch (error) {
            if (error.message === 'Failed to fetch') {
                throw new Error('Не удалось подключиться к серверу. Проверьте, запущен ли сервер.');
            }
            throw error;
        }
    },

    delete: async (endpoint) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            return handleResponse(response);
        } catch (error) {
            if (error.message === 'Failed to fetch') {
                throw new Error('Не удалось подключиться к серверу. Проверьте, запущен ли сервер.');
            }
            throw error;
        }
    }
};

export { api, API_URL }; 