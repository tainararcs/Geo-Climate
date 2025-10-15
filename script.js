
const searchInput = document.querySelector('.search-input');
const searchBtn = document.querySelector('.search-btn');
const resultDiv = document.querySelector('.result');
const weatherDiv = document.querySelector('.body-weather');
const preloader = document.querySelector('.preloader');
const searchHistory = document.querySelector('.search-history');

// Botão flutuante: alterna entre "ver mais" e "voltar ao topo"
const scrollBtn = document.querySelector('.scroll-btn');

// Histórico de pesquisa armazenado apenas em memória.
let history = [];

async function handleSearch() {
    const city = searchInput.value.trim();
    if (!city) {
        showError(new Error('Digite o nome de uma cidade'));
        return;
    }

    searchHistory.style.display = 'none'
    scrollBtn.style.display = 'none';
    preloader.style.display = 'block';
    resultDiv.innerHTML = '';

    await new Promise(resolve => setTimeout(resolve, 300)); // 0.3 segundo.

    try {
        // await faz o JavaScript esperar a resposta da API antes de continuar.
        const data = await fetch(`http://localhost:3000/api/climate?city=${encodeURIComponent(city)}`);
        showWeather(data);
        searchHistory.style.display = 'block'
        scrollBtn.style.display = 'block';
    } 
    catch (err) {
        showError(err);
    }
}

// Eventos.
searchBtn.addEventListener('click', handleSearch);

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSearch();
});

// Quando o usuário rola a página, atualiza o estado do botão
window.addEventListener('scroll', () => {
    
    const scrolled = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;

    // Alterna o ícone conforme a posição.
    if (scrolled < maxScroll * 0.4) {
        scrollBtn.innerHTML = '⬇';
        scrollBtn.title = 'Ver mais';
    } else {
        scrollBtn.innerHTML = '⬆';
        scrollBtn.title = 'Voltar ao topo';
    }
    
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const bodyHeight = document.body.offsetHeight;

    // Se a parte de baixo da janela chegou perto do final da página
    if (scrollTop + windowHeight >= bodyHeight - 50) {
        // botão vai para "fim da página"
        scrollBtn.style.position = 'absolute';
        scrollBtn.style.bottom = '20px'; // distância do final do conteúdo
    } else {
        // botão flutuante no canto
        scrollBtn.style.position = 'fixed';
        scrollBtn.style.bottom = '150px'; // posição original
    }
});

