import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-white/80 backdrop-blur-md border-t border-gray-100/50 py-6 px-6 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600 mt-auto">
      <div className="mb-4 sm:mb-0">
        <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          &copy; {new Date().getFullYear()} VidyaAI
        </span>
        . All rights reserved.
      </div>
      <div className="flex gap-6">
        <Link
          href="/dashboard"
          className="hover:text-blue-600 transition-all duration-300 hover:scale-105"
        >
          Dashboard
        </Link>
        <Link
          href="/quiz"
          className="hover:text-blue-600 transition-all duration-300 hover:scale-105"
        >
          Quiz
        </Link>
        <Link
          href="/dashboard/settings"
          className="hover:text-blue-600 transition-all duration-300 hover:scale-105"
        >
          Settings
        </Link>
      </div>
    </footer>
  );
}
