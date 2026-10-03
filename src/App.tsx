import { Routes, Route, useLocation } from "react-router-dom";
import { Header } from "./components/common/Header";
import { Footer } from "./components/landing/Footer";
import { Home } from "./pages/Home";
import { Create } from "./pages/Create";
import { Studio } from "./pages/Studio";
import { Builder } from "./pages/Builder";
import { DesignDetail } from "./pages/DesignDetail";
import { CharmReviewRequest } from "./pages/CharmReviewRequest";
import { CreatorOnboarding } from "./pages/CreatorOnboarding";
import { CreatorStorefront } from "./pages/CreatorStorefront";
import { CollectionPage } from "./pages/Collection";
import { TryOn } from "./pages/TryOn";

function App() {
  const location = useLocation();
  const isStudio = location.pathname.startsWith("/studio") || location.pathname.startsWith("/builder");

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<Create />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/builder" element={<Builder />} />
          <Route path="/try-on" element={<TryOn />} />
          <Route path="/design/:id" element={<DesignDetail />} />
          <Route path="/charm/request" element={<CharmReviewRequest />} />
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
