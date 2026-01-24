import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Guestbook Giuliana 40 - Auguri per i tuoi 40 Anni'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #FFB6C1 0%, #D4A5A5 50%, #FFD700 100%)',
          position: 'relative',
        }}
      >
        {/* Floating confetti/particles background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            opacity: 0.3,
          }}
        >
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${10 + Math.random() * 20}px`,
                height: `${10 + Math.random() * 20}px`,
                borderRadius: '50%',
                background: ['#ec4899', '#9D4EDD', '#FFD700', '#FFB6C1'][Math.floor(Math.random() * 4)],
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '48px',
            padding: '80px 120px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
            border: '4px solid rgba(236, 72, 153, 0.3)',
          }}
        >
          {/* Balloon with 40 */}
          <div
            style={{
              width: '200px',
              height: '240px',
              background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9) 0%, #ec4899 100%)',
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '40px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
              position: 'relative',
            }}
          >
            {/* Balloon shine */}
            <div
              style={{
                position: 'absolute',
                top: '40px',
                left: '40px',
                width: '60px',
                height: '80px',
                background: 'rgba(255, 255, 255, 0.4)',
                borderRadius: '50%',
              }}
            />

            <div
              style={{
                fontSize: '120px',
                fontWeight: 'bold',
                color: 'white',
                textShadow: '0 4px 12px rgba(0,0,0,0.4)',
                fontFamily: 'Arial, sans-serif',
                zIndex: 10,
              }}
            >
              40
            </div>
          </div>

          {/* Balloon string */}
          <div
            style={{
              width: '6px',
              height: '60px',
              background: '#9D4EDD',
              borderRadius: '3px',
              marginBottom: '30px',
            }}
          />

          {/* Title */}
          <div
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #ec4899 0%, #9D4EDD 50%, #FFD700 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              marginBottom: '20px',
              textAlign: 'center',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            Buon Compleanno Giuliana!
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: '36px',
              color: '#64748b',
              textAlign: 'center',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            🎉 Guestbook dei tuoi 40 anni ✨
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
