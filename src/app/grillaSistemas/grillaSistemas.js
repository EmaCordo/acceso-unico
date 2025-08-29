// src/grillaSistema/GrillaSistemas.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './grillaSistemas.css';

const API_URL = 'http://127.0.0.1:8080/sistemas.php'; // usar servidor PHP que ya probaste // ajustá si tu backend vive en otro origen

export default function GrillaSistemas() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sort, setSort] = useState('sistemasid');
    const [dir, setDir] = useState('ASC');
    const [onlyActive, setOnlyActive] = useState(false);

    const [total, setTotal] = useState(0);

    // debounce de búsqueda
    const [qDebounced, setQDebounced] = useState('');
    useEffect(() => {
        const t = setTimeout(() => setQDebounced(q), 400);
        return () => clearTimeout(t);
    }, [q]);

    useEffect(() => {
        const controller = new AbortController();
        const params = new URLSearchParams({
            q: qDebounced,
            page: String(page),
            pageSize: String(pageSize),
            sort,
            dir,
        });

        if (onlyActive) params.set('estado', '1');

        setLoading(true);
        setError('');

        fetch(`${API_URL}?${params.toString()}`, { signal: controller.signal })
            .then(async (res) => {
                const ct = res.headers.get('content-type') || '';
                const text = await res.text();
                if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 300)}`);
                if (!ct.includes('application/json')) throw new Error(`Respuesta no JSON:
${text.slice(0, 300)}`);
                return JSON.parse(text);
            })
            .then(json => {
                if (!json.success) throw new Error(json.message || 'Error desconocido');
                setRows(json.data || []);
                setTotal(json.total || 0);
            })
            .catch(err => {
                if (err.name !== 'AbortError') setError(err.message || 'Error de red');
            })
            .finally(() => setLoading(false));

        return () => controller.abort();
    }, [qDebounced, page, pageSize, sort, dir, onlyActive]);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

    const toggleSort = (col) => {
        if (sort === col) {
            setDir(prev => (prev === 'ASC' ? 'DESC' : 'ASC'));
        } else {
            setSort(col);
            setDir('ASC');
        }
        setPage(1);
    };

    const badge = (estado) => {
        const val = Number(estado);
        const map = {
            0: { txt: 'Inactivo', cls: 'badge danger' },
            1: { txt: 'Activo', cls: 'badge success' },
        };
        return <span className={map[val]?.cls || 'badge neutral'}>{map[val]?.txt || String(estado)}</span>;
    };

    return (
        <div className="gs-wrap">
            <div className="gs-toolbar">
                <input
                    className="gs-input"
                    placeholder="Buscar por descripción…"
                    value={q}
                    onChange={(e) => { setQ(e.target.value); setPage(1); }}
                />
                <label className="gs-check">
                    <input type="checkbox" checked={onlyActive} onChange={(e) => { setOnlyActive(e.target.checked); setPage(1); }} />
                    Solo activos
                </label>
                <div className="gs-right">
                    <label>
                        Tamaño
                        <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </label>
                </div>
            </div>

            <div className="gs-table-wrap">
                <table className="gs-table">
                    <thead>
                        <tr>
                            <Th col="sistemasid" sort={sort} dir={dir} onSort={toggleSort}>ID</Th>
                            <Th col="descripcion" sort={sort} dir={dir} onSort={toggleSort}>Descripción</Th>
                            <Th col="hostingpublico" sort={sort} dir={dir} onSort={toggleSort}>Hosting Público</Th>
                            <Th col="hostinglocal" sort={sort} dir={dir} onSort={toggleSort}>Hosting Local</Th>
                            <Th col="estado" sort={sort} dir={dir} onSort={toggleSort}>Estado</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="center">Cargando…</td></tr>
                        ) : error ? (
                            <tr><td colSpan={5} className="error">{error}</td></tr>
                        ) : rows.length === 0 ? (
                            <tr><td colSpan={5} className="center">Sin resultados</td></tr>
                        ) : (
                            rows.map(r => (
                                <tr key={r.sistemasid}>
                                    <td className="mono">{r.sistemasid}</td>
                                    <td>{r.descripcion}</td>
                                    <td className="clip">{r.hostingpublico}</td>
                                    <td className="clip">{r.hostinglocal}</td>
                                    <td>{badge(r.estado)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="gs-pager">
                <button onClick={() => setPage(1)} disabled={page === 1}>«</button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
                <span>Página {page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
            </div>
        </div>
    );
}

function Th({ col, sort, dir, onSort, children }) {
    const active = sort === col;
    return (
        <th onClick={() => onSort(col)} role="button" className={active ? 'sorted' : ''}>
            <span>{children}</span>
            <span className="sort">
                {active ? (dir === 'ASC' ? '▲' : '▼') : '↕'}
            </span>
        </th>
    );
}