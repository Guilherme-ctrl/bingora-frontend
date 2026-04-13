import { AuthProvider } from '@/contexts/AuthProvider';
import { AppShell } from '@/layout/AppShell';
import { EventIndexRoute } from '@/routes/EventIndexRoute';
import { NonSellerRoute } from '@/routes/NonSellerRoute';
import { EventWorkspaceRoute } from '@/routes/EventWorkspaceRoute';
import { CreateEventPage } from '@/pages/CreateEventPage';
import { EventsDashboardPage } from '@/pages/EventsDashboardPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { EventCardsPage } from '@/pages/event/EventCardsPage';
import { EventFinancePage } from '@/pages/event/EventFinancePage';
import { EventDrawPage } from '@/pages/event/EventDrawPage';
import { EventEditPage } from '@/pages/event/EventEditPage';
import { EventParticipantsPage } from '@/pages/event/EventParticipantsPage';
import { EventPrizesPage } from '@/pages/event/EventPrizesPage';
import { EventRoundPage } from '@/pages/event/EventRoundPage';
import { EventSaleDetailPage } from '@/pages/event/EventSaleDetailPage';
import { EventSaleNewPage } from '@/pages/event/EventSaleNewPage';
import { EventSalesPage } from '@/pages/event/EventSalesPage';
import { EventSellerDeskPage } from '@/pages/event/EventSellerDeskPage';
import { EventSellersManagePage } from '@/pages/event/EventSellersManagePage';
import { EventWinnersPage } from '@/pages/event/EventWinnersPage';
import { HomeRoute } from '@/routes/HomeRoute';
import { RequireAuth } from '@/routes/RequireAuth';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/" element={<HomeRoute />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route path="events" element={<EventsDashboardPage />} />
              <Route
                path="events/new"
                element={
                  <NonSellerRoute>
                    <CreateEventPage />
                  </NonSellerRoute>
                }
              />
              <Route path="events/:eventId" element={<EventWorkspaceRoute />}>
                <Route index element={<EventIndexRoute />} />
                <Route path="vender" element={<EventSellerDeskPage />} />
                <Route
                  path="vendedores"
                  element={
                    <NonSellerRoute>
                      <EventSellersManagePage />
                    </NonSellerRoute>
                  }
                />
                <Route
                  path="edit"
                  element={
                    <NonSellerRoute>
                      <EventEditPage />
                    </NonSellerRoute>
                  }
                />
                <Route
                  path="rodada"
                  element={
                    <NonSellerRoute>
                      <EventRoundPage />
                    </NonSellerRoute>
                  }
                />
                <Route
                  path="prizes"
                  element={
                    <NonSellerRoute>
                      <EventPrizesPage />
                    </NonSellerRoute>
                  }
                />
                <Route
                  path="cards"
                  element={
                    <NonSellerRoute>
                      <EventCardsPage />
                    </NonSellerRoute>
                  }
                />
                <Route path="participants" element={<EventParticipantsPage />} />
                <Route path="sales" element={<EventSalesPage />} />
                <Route path="sales/new" element={<EventSaleNewPage />} />
                <Route path="sales/:saleId" element={<EventSaleDetailPage />} />
                <Route
                  path="finance"
                  element={
                    <NonSellerRoute>
                      <EventFinancePage />
                    </NonSellerRoute>
                  }
                />
                <Route
                  path="draw"
                  element={
                    <NonSellerRoute>
                      <EventDrawPage />
                    </NonSellerRoute>
                  }
                />
                <Route
                  path="winners"
                  element={
                    <NonSellerRoute>
                      <EventWinnersPage />
                    </NonSellerRoute>
                  }
                />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
