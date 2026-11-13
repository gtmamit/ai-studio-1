/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ARViewportScreen } from './components/ARViewportScreen';
import { BagDrawer } from './components/BagDrawer';
import { CustomizerScreen } from './components/CustomizerScreen';
import { HomeScreen } from './components/HomeScreen';
import { Navbar } from './components/Navbar';
import { WishlistScreen } from './components/WishlistScreen';
import { AtelierProvider, useAtelier } from './context/AtelierContext';

const AtelierShell: React.FC = () => {
  const { activeScreen, toastMessage } = useAtelier();

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#141414]">
      <Navbar />

      {activeScreen === 'home' && <HomeScreen />}
      {activeScreen === 'customizer' && <CustomizerScreen />}
      {activeScreen === 'ar' && <ARViewportScreen />}
      {activeScreen === 'wishlist' && <WishlistScreen />}

      <BagDrawer />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 right-5 z-50 px-4 py-2.5 rounded-full bg-[#141414] text-white text-xs font-medium shadow-lg pointer-events-none"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AtelierProvider>
      <AtelierShell />
    </AtelierProvider>
  );
}
