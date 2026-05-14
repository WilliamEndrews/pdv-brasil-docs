# PDV Brasil TOP #1 - Sistema de Ponto de Venda Inteligente

**Versão:** 3.1 (Estável com Persistência de Dados)
**Última Atualização:** 04 de Dezembro de 2025
**Autor Principal:** [Seu Nome]
**Arquiteto de IA e Co-desenvolvedor:** Manus

## 1. Visão Geral do Projeto

O PDV Brasil TOP #1 é um sistema de Ponto de Venda (PDV) de última geração, construído com as tecnologias mais modernas de frontend. Ele vai além de um simples caixa, incorporando um ecossistema completo de gestão de inventário, auditoria, inteligência de negócios e conformidade fiscal.

O projeto foi arquitetado para ser robusto, escalável e, acima de tudo, para fornecer uma experiência de usuário fluida e inteligente, resolvendo dores reais dos varejistas, como controle de validade, gestão multi-estoque e análise de lucratividade de produtos.

## 2. Arquitetura e Stack Tecnológica

O sistema utiliza uma arquitetura de **SPA (Single-Page Application)** com um servidor de desenvolvimento Vite que também serve uma API backend customizada para tarefas específicas.

- **Frontend:**
  - **Framework:** React 18
  - **Linguagem:** TypeScript
  - **Build Tool:** Vite
  - **Gerenciamento de Estado:** Zustand (com middlewares `immer` e `persist`)
  - **Componentes de UI:** ShadCN/UI (Radix UI + Tailwind CSS)
  - **Roteamento:** React Router
  - **Formulários:** React Hook Form com Zod para validação
  - **Tabelas de Dados:** TanStack Table (React Table)
  - **Gráficos e Relatórios:** Recharts

- **Backend (API para Conformidade Fiscal):**
  - **Ambiente:** Node.js
  - **Framework:** API minimalista servida pelo servidor de desenvolvimento do Vite.
  - **Linguagem:** TypeScript (executado com `ts-node`)
  - **Funcionalidades:** Geração de XML para NFC-e, assinatura digital e comunicação com web services SOAP da SEFAZ.

- **Persistência de Dados (Desenvolvimento):**
  - **Mecanismo:** `localStorage` do navegador, gerenciado pelo middleware `persist` do Zustand. Isso simula um banco de dados real para o fluxo de trabalho do usuário, garantindo que os dados não se percam ao atualizar a página.

## 3. Estrutura de Diretórios (Simplificada)

```
/src
├── /components
│   ├── /estoque      # Componentes específicos do módulo de estoque (forms, modais, tabelas)
│   ├── /ui           # Componentes reutilizáveis do ShadCN (Button, Card, etc.)
│   └── TopBar.tsx    # Barra de navegação principal
├── /lib
│   ├── /api          # Lógica da API backend (nfce.ts, soapService.ts)
│   └── utils.ts      # Funções utilitárias
├── /pages
│   ├── Caixa.tsx     # A interface do Ponto de Venda
│   ├── Estoque.tsx   # A interface principal de Gestão de Estoque
│   ├── Index.tsx     # O dashboard principal
│   └── Login.tsx     # A tela de login
├── /store
│   ├── authStore.ts
│   ├── caixaStore.ts
│   └── estoqueStore.ts # O coração do nosso sistema, com toda a lógica de negócio
└── App.tsx           # Onde as rotas da aplicação são definidas
```

## 4. Análise de Erros e Soluções (A Jornada Técnica)

O desenvolvimento foi marcado por desafios técnicos significativos, cuja superação fortaleceu a arquitetura do projeto.

- **Erro Principal (Recorrente):** Inconsistência de Tipos em Formulários (`Property 'X' is optional... but required`).
  - **Ocorrências:** ~5-6 vezes.
  - **Causa Raiz:** Uma desconexão fundamental entre como o `react-hook-form` infere os tipos de seus campos (como `string | undefined`) e como o `store` do Zustand esperava receber os dados (como `string` obrigatório).
  - **Solução Definitiva:** Adoção do **Zod** como fonte única da verdade. Criamos schemas de validação com Zod (`productFormSchema`, `loteFormSchema`) e usamos `z.infer<...>` para gerar os tipos TypeScript (`NovoProdutoData`, etc.). O `react-hook-form` foi configurado com o `zodResolver`, garantindo que a função `onSubmit` só seja chamada com dados já validados e com os tipos corretos, eliminando a ambiguidade.

