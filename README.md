# OSMECH - Sistema de Gestão para Oficinas

## Visão Geral

O OSMECH é uma aplicação SaaS (Software as a Service) moderna, construída para otimizar a gestão de oficinas de reparação automotiva. O sistema é projetado para ser robusto, escalável e intuitivo, utilizando tecnologias de ponta para oferecer uma experiência de usuário fluida e funcionalidades inteligentes.

## Tecnologias Utilizadas

O projeto é construído sobre uma base de tecnologias modernas e eficientes:

*   **Frontend & Estrutura:**
    *   **Next.js (com App Router):** Um framework React para construir aplicações web rápidas e renderizadas no servidor.
    *   **React:** Biblioteca para construir interfaces de usuário interativas.
    *   **TypeScript:** Adiciona tipagem estática ao JavaScript para maior robustez e manutenibilidade do código.

*   **Estilização e UI:**
    *   **Tailwind CSS:** Um framework CSS "utility-first" para estilização rápida e customizável.
    *   **ShadCN/UI:** Uma coleção de componentes de UI reutilizáveis, construídos sobre Radix UI e Tailwind CSS, garantindo acessibilidade e design moderno.
    *   **Lucide React:** Biblioteca de ícones leve e consistente.

*   **Backend & Banco de Dados:**
    *   **Firebase:** Plataforma do Google utilizada para:
        *   **Firestore:** Banco de dados NoSQL, flexível e escalável, usado para armazenar todos os dados da aplicação (ordens de serviço, clientes, estoque, etc.).
        *   **Firebase Authentication:** Para gerenciamento seguro de autenticação de usuários (login com e-mail/senha e Google).
        *   **Firebase Hosting (implícito com App Hosting):** Para hospedar a aplicação de forma escalável.

*   **Inteligência Artificial:**
    *   **Genkit (do Google):** Um framework open-source para construir aplicações com IA generativa, utilizado para funcionalidades como:
        *   Assistência de diagnóstico.
        *   Geração de resumos de ordens de serviço.
        *   Análise de histórico de veículos.
    *   **Modelos Gemini (do Google):** Modelos de linguagem de última geração que potencializam as funcionalidades de IA do sistema.

*   **Outras Ferramentas:**
    *   **Zod:** Para validação de esquemas e dados, garantindo que as informações que entram no sistema estejam corretas.
    *   **React Hook Form:** Para gerenciamento de formulários complexos de forma eficiente.
    *   **Recharts:** Para a criação de gráficos e visualizações de dados no painel.

## Funcionalidades Principais

O sistema oferece um conjunto completo de ferramentas para a gestão de uma oficina:

### 1. **Painel (Dashboard)**
*   Visão geral e em tempo real da saúde da oficina.
*   **KPIs (Indicadores-Chave):** Receita do mês, número de clientes, serviços realizados e veículos atualmente na oficina.
*   **Gráfico de Serviços:** Visualização do volume de ordens de serviço ao longo dos últimos 6 meses.

### 2. **Ordens de Serviço (OS)**
*   Criação, edição e gerenciamento completo de Ordens de Serviço.
*   Cadastro detalhado de cliente e veículo.
*   Associação de mecânico responsável.
*   Inclusão de serviços realizados e peças utilizadas (com integração direta ao estoque).
*   Cálculo automático de custos.
*   **Filtros Avançados:** Busca por OS, cliente, veículo, placa, status, mecânico e período.
*   **Recurso de IA (PRO+):** Geração de resumos concisos da OS para comunicação com o cliente.

### 3. **Gestão de Estoque**
*   Cadastro e controle de peças e produtos.
*   Atualização automática de quantidade ao utilizar peças em uma OS.
*   Movimentação manual (entrada/saída) com registro de motivo.
*   **Integração Financeira:** Movimentações de estoque geram lançamentos automáticos no financeiro (custo de aquisição ou perda).
*   **Alertas de Estoque Baixo:** Notificações automáticas quando um item atinge o nível mínimo.
*   **KPIs de Estoque:** Visão clara do valor de custo e do valor de venda potencial do inventário.

### 4. **Módulo Financeiro**
*   Livro-razão completo para rastrear todas as transações financeiras.
*   Lançamentos automáticos a partir de Ordens de Serviço (receita) e movimentações de estoque (despesa).
*   Permite lançamentos manuais de entradas e saídas.
*   **Filtros Avançados:** Pesquisa por descrição, categoria, tipo (entrada/saída) e período.
*   **Gráfico de Fluxo de Caixa (PRO+):** Análise visual de entradas e saídas ao longo do tempo.

### 5. **Diagnóstico por IA (Premium)**
*   Uma ferramenta poderosa que auxilia os mecânicos a diagnosticar problemas.
*   O mecânico descreve os sintomas e o sistema, usando IA, fornece um possível diagnóstico, nível de confiança e ações recomendadas.

### 6. **Histórico de Veículos por IA (Premium)**
*   Busca todo o histórico de serviços de um veículo pela placa.
*   Utiliza IA para analisar o histórico e os sintomas atuais, prevendo possíveis problemas futuros e recomendando manutenções proativas.

### 7. **Gestão de Equipe e Oficina**
*   **Mecânicos:** Cadastro e gerenciamento da equipe de mecânicos.
*   **Dados da Oficina:** Tela centralizada para gerenciar as informações cadastrais da oficina (nome, CNPJ, endereço), que são usadas nos recibos e comunicações.

### 8. **Autenticação e Multi-Tenancy**
*   Sistema de login seguro com e-mail/senha e Google.
*   **Arquitetura Multi-Tenant:** Cada oficina opera de forma completamente isolada, com seus próprios dados e usuários, garantindo segurança e privacidade.

### 9. **Planos e Assinaturas**
*   Estrutura de planos (PRO, PRO+, PREMIUM) que libera funcionalidades de forma progressiva.
*   Simulação de período de avaliação de 30 dias para novos usuários.

Este conjunto de tecnologias e funcionalidades torna o OSMECH uma solução completa e moderna para a gestão de oficinas, pronta para ser levada ao mercado.
