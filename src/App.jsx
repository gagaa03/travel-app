import { BrowserRouter, Routes, Route } from "react-router-dom";
import TripList from "./pages/TripList";
import AddTrip from "./pages/AddTrip";
import TripDetail from "./pages/TripDetail";
import EditTrip from "./pages/EditTrip";
import Reservations from './pages/Reservations';
import Expenses from './pages/Expenses';
import Itinerary from './pages/Itinerary';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TripList />} />
        <Route path="/add" element={<AddTrip />} />
        <Route path="/trip/:id" element={<TripDetail />} />
        <Route path="/trip/:id/edit" element={<EditTrip />} />
        <Route path="/trip/:id/reservations" element={<Reservations />}/>
        <Route path="/trip/:id/expenses" element={<Expenses />}/>
        <Route path="/trip/:id/itinerary" element={<Itinerary />}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App;