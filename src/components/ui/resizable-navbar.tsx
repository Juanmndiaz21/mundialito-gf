import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";
import { SolarIcon, type SolarIconName } from "../SolarIcon";

interface NavbarContextValue {
  visible: boolean;
}

const NavbarContext = createContext<NavbarContextValue>({ visible: false });

export interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ children, className = "" }) => {
  const [visible, setVisible] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setVisible(latest > 30);
  });

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY || document.documentElement.scrollTop;
      setVisible(currentScroll > 30);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <NavbarContext.Provider value={{ visible }}>
      <header
        className={`sticky top-0 sm:top-2 inset-x-0 z-30 w-full px-3 sm:px-6 pointer-events-auto ${className}`.trim()}
      >
        {children}
      </header>
    </NavbarContext.Provider>
  );
};

export interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

export const NavBody: React.FC<NavBodyProps> = ({
  children,
  className = "",
  visible: visibleProp,
}) => {
  const context = useContext(NavbarContext);
  const isVisible = visibleProp !== undefined ? visibleProp : context.visible;

  return (
    <motion.div
      layout
      initial={false}
      animate={{
        maxWidth: isVisible ? "1240px" : "1300px",
        borderRadius: isVisible ? "9999px" : "16px",
        paddingTop: isVisible ? "6px" : "10px",
        paddingBottom: isVisible ? "6px" : "10px",
        backgroundColor: isVisible ? "rgba(43, 44, 45, 0.96)" : "rgba(43, 44, 45, 1)",
      }}
      transition={{
        type: "spring",
        stiffness: 240,
        damping: 26,
      }}
      className={`hidden lg:flex items-center justify-between mx-auto border px-3.5 xl:px-5 backdrop-blur-md ${
        isVisible
          ? "border-white/20 shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)]"
          : "border-[#3D3E40] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)]"
      } ${className}`.trim()}
    >
      {children}
    </motion.div>
  );
};

export interface NavItemConfig {
  name: string;
  link: string;
  icon?: SolarIconName;
  active?: boolean;
}

export interface NavItemsProps {
  items: NavItemConfig[];
  className?: string;
  onItemClick?: (link: string) => void;
}

export const NavItems: React.FC<NavItemsProps> = ({
  items,
  className = "",
  onItemClick,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <nav
      aria-label="Navegación principal"
      className={`relative flex items-center justify-center gap-0.5 xl:gap-1 2xl:gap-1.5 shrink-0 ${className}`.trim()}
      onMouseLeave={() => setHoveredIdx(null)}
    >
      {items.map((item, idx) => {
        const isActive = item.active;
        const isHovered = hoveredIdx === idx;

        return (
          <a
            key={item.link}
            href={item.link}
            aria-current={isActive ? "page" : undefined}
            onMouseEnter={() => setHoveredIdx(idx)}
            onClick={(e) => {
              if (onItemClick) {
                e.preventDefault();
                onItemClick(item.link);
              }
            }}
            className={`relative min-h-[38px] xl:min-h-[40px] px-2.5 xl:px-3 2xl:px-3.5 py-1 xl:py-1.5 rounded-full text-xs xl:text-sm font-semibold whitespace-nowrap transition-colors duration-150 inline-flex items-center gap-1 xl:gap-1.5 z-10 ${
              isActive
                ? "text-white"
                : isHovered
                ? "text-white"
                : "text-gray-300 hover:text-white"
            }`}
          >
            {/* Sliding hover pill con Framer Motion layoutId */}
            {isHovered && !isActive && (
              <motion.span
                layoutId="nav-item-hovered"
                className="absolute inset-0 rounded-full bg-white/10 -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
              />
            )}

            {/* Sliding active pill con Framer Motion layoutId */}
            {isActive && (
              <motion.span
                layoutId="nav-item-active"
                className="absolute inset-0 rounded-full bg-[var(--espn-red)] shadow-xs -z-10"
                transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              />
            )}

            {item.icon && (
              <SolarIcon
                name={item.icon}
                className={`w-3.5 h-3.5 shrink-0 ${
                  isActive ? "text-white" : "text-gray-400"
                }`}
              />
            )}
            <span>{item.name}</span>
          </a>
        );
      })}
    </nav>
  );
};

export interface NavbarLogoProps {
  className?: string;
  onClick?: () => void;
  brandText?: string;
  portalText?: string;
}

