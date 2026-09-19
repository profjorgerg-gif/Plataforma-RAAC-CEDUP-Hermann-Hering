// Credenciais do projeto Firebase (Etapa 3 do checklist de implementação).
// Enquanto os campos abaixo estiverem vazios, o sistema funciona normalmente
// salvando os dados no navegador (localStorage) — igual ao protótipo.
// Depois de criar o projeto no Firebase (console.firebase.google.com), copie
// os valores da tela "Configuração do SDK" e cole aqui, substituindo as
// strings vazias.

export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
}

// true assim que os campos acima estiverem preenchidos — o restante do
// sistema usa este sinalizador para decidir entre Firestore e localStorage.
export const firebaseAtivo = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
