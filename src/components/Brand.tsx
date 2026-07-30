import { Link } from 'react-router-dom'

export function Brand() {
  return <Link to="/" className="brand" aria-label="BiasSense AI home">
    <span className="brand-mark"><img src="/app-logo.png" alt="" /></span>
    <span>BiasSense <span>AI</span></span>
  </Link>
}
