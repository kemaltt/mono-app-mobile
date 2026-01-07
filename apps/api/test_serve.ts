// Native fetch
async function test() {
  const url = 'http://localhost:4040/uploads/a0bab6e6-2854-4cfe-9c6c-1bb957233e00/transactions/bdda82a5-a515-4eff-af4b-9c9660e5e41c.jpg'
  console.log('Fetching:', url)
  try {
    const res = await fetch(url)
    console.log('Status:', res.status)
    console.log('Content-Type:', res.headers.get('content-type'))
    console.log('Content-Length:', res.headers.get('content-length'))
  } catch (e) {
    console.error('Fetch failed:', e)
  }
}
test()
