import logo from './logo.svg';
// import MoonVisualization from './Cloned_Moon/MoonVisulalization';
// import Moon3D from './MoonScene';
import './App.css';
import Moon from "./components/World/moon.jsx"
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute.jsx';
import LoginPage from './components/LoginPage/LoginPage.jsx';
import ScrapingStatusUploader from './components/ScrapingUpdater/ScrapingUpdater.jsx';

function App() {

  return (
    <div className="App" style={{ overflow: "hidden !important" }}>

      {/* <MoonVisualization /> */}
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <Moon />
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/live" element={<ScrapingStatusUploader />} />
        </Routes>
      </Router>
    </div>


  );
}

export default App;
