// Credenciais do projeto Firebase (Etapa 3 do checklist de implementação).
// Enquanto os campos abaixo estiverem vazios, o sistema funciona normalmente
// salvando os dados no navegador (localStorage) — igual ao protótipo.
// Depois de criar o projeto no Firebase (console.firebase.google.com), copie
// os valores da tela "Configuração do SDK" e cole aqui, substituindo as
// strings vazias.

export const firebaseConfig = {
  apiKey: "AIzaSyCTjBbb5qvV32Uin1u0-fLe6-222vXYMF4",
  authDomain: "plataforma-raac-cedup.firebaseapp.com",
  projectId: "plataforma-raac-cedup",
  storageBucket: "plataforma-raac-cedup.firebasestorage.app",
  messagingSenderId: "638161148802",
  appId: "1:638161148802:web:d2e8274bc435db5a00cd9b",
}

// true assim que os campos acima estiverem preenchidos — o restante do
// sistema usa este sinalizador para decidir entre Firestore e localStorage.
export const firebaseAtivo = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
