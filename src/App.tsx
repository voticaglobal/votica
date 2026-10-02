import { Routes, Route, useLocation } from "react-router-dom";
import { Header } from "./components/common/Header";
import { Footer } from "./components/landing/Footer";
import { Home } from "./pages/Home";
import { Create } from "./pages/Create";
import { Studio } from "./pages/Studio";
import { DesignDetail } from "./pages/DesignDetail";
import { CreatorOnboarding } from "./pages/CreatorOnboarding";
import { CreatorStorefront } from "./pages/CreatorStorefront";
import { CollectionPage } from "./pages/Collection";

function App() {
  const location = useLocation();
  const isStudio = location.pathname.startsWith("/studio");

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<Create />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/design/:id" element={<DesignDetail />} />
          <Route path="/creator/onboarding" element={<CreatorOnboarding />} />
          <Route path="/creator/:slug" element={<CreatorStorefront />} />
          <Route path="/collection/:slug" element={<CollectionPage />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
      {!isStudio && <Footer />}
    </div>
  );
}

export default App;
