import { StrictMode } from 'react'; import { createRoot } from 'react-dom/client'; import { BrowserRouter } from 'react-router-dom'; import { AppStore } from './store/app-store'; import { App } from './ui/App'; import './styles.css'; import './overrides.css';
createRoot(document.getElementById('root')!).render(<StrictMode><BrowserRouter><AppStore><App /></AppStore></BrowserRouter></StrictMode>);
