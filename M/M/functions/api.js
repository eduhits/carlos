// functions/api.js - API atualizada para o player
exports.handler = async function(event, context) {
  const { path } = event;
  const queryParams = event.queryStringParameters;
  
  // Configurações da API
  const TMDB_API_KEY = process.env.TMDB_API_KEY || 'b73f5479e8443355e40462afe494fc52';
  const TMDB_LANG = process.env.TMDB_LANG || 'pt-BR';
  const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
  const PLAYER_BASE_MOVIE = process.env.PLAYER_BASE_MOVIE || 'https://playerflixapi.com/filme/';
  const PLAYER_BASE_TV = process.env.PLAYER_BASE_TV || 'https://playerflixapi.com/serie/';
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  try {
    // Rota para dados da API TMDB
    if (path.includes('/.netlify/functions/api')) {
      const apiType = queryParams.api;
      const page = parseInt(queryParams.page) || 1;
      const id = parseInt(queryParams.id) || 0;
      const mediaType = queryParams.media_type || queryParams.type || 'movie';
      const query = queryParams.query || '';
      
      let url = '';
      
      switch (apiType) {
        case 'hero':
          url = `${TMDB_BASE_URL}/trending/all/day?api_key=${TMDB_API_KEY}&language=${TMDB_LANG}`;
          break;
        case 'movies':
          url = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=${TMDB_LANG}&page=${page}`;
          break;
        case 'tv':
          url = `${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&language=${TMDB_LANG}&page=${page}`;
          break;
        case 'anime':
          url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&language=${TMDB_LANG}&with_genres=16&sort_by=popularity.desc&page=${page}`;
          break;
        case 'search':
          url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&language=${TMDB_LANG}&query=${encodeURIComponent(query)}&page=${page}`;
          break;
        case 'details':
          url = `${TMDB_BASE_URL}/${mediaType}/${id}?api_key=${TMDB_API_KEY}&language=${TMDB_LANG}&append_to_response=credits,videos,recommendations`;
          break;
        case 'credits':
          url = `${TMDB_BASE_URL}/${mediaType}/${id}/credits?api_key=${TMDB_API_KEY}&language=${TMDB_LANG}`;
          break;
        case 'recommendations':
          url = `${TMDB_BASE_URL}/${mediaType}/${id}/recommendations?api_key=${TMDB_API_KEY}&language=${TMDB_LANG}&page=1`;
          break;
        case 'videos':
          url = `${TMDB_BASE_URL}/${mediaType}/${id}/videos?api_key=${TMDB_API_KEY}&language=${TMDB_LANG}`;
          break;
        case 'player':
          // Rota do player movida para dentro do switch
          if (!id) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'ID não fornecido' })
            };
          }
          
          // URL CORRIGIDA do player com ID do TMDB
          const playerUrl = mediaType === 'movie' 
            ? `${PLAYER_BASE_MOVIE}${id}`
            : `${PLAYER_BASE_TV}${id}`;
          
          console.log('Player URL gerada:', playerUrl);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              url: playerUrl,
              success: true,
              id: id,
              type: mediaType
            })
          };
        default:
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Tipo de API inválido' })
          };
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    }
    
    // Nova rota para verificar disponibilidade do player
    if (path.includes('/.netlify/functions/check-player')) {
      const id = parseInt(queryParams.id) || 0;
      const type = queryParams.type || 'movie';
      
      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'ID não fornecido' })
        };
      }
      
      const playerUrl = type === 'movie' 
        ? `${PLAYER_BASE_MOVIE}${id}`
        : `${PLAYER_BASE_TV}${id}`;
      
      try {
        // Testa se o player está disponível
        const testResponse = await fetch(playerUrl, { method: 'HEAD' });
        const isAvailable = testResponse.ok;
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            available: isAvailable,
            url: playerUrl,
            id: id,
            type: type
          })
        };
      } catch (error) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            available: false,
            url: playerUrl,
            error: error.message
          })
        };
      }
    }
    
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Rota não encontrada' })
    };
    
  } catch (error) {
    console.error('Erro na função:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro interno do servidor', details: error.message })
    };
  }
};