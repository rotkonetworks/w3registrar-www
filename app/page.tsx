import SearchForm from "@/components/search-form"
import { Logo } from "@/app/components/logo"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User, UserPlus } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="container mx-auto px-4 py-4">
        <div className="flex justify-end space-x-2">
          <Link href="/login">
            <Button
              size="sm"
              variant="ghost"
              className="text-gray-400 hover:bg-white/10 hover:text-white p-2 md:px-3 md:py-1 text-xs md:text-sm rounded-md transition-colors"
            >
              <User className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Login</span>
            </Button>
          </Link>
          <Link href="/register">
            <Button
              size="sm"
              variant="ghost"
              className="text-pink-400 hover:bg-pink-500/10 hover:text-pink-300 p-2 md:px-3 md:py-1 text-xs md:text-sm rounded-md transition-colors"
            >
              <UserPlus className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Register</span>
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md mx-auto flex flex-col items-center">
          <div className="mb-6 md:mb-8">
            {/* Use the hero variant for the homepage logo */}
            <Logo variant="hero" />
          </div>

          <SearchForm />

          <p className="mt-6 md:mt-8 text-gray-400 text-center text-sm px-4">
            Search for identities by name, wallet address, or social handles
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
