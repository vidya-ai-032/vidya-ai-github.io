export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-200 py-4 px-4 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600 mt-auto">
      <div className="mb-2 sm:mb-0">
        &copy; {new Date().getFullYear()} VidyaAI. All rights reserved.
      </div>
      <div className="flex gap-4">
        <a href="/dashboard" className="hover:text-blue-600 transition-colors">
          Dashboard
        </a>
        <a href="/quiz" className="hover:text-blue-600 transition-colors">
          Quiz
        </a>
        <a href="/progress" className="hover:text-blue-600 transition-colors">
          Progress
        </a>
      </div>
    </footer>
  );
}
