# Grupo Addvalora – Procedimentos por Seguradora

Sistema web de consulta de procedimentos operacionais por seguradora.

## Funcionalidades

- Consulta por seguradora em múltiplas categorias (PROPERTY, RCG, RCP, Garantia, etc.)
- Filtro por aba/categoria e busca textual
- Detalhe completo ao clicar em qualquer linha
- **Área administrativa** (botão 🔒 no header): importação de planilha Excel (.xlsx)
  - Acesso: usuário `admin`, senha `addvalora2025`
  - Visível **somente após login**

## Rodapé

Exibe a logo do **Grupo Addvalora** e copyright.

## Tecnologia

- HTML + TailwindCSS + JavaScript puro
- Deploy via **GitHub Pages** (pasta `/public`)

## Deploy GitHub Pages

1. Acesse as configurações do repositório → Pages
2. Source: **GitHub Actions**
3. Faça push para `main` — o workflow `.github/workflows/deploy.yml` publica automaticamente

## Credenciais Admin

| Campo | Valor |
|-------|-------|
| Usuário | `admin` |
| Senha | `addvalora2025` |
