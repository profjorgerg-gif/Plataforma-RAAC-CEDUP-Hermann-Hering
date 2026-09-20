import { useState } from 'react'
import { entrar } from '../firebase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await entrar(email.trim(), senha)
    } catch (err) {
      setErro(mensagemErro(err.code))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <form className="card" style={{ maxWidth: 380, width: '100%' }} onSubmit={onSubmit}>
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>RAAC</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginBottom: 20 }}>
          Entre com o e-mail e a senha cadastrados pela coordenação.
        </p>
        <div className="field">
          <label>E-mail</label>
          <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
        </div>
        <div className="field">
          <label>Senha</label>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </div>
        {erro && (
          <p style={{ color: 'var(--insuficiente)', fontSize: 13, marginBottom: 12 }}>{erro}</p>
        )}
        <button className="btn btn-primary" type="submit" disabled={enviando} style={{ width: '100%', justifyContent: 'center' }}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

function mensagemErro(code) {
  if (code === 'auth/invalid-email') return 'E-mail inválido.'
  if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') return 'E-mail ou senha incorretos.'
  if (code === 'auth/wrong-password') return 'E-mail ou senha incorretos.'
  if (code === 'auth/too-many-requests') return 'Muitas tentativas — aguarde um pouco e tente de novo.'
  return 'Não foi possível entrar. Tente novamente.'
}
