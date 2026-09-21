import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StickyNote, X, ChevronLeft, ChevronRight, Save, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { api } from '../api';

const LS_KEY = 'projeto_notas';

const Notepad = ({ onClose, usuarioEmail }) => {
    const today = new Date().toLocaleDateString('en-CA');
    const [selectedDate, setSelectedDate] = useState(today);
    const [note, setNote] = useState('');
    const noteRef = useRef('');
    const [isMinimized, setIsMinimized] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(false);
    const debounceRef = useRef(null);
    const loadingDateRef = useRef(null);

    const persistLocalStorage = useCallback((date, content) => {
        try {
            const savedNotes = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
            if (content.trim()) {
                savedNotes[date] = content;
            } else {
                delete savedNotes[date];
            }
            localStorage.setItem(LS_KEY, JSON.stringify(savedNotes));
        } catch {}
    }, []);

    // Load from localStorage (instant), then try API (server)
    useEffect(() => {
        loadingDateRef.current = selectedDate;
        const localNotes = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
        const saved = localNotes[selectedDate] || '';
        setNote(saved);
        noteRef.current = saved;

        // Try server (async) — if succeeds, may overwrite stale local
        const doFetch = async () => {
            try {
                const data = await api.notas.get(selectedDate, usuarioEmail);
                if (loadingDateRef.current !== selectedDate) return;
                if (data && data.conteudo !== undefined) {
                    const serverContent = data.conteudo || '';
                    if (serverContent !== noteRef.current) {
                        setNote(serverContent);
                        noteRef.current = serverContent;
                        persistLocalStorage(selectedDate, serverContent);
                    }
                }
            } catch (err) {
                console.error('Erro ao buscar notas no banco:', err);
                // Server unavailable — local is fine
            }
        };
        doFetch();
    }, [selectedDate, usuarioEmail, persistLocalStorage]);

    const doSave = useCallback(async (date, content) => {
        // Always save locally first (instant + offline)
        persistLocalStorage(date, content);

        // Then try server
        try {
            await api.notas.save(date, usuarioEmail, content);
            setSaveError(false);
        } catch {
            setSaveError(true);
        }
    }, [usuarioEmail, persistLocalStorage]);

    // Auto-save with debounce
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            if (noteRef.current !== null) {
                doSave(selectedDate, noteRef.current);
            }
        }, 800);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [note, selectedDate, doSave]);

    // Save on date change
    const changeDate = (days) => {
        const [y, m, d] = selectedDate.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        date.setDate(date.getDate() + days);
        const ny = date.getFullYear();
        const nm = String(date.getMonth() + 1).padStart(2, '0');
        const nd = String(date.getDate()).padStart(2, '0');
        const newDate = `${ny}-${nm}-${nd}`;
        doSave(selectedDate, noteRef.current);
        setSelectedDate(newDate);
    };

    const handleClose = () => {
        doSave(selectedDate, noteRef.current);
        onClose();
    };

    const clearNote = async () => {
        if (window.confirm('Deseja apagar toda a nota deste dia?')) {
            setNote('');
            noteRef.current = '';
            doSave(selectedDate, '');
        }
    };

    const saveNote = async () => {
        setIsSaving(true);
        setSaveError(false);
        try {
            await api.notas.save(selectedDate, usuarioEmail, noteRef.current);
            persistLocalStorage(selectedDate, noteRef.current);
        } catch (err) {
            console.error('Erro ao salvar nota:', err);
            setSaveError(true);
        }
        setTimeout(() => setIsSaving(false), 500);
    };

    // Estilos que respeitam o tema mas garantem visibilidade
    const headerStyle = {
        background: 'var(--primary-pastel-blue)', // Sempre azul (visível em ambos temas)
        padding: '12px 16px',
        color: 'white', // Ícones no topo sempre brancos sobre o azul
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: '16px 16px 0 0'
    };

    const footerStyle = {
        padding: '12px 16px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--header-bg)',
        borderRadius: '0 0 16px 16px'
    };

    if (isMinimized) {
        return (
            <div 
                onClick={() => setIsMinimized(false)}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-pastel-blue)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                    zIndex: 9999
                }}
            >
                <StickyNote size={30} />
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '350px',
            height: '450px',
            backgroundColor: 'var(--card-bg)',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9999,
            border: '1px solid var(--border-color)',
        }}>
            <div style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StickyNote size={20} />
                    <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>BLOCO DE NOTAS</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        onClick={() => setIsMinimized(true)} 
                        style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', padding: '8px', borderRadius: '8px' }}
                    >
                        <Minimize2 size={20} strokeWidth={2.5} />
                    </button>
                    <button 
                        onClick={handleClose} 
                        style={{ background: 'rgba(255,0,0,0.6)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', padding: '8px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)', justifyContent: 'center' }}>
                <button 
                    onClick={() => changeDate(-1)} 
                    style={{ background: 'var(--primary-pastel-blue)', border: '2px solid var(--border-color)', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
                >
                    <ChevronLeft size={22} strokeWidth={2.5} />
                </button>
                <div style={{ textAlign: 'center', minWidth: '120px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--primary-pastel-blue)' }}>
                        {selectedDate === today ? 'HOJE' : (() => {
                            const [y, m, d] = selectedDate.split('-').map(Number);
                            return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();
                        })()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-color)', fontWeight: 'bold' }}>
                        {(() => {
                            const [y, m, m_d] = selectedDate.split('-').map(Number);
                            return new Date(y, m - 1, m_d).toLocaleDateString('pt-BR');
                        })()}
                    </div>
                </div>
                <button 
                    onClick={() => changeDate(1)} 
                    style={{ background: 'var(--primary-pastel-blue)', border: '2px solid var(--border-color)', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
                >
                    <ChevronRight size={22} strokeWidth={2.5} />
                </button>
            </div>

            <textarea 
                style={{
                    flex: 1,
                    padding: '16px',
                    border: 'none',
                    background: 'var(--bg-color)',
                    color: 'var(--text-color)',
                    fontFamily: 'inherit',
                    fontSize: '1rem',
                    lineHeight: '1.5',
                    resize: 'none',
                    outline: 'none',
                    fontWeight: '500'
                }}
                placeholder="Anotações do dia..."
                value={note}
                onChange={(e) => { setNote(e.target.value); noteRef.current = e.target.value; }}
            />

            <div style={footerStyle}>
                <button 
                    onClick={clearNote}
                    style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', display: 'flex' }}
                    title="Limpar dia"
                >
                    <Trash2 size={24} strokeWidth={2.5} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {saveError && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--danger-color)', fontWeight: 700 }}>FALHA AO SALVAR NO SERVIDOR</span>
                    )}
                    <button 
                        onClick={saveNote}
                        style={{ 
                            background: isSaving ? 'var(--success-color)' : 'var(--primary-pastel-blue)', 
                            color: 'white', 
                            border: 'none', 
                            padding: '12px 24px', 
                            borderRadius: '20px', 
                            fontSize: '0.9rem', 
                            fontWeight: 900, 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                        }}
                    >
                        <Save size={20} strokeWidth={2.5} /> {isSaving ? 'SALVANDO...' : 'SALVAR'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Notepad;
