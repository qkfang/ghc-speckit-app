import { useEffect, useState } from 'react'
import './App.css'

const API_BASE_URL = String(import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0
}

function displayValue(value) {
  return isNonEmptyString(value) ? value.trim() : 'Unavailable'
}

function validateStatus(status) {
  return isObject(status) && status.status === 'running'
}

function validateSeries(series) {
  return (
    isObject(series) &&
    isNonEmptyString(series.name) &&
    isPositiveInteger(series.season)
  )
}

function validateEpisodeCollection(collection, seriesSeason) {
  if (
    !isObject(collection) ||
    !isNonEmptyString(collection.name) ||
    !isPositiveInteger(collection.season) ||
    collection.season !== seriesSeason ||
    !Array.isArray(collection.episodes)
  ) {
    return false
  }

  const episodeIds = new Set()

  return collection.episodes.every((episode) => {
    if (
      !isObject(episode) ||
      !isPositiveInteger(episode.season) ||
      episode.season !== collection.season ||
      !isPositiveInteger(episode.episode)
    ) {
      return false
    }

    const episodeId = `${episode.season}:${episode.episode}`

    if (episodeIds.has(episodeId)) {
      return false
    }

    episodeIds.add(episodeId)
    return true
  })
}

async function fetchJson(path, signal) {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal })

  if (!response.ok) {
    throw new Error('Request failed')
  }

  return response.json()
}

function App() {
  const [remoteState, setRemoteState] = useState({ kind: 'loading' })
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [searchState, setSearchState] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadContent() {
      try {
        const [status, series, episodeCollection] = await Promise.all([
          fetchJson('/api/status', controller.signal),
          fetchJson('/api/series', controller.signal),
          fetchJson('/api/episodes', controller.signal),
        ])

        if (
          !validateStatus(status) ||
          !validateSeries(series) ||
          !validateEpisodeCollection(episodeCollection, series.season)
        ) {
          throw new Error('Invalid response')
        }

        setRemoteState({
          kind: 'ready',
          series,
          episodes: episodeCollection.episodes,
        })
      } catch (error) {
        if (error.name !== 'AbortError') {
          setRemoteState({ kind: 'error' })
        }
      }
    }

    loadContent()

    return () => controller.abort()
  }, [])

  // Debounce the raw search box value so continuous typing doesn't fire a request per keystroke.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  useEffect(() => {
    if (remoteState.kind !== 'ready') {
      return undefined
    }

    const controller = new AbortController()

    async function runSearch() {
      try {
        const query = encodeURIComponent(debouncedSearchTerm.trim())
        const result = await fetchJson(
          `/api/episodes/search?query=${query}`,
          controller.signal,
        )
        setSearchState({
          kind: 'ready',
          episodes: Array.isArray(result.episodes) ? result.episodes : [],
        })
      } catch (error) {
        if (error.name !== 'AbortError') {
          setSearchState({ kind: 'error' })
        }
      }
    }

    runSearch()

    // Abort this request if a newer search starts before it resolves.
    return () => controller.abort()
  }, [remoteState.kind, debouncedSearchTerm])

  const catalogIsEmpty = remoteState.kind === 'ready' && remoteState.episodes.length === 0
  const visibleEpisodes =
    searchState?.kind === 'ready'
      ? searchState.episodes
      : remoteState.kind === 'ready'
        ? remoteState.episodes
        : []

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <div className="brand-mark" aria-hidden="true">
            S4
          </div>
          <div>
            <p className="site-header__eyebrow">Developer sessions</p>
            <h1>Microsoft Sample App</h1>
          </div>
        </div>
      </header>

      <main
        className="content-region"
        aria-busy={remoteState.kind === 'loading'}
      >
        {remoteState.kind === 'loading' && (
          <section
            className="state-panel state-panel--loading"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <h2>Loading episodes</h2>
            <p>We are gathering the latest series details for you.</p>
            <div className="loading-track" aria-hidden="true">
              <span />
            </div>
          </section>
        )}

        {remoteState.kind === 'error' && (
          <section
            className="state-panel state-panel--error"
            role="alert"
          >
            <p className="state-panel__label">Content service</p>
            <h2>Episodes are unavailable</h2>
            <p>
              We could not load the series right now. Please try again later.
            </p>
          </section>
        )}

        {remoteState.kind === 'ready' && (
          <>
            <section className="series-panel" aria-labelledby="series-title">
              <div className="season-stamp">
                <span>Season</span>
                <strong>{remoteState.series.season}</strong>
              </div>
              <div className="series-panel__copy">
                <p className="section-kicker">Featured series</p>
                <h2 id="series-title">{remoteState.series.name}</h2>
                {isNonEmptyString(remoteState.series.description) && (
                  <p>{remoteState.series.description.trim()}</p>
                )}
              </div>
            </section>

            <section className="catalog" aria-labelledby="catalog-title">
              <div className="catalog__header">
                <div>
                  <p className="section-kicker">Episode catalog</p>
                  <h2 id="catalog-title">Find your next session</h2>
                </div>

                <div className="search-control">
                  <label htmlFor="episode-search">Search episodes</label>
                  <input
                    id="episode-search"
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Title or description (supports * wildcards)"
                    autoComplete="off"
                    aria-controls="episode-results"
                  />
                </div>
              </div>

              <div id="episode-results">
                {!catalogIsEmpty && searchState?.kind !== 'error' && (
                  <p
                    className="result-count"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {visibleEpisodes.length}{' '}
                    {visibleEpisodes.length === 1 ? 'episode' : 'episodes'}
                  </p>
                )}

                {catalogIsEmpty && (
                  <div
                    className="empty-state"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    <h3>No episodes are available yet</h3>
                    <p>New sessions will appear here when they are published.</p>
                  </div>
                )}

                {!catalogIsEmpty && searchState?.kind === 'error' && (
                  <div className="search-error-state" role="alert">
                    <h3>Search is unavailable</h3>
                    <p>We could not complete that search right now. Please try again.</p>
                  </div>
                )}

                {!catalogIsEmpty &&
                  searchState?.kind !== 'error' &&
                  visibleEpisodes.length === 0 && (
                    <div
                      className="no-match-state"
                      role="status"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      <h3>No episodes match your search</h3>
                      <p>Try another title or description, or clear the search.</p>
                    </div>
                  )}

                {!catalogIsEmpty &&
                  searchState?.kind !== 'error' &&
                  visibleEpisodes.length > 0 && (
                  <ul className="episode-grid">
                    {visibleEpisodes.map((episode) => (
                      <li key={`${episode.season}:${episode.episode}`}>
                        <article className="episode-card">
                          <p className="episode-card__number">
                            Episode {episode.episode}
                          </p>
                          <h3>{displayValue(episode.title)}</h3>
                          <dl>
                            <div>
                              <dt>Presenter</dt>
                              <dd>{displayValue(episode.presenter)}</dd>
                            </div>
                            <div>
                              <dt>Status</dt>
                              <dd>
                                <span className="episode-card__status">
                                  {displayValue(episode.status)}
                                </span>
                              </dd>
                            </div>
                          </dl>
                        </article>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default App