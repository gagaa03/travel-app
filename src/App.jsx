import { BrowserRouter, Routes, Route } from "react-router-dom";
import TripList from "./pages/TripList";
import AddTrip from "./pages/AddTrip";
import TripDetail from "./pages/TripDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TripList />} />
        <Route path="/add" element={<AddTrip />} />
        <Route path="/trip/:id" element={<TripDetail />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;