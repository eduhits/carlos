// Configurações
const API_BASE_URL = '/.netlify/functions/api';
const urlParams = new URLSearchParams(window.location.search);
const CURRENT_PAGE = urlParams.get('page') || 'home';
const MEDIA_ID = parseInt(urlParams.get('id') || '0', 10);
const MEDIA_TYPE = urlParams.get('type') || '';
const SEARCH_QUERY = urlParams.get('q') || '';
const APP_DOWNLOAD_LINK = '#';

// Elementos DOM
const heroSection = document.getElementById('hero');
const heroTitle = document.getElementById('hero-title');
const heroDesc = document.getElementById('hero-desc');
const heroPlayBtn = document.getElementById('hero-play');
const heroInfoBtn = document.getElementById('hero-info');
const categoriesContainer = document.getElementById('categories-container');
const searchResults = document.getElementById('search-results');
const searchInput = document.getElementById('search-input');
const headerSearchInput = document.getElementById('header-search-input');
const playerModal = document.getElementById('player-modal');
const playerModalClose = document.getElementById('player-modal-close');
const playerLoading = document.getElementById('player-loading');
const videoPlayer = document.getElementById('video-player');
const favoritesContainer = document.getElementById('favorites-container');
const trailerVideo = document.getElementById('trailer-video');
const trailerPlaceholder = document.getElementById('trailer-placeholder');
const pages = document.querySelectorAll('.page');
const bottomNavItems = document.querySelectorAll('.bottom-nav .nav-item');

// Estado da aplicação
let currentMedia = {};
let currentPage = {
  search: 1
};
let totalPages = {
  search: 1
};
let categoryPages = {
  popular: 1,
  movies: 1,
  tv: 1,
  anime: 1
};

// Helpers
function setActivePage() {
  let matched = false;
  pages.forEach(page => {
    const isActive = page.dataset.page === CURRENT_PAGE;
    if (isActive) matched = true;
    page.classList.toggle('active', isActive);
    page.style.display = isActive ? 'block' : 'none';
  });

  if (!matched && pages[0]) {
    pages.forEach(page => {
      const isHome = page.dataset.page === 'home';
      page.classList.toggle('active', isHome);
      page.style.display = isHome ? 'block' : 'none';
    });
  }

  const activePage = matched ? CURRENT_PAGE : 'home';

  bottomNavItems.forEach(item => {
    const href = item.getAttribute('href') || '';
    const params = new URLSearchParams(href.split('?')[1] || '');
    const page = params.get('page') || 'home';
    item.classList.toggle('active', page === activePage);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setActivePage();
  
  // Event listeners para pesquisa no header
  headerSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = headerSearchInput.value.trim();
      if (query) {
        window.location.href = `?page=search&q=${encodeURIComponent(query)}`;
      }
    }
  });
  
  // Fechar player modal
  playerModalClose.addEventListener('click', closePlayerModal);
  
  // Carregar conteúdo baseado na página atual
  switch(CURRENT_PAGE) {
    case 'home':
      loadHeroBanner();
      loadCategories();
      break;
    case 'search':
      setupSearch();
      break;
    case 'favorites':
      loadFavorites();
      break;
    case 'details':
      loadDetailsPage();
      break;
  }
  
  setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
  // Botões no hero
  if (heroPlayBtn) {
    heroPlayBtn.addEventListener('click', () => {
      if (currentMedia.id) openPlayer(currentMedia.id, currentMedia.media_type || 'movie');
    });
  }
  if (heroInfoBtn) {
    heroInfoBtn.addEventListener('click', () => {
      if (currentMedia.id) openDetailsPage(currentMedia.id, currentMedia.media_type || 'movie');
    });
  }
}

