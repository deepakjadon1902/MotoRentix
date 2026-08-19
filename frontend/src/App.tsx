import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import MainLayout from "@/layouts/MainLayout";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import VehicleDetails from "@/pages/VehicleDetails";
import Booking from "@/pages/Booking";
import BookingStatus from "@/pages/BookingStatus";
import MyBookings from "@/pages/MyBookings";
import Profile from "@/pages/Profile";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Pricing from "@/pages/Pricing";
import OwnerRegister from "@/pages/OwnerRegister";
import TenantDashboard from "@/pages/TenantDashboard";
import TenantLayout from "@/layouts/TenantLayout";
import TenantFleet from "@/pages/tenant/TenantFleet";
import TenantUsers from "@/pages/tenant/TenantUsers";
import TenantBookings from "@/pages/tenant/TenantBookings";
import TenantOrders from "@/pages/tenant/TenantOrders";
import TenantPayments from "@/pages/tenant/TenantPayments";
import TenantSettings from "@/pages/tenant/TenantSettings";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import VerifyResetOtp from "@/pages/VerifyResetOtp";
import Register from "@/pages/Register";
import NotFound from "@/pages/NotFound";
import AuthCallback from "@/pages/AuthCallback";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminVehicles from "@/pages/admin/AdminVehicles";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminBookings from "@/pages/admin/AdminBookings";
import AdminMessages from "@/pages/admin/AdminMessages";
import AdminSubscriptions from "@/pages/admin/AdminSubscriptions";
import AdminClients from "@/pages/admin/AdminClients";
import AdminLayout from "@/layouts/AdminLayout";
import AdminGuard from "@/components/admin/AdminGuard";
import SeoManager from "@/components/SeoManager";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <SeoManager />
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vehicle/:id" element={<VehicleDetails />} />
            <Route path="/booking/:id" element={<Booking />} />
            <Route path="/booking-status/:id" element={<BookingStatus />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/tenant" element={<TenantLayout />}>
              <Route index element={<TenantDashboard />} />
              <Route path="fleet" element={<TenantFleet />} />
              <Route path="users" element={<TenantUsers />} />
              <Route path="bookings" element={<TenantBookings />} />
              <Route path="orders" element={<TenantOrders />} />
              <Route path="payments" element={<TenantPayments />} />
              <Route path="settings" element={<TenantSettings />} />
            </Route>
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-reset-otp" element={<VerifyResetOtp />} />
          <Route path="/register" element={<Register />} />
          <Route path="/owner/register" element={<OwnerRegister />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<AdminGuard />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="vehicles" element={<AdminVehicles />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="clients" element={<AdminClients />} />
              <Route path="subscriptions" element={<AdminSubscriptions />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
