import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #FFB6C1 0%, #D4A5A5 50%, #FFD700 100%)',
          borderRadius: '6px',
          position: 'relative',
        }}
      >
        {/* Balloon */}
        <div
          style={{
            width: '20px',
            height: '24px',
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, #ec4899 100%)',
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            top: '-2px',
          }}
        >
          {/* Number 40 */}
          <div
            style={{
              fontSize: '10px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              fontFamily: 'Arial',
            }}
          >
            40
          </div>
        </div>

        {/* Balloon string */}
        <div
          style={{
            position: 'absolute',
            bottom: '3px',
            left: '16px',
            width: '1px',
            height: '8px',
            background: '#9D4EDD',
          }}
        />

        {/* Confetti dots */}
        <div
          style={{
            position: 'absolute',
            top: '5px',
            left: '5px',
            width: '2px',
            height: '2px',
            borderRadius: '50%',
            background: '#FFD700',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '6px',
            right: '5px',
            width: '2px',
            height: '2px',
            borderRadius: '50%',
            background: '#9D4EDD',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  )
}
