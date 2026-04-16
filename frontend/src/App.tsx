import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import MainLayout from "@/layouts/MainLayout";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import VehicleDetails from "@/pages/VehicleDetails";
import Booking from "@/pages/Booking";
import MyBookings from "@/pages/MyBookings";
import Profile from "@/pages/Profile";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/NotFound";
import AuthCallback from "@/pages/AuthCallback";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminVehicles from "@/pages/admin/AdminVehicles";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminBookings from "@/pages/admin/AdminBookings";
import AdminMessages from "@/pages/admin/AdminMessages";
import AdminLayout from "@/layouts/AdminLayout";
import AdminGuard from "@/components/admin/AdminGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vehicle/:id" element={<VehicleDetails />} />
            <Route path="/booking/:id" element={<Booking />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<AdminGuard />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="vehicles" element={<AdminVehicles />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="messages" element={<AdminMessages />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
