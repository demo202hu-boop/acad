import { NextResponse } from 'next/server'

const TARGET_HOST = 'https://acadflow-pvppcoe.vercel.app'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Validate required fields
    const { enrollment_number, studentName, taskTitle, feedback, teacherName, emailType } = body
    if (!enrollment_number || !studentName || !taskTitle || !feedback || !teacherName || !emailType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Forward the request to the target host (server-to-server, no CORS issues)
    const res = await fetch(`${TARGET_HOST}/api/send-redo-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.140 Safari/537.36',
        'Origin': TARGET_HOST,
        'Referer': `${TARGET_HOST}/`,
      },
      body: JSON.stringify(body),
    })

    // Try to parse JSON response
    let data
    const contentType = res.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      data = await res.json()
    } else {
      data = { rawResponse: await res.text() }
    }

    if (!res.ok) {
      return NextResponse.json(
        { success: false, status: res.status, error: data },
        { status: res.status }
      )
    }

    return NextResponse.json({ success: true, status: res.status, data })
  } catch (err: any) {
    console.error('Proxy Error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Internal proxy error' },
      { status: 500 }
    )
  }
}
