import { create } from 'zustand';

export interface UserProfile {
  name: string;
  email: string;
  dob: string;
  address: string;
  city: string;
  pincode: string;
  aadhaar: string;
}

export interface Booking {
  id: string;
  vehicleId: string;
  vehicleName: string;
  vehicleImage: string;
  durationType: 'hour' | 'day';
  startDate: string;
  endDate: string;
  totalCharges: number;
  bookingDate: string;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
}

interface AppState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  bookings: Booking[];
  login: (email: string, password: string) => boolean;
  register: (user: UserProfile, password: string) => boolean;
  logout: () => void;
  addBooking: (booking: Booking) => void;
}

const mockUser: UserProfile = {
  name: 'Deepak Jadon',
  email: 'deepakjadon0011@gmail.com',
  dob: '1998-01-15',
  address: '12 Rajpur Road, Civil Lines',
  city: 'Delhi',
  pincode: '110054',
  aadhaar: 'XXXX-XXXX-7890',
};

const mockBookings: Booking[] = [
  {
    id: 'b1',
    vehicleId: 'bike-1',
    vehicleName: 'Shadow Phantom 750',
    vehicleImage: '',
    durationType: 'day',
    startDate: '2026-03-01',
    endDate: '2026-03-03',
    totalCharges: 2400,
    bookingDate: '2026-02-28',
    status: 'Completed',
  },
  {
    id: 'b2',
    vehicleId: 'scooter-2',
    vehicleName: 'Zephyr Sport 125',
    vehicleImage: '',
    durationType: 'hour',
    startDate: '2026-03-08',
    endDate: '2026-03-08',
    totalCharges: 200,
    bookingDate: '2026-03-07',
    status: 'Confirmed',
  },
];

export const useStore = create<AppState>((set) => ({
  isAuthenticated: false,
  user: null,
  bookings: [],
  login: (email: string, _password: string) => {
    if (email) {
      set({ isAuthenticated: true, user: mockUser, bookings: mockBookings });
      return true;
    }
    return false;
  },
  register: (user: UserProfile, _password: string) => {
    set({ isAuthenticated: true, user, bookings: [] });
    return true;
  },
  logout: () => {
    set({ isAuthenticated: false, user: null, bookings: [] });
  },
  addBooking: (booking: Booking) => {
    set((state) => ({ bookings: [...state.bookings, booking] }));
  },
}));