// Carregar banner principal
async function loadHeroBanner() {
  try {
    const url = `${API_BASE_URL}?api=hero`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.error('Erro no banner:', data.error);
      return;
    }
    
    // Escolher um item aleatório
    const randomIndex = Math.floor(Math.random() * data.results.length);
    const media = data.results[randomIndex];
    currentMedia = media;
    
    // Atualizar UI
    heroTitle.textContent = media.title || media.name;
    
    // Descrição limitada a 150 caracteres
    let overview = media.overview || '';
    if (overview.length > 150) {
      overview = overview.substring(0, 150) + '...';
    }
    heroDesc.textContent = overview;
    
    // Definir imagem de fundo
    const backdropUrl = media.backdrop_path 
      ? `https://image.tmdb.org/t/p/original${media.backdrop_path}`
      : 'https://via.placeholder.com/1920x1080?text=NFLIX';
    
    heroSection.style.backgroundImage = `url(${backdropUrl})`;
    
    // Atualizar meta tags para SEO
    updateMetaTags(
      media.title || media.name,
      overview,
      backdropUrl
    );
    
  } catch (error) {
    console.error('Erro ao carregar banner:', error);
  }
}

// Atualizar meta tags para SEO
function updateMetaTags(title, description, image) {
  // Atualizar título
  document.title = `${title} - NFLIX`;
  
  // Atualizar meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', description);
  }
  
  // Atualizar meta og (Open Graph)
  let metaOgTitle = document.querySelector('meta[property="og:title"]');
  if (!metaOgTitle) {
    metaOgTitle = document.createElement('meta');
    metaOgTitle.setAttribute('property', 'og:title');
    document.head.appendChild(metaOgTitle);
  }
  metaOgTitle.setAttribute('content', title);
  
  let metaOgDescription = document.querySelector('meta[property="og:description"]');
  if (!metaOgDescription) {
    metaOgDescription = document.createElement('meta');
    metaOgDescription.setAttribute('property', 'og:description');
    document.head.appendChild(metaOgDescription);
  }
  metaOgDescription.setAttribute('content', description);
  
  let metaOgImage = document.querySelector('meta[property="og:image"]');
  if (!metaOgImage) {
    metaOgImage = document.createElement('meta');
    metaOgImage.setAttribute('property', 'og:image');
    document.head.appendChild(metaOgImage);
  }
  metaOgImage.setAttribute('content', image);
  
  let metaOgUrl = document.querySelector('meta[property="og:url"]');
  if (!metaOgUrl) {
    metaOgUrl = document.createElement('meta');
    metaOgUrl.setAttribute('property', 'og:url');
    document.head.appendChild(metaOgUrl);
  }
  metaOgUrl.setAttribute('content', window.location.href);
}

// Carregar categorias com paginação
async function loadCategories() {
  categoriesContainer.innerHTML = '';
  
  // Categorias pré-definidas
  const categories = [
    { 
      id: 'popular', 
      title: 'Populares', 
      apiType: 'hero',
      currentPage: categoryPages.popular
    },
    { 
      id: 'movies', 
      title: 'Filmes Populares', 
      apiType: 'movies',
      currentPage: categoryPages.movies
    },
    { 
      id: 'tv', 
      title: 'Séries Populares', 
      apiType: 'tv',
      currentPage: categoryPages.tv
    },
    { 
      id: 'anime', 
      title: 'Animes', 
      apiType: 'anime',
      currentPage: categoryPages.anime
    }
  ];
  
  // Carregar cada categoria
  for (const category of categories) {
    try {
      const response = await fetch(`${API_BASE_URL}?api=${category.apiType}&page=${category.currentPage}`);
      const data = await response.json();
      
      if (data.error) {
        console.error(`Erro na categoria ${category.title}:`, data.error);
        continue;
      }
      
      // Criar seção da categoria com paginação
      const categoryHTML = `
        <div class="category" id="category-${category.id}">
          <h2 class="section-title">
            ${category.title}
            <span class="view-all" onclick="loadMoreCategory('${category.id}', '${category.apiType}', ${category.currentPage + 1})">
              Ver Mais
            </span>
          </h2>
          <div class="carousel" id="${category.id}">
            ${data.results.slice(0, 10).map(item => createMediaItem(item)).join('')}
          </div>
          <div class="category-pagination" id="pagination-${category.id}">
            ${createCategoryPagination(category.id, category.apiType, category.currentPage, data.total_pages)}
          </div>
        </div>
      `;
      
      categoriesContainer.innerHTML += categoryHTML;
    } catch (error) {
      console.error(`Erro ao carregar categoria ${category.title}:`, error);
    }
  }
  
  // Adicionar event listeners aos itens
  document.querySelectorAll('.item').forEach(item => {
    item.addEventListener('click', () => {
      const mediaId = item.dataset.id;
      const mediaType = item.dataset.type;
      openDetailsPage(mediaId, mediaType);
    });
  });
}

