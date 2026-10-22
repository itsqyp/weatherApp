import { ExternalLink, Mail } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-muted bg-background px-4 py-6 text-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
        {/* Copyright */}
        <div className="text-sm leading-6">
          <p className="font-medium">
            Made by <span className="font-anton">Abir Bro</span>{" "}
            <span aria-label="copyright">©</span> {currentYear}
          </p>
          <p className="text-foreground/70">All rights reserved.</p>
        </div>

        {/* Contact links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <a
            href="mailto:itsqyp@gmail.com"
            className="inline-flex items-center gap-2 transition-colors hover:text-primary"
            aria-label="Email Abir"
          >
            <Mail size={16} />
            Email
          </a>

          <a
            href="https://github.com/itsqyp"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 transition-colors hover:text-primary"
            aria-label="Visit Abir's GitHub profile"
          >
            <ExternalLink size={16} />
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
