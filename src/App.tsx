import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiHeart, FiMessageSquare } from 'react-icons/fi'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import bgVectorTop from './assets/images/bg_vector_top.svg'
import logo from './assets/images/logo.svg'
import './App.css'

type ViewMode = 'rows' | 'tiles'

type ApiPost = {
  id: string
  image: string
  likes: number
  publishDate: string
  tags: string[]
  text: string
  owner: {
    firstName: string
    lastName: string
    picture: string
  }
}

type ApiResponse = {
  data: ApiPost[]
  limit: number
  page: number
  total: number
}

const API_URL = 'https://dummyapi.io/data/v1/post'
const POSTS_PER_PAGE = 10
const DEFAULT_DUMMY_API_APP_ID = '624c9429450430b574dcf17c'

function CalendarPickerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M7 11H9V13H7V11ZM7 15H9V17H7V15ZM11 11H13V13H11V11ZM11 15H13V17H11V15ZM15 11H17V13H15V11ZM15 15H17V17H15V15Z" fill="#5F5F5F" />
      <path d="M5 22H19C20.103 22 21 21.103 21 20V6C21 4.897 20.103 4 19 4H17V2H15V4H9V2H7V4H5C3.897 4 3 4.897 3 6V20C3 21.103 3.897 22 5 22ZM19 8L19.001 20H5V8H19Z" fill="#5F5F5F" />
    </svg>
  )
}

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('tiles')
  const [posts, setPosts] = useState<ApiPost[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [loadMoreError, setLoadMoreError] = useState('')
  const [dateFrom, setDateFrom] = useState<Date | null>(null)
  const [dateTo, setDateTo] = useState<Date | null>(null)

  const loadPosts = useCallback(async (pageToLoad: number) => {
    const appId = DEFAULT_DUMMY_API_APP_ID
    const response = await fetch(`${API_URL}?limit=${POSTS_PER_PAGE}&page=${pageToLoad}`, {
      headers: { 'app-id': appId },
    })

    if (!response.ok) {
      throw new Error(
        response.status === 403
          ? 'DummyAPI rejected the app-id. Add your VITE_DUMMY_API_APP_ID to .env.'
          : `Could not load posts (${response.status}).`,
      )
    }

    return (await response.json()) as ApiResponse
  }, [])

  useEffect(() => {

    async function loadInitialPosts() {
      try {
        setIsLoading(true)
        setError('')
        setLoadMoreError('')

        const result = await loadPosts(0)
        setPosts(result.data)
        setPage(result.page)
        setHasMore(result.page * result.limit + result.data.length < result.total)
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Could not load posts.')
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialPosts()

  }, [loadPosts])

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) {
      return
    }

    try {
      setIsLoadingMore(true)
      setLoadMoreError('')

      const nextPage = page + 1
      const result = await loadPosts(nextPage)

      setPosts((currentPosts) => [...currentPosts, ...result.data])
      setPage(result.page)
      setHasMore(result.page * result.limit + result.data.length < result.total)
    } catch (requestError) {
      setLoadMoreError(requestError instanceof Error ? requestError.message : 'Could not load more posts.')
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMore, isLoadingMore, loadPosts, page])

  const content = useMemo(() => {
    if (isLoading) {
      return (
        <div className="feed-state">
          <span className="loader" />
          <p>Loading posts...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="feed-state">
          <p>{error}</p>
        </div>
      )
    }

    return (
      <>
        <section className={`feed feed--${viewMode}`}>
          {posts.map((post) => {

            const date = new Intl.DateTimeFormat('en-GB', {
              day: 'numeric',
              month: '2-digit',
              year: 'numeric'
            }).format(new Date(post.publishDate)).replaceAll('/', '-');

            return (
              <article className="post" key={post.id}>
                <img
                  className="post__image"
                  src={post.image}
                  alt={post.text}
                  onError={(event) => {
                    event.currentTarget.src = post.owner.picture
                  }}
                />

                <div className="post__info">
                  <div className="post__meta-row">
                    <div className="post__stat-block">
                      <strong>Today</strong>
                      <div className="post__metrics" aria-label="Today post metrics">
                        <span className="metric metric--heart"><FiHeart className="metric__icon" focusable="false" />{post.likes}</span>
                        <span className="metric metric--comment"><FiMessageSquare className="metric__icon" focusable="false" />{post.tags.length + 28}</span>
                      </div>
                    </div>

                    <div className="post__stat-block">
                      <span>{date}</span>
                      <div className="post__metrics" aria-label="Dated post metrics">
                        <span className="metric metric--heart"><FiHeart className="metric__icon" focusable="false" />{post.likes}</span>
                        <span className="metric metric--comment"><FiMessageSquare className="metric__icon" focusable="false" />{post.tags.length + 28}</span>
                      </div>
                    </div>
                  </div>

                  <div className="post__caption">
                    <strong>Image upload</strong>
                    <span>{date}</span>
                  </div>
                </div>
              </article>
            )
          })}
        </section>

        <button className="load-more" type="button" onClick={handleLoadMore} disabled={isLoadingMore || !hasMore}>
          {isLoadingMore ? 'Loading...' : hasMore ? 'Load more' : 'No more'}
        </button>
        {loadMoreError ? <p className="load-more-error">{loadMoreError}</p> : null}
      </>
    )
  }, [error, handleLoadMore, hasMore, isLoading, isLoadingMore, loadMoreError, posts, viewMode])

  return (
    <main className="mockup-page">
      <section className="project-board" aria-label="monblanproject posts">
        <img className="shape shape--top" src={bgVectorTop} alt="" aria-hidden="true" />
        <img className="brand-mark" src={logo} alt="Monblan logo" aria-hidden="true" />

        <header className="project-header">
          <div className="project-summary">
            <div className="project-title-row">
              <h1>monblanproject</h1>
              <div className="start-date">Start on 17-02-2016</div>
            </div>

            <dl className="project-stats">
              <div>
                <dt>870</dt>
                <dd>posts</dd>
              </div>
              <div>
                <dt>11,787</dt>
                <dd>followers</dd>
              </div>
              <div>
                <dt>112</dt>
                <dd>following</dd>
              </div>
            </dl>

            <form className="date-filter" aria-label="Date filter">
              <span>Date</span>
              <DatePicker
                selected={dateFrom}
                onChange={(date: Date | null) => setDateFrom(date)}
                placeholderText="from"
                isClearable
                showIcon
                icon={<CalendarPickerIcon />}
                dateFormat="dd_MM_yyyy"
                showPopperArrow={false}
                popperPlacement="bottom-start"
              />
              <DatePicker
                selected={dateTo}
                onChange={(date: Date | null) => setDateTo(date)}
                placeholderText="to"
                isClearable
                showIcon
                icon={<CalendarPickerIcon />}
                dateFormat="dd_MM_yyyy"
                showPopperArrow={false}
                popperPlacement="bottom-start"
              />
            </form>
          </div>
        </header>

        <div className="feed-container">
          <div className="toolbar" aria-label="View mode">
            <button
              className={viewMode === 'tiles' ? 'active' : ''}
              type="button"
              onClick={() => setViewMode('tiles')}
              aria-label="Tiles"
              aria-pressed={viewMode === 'tiles'}
            >
              <span className="icon-grid" />
            </button>
            <button
              className={viewMode === 'rows' ? 'active' : ''}
              type="button"
              onClick={() => setViewMode('rows')}
              aria-label="Rows"
              aria-pressed={viewMode === 'rows'}
            >
              <span className="icon-list" />
            </button>
          </div>
          
          {content}
        </div>
      </section>
    </main>
  )
}

export default App