// Carregar mais itens de uma categoria
async function loadMoreCategory(categoryId, apiType, page) {
  try {
    const response = await fetch(`${API_BASE_URL}?api=${apiType}&page=${page}`);
    const data = await response.json();
    
    if (data.error) {
      console.error(`Erro ao carregar mais ${categoryId}:`, data.error);
      return;
    }
    
    // Atualizar página atual
    categoryPages[categoryId] = page;
    
    // Atualizar carrossel
    const carousel = document.getElementById(categoryId);
    carousel.innerHTML = data.results.slice(0, 10).map(item => createMediaItem(item)).join('');
    
    // Atualizar paginação
    const pagination = document.getElementById(`pagination-${categoryId}`);
    pagination.innerHTML = createCategoryPagination(categoryId, apiType, page, data.total_pages);
    
    // Re-adicionar event listeners
    document.querySelectorAll(`#${categoryId} .item`).forEach(item => {
      item.addEventListener('click', () => {
        const mediaId = item.dataset.id;
        const mediaType = item.dataset.type;
        openDetailsPage(mediaId, mediaType);
      });
    });
    
  } catch (error) {
    console.error(`Erro ao carregar mais ${categoryId}:`, error);
  }
}

// Criar paginação para categorias
function createCategoryPagination(categoryId, apiType, currentPage, totalPages) {
  // Limitar total de páginas
  totalPages = Math.min(totalPages, 10);
  
  let paginationHTML = '';
  
  // Botão anterior
  if (currentPage > 1) {
    paginationHTML += `
      <button class="category-pagination-btn" onclick="loadMoreCategory('${categoryId}', '${apiType}', ${currentPage - 1})">
        <i class="fas fa-chevron-left"></i>
      </button>
    `;
  } else {
    paginationHTML += `<button class="category-pagination-btn" disabled><i class="fas fa-chevron-left"></i></button>`;
  }
  
  // Informação da página atual
  paginationHTML += `<span class="category-pagination-info">Página ${currentPage} de ${totalPages}</span>`;
  
  // Botão próximo
  if (currentPage < totalPages) {
    paginationHTML += `
      <button class="category-pagination-btn" onclick="loadMoreCategory('${categoryId}', '${apiType}', ${currentPage + 1})">
        <i class="fas fa-chevron-right"></i>
      </button>
    `;
  } else {
    paginationHTML += `<button class="category-pagination-btn" disabled><i class="fas fa-chevron-right"></i></button>`;
  }
  
  return paginationHTML;
}

