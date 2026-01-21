# Arquitetura do Sistema de Gestão de Segurança (jogo-da-sorte)

## Visão Geral

Este sistema é uma plataforma completa para gestão de operações de segurança, com múltiplos perfis de acesso (Vigilante, RH, ADM/Gestão, Cliente) e funcionalidades avançadas para controle de rondas, ocorrências, RH, gestão de frota, BI, notificações, chat, auditoria e inteligência artificial.

---

## Perfis de Usuário

- **Vigilante**: Realiza rondas, registra ocorrências, recebe advertências, acessa notificações, chat, escala e modo offline.
- **RH**: Gerencia Cadastro de Funcionários, funcionários, relatórios, advertências, escalas e controle de ponto.
- **ADM/Gestão**: Painel centralizado, gestão de frota, relatórios gerenciais, clientes, configurações, supervisores, checklists, notificações, chat, auditoria.
- **Cliente**: Visualiza ocorrências, recebe notificações, histórico, feedback e suporte.

---

## Principais Módulos

- **Autenticação & Perfis**: Splash, escolha de perfil, login, recuperação de senha.
- **Dashboard**: Específico para cada perfil.
- **Ronda Inteligente**: GPS, QR Code/NFC, checklists, mídia, sugestão de rota (IA).
- **Ocorrências**: Registro detalhado, anexos, notificações, integração com câmeras.
- **Advertências**: Visualização, registro, histórico, feedback.
- **Notificações & Alertas**: Push, alertas preditivos, integração com IA.
- **Escalas & Jornadas**: Criação, atribuição, controle de folgas, integração com ponto.
- **Gestão de Frota**: Abastecimento, manutenção, consumo, relatórios.
- **Relatórios & BI**: Dashboards, relatórios customizados, agendamento, envio.
- **Chat Interno**: Canais, histórico, notificações.
- **Auditoria & Segurança**: Logs, RBAC, alertas de segurança.
- **Inteligência Artificial**: Análise preditiva, detecção de anomalias, PNL.

---

## Tecnologias Sugeridas

- **Backend**: Node.js, NestJS, Prisma ORM, PostgreSQL
- **Frontend**: Angular/React (Web), Ionic/React Native (Mobile)
- **Notificações**: Firebase Cloud Messaging
- **IA/ML**: Python (serviços externos), integração via API
- **Infraestrutura**: Docker, CI/CD, Monitoramento

---

## Fluxos Principais

- **Login**: Splash → Escolha de perfil → Login → Dashboard específico
- **Ronda**: Dashboard Vigilante → Registro de Ronda → GPS/QR Code/Checklist/Mídia
- **Ocorrência**: Dashboard Vigilante → Registro de Ocorrência → Anexos/Notificação
- **Advertência**: Supervisor/ADM → Registro → Notificação → Histórico RH
- **Relatórios**: Módulo BI → Geração → Envio/Agendamento

---

## Observações

- O sistema é modular e expansível, permitindo integração com sistemas de terceiros (CFTV, Ponto Eletrônico, etc).
- Suporte a modo offline para operações críticas.
- Segurança baseada em RBAC e auditoria detalhada.
