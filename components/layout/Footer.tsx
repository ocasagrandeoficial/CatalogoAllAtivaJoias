import { Gem, Instagram } from "lucide-react";

const socials = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/",
    Icon: Instagram,
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container flex flex-col items-center gap-6 py-10 text-center">
        <div className="flex items-center gap-2">
          <Gem className="h-5 w-5 text-brand-600" />
          <span className="font-serif text-lg font-semibold text-slate-900">
            AllAtiva Joias
          </span>
        </div>

        <p className="text-sm text-slate-500">
          Joalheria de alto padrão — elegância em cada detalhe.
        </p>

        <div className="flex items-center gap-4">
          {socials.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
            >
              <Icon className="h-5 w-5" />
            </a>
          ))}
        </div>

        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} AllAtiva Joias. Todos os direitos
          reservados.
        </p>
      </div>
    </footer>
  );
}