// Carregar favoritos do localStorage
function loadFavorites() {
  try {
    const favorites = getFavorites();
    
    if (!favorites || favorites.length === 0) {
      favoritesContainer.innerHTML = '<p style="text-align: center; padding: 40px; color: #aaa;">Nenhum favorito encontrado</p>';
      return;
    }
    
    // Carregar detalhes de cada favorito
    Promise.all(
      favorites.map(async fav => {
        try {
          const url = `${API_BASE_URL}?api=details&id=${fav.id}&media_type=${fav.type}`;
          const response = await fetch(url);
          const data = await response.json();
          return {
            ...data,
            media_type: fav.type
          };
        } catch (error) {
          console.error('Erro ao carregar detalhes do favorito:', error);
          return null;
        }
      })
    ).then(favoritesWithDetails => {
      // Filtrar itens válidos
      const validFavorites = favoritesWithDetails.filter(item => item !== null);
      
      if (validFavorites.length === 0) {
        favoritesContainer.innerHTML = '<p style="text-align: center; padding: 40px; color: #aaa;">Erro ao carregar favoritos</p>';
        return;
      }
      
      favoritesContainer.innerHTML = validFavorites.map(item => createGridItem(item)).join('');
      
      document.querySelectorAll('.grid-item').forEach(item => {
        item.addEventListener('click', () => {
          const mediaId = item.dataset.id;
          const mediaType = item.dataset.type;
          openDetailsPage(mediaId, mediaType);
        });
      });
    });
  } catch (error) {
    console.error('Erro ao carregar favoritos:', error);
    favoritesContainer.innerHTML = '<p style="text-align: center; padding: 40px; color: #aaa;">Erro ao carregar favoritos</p>';
  }
}

