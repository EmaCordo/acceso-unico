// src/components/Login.jsx
import React, { useState } from 'react';
import './login.css';

function Login() {
    const [usuario, setUsuario] = useState('');
    const [contrasena, setContrasena] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        alert(`Bienvenido, ${usuario}`);
    };

    return (
        <div className="login-wrapper">
            <div className="login-container">
                <div className="glass-card">
                    <h2>Iniciar sesión</h2>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            placeholder="Usuario o email"
                            value={usuario}
                            onChange={(e) => setUsuario(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={contrasena}
                            onChange={(e) => setContrasena(e.target.value)}
                            required
                        />
                        <button type="submit">Entrar</button>
                        <a href="#" className="forgot-link">¿Olvidaste tu contraseña?</a>
                        <a href="#" className="forgot-link">Registrarse</a>
                        <a href="#" className="forgot-link">¿Olvidó los datos de su correo institucional?</a>
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
