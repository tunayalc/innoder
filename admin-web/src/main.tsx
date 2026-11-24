import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import './member.css';
import { language } from './locale';
document.documentElement.lang = language;

try {
  const saved = localStorage.getItem('inno_theme');
  document.documentElement.dataset.theme =
    saved === 'dark' ||
    (saved !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark'
      : 'light';
} catch {
  document.documentElement.dataset.theme = 'light';
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