// Carregar página de detalhes
async function loadDetailsPage() {
  if (!MEDIA_ID || !MEDIA_TYPE) {
    window.location.href = '?page=home';
    return;
  }
  
  try {
    const url = `${API_BASE_URL}?api=details&id=${MEDIA_ID}&media_type=${MEDIA_TYPE}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.error('Erro nos detalhes:', data.error);
      return;
    }
    
    currentMedia = data;
    currentMedia.media_type = MEDIA_TYPE;
    
    // Preencher informações da página
    const detailsTitle = document.getElementById('details-title');
    const detailsOverview = document.getElementById('details-overview');
    const detailsMeta = document.getElementById('details-meta');
    const detailsHeader = document.getElementById('details-header');
    const detailsPoster = document.getElementById('details-poster');
    
    detailsTitle.textContent = data.title || data.name;
    detailsOverview.textContent = data.overview || 'Descrição não disponível.';
    
    // Atualizar meta tags para SEO
    updateMetaTags(
      data.title || data.name,
      data.overview || 'Assista agora no NFLIX',
      data.backdrop_path 
        ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
        : 'https://via.placeholder.com/1920x1080?text=NFLIX'
    );
    
    // Criar meta informações
    const releaseDate = data.release_date || data.first_air_date;
    const year = releaseDate ? releaseDate.split('-')[0] : 'N/A';
    
    let metaHTML = '';
    if (MEDIA_TYPE === 'movie') {
      const runtime = data.runtime ? 
        `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m` : 'N/A';
        
      metaHTML = `
        <span>${year}</span>
        <span>${runtime}</span>
        <span>⭐ ${data.vote_average ? data.vote_average.toFixed(1) : 'N/A'}</span>
      `;
    } else {
      const seasons = data.number_of_seasons ? `${data.number_of_seasons} temporada${data.number_of_seasons > 1 ? 's' : ''}` : 'N/A';
      metaHTML = `
        <span>${year}</span>
        <span>${seasons}</span>
        <span>⭐ ${data.vote_average ? data.vote_average.toFixed(1) : 'N/A'}</span>
      `;
    }
    
    detailsMeta.innerHTML = metaHTML;
    
    // Definir imagem de fundo do cabeçalho
    const backdropUrl = data.backdrop_path 
        ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
        : 'https://via.placeholder.com/1920x1080?text=NFLIX';
    
    detailsHeader.style.backgroundImage = `url(${backdropUrl})`;
    
    // Definir poster
    const posterUrl = data.poster_path 
        ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
        : 'https://via.placeholder.com/500x750?text=Sem+Imagem';
    
    detailsPoster.src = posterUrl;
    
    // Verificar se é favorito
    checkFavoriteStatus(data.id, MEDIA_TYPE);
    
    // Configurar botão de play
    const detailsPlayBtn = document.getElementById('details-play');
    detailsPlayBtn.onclick = () => {
      openPlayer(data.id, MEDIA_TYPE);
    };
    
    // Configurar botão de compartilhar
    const detailsShareBtn = document.getElementById('details-share');
    detailsShareBtn.onclick = () => {
      const url = new URL(window.location.href);
      
      if (navigator.share) {
        navigator.share({
          title: data.title || data.name,
          text: 'Confira este conteúdo no NFLIX!',
          url: url.toString()
        })
        .catch(error => console.log('Erro ao compartilhar:', error));
      } else {
        navigator.clipboard.writeText(url.toString())
          .then(() => alert('Link copiado para a área de transferência!'))
          .catch(err => console.error('Erro ao copiar link:', err));
      }
    };
    
    // Buscar informações adicionais
    try {
      // Buscar créditos (elenco)
      const creditsUrl = `${API_BASE_URL}?api=credits&id=${MEDIA_ID}&media_type=${MEDIA_TYPE}`;
      const creditsResponse = await fetch(creditsUrl);
      const creditsData = await creditsResponse.json();
      if (!creditsData.error) {
        showCast(creditsData.cast.slice(0, 10)); // Mostrar os 10 primeiros
      }
      
      // Buscar trailer
      await loadTrailer(MEDIA_ID, MEDIA_TYPE);
      
      // Buscar recomendações
      const recommendationsUrl = `${API_BASE_URL}?api=recommendations&id=${MEDIA_ID}&media_type=${MEDIA_TYPE}`;
      const recommendationsResponse = await fetch(recommendationsUrl);
      const recommendationsData = await recommendationsResponse.json();
      if (!recommendationsData.error) {
        showRecommendations(recommendationsData.results.slice(0, 10)); // Mostrar 10 recomendações
      }
      
    } catch (error) {
      console.error('Erro ao carregar informações adicionais:', error);
    }
    
  } catch (error) {
    console.error('Erro ao carregar detalhes:', error);
  }
}

// Carregar trailer
async function loadTrailer(id, type) {
  try {
    const response = await fetch(`/.netlify/functions/api?api=videos&id=${id}&type=${type}`);
    const data = await response.json();
    
    if (data.error || !data.results || data.results.length === 0) {
      trailerPlaceholder.textContent = 'Trailer não disponível';
      return;
    }
    
    const youtubeVideos = data.results.filter(video => video.site === 'YouTube');
    const official = youtubeVideos.find(video => video.type === 'Trailer' || video.type === 'Teaser');
    const video = official || youtubeVideos[0];
    
    if (video) {
      // Mostrar trailer do YouTube
      trailerVideo.src = `https://www.youtube.com/embed/${video.key}?rel=0&showinfo=0&autoplay=0`;
      trailerVideo.style.display = 'block';
      trailerPlaceholder.style.display = 'none';
    } else {
      trailerPlaceholder.textContent = 'Trailer não disponível';
    }
    
  } catch (error) {
    console.error('Erro ao carregar trailer:', error);
    trailerPlaceholder.textContent = 'Erro ao carregar trailer';
  }
}

// Abrir página de detalhes
function openDetailsPage(id, type) {
  window.location.href = `?page=details&id=${id}&type=${type}`;
}

// Obter favoritos do localStorage
function getFavorites() {
  try {
    const favorites = localStorage.getItem('favorites');
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Erro ao obter favoritos:', error);
    return [];
  }
}

// Salvar favoritos no localStorage
function saveFavorites(favorites) {
  try {
    localStorage.setItem('favorites', JSON.stringify(favorites));
    return true;
  } catch (error) {
    console.error('Erro ao salvar favoritos:', error);
    return false;
  }
}

