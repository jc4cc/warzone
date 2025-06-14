# Campeonato Warzone - Backend API com MongoDB

Este é o backend Node.js para o sistema de placar de líderes do Campeonato Warzone, agora integrado com MongoDB.

## 🚀 Como Iniciar o Servidor

### Pré-requisitos
- Node.js instalado (versão 14 ou superior)
- npm (geralmente vem com o Node.js)
- MongoDB instalado e em execução

### Instalação do MongoDB

#### Ubuntu/Debian:
```bash
# Adicionar a chave GPG do MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Adicionar o repositório do MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Atualizar e instalar
sudo apt update
sudo apt install -y mongodb-org

# Iniciar o serviço
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Windows:
1. Baixe o MongoDB Community Server em: https://www.mongodb.com/try/download/community
2. Execute o instalador e siga as instruções
3. O MongoDB será iniciado automaticamente como serviço

#### macOS:
```bash
# Usando Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

### Passo a Passo

1. **Certifique-se de que o MongoDB está em execução:**
   ```bash
   # Ubuntu/Linux
   sudo systemctl status mongod
   
   # Ou teste a conexão
   mongosh --eval "db.adminCommand('ismaster')"
   ```

2. **Navegue até a pasta do backend:**
   ```bash
   cd backend
   ```

3. **Instale as dependências:**
   ```bash
   npm install
   ```

4. **Inicie o servidor:**
   ```bash
   npm start
   ```

5. **Verifique se está funcionando:**
   - Você deve ver mensagens como:
   ```
   🚀 Servidor rodando na porta 3001
   📊 API do Campeonato Warzone iniciada
   🔗 Acesse: http://localhost:3001/api/status
   🗄️ Base de dados: MongoDB
   🔑 Senha de acesso: 929424
   📦 Conectado ao MongoDB
   🔄 Inicializando jogadores padrão...
   🔄 Inicializando dados de kills padrão...
   🔄 Inicializando configuração padrão...
   ✅ Dados padrão inicializados com sucesso
   ⚡ Pronto para receber requisições!
   ```

6. **Mantenha o terminal aberto** - O servidor precisa continuar rodando para que o frontend funcione corretamente.

## 🔧 Configuração

- **Porta:** 3001 (padrão)
- **Senha de acesso:** 929424
- **Base de dados:** MongoDB (localhost:27017)
- **Nome da base de dados:** warzone_leaderboard

### Variáveis de Ambiente

Você pode configurar a conexão do MongoDB usando a variável de ambiente:

```bash
# Para uma base de dados local (padrão)
MONGODB_URI=mongodb://localhost:27017/warzone_leaderboard

# Para MongoDB Atlas (nuvem)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/warzone_leaderboard

# Para executar com variável personalizada
MONGODB_URI=mongodb://localhost:27017/minha_base npm start
```

## 📡 Endpoints da API

### Públicos
- `GET /api/status` - Status da API e informações da base de dados
- `GET /api/leaderboard` - Obter dados do placar
- `POST /api/auth/login` - Autenticação

### Protegidos (requerem autenticação)
- `POST /api/leaderboard/save` - Salvar dados
- `POST /api/leaderboard/reset` - Resetar pontuações
- `GET /api/backup` - Fazer backup dos dados
- `POST /api/restore` - Restaurar backup

## 🗄️ Estrutura da Base de Dados

### Coleções MongoDB

#### Players
```javascript
{
  position: Number,
  name: String,
  team: String,
  score: Number,
  logo: String,
  teamId: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### KillsData
```javascript
{
  position: Number,
  name: String,
  kills: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### GameConfig
```javascript
{
  currentGame: Number,
  totalGames: Number,
  gameStatus: String,
  isLive: Boolean,
  editMode: Boolean,
  victoryPointThreshold: Number,
  isAuthenticated: Boolean,
  autoSaveEnabled: Boolean,
  autoSaveInterval: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## 🛠️ Solução de Problemas

### Erro "npm não encontrado"
- Instale o Node.js em: https://nodejs.org/

### Erro "porta já em uso"
- Feche outros programas que possam estar usando a porta 3001
- Ou altere a porta no arquivo `server.js`

### Erro "EACCES" ou permissão negada
- No Linux/Mac, tente: `sudo npm install` ou `sudo npm start`

### Erro de conexão com MongoDB
- Verifique se o MongoDB está em execução: `sudo systemctl status mongod`
- Teste a conexão: `mongosh --eval "db.adminCommand('ismaster')"`
- Verifique se a porta 27017 está livre: `netstat -an | grep 27017`

### Frontend não conecta com a API
- Verifique se o servidor está rodando
- Confirme que não há firewall bloqueando a porta 3001
- Teste acessando: http://localhost:3001/api/status

## 📁 Estrutura de Arquivos

```
backend/
├── server.js          # Servidor principal com integração MongoDB
├── package.json       # Configurações do projeto (inclui mongoose)
└── README.md          # Este arquivo
```

## 🔄 Backup e Restauração

### Backup Automático via API
Os dados podem ser exportados via API:
1. Acesse: http://localhost:3001/api/backup (com autenticação)

### Backup Manual do MongoDB
```bash
# Exportar toda a base de dados
mongodump --db warzone_leaderboard --out backup/

# Restaurar base de dados
mongorestore --db warzone_leaderboard backup/warzone_leaderboard/
```

### Backup de Coleções Específicas
```bash
# Exportar apenas jogadores
mongoexport --db warzone_leaderboard --collection players --out players_backup.json

# Importar jogadores
mongoimport --db warzone_leaderboard --collection players --file players_backup.json
```

## 🔧 Comandos Úteis do MongoDB

```bash
# Conectar ao MongoDB
mongosh

# Usar a base de dados do projeto
use warzone_leaderboard

# Ver todas as coleções
show collections

# Ver todos os jogadores
db.players.find().pretty()

# Ver configuração do jogo
db.gameconfigs.find().pretty()

# Limpar todas as pontuações
db.players.updateMany({}, {$set: {score: 0}})

# Contar documentos
db.players.countDocuments()
```

## 🆘 Suporte

Se encontrar problemas:

1. **Verifique as dependências:**
   ```bash
   node --version
   npm --version
   mongosh --version
   ```

2. **Verifique o MongoDB:**
   ```bash
   sudo systemctl status mongod
   mongosh --eval "db.adminCommand('ismaster')"
   ```

3. **Reinstale as dependências:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Verifique as portas:**
   ```bash
   netstat -an | grep 3001  # API
   netstat -an | grep 27017 # MongoDB
   ```

5. **Logs do MongoDB:**
   ```bash
   sudo tail -f /var/log/mongodb/mongod.log
   ```

## 🚀 Melhorias Implementadas

- ✅ Integração completa com MongoDB
- ✅ Schemas e validação de dados com Mongoose
- ✅ Inicialização automática de dados padrão
- ✅ Timestamps automáticos (createdAt, updatedAt)
- ✅ Operações otimizadas de base de dados
- ✅ Status da API com informações da base de dados
- ✅ Suporte para variáveis de ambiente
- ✅ Compatibilidade com MongoDB Atlas (nuvem)

## 📈 Próximos Passos Sugeridos

1. **Implementar índices para melhor performance:**
   ```javascript
   db.players.createIndex({ position: 1 })
   db.players.createIndex({ teamId: 1 })
   ```

2. **Adicionar validação de dados mais robusta**
3. **Implementar paginação para grandes volumes de dados**
4. **Adicionar logs estruturados**
5. **Configurar MongoDB Atlas para produção**

