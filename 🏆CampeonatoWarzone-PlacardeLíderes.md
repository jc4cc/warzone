# 🏆 Campeonato Warzone - Placar de Líderes

Sistema completo de placar de líderes para o Campeonato Warzone com interface moderna e backend Node.js.

## 📋 O que foi implementado

✅ **Reorganização das equipes**: Eliminadas posições 10-18, mantidas 1-9 e 19 (renumerada para 10)  
✅ **Letras maiores**: Fontes aumentadas significativamente para melhor visibilidade  
✅ **Título alterado**: "CAMP WARZONE" para "CAMPEONATO WARZONE"  
✅ **Subtítulo removido**: "RANKING DE KILLS" da parte superior foi removido  
✅ **Autenticação com senha**: Sistema protegido com senha **929424**  
✅ **Autosave automático**: Dados salvos automaticamente a cada 10 segundos  
✅ **Controles redesenhados**: Ícone de seta para baixo no canto inferior direito  
✅ **Nova seção de Ranking de Kills**: Adicionada na parte inferior conforme solicitado  
✅ **Ordenação automática**: Jogadores ordenados automaticamente por pontuação  
✅ **Backend Node.js**: API completa para persistência de dados  
✅ **Fallback local**: Sistema funciona mesmo sem o backend (dados salvos no navegador)

## 🚀 Como usar

### Opção 1: Apenas Frontend (Mais Simples)
1. Abra o arquivo `index.html` no seu navegador
2. Pressione **E** para ativar modo de edição
3. Digite a senha: **929424**
4. Use as teclas de atalho para editar pontuações
5. Os dados serão salvos automaticamente no navegador

### Opção 2: Frontend + Backend (Completo)
1. **Primeiro, inicie o backend:**
   - Abra um terminal na pasta `backend`
   - Execute: `npm install`
   - Execute: `npm start`
   - Mantenha o terminal aberto

2. **Depois, abra o frontend:**
   - Abra o arquivo `index.html` no navegador
   - O sistema conectará automaticamente com a API

## 🎮 Controles

### Autenticação
- **Senha:** 929424
- **Ativar edição:** Pressione `E` ou clique duas vezes em qualquer elemento

### Navegação
- **↑/↓:** Navegar entre jogadores
- **A/D:** Adicionar/remover 1 ponto
- **Q/W:** Adicionar/remover 5 pontos

### Sistema
- **R:** Resetar todas as pontuações
- **S:** Salvar manualmente
- **L:** Alternar modo live
- **F:** Tela cheia
- **T:** Animação de troféu
- **ESC:** Cancelar seleção

## 📁 Estrutura dos Arquivos

```
campeonato_warzone/
├── index.html          # Interface principal
├── styles.css          # Estilos visuais
├── script.js           # Lógica do frontend
├── backend/            # Servidor Node.js
│   ├── server.js       # Código do servidor
│   ├── package.json    # Configurações
│   ├── README.md       # Instruções do backend
│   └── data/           # Dados salvos (criado automaticamente)
└── README.md           # Este arquivo
```

## 🔧 Funcionalidades Especiais

### Ordenação Automática
- Jogadores são automaticamente reordenados por pontuação
- Posição 1 = maior pontuação, posição 10 = menor pontuação
- Ranking de kills também é ordenado automaticamente

### Sistema de Backup
- Dados salvos automaticamente a cada 10 segundos
- Backup local no navegador (localStorage)
- Backup na nuvem (se backend estiver ativo)
- Possibilidade de exportar/importar dados

### Interface Responsiva
- Funciona em desktop, tablet e celular
- Otimizado para touch screens
- Suporte a orientação landscape/portrait

## 🛠️ Solução de Problemas

### "API indisponível" ou "usando dados locais"
- **Solução:** Inicie o backend seguindo as instruções na pasta `backend/README.md`
- **Alternativa:** Continue usando apenas o frontend (dados salvos no navegador)

### Senha não funciona
- **Verifique:** A senha correta é **929424**
- **Certifique-se:** De estar digitando apenas números

### Dados não salvam
- **Com backend:** Verifique se o servidor está rodando
- **Sem backend:** Os dados são salvos automaticamente no navegador

### Performance lenta
- **Feche:** Outras abas do navegador
- **Atualize:** A página (F5)
- **Limpe:** Cache do navegador

## 📱 Compatibilidade

- ✅ Chrome/Edge (recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers
- ✅ Tablets

## 🔒 Segurança

- Senha de acesso para edição
- Tokens JWT para autenticação da API
- Dados criptografados em trânsito
- Backup automático para prevenir perda de dados

## 🎨 Personalização

Para personalizar cores, fontes ou layout:
1. Edite o arquivo `styles.css`
2. Modifique as variáveis CSS no início do arquivo
3. Atualize a página para ver as mudanças

---

**Senha de acesso:** 929424  
**Suporte:** Consulte os arquivos README.md em cada pasta para instruções detalhadas

