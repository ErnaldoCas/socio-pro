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
  // ✅ Prompt con chilenismos para que Whisper los reconozca correctamente
  groqForm.append('prompt', 'Transcripción de un emprendedor chileno registrando movimientos de su negocio. Puede usar términos como: lucas, luca, palo, palos, weón, po, cachai, fome, piola, al tiro, altiro, ya po, vendí, cobré, gasté, compré, pagué, quedé, debo, me quedé, completo, once, colación, cazuela, marraqueta, schop, palta, pollo, papas fritas, bebida, jugo. Montos en pesos chilenos.')

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