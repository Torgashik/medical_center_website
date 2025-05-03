const API_URL = 'http://localhost:8001';

const handleResponse = async (response) => {
    if (!response.ok) {
        let errorMessage;
        try {
            const error = await response.json();
            if (response.status === 422) {
                // Обработка ошибок валидации
                const validationErrors = Object.values(error.detail || {})
                    .flat()
                    .join(', ');
                errorMessage = validationErrors || 'Проверьте правильность введенных данных';
            } else if (response.status === 401) {
                errorMessage = 'Неверный email или пароль';
            } else {
                errorMessage = error.detail || 'Произошла ошибка';
            }
        } catch (e) {
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
                    first_name: userData.firstName,
                    last_name: userData.lastName,
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
    },

    post: async (endpoint, data) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
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

export { api }; 