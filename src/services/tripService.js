import { defaultTrips } from "../data";

const STORAGE_KEY = 'travel-app-trips';

export function getTrips() {
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (stored) {
        return JSON.parse(stored);
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTrips));
    return defaultTrips;
}

export function saveTrips(trips) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

export function addTrip(trip) {
    const trips = getTrips();
    const newTrip = { ...trip, id: Date.now(), createdAt: new Date().toISOString().split('T')[0] };
    const updated = [...trips, newTrip];
    saveTrips(updated);
    return updated;
}

export function deleteTrip(id) {
    const trips = getTrips();
    const updated = trips.filter(trip => trip.id !== id);
    saveTrips(updated);
    return updated;
}

export function updateTripStatus(id, status) {
    const trips = getTrips();
    const updated = trips.map(trip => 
        trip.id === id ? { ...trip, status } : trip
    )
    saveTrips(updated);
    return updated;
}

export function updateTrip(id, updatedData) {
    const trips = getTrips();
    const updated = trips.map(trip =>
        trip.id === id ? { ...trip, ...updatedData } : trip
    )
    saveTrips(updated);
    return updated;
}


export function addChecklistItem(tripId, item) {
    const trips = getTrips();
    const trip = trips.find(t => t.id === tripId);
    const checklist = trip.checklist || [];
    const newChecklist = { id: Date.now(), done: false, ...item };
    const updated = trips.map(trip => 
        trip.id === tripId ? { ...trip, checklist: [...checklist, newChecklist]} : trip
    );

    saveTrips(updated);
    return updated;
}

export function deleteChecklistItem(tripId, itemId) {
    const trips = getTrips();
    const trip = trips.find(t => t.id === tripId);
    const newChecklist = trip.checklist.filter(trip => trip.id !== itemId);
    const updated = trips.map(trip => 
        trip.id === tripId ? { ...trip, checklist: newChecklist } : trip
    );

    saveTrips(updated);
    return updated;
}

export function toggleChecklist(tripId, itemId) {
    const trips = getTrips();

    const updated = trips.map(trip =>
        trip.id === tripId ? {...trip, checklist: trip.checklist.map(item => item.id === itemId ? { ...item, done: !item.done } : item)} : trip
    );

    saveTrips(updated);
    return updated;
}


export function updateChecklistItem(tripId, itemId, updatedData) {
    const trips = getTrips();
    const updated = trips.map(trip =>
        trip.id === tripId ? {
            ...trip,
            checklist: trip.checklist.map(item => item.id === itemId ? { ...item, ...updatedData } : item)
        } : trip
    );
    saveTrips(updated);
    return updated;
}

export function updateReservation(tripId, reservationId, updatedData) {
    const trips = getTrips();
    const updated = trips.map(trip =>
        trip.id === tripId ? {
            ...trip,
            reservations: trip.reservations.map(r => r.id === reservationId ? { ...r, ...updatedData } : r)
        } : trip
    );
    saveTrips(updated);
    return updated;
}

export function addReservation(tripId, reservation) {
    const trips = getTrips();
    const newReservation = {...reservation, id: Date.now()};
    const updated = trips.map(trip => (
        trip.id === tripId ? {...trip, reservations : [...(trip.reservations || []), newReservation]} : trip
    ));

    saveTrips(updated);
    return updated;
}

export function deleteReservation(tripId, reservationId) {
    const trips = getTrips();
    const trip = trips.find(t => t.id === tripId);
    const newReservation = trip.reservations.filter(trip => trip.id !== reservationId);
    const updated = trips.map(trip => 
        trip.id === tripId ? { ...trip, reservations: newReservation} : trip
    );

    saveTrips(updated);
    return updated;

}

export function addExpense(tripId, expense) {
    const trips = getTrips();
    const newExpense = { ...expense, id: Date.now() };
    const updated = trips.map(trip =>
        trip.id === tripId ? { ...trip, expenses: [...(trip.expenses || []), newExpense] } : trip
    );
    saveTrips(updated);
    return updated;
}

export function deleteExpense(tripId, expenseId) {
    const trips = getTrips();
    const updated = trips.map(trip =>
        trip.id === tripId ? { ...trip, expenses: trip.expenses.filter(e => e.id !== expenseId) } : trip
    );
    saveTrips(updated);
    return updated;
}

export function updateExpense(tripId, expenseId, updatedData) {
    const trips = getTrips();
    const updated = trips.map(trip =>
        trip.id === tripId ? {
            ...trip,
            expenses: trip.expenses.map(e => e.id === expenseId ? { ...e, ...updatedData } : e)
        } : trip
    );
    saveTrips(updated);
    return updated;
}


export function addItineraryItem(tripId, day, item) {
    const trips = getTrips();
    const trip = trips.find(t => t.id === tripId);
    const newItineraryItem = { ...item, id: Date.now()};
    const itinerary = trip.itinerary || {}; 
    const dayItems = itinerary[day] || [];

    const updated = trips.map(trip =>
        trip.id === tripId ? { ...trip, itinerary: { ...itinerary, [day]: [...dayItems, newItineraryItem]} } : trip
    )
    saveTrips(updated);
    return updated;
}

export function deleteItineraryItem(tripId, day, itemId) {
    const trips = getTrips();
    const trip = trips.find(t => t.id === tripId);
    const itinerary = trip.itinerary || {}; 

    const updated = trips.map(trip =>
        trip.id === tripId ? { ...trip, itinerary: {...itinerary, [day]: itinerary[day].filter(e => e.id !== itemId)}} : trip
    )
    saveTrips(updated);
    return updated;
}


export function updateItineraryItem(tripId, day, itemId, updatedData) {
    const trips = getTrips();
    const trip = trips.find(t => t.id === tripId);
    const itinerary = trip.itinerary || {}; 

    const updated = trips.map(trip =>
        trip.id === tripId ? {
            ...trip,
            itinerary: {...itinerary, [day]: itinerary[day].map(e => e.id === itemId ? { ...e, ...updatedData } : e)}
        } : trip
    );

    saveTrips(updated);
    return updated;
}