// Verificar status de favorito
function checkFavoriteStatus(mediaId, mediaType) {
  const favorites = getFavorites();
  const isFavorite = favorites.some(fav => 
    fav.id == mediaId && fav.type === mediaType
  );
  
  const detailsFavoriteBtn = document.getElementById('details-favorite');
  if (!detailsFavoriteBtn) return;
  
  if (isFavorite) {
    detailsFavoriteBtn.innerHTML = '<i class="fas fa-check"></i> Na Minha Lista';
    detailsFavoriteBtn.onclick = () => removeFavorite(mediaId, mediaType);
  } else {
    detailsFavoriteBtn.innerHTML = '<i class="fas fa-plus"></i> Minha Lista';
    detailsFavoriteBtn.onclick = () => addFavorite(mediaId, mediaType);
  }
}

// Adicionar favorito
function addFavorite(mediaId, mediaType) {
  const favorites = getFavorites();
  const newFavorite = { id: mediaId, type: mediaType };
  
  // Verificar se já não está na lista
  if (!favorites.some(fav => 
    fav.id == mediaId && fav.type === mediaType
  )) {
    favorites.push(newFavorite);
    saveFavorites(favorites);
    const detailsFavoriteBtn = document.getElementById('details-favorite');
    if (detailsFavoriteBtn) {
      detailsFavoriteBtn.innerHTML = '<i class="fas fa-check"></i> Na Minha Lista';
      detailsFavoriteBtn.onclick = () => removeFavorite(mediaId, mediaType);
    }
  }
}

// Remover favorito
function removeFavorite(mediaId, mediaType) {
  let favorites = getFavorites();
  favorites = favorites.filter(fav => 
    !(fav.id == mediaId && fav.type === mediaType)
  );
  saveFavorites(favorites);
  const detailsFavoriteBtn = document.getElementById('details-favorite');
  if (detailsFavoriteBtn) {
    detailsFavoriteBtn.innerHTML = '<i class="fas fa-plus"></i> Minha Lista';
    detailsFavoriteBtn.onclick = () => addFavorite(mediaId, mediaType);
  }
}

// Configurar busca
function setupSearch() {
  if (SEARCH_QUERY) {
    searchInput.value = SEARCH_QUERY;
    performSearch(SEARCH_QUERY);
  }
  
  // Pesquisa em tempo real
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    if (query.length < 3) {
      searchResults.innerHTML = '';
      document.getElementById('search-pagination').innerHTML = '';
      return;
    }
    searchTimeout = setTimeout(() => {
      currentPage.search = 1;
      searchResults.innerHTML = '';
      performSearch(query);
    }, 500);
  });
}

