# Интеграция темы для iframe

Этот документ описывает, как настроить родительское приложение для передачи информации о теме в iframe.

## Проблема

Из-за ограничений CORS (Cross-Origin Resource Sharing) iframe не может напрямую получить доступ к DOM родительского окна. 

## Решение (рекомендуется)

**Используйте URL параметр `theme`** - это самый простой и надежный способ.

Родительское приложение должно изменять URL iframe при переключении темы, добавляя параметр `theme=dark` или `theme=light`.

## Вариант 1: URL параметр (РЕКОМЕНДУЕТСЯ)

Самый простой способ - изменять URL iframe при переключении темы в родительском приложении.

### Пример кода для родительского приложения:

```javascript
// Функция для обновления URL iframe с темой
function updateIframeTheme(theme) {
  const iframe = document.querySelector('iframe[src*="vibro"]');
  if (iframe) {
    const currentSrc = iframe.src;
    const baseUrl = currentSrc.split('?')[0].split('#')[0];
    const hash = currentSrc.includes('#') ? currentSrc.split('#')[1] : '';
    
    // Обновить или добавить параметр theme
    let newHash = hash || '/vibro';
    if (newHash.includes('?')) {
      // Заменить существующий параметр theme
      newHash = newHash.replace(/[?&]theme=[^&]*/, '');
      newHash += (newHash.includes('?') ? '&' : '?') + `theme=${theme}`;
    } else {
      newHash += `?theme=${theme}`;
    }
    
    iframe.src = `${baseUrl}#${newHash}`;
  }
}

// Вызывать при переключении темы в родительском приложении:
function onThemeToggle() {
  const newTheme = /* ваша логика определения новой темы */ 'light'; // или 'dark'
  updateIframeTheme(newTheme);
}
```

### Или проще - при создании iframe:

```html
<!-- Для темной темы -->
<iframe src="https://vibro.constrtodo.ru:3445/#/vibro?theme=dark"></iframe>

<!-- Для светлой темы -->
<iframe src="https://vibro.constrtodo.ru:3445/#/vibro?theme=light"></iframe>
```

### React пример:

```jsx
function ParentApp() {
  const [theme, setTheme] = useState('dark');
  const iframeRef = useRef(null);
  
  useEffect(() => {
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.src;
      const baseUrl = currentSrc.split('#')[0];
      iframeRef.current.src = `${baseUrl}#/vibro?theme=${theme}`;
    }
  }, [theme]);
  
  return (
    <div>
      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        Переключить тему
      </button>
      <iframe 
        ref={iframeRef}
        src="https://vibro.constrtodo.ru:3445/#/vibro?theme=dark"
      />
    </div>
  );
}
```

## Вариант 2: PostMessage API

Родительское приложение может отправлять сообщения о текущей теме в iframe.

### Отправка темы при переключении

Добавьте код в родительское приложение, который будет отправлять сообщение о теме при её изменении:

```javascript
// Функция для отправки темы в iframe
function sendThemeToIframe(theme) {
  // Найти iframe (замените селектор на ваш)
  const iframe = document.querySelector('iframe[src*="vibro"]');
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({ theme: theme }, '*');
  }
}

// Пример: при переключении темы
function toggleTheme() {
  const currentTheme = document.body.classList.contains('dark') ? 'dark' : 'light';
  // Ваша логика переключения темы...
  
  // Отправить новую тему в iframe
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  sendThemeToIframe(newTheme);
}

// Или если используете React/Vue/etc:
// При изменении темы вызывайте:
// sendThemeToIframe('dark'); или sendThemeToIframe('light');
```

## Вариант 2: Ответ на запрос темы

Iframe периодически запрашивает тему. Родительское приложение может отвечать на эти запросы:

```javascript
// Слушатель для запросов темы от iframe
window.addEventListener('message', (event) => {
  // Проверьте origin для безопасности (опционально)
  // if (event.origin !== 'https://vibro.constrtodo.ru:3445') return;
  
  if (event.data && event.data.type === 'request-theme') {
    // Определите текущую тему
    const currentTheme = document.body.classList.contains('dark') 
      ? 'dark' 
      : 'light';
    
    // Отправьте тему обратно в iframe
    event.source.postMessage({ theme: currentTheme }, '*');
  }
});
```

## Вариант 3: Комбинированный подход (рекомендуется)

Отправляйте тему при изменении И отвечайте на запросы:

```javascript
// 1. Отправка темы при изменении
function sendThemeToIframe(theme) {
  const iframes = document.querySelectorAll('iframe[src*="vibro"]');
  iframes.forEach(iframe => {
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage({ theme: theme }, '*');
    }
  });
}

// 2. Ответ на запросы темы
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'request-theme') {
    const currentTheme = document.body.classList.contains('dark') 
      ? 'dark' 
      : 'light';
    event.source.postMessage({ theme: currentTheme }, '*');
  }
});

// 3. Отправка темы при загрузке страницы
window.addEventListener('load', () => {
  const currentTheme = document.body.classList.contains('dark') 
    ? 'dark' 
    : 'light';
  sendThemeToIframe(currentTheme);
});

// 4. Отправка темы при переключении
// В вашем обработчике переключения темы:
function onThemeToggle() {
  // Ваша логика переключения...
  const newTheme = /* определите новую тему */;
  sendThemeToIframe(newTheme);
}
```

## Определение текущей темы

В зависимости от того, как ваше приложение хранит информацию о теме:

```javascript
// Если используется класс на body:
const theme = document.body.classList.contains('dark') ? 'dark' : 'light';

// Если используется data-атрибут:
const theme = document.body.getAttribute('data-theme') || 'dark';

// Если используется CSS переменная:
const theme = getComputedStyle(document.documentElement)
  .getPropertyValue('--theme') === 'dark' ? 'dark' : 'light';

// Если используется localStorage:
const theme = localStorage.getItem('theme') || 'dark';
```

## Пример для React

```jsx
import { useEffect } from 'react';

function App() {
  const [theme, setTheme] = useState('dark');
  
  useEffect(() => {
    // Отправить тему в iframe при изменении
    const iframe = document.querySelector('iframe[src*="vibro"]');
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ theme }, '*');
    }
  }, [theme]);
  
  // ... остальной код
}
```

## Безопасность

Для повышения безопасности можно проверять origin сообщений:

```javascript
window.addEventListener('message', (event) => {
  // Разрешить только с определенного домена
  if (event.origin !== 'https://vibro.constrtodo.ru:3445') {
    return;
  }
  
  // ... обработка сообщений
});
```

## Тестирование

### Тестирование из консоли iframe

Вы можете протестировать переключение темы прямо из консоли браузера iframe:

```javascript
// В консоли iframe (откройте DevTools на странице iframe):
window.__setIframeTheme('dark');  // Установить темную тему
window.__setIframeTheme('light'); // Установить светлую тему
```

### Тестирование из консоли родительского приложения

Вы можете отправить сообщение о теме из консоли родительского приложения:

```javascript
// В консоли родительского приложения:
const iframe = document.querySelector('iframe[src*="vibro"]');
if (iframe?.contentWindow) {
  iframe.contentWindow.postMessage({ theme: 'dark' }, '*');
  // или
  iframe.contentWindow.postMessage({ theme: 'light' }, '*');
}
```

### Проверка работы

После настройки проверьте в консоли браузера iframe:
- Должны появиться сообщения: `[Theme Detection] Requested theme from parent`
- При отправке темы: `[Theme Detection] Received theme from parent: dark/light`
- При изменении темы: `[Theme Detection] Theme changed from dark to light`
- Если тема не получена через 3 секунды, появится предупреждение с инструкциями

