export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container flex h-12 items-center justify-between px-4 text-sm text-muted-foreground">
        <p>© {currentYear} App Name.</p>
      </div>
    </footer>
  );
}
