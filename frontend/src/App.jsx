import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Scenario1 from "./pages/Scenario1";
import Scenario2 from "./pages/Scenario2";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/scenario/1" element={<Scenario1 />} />
        <Route path="/scenario/2" element={<Scenario2 />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;