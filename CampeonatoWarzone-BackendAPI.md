# Campeonato Warzone - Backend API

Este é o backend Node.js para o sistema de placar de líderes do Campeonato Warzone.

## 🚀 Como Iniciar o Servidor

### Pré-requisitos
- Node.js instalado (versão 14 ou superior)
- npm (geralmente vem com o Node.js)

### Passo a Passo

1. **Abra um terminal/prompt de comando**

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
   📁 Dados salvos em: [caminho do arquivo]
   🔑 Senha de acesso: 929424
   ⚡ Pronto para receber requisições!
   ```

6. **Mantenha o terminal aberto** - O servidor precisa continuar rodando para que o frontend funcione corretamente.

## 🔧 Configuração

- **Porta:** 3001 (padrão)
- **Senha de acesso:** 929424
- **Arquivo de dados:** `backend/data/leaderboard.json`

## 📡 Endpoints da API

### Públicos
- `GET /api/status` - Status da API
- `GET /api/leaderboard` - Obter dados do placar
- `POST /api/auth/login` - Autenticação

### Protegidos (requerem autenticação)
- `POST /api/leaderboard/save` - Salvar dados
- `POST /api/leaderboard/reset` - Resetar pontuações
- `GET /api/backup` - Fazer backup dos dados
- `POST /api/restore` - Restaurar backup

## 🛠️ Solução de Problemas

### Erro "npm não encontrado"
- Instale o Node.js em: https://nodejs.org/

### Erro "porta já em uso"
- Feche outros programas que possam estar usando a porta 3001
- Ou altere a porta no arquivo `server.js`

### Erro "EACCES" ou permissão negada
- No Linux/Mac, tente: `sudo npm install` ou `sudo npm start`

### Frontend não conecta com a API
- Verifique se o servidor está rodando
- Confirme que não há firewall bloqueando a porta 3001
- Teste acessando: http://localhost:3001/api/status

## 📁 Estrutura de Arquivos

```
backend/
├── server.js          # Servidor principal
├── package.json       # Configurações do projeto
├── data/              # Pasta de dados (criada automaticamente)
│   └── leaderboard.json # Arquivo de dados
└── README.md          # Este arquivo
```

## 🔄 Backup e Restauração

Os dados são automaticamente salvos em `data/leaderboard.json`. Para fazer backup manual:

1. Acesse: http://localhost:3001/api/backup (com autenticação)
2. Ou copie o arquivo `data/leaderboard.json`

## 🆘 Suporte

Se encontrar problemas:

1. Verifique se o Node.js está instalado: `node --version`
2. Verifique se o npm está instalado: `npm --version`
3. Certifique-se de estar na pasta `backend`
4. Tente reinstalar as dependências: `rm -rf node_modules && npm install`
5. Verifique se a porta 3001 está livre: `netstat -an | grep 3001`

