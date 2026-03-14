import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-maroon-800 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-7xl mb-6">🐾</div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Magnolia Bulldogs
          </h1>
          <p className="text-maroon-200 text-xl sm:text-2xl font-light mb-2">
            Class of 2018
          </p>
          <p className="text-maroon-100 text-lg mt-6 mb-10 max-w-xl mx-auto">
            Reconnect with your classmates, update your info, and stay in the loop
            for our upcoming reunion.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary text-lg px-8 py-3 bg-white text-maroon-800 hover:bg-maroon-50 rounded-xl font-semibold">
              Join the Hub
            </Link>
            <Link to="/login" className="btn-secondary text-lg px-8 py-3 border-white text-white hover:bg-maroon-700 rounded-xl font-semibold">
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
            Everything you need to stay connected
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '📋', title: 'Class Directory', desc: 'Find any classmate by name, city, or career. See where everyone ended up.' },
              { icon: '💬', title: 'Direct Messaging', desc: 'Send private messages to classmates. Inbox delivered straight to your email.' },
              { icon: '🎉', title: 'Reunion Hub', desc: 'RSVP for the 10-Year Reunion and see which classmates are coming.' },
              { icon: '🗺️', title: 'Class Map', desc: 'See where the Class of 2018 has scattered across the country.' },
              { icon: '👤', title: 'Your Profile', desc: 'Update your photo, career, city, and keep your contact info current.' },
              { icon: '🔒', title: 'Private & Secure', desc: 'Accounts require admin approval. Only classmates get in.' },
            ].map(f => (
              <div key={f.title} className="card p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-maroon-800 text-white text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to reconnect?</h2>
        <p className="text-maroon-200 mb-8">Sign up in minutes. An admin will approve your account.</p>
        <Link to="/register" className="inline-block bg-white text-maroon-800 font-semibold px-8 py-3 rounded-xl hover:bg-maroon-50 transition-colors">
          Create Your Account
        </Link>
      </section>

      <footer className="py-6 px-4 text-center text-sm text-gray-400 bg-white">
        Magnolia High School Class of 2018 • Private Alumni Hub
      </footer>
    </div>
  );
}