export const NavbarLogo: React.FC<NavbarLogoProps> = ({
  className = "",
  onClick,
  brandText = "FULBO 5",
  portalText = "MATCH CENTER",
}) => {
  return (
    <a
      href="#/"
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`min-h-[40px] xl:min-h-[44px] inline-flex items-center gap-2 xl:gap-2.5 px-0.5 xl:px-1 group shrink-0 cursor-pointer ${className}`.trim()}
    >
      <span className="px-2 xl:px-2.5 py-0.5 rounded-[4px] bg-[var(--espn-red)] text-white font-display text-base xl:text-lg font-black tracking-wider shadow-xs">
        F5
      </span>
      <div className="flex flex-col leading-none">
        <span className="font-display text-sm xl:text-base font-black tracking-wide text-white group-hover:text-[var(--espn-red)] transition-colors duration-150 whitespace-nowrap">
          {brandText}
        </span>
        <span className="text-[9px] xl:text-[10px] uppercase font-bold tracking-widest text-gray-300 hidden sm:block whitespace-nowrap">
          {portalText}
        </span>
      </div>
    </a>
  );
};

export interface NavbarButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  ariaLabel?: string;
}

export const NavbarButton: React.FC<NavbarButtonProps> = ({
  children,
  variant = "primary",
  className = "",
  onClick,
  type = "button",
  ariaLabel,
}) => {
  const baseClasses =
    "min-h-[38px] xl:min-h-[40px] px-2.5 xl:px-3.5 py-1.5 rounded-full text-xs xl:text-sm font-bold inline-flex items-center justify-center gap-1.5 xl:gap-2 cursor-pointer shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] whitespace-nowrap shrink-0";

  let variantClasses = "bg-[var(--espn-red)] hover:bg-[var(--espn-red-hover)] text-white";
  if (variant === "secondary") {
    variantClasses =
      "bg-[#383A3C] hover:bg-[#444648] text-gray-100 border border-white/15";
  } else if (variant === "ghost") {
    variantClasses = "text-gray-300 hover:text-white hover:bg-white/10";
  }

  return (
    <motion.button
      type={type}
      aria-label={ariaLabel}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={`${baseClasses} ${variantClasses} ${className}`.trim()}
    >
      {children}
    </motion.button>
  );
};

export interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  children,
  className = "",
  visible: visibleProp,
}) => {
  const context = useContext(NavbarContext);
  const isVisible = visibleProp !== undefined ? visibleProp : context.visible;

  return (
    <motion.div
      layout
      initial={false}
      animate={{
        borderRadius: isVisible ? "9999px" : "16px",
        paddingTop: isVisible ? "8px" : "10px",
        paddingBottom: isVisible ? "8px" : "10px",
      }}
      transition={{ type: "spring", stiffness: 240, damping: 26 }}
      className={`lg:hidden w-full bg-[#2B2C2D] border border-[#3D3E40] px-4 backdrop-blur-md ${
        isVisible
          ? "border-white/15 shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)] bg-[#2B2C2D]/95"
          : "shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)]"
      } ${className}`.trim()}
    >
      {children}
    </motion.div>
  );
};

export interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileNavHeader: React.FC<MobileNavHeaderProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`flex w-full items-center justify-between gap-3 ${className}`.trim()}
    >
      {children}
    </div>
  );
};

export interface MobileNavToggleProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export const MobileNavToggle: React.FC<MobileNavToggleProps> = ({
  isOpen,
  onClick,
  className = "",
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-label={isOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
      className={`min-w-[44px] min-h-[44px] w-10 h-10 rounded-full bg-[#383A3C] border border-white/15 text-white flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors hover:bg-[#444648] ${className}`.trim()}
    >
      <motion.span
        aria-hidden="true"
        animate={isOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-5 h-0.5 bg-white origin-center"
      />
      <motion.span
        aria-hidden="true"
        animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="w-5 h-0.5 bg-white"
      />
      <motion.span
        aria-hidden="true"
        animate={isOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-5 h-0.5 bg-white origin-center"
      />
    </button>
  );
};

export interface MobileNavMenuProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNavMenu: React.FC<MobileNavMenuProps> = ({
  children,
  className = "",
  isOpen,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: -12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`absolute inset-x-3 sm:inset-x-6 top-full mt-3 z-50 flex flex-col gap-4 rounded-2xl bg-[#2B2C2D] border border-white/15 p-5 sm:p-6 shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)] text-white backdrop-blur-md max-h-[calc(100vh-90px)] overflow-y-auto ${className}`.trim()}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const NavbarDemo: React.FC = () => {
  const navItems = [
    { name: "Features", link: "#features" },
    { name: "Pricing", link: "#pricing" },
    { name: "Contact", link: "#contact" },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative w-full">
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="flex items-center gap-4">
            <NavbarButton variant="secondary">Login</NavbarButton>
            <NavbarButton variant="primary">Book a call</NavbarButton>
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-neutral-300 hover:text-white"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
            <div className="flex w-full flex-col gap-4">
              <NavbarButton
                onClick={() => setIsMobileMenuOpen(false)}
                variant="primary"
                className="w-full"
              >
                Login
              </NavbarButton>
              <NavbarButton
                onClick={() => setIsMobileMenuOpen(false)}
                variant="primary"
                className="w-full"
              >
                Book a call
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
};
