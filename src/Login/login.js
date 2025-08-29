// src/Login/login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';   // <--- import
import './login.css';

function Login() {
    const [nickname, setNickname] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');
    const navigate = useNavigate();                 // <--- hook

    const API_BASE =
        (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
        process.env.REACT_APP_API_BASE ||
        'http://127.0.0.1:8080';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr('');
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/login.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname, password }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'Credenciales inválidas');

            // Opcional: guardar datos de sesión
            // localStorage.setItem('user', JSON.stringify(data.user));

            // Redirigir al dashboard (podés pasar datos por state si querés)
            navigate('/dashboard', { replace: true, state: { user: data.user } });
        } catch (e) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-container">
                <div className="glass-card">
                    <h2>Iniciar sesión</h2>
                    <form onSubmit={handleSubmit} noValidate>
                        <input
                            type="text"
                            placeholder="Usuario"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            required
                            autoComplete="username"
                        />
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                        {err && <div className="alert alert-danger">{err}</div>}
                        <button type="submit" disabled={loading}>
                            {loading ? 'Ingresando...' : 'Entrar'}
                        </button>
                    </form>
                </div>
                <div className="image-side">
                    <img src="https://images.unsplash.com/photo-1508780709619-79562169bc64" alt="Decorativa" />
                </div>
            </div>
        </div>
    );
}

export default Login;