- **Erro de Arquitetura:** Tentativa de uso de Módulos Node.js no Frontend.
  - **Ocorrências:** 1 (no início do projeto).
  - **Causa Raiz:** Importação de bibliotecas como `node-forge` e `axios` com `httpsAgent` em um componente React (`Caixa.tsx` ).
  - **Solução Definitiva:** Separação de responsabilidades. Criamos uma API backend (`/api/nfce`) servida pelo Vite para encapsular toda a lógica fiscal. O frontend agora apenas faz uma chamada `fetch` para essa API, enviando os dados da venda e recebendo o resultado.

- **Erro de Configuração de Ambiente:** Falha ao executar o servidor TypeScript com Módulos ES (`ERR_UNKNOWN_FILE_EXTENSION`).
  - **Ocorrências:** 1 (durante a configuração do backend).
  - **Causa Raiz:** O Node.js, por padrão, não sabe como executar arquivos `.ts` em um projeto configurado com `"type": "module"` no `package.json`.
  - **Solução Definitiva:** Atualização do script `dev` no `package.json` para usar o loader correto: `"dev": "node --loader ts-node/esm src/lib/api/server.ts"`. Isso instrui o Node.js a usar o `ts-node` para compilar o TypeScript em tempo de execução, respeitando a sintaxe de módulos ES.

- **Erro de UX:** Máscara de Moeda "Agressiva".
  - **Ocorrências:** 1.
  - **Causa Raiz:** A implementação inicial da máscara de moeda formatava o valor enquanto o usuário digitava, causando uma experiência confusa.
  - **Solução Definitiva (Inovadora):** A "Lógica da Calculadora". Criamos um componente (`CalculatorInput`) que armazena os dígitos digitados como um `string` de inteiros (`"1650"`) e apenas exibe uma versão formatada para o usuário (`"R$ 16,50"`). Ao submeter o formulário, o valor numérico correto (`16.50`) é extraído e enviado, garantindo integridade dos dados e uma UX fluida.

## 5. Status Atual e Funcionalidades Contempladas

Até o momento, os **Pilares 1, 1.5, 2 e parte do 3** do nosso plano foram concluídos.

- ✅ **Estrutura Fundamental do Estoque:**
  - Cadastro de Produtos e Lotes.
  - Lógica de abate de estoque por PVPS (Primeiro que Vence, Primeiro que Sai).
- ✅ **Gestão Multi-Estoque:**
  - Separação de inventário entre "Depósito" e "Loja".
  - Interface funcional para transferência de produtos entre os locais.
- ✅ **Auditoria e Controle:**
  - Histórico completo de todas as movimentações (Vendas, Entradas, Transferências, Ajustes).
  - Formulário para registro de movimentações manuais (perdas, quebras).
- ✅ **Inteligência de Negócio (Inicial):**
  - Filtros avançados na tabela de produtos (Estoque Baixo/Crítico).
  - Relatório de Curva ABC com gráfico e tabela de classificação.
- ✅ **Persistência de Dados:**
  - Todo o estado do estoque é salvo no `localStorage`, garantindo uma experiência de uso contínua e realista.
- ✅ **UX Premium (Inicial):**
  - Implementação da "Lógica da Calculadora" para uma digitação de valores monetários fluida e precisa.

## 6. Planos Futuros e Próximos Passos

A base está incrivelmente sólida. Agora, podemos avançar para as funcionalidades que transformarão o PDV Brasil TOP #1 em um produto de elite.

- **Nossa Última Atualização:** Nós finalizamos a implementação da persistência de dados com `localStorage` e corrigimos a UI da página de Estoque, garantindo a integração total entre todos os módulos.

- **Próximo Passo Imediato (Retomada do Pilar 1):** Concluir a **Rastreabilidade**. Nossa estrutura de dados já suporta `Fornecedor` e `Unidades de Medida`, mas as interfaces (formulários) ainda não permitem cadastrar ou selecionar esses dados. Precisamos:
  1.  Criar uma interface para gerenciar Fornecedores.
  2.  Atualizar o `ProductForm` para permitir a seleção de um Fornecedor.
  3.  Atualizar o `ProductForm` para permitir o cadastro de múltiplas Unidades de Medida (ex: "Unidade", "Caixa com 6").

- **Próximo Passo (Pilar 2 - O Diferencial):** Implementar a **Importação Inteligente**. Construir a interface que permite ao usuário colar dados de uma planilha (CSV/Excel) e mapear as colunas para importar seu estoque de outros sistemas.

- **Próximo Passo (Pilar 3 - Extras Premium):**
  - **Responsividade:** Adaptar as tabelas e modais para uma experiência perfeita em tablets e celulares.
  - **Alertas Proativos:** Criar a "TAB ALERTAS" para notificar o usuário sobre produtos parados ou com margem negativa.
  - **Sugestão de Compra:** Usar o histórico de vendas para sugerir quantidades de compra, evitando rupturas e excesso de estoque.

---
