import React, { useState } from "react";
import { useStore } from "../store/StoreContext";
import type { RoutePath } from "../store/router";
import { SolarIcon, type SolarIconName } from "./SolarIcon";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { Magnet } from "@/components/ui/Magnet";

interface NavItemDef {
  path: RoutePath;
  name: string;
  icon: SolarIconName;
}

const NAV_ITEMS: NavItemDef[] = [
  { path: "/", name: "Inicio", icon: "home" },
  { path: "/torneo", name: "Torneo", icon: "football" },
  { path: "/partidos", name: "Partidos", icon: "matches" },
  { path: "/equipos", name: "Equipos", icon: "usersGroup" },
  { path: "/feeling", name: "Feeling", icon: "feeling" },
  { path: "/mixto", name: "Mixto", icon: "mixto" },
  { path: "/campeones", name: "Campeones", icon: "crown" },
];

export const TopBar: React.FC = () => {
  const { route, navigate, setModal, activeUser, openSignInModal } =
    useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const items = NAV_ITEMS.map((item) => ({
    name: item.name,
    link: `#${item.path}`,
    icon: item.icon,
    active: route === item.path || (item.path === "/" && route === "/club"),
  }));

  const handleItemClick = (link: string) => {
    const rawPath = link.replace(/^#/, "") as RoutePath;
    navigate(rawPath);
    setIsMobileMenuOpen(false);
  };

  return (
    <Navbar>
      {/* Desktop Navigation (Resizable Navbar) */}
      <NavBody>
        <NavbarLogo onClick={() => navigate("/")} />

        <NavItems items={items} onItemClick={handleItemClick} />

        <div className="flex items-center gap-1.5 xl:gap-2.5 shrink-0">
          <Magnet>
            <NavbarButton
              variant="secondary"
              onClick={() => openSignInModal()}
              ariaLabel={
                activeUser
                  ? `Sesión activa: ${activeUser.displayName}. Clic para cambiar usuario`
                  : "Sign In: Iniciar sesión y elegir usuario"
              }
              className="border-white/20 bg-white/10 hover:bg-white/15 text-white"
            >
              {activeUser ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                  <span className="font-mono-tech font-bold text-amber-300">
                    #{String(activeUser.dorsal).padStart(2, "0")}
                  </span>
                  <span className="hidden xl:inline font-bold max-w-[100px] truncate">
                    {activeUser.displayName}
                  </span>
                  <SolarIcon name="arrowDown" className="w-3 h-3 text-gray-400 shrink-0" />
                </>
              ) : (
                <>
                  <SolarIcon name="userId" className="w-3.5 h-3.5 text-[var(--espn-red)] shrink-0" />
                  <span className="font-bold">Sign In</span>
                </>
              )}
            </NavbarButton>
          </Magnet>

          <Magnet>
            <NavbarButton
              variant="primary"
              onClick={() =>
                setModal({
                  kind: "add",
                  defaultTournament: route === "/mixto" ? "mixto" : undefined,
                })
              }
            >
              <SolarIcon name="plus" className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="hidden xl:inline">Cargar partido</span>
              <span className="xl:hidden">Cargar</span>
            </NavbarButton>
          </Magnet>
        </div>
      </NavBody>

      {/* Mobile Navigation (Resizable Pill + Mobile Drawer) */}
      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo onClick={() => navigate("/")} />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setModal({
                  kind: "add",
                  defaultTournament: route === "/mixto" ? "mixto" : undefined,
                })
              }
              className="min-h-[44px] px-3.5 py-1.5 rounded-full bg-[var(--espn-red)] hover:bg-[var(--espn-red-hover)] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] active:scale-[0.97] transition-all"
            >
              <SolarIcon name="plus" className="w-3.5 h-3.5 text-white" />
              <span>Cargar</span>
            </button>

            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </div>
        </MobileNavHeader>

        <MobileNavMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        >
          <div className="grid grid-cols-2 gap-2">
            {NAV_ITEMS.map((item, idx) => {
              const active =
                route === item.path || (item.path === "/" && route === "/club");
              const isLastOdd =
                idx === NAV_ITEMS.length - 1 && NAV_ITEMS.length % 2 !== 0;
              return (
                <a
                  key={item.path}
                  href={`#${item.path}`}
                  aria-current={active ? "page" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${
                    isLastOdd ? "col-span-2 justify-center sm:justify-start" : ""
                  } ${
                    active
                      ? "bg-[var(--espn-red)] text-white font-bold"
                      : "bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <SolarIcon
                    name={item.icon}
                    className={`w-4 h-4 ${active ? "text-white" : "text-gray-400"}`}
                  />
                  <span>{item.name}</span>
                </a>
              );
            })}
          </div>

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
            <NavbarButton
              variant="secondary"
              onClick={() => {
                setIsMobileMenuOpen(false);
                openSignInModal();
              }}
              className="w-full justify-between"
            >
              <div className="flex items-center gap-2">
                <SolarIcon name="userId" className="w-4 h-4 text-[var(--espn-red)]" />
                <span>
                  {activeUser
                    ? `Sesión: #${String(activeUser.dorsal).padStart(2, "0")} ${activeUser.displayName}`
                    : "Sign In · Elegir usuario"}
                </span>
              </div>
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                {activeUser ? "Cambiar" : "Entrar"}
              </span>
            </NavbarButton>

            <NavbarButton
              variant="primary"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setModal({
                  kind: "add",
                  defaultTournament: route === "/mixto" ? "mixto" : undefined,
                });
              }}
              className="w-full"
            >
              <SolarIcon name="plus" className="w-4 h-4 text-white" />
              <span>Cargar nuevo partido</span>
            </NavbarButton>
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
};

export const BottomNav: React.FC = () => {
  const { route, navigate, setModal } = useStore();

  return (
    <nav
      aria-label="Navegación móvil inferior"
      className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-[#2B2C2D] border-t border-[#3D3E40] px-2 py-1.5 shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)]"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 gap-1 items-center">
        {NAV_ITEMS.slice(0, 2).map(({ path, name, icon }) => {
          const active = route === path || (path === "/" && route === "/club");
          return (
            <a
              key={path}
              href={`#${path}`}
              aria-current={active ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                navigate(path);
              }}
              className={`min-h-[48px] rounded-[8px] flex flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors ${
                active
                  ? "text-white bg-white/10"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              <SolarIcon
                name={icon}
                className={`w-4 h-4 ${active ? "text-[var(--espn-red)]" : "text-gray-400"}`}
              />
              <span>{name}</span>
            </a>
          );
        })}

        <button
          type="button"
          onClick={() =>
            setModal({
              kind: "add",
              defaultTournament: route === "/mixto" ? "mixto" : undefined,
            })
          }
          className="min-h-[48px] rounded-[8px] bg-[var(--espn-red)] hover:bg-[var(--espn-red-hover)] text-white flex flex-col items-center justify-center gap-0.5 text-xs font-bold active:scale-[0.97] transition-transform duration-150 cursor-pointer shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]"
        >
          <SolarIcon name="plus" className="w-5 h-5 text-white" />
          <span>Cargar</span>
        </button>

        {NAV_ITEMS.slice(2, 4).map(({ path, name, icon }) => {
          const active = route === path;
          return (
            <a
              key={path}
              href={`#${path}`}
              aria-current={active ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                navigate(path);
              }}
              className={`min-h-[48px] rounded-[8px] flex flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors ${
                active
                  ? "text-white bg-white/10"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              <SolarIcon
                name={icon}
                className={`w-4 h-4 ${active ? "text-[var(--espn-red)]" : "text-gray-400"}`}
              />
              <span>{name}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
};
