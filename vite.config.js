import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' usa caminhos relativos, então funciona tanto em
// https://<usuario>.github.io/<repositorio>/ quanto em outros hosts,
// sem precisar editar este arquivo com o nome exato do repositório.
export default defineConfig({
  plugins: [react()],
  base: './',
})
