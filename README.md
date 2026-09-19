# Plataforma RAAC

Sistema de registro de avaliações RAAC (Responsabilidade, Assiduidade, Atitude
e Comprometimento) do CEDUP Hermann Hering — React + Firebase.

## O que o sistema faz

- Cadastro de turmas, com importação de lista de alunos em PDF (nome + matrícula)
- Inclusão, exclusão e troca de aluno de turma, mantendo o histórico
- Lançamento de registros de ocorrência (a nota parte de 10 e cada registro
  desconta pontos, conforme a tabela de critérios)
- Lançamento em lote para vários alunos de uma vez
- Alerta automático de alunos com nota abaixo de 6,0
- Sugestão automática de reincidência
- Relatórios por turma e individual por aluno, com exportação em CSV e impressão/PDF
- Tabela de critérios e descontos editável, com log de quem lançou cada registro
- Backup manual (exportar/restaurar) e backup automático ao sair do sistema

## Estado atual

Por enquanto os dados ficam salvos no navegador (localStorage) — funciona
normalmente, mas cada professor/dispositivo tem seus próprios dados. A ligação
com o Firebase (Firestore) para sincronizar entre dispositivos e permitir login
de mais de um professor é a próxima etapa (ver `src/firebaseConfig.js`).

## Como rodar localmente (opcional)

Não é obrigatório — o GitHub Actions publica o site sozinho a cada envio de
arquivos. Mas se quiser ver no próprio computador antes de subir:

```
npm install
npm run dev
```

## Como publicar

1. Fazer upload de todos os arquivos deste projeto para o repositório no GitHub
   (mantendo a estrutura de pastas, especialmente a pasta `src/`).
2. Em **Settings → Pages**, em "Build and deployment", escolher **Source: GitHub
   Actions**.
3. O arquivo `.github/workflows/deploy.yml` já está pronto: a cada novo envio
   de arquivos para a branch `main`, o site é gerado e publicado automaticamente.

## Estrutura

```
src/
  App.jsx              tela principal e estado geral do sistema
  components/          uma view por arquivo (Turmas, Avaliação, Relatórios…)
  situacoesPadrao.js   tabela oficial de critérios/descontos (valor de fábrica)
  dataStore.js         onde os dados são salvos (localStorage por enquanto)
  firebaseConfig.js    credenciais do Firebase (preencher na Etapa 3)
  rosterPdf.js         leitura da lista de alunos a partir do PDF
  utils.js             cálculo de nota e funções auxiliares
  styles.css           aparência do sistema
```
