import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-gray-50 border-t border-gray-200 py-4 px-6 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600 mt-auto">
      <div className="mb-2 sm:mb-0">
        &copy; {new Date().getFullYear()} VidyaAI. All rights reserved.
      </div>
      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="hover:text-blue-600 transition-colors"
        >
          Dashboard
        </Link>
        <Link href="/quiz" className="hover:text-blue-600 transition-colors">
          Quiz
        </Link>
        <Link
          href="/dashboard/settings"
          className="hover:text-blue-600 transition-colors"
        >
          Settings
        </Link>
      </div>
    </footer>
  );
}
