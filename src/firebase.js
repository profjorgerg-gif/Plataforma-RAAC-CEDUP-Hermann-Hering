import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { firebaseConfig, firebaseAtivo } from './firebaseConfig'

export { firebaseAtivo }

let app = null
let auth = null
let db = null

if (firebaseAtivo) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
}

export { auth, db }

// Chama o callback sempre que o estado de login mudar: com o usuário (logado)
// ou com null (deslogado). Usado pelo App para decidir entre mostrar a tela
// de login ou o sistema.
export function aoMudarAutenticacao(callback) {
  if (!firebaseAtivo) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}

export function entrar(email, senha) {
  return signInWithEmailAndPassword(auth, email, senha)
}

export function sair() {
  return signOut(auth)
}