// Realizar busca com paginação
async function performSearch(query, page = 1) {
  if (!query) {
    searchResults.innerHTML = '<p style="text-align: center; padding: 40px; color: #aaa;">Digite um termo de pesquisa</p>';
    return;
  }
  
  if (page === 1) {
    searchResults.innerHTML = '<p style="text-align: center; padding: 40px; color: #aaa;">Pesquisando...</p>';
  }
  
  try {
    currentPage.search = page;
    const url = `${API_BASE_URL}?api=search&query=${encodeURIComponent(query)}&page=${page}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.error('Erro na pesquisa:', data.error);
      searchResults.innerHTML = '<p style="text-align: center; padding: 40px; color: #aaa;">Erro ao pesquisar</p>';
      return;
    }
    
    if (data.results.length === 0) {
      searchResults.innerHTML = '<p style="text-align: center; padding: 40px; color: #aaa;">Nenhum resultado encontrado</p>';
      return;
    }
    
    // Filtrar apenas filmes e séries
    const filteredResults = data.results.filter(item => 
      item.media_type === 'movie' || item.media_type === 'tv'
    );
    
    if (filteredResults.length === 0) {
      searchResults.innerHTML = '<p style="text-align: center; padding: 40px; color: #aaa;">Nenhum resultado encontrado</p>';
      return;
    }
    
    // Atualizar total de páginas
    totalPages.search = data.total_pages > 500 ? 500 : data.total_pages;
    
    searchResults.innerHTML = filteredResults.map(item => createGridItem(item)).join('');
    
    document.querySelectorAll('.grid-item').forEach(item => {
      item.addEventListener('click', () => {
        const mediaId = item.dataset.id;
        const mediaType = item.dataset.type;
        openDetailsPage(mediaId, mediaType);
      });
    });
    
    // Atualizar paginação
    updateSearchPagination(page, totalPages.search, query);
    
  } catch (error) {
    console.error('Erro na pesquisa:', error);
    searchResults.innerHTML = '<p style="text-align: center; padding: 40px; color: #aaa;">Erro ao pesquisar</p>';
  } finally {
    const loadingElement = document.getElementById('search-loading');
    if (loadingElement) loadingElement.style.display = 'none';
  }
}

// Atualizar paginação da busca
function updateSearchPagination(currentPage, totalPages, query) {
  const paginationElement = document.getElementById('search-pagination');
  if (!paginationElement) return;
  
  // Limitar total de páginas para melhor performance
  totalPages = Math.min(totalPages, 500);
  
  let paginationHTML = '';
  
  // Botão anterior
  if (currentPage > 1) {
    paginationHTML += `<button class="pagination-btn" onclick="performSearch('${query}', ${currentPage - 1})">Anterior</button>`;
  } else {
    paginationHTML += `<button class="pagination-btn" disabled>Anterior</button>`;
  }
  
  // Informação da página atual
  paginationHTML += `<span class="pagination-info">Página ${currentPage} de ${totalPages}</span>`;
  
  // Botão próximo
  if (currentPage < totalPages) {
    paginationHTML += `<button class="pagination-btn" onclick="performSearch('${query}', ${currentPage + 1})">Próxima</button>`;
  } else {
    paginationHTML += `<button class="pagination-btn" disabled>Próxima</button>`;
  }
  
  paginationElement.innerHTML = paginationHTML;
}

// Abrir player (CORRIGIDO)
async function openPlayer(id, type) {
  try {
    // Mostrar loading no player
    playerLoading.style.display = 'flex';
    videoPlayer.style.display = 'none';
    playerModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    console.log('Abrindo player para:', { id, type });
    
    // URL CORRETA para o player
    const response = await fetch(`/.netlify/functions/api?api=player&id=${id}&type=${type}`);
    const data = await response.json();
    
    if (data.error) {
      console.error('Erro ao obter URL do player:', data.error);
      playerLoading.innerHTML = `
        <div style="text-align: center;">
          <div class="spinner" style="border-top-color: #ff4444;"></div>
          <p>Erro ao carregar o player</p>
          <p style="font-size: 0.9rem; color: #ccc;">${data.error}</p>
          <button onclick="closePlayerModal()" style="margin-top: 20px; padding: 10px 20px; background: var(--primary-red); color: white; border: none; border-radius: 4px; cursor: pointer;">Fechar</button>
        </div>
      `;
      return;
    }
    
    console.log('Player URL recebida:', data.url);
    
    // Esconder loading e mostrar player
    videoPlayer.src = data.url;
    videoPlayer.style.display = 'block';
    playerLoading.style.display = 'none';
    
    // Event listeners para o player
    videoPlayer.addEventListener('load', () => {
      console.log('Player carregado com sucesso');
      playerLoading.style.display = 'none';
    });
    
    videoPlayer.addEventListener('error', (e) => {
      console.error('Erro no player:', e);
      playerLoading.innerHTML = `
        <div style="text-align: center;">
          <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ff4444; margin-bottom: 20px;"></i>
          <p>Conteúdo não disponível</p>
          <p style="font-size: 0.9rem; color: #ccc;">Este conteúdo pode não estar disponível no momento.</p>
          <button onclick="closePlayerModal()" style="margin-top: 20px; padding: 10px 20px; background: var(--primary-red); color: white; border: none; border-radius: 4px; cursor: pointer;">Fechar</button>
        </div>
      `;
      playerLoading.style.display = 'flex';
      videoPlayer.style.display = 'none';
    });
    
  } catch (error) {
    console.error('Erro ao abrir player:', error);
    playerLoading.innerHTML = `
      <div style="text-align: center;">
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ff4444; margin-bottom: 20px;"></i>
        <p>Erro ao carregar o player</p>
        <p style="font-size: 0.9rem; color: #ccc;">Tente novamente mais tarde.</p>
        <button onclick="closePlayerModal()" style="margin-top: 20px; padding: 10px 20px; background: var(--primary-red); color: white; border: none; border-radius: 4px; cursor: pointer;">Fechar</button>
      </div>
    `;
    playerLoading.style.display = 'flex';
  }
}

// Mostrar elenco
function showCast(cast) {
  const castContainer = document.getElementById('cast-container');
  if (!castContainer) return;
  
  if (cast.length === 0) {
    castContainer.innerHTML = '<p style="text-align: center; padding: 20px; color: #aaa;">Elenco não disponível</p>';
    return;
  }
  
  castContainer.innerHTML = cast.map(person => {
    const photoUrl = person.profile_path 
      ? `https://image.tmdb.org/t/p/w200${person.profile_path}`
      : 'https://via.placeholder.com/200x300?text=Sem+Imagem';
    
    return `
      <div class="cast-member">
        <img src="${photoUrl}" alt="${person.name}" class="cast-photo">
        <div class="cast-name">${person.name}</div>
        <div class="cast-character">${person.character}</div>
      </div>
    `;
  }).join('');
}