// Clique: desce ou sobe suavemente.
scrollBtn.addEventListener('click', () => {
    const scrolled = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;

    if (scrolled < maxScroll * 0.4) {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

// Busca dados da API OpenWeatherMap.
async function searchWeather(city) { 
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=pt_br`; 
    
    const response = await fetch(url);

    if (!response.ok) {
        console.log(`HTTP ERROR: ${response.status}`)
        throw new Error('Erro ao fazer requisição ou cidade não encontrada<br>Tente novamente');
    }

    return response.json(); 
}

// Detecta cidade pelo IP e aciona searchWeather(city).
async function detectCityAndSearch() {
  try {
    // Pega IP público.
    const ipResp = await fetch('https://api.ipify.org?format=json');
    if (!ipResp.ok) throw new Error('Não foi possível obter IP');
    const ipData = await ipResp.json();
    const ip = ipData.ip;

    // Geolocaliza pelo IP (ipapi.co).
    const geoResp = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!geoResp.ok) throw new Error('Erro ao consultar geolocalização');
    const geo = await geoResp.json();

    // Campos úteis.
    const city = geo.city || geo.region || geo.country_name;

    if (!city) {
      console.warn('Cidade não detectada pelo IP');
      return;
    }

    // Mostra no input de busca e dispara a pesquisa.
    searchInput.value = city;
    await handleSearch(); 

  } catch (err) {
    console.error('Erro detectCityAndSearch:', err);
  }
}

// Chama a detecção no carregamento.
window.addEventListener('load', () => {
  // Apenas se o campo de busca estiver vazio.
  if (!searchInput.value.trim()) detectCityAndSearch();
});
                 
// Converte timestamp (UTC) + timezone (segundos) para horário local formatado pt-BR HH:MM.
function formatTime(utcSeconds, timezoneSeconds) {
    const date = new Date((utcSeconds + timezoneSeconds) * 1000);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// Formata dia da semana e dia do mês em português.
function formatDate(dt, timezoneSeconds) {
    const date = new Date((dt + timezoneSeconds) * 1000);
    const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' });
    const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return { weekday, day };
}

// Muda o background do body conforme temperatura (°C).
function changeBackground(tempC) {
    let start, end;
    if (tempC <= 10) {
        start = '#e6f0ff'; end = '#d5f0ff';
    } else if (tempC <= 15) {
        start = '#e6f7ff'; end = '#dff9f3';
    } else if (tempC <= 20) {
        start = '#fff9e6'; end = '#fff4e0';
    } else if (tempC <= 26) {
        start = '#fff5e6'; end = '#ffe6d1';
    } else {
        start = '#fff0f0'; end = '#e4babaff';
    }
    document.body.style.setProperty('--bg-start', start);
    document.body.style.setProperty('--bg-end', end);
    weatherDiv.style.transform = 'translateY(0)';
}

// Renderiza os dados na interface.
function showWeather(data) {
    if (!data || typeof data !== 'object') {
        resultDiv.innerHTML = '<div class="error">Erro inesperado</div>';
        return;
    }

    const { main, weather, sys, dt, name, timezone } = data;
    const temp = main.temp;
    const tempMin = main.temp_min;
    const tempMax = main.temp_max;
    const weatherObj = (weather && weather[0]) || {};
    const description = weatherObj.description || '';
    const icon = weatherObj.icon || '01d';
    const country = sys.country || '';

    const { weekday, day } = formatDate(dt, timezone);
    const sunrise = formatTime(sys.sunrise, timezone);
    const sunset = formatTime(sys.sunset, timezone);

    changeBackground(temp);
    saveToHistory(name);

    preloader.style.display = 'none';
    resultDiv.innerHTML = `
        <div class="info-main">
            <div class="location">
                <div>
                    <h2>${name}${country ? ', ' + country : ''}</h2>
                    <div class="date">${weekday}, ${day}</div>
                </div>
            </div>

            <div class="temp">
                <div class="big">${Math.round(temp)}°C</div>
                
                <aside class="icon-card animate__animated animate__fadeIn">
                    <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}">
                    <div class="description">${description}</div>
                </aside>
            </div>
            
            <div class="cards-container">
                <span class="temps-mini cards">
                    <div class="temp-card">
                        <div class="label"> 🌡 Máxima</div>
                        <div class="value">${Math.round(tempMax)}°C</div>
                    </div>
                    <div class="temp-card">
                        <div class="label"> 🌡 Minima</div>
                        <div class="value">${Math.round(tempMin)}°C</div>
                    </div>
                </span>

                <span class="times cards">
                    <div class="time-card sunrise">
                        <div class="icon"></div>
                        <div class="time-info">
                            <div class="label"> ☀ Amanhecer</div>
                            <div class="value">${sunrise}</div>
                        </div>
                    </div>
                    <div class="time-card sunset">
                        <div class="icon"></div>
                        <div class="time-info">
                            <div class="label"> ☾⋆ Anoitecer</div>
                            <div class="value">${sunset}</div>
                        </div> 
                    </div>
                </span>
            </div">
        </div>
    `;

    resultDiv.classList.remove('animate__fadeIn');
    void resultDiv.offsetWidth;
    resultDiv.classList.add('animate__animated', 'animate__fadeIn');

    const iconBtn = document.getElementById('icon-card');
    iconBtn.addEventListener('click', () => {
        iconBtn.classList.add('animate__animated', 'animate__fadeIn');
    });
}

// Exibe mensagens de erro.
function showError(err) {
    let msg = 'Erro ao buscar os dados';
    msg = err.message;
    resultDiv.innerHTML = `<div class="error">${msg}</div>`;
    resultDiv.classList.remove('animate__shakeX');
    void resultDiv.offsetWidth;
    resultDiv.classList.add('animate__animated', 'animate__shakeX');
}

// Armazena e gerencia o histórico de pesquisas.
function saveToHistory(city) {
  if (!city) return;

  // Remove duplicadas.
  history = history.filter(item => item.toLowerCase() !== city.toLowerCase());

  // Adiciona no início.
  history.unshift(city);

  // Limita a 10 cidades.
  history = history.slice(0, 10);

  // Atualiza exibição.
  renderHistory();
}

// Renderiza o histórico na tela.
function renderHistory() {
  if (history.length === 0) {
    searchHistory.innerHTML = '<p class="muted">Nenhuma pesquisa recente</p>';
    return;
  }

  searchHistory.innerHTML = `
    <h3>Histórico de Pesquisas</h3>
    <ul class="history-list">
      ${history.map(city => `<li class="history-item">${city}</li>`).join('')}
    </ul>
  `;

  // Adiciona evento de clique para cada item.
  document.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      searchInput.value = item.textContent;
      handleSearch();
    });
  });
}
