import { Brand } from './Brand'

export function LoadingScreen() {
  return <main className="loading-screen"><Brand /><span className="loader" aria-label="Loading" /></main>
}
