import React from "react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="container mx-auto px-4 py-4">
        <div className="flex justify-end space-x-2">
          <a
            href="/login"
            className="btn-ghost p-2 md:px-3 md:py-1 text-xs md:text-sm rounded-md transition-colors inline-block"
          >
            Login
          </a>
          <a
            href="/register"
            className="text-accent hover:bg-accent/10 hover:text-accent/80 p-2 md:px-3 md:py-1 text-xs md:text-sm rounded-md transition-colors inline-block"
          >
            Register
          </a>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 flex flex-col justify-center">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-16 w-auto flex justify-center">
            <img
              src="/whodb_logo.svg"
              alt="whodb"
              height={64}
              width="auto"
            />
          </div>
          <h1 className="text-4xl font-bold text-foreground">
            Find anyone on the blockchain
          </h1>
          <p className="text-muted mt-2">
            Search and verify identities across multiple networks
          </p>
        </div>

        <div className="bg-card p-8 rounded-lg border border-border/30">
          <h2 className="text-xl font-bold text-foreground mb-4">Search Form</h2>
          <p className="text-muted mb-6">Search functionality coming soon...</p>

          {/* Demo buttons to showcase the button styles */}
          <div className="flex gap-4 flex-wrap">
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8">
        <div className="text-center text-muted">
          <p>&copy; 2025 whodb. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
