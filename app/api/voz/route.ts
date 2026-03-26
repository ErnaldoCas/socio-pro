export async function POST(request: Request) {
  const formData = await request.formData()
  const audio = formData.get('audio') as File

  if (!audio) {
    return Response.json({ error: 'No se recibió audio' }, { status: 400 })
  }

  const groqForm = new FormData()
  groqForm.append('file', audio, 'audio.webm')
  groqForm.append('model', 'whisper-large-v3-turbo')
  groqForm.append('language', 'es')
  groqForm.append('response_format', 'json')

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: groqForm
  })

  const data = await res.json()

  if (!res.ok) {
    return Response.json({ error: data.error?.message || 'Error al transcribir' }, { status: 500 })
  }

  return Response.json({ texto: data.text })
}