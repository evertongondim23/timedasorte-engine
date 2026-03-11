## Convenção de portas – Jogo da Sorte

Para facilitar deploy em VPS (Hostinger, Docker Manager) e separar vários projetos no mesmo servidor, este backend segue a convenção abaixo.

- **Backend/API (NestJS)**  
  - Faixa reservada: **3000–3010**  
  - Este projeto: **3000**  
  - Endpoints locais: `http://localhost:3000/health`, `http://localhost:3000/api/...`

- **Frontend (Timedasorteapp – Vite dev)**  
  - Faixa reservada: **3100–3110**  
  - Este projeto (dev): **3100**  
  - Configurado em `Timedasorteapp/vite.config.ts`.

- **Banco de dados (PostgreSQL)**  
  - Faixa reservada: **3200–3210**  
  - Este projeto: **3200 → 5432**  
  - Conexão externa (pgAdmin4):  
    - Host: `localhost`  
    - Porta: `3200`  
    - Database: `jogo_da_sorte_db`

- **Storage de arquivos (MinIO)**  
  - Faixa reservada: **3300–3310**  
  - Este projeto:  
    - API MinIO: **3300 → 9000**  
    - Console MinIO: **3301 → 9001**  
  - Endpoint usado pelo backend: `MINIO_ENDPOINT=http://localhost:3300`

- **Redis (cache/filas)**  
  - Faixa reservada: **3900–3910**  
  - Este projeto: **3900 → 6379**

### Resumo rápido (Jogo da Sorte)

- API: `http://localhost:3000`  
- Postgres: `localhost:3200`  
- MinIO API: `http://localhost:3300`  
- MinIO Console: `http://localhost:3301`
- Redis: `localhost:3900`  

Outros projetos devem reutilizar **as mesmas faixas por tipo** (3000 backends, 3100 fronts, 3200 bancos, 3300 storage, 3900 Redis), escolhendo portas livres dentro de cada faixa para não colidir entre si.

