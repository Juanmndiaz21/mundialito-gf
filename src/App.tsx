import React from "react";
import { StoreProvider, useStore } from "./store/StoreContext";
import { TopBar, BottomNav } from "./components/Navigation";
import { Footer } from "./components/Footer";
import { HomeView } from "./views/HomeView";
import { MatchesView } from "./views/MatchesView";
import { FeelingView } from "./views/FeelingView";
import { MixtoView } from "./views/MixtoView";
import { ChampionsView } from "./views/ChampionsView";
import { LandingView } from "./views/LandingView";
import { TeamBuilderView } from "./views/TeamBuilderView";
import { MatchDrawer } from "./components/MatchDrawer";
import { PlayerDrawer } from "./components/PlayerDrawer";
import { AddMatchModal } from "./components/AddMatchModal";
import { UserRegistrationModal } from "./components/UserRegistrationModal";
import {
  ConfirmDialog,
  CorruptedStorageScreen,
  Toast,
} from "./components/Overlays";
import { SmoothScrollProvider } from "./components/MotionSystem";
import { PageTransition } from "./components/ui/PageTransition";

const AppShell: React.FC = () => {
  const { route, corruptedRaw } = useStore();

  if (corruptedRaw !== null) {
    return (
      <>
        <CorruptedStorageScreen />
        <ConfirmDialog />
        <Toast />
      </>
    );
  }

  return (
    <SmoothScrollProvider>
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col pb-24 lg:pb-12">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-[8px] focus:bg-[var(--win)] focus:text-[var(--on-win)] focus:font-semibold"
        >
          Saltar al contenido principal
        </a>

        <TopBar />

        <main
          id="main-content"
          className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 pt-6 sm:pt-8"
        >
          <PageTransition viewKey={route}>
            {(route === "/" || route === "/club") && <LandingView />}
            {route === "/torneo" && <HomeView />}
            {route === "/partidos" && <MatchesView />}
            {route === "/feeling" && <FeelingView />}
            {route === "/mixto" && <MixtoView />}
            {route === "/campeones" && <ChampionsView />}
            {route === "/equipos" && <TeamBuilderView />}
          </PageTransition>
        </main>

        <MatchDrawer />
        <PlayerDrawer />
        <AddMatchModal />
        <UserRegistrationModal />
        <ConfirmDialog />
        <Toast />
        <Footer />
        <BottomNav />
      </div>
    </SmoothScrollProvider>
  );
};

export const App: React.FC = () => {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
};

export default App;
