import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 px-4">
      <h1 className="text-display-lg font-bold text-neutral-900">404</h1>
      <p className="text-body-lg text-neutral-500 mt-2 mb-6">Page not found</p>
      <Link
        href="/"
        className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 rounded-md bg-primary-500 text-white text-body-md font-semibold hover:bg-primary-700 transition-colors"
      >
        Back to home
      </Link>
    </div>
  )
}
