import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import { Home, SingleCountry } from "./pages";
function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="info/:id" element={<SingleCountry />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
