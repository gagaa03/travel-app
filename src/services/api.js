const API_URL = import.meta.env.VITE_API_URL

export async function fetchTrips() {
    const res = await fetch(`${API_URL}/api/trips`)
    return res.json()
}

export async function createTrip(trip) {
    const res = await fetch(`${API_URL}/api/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        city: trip.city,
        city_display: trip.cityDisplay,
        country: trip.country,
        start_date: trip.startDate,
        end_date: trip.endDate,
        status: trip.status,
        notes: trip.notes,
        budget: trip.budget,
        currency: trip.currency,
        accommodation: trip.accommodation,
        transportation: trip.transportation,
        })
    })
    return res.json()
}


export async function updateTrip(id, trip) {
    const res = await fetch(`${API_URL}/api/trips/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            city: trip.city,
            city_display: trip.cityDisplay,
            country: trip.country,
            start_date: trip.startDate,
            end_date: trip.endDate,
            status: trip.status,
            notes: trip.notes,
            budget: trip.budget,
            currency: trip.currency,
            accommodation: trip.accommodation,
            transportation: trip.transportation,
            checklist: trip.checklist,
            outbound: trip.outbound,
            inbound: trip.inbound,
        })
    })
    return res.json()
}


export async function deleteTrip(id) {
    await fetch(`${API_URL}/api/trips/${id}`, { method: 'DELETE' })
}

export async function fetchTrip(id) {
    const res = await fetch(`${API_URL}/api/trips/${id}`)
    return res.json()
}

// ─── Reservations ───────────────────────────────────────────
export async function fetchReservations(tripId) {
    const res = await fetch(`${API_URL}/api/trips/${tripId}/reservations`)
    return res.json()
}

export async function createReservation(tripId, reservation) {
    const res = await fetch(`${API_URL}/api/trips/${tripId}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: reservation.type,
            name: reservation.name,
            location: reservation.location,
            confirmation_code: reservation.confirmationCode,
            date: reservation.date,
            end_date: reservation.endDate,
            notes: reservation.notes,
        })
    })
    return res.json()
}

export async function updateReservation(tripId, id, reservation) {
    const res = await fetch(`${API_URL}/api/trips/${tripId}/reservations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: reservation.type,
            name: reservation.name,
            location: reservation.location,
            confirmation_code: reservation.confirmationCode,
            date: reservation.date,
            end_date: reservation.endDate,
            notes: reservation.notes,
        })
    })
    return res.json()
}

export async function deleteReservation(tripId, id) {
    await fetch(`${API_URL}/api/trips/${tripId}/reservations/${id}`, { method: 'DELETE' })
}

// ─── Expenses ────────────────────────────────────────────────
export async function fetchExpenses(tripId) {
    const res = await fetch(`${API_URL}/api/trips/${tripId}/expenses`)
    return res.json()
}

export async function createExpense(tripId, expense) {
    const res = await fetch(`${API_URL}/api/trips/${tripId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: expense.name,
            amount: expense.amount,
            category: expense.category,
            date: expense.date,
            notes: expense.notes,
        })
    })
    return res.json()
}

export async function updateExpense(tripId, id, expense) {
    const res = await fetch(`${API_URL}/api/trips/${tripId}/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: expense.name,
            amount: expense.amount,
            category: expense.category,
            date: expense.date,
            notes: expense.notes,
        })
    })
    return res.json()
}

export async function deleteExpense(tripId, id) {
    await fetch(`${API_URL}/api/trips/${tripId}/expenses/${id}`, { method: 'DELETE' })
}

// ─── Itinerary ───────────────────────────────────────────────
export async function fetchItinerary(tripId) {
    const res = await fetch(`${API_URL}/api/trips/${tripId}/itinerary`)
    return res.json()
}

export async function createItineraryItem(tripId, item) {
    const res = await fetch(`${API_URL}/api/trips/${tripId}/itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            day: item.day,
            title: item.title,
            time: item.time,
            notes: item.notes,
            category: item.category || 'other',
            location: item.location || null,
            transport_after: item.transport_after || null,
        })
    })
    return res.json()
}

export async function updateItineraryItem(tripId, id, item) {
    const res = await fetch(`${API_URL}/api/trips/${tripId}/itinerary/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            day: item.day,
            title: item.title,
            time: item.time,
            notes: item.notes,
            category: item.category || 'other',
            location: item.location || null,
            transport_after: item.transport_after || null,
            sort_order: item.sort_order ?? 0,
        })
    })
    return res.json()
}

export async function deleteItineraryItem(tripId, id) {
    await fetch(`${API_URL}/api/trips/${tripId}/itinerary/${id}`, { method: 'DELETE' })
}