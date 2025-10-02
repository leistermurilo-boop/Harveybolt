# Harvey - Sistema de Gestão Jurídica

Sistema web para gestão de processos jurídicos com geração automatizada de documentos.

## Funcionalidades

- Autenticação de usuários (email/senha)
- Gestão de empresas e seus dados
- Cadastro e gerenciamento de processos jurídicos
- Upload de documentos (editais, recursos, outros)
- Geração automatizada de peças jurídicas em DOCX
- Upload e gestão de logotipos empresariais
- Dashboard com visão geral dos processos

## Tecnologias

- **Frontend**: React + TypeScript + Vite
- **Estilização**: Tailwind CSS
- **Banco de Dados**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Autenticação**: Supabase Auth
- **Deploy**: GitHub Pages

## Deploy

O projeto está configurado para deploy automático no GitHub Pages através do GitHub Actions.

### Configuração necessária:

1. **Habilitar GitHub Pages** nas configurações do repositório
2. **Configurar Secrets** no repositório (Settings > Secrets and variables > Actions):
   - `VITE_SUPABASE_URL`: https://qiudpuuimchvryfsmcjm.supabase.co
   - `VITE_SUPABASE_ANON_KEY`: sua chave anon key

3. **Fazer push** para a branch `main` - o deploy é automático

## Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build de produção
npm run build
```

## Estrutura do Projeto

```
src/
├── components/      # Componentes reutilizáveis
├── contexts/        # Contextos React (Auth)
├── lib/            # Utilitários e configurações
├── pages/          # Páginas da aplicação
└── main.tsx        # Ponto de entrada
```

## Licença

Proprietário
