import { Link } from "@tanstack/react-router";
import tapvioMark from "@/assets/tapvio-mark.png.asset.json";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-navy text-navy-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <img src={tapvioMark.url} alt="TAPVIO" className="h-9 w-9 object-contain" />
            <span className="text-lg font-bold">TAPVIO</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-navy-foreground/70">
            Conecta. Fideliza. Crece. La plataforma NFC y QR que une negocios físicos con sus
            clientes.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Descubre</h3>
          <ul className="mt-3 space-y-2 text-sm text-navy-foreground/70">
            <li>
              <Link to="/explorar" className="hover:text-navy-foreground">
                Explorar negocios
              </Link>
            </li>
            <li>
              <Link to="/" className="hover:text-navy-foreground">
                Cómo funciona
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Negocios</h3>
          <ul className="mt-3 space-y-2 text-sm text-navy-foreground/70">
            <li>Planes y precios</li>
            <li>Dispositivos NFC</li>
            <li>Contacto</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-navy-foreground/10 px-4 py-5 text-center text-xs text-navy-foreground/60">
        © {new Date().getFullYear()} TAPVIO · Las Palmas de Gran Canaria
      </div>
    </footer>
  );
}
