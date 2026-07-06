export type Reservation = {
  id: string;
  dateStr: string;
  name: string;
  email: string;
  group: string;
  activity: string;
  studentsCount: number;
  notes?: string;
  otherTeachers?: string;
  needsTransport: boolean;
  transportDepartureTime?: string;
  transportReturnTime?: string;
  arrivalTime: string;
  status?: "pending" | "confirmed" | "rejected";
  createdAt: number;
};

export type Settings = {
  minDaysNotice: number;
  blockedDays: { dateStr: string; reason: string; id: string; type?: string }[];
  hiddenBaseEvents?: string[];
  adminPassword?: string;
  activeGroups?: string[];
};

const RESERVATIONS_KEY = "reservations_v1";
const SETTINGS_KEY = "settings_v1";

export const store = {
  getReservations: async (): Promise<Reservation[]> => {
    try {
      const res = await fetch('/api/reservations');
      if (!res.ok) return []; // Return empty silently on API errors
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  },

  saveReservation: async (reservation: Reservation): Promise<void> => {
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservation)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Error al guardar reserva");
    }
  },

  addReservation: async (res: Omit<Reservation, "id" | "createdAt">): Promise<Reservation> => {
    const newRes = {
      ...res,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
    };
    await store.saveReservation(newRes);
    return newRes;
  },

  deleteReservation: async (id: string): Promise<void> => {
    await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
  },

  updateReservationStatus: async (id: string, status: "pending" | "confirmed"): Promise<void> => {
    const res = await fetch(`/api/reservations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Error al actualizar estado");
    }
  },

  getSettings: async (): Promise<Settings> => {
    const defaultSettings = { minDaysNotice: 7, blockedDays: [], hiddenBaseEvents: [] };
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) return defaultSettings;
      const data = await res.json();
      // Ensure basic structure exists even on corrupted data
      return { 
        ...data, 
        minDaysNotice: data.minDaysNotice ?? 7, 
        blockedDays: Array.isArray(data.blockedDays) ? data.blockedDays : [],
        hiddenBaseEvents: Array.isArray(data.hiddenBaseEvents) ? data.hiddenBaseEvents : [],
        activeGroups: Array.isArray(data.activeGroups) ? data.activeGroups : undefined
      };
    } catch (e) {
      return defaultSettings;
    }
  },

  saveSettings: async (settings: Settings): Promise<void> => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Error al guardar ajustes");
    }
  }
};
