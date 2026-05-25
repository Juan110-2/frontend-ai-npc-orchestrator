import { ImageResponse } from 'next/og'
import fs from 'fs'
import path from 'path'

export async function GET() {
  const imgData = fs.readFileSync(path.join(process.cwd(), 'public/univalle-logo.png'))
  const base64 = Buffer.from(imgData).toString('base64')

  return new ImageResponse(
    (
      <div style={{ width: 32, height: 32, display: 'flex', filter: 'saturate(0) contrast(3)' }}>
        <img src={`data:image/png;base64,${base64}`} width={32} height={32} style={{ objectFit: 'cover', borderRadius: 8 }} />
      </div>
    ),
    { width: 32, height: 32 }
  )
}
