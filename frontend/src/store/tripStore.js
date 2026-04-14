import { create } from "zustand";

export const useTripStore = create((set) => ({
    selectedStops: [],
    totalDistance: 0,
    etaHours: 0,
    selectedCity: null,

    setTripData: (data) => set(data),

    clearTrip: () =>
        set({
            selectedStops: [],
            totalDistance: 0,
            etaHours: 0,
            selectedCity: null
        })
}));