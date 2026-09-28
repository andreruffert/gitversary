export function NotFoundPage() {
  return (
    <main class="error-page">
      <div class="error-page__content">
        <p class="error-page__code">404</p>

        <h1>Page not found</h1>

        <p>The page you’re looking for doesn’t exist or may have moved.</p>

        <a href="/" class="button">
          Back to Gitversary
        </a>
      </div>
    </main>
  );
}
