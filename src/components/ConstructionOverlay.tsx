'use client';

export default function ConstructionOverlay() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 41, 0.95)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
    >
      {/* Content Container */}
      <div
        style={{
          maxWidth: '800px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 41, 0.9) 100%)',
          padding: '50px 40px',
          borderRadius: '16px',
          border: '2px solid rgba(59, 130, 246, 0.3)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(59, 130, 246, 0.15)',
        }}
      >
        {/* Lock Icon Header */}
        <div style={{ fontSize: '64px', marginBottom: '20px', lineHeight: 1 }}>
          🔒
        </div>

        {/* Main Heading */}
        <h1
          style={{
            color: '#fff',
            fontSize: 'clamp(28px, 5vw, 42px)',
            fontWeight: '800',
            marginBottom: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
            letterSpacing: '-0.5px',
          }}
        >
          🔒 Site Under Construction 🔒
        </h1>

        {/* Subheading */}
        <h2
          style={{
            color: '#60a5fa',
            fontSize: 'clamp(20px, 3.5vw, 28px)',
            fontWeight: '700',
            marginBottom: '25px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          Your Ultimate CISSP Preparation Hub is Being Built!
        </h2>

        {/* Body Text */}
        <p
          style={{
            color: '#cbd5e1',
            fontSize: 'clamp(16px, 2.5vw, 18px)',
            lineHeight: '1.7',
            marginBottom: '25px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          We&apos;re working hard behind the scenes to launch the most comprehensive,
          up-to-date CISSP exam prep resource. Get ready for in-depth study guides
          covering all 8 domains, thousands of practice questions, expert tips, and
          tools to help you ace the Certified Information Systems Security Professional
          certification on your first try!
        </p>

        {/* Launch Notice */}
        <div
          style={{
            display: 'inline-block',
            background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)',
            padding: '12px 30px',
            borderRadius: '8px',
            marginTop: '10px',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
          }}
        >
          <p
            style={{
              color: '#fff',
              fontSize: 'clamp(16px, 2.5vw, 20px)',
              fontWeight: '700',
              margin: 0,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            }}
          >
            Launching soon – your path to becoming CISSP-certified starts here!
          </p>
        </div>

        {/* Decorative Shield Icons */}
        <div style={{ marginTop: '30px', fontSize: '24px', opacity: 0.6 }}>
          🛡️ 🔐 🛡️
        </div>
      </div>
    </div>
  );
}
