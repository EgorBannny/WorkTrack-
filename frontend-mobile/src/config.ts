// ─── Конфигурация API ─────────────────────────────────────
//
// LOCAL_IP: IP вашего компьютера в локальной сети (не localhost!).
// Узнать: ifconfig / ip addr (Linux), ipconfig (Windows).
//
// Для production замените PROD_URL на адрес вашего сервера.

const LOCAL_IP = '192.168.1.68'
const LOCAL_PORT = 8000

const PROD_URL = 'https://work-track.ru'

export const API_BASE_URL = __DEV__
  ? `http://${LOCAL_IP}:${LOCAL_PORT}`
  : PROD_URL