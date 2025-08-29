// src/pages/Dashboard.jsx
import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import './dashboard.css';

// carga diferida (opcional)
const GrillaSistema = lazy(() => import('./grillaSistemas/grillaSistemas'));
export default function Dashboard() {
    const [open, setOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const onDocClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
    }, []);

    const handleLogout = async () => {
        try {
            setLoggingOut(true);
            await fetch('/logout', { method: 'POST', credentials: 'include' }).catch(() => { });
        } finally {
            ['token', 'accessToken', 'refreshToken', 'user', 'auth'].forEach(k => localStorage.removeItem(k));
            sessionStorage.clear();
            window.location.assign('/');
        }
    };

    return (
        <>
            <header className="topbar">
                <div className="left">
                    <div className="dropdown" ref={menuRef}>
                        <button className="menuBtn" onClick={() => setOpen(v => !v)} aria-haspopup="true" aria-expanded={open}>
                            ☰ Menú
                        </button>
                        {open && (
                            <ul className="menu">
                                <li><a href="#">Inicio</a></li>
                                <li><a href="#">Reportes</a></li>
                                <li><a href="#">Configuración</a></li>
                            </ul>
                        )}
                    </div>
                </div>

                <div className="brand">Acceso Único</div>

                <div className="right">
                    <button className="logoutBtn" onClick={handleLogout} disabled={loggingOut} aria-busy={loggingOut}>
                        {loggingOut ? 'Saliendo…' : 'Cerrar sesión'}
                    </button>
                </div>
            </header>

            <main className="content">
                <Suspense fallback={<div className="loading">Cargando grilla…</div>}>
                    <GrillaSistema />
                </Suspense>
            </main>
        </>
    );
}
