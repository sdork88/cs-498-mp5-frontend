import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import EventGrid from "./components/EventGrid";
import AddEventForm from "./components/AddEventForm";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

// URLs used for backend communication
const FETCH_EVENTS_URL = `${API_BASE}/data`;
const ADD_EVENT_URL = `${API_BASE}/events`;

// --- Fetch all events from backend ---
const fetchEvents = async () => {
  try {
    const response = await fetch(FETCH_EVENTS_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }
    const data = await response.json();
    // Backend wraps results like { data: [...] }
    return data.data || [];
  } catch (err) {
    console.error("Error fetching events:", err);
    throw err;
  }
};

// --- Add a new event to backend ---
const addEvent = async (newEvent) => {
  try {
    const response = await fetch(ADD_EVENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEvent),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to add event: ${errText}`);
    }
    return await response.json();
  } catch (err) {
    console.error("Error adding event:", err);
    throw err;
  }
};

function App() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Use TanStack Query to fetch events
  const {
    data: events = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["events"],
    queryFn: fetchEvents,
  });

  // Use Mutation for adding new events
  const mutation = useMutation({
    mutationFn: addEvent,
    onSuccess: () => {
      // Invalidate cached "events" query to re-fetch updated data
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setShowForm(false);
    },
  });

  // Trigger mutation when form submits
  const handleAddEvent = (newEvent) => {
    mutation.mutate(newEvent);
  };

  return (
    <div className="App">
      <Header />

      <div className="search-plus-bar">
        <SearchBar query={query} setQuery={setQuery} />
        <button className="plus-button" onClick={() => setShowForm(true)}>
          +
        </button>
      </div>

      {isLoading ? (
        <p style={{ textAlign: "center" }}>Loading events...</p>
      ) : error ? (
        <p style={{ textAlign: "center" }}>
          Error loading events: {error.message}
        </p>
      ) : (
        <EventGrid query={query} events={events} />
      )}

      {/* Add-New-Event Popup */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <AddEventForm onAddEvent={handleAddEvent} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;