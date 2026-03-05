import axios from 'axios'

export async function fetchAllPages<T>(
  url: string,
  params: Record<string, any> = {},
  pageSize = 200
): Promise<T[]> {
  const firstResp = await axios.get(url, {
    params: {
      ...params,
      page: 1,
      page_size: pageSize
    }
  })

  if (Array.isArray(firstResp.data)) {
    return firstResp.data as T[]
  }

  const firstResults = Array.isArray(firstResp.data?.results) ? firstResp.data.results : []
  const count = Number(firstResp.data?.count ?? firstResults.length)
  const totalPages = Math.max(1, Math.ceil(count / pageSize))

  if (totalPages === 1) {
    return firstResults as T[]
  }

  const requests: Promise<any>[] = []
  for (let page = 2; page <= totalPages; page += 1) {
    requests.push(
      axios.get(url, {
        params: {
          ...params,
          page,
          page_size: pageSize
        }
      })
    )
  }

  const responses = await Promise.all(requests)
  const merged = [...firstResults]
  for (const resp of responses) {
    if (Array.isArray(resp.data)) {
      merged.push(...resp.data)
      continue
    }
    merged.push(...(resp.data?.results || []))
  }

  return merged as T[]
}
