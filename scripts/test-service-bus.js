/**
 * Script de Teste - Service Bus Endpoints
 * 
 * Este script testa os endpoints do Service Bus no backend NestJS
 */

const BASE_URL = 'http://localhost:3000'; // Ajuste conforme sua porta

/**
 * Testa a conectividade com o Service Bus
 */
async function testarConectividade() {
  console.log('🔍 Testando conectividade...');
  
  try {
    const response = await fetch(`${BASE_URL}/service-bus/test`);
    const data = await response.json();
    
    console.log('📋 Resposta:', data);
    
    if (data.success) {
      console.log('✅ Conectividade OK');
      return true;
    } else {
      console.log('❌ Conectividade falhou');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    return false;
  }
}

/**
 * Envia dados de teste
 */
async function enviarDadosTeste() {
  console.log('📤 Enviando dados de teste...');
  
  try {
    const response = await fetch(`${BASE_URL}/service-bus/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    console.log('📋 Resposta:', data);
    
    if (data.success) {
      console.log('✅ Dados de teste enviados com sucesso');
      return true;
    } else {
      console.log('❌ Falha ao enviar dados de teste');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    return false;
  }
}

/**
 * Envia dados de uma tag específica
 */
async function enviarTagEspecifica() {
  console.log('📤 Enviando tag específica...');
  
  const dadosTag = {
    tagId: 'TAG_ESPECIFICA_001',
    timestamp: new Date().toISOString(),
    location: {
      latitude: -23.5505,
      longitude: -46.6333,
    },
    sensorData: {
      temperature: 25.5,
      humidity: 60.2,
      batteryLevel: 85,
    },
    metadata: {
      origem: 'teste-script',
      prioridade: 'alta',
    },
  };
  
  try {
    const response = await fetch(`${BASE_URL}/service-bus/enviar-tag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dadosTag),
    });
    
    const data = await response.json();
    console.log('📋 Resposta:', data);
    
    if (data.success) {
      console.log('✅ Tag enviada com sucesso');
      return true;
    } else {
      console.log('❌ Falha ao enviar tag');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    return false;
  }
}

/**
 * Envia múltiplas tags
 */
async function enviarMultiplasTags() {
  console.log('📤 Enviando múltiplas tags...');
  
  const dadosTags = {
    tags: [
      {
        tagId: 'TAG_MULTI_001',
        location: { latitude: -23.5505, longitude: -46.6333 },
        sensorData: { temperature: 25.0, humidity: 60.0, batteryLevel: 90 },
      },
      {
        tagId: 'TAG_MULTI_002',
        location: { latitude: -23.5510, longitude: -46.6340 },
        sensorData: { temperature: 26.0, humidity: 58.0, batteryLevel: 75 },
      },
      {
        tagId: 'TAG_MULTI_003',
        location: { latitude: -23.5490, longitude: -46.6320 },
        sensorData: { temperature: 24.5, humidity: 62.0, batteryLevel: 95 },
      },
    ],
  };
  
  try {
    const response = await fetch(`${BASE_URL}/service-bus/enviar-multiplas-tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dadosTags),
    });
    
    const data = await response.json();
    console.log('📋 Resposta:', data);
    
    if (data.success) {
      console.log('✅ Todas as tags foram enviadas com sucesso');
      return true;
    } else {
      console.log(`⚠️ ${data.sucessos} sucessos, ${data.falhas} falhas`);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    return false;
  }
}

/**
 * Executa todos os testes
 */
async function executarTestes() {
  console.log('🚀 Iniciando testes do Service Bus');
  console.log('📍 URL Base:', BASE_URL);
  console.log('---');
  
  // Teste 1: Conectividade
  const conectividadeOk = await testarConectividade();
  
  if (!conectividadeOk) {
    console.log('❌ Teste de conectividade falhou. Verifique se o servidor está rodando.');
    return;
  }
  
  console.log('---');
  
  // Teste 2: Dados de teste
  await enviarDadosTeste();
  
  console.log('---');
  
  // Teste 3: Tag específica
  await enviarTagEspecifica();
  
  console.log('---');
  
  // Teste 4: Múltiplas tags
  await enviarMultiplasTags();
  
  console.log('---');
  console.log('🎉 Testes concluídos!');
}

// Executa se for o arquivo principal
if (require.main === module) {
  executarTestes().catch(console.error);
}

module.exports = {
  testarConectividade,
  enviarDadosTeste,
  enviarTagEspecifica,
  enviarMultiplasTags,
  executarTestes,
};