// Mostrar recomendações
function showRecommendations(recommendations) {
  const recommendationsCarousel = document.getElementById('recommendations-carousel');
  if (!recommendationsCarousel) return;
  
  if (recommendations.length === 0) {
    recommendationsCarousel.innerHTML = '<p style="text-align: center; padding: 20px; color: #aaa;">Nenhuma recomendação disponível</p>';
    return;
  }
  
  recommendationsCarousel.innerHTML = recommendations.map(item => {
    const posterUrl = item.poster_path 
      ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
      : 'https://via.placeholder.com/500x750?text=Sem+Imagem';
    
    const mediaType = item.title ? 'movie' : 'tv';
    
    return `
      <div class="item" data-id="${item.id}" data-type="${mediaType}">
        <img src="${posterUrl}" alt="${item.title || item.name}" class="item-poster" loading="lazy">
      </div>
    `;
  }).join('');
  
  // Adicionar event listeners aos itens de recomendação
  document.querySelectorAll('#recommendations-carousel .item').forEach(item => {
    item.addEventListener('click', () => {
      const mediaId = item.dataset.id;
      const mediaType = item.dataset.type;
      openDetailsPage(mediaId, mediaType);
    });
  });
}

// Criar item de mídia para carrossel
function createMediaItem(item) {
  const title = item.title || item.name;
  let mediaType = item.media_type;
  
  if (!mediaType) {
    mediaType = item.title ? 'movie' : 'tv';
  }
  
  const posterUrl = item.poster_path 
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : 'https://via.placeholder.com/500x750?text=Sem+Imagem';
  
  return `
    <div class="item" data-id="${item.id}" data-type="${mediaType}">
      <img src="${posterUrl}" alt="${title}" class="item-poster" loading="lazy">
    </div>
  `;
}

// Criar item de mídia para grid
function createGridItem(item) {
  const title = item.title || item.name;
  let mediaType = item.media_type;
  
  if (!mediaType) {
    mediaType = item.title ? 'movie' : 'tv';
  }
  
  const posterUrl = item.poster_path 
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : 'https://via.placeholder.com/500x750?text=Sem+Imagem';
  
  return `
    <div class="grid-item" data-id="${item.id}" data-type="${mediaType}">
      <img src="${posterUrl}" alt="${title}" class="grid-poster" loading="lazy">
      <div class="grid-title">${title}</div>
    </div>
  `;
}

// Fechar modal do player
function closePlayerModal() {
  playerModal.style.display = 'none';
  videoPlayer.src = '';
  document.body.style.overflow = 'auto';
}