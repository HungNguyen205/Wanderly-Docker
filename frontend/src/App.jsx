import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "@/pages/client/auth/Login";
import Register from "@/pages/client/auth/Register";
import AdminLogin from "@/pages/admin/auth/AdminLogin";
import AdminProtectedRoute from "@/components/admin/ProtectedRoute";
import HomePage from "@/pages/client/home/HomePage";
import NotFound from "@/pages/client/common/NotFound";
import Settings from "@/pages/client/settings/Settings";
import ServicePage from "@/pages/client/service/ServicePage";
import ServicesPage from "@/pages/client/services/ServicesPage";
import ServiceDetailPage from "@/pages/client/services/ServiceDetailPage";
import OrderPage from "@/pages/client/order/OrderPage";
import CommunityPage from "@/pages/client/community/CommunityPage";
import ProviderPage from "@/pages/client/provider/ProviderPage";
import ProviderRegistration from "@/pages/client/provider/ProviderRegistration";
import ProviderContract from "@/pages/client/provider/ProviderContract";
import CreateService from "@/pages/client/provider/CreateService";
import EditService from "@/pages/client/provider/EditService";
import ServiceAvailabilityPage from "@/pages/client/provider/ServiceAvailabilityPage";
import ProfilePage from "@/pages/client/Profile/ProfilePage";
import ItinerariesList from "@/pages/client/itineraries/ItinerariesList";
import ItineraryDetail from "@/pages/client/itineraries/ItineraryDetail";
import MyBookingsPage from "@/pages/client/bookings/MyBookingsPage";
import BookingDetailPage from "@/pages/client/bookings/BookingDetailPage";
import ProtectedRoute from "@/components/client/ProtectedRoute";
import AdminDashboard from "@/pages/admin/Dashboard/AdminDashboard";
import AdminLocations from "@/pages/admin/Locations/AdminLocations";
import CreateLocation from "@/pages/admin/Locations/CreateLocation";
import EditLocation from "@/pages/admin/Locations/EditLocation";
import DetailLocation from "@/pages/admin/Locations/DetailLocation";
import AdminCategories from "@/pages/admin/Categories/AdminCategories";
import CreateCategory from "@/pages/admin/Categories/CreateCategory";
import EditCategory from "@/pages/admin/Categories/EditCategory";
import DetailCategory from "@/pages/admin/Categories/DetailCategory";
import AdminFeatures from "@/pages/admin/Features/AdminFeatures";
import CreateFeature from "@/pages/admin/Features/CreateFeature";
import EditFeature from "@/pages/admin/Features/EditFeature";
import DetailFeature from "@/pages/admin/Features/DetailFeature";
import AdminBackup from "@/pages/admin/Backup/AdminBackup";

export default function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        theme="colored"
      />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/service" element={<ServicePage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/:id" element={<ServiceDetailPage />} />
        <Route path="/order" element={<OrderPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route
          path="/provider"
          element={
            <ProtectedRoute>
              <ProviderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/provider/register"
          element={
            <ProtectedRoute>
              <ProviderRegistration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/provider/contract"
          element={
            <ProtectedRoute>
              <ProviderContract />
            </ProtectedRoute>
          }
        />
        <Route
          path="/provider/services/create"
          element={
            <ProtectedRoute>
              <CreateService />
            </ProtectedRoute>
          }
        />
        <Route
          path="/provider/services/:id"
          element={
            <ProtectedRoute>
              <EditService />
            </ProtectedRoute>
          }
        />
        <Route
          path="/provider/services/:serviceId/availability"
          element={
            <ProtectedRoute>
              <ServiceAvailabilityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/itineraries"
          element={
            <ProtectedRoute>
              <ItinerariesList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/itineraries/:id"
          element={
            <ProtectedRoute>
              <ItineraryDetail />
            </ProtectedRoute>
          }
        />
        {/* Bookings Routes */}
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/:bookingId"
          element={
            <ProtectedRoute>
              <BookingDetailPage />
            </ProtectedRoute>
          }
        />
        {/* Admin Routes - Protected */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/locations"
          element={
            <AdminProtectedRoute>
              <AdminLocations />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/locations/create"
          element={
            <AdminProtectedRoute>
              <CreateLocation />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/locations/edit/:id"
          element={
            <AdminProtectedRoute>
              <EditLocation />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/locations/detail/:id"
          element={
            <AdminProtectedRoute>
              <DetailLocation />
            </AdminProtectedRoute>
          }
        />
        {/* Admin Routes - Categories */}
        <Route
          path="/admin/categories"
          element={
            <AdminProtectedRoute>
              <AdminCategories />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/categories/create"
          element={
            <AdminProtectedRoute>
              <CreateCategory />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/categories/edit/:id"
          element={
            <AdminProtectedRoute>
              <EditCategory />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/categories/detail/:id"
          element={
            <AdminProtectedRoute>
              <DetailCategory />
            </AdminProtectedRoute>
          }
        />
        {/* Admin Routes - Features */}
        <Route
          path="/admin/features"
          element={
            <AdminProtectedRoute>
              <AdminFeatures />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/features/create"
          element={
            <AdminProtectedRoute>
              <CreateFeature />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/features/edit/:id"
          element={
            <AdminProtectedRoute>
              <EditFeature />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/features/detail/:id"
          element={
            <AdminProtectedRoute>
              <DetailFeature />
            </AdminProtectedRoute>
          }
        />
        {/* Admin Routes - Backup */}
        <Route
          path="/admin/backup"
          element={
            <AdminProtectedRoute>
              <AdminBackup />
            </AdminProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>

  );
}