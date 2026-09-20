import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'
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

// Faz o login anônimo (necessário porque as regras do Firestore exigem
// request.auth != null) e só resolve quando o usuário já está autenticado.
// Quando o professor logar de verdade (Etapa 4), este login anônimo é
// substituído por um login real, sem precisar mudar o resto do sistema.
export function aguardarAutenticacao() {
  if (!firebaseAtivo) return Promise.resolve(null)
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          unsub()
          resolve(user)
        }
      },
      reject
    )
    signInAnonymously(auth).catch(reject)
  })
}
