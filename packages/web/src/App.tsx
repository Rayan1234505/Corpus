import { Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { Workspace } from "./pages/Workspace";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/session/:id" element={<Workspace />} />
    </Routes>
  );
}

export default App;
