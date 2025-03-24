import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <h1 className="text-9xl font-bold text-primary-500">404</h1>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Page not found</h2>
        <p className="mt-2 text-base text-gray-500">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Go back home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage