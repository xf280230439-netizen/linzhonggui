import ReactDOM from 'react-dom/client'
import '@radix-ui/themes/styles.css'
import './styles.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(console.error))
}
