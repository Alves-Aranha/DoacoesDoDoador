import React from 'react';
import { Sun, Moon, Palette, Droplet } from 'lucide-react';

const ThemeToggle = ({ theme, setTheme }) => {
  return (
    <div className="theme-toggle">
      <button
        className={`btn-theme ${theme === 'light' ? 'active' : ''}`}
        onClick={() => setTheme('light')}
        title="Tema Claro"
      >
        <Sun size={20} />
      </button>
      <button
        className={`btn-theme ${theme === 'light-silver-blue' ? 'active' : ''}`}
        onClick={() => setTheme('light-silver-blue')}
        title="Tema Claro Prata"
      >
        <Droplet size={20} />
      </button>
      <button
        className={`btn-theme ${theme === 'dark' ? 'active' : ''}`}
        onClick={() => setTheme('dark')}
        title="Tema Escuro"
      >
        <Moon size={20} />
      </button>
      <button
        className={`btn-theme ${theme === 'navy-blue' ? 'active' : ''}`}
        onClick={() => setTheme('navy-blue')}
        title="Tema Claro Azul"
      >
        <Palette size={20} />
      </button>
    </div>
  );
};

export default ThemeToggle;