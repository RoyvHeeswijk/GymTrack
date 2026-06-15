import { useNavigate } from 'react-router-dom'

interface PageBackProps {
  /** Fallback wanneer er geen browserhistorie is (bijv. directe tab-open). */
  to?: string
}

export default function PageBack({ to = '/' }: PageBackProps) {
  const navigate = useNavigate()

  function handleBack() {
    if (typeof window.history.state?.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1)
    } else {
      navigate(to)
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Terug"
      className="app-icon-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-slate-400 transition hover:text-white active:scale-95"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
      </svg>
    </button>
  )
}
