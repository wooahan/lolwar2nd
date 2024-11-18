import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Swiper from 'swiper';
import 'swiper/css';
import ScrollToTop from "./component/layout/scrolltop";
import AboutPage from "./pages/about";
import AchievementPage from "./pages/achievement";
import PlayerInfo from "./pages/playerinfo";
import BlogDetails from "./pages/blog-single";
import GameResults from "./pages/gameresults";
import Update from "./pages/update";
import ContactUs from "./pages/contact";
import GalleryPage from "./pages/gallery";
import GameELO from "./pages/gameelo";
import ChampStats from "./pages/champstats";
import GameRecord from "./pages/gamerecord";
import GameListSection from "./pages/gamelist";
import GameListTwoSection from "./pages/gamelisttwo";
import HomePage from './pages/home';
import PartnerPage from "./pages/partner";
import ShopDetails from "./pages/shopdetails";
import TeamPage from "./pages/team";
import TeamSinglePage from "./pages/team-single";
import ErrorPage from "./pages/errorpage";
// import Footer from "./component/layout/footer";
// import Header from "./component/layout/header";
// import PageHeader from './component/layout/pageheader';
// import GameList from './component/section/gamelist';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="game-list" element={<GameListSection />} />
        <Route path="game-list2" element={<GameListTwoSection />} />
        <Route path="partners" element={<PartnerPage />} />
        <Route path="achievements" element={<AchievementPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="team-single" element={<TeamSinglePage />} />
        <Route path="*" element={<ErrorPage />} />
        <Route path="shop-single" element={<ShopDetails />} />
        <Route path="playerinfo" element={<PlayerInfo />} />
        <Route path="gameresults" element={<GameResults />} />
        <Route path="gameelo" element={<GameELO />} />
        <Route path="champstats" element={<ChampStats />} />
        <Route path="gamerecord" element={<GameRecord />} />
        <Route path="blog-single" element={<BlogDetails />} />
        <Route path="contact" element={<ContactUs />} />
        <Route path="update" element={<Update />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
