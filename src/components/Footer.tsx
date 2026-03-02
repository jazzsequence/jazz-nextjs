export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-sm text-gray-600">
          © {currentYear} Chris Reynolds
        </div>
      </div>
    </footer>
  );
}
