import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
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
          borderRadius: '32px',
          position: 'relative',
        }}
      >
        {/* Main Balloon */}
        <div
          style={{
            width: '100px',
            height: '120px',
            background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9) 0%, #ec4899 100%)',
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            top: '-10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {/* Balloon highlight/shine */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              width: '30px',
              height: '40px',
              background: 'rgba(255,255,255,0.4)',
              borderRadius: '50%',
            }}
          />

          {/* Number 40 */}
          <div
            style={{
              fontSize: '60px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '0 3px 8px rgba(0,0,0,0.4)',
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
            position: 'absolute',
            bottom: '20px',
            width: '4px',
            height: '45px',
            background: '#9D4EDD',
            borderRadius: '2px',
          }}
        />

        {/* Confetti pieces */}
        <div
          style={{
            position: 'absolute',
            top: '30px',
            left: '30px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#FFD700',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '35px',
            right: '30px',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#9D4EDD',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '80px',
            left: '25px',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#ec4899',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '75px',
            right: '25px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#FFB6C1',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  )
}
