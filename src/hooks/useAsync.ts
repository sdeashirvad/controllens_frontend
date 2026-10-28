import { useEffect, useState } from 'react'

interface AsyncState<T> {
  data: T | undefined
  error: Error | null
  loading: boolean
  retry: () => void
}

export function useAsync<T>(loader: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const depsKey = JSON.stringify(deps)

  useEffect(() => {
    let live = true
    setLoading(true)
    setData(undefined)
    setError(null)
    loader()
      .then((value) => {
        if (!live) return
        setData(value)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (!live) return
        setError(err instanceof Error ? err : new Error('Request failed'))
        setLoading(false)
      })
    return () => {
      live = false
    }
  }, [depsKey, attempt])

  return {
    data,
    error,
    loading,
    retry: () => setAttempt((value) => value + 1),
  }
}
