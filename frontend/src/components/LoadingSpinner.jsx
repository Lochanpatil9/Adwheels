import RickshawLoader from './RickshawLoader'

export default function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div className="loading-screen">
      <RickshawLoader size="md" label={label} />
    </div>
  )
}